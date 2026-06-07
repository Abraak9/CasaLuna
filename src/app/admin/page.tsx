import Link from 'next/link';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

export default async function AdminDashboard() {
  await auth();

  const stats = await query<{ total_events: string; total_revenue: string; total_tickets: string; total_orders: string }>(`
    SELECT
      COUNT(DISTINCT e.id) AS total_events,
      COALESCE(SUM(o.total_amount) FILTER (WHERE o.status = 'paid'), 0) AS total_revenue,
      COALESCE(SUM(tt.stock_sold), 0) AS total_tickets,
      COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'paid') AS total_orders
    FROM events e
    LEFT JOIN ticket_types tt ON tt.event_id = e.id
    LEFT JOIN orders o ON o.event_id = e.id
  `);

  const s = stats[0] || { total_events: '0', total_revenue: '0', total_tickets: '0', total_orders: '0' };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link href="/admin/events/new" className="cl-gradient text-white font-semibold px-4 py-2 rounded-xl text-sm">
          + New Event
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Events', value: s.total_events },
          { label: 'Tickets Sold', value: s.total_tickets },
          { label: 'Orders', value: s.total_orders },
          { label: 'Revenue', value: `€${Number(s.total_revenue).toFixed(0)}` },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl p-4 border border-gray-100">
            <p className="text-gray-500 text-xs">{stat.label}</p>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center text-gray-400">
        <Link href="/admin/events" className="text-pink-500 font-medium">View all events →</Link>
      </div>
    </div>
  );
}
