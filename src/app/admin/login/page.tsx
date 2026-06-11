'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await signIn('credentials', { email, password, redirect: false });
    if (result?.error) {
      setError('Invalid email or password.');
      setLoading(false);
    } else {
      router.push('/admin');
    }
  };

  return (
    <main style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px',
    }}>
      {/* Glow */}
      <div style={{
        position: 'fixed', top: '40%', left: '50%', transform: 'translate(-50%,-50%)',
        width: '400px', height: '400px',
        background: 'radial-gradient(ellipse, rgba(201,168,92,0.06) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '20px', padding: '48px 36px',
        maxWidth: '380px', width: '100%',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <p style={{
            fontFamily: 'var(--font-cormorant)',
            fontSize: '32px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
          }} className="cl-gold-text">
            Casa Luna
          </p>
          <p style={{ fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-dim)', marginTop: '4px' }}>
            Admin Portal
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={{
                background: 'var(--surface-2)', border: '1px solid var(--border-muted)',
                color: 'var(--text)', borderRadius: '10px', padding: '12px 14px',
                fontSize: '14px', width: '100%', outline: 'none',
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={{
                background: 'var(--surface-2)', border: '1px solid var(--border-muted)',
                color: 'var(--text)', borderRadius: '10px', padding: '12px 14px',
                fontSize: '14px', width: '100%', outline: 'none',
              }}
            />
          </div>
          {error && (
            <p style={{ color: 'var(--red)', fontSize: '13px', textAlign: 'center' }}>{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '4px',
              background: loading ? 'var(--surface-3)' : 'linear-gradient(135deg, #c9a85c, #e8d5a0)',
              color: loading ? 'var(--text-muted)' : '#09090f',
              fontWeight: 700, fontSize: '14px', letterSpacing: '0.08em', textTransform: 'uppercase',
              padding: '16px', borderRadius: '12px', border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>
      </div>
    </main>
  );
}
