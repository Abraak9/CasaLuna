import Link from 'next/link';
import { query } from '@/lib/db';
import { auth } from '@/lib/auth';

interface EventRow {
  id: string;
  slug: string;
  name_es: string;
  name_en: string;
  date: string;
  status: string;
  tickets_sold: number;
  tickets_total: number;
  revenue: number;
}

export default async function AdminEventsPage() {
  await auth();
  const events = await query<EventRow>(`
    SELECT e.id, e.slug, e.name_es, e.name_en, e.date, e.status,
      COALESCE(SUM(tt.stock_sold), 0) AS tickets_sold,
      COALESCE(SUM(tt.stock_total), 0) AS tickets_total,
      COALESCE(SUM(o.total_amount) FILTER (WHERE o.status = 'paid'), 0) AS revenue
    FROM events e
    LEFT JOIN ticket_types tt ON tt.event_id = e.id
    LEFT JOIN orders o ON o.event_id = e.id
    GROUP BY e.id ORDER BY e.date DESC
  `);

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    published: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-600',
    past: 'bg-purple-100 text-purple-700',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Events</h1>
        <Link href="/admin/events/new" className="cl-gradient text-white font-semibold px-4 py-2 rounded-xl text-sm">
          + New Event
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
          <p className="text-4xl mb-3">🎭</p>
          <p className="font-medium">No events yet</p>
          <Link href="/admin/events/new" className="text-pink-500 text-sm mt-2 block">Create your first event →</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map(event => (
            <div key={event.id} className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-semibold">{event.name_en || event.name_es}</h2>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[event.status] || 'bg-gray-100'}`}>
                      {event.status}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm">
                    {new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <div className="flex gap-4 mt-2 text-sm text-gray-500">
                    <span>{event.tickets_sold}/{event.tickets_total} tickets</span>
                    <span>€{Number(event.revenue).toFixed(0)} revenue</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 ml-4 text-sm">
                  <Link href={`/admin/events/${event.id}/edit`} className="text-blue-500 hover:underline">Edit</Link>
                  <Link href={`/admin/events/${event.id}/tickets`} className="text-purple-500 hover:underline">Tickets</Link>
                  <Link href={`/admin/events/${event.id}/orders`} className="text-gray-500 hover:underline">Orders</Link>
                  <Link href={`/admin/events/${event.id}/checkin`} className="text-green-600 hover:underline">Check-in</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
