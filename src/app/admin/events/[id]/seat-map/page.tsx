'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ImageUpload from '@/components/ImageUpload';
import SeatMapEditor, { EditorSeat } from '@/components/SeatMapEditor';

interface SeatMap {
  id: string;
  event_id: string;
  name: string;
  image_url?: string;
  seats: EditorSeat[];
}

const INPUT: React.CSSProperties = { width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border-muted)', color: 'var(--text)', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', outline: 'none' };
const LABEL: React.CSSProperties = { fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' };

export default function SeatMapPage() {
  const { id: eventId } = useParams<{ id: string }>();
  const [seatMap, setSeatMap] = useState<SeatMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('Venue Layout');
  const [newImage, setNewImage] = useState('');
  const [mapName, setMapName] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    const res = await fetch(`/api/admin/events/${eventId}/seat-map`);
    const data = await res.json();
    setSeatMap(data);
    if (data) setMapName(data.name);
    setLoading(false);
  };

  useEffect(() => { load(); }, [eventId]);

  /* ── Create map ─────────────────────────────────────────── */
  const createMap = async () => {
    setCreating(true);
    const res = await fetch(`/api/admin/events/${eventId}/seat-map`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, image_url: newImage || null }),
    });
    if (!res.ok) { const d = await res.json(); setError(d.error || 'Failed'); setCreating(false); return; }
    await load();
    setCreating(false);
  };

  /* ── Update map name / image ────────────────────────────── */
  const updateMap = async (changes: { name?: string; image_url?: string }) => {
    if (!seatMap) return;
    const res = await fetch(`/api/admin/seat-maps/${seatMap.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changes),
    });
    if (res.ok) await load();
  };

  /* ── Delete map ─────────────────────────────────────────── */
  const deleteMap = async () => {
    if (!seatMap) return;
    if (!confirm('Delete the entire seat map and all spots? This cannot be undone.')) return;
    await fetch(`/api/admin/seat-maps/${seatMap.id}`, { method: 'DELETE' });
    setSeatMap(null);
  };

  /* ── Add seat ───────────────────────────────────────────── */
  const handlePlace = async (x: number, y: number) => {
    if (!seatMap) return;
    const label = String((seatMap.seats.length || 0) + 1);
    const res = await fetch(`/api/admin/seat-maps/${seatMap.id}/seats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label, x_percent: x, y_percent: y, capacity: 1, sort_order: seatMap.seats.length }),
    });
    if (res.ok) await load();
  };

  /* ── Move seat ──────────────────────────────────────────── */
  const handleMove = async (id: string, x: number, y: number) => {
    await fetch(`/api/admin/seats/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ x_percent: x, y_percent: y }),
    });
    // Optimistic: update local state immediately
    setSeatMap(prev => prev
      ? { ...prev, seats: prev.seats.map(s => s.id === id ? { ...s, x_percent: x, y_percent: y } : s) }
      : prev
    );
  };

  /* ── Update seat ────────────────────────────────────────── */
  const handleUpdate = async (id: string, changes: Partial<Pick<EditorSeat, 'label' | 'capacity' | 'status'>>) => {
    const res = await fetch(`/api/admin/seats/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changes),
    });
    if (res.ok) {
      const updated = await res.json();
      setSeatMap(prev => prev
        ? { ...prev, seats: prev.seats.map(s => s.id === id ? { ...s, ...updated } : s) }
        : prev
      );
    }
  };

  /* ── Delete seat ────────────────────────────────────────── */
  const handleDelete = async (id: string) => {
    await fetch(`/api/admin/seats/${id}`, { method: 'DELETE' });
    setSeatMap(prev => prev ? { ...prev, seats: prev.seats.filter(s => s.id !== id) } : prev);
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px', color: 'var(--text-muted)' }}>
      <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: '22px' }}>Loading…</p>
    </div>
  );

  return (
    <div style={{ maxWidth: '860px' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px', flexWrap: 'wrap' }}>
        <Link href="/admin/events" style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none' }}>← Events</Link>
        <span style={{ color: 'var(--border-muted)' }}>/</span>
        <Link href={`/admin/events/${eventId}/tickets`} style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none' }}>Tickets</Link>
        <span style={{ color: 'var(--border-muted)' }}>/</span>
        <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: '26px', fontWeight: 600, color: 'var(--text)' }}>Seat Map</h1>
      </div>

      {error && <p style={{ color: 'var(--red)', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}

      {/* ── No map yet ─────────────────────────────────────── */}
      {!seatMap && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border-muted)', borderRadius: '16px', padding: '28px', maxWidth: '560px' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '20px' }}>Create Seat Map</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={LABEL}>Map name</label>
              <input value={newName} onChange={e => setNewName(e.target.value)} style={INPUT} />
            </div>
            <div>
              <label style={LABEL}>Venue map image (optional — can add later)</label>
              <ImageUpload value={newImage} onChange={setNewImage} />
            </div>
            <button
              onClick={createMap}
              disabled={creating}
              style={{ background: 'linear-gradient(135deg, #c9a85c, #e8d5a0)', color: '#09090f', fontWeight: 700, fontSize: '13px', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '12px 20px', borderRadius: '10px', border: 'none', cursor: creating ? 'not-allowed' : 'pointer', opacity: creating ? 0.7 : 1 }}
            >
              {creating ? 'Creating…' : 'Create Seat Map →'}
            </button>
          </div>
        </div>
      )}

      {/* ── Map exists ─────────────────────────────────────── */}
      {seatMap && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Map settings */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border-muted)', borderRadius: '14px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, minWidth: '260px' }}>
                <p style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)' }}>Map Settings</p>
                <div>
                  <label style={LABEL}>Name</label>
                  <input
                    value={mapName}
                    onChange={e => setMapName(e.target.value)}
                    onBlur={() => updateMap({ name: mapName })}
                    style={INPUT}
                  />
                </div>
                <div>
                  <label style={LABEL}>Venue map image</label>
                  <ImageUpload value={seatMap.image_url || ''} onChange={url => { updateMap({ image_url: url }); setSeatMap(prev => prev ? { ...prev, image_url: url } : prev); }} />
                </div>
              </div>
              <button
                onClick={deleteMap}
                style={{ fontSize: '12px', padding: '8px 16px', borderRadius: '8px', background: 'rgba(224,92,92,0.08)', border: '1px solid rgba(224,92,92,0.2)', color: 'var(--red)', cursor: 'pointer' }}
              >
                Delete Map
              </button>
            </div>
          </div>

          {/* Editor */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border-muted)', borderRadius: '14px', padding: '20px' }}>
            <p style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '16px' }}>
              Spot Layout
            </p>
            <SeatMapEditor
              seats={seatMap.seats}
              imageUrl={seatMap.image_url}
              onPlace={handlePlace}
              onMove={handleMove}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          </div>

          {/* Seat list table */}
          {seatMap.seats.length > 0 && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border-muted)', borderRadius: '14px', padding: '20px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>All Spots</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px', gap: '1px', fontSize: '12px' }}>
                {['Label', 'Capacity', 'Status', ''].map(h => (
                  <div key={h} style={{ padding: '6px 8px', color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: '10px' }}>{h}</div>
                ))}
                {seatMap.seats.map(seat => (
                  <>
                    <div key={`${seat.id}-l`} style={{ padding: '7px 8px', color: 'var(--text)', borderTop: '1px solid var(--border-muted)' }}>{seat.label}</div>
                    <div key={`${seat.id}-c`} style={{ padding: '7px 8px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-muted)' }}>{seat.capacity}</div>
                    <div key={`${seat.id}-s`} style={{ padding: '7px 8px', borderTop: '1px solid var(--border-muted)' }}>
                      <span style={{
                        fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                        padding: '2px 7px', borderRadius: '999px',
                        background: seat.status === 'available' ? 'rgba(92,184,138,0.12)' : 'rgba(100,100,110,0.15)',
                        color: seat.status === 'available' ? 'var(--green)' : 'var(--text-muted)',
                      }}>
                        {seat.status}
                      </span>
                    </div>
                    <div key={`${seat.id}-d`} style={{ padding: '7px 8px', borderTop: '1px solid var(--border-muted)' }}>
                      <button onClick={() => handleDelete(seat.id)} style={{ fontSize: '11px', color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>✕</button>
                    </div>
                  </>
                ))}
              </div>
            </div>
          )}

          {/* Help */}
          <div style={{ background: 'rgba(201,168,92,0.05)', border: '1px solid rgba(201,168,92,0.15)', borderRadius: '10px', padding: '14px 16px' }}>
            <p style={{ fontSize: '12px', color: 'var(--text-dim)', lineHeight: 1.7 }}>
              <strong style={{ color: 'var(--gold)' }}>How it works:</strong> Enable seat selection per ticket type under
              {' '}<Link href={`/admin/events/${eventId}/tickets`} style={{ color: 'var(--gold)', textDecoration: 'none' }}>Ticket Types</Link>
              {' '}→ General tab → &ldquo;Require seat selection&rdquo; toggle.
              Customers will see this map on Step 2 of checkout, after choosing their tickets.
              Spots are held for 15 minutes once selected and confirmed when payment completes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
