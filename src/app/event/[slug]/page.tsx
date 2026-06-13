'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getCurrentPrice, isTicketAvailable, formatPrice } from '@/lib/pricing';
import SeatPicker, { PublicSeatMap } from '@/components/SeatPicker';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PriceTier { valid_until: string; price: number; sort_order: number; }

interface TicketType {
  id: string; name_en: string; name_es: string;
  description_en: string; description_es: string;
  stock_total: number; stock_sold: number;
  attendees_per_ticket: number; units_per_order: number;
  price_scaling: 'fixed' | 'by_date' | 'by_stock';
  base_price: number; currency: string;
  visibility: string;
  available_from?: string; available_until?: string;
  collect_full_name: boolean; collect_email: boolean; collect_phone: boolean;
  collect_gender: boolean; collect_role: boolean; collect_passport: boolean;
  collect_country: boolean; collect_city: boolean;
  requires_seat_selection: boolean;
  group_id: string | null;
  price_tiers?: PriceTier[];
}

interface Group { id: string; name: string; sort_order: number; }

interface BundleItem {
  ticket_type_id: string; quantity: number;
  ticket_name: string; ticket_price: number; ticket_currency: string;
  stock_total: number; stock_sold: number;
  collect_full_name: boolean; collect_email: boolean; collect_phone: boolean;
  collect_gender: boolean; collect_role: boolean; collect_passport: boolean;
  collect_country: boolean; collect_city: boolean;
}

interface Bundle {
  id: string; name_en: string; description_en: string | null;
  bundle_price: number; currency: string; visibility: string;
  items: BundleItem[];
}

interface Addon {
  id: string; name_en: string; description_en: string | null;
  price: number; currency: string;
  stock_total: number | null; stock_sold: number;
  max_per_order: number; scope: string;
  show_at: string; // 'addons' | 'review'
  generates_voucher: boolean;
  restricted_to_ticket_type_ids: string[];
}

interface AddonCartItem { addon: Addon; quantity: number; }

interface Event {
  id: string; slug: string; name_en: string; name_es: string;
  description_en: string; description_es: string;
  date: string; end_date: string;
  location_name: string; location_address: string; location_city: string;
  cover_image_url: string; cover_image_position: string;
}

interface AttendeeForm {
  first_name: string; last_name: string; email: string; phone: string;
  gender: string; role: string; passport_number: string;
  residence_country: string; residence_city: string;
}

interface CartItem { ticket: TicketType; quantity: number; attendees: AttendeeForm[]; }

