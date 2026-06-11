'use client';

import { useEffect, useState } from 'react';

interface Discount {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  currency: string;
  scope: string;
  usage_limit: number | null;
  usage_count: number;
  event_id: string | null;
  event_name: string | null;
  valid_from: string | null;
  valid_until: string | null;
  status: string;
  times_used_orders: number;
}

const blankForm = () => ({
  code: '', type: 'percentage', value: '', currency: 'EUR', scope: 'order',
  usage_limit: '', event_id: '', valid_from: '', valid_until: '', status: 'active',
});

const S: Record<string, React.CSSProperties> = {
  label: { fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' },
  input: { background: 'var(--surface-2)', border: '1px solid var(--border-muted)', color: 'var(--text)', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', width: '100%', outline: 'none' },
};

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(blankForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => fetch('/api/admin/discounts').then(r => r.json()).then(setDiscounts);

  useEffect(() => { load(); }, []);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const openNew = () => { setForm(blankForm()); setEditId(null); setShowForm(true); setError(''); };

  const openEdit = (d: Discount) => {
    setForm({
      code: d.code, type: d.type, value: String(d.value),
      currency: d.currency, scope: d.scope,
      usage_limit: d.usage_limit ? String(d.usage_limit) : '',
      event_id: d.event_id || '',
      valid_from: d.valid_from ? d.valid_from.slice(0, 10) : '',
      valid_until: d.valid_until ? d.valid_until.slice(0, 10) : '',
      status: d.status,
    });
    setEditId(d.id);
    setShowForm(true);
    setError('');
  };

  const save = async () => {
    if (!form.code || !form.value) { setError('Code and value are required'); return; }
    setSaving(true);
    setError('');
    const url = editId ? `/api/admin/discounts/${editId}` : '/api/admin/discounts';
    const method = editId ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        value: Number(form.value),
        usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
        valid_from: form.valid_from || null,
        valid_until: form.valid_until || null,
        event_id: form.event_id || null,
      }),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || 'Save failed');
      setSaving(false);
      return;
    }
    load();
    setShowForm(false);
    setSaving(false);
  };

  const deleteDiscount = async (id: string) => {
    if (!confirm('Delete this discount code?')) return;
    await fetch(`/api/admin/discounts/${id}`, { method: 'DELETE' });
    load();
  };

  const toggleStatus = async (d: Discount) => {
    await fetch(`/api/admin/discounts/${d.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: d.status === 'active' ? 'paused' : 'active' }),
    });
    load();
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: '28px', fontWeight: 600, color: 'var(--text)' }}>Discounts</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Promo codes — percentage or fixed, order or per-ticket
          </p>
        </div>
        {!showForm && (
          <button onClick={openNew} style={{
            background: 'linear-gradient(135deg, #c9a85c, #e8d5a0)', color: '#09090f',
            fontWeight: 700, fontSize: '13px', letterSpacing: '0.06em', textTransform: 'uppercase',
            padding: '10px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer',
          }}>
            + New Code
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px', marginBottom: '20px', maxWidth: '600px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '20px' }}>
            {editId ? 'Edit Discount Code' : 'New Discount Code'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={S.label}>Code *</label>
              <input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())}
                placeholder="SUMMER20" style={S.input} />
            </div>
            <div>
              <label style={S.label}>Currency</label>
              <select value={form.currency} onChange={e => set('currency', e.target.value)} style={{ ...S.input, appearance: 'none' }}>
                <option value="EUR">EUR (€)</option>
                <option value="SEK">SEK (kr)</option>
              </select>
            </div>
            <div>
              <label style={S.label}>Type</label>
              <select value={form.type} onChange={e => set('type', e.target.value)} style={{ ...S.input, appearance: 'none' }}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed amount</option>
              </select>
            </div>
            <div>
              <label style={S.label}>Value {form.type === 'percentage' ? '(%)' : `(${form.currency})`} *</label>
              <input type="number" value={form.value} onChange={e => set('value', e.target.value)}
                placeholder={form.type === 'percentage' ? '20' : '50'} style={S.input} />
            </div>
            <div>
              <label style={S.label}>Scope</label>
              <select value={form.scope} onChange={e => set('scope', e.target.value)} style={{ ...S.input, appearance: 'none' }}>
                <option value="order">Per order</option>
                <option value="per_ticket">Per ticket</option>
              </select>
            </div>
            <div>
              <label style={S.label}>Usage limit (blank = unlimited)</label>
              <input type="number" value={form.usage_limit} onChange={e => set('usage_limit', e.target.value)}
                placeholder="100" style={S.input} />
            </div>
            <div>
              <label style={S.label}>Valid from</label>
              <input type="date" value={form.valid_from} onChange={e => set('valid_from', e.target.value)} style={S.input} />
            </div>
            <div>
              <label style={S.label}>Valid until</label>
              <input type="date" value={form.valid_until} onChange={e => set('valid_until', e.target.value)} style={S.input} />
            </div>
            <div>
              <label style={S.label}>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} style={{ ...S.input, appearance: 'none' }}>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>
          {error && <p style={{ color: 'var(--red)', fontSize: '13px', marginTop: '12px' }}>{error}</p>}
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button onClick={() => { setShowForm(false); setError(''); }} style={{
              padding: '10px 20px', borderRadius: '9px',
              background: 'var(--surface-2)', border: '1px solid var(--border-muted)',
              color: 'var(--text-muted)', cursor: 'pointer', fontSize: '13px',
            }}>Cancel</button>
            <button onClick={save} disabled={saving} style={{
              flex: 1, padding: '10px', borderRadius: '9px',
              background: 'linear-gradient(135deg, #c9a85c, #e8d5a0)', color: '#09090f',
              fontWeight: 700, fontSize: '13px', border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
            }}>
              {saving ? 'Saving…' : editId ? 'Save Changes' : 'Create Code'}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {discounts.length === 0 && !showForm ? (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border-muted)',
          borderRadius: '14px', padding: '48px 24px', textAlign: 'center',
        }}>
          <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: '24px', color: 'var(--text-muted)', marginBottom: '8px' }}>
            No discount codes yet
          </p>
          <button onClick={openNew} style={{ color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
            Create your first code →
          </button>
        </div>
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border-muted)', borderRadius: '14px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Code', 'Discount', 'Scope', 'Used', 'Valid until', 'Status', ''].map(h => (
                  <th key={h} style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-dim)', padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid var(--border-muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {discounts.map(d => (
                <tr key={d.id}>
                  <td style={{ padding: '13px 16px', borderBottom: '1px solid var(--border-muted)' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 700, color: 'var(--gold)', letterSpacing: '0.08em' }}>
                      {d.code}
                    </span>
                  </td>
                  <td style={{ padding: '13px 16px', borderBottom: '1px solid var(--border-muted)', color: 'var(--text)', fontSize: '13px' }}>
                    {d.type === 'percentage' ? `${d.value}%` : `${d.currency} ${d.value}`}
                  </td>
                  <td style={{ padding: '13px 16px', borderBottom: '1px solid var(--border-muted)', color: 'var(--text-muted)', fontSize: '12px' }}>
                    {d.scope}
                  </td>
                  <td style={{ padding: '13px 16px', borderBottom: '1px solid var(--border-muted)', color: 'var(--text-muted)', fontSize: '13px' }}>
                    {d.usage_count}{d.usage_limit ? ` / ${d.usage_limit}` : ''}
                  </td>
                  <td style={{ padding: '13px 16px', borderBottom: '1px solid var(--border-muted)', color: 'var(--text-muted)', fontSize: '12px' }}>
                    {d.valid_until ? new Date(d.valid_until).toLocaleDateString('en-GB') : '—'}
                  </td>
                  <td style={{ padding: '13px 16px', borderBottom: '1px solid var(--border-muted)' }}>
                    <button onClick={() => toggleStatus(d)} style={{
                      fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                      padding: '3px 10px', borderRadius: '999px', border: 'none', cursor: 'pointer',
                      background: d.status === 'active' ? 'rgba(92,184,138,0.12)' : 'rgba(139,139,154,0.15)',
                      color: d.status === 'active' ? 'var(--green)' : 'var(--text-muted)',
                    }}>
                      {d.status}
                    </button>
                  </td>
                  <td style={{ padding: '13px 16px', borderBottom: '1px solid var(--border-muted)' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => openEdit(d)} style={{ fontSize: '12px', color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => deleteDiscount(d.id)} style={{ fontSize: '12px', color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer' }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
