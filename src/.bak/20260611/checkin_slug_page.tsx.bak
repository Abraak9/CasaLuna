'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamically import scanner to avoid SSR issues
const Html5QrcodeScanner = dynamic(
  () => import('@/components/QRScanner'),
  { ssr: false }
);

type ScanResult = {
  status: 'success' | 'already_scanned' | 'invalid';
  message: string;
  attendee?: { name: string; ticket: string };
};

type EventInfo = {
  id: string;
  name: string;
  date: string;
};

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
    if (res.ok && data.valid) {
      setEventInfo(data.event);
      setVerified(true);
    } else {
      setPinError('Incorrect PIN. Please try again.');
    }
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

    // Auto-clear and re-enable scanning after 3s
    if (resultTimeout.current) clearTimeout(resultTimeout.current);
    resultTimeout.current = setTimeout(() => {
      setScanResult(null);
      setScanning(true);
    }, 3000);
  };

  // PIN Entry Screen
  if (!verified) {
    return (
      <main className="min-h-screen bg-gray-900 flex flex-col items-center justify-center px-6">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🎟️</div>
          <h1 className="text-white text-2xl font-bold">Check-in Scanner</h1>
          <p className="text-gray-400 text-sm mt-1">Casa Luna Events</p>
        </div>

        <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-sm">
          <label className="text-gray-300 text-sm font-medium block mb-2">Event PIN</label>
          <input
            type="number"
            value={pinInput}
            onChange={e => setPinInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && verifyPin()}
            placeholder="Enter PIN"
            className="w-full bg-gray-700 text-white text-center text-2xl font-bold tracking-widest rounded-xl px-4 py-4 border border-gray-600 focus:outline-none focus:border-pink-500 mb-3"
            maxLength={6}
          />
          {pinError && <p className="text-red-400 text-sm text-center mb-3">{pinError}</p>}
          <button
            onClick={verifyPin}
            className="w-full cl-gradient text-white font-bold py-3.5 rounded-xl text-base"
          >
            Enter →
          </button>
        </div>
      </main>
    );
  }

  // Scanner Screen
  const resultColors = {
    success: 'bg-green-500',
    already_scanned: 'bg-amber-500',
    invalid: 'bg-red-500',
  };

  const resultIcons = {
    success: '✓',
    already_scanned: '⚠',
    invalid: '✗',
  };

  return (
    <main className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-white font-semibold text-sm">{eventInfo?.name}</p>
          <p className="text-gray-400 text-xs">
            {eventInfo?.date ? new Date(eventInfo.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}
          </p>
        </div>
        <span className="text-green-400 text-xs font-medium bg-green-400/10 px-2 py-1 rounded-full">● Live</span>
      </div>

      {/* Camera Scanner */}
      <div className="flex-1 relative overflow-hidden">
        {scanning && <Html5QrcodeScanner onScan={handleScan} />}

        {/* Scan result overlay */}
        {scanResult && (
          <div className={`absolute inset-0 ${resultColors[scanResult.status]} flex flex-col items-center justify-center px-8 text-white text-center`}>
            <div className="text-7xl font-bold mb-4">{resultIcons[scanResult.status]}</div>
            {scanResult.attendee && (
              <>
                <p className="text-2xl font-bold mb-1">{scanResult.attendee.name}</p>
                <p className="text-white/80 text-sm mb-4">{scanResult.attendee.ticket}</p>
              </>
            )}
            <p className="text-lg font-medium">{scanResult.message}</p>
            <p className="text-white/60 text-sm mt-6">Scanning again in 3s...</p>
          </div>
        )}
      </div>

      {/* Bottom hint */}
      {scanning && !scanResult && (
        <div className="bg-gray-800 px-4 py-4 text-center">
          <p className="text-gray-400 text-sm">Point camera at QR code</p>
        </div>
      )}
    </main>
  );
}
