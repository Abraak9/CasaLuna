'use client';

import { useEffect, useState } from 'react';

interface EventOption { id: string; name_en: string; name_es: string; date: string; }
interface TicketOption { id: string; name_en: string; name_es: string; }

interface Props {
  eventId: string;
  ticketTypeIds: string[];
  onEventChange: (id: string) => void;
  onTicketTypesChange: (ids: string[]) => void;
}

const S: Record<string, React.CSSProperties> = {
  label: { fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' },
  select: { background: 'var(--surface-2)', border: '1px solid var(--border-muted)', color: 'var(--text)', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', width: '100%', outline: 'none', appearance: 'none' as const, cursor: 'pointer' },
};

export default function EventTicketSelector({ eventId, ticketTypeIds, onEventChange, onTicketTypesChange }: Props) {
  const [events, setEvents] = useState<EventOption[]>([]);
  const [tickets, setTickets] = useState<TicketOption[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  useEffect(() => {
    fetch('/api/admin/events')
      .then(r => r.json())
      .then(data => setEvents(Array.isArray(data) ? data : []));
  }, []);

  useEffect(() => {
    if (!eventId) { setTickets([]); return; }
    setLoadingTickets(true);
    fetch(`/api/admin/events/${eventId}/tickets`)
      .then(r => r.json())
      .then(data => { setTickets(Array.isArray(data) ? data : []); setLoadingTickets(false); })
      .catch(() => setLoadingTickets(false));
  }, [eventId]);

  const toggleTicket = (id: string) => {
    onTicketTypesChange(
      ticketTypeIds.includes(id)
        ? ticketTypeIds.filter(t => t !== id)
        : [...ticketTypeIds, id]
    );
  };

  return (
    <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--border-muted)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)' }}>
          Targeting
        </span>
        <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>— optional, leave blank for all events</span>
      </div>

      {/* Event selector */}
      <div>
        <label style={S.label}>Restrict to event</label>
        <select
          value={eventId}
          onChange={e => { onEventChange(e.target.value); onTicketTypesChange([]); }}
          style={S.select}
        >
          <option value="">All events (no restriction)</option>
          {events.map(e => (
            <option key={e.id} value={e.id}>
              {e.name_en || e.name_es}
              {e.date ? ` — ${new Date(e.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Ticket type checkboxes — only when an event is selected */}
      {eventId && (
        <div>
          <label style={S.label}>Restrict to ticket types</label>
          {loadingTickets ? (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading ticket types…</p>
          ) : tickets.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No ticket types found for this event</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {tickets.map(t => {
                const checked = ticketTypeIds.includes(t.id);
                return (
                  <label
                    key={t.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      cursor: 'pointer', fontSize: '13px', color: 'var(--text)',
                      padding: '8px 12px', borderRadius: '8px',
                      background: checked ? 'rgba(201,168,92,0.08)' : 'var(--surface-2)',
                      border: `1px solid ${checked ? 'rgba(201,168,92,0.3)' : 'var(--border-muted)'}`,
                      transition: 'all 0.15s',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleTicket(t.id)}
                      style={{ accentColor: '#c9a85c', width: '14px', height: '14px', flexShrink: 0 }}
                    />
                    {t.name_en || t.name_es}
                  </label>
                );
              })}
            </div>
          )}
          <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '6px' }}>
            {ticketTypeIds.length === 0
              ? 'Leave unchecked to apply to all ticket types in this event'
              : `${ticketTypeIds.length} ticket type${ticketTypeIds.length !== 1 ? 's' : ''} selected`}
          </p>
        </div>
      )}
    </div>
  );
}
