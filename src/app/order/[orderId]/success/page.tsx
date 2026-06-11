import Link from 'next/link';

export default function OrderSuccessPage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>

      {/* Glow */}
      <div style={{
        position: 'fixed', top: '40%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '500px', height: '500px',
        background: 'radial-gradient(ellipse, rgba(201,168,92,0.06) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        padding: '48px 36px',
        maxWidth: '420px',
        width: '100%',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Check icon */}
        <div style={{
          width: '64px', height: '64px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #c9a85c, #e8d5a0)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
          fontSize: '26px',
          color: '#09090f',
          fontWeight: 700,
        }}>
          ✓
        </div>

        <h1 style={{
          fontFamily: 'var(--font-cormorant)',
          fontSize: '36px',
          fontWeight: 600,
          color: 'var(--text)',
          letterSpacing: '-0.01em',
          marginBottom: '12px',
        }}>
          Booking Confirmed
        </h1>

        <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '28px' }}>
          Your tickets have been sent to your email address. Present the QR code at the door — one per person.
        </p>

        <div style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border-muted)',
          borderRadius: '12px',
          padding: '14px 16px',
          marginBottom: '28px',
          display: 'flex', alignItems: 'flex-start', gap: '10px',
          textAlign: 'left',
        }}>
          <span style={{ color: 'var(--gold)', fontSize: '16px', marginTop: '1px', flexShrink: 0 }}>◈</span>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Didn&apos;t receive the email? Check your spam folder, or use{' '}
            <Link href="/my-tickets" style={{ color: 'var(--gold)', textDecoration: 'none' }}>
              My Tickets
            </Link>{' '}
            to download your tickets anytime.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Link href="/" style={{
            display: 'block',
            background: 'linear-gradient(135deg, #c9a85c, #e8d5a0)',
            color: '#09090f',
            fontWeight: 700,
            fontSize: '14px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '16px',
            borderRadius: '12px',
            textDecoration: 'none',
          }}>
            Browse More Events
          </Link>
          <Link href="/my-tickets" style={{
            display: 'block',
            background: 'transparent',
            color: 'var(--gold)',
            fontWeight: 600,
            fontSize: '14px',
            letterSpacing: '0.04em',
            padding: '14px',
            borderRadius: '12px',
            textDecoration: 'none',
            border: '1px solid var(--border)',
          }}>
            View My Tickets →
          </Link>
        </div>
      </div>
    </main>
  );
}
