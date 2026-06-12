'use client';

import { useState } from 'react';
import Image from 'next/image';

export interface PublicSeat {
  id: string;
  label: string;
  x_percent: number;
  y_percent: number;
  capacity: number;
  status: 'available' | 'blocked';
  is_available: boolean;
}

export interface PublicSeatMap {
  id: string;
  name: string;
  image_url: string;
  seats: PublicSeat[];
}

interface Props {
  seatMap: PublicSeatMap;
  totalRequired: number;   // number of spots the customer must select
  selected: string[];      // selected seat IDs
  onSelect: (ids: string[]) => void;
}

export default function SeatPicker({ seatMap, totalRequired, selected, onSelect }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);

  const filled = selected.length;
  const done = filled >= totalRequired;

  const toggle = (seat: PublicSeat) => {
    if (selected.includes(seat.id)) {
      onSelect(selected.filter(id => id !== seat.id));
    } else {
      if (!seat.is_available) return;
      if (filled >= totalRequired) return; // already have enough
      onSelect([...selected, seat.id]);
    }
  };

  return (
    <div>
      {/* Header / progress */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <p style={{ fontSize: '14px', color: 'var(--text)' }}>
          Choose {totalRequired} spot{totalRequired !== 1 ? 's' : ''} from the venue layout
        </p>
        <span style={{
          fontSize: '13px', fontWeight: 700,
          color: done ? 'var(--green)' : 'var(--gold)',
        }}>
          {filled} / {totalRequired} {done ? '✓' : 'selected'}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ height: '3px', background: 'var(--surface-2)', borderRadius: '99px', marginBottom: '16px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${Math.min(100, (filled / totalRequired) * 100)}%`,
          background: done ? 'var(--green)' : 'linear-gradient(90deg, #c9a85c, #e8d5a0)',
          borderRadius: '99px',
          transition: 'width 0.3s ease',
        }} />
      </div>

      {/* Map */}
      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16/9',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid var(--border)',
        background: '#000',
      }}>
        <Image src={seatMap.image_url} alt={seatMap.name} fill style={{ objectFit: 'contain' }} unoptimized />

        {seatMap.seats.map(seat => {
          const isSelected = selected.includes(seat.id);
          const isHovered = hovered === seat.id;
          const canSelect = seat.is_available && !isSelected && filled < totalRequired;
          const taken = !seat.is_available && !isSelected;

          const bg = taken
            ? 'rgba(60,60,70,0.85)'
            : isSelected
            ? '#c9a85c'
            : canSelect
            ? 'rgba(92,184,138,0.88)'
            : isHovered && !canSelect && !isSelected
            ? 'rgba(92,184,138,0.5)'
            : 'rgba(92,184,138,0.88)';

          return (
            <div
              key={seat.id}
              onClick={() => toggle(seat)}
              onMouseEnter={() => setHovered(seat.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                position: 'absolute',
                left: `${seat.x_percent}%`,
                top: `${seat.y_percent}%`,
                transform: `translate(-50%, -50%) scale(${isHovered ? 1.2 : 1})`,
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: bg,
                border: isSelected
                  ? '2px solid #fff'
                  : taken
                  ? '2px solid rgba(255,255,255,0.15)'
                  : '2px solid rgba(255,255,255,0.5)',
                boxShadow: isSelected
                  ? '0 0 12px rgba(201,168,92,0.55), 0 2px 8px rgba(0,0,0,0.4)'
                  : '0 2px 6px rgba(0,0,0,0.4)',
                cursor: taken ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: seat.label.length > 3 ? '7px' : '9px',
                fontWeight: 700,
                color: taken ? 'rgba(255,255,255,0.3)' : '#fff',
                transition: 'transform 0.1s ease, box-shadow 0.1s ease',
                zIndex: isSelected || isHovered ? 15 : 5,
                userSelect: 'none',
              }}
            >
              {seat.label}

              {/* Capacity badge */}
              {seat.capacity > 1 && (
                <span style={{
                  position: 'absolute', top: '-5px', right: '-5px',
                  background: isSelected ? '#fff' : 'rgba(201,168,92,0.9)',
                  color: isSelected ? '#c9a85c' : '#09090f',
                  borderRadius: '50%', width: '13px', height: '13px',
                  fontSize: '7px', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {seat.capacity}
                </span>
              )}

              {/* Tooltip */}
              {isHovered && (
                <div style={{
                  position: 'absolute',
                  bottom: 'calc(100% + 6px)',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(9,9,15,0.95)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  fontSize: '11px',
                  color: 'var(--text)',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  zIndex: 30,
                  textAlign: 'center',
                }}>
                  <strong>{seat.label}</strong>
                  {seat.capacity > 1 && <span style={{ color: 'var(--text-muted)' }}> · fits {seat.capacity}</span>}
                  <br />
                  <span style={{ color: isSelected ? '#c9a85c' : taken ? 'var(--text-dim)' : 'var(--green)' }}>
                    {isSelected ? '✓ Selected' : taken ? 'Taken' : 'Available'}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', marginTop: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {[
          { color: 'rgba(92,184,138,0.88)', label: 'Available' },
          { color: '#c9a85c', label: 'Your selection' },
          { color: 'rgba(60,60,70,0.85)', label: 'Taken' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, border: '1px solid rgba(255,255,255,0.3)' }} />
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