// Bundle in cart: one entry per bundle, attendees keyed by ticket_type_id
interface BundleCartItem {
  bundle: Bundle;
  attendees: Record<string, AttendeeForm[]>; // ticket_type_id → attendee forms
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const emptyAttendee = (): AttendeeForm => ({
  first_name: '', last_name: '', email: '', phone: '',
  gender: '', role: '', passport_number: '', residence_country: '', residence_city: '',
});

const bundleRetail = (b: Bundle) =>
  b.items.reduce((s, i) => s + i.ticket_price * i.quantity, 0);

const inputStyle: React.CSSProperties = {
  background: 'var(--surface-2)', border: '1px solid var(--border-muted)',
  color: 'var(--text)', borderRadius: '10px', padding: '10px 14px',
  fontSize: '14px', width: '100%', outline: 'none',
};
const labelStyle: React.CSSProperties = {
  fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em',
  textTransform: 'uppercase' as const, color: 'var(--text-muted)',
  display: 'block', marginBottom: '6px',
};

// ─── Attendee form (module-level so React never remounts it on re-render) ─────

function AttendeeFields({
  att, onChange, label, fields,
}: {
  att: AttendeeForm;
  onChange: (field: keyof AttendeeForm, val: string) => void;
  label: string;
  fields: { collect_full_name: boolean; collect_email: boolean; collect_phone: boolean; collect_gender: boolean; collect_role: boolean; collect_passport: boolean; collect_country: boolean; collect_city: boolean };
}) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border-muted)', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gold)', marginBottom: '2px', letterSpacing: '0.04em' }}>{label}</h3>
      {fields.collect_full_name && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div><label style={labelStyle}>First name *</label><input value={att.first_name} onChange={e => onChange('first_name', e.target.value)} style={inputStyle} /></div>
          <div><label style={labelStyle}>Last name *</label><input value={att.last_name} onChange={e => onChange('last_name', e.target.value)} style={inputStyle} /></div>
        </div>
      )}
      {fields.collect_phone && <div><label style={labelStyle}>Phone</label><input type="tel" value={att.phone} onChange={e => onChange('phone', e.target.value)} style={inputStyle} /></div>}
      {fields.collect_gender && (
        <div><label style={labelStyle}>Gender</label>
          <select value={att.gender} onChange={e => onChange('gender', e.target.value)} style={{ ...inputStyle, appearance: 'none' }}>
            <option value="">Select…</option>
            <option>Male</option><option>Female</option><option>Non-binary</option><option>Prefer not to say</option>
          </select>
        </div>
      )}
      {fields.collect_role && (
        <div><label style={labelStyle}>Dance role</label>
          <select value={att.role} onChange={e => onChange('role', e.target.value)} style={{ ...inputStyle, appearance: 'none' }}>
            <option value="">Select…</option>
            <option value="leader">Leader</option><option value="follower">Follower</option><option value="both">Both</option>
          </select>
        </div>
      )}
      {fields.collect_country && <div><label style={labelStyle}>Country</label><input value={att.residence_country} onChange={e => onChange('residence_country', e.target.value)} style={inputStyle} /></div>}
      {fields.collect_city && <div><label style={labelStyle}>City</label><input value={att.residence_city} onChange={e => onChange('residence_city', e.target.value)} style={inputStyle} /></div>}
      {fields.collect_passport && <div><label style={labelStyle}>Passport / Document</label><input value={att.passport_number} onChange={e => onChange('passport_number', e.target.value)} style={inputStyle} /></div>}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function EventPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const [event, setEvent] = useState<Event | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [bundleCart, setBundleCart] = useState<BundleCartItem[]>([]);
  const [addonCart, setAddonCart] = useState<AddonCartItem[]>([]);

  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'browse' | 'seats' | 'attendees' | 'addons' | 'review'>('browse');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [promoInput, setPromoInput] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string; discount_id: string | null; promoter_id: string | null;
    label: string; type: string; value: number;
  } | null>(null);
  const [affiliateId, setAffiliateId] = useState<string | null>(null);

  const [seatMap, setSeatMap] = useState<PublicSeatMap | null>(null);
  const [seatMapLoading, setSeatMapLoading] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [reservationIds, setReservationIds] = useState<string[]>([]);

  useEffect(() => {
    fetch(`/api/events/${slug}`)
      .then(r => r.json())
      .then(data => {
        setEvent(data.event);
        setTicketTypes(data.ticketTypes || []);
        setGroups(data.groups || []);
        setBundles(data.bundles || []);
        setAddons(data.addons || []);
        setLoading(false);
      })
      .catch(() => { setLoading(false); setError('Could not load event.'); });
  }, [slug]);

  // ─── Affiliate tracking — read ?ref= param on mount ─────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (!ref) return;
    fetch('/api/affiliates/track', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tracking_code: ref }),
    })
      .then(r => r.json())
      .then(data => { if (data.affiliate_id) setAffiliateId(data.affiliate_id); })
      .catch(() => { /* silently ignore */ });
  }, []);

  // ─── Cart helpers ────────────────────────────────────────────────────────────

  const addToCart = (ticket: TicketType) => {
    setCart(prev => {
      const ex = prev.find(c => c.ticket.id === ticket.id);
      if (ex) {
        return prev.map(c => c.ticket.id === ticket.id
          ? { ...c, quantity: c.quantity + 1, attendees: [...c.attendees, ...Array(ticket.attendees_per_ticket).fill(null).map(emptyAttendee)] }
          : c);
      }
      return [...prev, { ticket, quantity: 1, attendees: Array(ticket.attendees_per_ticket).fill(null).map(emptyAttendee) }];
    });
  };

  const removeFromCart = (ticketId: string) => {
    setCart(prev => {
      const ex = prev.find(c => c.ticket.id === ticketId);
      if (!ex || ex.quantity <= 1) return prev.filter(c => c.ticket.id !== ticketId);
      return prev.map(c => c.ticket.id === ticketId
        ? { ...c, quantity: c.quantity - 1, attendees: c.attendees.slice(0, (c.quantity - 1) * c.ticket.attendees_per_ticket) }
        : c);
    });
  };

  const addBundleToCart = (bundle: Bundle) => {
    setBundleCart(prev => {
      if (prev.find(b => b.bundle.id === bundle.id)) return prev; // already in cart
      const attendees: Record<string, AttendeeForm[]> = {};
      for (const item of bundle.items) {
        attendees[item.ticket_type_id] = Array(item.quantity).fill(null).map(emptyAttendee);
      }
      return [...prev, { bundle, attendees }];
    });
  };

  const removeBundleFromCart = (bundleId: string) => {
    setBundleCart(prev => prev.filter(b => b.bundle.id !== bundleId));
  };

  const getQuantity = (ticketId: string) => cart.find(c => c.ticket.id === ticketId)?.quantity ?? 0;
  const hasBundleInCart = (bundleId: string) => bundleCart.some(b => b.bundle.id === bundleId);

  const getAddonQty = (addonId: string) => addonCart.find(a => a.addon.id === addonId)?.quantity ?? 0;

  const addAddon = (addon: Addon, delta: number) => {
    setAddonCart(prev => {
      const ex = prev.find(a => a.addon.id === addon.id);
      if (!ex) {
        if (delta <= 0) return prev;
        return [...prev, { addon, quantity: delta }];
      }
      const newQty = Math.max(0, Math.min(addon.max_per_order, ex.quantity + delta));
      if (newQty === 0) return prev.filter(a => a.addon.id !== addon.id);
      return prev.map(a => a.addon.id === addon.id ? { ...a, quantity: newQty } : a);
    });
  };

  const setAddonQty = (addon: Addon, qty: number) => {
    const clamped = Math.max(0, Math.min(addon.max_per_order, qty));
    setAddonCart(prev => {
      if (clamped === 0) return prev.filter(a => a.addon.id !== addon.id);
      const ex = prev.find(a => a.addon.id === addon.id);
      if (!ex) return [...prev, { addon, quantity: clamped }];
      return prev.map(a => a.addon.id === addon.id ? { ...a, quantity: clamped } : a);
    });
  };

  // Total attendee count for per_attendee default qty
  const totalAttendees = cart.reduce((s, c) => s + c.attendees.length, 0)
    + bundleCart.reduce((s, bc) => s + bc.bundle.items.reduce((ss, i) => ss + i.quantity, 0), 0);

  const subtotalPrice = cart.reduce((sum, item) => sum + getCurrentPrice(item.ticket) * item.quantity, 0)
    + bundleCart.reduce((sum, bc) => sum + bc.bundle.bundle_price, 0)
    + addonCart.reduce((sum, ac) => sum + ac.addon.price * ac.quantity, 0);
  const promoDiscountAmount = appliedPromo
    ? appliedPromo.type === 'percentage'
      ? Math.round(subtotalPrice * (appliedPromo.value / 100) * 100) / 100
      : Math.min(appliedPromo.value, subtotalPrice)
    : 0;
  const totalPrice = Math.max(0, subtotalPrice - promoDiscountAmount);
  const cartCurrency: string =
    cart[0]?.ticket.currency ||
    bundleCart[0]?.bundle.currency ||
    addonCart[0]?.addon.currency ||
    'EUR';
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0) + bundleCart.length;
  const needsSeats = cart.some(item => item.ticket.requires_seat_selection);

  // Addons that qualify given current cart ticket type IDs
  const cartTicketTypeIds = cart.map(c => c.ticket.id);
  const qualifiedAddons = addons.filter(a => {
    if (a.stock_total !== null && (a.stock_total - a.stock_sold) <= 0) return false;
    if (!a.restricted_to_ticket_type_ids?.length) return true;
    return a.restricted_to_ticket_type_ids.some(id => cartTicketTypeIds.includes(id));
  });
  const addonStepAddons = qualifiedAddons.filter(a => a.show_at === 'addons');
  const reviewRailAddons = qualifiedAddons.filter(a => a.show_at === 'review');
  const hasAddonStep = addonStepAddons.length > 0;
  const seatTickets = cart.filter(item => item.ticket.requires_seat_selection).reduce((sum, item) => sum + item.quantity, 0);

  const updateAttendee = (cartIdx: number, attIdx: number, field: keyof AttendeeForm, value: string) => {
    setCart(prev => prev.map((c, ci) => ci !== cartIdx ? c : {
      ...c, attendees: c.attendees.map((a, ai) => ai !== attIdx ? a : { ...a, [field]: value }),
    }));
  };

  const updateBundleAttendee = (bundleId: string, ticketTypeId: string, attIdx: number, field: keyof AttendeeForm, value: string) => {
    setBundleCart(prev => prev.map(bc => bc.bundle.id !== bundleId ? bc : {
      ...bc,
      attendees: {
        ...bc.attendees,
        [ticketTypeId]: bc.attendees[ticketTypeId].map((a, i) => i !== attIdx ? a : { ...a, [field]: value }),
      },
    }));
  };

  // ─── Navigation ──────────────────────────────────────────────────────────────

  const loadSeatMap = async () => {
    setSeatMapLoading(true);
    try {
      const res = await fetch(`/api/events/${slug}/seat-map`);
      setSeatMap(await res.json());
    } catch { /* no map */ }
    setSeatMapLoading(false);
  };

  const handleContinueFromBrowse = () => {
    if (needsSeats) { setStep('seats'); if (!seatMap) loadSeatMap(); }
    else setStep('attendees');
  };

  const handleContinueFromAttendees = () => {
    if (hasAddonStep) {
      // Auto-set per_attendee addons qty to total attendee count
      setAddonCart(prev => {
        const next = [...prev];
        for (const addon of addonStepAddons) {
          if (addon.scope === 'per_attendee') {
            const idx = next.findIndex(a => a.addon.id === addon.id);
            const defaultQty = Math.min(totalAttendees || 1, addon.max_per_order);
            if (idx >= 0) {
              // already in cart — leave user's qty
            } else if (defaultQty > 0) {
              next.push({ addon, quantity: defaultQty });
            }
          }
        }
        return next;
      });
      setStep('addons');
    } else {
      setStep('review');
    }
  };

  const handleConfirmSeats = async () => {
    if (selectedSeats.length < seatTickets) {
      setError(`Please select ${seatTickets} spot${seatTickets !== 1 ? 's' : ''} before continuing.`);
      return;
    }
    setSubmitting(true); setError('');
    try {
      const res = await fetch(`/api/events/${slug}/seat-map/reserve`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seat_ids: selectedSeats }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not reserve seats');
      setReservationIds(data.reservation_ids);
      setStep('attendees');
    } catch (err) { setError(err instanceof Error ? err.message : 'Seat reservation failed'); }
    setSubmitting(false);
  };

  const handleCheckout = async () => {
    if (!email) { setError('Please enter your email address.'); return; }
    setSubmitting(true); setError('');
    try {
      const body: Record<string, unknown> = {
        event_slug: slug, email,
        items: cart.map(c => ({ ticket_type_id: c.ticket.id, quantity: c.quantity, attendees: c.attendees })),
        addons: addonCart.map(ac => ({ addon_id: ac.addon.id, quantity: ac.quantity })),
        bundle_items: bundleCart.map(bc => ({
          bundle_id: bc.bundle.id,
          items: bc.bundle.items.map(bi => ({
            ticket_type_id: bi.ticket_type_id,
            quantity: bi.quantity,
            attendees: bc.attendees[bi.ticket_type_id] || [],
          })),
        })),
      };
      if (reservationIds.length) body.seat_reservation_ids = reservationIds;
      if (appliedPromo) body.discount_code = appliedPromo.code;
      if (affiliateId) body.affiliate_id = affiliateId;
      const res = await fetch('/api/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout failed');
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSubmitting(false);
    }
  };

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true); setPromoError('');
    try {
      // Collect all ticket type IDs in cart (individual + bundle items)
      const allCartTicketTypeIds = [
        ...cart.map(c => c.ticket.id),
        ...bundleCart.flatMap(bc => bc.bundle.items.map(bi => bi.ticket_type_id)),
      ];
      const res = await fetch('/api/discounts/validate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoInput.trim(), event_slug: slug, subtotal: subtotalPrice, cart_ticket_type_ids: allCartTicketTypeIds }),
      });
      const data = await res.json();
      if (!res.ok) { setPromoError(data.error || 'Invalid code'); return; }
      // Store type+value so discount recalculates reactively if cart changes
      setAppliedPromo({ code: promoInput.trim().toUpperCase(), discount_id: data.discount_id, label: data.label, type: data.type, value: data.value });
      setPromoInput('');
    } catch {
      setPromoError('Could not apply code, try again');
    } finally {
      setPromoLoading(false);
    }
  };

  // ─── Grouped ticket display ───────────────────────────────────────────────────

  const groupedView = () => {
    const sections: { group: Group | null; tickets: TicketType[] }[] = [];
    for (const g of groups) {
      const gt = ticketTypes.filter(t => t.group_id === g.id && t.visibility !== 'hidden');
      if (gt.length) sections.push({ group: g, tickets: gt });
    }
    const ungrouped = ticketTypes.filter(t => !t.group_id && t.visibility !== 'hidden');
    if (ungrouped.length) sections.push({ group: null, tickets: ungrouped });
    return sections;
  };

  // ─── Loading / not found ─────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid var(--border-muted)', borderTopColor: 'var(--gold)', animation: 'spin 0.8s linear infinite' }} />
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

  const _d = new Date(event.date);
  const eventDate = _d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  const eventTime = `${String(_d.getUTCHours()).padStart(2, '0')}:${String(_d.getUTCMinutes()).padStart(2, '0')}`;

  const visibleBundles = bundles.filter(b => b.items.some(i => (i.stock_total - i.stock_sold) >= i.quantity));

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: totalItems > 0 ? '164px' : '40px' }}>

      {/* ── Hero ── */}
      <div style={{ position: 'relative' }}>
        {event.cover_image_url ? (
          <div style={{ position: 'relative', height: '400px', background: 'var(--surface)' }}>
            <Image src={event.cover_image_url} alt={event.name_en || event.name_es} fill style={{ objectFit: 'cover', objectPosition: event.cover_image_position || 'center' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(9,9,15,0.95) 0%, rgba(9,9,15,0.3) 60%, transparent 100%)' }} />
          </div>
        ) : (
          <div style={{ height: '280px', background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface-2) 100%)', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(201,168,92,0.06) 0%, transparent 70%)' }} />
          </div>
        )}
        <button onClick={() => router.back()} style={{ position: 'absolute', top: '20px', left: '20px', width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(9,9,15,0.7)', backdropFilter: 'blur(12px)', border: '1px solid var(--border-muted)', color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>←</button>
      </div>

      {/* ── Event info ── */}
      <div style={{ padding: '32px 20px 24px', maxWidth: '640px', margin: '0 auto', marginTop: event.cover_image_url ? '-60px' : '0', position: 'relative', zIndex: 1 }}>
        <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(32px, 6vw, 52px)', fontWeight: 600, lineHeight: 1.05, color: 'var(--text)', marginBottom: '12px' }}>
          {event.name_en || event.name_es}
        </h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--gold)' }}>◷</span>{eventDate} · {eventTime}
          </p>
          {event.location_name && (
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--gold)' }}>⊙</span>{event.location_name}{event.location_city ? `, ${event.location_city}` : ''}
            </p>
          )}
        </div>
        {(event.description_en || event.description_es) && (
          <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.7, borderTop: '1px solid var(--border-muted)', paddingTop: '20px' }}>
            {event.description_en || event.description_es}
          </p>
        )}
      </div>

      {/* ── Stepper ── */}
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 20px' }}>
        <div style={{ display: 'flex', gap: '0', marginBottom: '32px' }}>
          {(needsSeats
            ? (hasAddonStep
                ? [{ key: 'browse', label: 'Tickets' }, { key: 'seats', label: 'Seats' }, { key: 'attendees', label: 'Details' }, { key: 'addons', label: 'Extras' }, { key: 'review', label: 'Review' }]
                : [{ key: 'browse', label: 'Tickets' }, { key: 'seats', label: 'Seats' }, { key: 'attendees', label: 'Details' }, { key: 'review', label: 'Review' }])
            : (hasAddonStep
                ? [{ key: 'browse', label: 'Tickets' }, { key: 'attendees', label: 'Details' }, { key: 'addons', label: 'Extras' }, { key: 'review', label: 'Review' }]
                : [{ key: 'browse', label: 'Tickets' }, { key: 'attendees', label: 'Details' }, { key: 'review', label: 'Review' }])
          ).map(({ key, label }, i, arr) => {
            const isActive = step === key;
            const isDone = arr.map(s => s.key).indexOf(step) > i;
            return (
              <div key={key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: isActive ? 'linear-gradient(135deg, #c9a85c, #e8d5a0)' : 'var(--surface-2)', border: `1px solid ${isActive || isDone ? 'var(--gold)' : 'var(--border-muted)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: isActive ? '#09090f' : 'var(--text-muted)', transition: 'all 0.2s' }}>
                  {isDone ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', color: isActive ? 'var(--gold)' : 'var(--text-dim)' }}>{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Browse ── */}
      {step === 'browse' && (
        <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 20px 0' }}>

          {/* Grouped ticket list */}
          {groupedView().map(({ group, tickets: gt }, gi) => (
            <div key={gi} style={{ marginBottom: '24px' }}>
              {/* Group header */}
              {group && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)' }}>{group.name}</span>
                  <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, var(--border), transparent)' }} />
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {gt.map(ticket => {
                  const price = getCurrentPrice(ticket);
                  const available = isTicketAvailable(ticket);
                  const qty = getQuantity(ticket.id);
                  const remaining = ticket.stock_total - ticket.stock_sold;
                  return (
                    <div key={ticket.id} style={{ background: 'var(--surface)', border: `1px solid ${qty > 0 ? 'var(--border)' : 'var(--border-muted)'}`, borderRadius: '14px', padding: '18px 20px', opacity: available ? 1 : 0.5, transition: 'border-color 0.2s' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>{ticket.name_en || ticket.name_es}</h3>
                          {(ticket.description_en || ticket.description_es) && (
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', lineHeight: 1.5 }}>{ticket.description_en || ticket.description_es}</p>
                          )}
                          <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: '22px', fontWeight: 600, lineHeight: 1.3, overflow: 'visible' }} className="cl-gold-text">
                            {formatPrice(price, ticket.currency || 'EUR')}
                          </p>
                          {remaining <= 20 && remaining > 0 && <p style={{ fontSize: '12px', color: 'var(--amber)', marginTop: '4px' }}>Only {remaining} left</p>}
                          {!available && <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>Sold out</p>}
                        </div>
                        {available && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                            {qty > 0 && (
                              <>
                                <button onClick={() => removeFromCart(ticket.id)} style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--border-muted)', color: 'var(--text)', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                                <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--gold)', minWidth: '20px', textAlign: 'center' }}>{qty}</span>
                              </>
                            )}
                            <button onClick={() => addToCart(ticket)} style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #c9a85c, #e8d5a0)', border: 'none', color: '#09090f', cursor: 'pointer', fontSize: '20px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Bundles section */}
          {visibleBundles.length > 0 && (
            <div style={{ marginTop: '8px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)' }}>📦 Bundles</span>
                <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, var(--border), transparent)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {visibleBundles.map(bundle => {
                  const retail = bundleRetail(bundle);
                  const savings = retail - bundle.bundle_price;
                  const inCart = hasBundleInCart(bundle.id);
                  return (
                    <div key={bundle.id} style={{ background: 'var(--surface)', border: `1px solid ${inCart ? 'var(--gold)' : 'var(--border-muted)'}`, borderRadius: '14px', padding: '18px 20px', transition: 'border-color 0.2s' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>{bundle.name_en}</h3>
                          {bundle.description_en && <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', lineHeight: 1.5 }}>{bundle.description_en}</p>}
                          {/* Items */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                            {bundle.items.map((item, i) => (
                              <span key={i} style={{ fontSize: '12px', background: 'var(--surface-2)', border: '1px solid var(--border-muted)', borderRadius: '6px', padding: '3px 9px', color: 'var(--text-muted)' }}>
                                {item.quantity}× {item.ticket_name}
                              </span>
                            ))}
                          </div>
                          {/* Pricing */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            {retail > 0 && <span style={{ fontSize: '14px', color: 'var(--text-dim)', textDecoration: 'line-through' }}>{formatPrice(retail, bundle.currency)}</span>}
                            <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: '24px', fontWeight: 700 }} className="cl-gold-text">
                              {formatPrice(bundle.bundle_price, bundle.currency)}
                            </span>
                            {savings > 0 && <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--green)', background: 'rgba(92,184,138,0.12)', border: '1px solid rgba(92,184,138,0.2)', padding: '2px 8px', borderRadius: '6px' }}>Save {formatPrice(savings, bundle.currency)} ({Math.round(savings / retail * 100)}%)</span>}
                          </div>
                        </div>
                        <div style={{ flexShrink: 0 }}>
                          {inCart ? (
                            <button onClick={() => removeBundleFromCart(bundle.id)} style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(224,92,92,0.12)', border: '1px solid rgba(224,92,92,0.3)', color: 'var(--red)', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                          ) : (
                            <button onClick={() => addBundleToCart(bundle)} style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #c9a85c, #e8d5a0)', border: 'none', color: '#09090f', cursor: 'pointer', fontSize: '20px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ paddingTop: '16px', textAlign: 'center' }}>
            <div style={{ width: '100%', height: '1px', background: 'linear-gradient(90deg, transparent, var(--border), transparent)', marginBottom: '10px' }} />
            <p style={{ fontSize: '12px', color: 'var(--text-dim)', letterSpacing: '0.03em' }}>
              Select your tickets above, then tap <span style={{ color: 'var(--gold)', fontWeight: 600 }}>Continue →</span> below
            </p>
          </div>
        </div>
      )}

      {/* ── Seat selection ── */}
      {step === 'seats' && (
        <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 20px 0' }}>
          {seatMapLoading && <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>Loading venue map…</p>}
          {!seatMapLoading && seatMap && <SeatPicker seatMap={seatMap} totalRequired={seatTickets} selected={selectedSeats} onSelect={setSelectedSeats} />}
          {!seatMapLoading && !seatMap && <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>No seat map configured for this event.</p>}
          <div style={{ paddingTop: '16px', textAlign: 'center' }}>
            <div style={{ width: '100%', height: '1px', background: 'linear-gradient(90deg, transparent, var(--border), transparent)', marginBottom: '10px' }} />
            <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
              Select {seatTickets} spot{seatTickets !== 1 ? 's' : ''}, then tap <span style={{ color: 'var(--gold)', fontWeight: 600 }}>Confirm Seats →</span>
            </p>
          </div>
        </div>
      )}

      {/* ── Attendees ── */}
      {step === 'attendees' && (
        <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 20px 0', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Email */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px' }}>
            <label style={labelStyle}>Your Email *</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" style={inputStyle} />
            <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '6px' }}>Tickets will be sent to this address</p>
          </div>

          {/* Regular cart attendees */}
          {cart.map((item, ci) =>
            item.attendees.map((att, ai) => (
              <AttendeeFields
                key={`cart-${ci}-${ai}`}
                att={att}
                onChange={(field, val) => updateAttendee(ci, ai, field, val)}
                label={`${item.ticket.name_en || item.ticket.name_es}${item.attendees.length > 1 ? ` · Person ${ai + 1}` : ''}`}
                fields={item.ticket}
              />
            ))
          )}

          {/* Bundle cart attendees */}
          {bundleCart.map(bc =>
            bc.bundle.items.map(bitem =>
              (bc.attendees[bitem.ticket_type_id] || []).map((att, ai) => (
                <AttendeeFields
                  key={`bundle-${bc.bundle.id}-${bitem.ticket_type_id}-${ai}`}
                  att={att}
                  onChange={(field, val) => updateBundleAttendee(bc.bundle.id, bitem.ticket_type_id, ai, field, val)}
                  label={`📦 ${bc.bundle.name_en} — ${bitem.ticket_name}${bitem.quantity > 1 ? ` · Person ${ai + 1}` : ''}`}
                  fields={bitem}
                />
              ))
            )
          )}

          <div style={{ paddingTop: '16px', textAlign: 'center' }}>
            <div style={{ width: '100%', height: '1px', background: 'linear-gradient(90deg, transparent, var(--border), transparent)', marginBottom: '10px' }} />
            <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
              That&apos;s everything — tap <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{hasAddonStep ? 'Choose Extras →' : 'Review Order →'}</span> to continue
            </p>
          </div>
        </div>
      )}

      {/* ── Add-ons ── */}
      {step === 'addons' && (
        <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 20px 0' }}>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: '24px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>Enhance your night ✦</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Optional extras — add what you'd like, or skip</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            {addonStepAddons.map(addon => {
              const qty = getAddonQty(addon.id);
              const available = addon.stock_total !== null ? addon.stock_total - addon.stock_sold : Infinity;
              const canAdd = qty < addon.max_per_order && qty < available;
              return (
                <div key={addon.id} style={{ background: 'var(--surface)', border: `1px solid ${qty > 0 ? 'var(--border)' : 'var(--border-muted)'}`, borderRadius: '14px', padding: '16px 20px', transition: 'border-color 0.2s' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '2px' }}>{addon.name_en}</h3>
                      {addon.description_en && <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px', lineHeight: 1.5 }}>{addon.description_en}</p>}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: '20px', fontWeight: 600 }} className="cl-gold-text">
                          {formatPrice(addon.price, addon.currency)}
                          {addon.scope === 'per_attendee' && <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--text-dim)' }}> / person</span>}
                        </span>
                        {addon.generates_voucher && <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '2px 7px', borderRadius: '6px', background: 'rgba(138,180,232,0.12)', color: '#8ab4e8' }}>QR voucher</span>}
                        {addon.stock_total !== null && available <= 10 && <span style={{ fontSize: '11px', color: 'var(--amber)' }}>Only {available} left</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                      {qty > 0 && (
                        <>
                          <button onClick={() => addAddon(addon, -1)} style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--border-muted)', color: 'var(--text)', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                          <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--gold)', minWidth: '20px', textAlign: 'center' }}>{qty}</span>
                        </>
                      )}
                      <button onClick={() => addAddon(addon, 1)} disabled={!canAdd} style={{ width: '34px', height: '34px', borderRadius: '50%', background: canAdd ? 'linear-gradient(135deg, #c9a85c, #e8d5a0)' : 'var(--surface-2)', border: 'none', color: canAdd ? '#09090f' : 'var(--text-dim)', cursor: canAdd ? 'pointer' : 'not-allowed', fontSize: '20px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Addon cart summary */}
          {addonCart.filter(ac => addonStepAddons.some(a => a.id === ac.addon.id)).length > 0 && (
            <div style={{ background: 'rgba(201,168,92,0.06)', border: '1px solid rgba(201,168,92,0.15)', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '8px' }}>Added extras</p>
              {addonCart.filter(ac => addonStepAddons.some(a => a.id === ac.addon.id)).map(ac => (
                <div key={ac.addon.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '3px 0' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{ac.addon.name_en} × {ac.quantity}</span>
                  <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{formatPrice(ac.addon.price * ac.quantity, ac.addon.currency)}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ paddingTop: '16px', textAlign: 'center' }}>
            <div style={{ width: '100%', height: '1px', background: 'linear-gradient(90deg, transparent, var(--border), transparent)', marginBottom: '10px' }} />
            <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
              Add extras above, then tap <span style={{ color: 'var(--gold)', fontWeight: 600 }}>Review Order →</span> — or skip below
            </p>
          </div>

        </div>
      )}

      {/* ── Review ── */}
      {step === 'review' && (
        <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 20px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px' }}>
            <p style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px' }}>Order Summary</p>
            {cart.map(item => (
              <div key={item.ticket.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-muted)' }}>
                <span style={{ fontSize: '14px', color: 'var(--text)' }}>{item.ticket.name_en || item.ticket.name_es} × {item.quantity}</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gold)' }}>{formatPrice(getCurrentPrice(item.ticket) * item.quantity, item.ticket.currency || 'EUR')}</span>
              </div>
            ))}
            {bundleCart.map(bc => {
              const retail = bundleRetail(bc.bundle);
              const savings = retail - bc.bundle.bundle_price;
              return (
                <div key={bc.bundle.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border-muted)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '14px', color: 'var(--text)' }}>📦 {bc.bundle.name_en}</span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gold)' }}>{formatPrice(bc.bundle.bundle_price, bc.bundle.currency)}</span>
                  </div>
                  {savings > 0 && (
                    <p style={{ fontSize: '12px', color: 'var(--green)', marginTop: '2px' }}>You save {formatPrice(savings, bc.bundle.currency)} vs. buying individually</p>
                  )}
                </div>
              );
            })}
            {addonCart.map(ac => (
              <div key={ac.addon.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-muted)' }}>
                <span style={{ fontSize: '14px', color: 'var(--text)' }}>✨ {ac.addon.name_en} × {ac.quantity}</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gold)' }}>{formatPrice(ac.addon.price * ac.quantity, ac.addon.currency)}</span>
              </div>
            ))}

            {/* Review-rail add-ons */}
            {reviewRailAddons.length > 0 && (
              <div style={{ paddingTop: '8px' }}>
                <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--green)', marginBottom: '8px' }}>Also available</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {reviewRailAddons.map(addon => {
                    const qty = getAddonQty(addon.id);
                    const available = addon.stock_total !== null ? addon.stock_total - addon.stock_sold : Infinity;
                    const canAdd = qty < addon.max_per_order && qty < available;
                    return (
                      <div key={addon.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-2)', border: '1px solid var(--border-muted)', borderRadius: '10px', padding: '10px 14px', gap: '12px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{addon.name_en}</span>
                          <span style={{ fontSize: '13px', color: 'var(--gold)', fontWeight: 700, marginLeft: '10px' }}>{formatPrice(addon.price, addon.currency)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                          {qty > 0 && (
                            <>
                              <button onClick={() => addAddon(addon, -1)} style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--border-muted)', color: 'var(--text)', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--gold)', minWidth: '16px', textAlign: 'center' }}>{qty}</span>
                            </>
                          )}
                          <button onClick={() => addAddon(addon, 1)} disabled={!canAdd} style={{ width: '28px', height: '28px', borderRadius: '50%', background: canAdd ? 'linear-gradient(135deg, #c9a85c, #e8d5a0)' : 'var(--surface)', border: 'none', color: canAdd ? '#09090f' : 'var(--text-dim)', cursor: canAdd ? 'pointer' : 'not-allowed', fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {/* ── Promo code ── */}
            <div style={{ borderTop: '1px solid var(--border-muted)', paddingTop: '14px', marginTop: '4px' }}>
              {!appliedPromo ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    value={promoInput}
                    onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoError(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleApplyPromo()}
                    placeholder="Promo code"
                    style={{ flex: 1, background: 'var(--surface-2)', border: `1px solid ${promoError ? 'var(--red)' : 'var(--border-muted)'}`, color: 'var(--text)', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', letterSpacing: '0.08em', outline: 'none' }}
                  />
                  <button
                    onClick={handleApplyPromo}
                    disabled={promoLoading || !promoInput.trim()}
                    style={{ padding: '10px 16px', borderRadius: '10px', border: 'none', background: promoInput.trim() ? 'linear-gradient(135deg, #c9a85c, #e8d5a0)' : 'var(--surface-2)', color: promoInput.trim() ? '#09090f' : 'var(--text-dim)', fontWeight: 700, fontSize: '13px', cursor: promoInput.trim() ? 'pointer' : 'not-allowed', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}
                  >
                    {promoLoading ? '…' : 'Apply'}
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(100,200,120,0.07)', border: '1px solid rgba(100,200,120,0.2)', borderRadius: '10px', padding: '10px 14px' }}>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--green)', letterSpacing: '0.06em' }}>✓ {appliedPromo.code}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>{appliedPromo.label}</span>
                  </div>
                  <button onClick={() => { setAppliedPromo(null); setPromoError(''); }} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '16px', lineHeight: 1, padding: '0 4px' }}>×</button>
                </div>
              )}
              {promoError && <p style={{ fontSize: '12px', color: 'var(--red)', marginTop: '6px' }}>{promoError}</p>}
            </div>

            {/* Discount line */}
            {appliedPromo && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid var(--border-muted)', marginTop: '4px' }}>
                <span style={{ fontSize: '14px', color: 'var(--green)' }}>Discount ({appliedPromo.label})</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--green)' }}>−{formatPrice(promoDiscountAmount, cartCurrency)}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '14px', paddingBottom: '16px', borderTop: '1px solid var(--border-muted)', marginTop: '4px' }}>
              <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: '20px', fontWeight: 600, color: 'var(--text)' }}>Total</span>
              <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: '24px', fontWeight: 700 }} className="cl-gold-text">{formatPrice(totalPrice, cartCurrency)}</span>
            </div>
            <div style={{ borderTop: '1px solid var(--border-muted)', paddingTop: '14px' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>📧 Tickets will be sent to <strong style={{ color: 'var(--text)', fontWeight: 700 }}>{email}</strong></p>
            </div>
          </div>
          {error && <p style={{ color: 'var(--red)', fontSize: '13px', marginTop: '8px' }}>{error}</p>}

          <div style={{ paddingTop: '16px', textAlign: 'center' }}>
            <div style={{ width: '100%', height: '1px', background: 'linear-gradient(90deg, transparent, var(--border), transparent)', marginBottom: '10px' }} />
            <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Review complete — tap <span style={{ color: 'var(--gold)', fontWeight: 600 }}>Pay</span> to complete your order</p>
          </div>
        </div>
      )}

      {/* ── Sticky CTA ── */}
      {totalItems > 0 && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(9,9,15,0.95)', backdropFilter: 'blur(20px)', borderTop: '1px solid var(--border)', padding: '12px 20px 16px', zIndex: 40, maxWidth: '640px', marginLeft: 'auto', marginRight: 'auto' }}>
          {error && (step === 'browse' || step === 'seats') && <p style={{ color: 'var(--red)', fontSize: '12px', marginBottom: '6px' }}>{error}</p>}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {totalItems} ticket{totalItems !== 1 ? 's' : ''}
              {bundleCart.length > 0 && ` · ${bundleCart.length} bundle${bundleCart.length !== 1 ? 's' : ''}`}
              {addonCart.length > 0 && ` · ${addonCart.reduce((s, a) => s + a.quantity, 0)} extra${addonCart.reduce((s, a) => s + a.quantity, 0) !== 1 ? 's' : ''}`}
            </span>
            <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: '20px', fontWeight: 600 }} className="cl-gold-text">{formatPrice(totalPrice, cartCurrency)}</span>
          </div>

          {step === 'browse' && (
            <button onClick={handleContinueFromBrowse} style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', fontSize: '14px', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', background: 'linear-gradient(135deg, #c9a85c, #e8d5a0)', color: '#09090f', fontWeight: 700 }}>
              Continue →
            </button>
          )}
          {step === 'seats' && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setStep('browse')} style={{ padding: '16px 20px', borderRadius: '12px', background: 'var(--surface-2)', border: '1px solid var(--border-muted)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px' }}>← Back</button>
              <button onClick={handleConfirmSeats} disabled={submitting} style={{ flex: 1, padding: '16px', borderRadius: '12px', border: 'none', background: submitting ? 'var(--surface-3)' : 'linear-gradient(135deg, #c9a85c, #e8d5a0)', color: submitting ? 'var(--text-muted)' : '#09090f', fontWeight: 700, fontSize: '14px', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: submitting ? 'not-allowed' : 'pointer' }}>
                {submitting ? 'Reserving…' : `Confirm Seats (${selectedSeats.length}/${seatTickets}) →`}
              </button>
            </div>
          )}
          {step === 'attendees' && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setStep('browse')} style={{ padding: '16px 20px', borderRadius: '12px', background: 'var(--surface-2)', border: '1px solid var(--border-muted)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px' }}>← Back</button>
              <button onClick={handleContinueFromAttendees} style={{ flex: 1, padding: '16px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #c9a85c, #e8d5a0)', color: '#09090f', fontWeight: 700, fontSize: '14px', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>
                {hasAddonStep ? 'Choose Extras →' : 'Review Order →'}
              </button>
            </div>
          )}
          {step === 'addons' && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setStep('attendees')} style={{ padding: '16px 20px', borderRadius: '12px', background: 'var(--surface-2)', border: '1px solid var(--border-muted)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px' }}>← Back</button>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <button onClick={() => setStep('review')} style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #c9a85c, #e8d5a0)', color: '#09090f', fontWeight: 700, fontSize: '14px', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>
                  Review Order →
                </button>
                {addonCart.filter(ac => addonStepAddons.some(a => a.id === ac.addon.id)).length === 0 && (
                  <button onClick={() => setStep('review')} style={{ width: '100%', padding: '8px', borderRadius: '10px', border: 'none', background: 'transparent', color: 'var(--text-dim)', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}>
                    Skip, no extras needed
                  </button>
                )}
              </div>
            </div>
          )}
          {step === 'review' && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setStep(hasAddonStep ? 'addons' : 'attendees')} style={{ padding: '16px 20px', borderRadius: '12px', background: 'var(--surface-2)', border: '1px solid var(--border-muted)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px' }}>← Back</button>
              <button onClick={handleCheckout} disabled={submitting} style={{ flex: 1, padding: '16px', borderRadius: '12px', border: 'none', background: submitting ? 'var(--surface-3)' : 'linear-gradient(135deg, #c9a85c, #e8d5a0)', color: submitting ? 'var(--text-muted)' : '#09090f', fontWeight: 700, fontSize: '14px', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: submitting ? 'not-allowed' : 'pointer' }}>
                {submitting ? 'Redirecting to Stripe…' : `Pay ${formatPrice(totalPrice, cartCurrency)}`}
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
