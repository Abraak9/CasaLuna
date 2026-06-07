'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
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
        // Increase attendees array
        const newAttendees = [...existing.attendees, ...Array(ticket.attendees_per_ticket).fill(null).map(emptyAttendee)];
        return prev.map(c => c.ticket.id === ticket.id
          ? { ...c, quantity: c.quantity + 1, attendees: newAttendees }
          : c
        );
      }
      return [...prev, {
        ticket,
        quantity: 1,
        attendees: Array(ticket.attendees_per_ticket).fill(null).map(emptyAttendee),
      }];
    });
  };

  const removeFromCart = (ticketId: string) => {
    setCart(prev => {
      const existing = prev.find(c => c.ticket.id === ticketId);
      if (!existing || existing.quantity <= 1) return prev.filter(c => c.ticket.id !== ticketId);
      const newAttendees = existing.attendees.slice(0, (existing.quantity - 1) * existing.ticket.attendees_per_ticket);
      return prev.map(c => c.ticket.id === ticketId
        ? { ...c, quantity: c.quantity - 1, attendees: newAttendees }
        : c
      );
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
          event_slug: slug,
          email,
          items: cart.map(c => ({
            ticket_type_id: c.ticket.id,
            quantity: c.quantity,
            attendees: c.attendees,
          })),
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

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="cl-gradient w-8 h-8 rounded-full animate-pulse" /></div>;
  if (!event) return <div className="min-h-screen flex items-center justify-center text-gray-500">Event not found</div>;

  const eventDate = new Date(event.date).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const eventTime = new Date(event.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  return (
    <main className="min-h-screen bg-gray-50 pb-32">
      {/* Hero */}
      <div className="relative">
        {event.cover_image_url ? (
          <div className="relative h-56 bg-gray-200">
            <Image src={event.cover_image_url} alt={event.name_en || event.name_es} fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        ) : (
          <div className="h-56 cl-gradient" />
        )}
        <button onClick={() => router.back()} className="absolute top-4 left-4 bg-white/20 backdrop-blur-sm text-white rounded-full w-10 h-10 flex items-center justify-center text-lg">←</button>
      </div>

      {/* Event Info */}
      <div className="bg-white px-4 py-5 -mt-6 rounded-t-3xl relative">
        <h1 className="text-2xl font-bold">{event.name_en || event.name_es}</h1>
        <p className="text-gray-500 text-sm mt-1">📅 {eventDate} · {eventTime}</p>
        {event.location_name && (
          <p className="text-gray-500 text-sm">📍 {event.location_name}{event.location_city ? `, ${event.location_city}` : ''}</p>
        )}
        {(event.description_en || event.description_es) && (
          <p className="text-gray-600 text-sm mt-3 leading-relaxed">{event.description_en || event.description_es}</p>
        )}
      </div>

      {/* Step: Browse Tickets */}
      {step === 'browse' && (
        <div className="px-4 mt-4 space-y-3 max-w-2xl mx-auto">
          <h2 className="font-bold text-lg">Tickets</h2>
          {ticketTypes.filter(t => t.visibility !== 'hidden').map(ticket => {
            const price = getCurrentPrice(ticket);
            const available = isTicketAvailable(ticket);
            const qty = getQuantity(ticket.id);
            const remaining = ticket.stock_total - ticket.stock_sold;

            return (
              <div key={ticket.id} className={`bg-white rounded-2xl p-4 border ${available ? 'border-gray-100' : 'border-gray-100 opacity-60'}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold">{ticket.name_en || ticket.name_es}</h3>
                    {(ticket.description_en || ticket.description_es) && (
                      <p className="text-gray-500 text-xs mt-0.5">{ticket.description_en || ticket.description_es}</p>
                    )}
                    <p className="text-lg font-bold mt-1 cl-text-gradient">{formatPrice(price)}</p>
                    {remaining <= 20 && remaining > 0 && (
                      <p className="text-orange-500 text-xs mt-0.5">Only {remaining} left!</p>
                    )}
                    {!available && <p className="text-gray-400 text-xs mt-0.5">Sold out</p>}
                  </div>

                  {available && (
                    <div className="flex items-center gap-2 ml-4 mt-1">
                      {qty > 0 && (
                        <>
                          <button onClick={() => removeFromCart(ticket.id)} className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-lg font-bold text-gray-600">−</button>
                          <span className="w-6 text-center font-bold">{qty}</span>
                        </>
                      )}
                      <button onClick={() => addToCart(ticket)} className="w-9 h-9 rounded-full cl-gradient text-white flex items-center justify-center text-lg font-bold shadow-sm">+</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Step: Attendee Details */}
      {step === 'attendees' && (
        <div className="px-4 mt-4 max-w-2xl mx-auto space-y-6">
          <h2 className="font-bold text-lg">Attendee Details</h2>

          {/* Contact email */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <label className="text-sm font-medium text-gray-700 block mb-1">Your Email <span className="text-red-500">*</span></label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-pink-400"
            />
            <p className="text-xs text-gray-400 mt-1">Tickets will be sent to this address</p>
          </div>

          {cart.map((item, ci) =>
            item.attendees.map((att, ai) => (
              <div key={`${ci}-${ai}`} className="bg-white rounded-2xl p-4 border border-gray-100">
                <h3 className="font-semibold text-sm text-gray-700 mb-3">
                  {item.ticket.name_en || item.ticket.name_es}
                  {item.attendees.length > 1 ? ` · Person ${ai + 1}` : ''}
                </h3>
                <div className="space-y-3">
                  {item.ticket.collect_full_name && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-500">First name *</label>
                        <input value={att.first_name} onChange={e => updateAttendee(ci, ai, 'first_name', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-0.5 focus:outline-none focus:border-pink-400" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Last name *</label>
                        <input value={att.last_name} onChange={e => updateAttendee(ci, ai, 'last_name', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-0.5 focus:outline-none focus:border-pink-400" />
                      </div>
                    </div>
                  )}
                  {item.ticket.collect_phone && (
                    <div>
                      <label className="text-xs text-gray-500">Phone</label>
                      <input type="tel" value={att.phone} onChange={e => updateAttendee(ci, ai, 'phone', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-0.5 focus:outline-none focus:border-pink-400" />
                    </div>
                  )}
                  {item.ticket.collect_gender && (
                    <div>
                      <label className="text-xs text-gray-500">Gender</label>
                      <select value={att.gender} onChange={e => updateAttendee(ci, ai, 'gender', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-0.5 focus:outline-none focus:border-pink-400 bg-white">
                        <option value="">Select...</option>
                        <option>Male</option><option>Female</option><option>Non-binary</option><option>Prefer not to say</option>
                      </select>
                    </div>
                  )}
                  {item.ticket.collect_role && (
                    <div>
                      <label className="text-xs text-gray-500">Dance role</label>
                      <select value={att.role} onChange={e => updateAttendee(ci, ai, 'role', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-0.5 focus:outline-none focus:border-pink-400 bg-white">
                        <option value="">Select...</option>
                        <option value="leader">Leader</option><option value="follower">Follower</option><option value="both">Both</option>
                      </select>
                    </div>
                  )}
                  {item.ticket.collect_country && (
                    <div>
                      <label className="text-xs text-gray-500">Country of residence</label>
                      <input value={att.residence_country} onChange={e => updateAttendee(ci, ai, 'residence_country', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-0.5 focus:outline-none focus:border-pink-400" />
                    </div>
                  )}
                  {item.ticket.collect_city && (
                    <div>
                      <label className="text-xs text-gray-500">City</label>
                      <input value={att.residence_city} onChange={e => updateAttendee(ci, ai, 'residence_city', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-0.5 focus:outline-none focus:border-pink-400" />
                    </div>
                  )}
                  {item.ticket.collect_passport && (
                    <div>
                      <label className="text-xs text-gray-500">Document / Passport number</label>
                      <input value={att.passport_number} onChange={e => updateAttendee(ci, ai, 'passport_number', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-0.5 focus:outline-none focus:border-pink-400" />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Step: Review */}
      {step === 'review' && (
        <div className="px-4 mt-4 max-w-2xl mx-auto space-y-4">
          <h2 className="font-bold text-lg">Order Summary</h2>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 space-y-2">
            {cart.map(item => (
              <div key={item.ticket.id} className="flex justify-between text-sm">
                <span>{item.ticket.name_en || item.ticket.name_es} × {item.quantity}</span>
                <span className="font-medium">{formatPrice(getCurrentPrice(item.ticket) * item.quantity)}</span>
              </div>
            ))}
            <div className="border-t border-gray-100 pt-2 flex justify-between font-bold">
              <span>Total</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
          </div>
          <div className="bg-gray-50 rounded-2xl p-4 text-sm text-gray-600">
            <p>📧 Tickets sent to: <strong>{email}</strong></p>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
      )}

      {/* Sticky Bottom CTA */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 safe-area-inset-bottom max-w-2xl mx-auto">
          {error && step === 'browse' && <p className="text-red-500 text-xs mb-2">{error}</p>}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">{totalItems} ticket{totalItems > 1 ? 's' : ''}</span>
            <span className="font-bold">{formatPrice(totalPrice)}</span>
          </div>

          {step === 'browse' && (
            <button onClick={() => setStep('attendees')} className="w-full cl-gradient text-white font-bold py-3.5 rounded-2xl text-base shadow-lg active:opacity-90">
              Continue →
            </button>
          )}
          {step === 'attendees' && (
            <div className="flex gap-2">
              <button onClick={() => setStep('browse')} className="flex-none border border-gray-200 text-gray-600 font-medium py-3.5 px-5 rounded-2xl text-sm">Back</button>
              <button onClick={() => setStep('review')} className="flex-1 cl-gradient text-white font-bold py-3.5 rounded-2xl text-base shadow-lg active:opacity-90">
                Review Order →
              </button>
            </div>
          )}
          {step === 'review' && (
            <div className="flex gap-2">
              <button onClick={() => setStep('attendees')} className="flex-none border border-gray-200 text-gray-600 font-medium py-3.5 px-5 rounded-2xl text-sm">Back</button>
              <button onClick={handleCheckout} disabled={submitting} className="flex-1 cl-gradient text-white font-bold py-3.5 rounded-2xl text-base shadow-lg active:opacity-90 disabled:opacity-70">
                {submitting ? 'Redirecting...' : `Pay ${formatPrice(totalPrice)}`}
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
