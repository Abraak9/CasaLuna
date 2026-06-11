'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getCurrentPrice, isTicketAvailable, formatPrice } from '@/lib/pricing';

interface PriceTier {
  valid_until: string;
  price: number;
  sort_order: number;
}

interface TicketType {
  id: string;
  name_en: string;
  name_es: string;
  description_en: string;
  description_es: string;
  stock_total: number;
  stock_sold: number;
  attendees_per_ticket: number;
  units_per_order: number;
  price_scaling: 'fixed' | 'by_date' | 'by_stock';
  base_price: number;
  visibility: string;
  available_from?: string;
  available_until?: string;
  collect_full_name: boolean;
  collect_email: boolean;
  collect_phone: boolean;
  collect_gender: boolean;
  collect_role: boolean;
  collect_passport: boolean;
  collect_country: boolean;
  collect_city: boolean;
  price_tiers?: PriceTier[];
}

interface Event {
  id: string;
  slug: string;
  name_en: string;
  name_es: string;
  description_en: string;
  description_es: string;
  date: string;
  end_date: string;
  location_name: string;
  location_address: string;
  location_city: string;
  cover_image_url: string;
}

interface AttendeeForm {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  gender: string;
  role: string;
  passport_number: string;
  residence_country: string;
  residence_city: string;
}

interface CartItem {
  ticket: TicketType;
  quantity: number;
  attendees: AttendeeForm[];
}

const emptyAttendee = (): AttendeeForm => ({
  first_name: '', last_name: '', email: '', phone: '',
  gender: '', role: '', passport_number: '', residence_country: '', residence_city: '',
});

const inputStyle: React.CSSProperties = {
  background: 'var(--surface-2)',
  border: '1px solid var(--border-muted)',
  color: 'var(--text)',
  borderRadius: '10px',
  padding: '10px 14px',
  fontSize: '14px',
  width: '100%',
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  color: 'var(--text-muted)',
  display: 'block',
  marginBottom: '6px',
};

