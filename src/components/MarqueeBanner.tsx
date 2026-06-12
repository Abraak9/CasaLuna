'use client';

import { useEffect, useState } from 'react';

const MARQUEE_TEXT = 'CASA LUNA · SOCIAL DANCE · LATIN PARTIES · SALSA · BACHATA · KIZOMBA · WORKSHOPS · BOOTCAMPS · EVENTS · TICKETS · GÖTEBORG · ';
const marqueeRepeat = MARQUEE_TEXT.repeat(4);

export default function MarqueeBanner() {
  const [speed, setSpeed] = useState(28);

  useEffect(() => {
    fetch('/api/settings/marquee')
      .then(r => r.json())
      .then(d => { if (d.speed) setSpeed(d.speed); })
      .catch(() => { /* keep default */ });
  }, []);

  return (
    <div style={{
      borderTop: '1px solid var(--border-muted)',
      borderBottom: '1px solid var(--border-muted)',
      padding: '12px 0',
      overflow: 'hidden',
      background: 'var(--surface)',
    }}>
      <div className="cl-marquee">
        <div className="cl-marquee-inner" style={{
          fontFamily: 'var(--font-cormorant)',
          fontSize: '14px',
          fontWeight: 500,
          letterSpacing: '0.18em',
          color: 'var(--gold)',
          textTransform: 'uppercase',
          animationDuration: `${speed}s`,
        }}>
          <span>{marqueeRepeat}</span>
          <span aria-hidden="true">{marqueeRepeat}</span>
        </div>
      </div>
    </div>
  );
}
