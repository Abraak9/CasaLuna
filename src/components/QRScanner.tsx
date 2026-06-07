'use client';

import { useEffect, useRef } from 'react';

interface QRScannerProps {
  onScan: (token: string) => void;
}

export default function QRScanner({ onScan }: QRScannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<{ clear: () => Promise<void> } | null>(null);
  const lastScanRef = useRef<string>('');

  useEffect(() => {
    let mounted = true;

    async function startScanner() {
      if (!containerRef.current) return;

      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      try {
        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText: string) => {
            if (!mounted) return;
            if (decodedText === lastScanRef.current) return;
            lastScanRef.current = decodedText;
            onScan(decodedText);
          },
          () => {} // ignore scan errors (camera looking for QR)
        );
      } catch (err) {
        console.error('Camera start failed:', err);
      }
    }

    startScanner();

    return () => {
      mounted = false;
      scannerRef.current?.clear().catch(() => {});
    };
  }, [onScan]);

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center bg-black">
      <div id="qr-reader" className="w-full h-full" />
      {/* Scan frame overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-64 h-64 relative">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
        </div>
      </div>
    </div>
  );
}
