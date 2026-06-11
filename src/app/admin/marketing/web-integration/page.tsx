'use client';

import { useState } from 'react';

export default function WebIntegrationPage() {
  const [selectedEvent, setSelectedEvent] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://tickets.casaluna.se';

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const iframeCode = `<iframe
  src="${baseUrl}${selectedEvent ? `/event/${selectedEvent}` : ''}"
  width="100%"
  height="700"
  frameborder="0"
  allow="payment"
  style="border-radius:16px;border:none;"
></iframe>`;

  const scriptCode = `<div id="casaluna-tickets" data-event="${selectedEvent || 'your-event-slug'}"></div>
<script src="${baseUrl}/embed.js" async></script>`;

  const linkCode = `${baseUrl}${selectedEvent ? `/event/${selectedEvent}` : ''}`;

  const CodeBlock = ({ label, code, id }: { label: string; code: string; id: string }) => (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{label}</p>
        <button
          onClick={() => copy(code, id)}
          style={{
            background: copied === id ? 'rgba(92,184,138,0.12)' : 'var(--surface-2)',
            color: copied === id ? 'var(--green)' : 'var(--text-muted)',
            border: '1px solid var(--border-muted)',
            borderRadius: '7px', padding: '5px 12px', fontSize: '12px',
            cursor: 'pointer', fontWeight: 600,
          }}
        >
          {copied === id ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre style={{
        background: 'var(--surface-2)', border: '1px solid var(--border-muted)',
        borderRadius: '10px', padding: '16px',
        fontSize: '12px', fontFamily: 'monospace',
        color: 'var(--gold)', lineHeight: 1.7, overflowX: 'auto',
        whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0,
      }}>
        {code}
      </pre>
    </div>
  );

  return (
    <div style={{ maxWidth: '720px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: '28px', fontWeight: 600, color: 'var(--text)' }}>
          Web Integration
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
          Embed the ticket purchase flow on your own website
        </p>
      </div>

      {/* Event selector */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px', marginBottom: '24px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
          Event slug (optional)
        </p>
        <input
          value={selectedEvent}
          onChange={e => setSelectedEvent(e.target.value)}
          placeholder="leave blank to show all events"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border-muted)', color: 'var(--text)', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', width: '100%', outline: 'none' }}
        />
        <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '6px' }}>
          Enter a specific event slug to embed a single event, or leave blank to embed the full event listing.
        </p>
      </div>

      {/* Code blocks */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border-muted)', borderRadius: '14px', padding: '24px' }}>
        <CodeBlock label="Direct link" code={linkCode} id="link" />
        <CodeBlock label="iFrame embed" code={iframeCode} id="iframe" />
        <CodeBlock label="JavaScript widget" code={scriptCode} id="script" />

        <div style={{ background: 'rgba(201,168,92,0.06)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--gold)' }}>Note:</strong> The iFrame embed method works immediately. The JavaScript widget is planned for a future release. For best results on mobile, use the direct link.
          </p>
        </div>
      </div>
    </div>
  );
}
