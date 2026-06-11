'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import ImageUpload from '@/components/ImageUpload';

export default function BrandSettingsPage() {
  const [currentLogo, setCurrentLogo] = useState<string | null>(null);
  const [newLogoUrl, setNewLogoUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/settings/brand')
      .then(r => r.json())
      .then(d => { setCurrentLogo(d.logo_url || null); setLoading(false); });
  }, []);

  const handleSave = async () => {
    if (!newLogoUrl) return;
    setSaving(true); setSaved(false);
    const res = await fetch('/api/admin/settings/brand', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logo_url: newLogoUrl }),
    });
    if (res.ok) {
      setCurrentLogo(newLogoUrl);
      setNewLogoUrl('');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  const S = {
    label: { fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' },
    card: { background: 'var(--surface)', border: '1px solid var(--border-muted)', borderRadius: '14px', padding: '24px' },
  };

  return (
    <div style={{ maxWidth: '560px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: '28px', fontWeight: 600, color: 'var(--text)' }}>Brand Settings</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
          Upload your logo here — it updates everywhere on the site instantly.
        </p>
      </div>

      {/* Current logo */}
      <div style={{ ...S.card, marginBottom: '16px' }}>
        <label style={S.label}>Current Logo</label>
        {loading ? (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading…</p>
        ) : currentLogo ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ background: 'var(--surface-2)', borderRadius: '12px', padding: '12px', border: '1px solid var(--border-muted)' }}>
              <Image src={currentLogo} alt="Current logo" width={80} height={80} style={{ borderRadius: '8px', objectFit: 'contain', display: 'block' }} unoptimized />
            </div>
            <div>
              <p style={{ fontSize: '13px', color: 'var(--green)', fontWeight: 600, marginBottom: '4px' }}>✓ Logo active</p>
              <p style={{ fontSize: '11px', color: 'var(--text-dim)', wordBreak: 'break-all', maxWidth: '320px' }}>{currentLogo}</p>
            </div>
          </div>
        ) : (
          <div style={{ padding: '20px', background: 'var(--surface-2)', borderRadius: '10px', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No logo uploaded yet — text wordmark is shown</p>
          </div>
        )}
      </div>

      {/* Upload new logo */}
      <div style={S.card}>
        <label style={S.label}>{currentLogo ? 'Replace Logo' : 'Upload Logo'}</label>
        <ImageUpload value={newLogoUrl} onChange={setNewLogoUrl} />

        {newLogoUrl && (
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              marginTop: '16px', width: '100%',
              background: 'linear-gradient(135deg, #c9a85c, #e8d5a0)', color: '#09090f',
              fontWeight: 700, fontSize: '14px', letterSpacing: '0.06em', textTransform: 'uppercase',
              padding: '13px', borderRadius: '10px', border: 'none',
              cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Saving…' : saved ? '✓ Saved — live on site' : 'Save & Publish Logo'}
          </button>
        )}
      </div>

      {/* Info box */}
      <div style={{ marginTop: '16px', background: 'rgba(201,168,92,0.05)', border: '1px solid rgba(201,168,92,0.15)', borderRadius: '10px', padding: '14px 16px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '6px' }}>Where the logo appears</p>
        <ul style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.9, listStyle: 'none', padding: 0, margin: 0 }}>
          <li>🌐 Public homepage — navigation bar + hero section + footer</li>
          <li>⚙️ Admin panel — sidebar header</li>
          <li>🎫 Email confirmations (coming soon)</li>
        </ul>
        <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '8px' }}>
          Recommended: square PNG, 400×400px minimum, transparent or black background.
        </p>
      </div>
    </div>
  );
}
