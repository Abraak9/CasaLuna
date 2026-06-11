'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';

interface Props {
  value: string;
  onChange: (url: string) => void;
}

export default function ImageUpload({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [showUrl, setShowUrl] = useState(false);

  const handleFile = async (file: File) => {
    setError('');
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok) { setError(data.error || 'Upload failed'); }
    else { onChange(data.url); }
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      {/* Preview */}
      {value && !uploading && (
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: '10px', overflow: 'hidden', marginBottom: '10px', background: 'var(--surface-2)' }}>
          <Image src={value} alt="Cover" fill style={{ objectFit: 'cover' }} unoptimized />
          <button
            onClick={() => onChange('')}
            style={{
              position: 'absolute', top: '8px', right: '8px',
              background: 'rgba(9,9,15,0.7)', color: 'var(--text)', border: 'none',
              borderRadius: '6px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer',
            }}
          >
            ✕ Remove
          </button>
        </div>
      )}

      {/* Drop zone */}
      {!value && (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          style={{
            border: '2px dashed var(--border-muted)',
            borderRadius: '10px',
            padding: '32px',
            textAlign: 'center',
            cursor: uploading ? 'not-allowed' : 'pointer',
            background: 'var(--surface-2)',
            transition: 'border-color 0.2s',
            marginBottom: '10px',
          }}
        >
          {uploading ? (
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Uploading…</p>
          ) : (
            <>
              <p style={{ fontSize: '24px', marginBottom: '8px' }}>🖼</p>
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>
                Click to upload or drag & drop
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>JPG, PNG or WebP</p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>
      )}

      {/* Help text */}
      <div style={{ background: 'rgba(201,168,92,0.05)', border: '1px solid rgba(201,168,92,0.15)', borderRadius: '8px', padding: '10px 14px', marginBottom: '8px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '5px' }}>
          Cover Image Guidelines
        </p>
        <ul style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.8, listStyle: 'none', padding: 0, margin: 0 }}>
          <li>📐 Ratio: <strong style={{ color: 'var(--text)' }}>16:9</strong> — e.g. 1280×720px or 1920×1080px</li>
          <li>📦 Max size: <strong style={{ color: 'var(--text)' }}>5MB</strong></li>
          <li>🖼 Formats: <strong style={{ color: 'var(--text)' }}>JPG, PNG, WebP</strong></li>
          <li>✨ The image fills the event page hero — avoid text-heavy images</li>
        </ul>
      </div>

      {error && <p style={{ fontSize: '12px', color: 'var(--red)', marginBottom: '6px' }}>{error}</p>}

      {/* URL fallback toggle */}
      <button
        type="button"
        onClick={() => setShowUrl(v => !v)}
        style={{ fontSize: '11px', color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, letterSpacing: '0.04em' }}
      >
        {showUrl ? '▲ Hide URL field' : '▾ Use image URL instead'}
      </button>

      {showUrl && (
        <input
          type="url"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="https://..."
          style={{
            marginTop: '8px', width: '100%',
            background: 'var(--surface-2)', border: '1px solid var(--border-muted)',
            color: 'var(--text)', borderRadius: '8px', padding: '9px 12px',
            fontSize: '13px', outline: 'none',
          }}
        />
      )}
    </div>
  );
}