export default function EventPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'browse' | 'attendees' | 'review'>('browse');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/events/${slug}`)
      .then(r => r.json())
      .then(data => {
        setEvent(data.event);
        setTicketTypes(data.ticketTypes || []);
        setLoading(false);
      })
      .catch(() => { setLoading(false); setError('Could not load event.'); });
  }, [slug]);

  const addToCart = (ticket: TicketType) => {
    setCart(prev => {
      const existing = prev.find(c => c.ticket.id === ticket.id);
      if (existing) {
        const newAttendees = [...existing.attendees, ...Array(ticket.attendees_per_ticket).fill(null).map(emptyAttendee)];
        return prev.map(c => c.ticket.id === ticket.id ? { ...c, quantity: c.quantity + 1, attendees: newAttendees } : c);
      }
      return [...prev, { ticket, quantity: 1, attendees: Array(ticket.attendees_per_ticket).fill(null).map(emptyAttendee) }];
    });
  };

  const removeFromCart = (ticketId: string) => {
    setCart(prev => {
      const existing = prev.find(c => c.ticket.id === ticketId);
      if (!existing || existing.quantity <= 1) return prev.filter(c => c.ticket.id !== ticketId);
      const newAttendees = existing.attendees.slice(0, (existing.quantity - 1) * existing.ticket.attendees_per_ticket);
      return prev.map(c => c.ticket.id === ticketId ? { ...c, quantity: c.quantity - 1, attendees: newAttendees } : c);
    });
  };

  const getQuantity = (ticketId: string) => cart.find(c => c.ticket.id === ticketId)?.quantity ?? 0;
  const totalPrice = cart.reduce((sum, item) => sum + getCurrentPrice(item.ticket) * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const updateAttendee = (cartIdx: number, attIdx: number, field: keyof AttendeeForm, value: string) => {
    setCart(prev => prev.map((c, ci) => {
      if (ci !== cartIdx) return c;
      const newAttendees = c.attendees.map((a, ai) => ai === attIdx ? { ...a, [field]: value } : a);
      return { ...c, attendees: newAttendees };
    }));
  };

  const handleCheckout = async () => {
    if (!email) { setError('Please enter your email address.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_slug: slug, email,
          items: cart.map(c => ({ ticket_type_id: c.ticket.id, quantity: c.quantity, attendees: c.attendees })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout failed');
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '50%',
          border: '2px solid var(--border-muted)',
          borderTopColor: 'var(--gold)',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!event) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: '28px', color: 'var(--text-muted)' }}>Event not found</p>
        <Link href="/" style={{ color: 'var(--gold)', fontSize: '14px' }}>← Back to events</Link>
      </div>
    );
  }

  const eventDate = new Date(event.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const eventTime = new Date(event.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: totalItems > 0 ? '120px' : '60px' }}>

      {/* ── Hero ─────────────────────────────────────────── */}
      <div style={{ position: 'relative' }}>
        {event.cover_image_url ? (
          <div style={{ position: 'relative', height: '340px', background: 'var(--surface)' }}>
            <Image src={event.cover_image_url} alt={event.name_en || event.name_es} fill style={{ objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(9,9,15,0.95) 0%, rgba(9,9,15,0.3) 60%, transparent 100%)' }} />
          </div>
        ) : (
          <div style={{ height: '280px', background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface-2) 100%)', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(201,168,92,0.06) 0%, transparent 70%)' }} />
          </div>
        )}

        <button
          onClick={() => router.back()}
          style={{
            position: 'absolute', top: '20px', left: '20px',
            width: '40px', height: '40px', borderRadius: '50%',
            background: 'rgba(9,9,15,0.7)', backdropFilter: 'blur(12px)',
            border: '1px solid var(--border-muted)',
            color: 'var(--text)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px',
          }}
        >
          ←
        </button>
      </div>

      {/* ── Event info ───────────────────────────────────── */}
      <div style={{
        padding: '32px 20px 24px',
        maxWidth: '640px',
        margin: '0 auto',
        marginTop: event.cover_image_url ? '-60px' : '0',
        position: 'relative',
        zIndex: 1,
      }}>
        <h1 style={{
          fontFamily: 'var(--font-cormorant)',
          fontSize: 'clamp(32px, 6vw, 52px)',
          fontWeight: 600,
          lineHeight: 1.05,
          color: 'var(--text)',
          marginBottom: '12px',
        }}>
          {event.name_en || event.name_es}
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--gold)' }}>◷</span>
            {eventDate} · {eventTime}
          </p>
          {event.location_name && (
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--gold)' }}>⊙</span>
              {event.location_name}{event.location_city ? `, ${event.location_city}` : ''}
            </p>
          )}
        </div>

        {(event.description_en || event.description_es) && (
          <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.7, borderTop: '1px solid var(--border-muted)', paddingTop: '20px' }}>
            {event.description_en || event.description_es}
          </p>
        )}
      </div>

      {/* ── Step divider ─────────────────────────────────── */}
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 20px' }}>
        <div style={{ display: 'flex', gap: '0', marginBottom: '32px' }}>
          {(['browse', 'attendees', 'review'] as const).map((s, i) => (
            <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: step === s ? 'linear-gradient(135deg, #c9a85c, #e8d5a0)' : 'var(--surface-2)',
                border: `1px solid ${step === s || (['browse','attendees','review'].indexOf(step) > i) ? 'var(--gold)' : 'var(--border-muted)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: 700,
                color: step === s ? '#09090f' : 'var(--text-muted)',
                transition: 'all 0.2s',
              }}>
                {['browse','attendees','review'].indexOf(step) > i ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', color: step === s ? 'var(--gold)' : 'var(--text-dim)' }}>
                {s === 'browse' ? 'Tickets' : s === 'attendees' ? 'Details' : 'Review'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Browse tickets ───────────────────────────────── */}
      {step === 'browse' && (
        <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {ticketTypes.filter(t => t.visibility !== 'hidden').map(ticket => {
              const price = getCurrentPrice(ticket);
              const available = isTicketAvailable(ticket);
              const qty = getQuantity(ticket.id);
              const remaining = ticket.stock_total - ticket.stock_sold;

              return (
                <div key={ticket.id} style={{
                  background: 'var(--surface)',
                  border: `1px solid ${qty > 0 ? 'var(--border)' : 'var(--border-muted)'}`,
                  borderRadius: '14px',
                  padding: '18px 20px',
                  opacity: available ? 1 : 0.5,
                  transition: 'border-color 0.2s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>
                        {ticket.name_en || ticket.name_es}
                      </h3>
                      {(ticket.description_en || ticket.description_es) && (
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', lineHeight: 1.5 }}>
                          {ticket.description_en || ticket.description_es}
                        </p>
                      )}
                      <p style={{
                        fontFamily: 'var(--font-cormorant)',
                        fontSize: '22px',
                        fontWeight: 600,
                        lineHeight: 1,
                      }} className="cl-gold-text">
                        {formatPrice(price)}
                      </p>
                      {remaining <= 20 && remaining > 0 && (
                        <p style={{ fontSize: '12px', color: 'var(--amber)', marginTop: '4px' }}>Only {remaining} left</p>
                      )}
                      {!available && <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>Sold out</p>}
                    </div>

                    {available && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                        {qty > 0 && (
                          <>
                            <button
                              onClick={() => removeFromCart(ticket.id)}
                              style={{
                                width: '36px', height: '36px', borderRadius: '50%',
                                background: 'var(--surface-2)',
                                border: '1px solid var(--border-muted)',
                                color: 'var(--text)', cursor: 'pointer',
                                fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}
                            >
                              −
                            </button>
                            <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--gold)', minWidth: '20px', textAlign: 'center' }}>
                              {qty}
                            </span>
                          </>
                        )}
                        <button
                          onClick={() => addToCart(ticket)}
                          style={{
                            width: '36px', height: '36px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, #c9a85c, #e8d5a0)',
                            border: 'none',
                            color: '#09090f', cursor: 'pointer',
                            fontSize: '20px', fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Attendee details ─────────────────────────────── */}
      {step === 'attendees' && (
        <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Email field */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px' }}>
            <label style={labelStyle}>Your Email *</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="cl-input"
              style={inputStyle}
            />
            <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '6px' }}>
              Tickets will be sent to this address
            </p>
          </div>

          {cart.map((item, ci) =>
            item.attendees.map((att, ai) => (
              <div key={`${ci}-${ai}`} style={{ background: 'var(--surface)', border: '1px solid var(--border-muted)', borderRadius: '14px', padding: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gold)', marginBottom: '16px', letterSpacing: '0.04em' }}>
                  {item.ticket.name_en || item.ticket.name_es}
                  {item.attendees.length > 1 ? ` · Person ${ai + 1}` : ''}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {item.ticket.collect_full_name && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={labelStyle}>First name *</label>
                        <input value={att.first_name} onChange={e => updateAttendee(ci, ai, 'first_name', e.target.value)} style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Last name *</label>
                        <input value={att.last_name} onChange={e => updateAttendee(ci, ai, 'last_name', e.target.value)} style={inputStyle} />
                      </div>
                    </div>
                  )}
                  {item.ticket.collect_phone && (
                    <div>
                      <label style={labelStyle}>Phone</label>
                      <input type="tel" value={att.phone} onChange={e => updateAttendee(ci, ai, 'phone', e.target.value)} style={inputStyle} />
                    </div>
                  )}
                  {item.ticket.collect_gender && (
                    <div>
                      <label style={labelStyle}>Gender</label>
                      <select value={att.gender} onChange={e => updateAttendee(ci, ai, 'gender', e.target.value)} style={{ ...inputStyle, appearance: 'none' }}>
                        <option value="">Select…</option>
                        <option>Male</option><option>Female</option><option>Non-binary</option><option>Prefer not to say</option>
                      </select>
                    </div>
                  )}
                  {item.ticket.collect_role && (
                    <div>
                      <label style={labelStyle}>Dance role</label>
                      <select value={att.role} onChange={e => updateAttendee(ci, ai, 'role', e.target.value)} style={{ ...inputStyle, appearance: 'none' }}>
                        <option value="">Select…</option>
                        <option value="leader">Leader</option>
                        <option value="follower">Follower</option>
                        <option value="both">Both</option>
                      </select>
                    </div>
                  )}
                  {item.ticket.collect_country && (
                    <div>
                      <label style={labelStyle}>Country</label>
                      <input value={att.residence_country} onChange={e => updateAttendee(ci, ai, 'residence_country', e.target.value)} style={inputStyle} />
                    </div>
                  )}
                  {item.ticket.collect_city && (
                    <div>
                      <label style={labelStyle}>City</label>
                      <input value={att.residence_city} onChange={e => updateAttendee(ci, ai, 'residence_city', e.target.value)} style={inputStyle} />
                    </div>
                  )}
                  {item.ticket.collect_passport && (
                    <div>
                      <label style={labelStyle}>Passport / Document</label>
                      <input value={att.passport_number} onChange={e => updateAttendee(ci, ai, 'passport_number', e.target.value)} style={inputStyle} />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Review ───────────────────────────────────────── */}
      {step === 'review' && (
        <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px' }}>
            <p style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Order Summary
            </p>
            {cart.map(item => (
              <div key={item.ticket.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-muted)' }}>
                <span style={{ fontSize: '14px', color: 'var(--text)' }}>
                  {item.ticket.name_en || item.ticket.name_es} × {item.quantity}
                </span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gold)' }}>
                  {formatPrice(getCurrentPrice(item.ticket) * item.quantity)}
                </span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '14px' }}>
              <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: '20px', fontWeight: 600, color: 'var(--text)' }}>Total</span>
              <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: '24px', fontWeight: 700 }} className="cl-gold-text">
                {formatPrice(totalPrice)}
              </span>
            </div>
          </div>
          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border-muted)', borderRadius: '12px', padding: '14px 16px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Tickets sent to: <strong style={{ color: 'var(--text)' }}>{email}</strong>
            </p>
          </div>
          {error && <p style={{ color: 'var(--red)', fontSize: '14px' }}>{error}</p>}
        </div>
      )}

      {/* ── Sticky CTA ───────────────────────────────────── */}
      {totalItems > 0 && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'rgba(9,9,15,0.95)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid var(--border)',
          padding: '16px 20px',
          zIndex: 40,
          maxWidth: '640px',
          marginLeft: 'auto', marginRight: 'auto',
        }}>
          {error && step === 'browse' && <p style={{ color: 'var(--red)', fontSize: '12px', marginBottom: '8px' }}>{error}</p>}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{totalItems} ticket{totalItems !== 1 ? 's' : ''}</span>
            <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: '20px', fontWeight: 600 }} className="cl-gold-text">
              {formatPrice(totalPrice)}
            </span>
          </div>

          {step === 'browse' && (
            <button
              onClick={() => setStep('attendees')}
              className="cl-btn-gold"
              style={{
                width: '100%', padding: '16px', borderRadius: '12px', border: 'none',
                fontSize: '14px', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
                background: 'linear-gradient(135deg, #c9a85c, #e8d5a0)', color: '#09090f', fontWeight: 700,
              }}
            >
              Continue →
            </button>
          )}
          {step === 'attendees' && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setStep('browse')}
                style={{
                  padding: '16px 20px', borderRadius: '12px',
                  background: 'var(--surface-2)', border: '1px solid var(--border-muted)',
                  color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px',
                }}
              >
                ← Back
              </button>
              <button
                onClick={() => setStep('review')}
                style={{
                  flex: 1, padding: '16px', borderRadius: '12px', border: 'none',
                  background: 'linear-gradient(135deg, #c9a85c, #e8d5a0)', color: '#09090f',
                  fontWeight: 700, fontSize: '14px', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
                }}
              >
                Review Order →
              </button>
            </div>
          )}
          {step === 'review' && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setStep('attendees')}
                style={{
                  padding: '16px 20px', borderRadius: '12px',
                  background: 'var(--surface-2)', border: '1px solid var(--border-muted)',
                  color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px',
                }}
              >
                ← Back
              </button>
              <button
                onClick={handleCheckout}
                disabled={submitting}
                style={{
                  flex: 1, padding: '16px', borderRadius: '12px', border: 'none',
                  background: submitting ? 'var(--surface-3)' : 'linear-gradient(135deg, #c9a85c, #e8d5a0)',
                  color: submitting ? 'var(--text-muted)' : '#09090f',
                  fontWeight: 700, fontSize: '14px', letterSpacing: '0.08em', textTransform: 'uppercase',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting ? 'Redirecting to Stripe…' : `Pay ${formatPrice(totalPrice)}`}
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
