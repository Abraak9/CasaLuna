'use client';

import { useEffect, useState } from 'react';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

const S: Record<string, React.CSSProperties> = {
  label: { fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' },
  input: { background: 'var(--surface-2)', border: '1px solid var(--border-muted)', color: 'var(--text)', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', width: '100%', outline: 'none' },
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => fetch('/api/admin/admin-users').then(r => r.json()).then(setUsers);
  useEffect(() => { load(); }, []);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name || !form.email || !form.password) { setError('All fields required'); return; }
    setSaving(true); setError('');
    const res = await fetch('/api/admin/admin-users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (!res.ok) { const d = await res.json(); setError(d.error || 'Failed'); setSaving(false); return; }
    load(); setShowForm(false); setForm({ name: '', email: '', password: '' }); setSaving(false);
  };

  const del = async (id: string, email: string) => {
    if (!confirm(`Delete admin account for ${email}? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/admin-users/${id}`, { method: 'DELETE' });
    if (!res.ok) { const d = await res.json(); alert(d.error); return; }
    load();
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: '28px', fontWeight: 600, color: 'var(--text)' }}>Admin Users</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Manage who has access to the admin panel
          </p>
        </div>
        {!showForm && (
          <button onClick={() => { setShowForm(true); setError(''); }} style={{ background: 'linear-gradient(135deg, #c9a85c, #e8d5a0)', color: '#09090f', fontWeight: 700, fontSize: '13px', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '10px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer' }}>
            + Add User
          </button>
        )}
      </div>

      {showForm && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px', marginBottom: '20px', maxWidth: '480px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '18px' }}>New Admin User</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={S.label}>Full name *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} style={S.input} />
            </div>
            <div>
              <label style={S.label}>Email *</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} style={S.input} />
            </div>
            <div>
              <label style={S.label}>Password *</label>
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)} style={S.input} />
            </div>
          </div>
          {error && <p style={{ color: 'var(--red)', fontSize: '13px', marginTop: '10px' }}>{error}</p>}
          <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
            <button onClick={() => setShowForm(false)} style={{ padding: '10px 20px', borderRadius: '9px', background: 'var(--surface-2)', border: '1px solid var(--border-muted)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
            <button onClick={save} disabled={saving} style={{ flex: 1, padding: '10px', borderRadius: '9px', background: 'linear-gradient(135deg, #c9a85c, #e8d5a0)', color: '#09090f', fontWeight: 700, fontSize: '13px', border: 'none', cursor: 'pointer' }}>
              {saving ? 'Creating…' : 'Create User'}
            </button>
          </div>
        </div>
      )}

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border-muted)', borderRadius: '14px', overflow: 'hidden' }}>
        {users.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: '22px', color: 'var(--text-muted)' }}>No users found</p>
          </div>
        ) : users.map((u, i) => (
          <div key={u.id} style={{
            display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px',
            borderBottom: i < users.length - 1 ? '1px solid var(--border-muted)' : 'none',
          }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #c9a85c, #e8d5a0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px', fontWeight: 700, color: '#09090f', flexShrink: 0,
            }}>
              {u.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '2px' }}>{u.name}</p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{u.email}</p>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
              Since {new Date(u.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
            </p>
            {users.length > 1 && (
              <button onClick={() => del(u.id, u.email)} style={{ fontSize: '12px', color: 'var(--red)', background: 'var(--surface-2)', border: '1px solid var(--border-muted)', padding: '6px 12px', borderRadius: '7px', cursor: 'pointer' }}>
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
