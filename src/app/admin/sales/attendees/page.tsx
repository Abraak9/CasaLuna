'use client';

import { useEffect, useState } from 'react';

interface Attendee {
  id: string;
  first_name: string;
  last_name: string;
  attendee_email: string | null;
  order_email: string;
  gender: string | null;
  role: string | null;
  residence_country: string | null;
  residence_city: string | null;
  qr_code: string;
  checked_in_at: string | null;
  ticket_name: string;
  ticket_category: string;
  event_name: string;
  event_date: string;
  order_id: string;
  order_date: string;
}

export default function AttendeesPage() {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (filterRole) params.set('role', filterRole);
    if (filterGender) params.set('gender', filterGender);
    fetch(`/api/admin/sales/attendees?${params}`)
      .then(r => r.json())
      .then(d => { setAttendees(d); setLoading(false); });
  }, [search, filterRole, filterGender]);

  const exportCSV = () => {
    const rows = [
      ['Name', 'Email', 'Ticket', 'Event', 'Date', 'Role', 'Gender', 'Country', 'City', 'Checked In'],
      ...attendees.map(a => [
        `${a.first_name} ${a.last_name}`,
        a.order_email,
        a.ticket_name,
        a.event_name,
        new Date(a.event_date).toLocaleDateString('en-GB'),
        a.role || '',
        a.gender || '',
        a.residence_country || '',
        a.residence_city || '',
        a.checked_in_at ? 'Yes' : 'No',
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'attendees.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: '28px', fontWeight: 600, color: 'var(--text)' }}>Attendees</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {attendees.length} attendees total
          </p>
        </div>
        <button onClick={exportCSV} style={{
          background: 'var(--surface-2)', border: '1px solid var(--border-muted)',
          color: 'var(--text-muted)', fontSize: '13px', padding: '9px 16px', borderRadius: '10px', cursor: 'pointer',
        }}>
          ↓ Export CSV
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name or email…"
          style={{ background: 'var(--surface)', border: '1px solid var(--border-muted)', color: 'var(--text)', borderRadius: '999px', padding: '7px 16px', fontSize: '12px', outline: 'none', minWidth: '220px' }}
        />
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} style={{ background: 'var(--surface)', border: '1px solid var(--border-muted)', color: 'var(--text-muted)', borderRadius: '999px', padding: '7px 16px', fontSize: '12px', outline: 'none', appearance: 'none' }}>
          <option value="">All roles</option>
          <option value="leader">Leader</option>
          <option value="follower">Follower</option>
          <option value="both">Both</option>
        </select>
        <select value={filterGender} onChange={e => setFilterGender(e.target.value)} style={{ background: 'var(--surface)', border: '1px solid var(--border-muted)', color: 'var(--text-muted)', borderRadius: '999px', padding: '7px 16px', fontSize: '12px', outline: 'none', appearance: 'none' }}>
          <option value="">All genders</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Non-binary">Non-binary</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading…</div>
      ) : attendees.length === 0 ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border-muted)', borderRadius: '14px', padding: '48px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: '22px', color: 'var(--text-muted)' }}>No attendees found</p>
        </div>
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border-muted)', borderRadius: '14px', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
            <thead>
              <tr>
                {['Name', 'Email', 'Ticket', 'Event', 'Role', 'Gender', 'Country', 'Check-in'].map(h => (
                  <th key={h} style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-dim)', padding: '12px 14px', textAlign: 'left', borderBottom: '1px solid var(--border-muted)', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {attendees.map(a => (
                <tr key={a.id}>
                  <td style={{ padding: '11px 14px', borderBottom: '1px solid var(--border-muted)', fontSize: '13px', fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap' }}>
                    {a.first_name} {a.last_name}
                  </td>
                  <td style={{ padding: '11px 14px', borderBottom: '1px solid var(--border-muted)', fontSize: '12px', color: 'var(--text-muted)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.order_email}
                  </td>
                  <td style={{ padding: '11px 14px', borderBottom: '1px solid var(--border-muted)', fontSize: '12px', color: 'var(--gold)' }}>
                    {a.ticket_name}
                  </td>
                  <td style={{ padding: '11px 14px', borderBottom: '1px solid var(--border-muted)', fontSize: '12px', color: 'var(--text-muted)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.event_name}
                  </td>
                  <td style={{ padding: '11px 14px', borderBottom: '1px solid var(--border-muted)', fontSize: '12px', color: 'var(--text-muted)' }}>
                    {a.role || '—'}
                  </td>
                  <td style={{ padding: '11px 14px', borderBottom: '1px solid var(--border-muted)', fontSize: '12px', color: 'var(--text-muted)' }}>
                    {a.gender || '—'}
                  </td>
                  <td style={{ padding: '11px 14px', borderBottom: '1px solid var(--border-muted)', fontSize: '12px', color: 'var(--text-muted)' }}>
                    {a.residence_country || '—'}
                  </td>
                  <td style={{ padding: '11px 14px', borderBottom: '1px solid var(--border-muted)' }}>
                    <span style={{
                      fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em',
                      padding: '3px 8px', borderRadius: '999px',
                      background: a.checked_in_at ? 'rgba(92,184,138,0.12)' : 'var(--surface-3)',
                      color: a.checked_in_at ? 'var(--green)' : 'var(--text-dim)',
                    }}>
                      {a.checked_in_at ? '✓ In' : 'Pending'}
                    </span>
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
