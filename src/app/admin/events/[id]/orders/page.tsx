'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface OrderItem { ticket_name: string; quantity: number; unit_price: number; }
interface Order {
  id: string; email: string; status: string; total_amount: number;
  currency: string; created_at: string; paid_at: string;
  items: OrderItem[]; attendee_count: number; checked_in_count: number;
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  paid:      { bg: 'rgba(92,184,138,0.12)', color: 'var(--green)' },
  pending:   { bg: 'rgba(232,168,74,0.12)', color: 'var(--amber)' },
  cancelled: { bg: 'rgba(224,92,92,0.12)',  color: 'var(--red)' },
  refunded:  { bg: 'rgba(139,139,154,0.12)', color: 'var(--text-muted)' },
};

export default function EventOrdersPage() {
  const { id } = useParams<{ id: string }>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState('paid');
  const [resending, setResending] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<Record<string, 'sent' | 'error'>>({});

  useEffect(() => {
    fetch(`/api/admin/events/${id}/orders`).then(r => r.json()).then(setOrders);
  }, [id]);

  const filtered = orders.filter(o => filter === 'all' || o.status === filter);

  const handleResend = async (orderId: string) => {
    setResending(orderId);
    try {
      const res = await fetch('/api/admin/resend-confirmation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order_id: orderId }) });
      setResendStatus(s => ({ ...s, [orderId]: res.ok ? 'sent' : 'error' }));
    } catch { setResendStatus(s => ({ ...s, [orderId]: 'error' })); }
    finally {
      setResending(null);
      setTimeout(() => setResendStatus(s => { const n = { ...s }; delete n[orderId]; return n; }), 3000);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Link href="/admin/events" style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none' }}>← Events</Link>
        <span style={{ color: 'var(--border-muted)' }}>/</span>
        <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: '24px', fontWeight: 600, color: 'var(--text)' }}>Orders</h1>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        {['paid', 'all', 'pending', 'cancelled'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '7px 14px', borderRadius: '999px', fontSize: '12px',
            fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
            border: '1px solid',
            background: filter === f ? 'linear-gradient(135deg, #c9a85c, #e8d5a0)' : 'transparent',
            borderColor: filter === f ? 'transparent' : 'var(--border-muted)',
            color: filter === f ? '#09090f' : 'var(--text-muted)', cursor: 'pointer',
          }}>
            {f}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-dim)' }}>{filtered.length} orders</span>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border-muted)', borderRadius: '14px', overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: '22px', color: 'var(--text-muted)' }}>No orders</p>
          </div>
        ) : filtered.map(order => {
          const ss = STATUS_STYLE[order.status] || STATUS_STYLE.pending;
          return (
            <div key={order.id} style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-dim)' }}>#{order.id.slice(0, 8).toUpperCase()}</span>
                  <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '2px 8px', borderRadius: '999px', background: ss.bg, color: ss.color }}>{order.status}</span>
                </div>
                <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)', marginBottom: '2px' }}>{order.email}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {order.items?.map(i => `${i.ticket_name} ×${i.quantity}`).join(', ')}
                </p>
                <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                  {new Date(order.created_at).toLocaleString('en-GB')}
                </p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: '20px', fontWeight: 600, color: 'var(--gold)', marginBottom: '4px' }}>
                  €{Number(order.total_amount).toFixed(0)}
                </p>
                <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '8px' }}>
                  {order.checked_in_count}/{order.attendee_count} checked in
                </p>
                {order.status === 'paid' && (
                  <button onClick={() => handleResend(order.id)} disabled={resending === order.id} style={{
                    fontSize: '11px', padding: '5px 10px', borderRadius: '7px',
                    background: resendStatus[order.id] === 'sent' ? 'rgba(92,184,138,0.12)' : resendStatus[order.id] === 'error' ? 'rgba(224,92,92,0.12)' : 'var(--surface-2)',
                    color: resendStatus[order.id] === 'sent' ? 'var(--green)' : resendStatus[order.id] === 'error' ? 'var(--red)' : 'var(--text-muted)',
                    border: '1px solid var(--border-muted)', cursor: 'pointer', whiteSpace: 'nowrap',
                  }}>
                    {resending === order.id ? '…' : resendStatus[order.id] === 'sent' ? '✓ Sent' : resendStatus[order.id] === 'error' ? '✗ Failed' : '✉ Resend'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
