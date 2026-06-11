'use client';

import { useState } from 'react';
import Link from 'next/link';

interface AttendeeTicket {
  ticket_name: string;
  first_name: string;
  last_name: string;
  qr_code: string;
  checked_in: boolean;
}

interface Order {
  id: string;
  event_name: string;
  event_date: string;
  event_location: string;
  event_slug: string;
  total_amount: number;
  currency: string;
  paid_at: string;
  created_at: string;
  items: AttendeeTicket[] | null;
  attendee_count: number;
}

const inputStyle: React.CSSProperties = {
  background: 'var(--surface-2)',
  border: '1px solid var(--border-muted)',
  color: 'var(--text)',
  borderRadius: '10px',
  padding: '12px 16px',
  fontSize: '15px',
  width: '100%',
  outline: 'none',
  letterSpacing: '0.02em',
};

export default function MyTicketsPage() {
  const [step, setStep] = useState<'email' | 'code' | 'orders'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const handleSendCode = async () => {
    if (!email) { setError('Please enter your email address'); return; }
    setLoading(true);
    setError('');
    try {
      await fetch('/api/auth/magic-link/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setStep('code');
    } catch {
      setError('Failed to send code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code || code.length !== 6) { setError('Enter the 6-digit code from your email'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/magic-link/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOrders(data.orders || []);
      setStep('orders');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', padding: '0' }}>

      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(9,9,15,0.85)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-muted)',
        padding: '0 24px', height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: '20px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }} className="cl-gold-text">
            Casa Luna
          </span>
        </Link>
        <Link href="/" style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none' }}>
          ← Events
        </Link>
      </nav>

      <div style={{ maxWidth: '520px', margin: '0 auto', padding: '60px 20px' }}>

        {/* Glow */}
        <div style={{
          position: 'fixed', top: '40%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '400px', height: '400px',
          background: 'radial-gradient(ellipse, rgba(201,168,92,0.05) 0%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0,
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h1 style={{
              fontFamily: 'var(--font-cormorant)',
              fontSize: '44px', fontWeight: 600, letterSpacing: '-0.01em',
              color: 'var(--text)', marginBottom: '8px',
            }}>
              My Tickets
            </h1>
            <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              {step === 'orders'
                ? `Showing orders for ${email}`
                : 'Enter your email to access your tickets'}
            </p>
          </div>

          {/* ── Step: Email ─────────────────────────────── */}
          {step === 'email' && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '32px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendCode()}
                placeholder="your@email.com"
                style={inputStyle}
                autoFocus
              />
              {error && <p style={{ color: 'var(--red)', fontSize: '13px', marginTop: '8px' }}>{error}</p>}
              <button
                onClick={handleSendCode}
                disabled={loading}
                style={{
                  width: '100%', marginTop: '16px',
                  background: loading ? 'var(--surface-3)' : 'linear-gradient(135deg, #c9a85c, #e8d5a0)',
                  color: loading ? 'var(--text-muted)' : '#09090f',
                  fontWeight: 700, fontSize: '14px', letterSpacing: '0.08em', textTransform: 'uppercase',
                  padding: '16px', borderRadius: '12px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Sending…' : 'Send Access Code →'}
              </button>
              <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-dim)', marginTop: '16px', lineHeight: 1.6 }}>
                A 6-digit code will be sent to your inbox.<br />
                Use the email address you used to purchase tickets.
              </p>
            </div>
          )}

          {/* ── Step: Code ──────────────────────────────── */}
          {step === 'code' && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '32px' }}>
              <div style={{
                background: 'var(--surface-2)', border: '1px solid var(--border-muted)',
                borderRadius: '10px', padding: '12px 16px', marginBottom: '24px',
                display: 'flex', alignItems: 'center', gap: '10px',
              }}>
                <span style={{ color: 'var(--gold)', fontSize: '16px' }}>◈</span>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Code sent to <strong style={{ color: 'var(--text)' }}>{email}</strong>.<br />
                  Check your inbox (and spam folder).
                </p>
              </div>

              <label style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                6-digit code
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={e => e.key === 'Enter' && handleVerifyCode()}
                placeholder="000000"
                style={{ ...inputStyle, fontSize: '28px', fontWeight: 700, letterSpacing: '0.3em', textAlign: 'center' }}
                autoFocus
              />
              {error && <p style={{ color: 'var(--red)', fontSize: '13px', marginTop: '8px' }}>{error}</p>}
              <button
                onClick={handleVerifyCode}
                disabled={loading || code.length !== 6}
                style={{
                  width: '100%', marginTop: '16px',
                  background: (loading || code.length !== 6) ? 'var(--surface-3)' : 'linear-gradient(135deg, #c9a85c, #e8d5a0)',
                  color: (loading || code.length !== 6) ? 'var(--text-muted)' : '#09090f',
                  fontWeight: 700, fontSize: '14px', letterSpacing: '0.08em', textTransform: 'uppercase',
                  padding: '16px', borderRadius: '12px', border: 'none',
                  cursor: (loading || code.length !== 6) ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Verifying…' : 'Access My Tickets →'}
              </button>
              <button
                onClick={() => { setStep('email'); setCode(''); setError(''); }}
                style={{
                  width: '100%', marginTop: '10px',
                  background: 'transparent', border: 'none',
                  color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer', padding: '8px',
                }}
              >
                ← Use a different email
              </button>
            </div>
          )}

          {/* ── Step: Orders ────────────────────────────── */}
          {step === 'orders' && (
            <div>
              {orders.length === 0 ? (
                <div style={{
                  background: 'var(--surface)', border: '1px solid var(--border-muted)',
                  borderRadius: '16px', padding: '48px 24px', textAlign: 'center',
                }}>
                  <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: '24px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    No tickets found
                  </p>
                  <p style={{ fontSize: '14px', color: 'var(--text-dim)', marginBottom: '20px' }}>
                    No paid orders found for {email}
                  </p>
                  <Link href="/" style={{
                    display: 'inline-block',
                    background: 'linear-gradient(135deg, #c9a85c, #e8d5a0)', color: '#09090f',
                    fontWeight: 700, fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase',
                    padding: '12px 24px', borderRadius: '10px', textDecoration: 'none',
                  }}>
                    Browse Events →
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {orders.map(order => {
                    const items: AttendeeTicket[] = order.items ? JSON.parse(order.items as unknown as string) : [];
                    const isExpanded = expandedOrder === order.id;

                    return (
                      <div key={order.id} style={{
                        background: 'var(--surface)', border: '1px solid var(--border-muted)',
                        borderRadius: '14px', overflow: 'hidden',
                      }}>
                        {/* Order header */}
                        <button
                          onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                          style={{
                            width: '100%', padding: '20px', background: 'none', border: 'none',
                            cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          }}
                        >
                          <div>
                            <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: '20px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>
                              {order.event_name}
                            </p>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                              {formatDate(order.event_date)}
                              {order.event_location && order.event_location !== ', ' ? ` · ${order.event_location}` : ''}
                            </p>
                            <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
                              #{order.id.slice(0, 8).toUpperCase()} · {items.length} ticket{items.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <span style={{ color: 'var(--gold)', fontSize: '20px', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'none' }}>
                            ↓
                          </span>
                        </button>

                        {/* Expanded: ticket QR codes */}
                        {isExpanded && (
                          <div style={{ borderTop: '1px solid var(--border-muted)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {items.map((ticket, idx) => (
                              <div key={idx} style={{
                                background: 'var(--surface-2)', border: '1px solid var(--border-muted)',
                                borderRadius: '12px', padding: '20px', textAlign: 'center',
                              }}>
                                <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '2px' }}>
                                  {ticket.first_name} {ticket.last_name}
                                </p>
                                <p style={{ fontSize: '13px', color: 'var(--gold)', marginBottom: '16px', letterSpacing: '0.04em' }}>
                                  {ticket.ticket_name}
                                </p>
                                {/* QR: use an img tag pointing to a QR generation endpoint */}
                                <img
                                  src={`/api/qr?data=${encodeURIComponent(ticket.qr_code)}`}
                                  alt="QR Code"
                                  style={{ width: '180px', height: '180px', imageRendering: 'pixelated' }}
                                />
                                <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '10px', letterSpacing: '0.04em' }}>
                                  {ticket.checked_in ? '✓ Checked in' : 'Present at the door'}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <button
                    onClick={() => { setStep('email'); setEmail(''); setCode(''); setOrders([]); }}
                    style={{
                      background: 'transparent', border: '1px solid var(--border-muted)',
                      color: 'var(--text-muted)', fontSize: '13px', padding: '12px',
                      borderRadius: '10px', cursor: 'pointer', marginTop: '8px',
                    }}
                  >
                    Look up a different email →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
