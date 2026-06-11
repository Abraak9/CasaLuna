import Link from 'next/link';
import Image from 'next/image';
import { brand } from '@/config/brand';

interface Event {
  id: string;
  slug: string;
  name_en: string;
  name_es: string;
  date: string;
  end_date: string;
  location_name: string;
  location_city: string;
  cover_image_url: string;
  status: string;
}

async function getEvents(): Promise<Event[]> {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${base}/api/events`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

function formatEventDate(dateStr: string) {
  const d = new Date(dateStr);
  return {
    day: d.toLocaleDateString('en-GB', { day: 'numeric' }),
    month: d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase(),
    year: d.toLocaleDateString('en-GB', { year: 'numeric' }),
    weekday: d.toLocaleDateString('en-GB', { weekday: 'long' }),
    time: d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    full: d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
  };
}

const MARQUEE_TEXT = 'CASA LUNA · SOCIAL DANCE · LATIN PARTIES · SALSA · BACHATA · KIZOMBA · WORKSHOPS · BOOTCAMPS · EVENTS · TICKETS · GÖTEBORG · ';

async function getBrandLogo(): Promise<string | null> {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${base}/api/settings/brand`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.logo_url || null;
  } catch { return null; }
}

export default async function HomePage() {
  const [events, brandLogo] = await Promise.all([getEvents(), getBrandLogo()]);
  const upcoming = events.filter(e => e.status === 'published');
  const marqueeRepeat = MARQUEE_TEXT.repeat(4);

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* ── Navigation ─────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(9,9,15,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-muted)',
        padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: '64px',
      }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          {brandLogo ? (
            <Image src={brandLogo} alt={brand.name} width={36} height={36} style={{ borderRadius: '6px', objectFit: 'contain' }} priority unoptimized />
          ) : (
            <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: '22px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }} className="cl-gold-text">
              Casa Luna
            </span>
          )}
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Link href="/my-tickets" style={{
            fontSize: '13px',
            color: 'var(--text-muted)',
            textDecoration: 'none',
            letterSpacing: '0.04em',
            transition: 'color 0.2s',
          }}>
            My Tickets
          </Link>
          <Link href="#events" style={{
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--gold)',
            textDecoration: 'none',
            padding: '8px 16px',
            border: '1px solid var(--border)',
            borderRadius: '999px',
            transition: 'background 0.2s',
          }}>
            Events
          </Link>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section style={{
        position: 'relative',
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '80px 24px 64px',
        overflow: 'hidden',
      }}>
        {/* Radial glow */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px', height: '400px',
          background: 'radial-gradient(ellipse, rgba(201,168,92,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          {brandLogo && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
              <Image src={brandLogo} alt={brand.name} width={120} height={120} style={{ borderRadius: '16px', objectFit: 'contain' }} priority unoptimized />
            </div>
          )}

          {/* Eyebrow */}
          <p style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: 'var(--gold)',
            marginBottom: '20px',
          }}>
            Official Ticketing
          </p>

          {/* Headline */}
          <h1 style={{
            fontFamily: 'var(--font-cormorant)',
            fontSize: 'clamp(52px, 10vw, 100px)',
            fontWeight: 300,
            lineHeight: 0.9,
            letterSpacing: '-0.02em',
            color: 'var(--text)',
            marginBottom: '8px',
          }}>
            Casa
          </h1>
          <h1 style={{
            fontFamily: 'var(--font-cormorant)',
            fontSize: 'clamp(52px, 10vw, 100px)',
            fontWeight: 600,
            lineHeight: 0.9,
            letterSpacing: '-0.02em',
            marginBottom: '32px',
          }} className="cl-gold-text">
            Luna
          </h1>

          <p style={{
            fontSize: '15px',
            color: 'var(--text-muted)',
            maxWidth: '400px',
            lineHeight: 1.7,
            letterSpacing: '0.02em',
          }}>
            Where movement becomes art. Curated Latin dance parties in Göteborg and beyond.
          </p>
        </div>
      </section>

      {/* ── Marquee ticker ─────────────────────────────────── */}
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
          }}>
            <span>{marqueeRepeat}</span>
            <span aria-hidden="true">{marqueeRepeat}</span>
          </div>
        </div>
      </div>

      {/* ── Events ─────────────────────────────────────────── */}
      <section id="events" style={{ padding: '64px 24px', maxWidth: '900px', margin: '0 auto' }}>

        <div style={{ marginBottom: '48px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <h2 style={{
            fontFamily: 'var(--font-cormorant)',
            fontSize: 'clamp(32px, 5vw, 48px)',
            fontWeight: 400,
            letterSpacing: '-0.01em',
            color: 'var(--text)',
          }}>
            Upcoming Events
          </h2>
          <div style={{
            width: '60px',
            height: '1px',
            background: 'linear-gradient(90deg, var(--gold), transparent)',
          }} />
        </div>

        {upcoming.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '80px 24px',
            border: '1px solid var(--border-muted)',
            borderRadius: '16px',
            color: 'var(--text-muted)',
          }}>
            <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: '24px', marginBottom: '8px' }}>
              No upcoming events
            </p>
            <p style={{ fontSize: '14px' }}>Check back soon — something is always in motion.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {upcoming.map((event, idx) => {
              const dt = formatEventDate(event.date);
              return (
                <Link
                  key={event.id}
                  href={`/event/${event.slug}`}
                  style={{ textDecoration: 'none' }}
                >
                  <article
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '80px 1fr auto',
                      alignItems: 'center',
                      gap: '24px',
                      padding: '24px 28px',
                      borderBottom: '1px solid var(--border-muted)',
                      transition: 'background 0.2s',
                      cursor: 'pointer',
                    }}
                    className="event-row"
                  >
                    {/* Date block */}
                    <div style={{ textAlign: 'center', flexShrink: 0 }}>
                      <p style={{
                        fontFamily: 'var(--font-cormorant)',
                        fontSize: '42px',
                        fontWeight: 500,
                        lineHeight: 1,
                        color: 'var(--gold)',
                      }}>
                        {dt.day}
                      </p>
                      <p style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '0.14em',
                        color: 'var(--text-muted)',
                        marginTop: '2px',
                      }}>
                        {dt.month}
                      </p>
                    </div>

                    {/* Event info */}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <h3 style={{
                          fontFamily: 'var(--font-cormorant)',
                          fontSize: '22px',
                          fontWeight: 600,
                          color: 'var(--text)',
                          letterSpacing: '-0.01em',
                        }}>
                          {event.name_en || event.name_es}
                        </h3>
                      </div>
                      <p style={{
                        fontSize: '13px',
                        color: 'var(--text-muted)',
                        letterSpacing: '0.02em',
                      }}>
                        {dt.weekday} · {dt.time}
                        {event.location_name && ` · ${event.location_name}`}
                        {event.location_city && `, ${event.location_city}`}
                      </p>
                    </div>

                    {/* CTA */}
                    <div style={{
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--gold)',
                    }}>
                      {event.cover_image_url && (
                        <div style={{ width: '56px', height: '56px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                          <Image
                            src={event.cover_image_url}
                            alt=""
                            width={56}
                            height={56}
                            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                          />
                        </div>
                      )}
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        Tickets
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid var(--border-muted)',
        padding: '40px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        color: 'var(--text-dim)',
      }}>
        {brandLogo && (
          <Image src={brandLogo} alt={brand.name} width={48} height={48} style={{ borderRadius: '8px', objectFit: 'contain', opacity: 0.85 }} unoptimized />
        )}
        <p style={{ fontSize: '12px', letterSpacing: '0.04em' }}>
          © {brand.name} AB · {brand.location} ·{' '}
          <a href={`mailto:${brand.email}`} style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
            {brand.email}
          </a>
        </p>
      </footer>

    </main>
  );
}
