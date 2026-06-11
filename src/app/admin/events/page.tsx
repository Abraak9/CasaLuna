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
  orders_paid: number;
  revenue: number;
}

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  draft:     { bg: 'rgba(139,139,154,0.15)', color: 'var(--text-muted)' },
  published: { bg: 'rgba(92,184,138,0.12)', color: 'var(--green)' },
  cancelled: { bg: 'rgba(224,92,92,0.12)', color: 'var(--red)' },
  past:      { bg: 'rgba(201,168,92,0.08)', color: 'var(--gold)' },
};

export default async function AdminEventsPage() {
  await auth();
  const events = await query<EventRow>(`
    SELECT
      e.id, e.slug, e.name_es, e.name_en, e.date, e.status,
      COALESCE(SUM(tt.stock_total), 0) AS tickets_total,
      COUNT(DISTINCT a.id) FILTER (WHERE o.status = 'paid') AS tickets_sold,
      COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'paid') AS orders_paid,
      COALESCE(SUM(o.total_amount) FILTER (WHERE o.status = 'paid'), 0) AS revenue
    FROM events e
    LEFT JOIN ticket_types tt ON tt.event_id = e.id
    LEFT JOIN orders o ON o.event_id = e.id
    LEFT JOIN attendees a ON a.order_id = o.id
    GROUP BY e.id ORDER BY e.date DESC
  `);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: '28px', fontWeight: 600, color: 'var(--text)' }}>
          Events
        </h1>
        <Link href="/admin/events/new" style={{
          background: 'linear-gradient(135deg, #c9a85c, #e8d5a0)',
          color: '#09090f', fontWeight: 700, fontSize: '13px',
          letterSpacing: '0.06em', textTransform: 'uppercase',
          padding: '10px 18px', borderRadius: '10px', textDecoration: 'none',
        }}>
          + New Event
        </Link>
      </div>

      {events.length === 0 ? (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border-muted)',
          borderRadius: '14px', padding: '64px 24px', textAlign: 'center',
        }}>
          <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: '28px', color: 'var(--text-muted)', marginBottom: '8px' }}>
            No events yet
          </p>
          <Link href="/admin/events/new" style={{ color: 'var(--gold)', fontSize: '14px', textDecoration: 'none' }}>
            Create your first event →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {events.map(event => {
            const style = STATUS_STYLES[event.status] || STATUS_STYLES.draft;
            return (
              <div key={event.id} style={{
                background: 'var(--surface)', border: '1px solid var(--border-muted)',
                borderRadius: '12px', padding: '18px 20px',
                display: 'flex', alignItems: 'center', gap: '16px',
              }}>
                {/* Date */}
                <div style={{ textAlign: 'center', minWidth: '48px' }}>
                  <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: '28px', fontWeight: 500, color: 'var(--gold)', lineHeight: 1 }}>
                    {new Date(event.date).getDate()}
                  </p>
                  <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
                    {new Date(event.date).toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()}
                  </p>
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                    <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>
                      {event.name_en || event.name_es}
                    </h2>
                    <span style={{
                      fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em',
                      textTransform: 'uppercase', padding: '3px 8px', borderRadius: '999px',
                      background: style.bg, color: style.color,
                    }}>
                      {event.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{Number(event.tickets_sold)} / {Number(event.tickets_total)} sold</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{Number(event.orders_paid)} orders</span>
                    <span style={{ fontSize: '12px', color: 'var(--gold)' }}>€{Number(event.revenue).toFixed(0)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                  {[
                    { href: `/admin/events/${event.id}/edit`, label: 'Edit', color: 'var(--text-muted)' },
                    { href: `/admin/events/${event.id}/tickets`, label: 'Tickets', color: 'var(--gold)' },
                    { href: `/admin/events/${event.id}/orders`, label: 'Orders', color: 'var(--text-muted)' },
                    { href: `/admin/events/${event.id}/checkin`, label: 'Scan', color: 'var(--green)' },
                  ].map(action => (
                    <Link key={action.href} href={action.href} style={{
                      fontSize: '12px', color: action.color,
                      padding: '6px 10px', borderRadius: '7px',
                      background: 'var(--surface-2)', textDecoration: 'none',
                      border: '1px solid var(--border-muted)',
                      whiteSpace: 'nowrap',
                    }}>
                      {action.label}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
