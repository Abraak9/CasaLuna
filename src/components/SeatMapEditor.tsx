'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';

export interface EditorSeat {
  id: string;
  label: string;
  x_percent: number;
  y_percent: number;
  capacity: number;
  status: 'available' | 'blocked';
}

interface Props {
  seats: EditorSeat[];
  imageUrl?: string;
  onPlace: (x: number, y: number) => Promise<void>;
  onMove: (id: string, x: number, y: number) => Promise<void>;
  onUpdate: (id: string, changes: Partial<Pick<EditorSeat, 'label' | 'capacity' | 'status'>>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const LABEL: React.CSSProperties = { fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '5px' };
const INPUT: React.CSSProperties = { width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border-muted)', color: 'var(--text)', borderRadius: '8px', padding: '8px 11px', fontSize: '13px', outline: 'none' };

export default function SeatMapEditor({ seats, imageUrl, onPlace, onMove, onUpdate, onDelete }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragPosRef = useRef({ x: 0, y: 0 });

  const [addMode, setAddMode] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  // Local overrides during drag (avoids waiting for parent re-render)
  const [dragOverride, setDragOverride] = useState<{ id: string; x: number; y: number } | null>(null);
  // Local edit state
  const [editLabel, setEditLabel] = useState('');
  const [editCapacity, setEditCapacity] = useState(1);
  const [editStatus, setEditStatus] = useState<'available' | 'blocked'>('available');

  const selected = seats.find(s => s.id === selectedId);

  const getPos = (e: React.MouseEvent): { x: number; y: number } => {
    const rect = containerRef.current!.getBoundingClientRect();
    return {
      x: Math.max(2, Math.min(98, +((((e.clientX - rect.left) / rect.width) * 100).toFixed(1)))),
      y: Math.max(2, Math.min(98, +((((e.clientY - rect.top) / rect.height) * 100).toFixed(1)))),
    };
  };

  const selectSeat = (seat: EditorSeat) => {
    setSelectedId(seat.id);
    setEditLabel(seat.label);
    setEditCapacity(seat.capacity);
    setEditStatus(seat.status);
  };

  const handleMapClick = async (e: React.MouseEvent) => {
    if (!addMode || draggingId) return;
    const pos = getPos(e);
    await onPlace(pos.x, pos.y);
    setAddMode(false);
  };

  const handleSeatMouseDown = (e: React.MouseEvent, seat: EditorSeat) => {
    e.stopPropagation();
    selectSeat(seat);
    setDraggingId(seat.id);
    dragPosRef.current = { x: seat.x_percent, y: seat.y_percent };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingId) return;
    const pos = getPos(e);
    dragPosRef.current = pos;
    setDragOverride({ id: draggingId, x: pos.x, y: pos.y });
  };

  const handleMouseUp = async () => {
    if (!draggingId) return;
    const id = draggingId;
    const pos = dragPosRef.current;
    setDraggingId(null);
    setDragOverride(null);
    await onMove(id, pos.x, pos.y);
  };

  const saveEdit = async () => {
    if (!selectedId) return;
    await onUpdate(selectedId, { label: editLabel, capacity: editCapacity, status: editStatus });
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    if (!confirm('Delete this spot?')) return;
    await onDelete(selectedId);
    setSelectedId(null);
  };

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <button
          onClick={() => { setAddMode(!addMode); setSelectedId(null); }}
          style={{
            fontSize: '12px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
            padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            background: addMode ? 'linear-gradient(135deg, #c9a85c, #e8d5a0)' : 'var(--surface-2)',
            color: addMode ? '#09090f' : 'var(--text)',
          }}
        >
          {addMode ? '× Cancel — click map to place' : '+ Add Spot'}
        </button>
        <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
          {seats.length} spot{seats.length !== 1 ? 's' : ''} placed
        </span>
        {addMode && (
          <span style={{ fontSize: '12px', color: 'var(--gold)', fontStyle: 'italic' }}>
            Click anywhere on the map to place a spot
          </span>
        )}
      </div>

      {/* Map canvas */}
      {!imageUrl ? (
        <div style={{ aspectRatio: '16/9', background: 'var(--surface-2)', border: '2px dashed var(--border-muted)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-dim)' }}>Upload a venue map image above to start placing spots</p>
        </div>
      ) : (
        <div
          ref={containerRef}
          onClick={handleMapClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '16/9',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid var(--border)',
            cursor: addMode ? 'crosshair' : 'default',
            userSelect: 'none',
          }}
        >
          <Image src={imageUrl} alt="Venue map" fill style={{ objectFit: 'contain', background: '#000' }} unoptimized />

          {/* Rule-of-thirds guide when in add mode */}
          {addMode && (
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              backgroundImage: 'linear-gradient(rgba(201,168,92,0.1) 1px,transparent 1px),linear-gradient(90deg,rgba(201,168,92,0.1) 1px,transparent 1px)',
              backgroundSize: '33.33% 33.33%',
            }} />
          )}

