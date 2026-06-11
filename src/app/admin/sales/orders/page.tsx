'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Order {
  id: string;
  email: string;
  status: string;
  total_amount: number;
  currency: string;
  created_at: string;
  event_name: string;
  event_id: string;
  attendee_count: number;
  checked_in_count: number;
  items: Array<{ ticket_name: string; quantity: number }>;
  channel: string;
  payment_method: string;
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  paid:      { bg: 'rgba(92,184,138,0.12)',  color: 'var(--green)' },
  pending:   { bg: 'rgba(232,168,74,0.12)',  color: 'var(--amber)' },
  cancelled: { bg: 'rgba(224,92,92,0.12)',   color: 'var(--red)' },
  refunded:  { bg: 'rgba(139,139,154,0.12)', color: 'var(--text-muted)' },
  expired:   { bg: 'rgba(100,100,120,0.12)', color: 'var(--text-dim)' },
};

export default function SalesOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState('paid');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<Record<string, 'sent' | 'error'>>({});
  const [expiring, setExpiring] = useState(false);
  const [expireMsg, setExpireMsg] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ status: filter, limit: '200' });
    if (search) params.set('search', search);
    fetch(`/api/admin/sales?${params}`)
      .then(r => r.json())
      .then(d => { setOrders(d); setLoading(false); });
  }, [filter, search]);

  const handleResend = async (orderId: string) => {
    setResending(orderId);
    try {
      const res = await fetch('/api/admin/resend-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId }),
      });
      setResendStatus(s => ({ ...s, [orderId]: res.ok ? 'sent' : 'error' }));
    } catch {
      setResendStatus(s => ({ ...s, [orderId]: 'error' }));
    } finally {
      setResending(null);
      setTimeout(() => setResendStatus(s => { const n = { ...s }; delete n[orderId]; return n; }), 3000);
    }
  };

  const totalRevenue = orders.reduce((s, o) => o.status === 'paid' ? s + Number(o.total_amount) : s, 0);

  const handleExpire = async () => {
    setExpiring(true); setExpireMsg('');
    try {
      const res = await fetch('/api/admin/orders/expire', { method: 'POST' });
      const d = await res.json();
      if (!res.ok) { setExpireMsg('Error: ' + (d.error || res.status)); return; }
      setExpireMsg(d.expired > 0 ? `${d.expired} order${d.expired > 1 ? 's' : ''} marked expired` : 'Nothing to expire');
      // Refresh list
      const params = new URLSearchParams({ status: filter, limit: '200' });
      if (search) params.set('search', search);
      fetch(`/api/admin/sales?${params}`).then(r => r.json()).then(setOrders);
      setTimeout(() => setExpireMsg(''), 4000);
    } catch (e) {
      setExpireMsg('Request failed');
    } finally {
      setExpiring(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: '28px', fontWeight: 600, color: 'var(--text)' }}>Orders</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            All orders across all events
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: '22px', color: 'var(--gold)' }}>
            €{totalRevenue.toLocaleString('en', { minimumFractionDigits: 0 })}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>total</span>
          <button onClick={handleExpire} disabled={expiring} style={{
            fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
            padding: '7px 14px', borderRadius: '8px', border: '1px solid var(--border-muted)',
            background: 'var(--surface-2)', color: 'var(--text-muted)', cursor: expiring ? 'not-allowed' : 'pointer',
          }}>
            {expiring ? 'Running…' : '⏱ Expire old'}
          </button>
          {expireMsg && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{expireMsg}</span>}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {['paid', 'all', 'pending', 'expired', 'cancelled'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '7px 14px', borderRadius: '999px', fontSize: '12px',
            fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
            border: '1px solid',
            background: filter === f ? 'linear-gradient(135deg, #c9a85c, #e8d5a0)' : 'transparent',
            borderColor: filter === f ? 'transparent' : 'var(--border-muted)',
            color: filter === f ? '#09090f' : 'var(--text-muted)',
            cursor: 'pointer',
          }}>
            {f}
          </button>
        ))}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search email or ID…"
          style={{
            background: 'var(--surface)', border: '1px solid var(--border-muted)',
            color: 'var(--text)', borderRadius: '999px', padding: '7px 16px',
            fontSize: '12px', outline: 'none', marginLeft: 'auto', minWidth: '200px',
          }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading…</div>
      ) : orders.length === 0 ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border-muted)', borderRadius: '14px', padding: '48px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: '22px', color: 'var(--text-muted)' }}>No orders found</p>
        </div>
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border-muted)', borderRadius: '14px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Order', 'Email', 'Event', 'Tickets', 'Amount', 'Status', 'Date', ''].map(h => (
                  <th key={h} style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-dim)', padding: '12px 14px', textAlign: 'left', borderBottom: '1px solid var(--border-muted)', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map(o => {
                const ss = STATUS_STYLE[o.status] || STATUS_STYLE.pending;
                return (
                  <tr key={o.id} style={{ transition: 'background 0.1s' }}>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-muted)', fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-muted)' }}>
                      #{o.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-muted)', fontSize: '13px', color: 'var(--text)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {o.email}
                    </td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-muted)', fontSize: '13px', color: 'var(--text-muted)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <Link href={`/admin/events/${o.event_id}/orders`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {o.event_name}
                      </Link>
                    </td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-muted)', fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {o.checked_in_count}/{o.attendee_count} scanned
                    </td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-muted)', fontSize: '14px', fontWeight: 700, color: 'var(--gold)', whiteSpace: 'nowrap' }}>
                      €{Number(o.total_amount).toFixed(0)}
                    </td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-muted)' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: '999px', background: ss.bg, color: ss.color }}>
                        {o.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-muted)', fontSize: '12px', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                      {new Date(o.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-muted)' }}>
                      {o.status === 'paid' && (
                        <button
                          onClick={() => handleResend(o.id)}
                          disabled={resending === o.id}
                          style={{
                            fontSize: '11px', padding: '5px 10px', borderRadius: '7px',
                            background: resendStatus[o.id] === 'sent' ? 'rgba(92,184,138,0.12)' : resendStatus[o.id] === 'error' ? 'rgba(224,92,92,0.12)' : 'var(--surface-2)',
                            color: resendStatus[o.id] === 'sent' ? 'var(--green)' : resendStatus[o.id] === 'error' ? 'var(--red)' : 'var(--text-muted)',
                            border: '1px solid var(--border-muted)', cursor: 'pointer', whiteSpace: 'nowrap',
                          }}
                        >
                          {resending === o.id ? '…' : resendStatus[o.id] === 'sent' ? '✓ Sent' : resendStatus[o.id] === 'error' ? '✗ Failed' : '✉ Resend'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
