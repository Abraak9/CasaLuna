'use client';

import { useRef } from 'react';
import Image from 'next/image';

interface Props {
  imageUrl: string;
  position: string; // "50% 50%" format, or legacy "top"/"center"/"bottom"
  onChange: (pos: string) => void;
}

function parsePosition(pos: string): [number, number] {
  const match = pos.match(/(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%/);
  if (match) return [parseFloat(match[1]), parseFloat(match[2])];
  if (pos === 'top') return [50, 10];
  if (pos === 'bottom') return [50, 90];
  return [50, 50]; // center or fallback
}

export default function FocalPointPicker({ imageUrl, position, onChange }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [fx, fy] = parsePosition(position);

  const handlePointerEvent = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.buttons === 0 && e.type === 'mousemove') return; // only move while held
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(0, Math.min(100, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
    const y = Math.max(0, Math.min(100, Math.round(((e.clientY - rect.top) / rect.height) * 100)));
    onChange(`${x}% ${y}%`);
  };

  return (
    <div>
      <div
        ref={ref}
        onClick={handlePointerEvent}
        onMouseMove={handlePointerEvent}
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16 / 9',
          borderRadius: '10px',
          overflow: 'hidden',
          border: '1px solid var(--border)',
          cursor: 'crosshair',
          userSelect: 'none',
        }}
      >
        {/* Image — previews the crop in real time */}
        <Image
          src={imageUrl}
          alt=""
          fill
          style={{ objectFit: 'cover', objectPosition: `${fx}% ${fy}%`, pointerEvents: 'none' }}
          unoptimized
        />

        {/* Rule-of-thirds grid */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: [
            'linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)',
          ].join(', '),
          backgroundSize: '33.33% 33.33%',
        }} />

        {/* Focal point pin */}
        <div style={{
          position: 'absolute',
          left: `${fx}%`,
          top: `${fy}%`,
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 2,
        }}>
          {/* Crosshair lines */}
          <div style={{ position: 'absolute', top: '50%', left: '-18px', right: '-18px', height: '1px', background: 'rgba(255,255,255,0.75)', transform: 'translateY(-50%)' }} />
          <div style={{ position: 'absolute', left: '50%', top: '-18px', bottom: '-18px', width: '1px', background: 'rgba(255,255,255,0.75)', transform: 'translateX(-50%)' }} />
          {/* Ring */}
          <div style={{
            width: '26px', height: '26px', borderRadius: '50%',
            border: '2px solid #fff',
            boxShadow: '0 0 0 1px rgba(0,0,0,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.15)',
          }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#c9a85c', boxShadow: '0 0 0 1px rgba(0,0,0,0.4)' }} />
          </div>
        </div>

        {/* Dark vignette at edges to improve pin visibility */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.25) 100%)',
        }} />
      </div>

      <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '6px', lineHeight: 1.5 }}>
        Click (or drag) to set the focal point — the hero image always keeps this spot centred when cropped
      </p>
    </div>
  );
}
