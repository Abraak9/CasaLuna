import Link from 'next/link';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

export default async function AdminDashboard() {
  await auth();

  const statsRes = await query<{
    total_events: string; published_events: string;
    total_revenue: string; total_orders: string; total_attendees: string;
  }>(`
    SELECT
      COUNT(DISTINCT e.id) AS total_events,
      COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'published') AS published_events,
      COALESCE(SUM(o.total_amount) FILTER (WHERE o.status = 'paid'), 0) AS total_revenue,
      COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'paid') AS total_orders,
      COUNT(DISTINCT a.id) FILTER (WHERE o.status = 'paid') AS total_attendees
    FROM events e
    LEFT JOIN orders o ON o.event_id = e.id
    LEFT JOIN attendees a ON a.order_id = o.id
  `);

  const s = statsRes[0] || { total_events: '0', published_events: '0', total_revenue: '0', total_orders: '0', total_attendees: '0' };

  const recentOrders = await query<{
    id: string; email: string; total_amount: number; currency: string;
    status: string; created_at: string; event_name: string;
  }>(`
    SELECT o.id, o.email, o.total_amount, o.currency, o.status, o.created_at,
           e.name_en AS event_name
    FROM orders o
    JOIN events e ON e.id = o.event_id
    WHERE o.status = 'paid'
    ORDER BY o.created_at DESC
    LIMIT 8
  `);

  const upcomingEvents = await query<{
    id: string; name_en: string; date: string; status: string;
    tickets_sold: string; tickets_total: string;
  }>(`
    SELECT e.id, e.name_en, e.date, e.status,
      COUNT(DISTINCT a.id) FILTER (WHERE o.status = 'paid') AS tickets_sold,
      COALESCE(SUM(tt.stock_total), 0) AS tickets_total
    FROM events e
    LEFT JOIN ticket_types tt ON tt.event_id = e.id
    LEFT JOIN orders o ON o.event_id = e.id
    LEFT JOIN attendees a ON a.order_id = o.id
    WHERE e.status = 'published' AND e.date > NOW()
    GROUP BY e.id
    ORDER BY e.date ASC
    LIMIT 5
  `);

  const stats = [
    { label: 'Total Revenue', value: `€${Number(s.total_revenue).toLocaleString('en', { minimumFractionDigits: 0 })}`, icon: '◈', accent: true },
    { label: 'Paid Orders', value: s.total_orders, icon: '▣', accent: false },
    { label: 'Attendees', value: s.total_attendees, icon: '◉', accent: false },
    { label: 'Live Events', value: s.published_events, icon: '◎', accent: false },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: '32px', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>
            Dashboard
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Welcome back, Abraak
          </p>
        </div>
        <Link href="/admin/events/new" style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'linear-gradient(135deg, #c9a85c, #e8d5a0)',
          color: '#09090f', fontWeight: 700, fontSize: '13px',
          letterSpacing: '0.06em', textTransform: 'uppercase',
          padding: '10px 18px', borderRadius: '10px', textDecoration: 'none',
        }}>
          + New Event
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '32px' }}>
        {stats.map(stat => (
          <div key={stat.label} style={{
            background: 'var(--surface)', border: `1px solid ${stat.accent ? 'var(--border)' : 'var(--border-muted)'}`,
            borderRadius: '14px', padding: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{ color: stat.accent ? 'var(--gold)' : 'var(--text-muted)', fontSize: '14px' }}>{stat.icon}</span>
              <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                {stat.label}
              </p>
            </div>
            <p style={{ fontSize: '28px', fontWeight: 700, color: stat.accent ? 'var(--gold)' : 'var(--text)', fontFamily: 'var(--font-cormorant)', lineHeight: 1 }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Upcoming events */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border-muted)', borderRadius: '14px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Live Events
            </p>
            <Link href="/admin/events" style={{ fontSize: '12px', color: 'var(--gold)', textDecoration: 'none' }}>View all →</Link>
          </div>
          {upcomingEvents.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-dim)' }}>No published events</p>
              <Link href="/admin/events/new" style={{ fontSize: '13px', color: 'var(--gold)', textDecoration: 'none', marginTop: '8px', display: 'block' }}>
                Create one →
              </Link>
            </div>
          ) : (
            upcomingEvents.map(ev => (
              <div key={ev.id} style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)', marginBottom: '2px' }}>{ev.name_en}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {new Date(ev.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '14px', color: 'var(--gold)', fontWeight: 600 }}>{ev.tickets_sold}</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-dim)' }}>/ {ev.tickets_total} sold</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Recent orders */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border-muted)', borderRadius: '14px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Recent Orders
            </p>
            <Link href="/admin/sales/orders" style={{ fontSize: '12px', color: 'var(--gold)', textDecoration: 'none' }}>View all →</Link>
          </div>
          {recentOrders.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-dim)' }}>No orders yet</p>
            </div>
          ) : (
            recentOrders.map(order => (
              <div key={order.id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 500 }}>{order.email.split('@')[0]}@…</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{order.event_name}</p>
                </div>
                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gold)' }}>
                  €{Number(order.total_amount).toFixed(0)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
