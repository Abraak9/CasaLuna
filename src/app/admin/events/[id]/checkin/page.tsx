'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Stats { total_sold: number; checked_in: number; not_checked_in: number; }
interface TicketStat { name_es: string; name_en: string; total: number; checked_in: number; }
interface RecentCheckin { first_name: string; last_name: string; checked_in_at: string; name_es: string; name_en: string; }
interface CheckinData { stats: Stats; byTicketType: TicketStat[]; recentCheckins: RecentCheckin[]; }

export default function CheckinDashboard() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<CheckinData | null>(null);
  const [slug, setSlug] = useState('');
  const [eventName, setEventName] = useState('');
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const fetchStats = useCallback(async () => {
    if (!slug) return;
    const res = await fetch(`/api/checkin/${slug}/stats`);
    if (res.ok) { setData(await res.json()); setLastUpdate(new Date()); }
  }, [slug]);

  useEffect(() => {
    fetch(`/api/admin/events/${id}`)
      .then(r => r.json())
      .then(e => { setSlug(e.slug); setEventName(e.name_en || e.name_es || ''); });
  }, [id]);

  useEffect(() => {
    if (!slug) return;
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [slug, fetchStats]);

  const checkinPercent = data
    ? Math.round((data.stats.checked_in / Math.max(data.stats.total_sold, 1)) * 100)
    : 0;

  const S = {
    label: { fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--text-muted)' },
    card: { background: 'var(--surface)', border: '1px solid var(--border-muted)', borderRadius: '14px', padding: '20px' },
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/admin/events" style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none' }}>← Events</Link>
          <span style={{ color: 'var(--border-muted)' }}>/</span>
          <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: '26px', fontWeight: 600, color: 'var(--text)' }}>
            Live Check-in
          </h1>
          {eventName && <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>— {eventName}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
            Updated {lastUpdate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <span style={{ width: '7px', height: '7px', background: 'var(--green)', borderRadius: '50%', animation: 'pulse 2s infinite', display: 'inline-block' }} />
          {slug && (
            <Link href={`/checkin/${slug}`} target="_blank" style={{
              background: 'linear-gradient(135deg, #c9a85c, #e8d5a0)', color: '#09090f',
              fontSize: '12px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
              padding: '8px 14px', borderRadius: '8px', textDecoration: 'none',
            }}>
              Open Scanner ↗
            </Link>
          )}
        </div>
      </div>

      {!data ? (
        <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-muted)' }}>
          <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: '22px' }}>Loading check-in data…</p>
        </div>
      ) : (
        <>
          {/* Big Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
            <div style={{ ...S.card, textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: '48px', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>
                {data.stats.total_sold}
              </p>
              <p style={{ ...S.label, marginTop: '6px' }}>Tickets Sold</p>
            </div>
            <div style={{ ...S.card, textAlign: 'center', borderColor: 'rgba(92,184,138,0.3)', background: 'rgba(92,184,138,0.05)' }}>
              <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: '48px', fontWeight: 700, color: 'var(--green)', lineHeight: 1 }}>
                {data.stats.checked_in}
              </p>
              <p style={{ ...S.label, marginTop: '6px', color: 'var(--green)' }}>Checked In</p>
            </div>
            <div style={{ ...S.card, textAlign: 'center', borderColor: 'rgba(232,168,74,0.3)', background: 'rgba(232,168,74,0.05)' }}>
              <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: '48px', fontWeight: 700, color: 'var(--amber)', lineHeight: 1 }}>
                {data.stats.not_checked_in}
              </p>
              <p style={{ ...S.label, marginTop: '6px', color: 'var(--amber)' }}>Not Arrived</p>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ ...S.card, marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Check-in progress</span>
              <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: '24px', fontWeight: 700, color: 'var(--gold)' }}>{checkinPercent}%</span>
            </div>
            <div style={{ height: '8px', background: 'var(--surface-2)', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${checkinPercent}%`,
                background: 'linear-gradient(90deg, #c9a85c, #e8d5a0)',
                borderRadius: '999px',
                transition: 'width 0.5s ease',
              }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* By Ticket Type */}
            <div style={S.card}>
              <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '16px' }}>By Ticket Type</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {data.byTicketType.map((tt, i) => {
                  const pct = Math.round((Number(tt.checked_in) / Math.max(Number(tt.total), 1)) * 100);
                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text)' }}>{tt.name_en || tt.name_es}</span>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--green)' }}>{tt.checked_in}/{tt.total}</span>
                      </div>
                      <div style={{ height: '4px', background: 'var(--surface-2)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: 'rgba(92,184,138,0.7)', borderRadius: '999px' }} />
                      </div>
                    </div>
                  );
                })}
                {data.byTicketType.length === 0 && (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No data yet</p>
                )}
              </div>
            </div>

            {/* Recent Check-ins */}
            <div style={S.card}>
              <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '16px' }}>Recent Check-ins</h2>
              <div>
                {data.recentCheckins.map((c, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-muted)' }}>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>{c.first_name} {c.last_name}</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.name_en || c.name_es}</p>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontVariantNumeric: 'tabular-nums' }}>
                      {new Date(c.checked_in_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
                {data.recentCheckins.length === 0 && (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No check-ins yet</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
