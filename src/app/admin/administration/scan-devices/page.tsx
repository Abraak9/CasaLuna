'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Device {
  id: string;
  name: string;
  device_token: string;
  event_id: string | null;
  event_name: string | null;
  check_ins_count: number;
  last_seen: string | null;
  status: string;
  notes: string | null;
}

const S: Record<string, React.CSSProperties> = {
  label: { fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' },
  input: { background: 'var(--surface-2)', border: '1px solid var(--border-muted)', color: 'var(--text)', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', width: '100%', outline: 'none' },
};

export default function ScanDevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', event_id: '', notes: '', status: 'active' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const checkinUrl = typeof window !== 'undefined' ? window.location.origin + '/checkin/' : '';

  const load = () => fetch('/api/admin/scan-devices').then(r => r.json()).then(setDevices);
  useEffect(() => { load(); }, []);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const openNew = () => { setForm({ name: '', event_id: '', notes: '', status: 'active' }); setEditId(null); setShowForm(true); setError(''); };
  const openEdit = (d: Device) => {
    setForm({ name: d.name, event_id: d.event_id || '', notes: d.notes || '', status: d.status });
    setEditId(d.id); setShowForm(true); setError('');
  };

  const save = async () => {
    if (!form.name) { setError('Name required'); return; }
    setSaving(true); setError('');
    const url = editId ? `/api/admin/scan-devices/${editId}` : '/api/admin/scan-devices';
    const res = await fetch(url, {
      method: editId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (!res.ok) { const d = await res.json(); setError(d.error || 'Failed'); setSaving(false); return; }
    load(); setShowForm(false); setSaving(false);
  };

  const del = async (id: string) => {
    if (!confirm('Delete this device?')) return;
    await fetch(`/api/admin/scan-devices/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: '28px', fontWeight: 600, color: 'var(--text)' }}>Scan Devices</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Devices used for QR check-in at events
          </p>
        </div>
        {!showForm && (
          <button onClick={openNew} style={{ background: 'linear-gradient(135deg, #c9a85c, #e8d5a0)', color: '#09090f', fontWeight: 700, fontSize: '13px', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '10px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer' }}>
            + Add Device
          </button>
        )}
      </div>

      {/* Info */}
      <div style={{ background: 'rgba(201,168,92,0.06)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px' }}>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--gold)' }}>How check-in works:</strong> Each event has a check-in PIN set in the event settings. Open{' '}
          <Link href="/checkin" style={{ color: 'var(--gold)', textDecoration: 'none' }}>tickets.casaluna.se/checkin/[event-slug]</Link>{' '}
          on any device (phone/tablet), enter the PIN, and start scanning QR tickets. No separate device registration needed.
        </p>
      </div>

      {showForm && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px', marginBottom: '20px', maxWidth: '480px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '18px' }}>
            {editId ? 'Edit Device' : 'Register Device'}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={S.label}>Device name *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Door iPad" style={S.input} />
            </div>
            <div>
              <label style={S.label}>Notes</label>
              <input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Location, person responsible…" style={S.input} />
            </div>
            <div>
              <label style={S.label}>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} style={{ ...S.input, appearance: 'none' }}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          {error && <p style={{ color: 'var(--red)', fontSize: '13px', marginTop: '10px' }}>{error}</p>}
          <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
            <button onClick={() => setShowForm(false)} style={{ padding: '10px 20px', borderRadius: '9px', background: 'var(--surface-2)', border: '1px solid var(--border-muted)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
            <button onClick={save} disabled={saving} style={{ flex: 1, padding: '10px', borderRadius: '9px', background: 'linear-gradient(135deg, #c9a85c, #e8d5a0)', color: '#09090f', fontWeight: 700, fontSize: '13px', border: 'none', cursor: 'pointer' }}>
              {saving ? 'Saving…' : editId ? 'Save' : 'Register'}
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {devices.length === 0 && !showForm ? (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border-muted)', borderRadius: '14px', padding: '48px', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: '22px', color: 'var(--text-muted)', marginBottom: '8px' }}>No devices registered</p>
            <p style={{ fontSize: '13px', color: 'var(--text-dim)' }}>Any device with a browser can scan — no registration required. Use this to track your devices.</p>
          </div>
        ) : devices.map(d => (
          <div key={d.id} style={{ background: 'var(--surface)', border: '1px solid var(--border-muted)', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>{d.name}</p>
                <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--gold)', background: 'var(--gold-subtle)', padding: '2px 8px', borderRadius: '999px', letterSpacing: '0.1em' }}>
                  {d.device_token}
                </span>
                <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: d.status === 'active' ? 'var(--green)' : 'var(--text-dim)' }}>
                  {d.status}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {d.notes || '—'} · {d.check_ins_count} check-ins
                {d.last_seen && ` · Last seen ${new Date(d.last_seen).toLocaleDateString('en-GB')}`}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => openEdit(d)} style={{ fontSize: '12px', color: 'var(--gold)', background: 'var(--surface-2)', border: '1px solid var(--border-muted)', padding: '6px 12px', borderRadius: '7px', cursor: 'pointer' }}>Edit</button>
              <button onClick={() => del(d.id)} style={{ fontSize: '12px', color: 'var(--red)', background: 'var(--surface-2)', border: '1px solid var(--border-muted)', padding: '6px 12px', borderRadius: '7px', cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
