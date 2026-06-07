'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Stats {
  total_sold: number;
  checked_in: number;
  not_checked_in: number;
}

interface TicketStat {
  name_es: string;
  name_en: string;
  total: number;
  checked_in: number;
}

interface RecentCheckin {
  first_name: string;
  last_name: string;
  checked_in_at: string;
  name_es: string;
  name_en: string;
}

interface CheckinData {
  stats: Stats;
  byTicketType: TicketStat[];
  recentCheckins: RecentCheckin[];
}

export default function CheckinDashboard() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<CheckinData | null>(null);
  const [slug, setSlug] = useState('');
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const fetchStats = useCallback(async () => {
    if (!slug) return;
    const res = await fetch(`/api/checkin/${slug}/stats`);
    if (res.ok) {
      const d = await res.json();
      setData(d);
      setLastUpdate(new Date());
    }
  }, [slug]);

  // Load event slug first
  useEffect(() => {
    fetch(`/api/admin/events/${id}`)
      .then(r => r.json())
      .then(e => setSlug(e.slug));
  }, [id]);

  // Poll every 10s
  useEffect(() => {
    if (!slug) return;
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [slug, fetchStats]);

  const checkinPercent = data
    ? Math.round((data.stats.checked_in / Math.max(data.stats.total_sold, 1)) * 100)
    : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/events" className="text-gray-400 hover:text-gray-600">← Events</Link>
          <h1 className="text-2xl font-bold">Live Check-in</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            Updated {lastUpdate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          {slug && (
            <Link href={`/checkin/${slug}`} target="_blank"
              className="cl-gradient text-white text-xs font-medium px-3 py-1.5 rounded-lg">
              Open Scanner ↗
            </Link>
          )}
        </div>
      </div>

      {!data ? (
        <div className="text-center py-16 text-gray-400">Loading check-in data...</div>
      ) : (
        <>
          {/* Big Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
              <p className="text-3xl font-bold text-gray-900">{data.stats.total_sold}</p>
              <p className="text-gray-500 text-sm mt-1">Tickets Sold</p>
            </div>
            <div className="bg-white rounded-2xl border border-green-100 bg-green-50 p-5 text-center">
              <p className="text-3xl font-bold text-green-600">{data.stats.checked_in}</p>
              <p className="text-green-600 text-sm mt-1">Checked In</p>
            </div>
            <div className="bg-white rounded-2xl border border-orange-100 bg-orange-50 p-5 text-center">
              <p className="text-3xl font-bold text-orange-500">{data.stats.not_checked_in}</p>
              <p className="text-orange-500 text-sm mt-1">Not Arrived</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Check-in progress</span>
              <span className="font-bold">{checkinPercent}%</span>
            </div>
            <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full cl-gradient rounded-full transition-all duration-500"
                style={{ width: `${checkinPercent}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* By Ticket Type */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-semibold mb-4">By Ticket Type</h2>
              <div className="space-y-3">
                {data.byTicketType.map((tt, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{tt.name_en || tt.name_es}</span>
                      <span className="font-medium text-green-600">{tt.checked_in}/{tt.total}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-400 rounded-full"
                        style={{ width: `${Math.round((Number(tt.checked_in) / Math.max(Number(tt.total), 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
                {data.byTicketType.length === 0 && (
                  <p className="text-gray-400 text-sm">No data yet</p>
                )}
              </div>
            </div>

            {/* Recent Check-ins */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-semibold mb-4">Recent Check-ins</h2>
              <div className="space-y-2">
                {data.recentCheckins.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-gray-50">
                    <div>
                      <p className="font-medium">{c.first_name} {c.last_name}</p>
                      <p className="text-gray-400 text-xs">{c.name_en || c.name_es}</p>
                    </div>
                    <span className="text-gray-400 text-xs">
                      {new Date(c.checked_in_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
                {data.recentCheckins.length === 0 && (
                  <p className="text-gray-400 text-sm">No check-ins yet</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
