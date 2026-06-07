'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface PriceTier {
  id?: string;
  valid_until: string;
  price: number;
}

interface TicketType {
  id: string;
  name_es: string;
  name_en: string;
  description_es: string;
  description_en: string;
  ticket_category: string;
  stock_total: number;
  stock_sold: number;
  attendees_per_ticket: number;
  units_per_order: number;
  price_scaling: string;
  base_price: number;
  visibility: string;
  available_from: string;
  available_until: string;
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

const blankTicket = (): Omit<TicketType, 'id' | 'stock_sold'> => ({
  name_es: '', name_en: '',
  description_es: '', description_en: '',
  ticket_category: 'full_pass',
  stock_total: 100, attendees_per_ticket: 1, units_per_order: 1,
  price_scaling: 'fixed', base_price: 0,
  visibility: 'visible', available_from: '', available_until: '',
  collect_full_name: true, collect_email: true, collect_phone: false,
  collect_gender: false, collect_role: false, collect_passport: false,
  collect_country: false, collect_city: false,
  price_tiers: [],
});

type FormTicket = Omit<TicketType, 'id' | 'stock_sold'> & { price_tiers: PriceTier[] };

export default function TicketConfigPage() {
  const { id: eventId } = useParams<{ id: string }>();
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormTicket>({ ...blankTicket(), price_tiers: [] });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'prices' | 'fields' | 'advanced'>('general');

  const load = () => {
    fetch(`/api/admin/events/${eventId}/tickets`)
      .then(r => r.json())
      .then(setTickets);
  };

  useEffect(() => { load(); }, [eventId]);

  const openNew = () => {
    setForm({ ...blankTicket(), price_tiers: [] });
    setEditingId(null);
    setActiveTab('general');
    setShowForm(true);
  };

  const openEdit = (t: TicketType) => {
    setForm({
      ...t,
      price_tiers: t.price_tiers || [],
      available_from: t.available_from ? t.available_from.slice(0, 16) : '',
      available_until: t.available_until ? t.available_until.slice(0, 16) : '',
    });
    setEditingId(t.id);
    setActiveTab('general');
    setShowForm(true);
  };

  const set = <K extends keyof FormTicket>(k: K, v: FormTicket[K]) => setForm(f => ({ ...f, [k]: v }));

  const addTier = () => setForm(f => ({ ...f, price_tiers: [...f.price_tiers, { valid_until: '', price: 0 }] }));
  const updateTier = (i: number, field: keyof PriceTier, val: string | number) =>
    setForm(f => ({ ...f, price_tiers: f.price_tiers.map((t, ti) => ti === i ? { ...t, [field]: val } : t) }));
  const removeTier = (i: number) => setForm(f => ({ ...f, price_tiers: f.price_tiers.filter((_, ti) => ti !== i) }));

  const save = async () => {
    setSaving(true);
    const url = editingId
      ? `/api/admin/tickets/${editingId}`
      : `/api/admin/events/${eventId}/tickets`;
    const method = editingId ? 'PUT' : 'POST';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    load();
    setShowForm(false);
    setSaving(false);
  };

  const deleteTicket = async (tid: string) => {
    if (!confirm('Delete this ticket type?')) return;
    await fetch(`/api/admin/tickets/${tid}`, { method: 'DELETE' });
    load();
  };

  const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <label className="flex items-center gap-3 cursor-pointer py-1">
      <div onClick={() => onChange(!checked)}
        className={`relative w-10 h-6 rounded-full transition-colors ${checked ? 'cl-gradient' : 'bg-gray-200'}`}>
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'left-5' : 'left-1'}`} />
      </div>
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );

  const tabs = ['general', 'prices', 'fields', 'advanced'] as const;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/events" className="text-gray-400 hover:text-gray-600">← Events</Link>
        <h1 className="text-2xl font-bold">Ticket Types</h1>
      </div>

      {/* Ticket List */}
      {!showForm && (
        <>
          <div className="space-y-3 mb-4">
            {tickets.map(t => (
              <div key={t.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{t.name_en || t.name_es}</h3>
                    <p className="text-sm text-gray-500">
                      {t.stock_sold}/{t.stock_total} sold · €{Number(t.base_price).toFixed(0)}
                      {t.price_scaling === 'by_date' ? '–' + (t.price_tiers?.at(-1)?.price ?? '?') : ''}
                      {' '} · {t.visibility}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(t)} className="text-blue-500 text-sm hover:underline">Edit</button>
                    <button onClick={() => deleteTicket(t.id)} className="text-red-400 text-sm hover:underline">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button onClick={openNew} className="cl-gradient text-white font-semibold px-5 py-2.5 rounded-xl text-sm">
            + Add Ticket Type
          </button>
        </>
      )}

      {/* Ticket Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 max-w-2xl">
          {/* Tabs */}
          <div className="flex border-b border-gray-100 px-4 pt-4">
            {tabs.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg mr-1 capitalize transition-colors
                  ${activeTab === tab ? 'cl-gradient text-white' : 'text-gray-500 hover:text-gray-700'}`}>
                {tab}
              </button>
            ))}
          </div>

          <div className="p-5 space-y-4">
            {/* General Tab */}
            {activeTab === 'general' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500">Name (Spanish) *</label>
                    <input value={form.name_es} onChange={e => set('name_es', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-0.5 focus:outline-none focus:border-pink-400" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Name (English)</label>
                    <input value={form.name_en} onChange={e => set('name_en', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-0.5 focus:outline-none focus:border-pink-400" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Description (Spanish)</label>
                  <textarea value={form.description_es} onChange={e => set('description_es', e.target.value)} rows={2}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-0.5 focus:outline-none focus:border-pink-400 resize-none" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Description (English)</label>
                  <textarea value={form.description_en} onChange={e => set('description_en', e.target.value)} rows={2}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-0.5 focus:outline-none focus:border-pink-400 resize-none" />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-gray-500">Total stock</label>
                    <input type="number" value={form.stock_total} onChange={e => set('stock_total', Number(e.target.value))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-0.5 focus:outline-none focus:border-pink-400" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Visibility</label>
                    <select value={form.visibility} onChange={e => set('visibility', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-0.5 focus:outline-none focus:border-pink-400 bg-white">
                      <option value="visible">Visible</option>
                      <option value="hidden">Hidden</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Category</label>
                    <select value={form.ticket_category} onChange={e => set('ticket_category', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-0.5 focus:outline-none focus:border-pink-400 bg-white">
                      <option value="full_pass">Full Pass</option>
                      <option value="day_pass">Day Pass</option>
                      <option value="pack">Pack</option>
                      <option value="vip">VIP</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Prices Tab */}
            {activeTab === 'prices' && (
              <>
                <div>
                  <label className="text-xs text-gray-500">Price scaling</label>
                  <select value={form.price_scaling} onChange={e => set('price_scaling', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-0.5 focus:outline-none focus:border-pink-400 bg-white">
                    <option value="fixed">Fixed price</option>
                    <option value="by_date">Scaled by dates</option>
                  </select>
                </div>

                {form.price_scaling === 'fixed' && (
                  <div>
                    <label className="text-xs text-gray-500">Price (€)</label>
                    <input type="number" value={form.base_price} onChange={e => set('base_price', Number(e.target.value))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-0.5 focus:outline-none focus:border-pink-400" />
                  </div>
                )}

                {form.price_scaling === 'by_date' && (
                  <div className="space-y-3">
                    <p className="text-xs text-gray-500">Set price tiers by deadline. The first matching date is used.</p>
                    {form.price_tiers.map((tier, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="flex-1">
                          <label className="text-xs text-gray-400">Until</label>
                          <input type="date" value={tier.valid_until.slice(0, 10)} onChange={e => updateTier(i, 'valid_until', e.target.value + 'T23:59:00')}
                            className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm mt-0.5 focus:outline-none focus:border-pink-400" />
                        </div>
                        <div className="w-24">
                          <label className="text-xs text-gray-400">Price €</label>
                          <input type="number" value={tier.price} onChange={e => updateTier(i, 'price', Number(e.target.value))}
                            className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm mt-0.5 focus:outline-none focus:border-pink-400" />
                        </div>
                        <button onClick={() => removeTier(i)} className="text-red-400 text-sm mt-4">✕</button>
                      </div>
                    ))}
                    <div>
                      <label className="text-xs text-gray-400">Final price €</label>
                      <input type="number" value={form.base_price} onChange={e => set('base_price', Number(e.target.value))}
                        className="w-32 border border-gray-200 rounded-lg px-2 py-1.5 text-sm mt-0.5 focus:outline-none focus:border-pink-400" />
                    </div>
                    <button onClick={addTier} className="text-pink-500 text-sm font-medium">+ Add tier</button>
                  </div>
                )}
              </>
            )}

            {/* Fields Tab */}
            {activeTab === 'fields' && (
              <div className="space-y-1">
                <p className="text-xs text-gray-500 mb-3">Select data to collect from each attendee. First + last name always collected.</p>
                {([
                  ['collect_email', 'Email'],
                  ['collect_phone', 'Phone'],
                  ['collect_gender', 'Gender'],
                  ['collect_role', 'Dance role (leader/follower/both)'],
                  ['collect_passport', 'Document / Passport number'],
                  ['collect_country', 'Country of residence'],
                  ['collect_city', 'City'],
                ] as const).map(([field, label]) => (
                  <div key={field} onClick={() => set(field, !form[field])} className="cursor-pointer">
                    <div className="flex items-center justify-between py-2 border-b border-gray-50">
                      <span className="text-sm text-gray-700">{label}</span>
                      <div className={`w-10 h-6 rounded-full relative transition-colors ${form[field] ? 'cl-gradient' : 'bg-gray-200'}`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form[field] ? 'left-5' : 'left-1'}`} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Advanced Tab */}
            {activeTab === 'advanced' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500">Attendees per ticket</label>
                    <select value={form.attendees_per_ticket} onChange={e => set('attendees_per_ticket', Number(e.target.value))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-0.5 focus:outline-none focus:border-pink-400 bg-white">
                      {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <p className="text-xs text-gray-400 mt-1">Use 2 for Couple Pass etc.</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Units per order</label>
                    <select value={form.units_per_order} onChange={e => set('units_per_order', Number(e.target.value))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-0.5 focus:outline-none focus:border-pink-400 bg-white">
                      {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-500">Available from</label>
                  <input type="datetime-local" value={form.available_from} onChange={e => set('available_from', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-0.5 focus:outline-none focus:border-pink-400" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Available until</label>
                  <input type="datetime-local" value={form.available_until} onChange={e => set('available_until', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-0.5 focus:outline-none focus:border-pink-400" />
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 px-5 pb-5">
            <button onClick={() => setShowForm(false)} className="flex-none border border-gray-200 text-gray-600 font-medium py-2.5 px-5 rounded-xl text-sm">
              Cancel
            </button>
            <button onClick={save} disabled={saving} className="flex-1 cl-gradient text-white font-bold py-2.5 rounded-xl text-sm disabled:opacity-70">
              {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Ticket Type'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
