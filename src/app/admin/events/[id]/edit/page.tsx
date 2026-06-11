'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ImageUpload from '@/components/ImageUpload';

const LABEL: React.CSSProperties = { fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' };
const INPUT: React.CSSProperties = { width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border-muted)', color: 'var(--text)', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', outline: 'none' };
const SELECT: React.CSSProperties = { ...INPUT, appearance: 'none' as const, cursor: 'pointer' };
const CARD: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border-muted)', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' };

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', description: '', slug: '', date: '', end_date: '',
    location_name: '', location_address: '', location_city: '',
    cover_image_url: '', checkin_pin: '', max_capacity: '', status: 'draft',
  });

  useEffect(() => {
    fetch(`/api/admin/events/${id}`)
      .then(r => r.json())
      .then(event => {
        setForm({
          name: event.name_en || event.name_es || '',
          description: event.description_en || event.description_es || '',
          slug: event.slug || '',
          date: event.date ? event.date.slice(0, 16) : '',
          end_date: event.end_date ? event.end_date.slice(0, 16) : '',
          location_name: event.location_name || '',
          location_address: event.location_address || '',
          location_city: event.location_city || '',
          cover_image_url: event.cover_image_url || '',
          checkin_pin: event.checkin_pin || '',
          max_capacity: event.max_capacity?.toString() || '',
          status: event.status || 'draft',
        });
        setLoading(false);
      });
  }, [id]);

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    const res = await fetch(`/api/admin/events/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name_en: form.name, name_es: form.name,
        description_en: form.description, description_es: form.description,
        slug: form.slug, date: form.date, end_date: form.end_date || null,
        location_name: form.location_name, location_address: form.location_address, location_city: form.location_city,
        cover_image_url: form.cover_image_url, checkin_pin: form.checkin_pin,
        max_capacity: form.max_capacity ? Number(form.max_capacity) : null, status: form.status,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Failed to save');
      setSaving(false);
    } else {
      router.push('/admin/events');
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px', color: 'var(--text-muted)' }}>
      <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: '22px' }}>Loading…</p>
    </div>
  );

  return (
    <div style={{ maxWidth: '640px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px', flexWrap: 'wrap' }}>
        <Link href="/admin/events" style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none' }}>← Events</Link>
        <span style={{ color: 'var(--border-muted)' }}>/</span>
        <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: '26px', fontWeight: 600, color: 'var(--text)' }}>Edit Event</h1>
        <Link href={`/admin/events/${id}/tickets`} style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--gold)', textDecoration: 'none', fontWeight: 600, letterSpacing: '0.04em' }}>
          Manage Tickets →
        </Link>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* Event Info */}
        <div style={CARD}>
          <p style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '2px' }}>Event Info</p>
          <div>
            <label style={LABEL}>Event Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} required style={INPUT} />
          </div>
          <div>
            <label style={LABEL}>URL Slug *</label>
            <div style={{ display: 'flex', alignItems: 'stretch', border: '1px solid var(--border-muted)', borderRadius: '8px', overflow: 'hidden' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-dim)', background: 'rgba(201,168,92,0.05)', borderRight: '1px solid var(--border-muted)', padding: '9px 12px', whiteSpace: 'nowrap' }}>/event/</span>
              <input value={form.slug} onChange={e => set('slug', e.target.value)} required style={{ ...INPUT, border: 'none', borderRadius: 0, flex: 1, background: 'var(--surface-2)' }} />
            </div>
          </div>
          <div>
            <label style={LABEL}>Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4} style={{ ...INPUT, resize: 'vertical' }} />
          </div>
        </div>

        {/* Date & Location */}
        <div style={CARD}>
          <p style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '2px' }}>Date & Location</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={LABEL}>Start date & time *</label>
              <input type="datetime-local" value={form.date} onChange={e => set('date', e.target.value)} required style={INPUT} />
            </div>
            <div>
              <label style={LABEL}>End date & time</label>
              <input type="datetime-local" value={form.end_date} onChange={e => set('end_date', e.target.value)} style={INPUT} />
            </div>
          </div>
          <div>
            <label style={LABEL}>Venue name</label>
            <input value={form.location_name} onChange={e => set('location_name', e.target.value)} style={INPUT} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={LABEL}>Address</label>
              <input value={form.location_address} onChange={e => set('location_address', e.target.value)} style={INPUT} />
            </div>
            <div>
              <label style={LABEL}>City</label>
              <input value={form.location_city} onChange={e => set('location_city', e.target.value)} style={INPUT} />
            </div>
          </div>
        </div>

        {/* Settings */}
        <div style={CARD}>
          <p style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '2px' }}>Settings</p>
          <div>
            <label style={LABEL}>Cover Image</label>
            <ImageUpload value={form.cover_image_url} onChange={url => set('cover_image_url', url)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={LABEL}>Check-in PIN</label>
              <input value={form.checkin_pin} onChange={e => set('checkin_pin', e.target.value)} style={INPUT} />
            </div>
            <div>
              <label style={LABEL}>Max capacity</label>
              <input type="number" value={form.max_capacity} onChange={e => set('max_capacity', e.target.value)} style={INPUT} />
            </div>
          </div>
          <div>
            <label style={LABEL}>Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)} style={SELECT}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="cancelled">Cancelled</option>
              <option value="past">Past</option>
            </select>
          </div>
        </div>

        {error && <p style={{ color: 'var(--red)', fontSize: '13px' }}>{error}</p>}

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/admin/events" style={{ padding: '12px 20px', borderRadius: '10px', background: 'var(--surface-2)', border: '1px solid var(--border-muted)', color: 'var(--text-muted)', fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            Cancel
          </Link>
          <button type="submit" disabled={saving} style={{ flex: 1, background: 'linear-gradient(135deg, #c9a85c, #e8d5a0)', color: '#09090f', fontWeight: 700, fontSize: '14px', letterSpacing: '0.06em', padding: '12px', borderRadius: '10px', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
