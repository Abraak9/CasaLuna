'use client';

import { useEffect, useState } from 'react';

interface Promoter {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  commission_type: string;
  commission_value: number;
  promo_code: string | null;
  total_sales: number;
  total_commission: number;
  orders_count: number;
  actual_sales: number;
  status: string;
  notes: string | null;
}

const S: Record<string, React.CSSProperties> = {
  label: { fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' },
  input: { background: 'var(--surface-2)', border: '1px solid var(--border-muted)', color: 'var(--text)', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', width: '100%', outline: 'none' },
};

const blankForm = () => ({ name: '', email: '', phone: '', commission_type: 'percentage', commission_value: '', promo_code: '', notes: '', status: 'active' });

export default function PromotersPage() {
  const [promoters, setPromoters] = useState<Promoter[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(blankForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => fetch('/api/admin/promoters').then(r => r.json()).then(setPromoters);
  useEffect(() => { load(); }, []);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const openNew = () => { setForm(blankForm()); setEditId(null); setShowForm(true); setError(''); };
  const openEdit = (p: Promoter) => {
    setForm({ name: p.name, email: p.email || '', phone: p.phone || '', commission_type: p.commission_type, commission_value: String(p.commission_value), promo_code: p.promo_code || '', notes: p.notes || '', status: p.status });
    setEditId(p.id); setShowForm(true); setError('');
  };

  const save = async () => {
    if (!form.name) { setError('Name required'); return; }
    setSaving(true); setError('');
    const url = editId ? `/api/admin/promoters/${editId}` : '/api/admin/promoters';
    const res = await fetch(url, {
      method: editId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, commission_value: Number(form.commission_value) || 0 }),
    });
    if (!res.ok) { const d = await res.json(); setError(d.error || 'Failed'); setSaving(false); return; }
    load(); setShowForm(false); setSaving(false);
  };

  const del = async (id: string) => {
    if (!confirm('Delete this promoter?')) return;
    await fetch(`/api/admin/promoters/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: '28px', fontWeight: 600, color: 'var(--text)' }}>Promoters</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>Manage promoters and their commission</p>
        </div>
        {!showForm && (
          <button onClick={openNew} style={{ background: 'linear-gradient(135deg, #c9a85c, #e8d5a0)', color: '#09090f', fontWeight: 700, fontSize: '13px', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '10px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer' }}>
            + Add Promoter
          </button>
        )}
      </div>

      {showForm && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px', marginBottom: '20px', maxWidth: '560px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '18px' }}>
            {editId ? 'Edit Promoter' : 'New Promoter'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={S.label}>Name *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} style={S.input} />
            </div>
            <div>
              <label style={S.label}>Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} style={S.input} />
            </div>
            <div>
              <label style={S.label}>Phone</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)} style={S.input} />
            </div>
            <div>
              <label style={S.label}>Commission type</label>
              <select value={form.commission_type} onChange={e => set('commission_type', e.target.value)} style={{ ...S.input, appearance: 'none' }}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed (€)</option>
              </select>
            </div>
            <div>
              <label style={S.label}>Commission value</label>
              <input type="number" value={form.commission_value} onChange={e => set('commission_value', e.target.value)} placeholder="10" style={S.input} />
            </div>
            <div>
              <label style={S.label}>Promo code</label>
              <input value={form.promo_code} onChange={e => set('promo_code', e.target.value.toUpperCase())} placeholder="JOHN20" style={S.input} />
            </div>
            <div>
              <label style={S.label}>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} style={{ ...S.input, appearance: 'none' }}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={S.label}>Notes</label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} style={{ ...S.input, resize: 'none' }} />
            </div>
          </div>
          {error && <p style={{ color: 'var(--red)', fontSize: '13px', marginTop: '10px' }}>{error}</p>}
          <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
            <button onClick={() => setShowForm(false)} style={{ padding: '10px 20px', borderRadius: '9px', background: 'var(--surface-2)', border: '1px solid var(--border-muted)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '13px' }}>
              Cancel
            </button>
            <button onClick={save} disabled={saving} style={{ flex: 1, padding: '10px', borderRadius: '9px', background: 'linear-gradient(135deg, #c9a85c, #e8d5a0)', color: '#09090f', fontWeight: 700, fontSize: '13px', border: 'none', cursor: 'pointer' }}>
              {saving ? 'Saving…' : editId ? 'Save' : 'Add Promoter'}
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {promoters.length === 0 && !showForm ? (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border-muted)', borderRadius: '14px', padding: '48px', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: '22px', color: 'var(--text-muted)' }}>No promoters yet</p>
          </div>
        ) : promoters.map(p => (
          <div key={p.id} style={{ background: 'var(--surface)', border: '1px solid var(--border-muted)', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '3px' }}>
                <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>{p.name}</p>
                {p.promo_code && (
                  <span style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, color: 'var(--gold)', background: 'var(--gold-subtle)', padding: '2px 8px', borderRadius: '999px', letterSpacing: '0.06em' }}>
                    {p.promo_code}
                  </span>
                )}
                <span style={{ fontSize: '10px', color: p.status === 'active' ? 'var(--green)' : 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {p.status}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {p.email || '—'} · {p.commission_value}{p.commission_type === 'percentage' ? '%' : '€'} commission
              </p>
            </div>
            <div style={{ display: 'flex', gap: '20px', marginRight: '12px' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--gold)' }}>€{Number(p.actual_sales).toFixed(0)}</p>
                <p style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sales</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>{p.orders_count}</p>
                <p style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Orders</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => openEdit(p)} style={{ fontSize: '12px', color: 'var(--gold)', background: 'var(--surface-2)', border: '1px solid var(--border-muted)', padding: '6px 12px', borderRadius: '7px', cursor: 'pointer' }}>Edit</button>
              <button onClick={() => del(p.id)} style={{ fontSize: '12px', color: 'var(--red)', background: 'var(--surface-2)', border: '1px solid var(--border-muted)', padding: '6px 12px', borderRadius: '7px', cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
