'use client';

import { useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';

const QRScanner = dynamic(() => import('@/components/QRScanner'), { ssr: false });

type ScanResult = {
  status: 'success' | 'already_scanned' | 'invalid';
  message: string;
  attendee?: { name: string; ticket: string };
};

type EventInfo = { id: string; name: string; date: string; };

export default function CheckinPage() {
  const { slug } = useParams<{ slug: string }>();
  const [pinInput, setPinInput] = useState('');
  const [verified, setVerified] = useState(false);
  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null);
  const [pinError, setPinError] = useState('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(true);
  const resultTimeout = useRef<ReturnType<typeof setTimeout>>();

  const verifyPin = async () => {
    setPinError('');
    const res = await fetch('/api/checkin/verify-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, pin: pinInput }),
    });
    const data = await res.json();
    if (res.ok && data.valid) { setEventInfo(data.event); setVerified(true); }
    else { setPinError('Incorrect PIN. Try again.'); }
  };

  const handleScan = async (token: string) => {
    if (!scanning || !eventInfo) return;
    setScanning(false);
    const res = await fetch('/api/checkin/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, event_id: eventInfo.id }),
    });
    const data: ScanResult = await res.json();
    setScanResult(data);
    if (resultTimeout.current) clearTimeout(resultTimeout.current);
    resultTimeout.current = setTimeout(() => { setScanResult(null); setScanning(true); }, 3000);
  };

  // ── PIN screen ─────────────────────────────────────────────────
  if (!verified) {
    return (
      <main style={{ minHeight: '100vh', background: '#09090f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: '28px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '4px' }} className="cl-gold-text">
            Casa Luna
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>Check-in Scanner</p>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '320px' }}>
          <label style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '10px' }}>
            Event PIN
          </label>
          <input
            type="number"
            value={pinInput}
            onChange={e => setPinInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && verifyPin()}
            placeholder="·····"
            maxLength={8}
            style={{
              width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border-muted)',
              color: 'var(--gold)', borderRadius: '10px', padding: '16px',
              fontSize: '28px', fontWeight: 700, textAlign: 'center', letterSpacing: '0.3em',
              outline: 'none', marginBottom: '12px',
            }}
            autoFocus
          />
          {pinError && <p style={{ color: 'var(--red)', fontSize: '13px', textAlign: 'center', marginBottom: '12px' }}>{pinError}</p>}
          <button onClick={verifyPin} style={{
            width: '100%', background: 'linear-gradient(135deg, #c9a85c, #e8d5a0)', color: '#09090f',
            fontWeight: 700, fontSize: '14px', letterSpacing: '0.08em', textTransform: 'uppercase',
            padding: '14px', borderRadius: '10px', border: 'none', cursor: 'pointer',
          }}>
            Enter Scanner →
          </button>
        </div>
      </main>
    );
  }

  // ── Scanner screen ──────────────────────────────────────────────
  const RESULT_BG: Record<string, string> = {
    success: '#1a3d2a',
    already_scanned: '#3d2a00',
    invalid: '#3d1a1a',
  };
  const RESULT_COLOR: Record<string, string> = {
    success: 'var(--green)',
    already_scanned: 'var(--amber)',
    invalid: 'var(--red)',
  };
  const RESULT_ICON: Record<string, string> = {
    success: '✓', already_scanned: '⚠', invalid: '✗',
  };

  return (
    <main style={{ minHeight: '100vh', background: '#09090f', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border-muted)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '2px' }}>{eventInfo?.name}</p>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {eventInfo?.date ? new Date(eventInfo.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}
          </p>
        </div>
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--green)', background: 'rgba(92,184,138,0.12)', padding: '4px 12px', borderRadius: '999px', letterSpacing: '0.06em' }}>
          ● LIVE
        </span>
      </div>

      {/* Camera */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {scanning && <QRScanner onScan={handleScan} />}

        {scanResult && (
          <div style={{
            position: 'absolute', inset: 0,
            background: RESULT_BG[scanResult.status],
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '32px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '80px', fontWeight: 700, color: RESULT_COLOR[scanResult.status], lineHeight: 1, marginBottom: '16px' }}>
              {RESULT_ICON[scanResult.status]}
            </div>
            {scanResult.attendee && (
              <>
                <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px', fontFamily: 'var(--font-cormorant)' }}>
                  {scanResult.attendee.name}
                </p>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  {scanResult.attendee.ticket}
                </p>
              </>
            )}
            <p style={{ fontSize: '16px', fontWeight: 600, color: RESULT_COLOR[scanResult.status] }}>
              {scanResult.message}
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '24px', letterSpacing: '0.04em' }}>
              Scanning again in 3s…
            </p>
          </div>
        )}
      </div>

      {scanning && !scanResult && (
        <div style={{ background: 'var(--surface)', borderTop: '1px solid var(--border-muted)', padding: '16px', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Point camera at QR code</p>
        </div>
      )}
    </main>
  );
}
