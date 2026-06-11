'use client';

import { useEffect, useState } from 'react';

interface Affiliate {
  id: string;
  name: string;
  email: string | null;
  website: string | null;
  tracking_code: string;
  commission_type: string;
  commission_value: number;
  clicks: number;
  conversions: number;
  actual_revenue: number;
  orders_count: number;
  status: string;
  notes: string | null;
}

const S: Record<string, React.CSSProperties> = {
  label: { fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' },
  input: { background: 'var(--surface-2)', border: '1px solid var(--border-muted)', color: 'var(--text)', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', width: '100%', outline: 'none' },
};

const blankForm = () => ({ name: '', email: '', website: '', tracking_code: '', commission_type: 'percentage', commission_value: '', notes: '', status: 'active' });

export default function AffiliatesPage() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(blankForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const load = () => fetch('/api/admin/affiliates').then(r => r.json()).then(setAffiliates);
  useEffect(() => { load(); }, []);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const openNew = () => { setForm(blankForm()); setEditId(null); setShowForm(true); setError(''); };
  const openEdit = (a: Affiliate) => {
    setForm({ name: a.name, email: a.email || '', website: a.website || '', tracking_code: a.tracking_code, commission_type: a.commission_type, commission_value: String(a.commission_value), notes: a.notes || '', status: a.status });
    setEditId(a.id); setShowForm(true); setError('');
  };

  const save = async () => {
    if (!form.name || !form.tracking_code) { setError('Name and tracking code required'); return; }
    setSaving(true); setError('');
    const url = editId ? `/api/admin/affiliates/${editId}` : '/api/admin/affiliates';
    const res = await fetch(url, {
      method: editId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, commission_value: Number(form.commission_value) || 0 }),
    });
    if (!res.ok) { const d = await res.json(); setError(d.error || 'Failed'); setSaving(false); return; }
    load(); setShowForm(false); setSaving(false);
  };

  const del = async (id: string) => {
    if (!confirm('Delete this affiliate?')) return;
    await fetch(`/api/admin/affiliates/${id}`, { method: 'DELETE' });
    load();
  };

  const affiliateLink = (tracking_code: string) => `${baseUrl}/?ref=${tracking_code}`;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: '28px', fontWeight: 600, color: 'var(--text)' }}>Affiliates</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>Track partner links and conversions</p>
        </div>
        {!showForm && (
          <button onClick={openNew} style={{ background: 'linear-gradient(135deg, #c9a85c, #e8d5a0)', color: '#09090f', fontWeight: 700, fontSize: '13px', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '10px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer' }}>
            + Add Affiliate
          </button>
        )}
      </div>

      {showForm && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px', marginBottom: '20px', maxWidth: '560px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '18px' }}>
            {editId ? 'Edit Affiliate' : 'New Affiliate'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={S.label}>Name *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} style={S.input} />
            </div>
            <div>
              <label style={S.label}>Tracking code *</label>
              <input value={form.tracking_code} onChange={e => set('tracking_code', e.target.value.toLowerCase().replace(/\s/g, ''))} placeholder="partner-name" style={S.input} />
            </div>
            <div>
              <label style={S.label}>Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} style={S.input} />
            </div>
            <div>
              <label style={S.label}>Website</label>
              <input value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://..." style={S.input} />
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
              <input type="number" value={form.commission_value} onChange={e => set('commission_value', e.target.value)} style={S.input} />
            </div>
            {form.tracking_code && (
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={S.label}>Affiliate link preview</label>
                <div style={{ ...S.input, color: 'var(--gold)', fontFamily: 'monospace', fontSize: '12px', wordBreak: 'break-all', cursor: 'text' }}>
                  {affiliateLink(form.tracking_code)}
                </div>
              </div>
            )}
          </div>
          {error && <p style={{ color: 'var(--red)', fontSize: '13px', marginTop: '10px' }}>{error}</p>}
          <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
            <button onClick={() => setShowForm(false)} style={{ padding: '10px 20px', borderRadius: '9px', background: 'var(--surface-2)', border: '1px solid var(--border-muted)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
            <button onClick={save} disabled={saving} style={{ flex: 1, padding: '10px', borderRadius: '9px', background: 'linear-gradient(135deg, #c9a85c, #e8d5a0)', color: '#09090f', fontWeight: 700, fontSize: '13px', border: 'none', cursor: 'pointer' }}>
              {saving ? 'Saving…' : editId ? 'Save' : 'Add Affiliate'}
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {affiliates.length === 0 && !showForm ? (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border-muted)', borderRadius: '14px', padding: '48px', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: '22px', color: 'var(--text-muted)' }}>No affiliates yet</p>
          </div>
        ) : affiliates.map(a => (
          <div key={a.id} style={{ background: 'var(--surface)', border: '1px solid var(--border-muted)', borderRadius: '12px', padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                  <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>{a.name}</p>
                  <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--gold)', background: 'var(--gold-subtle)', padding: '2px 8px', borderRadius: '999px' }}>?ref={a.tracking_code}</span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>{a.email || '—'} · {a.commission_value}{a.commission_type === 'percentage' ? '%' : '€'} commission</p>
                <p style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {affiliateLink(a.tracking_code)}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '20px', marginRight: '12px', flexShrink: 0 }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--gold)' }}>€{Number(a.actual_revenue).toFixed(0)}</p>
                  <p style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Revenue</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>{a.orders_count}</p>
                  <p style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Orders</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => openEdit(a)} style={{ fontSize: '12px', color: 'var(--gold)', background: 'var(--surface-2)', border: '1px solid var(--border-muted)', padding: '6px 12px', borderRadius: '7px', cursor: 'pointer' }}>Edit</button>
                <button onClick={() => del(a.id)} style={{ fontSize: '12px', color: 'var(--red)', background: 'var(--surface-2)', border: '1px solid var(--border-muted)', padding: '6px 12px', borderRadius: '7px', cursor: 'pointer' }}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
