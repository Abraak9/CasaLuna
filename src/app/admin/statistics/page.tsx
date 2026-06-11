'use client';

import { useEffect, useState } from 'react';

interface StatItem { label: string; count: string; revenue?: string; }
interface Stats {
  byType: StatItem[];
  byCategory: StatItem[];
  byRole: StatItem[];
  byGender: StatItem[];
  byCountry: StatItem[];
  revenueOverTime: Array<{ date: string; orders: string; revenue: string }>;
}

function BarRow({ label, count, max, revenue }: { label: string; count: number; max: number; revenue?: number }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0' }}>
      <div style={{ width: '120px', fontSize: '13px', color: 'var(--text)', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
        {label}
      </div>
      <div style={{ flex: 1, height: '6px', background: 'var(--surface-3)', borderRadius: '999px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #c9a85c, #e8d5a0)', borderRadius: '999px', transition: 'width 0.4s ease' }} />
      </div>
      <div style={{ width: '40px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: 'var(--gold)', flexShrink: 0 }}>
        {count}
      </div>
      {revenue !== undefined && (
        <div style={{ width: '56px', textAlign: 'right', fontSize: '12px', color: 'var(--text-muted)', flexShrink: 0 }}>
          €{revenue.toFixed(0)}
        </div>
      )}
    </div>
  );
}

function StatCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border-muted)', borderRadius: '14px', padding: '20px' }}>
      <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px' }}>
        {title}
      </p>
      {children}
    </div>
  );
}

export default function StatisticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/statistics')
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false); });
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>Loading statistics…</div>;
  if (!stats) return null;

  const maxByType = Math.max(...stats.byType.map(x => Number(x.count)), 1);
  const maxByRole = Math.max(...stats.byRole.map(x => Number(x.count)), 1);
  const maxByGender = Math.max(...stats.byGender.map(x => Number(x.count)), 1);
  const maxByCountry = Math.max(...stats.byCountry.map(x => Number(x.count)), 1);
  const maxByCategory = Math.max(...stats.byCategory.map(x => Number(x.count)), 1);

  const totalRevenue = stats.revenueOverTime.reduce((s, r) => s + Number(r.revenue), 0);
  const totalOrders = stats.revenueOverTime.reduce((s, r) => s + Number(r.orders), 0);
  const maxRevenue = Math.max(...stats.revenueOverTime.map(r => Number(r.revenue)), 1);

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: '28px', fontWeight: 600, color: 'var(--text)' }}>Statistics</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>All-time analytics across all events</p>
      </div>

      {/* Revenue over time */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Revenue — last 30 days
          </p>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: '28px', fontWeight: 600, color: 'var(--gold)', lineHeight: 1 }}>
              €{totalRevenue.toLocaleString('en')}
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{totalOrders} orders</p>
          </div>
        </div>
        {stats.revenueOverTime.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--text-dim)', textAlign: 'center', padding: '20px' }}>No data yet</p>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '80px' }}>
            {stats.revenueOverTime.map(r => {
              const h = Math.max((Number(r.revenue) / maxRevenue) * 80, 2);
              return (
                <div key={r.date} title={`${r.date}: €${Number(r.revenue).toFixed(0)}`} style={{ flex: 1, height: `${h}px`, background: 'linear-gradient(180deg, #e8d5a0, #c9a85c)', borderRadius: '3px 3px 0 0', minWidth: '4px', transition: 'height 0.3s' }} />
              );
            })}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>

        {/* By ticket type */}
        <StatCard title="Tickets by type">
          {stats.byType.length === 0 ? <p style={{ color: 'var(--text-dim)', fontSize: '13px' }}>No data</p> :
            stats.byType.map(x => (
              <BarRow key={x.label} label={x.label} count={Number(x.count)} max={maxByType} revenue={Number(x.revenue)} />
            ))}
        </StatCard>

        {/* By category */}
        <StatCard title="Tickets by category">
          {stats.byCategory.length === 0 ? <p style={{ color: 'var(--text-dim)', fontSize: '13px' }}>No data</p> :
            stats.byCategory.map(x => (
              <BarRow key={x.label} label={x.label} count={Number(x.count)} max={maxByCategory} />
            ))}
        </StatCard>

        {/* By dance role */}
        <StatCard title="Attendees by role">
          {stats.byRole.length === 0 ? <p style={{ color: 'var(--text-dim)', fontSize: '13px' }}>No data</p> :
            stats.byRole.map(x => (
              <BarRow key={x.label} label={x.label} count={Number(x.count)} max={maxByRole} />
            ))}
        </StatCard>

        {/* By gender */}
        <StatCard title="Attendees by gender">
          {stats.byGender.length === 0 ? <p style={{ color: 'var(--text-dim)', fontSize: '13px' }}>No data</p> :
            stats.byGender.map(x => (
              <BarRow key={x.label} label={x.label} count={Number(x.count)} max={maxByGender} />
            ))}
        </StatCard>

        {/* By country */}
        <StatCard title="Attendees by country (top 10)">
          {stats.byCountry.length === 0 ? <p style={{ color: 'var(--text-dim)', fontSize: '13px' }}>No data (country field not collected)</p> :
            stats.byCountry.map(x => (
              <BarRow key={x.label} label={x.label} count={Number(x.count)} max={maxByCountry} />
            ))}
        </StatCard>

      </div>
    </div>
  );
}