          {/* Seat markers */}
          {seats.map(seat => {
            const isDraggingThis = draggingId === seat.id;
            const x = isDraggingThis && dragOverride ? dragOverride.x : seat.x_percent;
            const y = isDraggingThis && dragOverride ? dragOverride.y : seat.y_percent;
            const isSelected = seat.id === selectedId;

            return (
              <div
                key={seat.id}
                onMouseDown={e => handleSeatMouseDown(e, seat)}
                onClick={e => { e.stopPropagation(); selectSeat(seat); }}
                title={`${seat.label} · capacity ${seat.capacity}`}
                style={{
                  position: 'absolute',
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: 'translate(-50%, -50%)',
                  width: isSelected ? '34px' : '28px',
                  height: isSelected ? '34px' : '28px',
                  borderRadius: '50%',
                  background: seat.status === 'blocked'
                    ? 'rgba(100,100,110,0.85)'
                    : isSelected
                    ? '#c9a85c'
                    : 'rgba(92,184,138,0.9)',
                  border: isSelected ? '2px solid #fff' : '2px solid rgba(255,255,255,0.55)',
                  boxShadow: isSelected
                    ? '0 0 0 3px rgba(201,168,92,0.35), 0 3px 10px rgba(0,0,0,0.5)'
                    : '0 2px 6px rgba(0,0,0,0.45)',
                  cursor: isDraggingThis ? 'grabbing' : 'grab',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: seat.label.length > 3 ? '7px' : '9px',
                  fontWeight: 700,
                  color: '#fff',
                  transition: isDraggingThis ? 'none' : 'width 0.1s, height 0.1s',
                  zIndex: isSelected || isDraggingThis ? 20 : 5,
                }}
              >
                {seat.label}
                {seat.capacity > 1 && (
                  <span style={{
                    position: 'absolute', top: '-6px', right: '-6px',
                    background: 'rgba(201,168,92,0.95)', color: '#09090f',
                    borderRadius: '50%', width: '14px', height: '14px',
                    fontSize: '8px', fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                  }}>
                    {seat.capacity}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
        {[
          { color: 'rgba(92,184,138,0.9)', label: 'Available' },
          { color: '#c9a85c', label: 'Selected' },
          { color: 'rgba(100,100,110,0.85)', label: 'Blocked' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color }} />
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{label}</span>
          </div>
        ))}
        <span style={{ fontSize: '11px', color: 'var(--text-dim)', marginLeft: 'auto' }}>
          Gold badge = capacity &gt; 1 · Drag spots to reposition
        </span>
      </div>

      {/* Edit panel */}
      {selected && (
        <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', marginTop: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gold)' }}>Edit Spot</p>
            <button
              onClick={() => setSelectedId(null)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}
            >×</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '10px', marginBottom: '10px' }}>
            <div>
              <label style={LABEL}>Label</label>
              <input
                value={editLabel}
                onChange={e => setEditLabel(e.target.value)}
                placeholder="e.g. B3, Table 4"
                style={INPUT}
                onBlur={saveEdit}
              />
            </div>
            <div>
              <label style={LABEL}>Capacity</label>
              <input
                type="number" min={1} max={20}
                value={editCapacity}
                onChange={e => setEditCapacity(Number(e.target.value))}
                style={INPUT}
                onBlur={saveEdit}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={async () => {
                const next = editStatus === 'available' ? 'blocked' : 'available';
                setEditStatus(next);
                await onUpdate(selected.id, { label: editLabel, capacity: editCapacity, status: next });
              }}
              style={{
                fontSize: '12px', fontWeight: 600, padding: '7px 14px', borderRadius: '7px', cursor: 'pointer',
                background: editStatus === 'available' ? 'rgba(224,92,92,0.08)' : 'rgba(92,184,138,0.1)',
                border: `1px solid ${editStatus === 'available' ? 'rgba(224,92,92,0.2)' : 'rgba(92,184,138,0.2)'}`,
                color: editStatus === 'available' ? 'var(--red)' : 'var(--green)',
              }}
            >
              {editStatus === 'available' ? 'Block spot' : 'Unblock spot'}
            </button>
            <button
              onClick={handleDelete}
              style={{ fontSize: '12px', fontWeight: 600, padding: '7px 14px', borderRadius: '7px', cursor: 'pointer', background: 'rgba(224,92,92,0.08)', border: '1px solid rgba(224,92,92,0.2)', color: 'var(--red)' }}
            >
              Delete spot
            </button>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)', marginLeft: '4px' }}>
              Position: {selected.x_percent}% / {selected.y_percent}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
