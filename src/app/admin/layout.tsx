'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { brand } from '@/config/brand';

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV: NavSection[] = [
  {
    title: '',
    items: [
      { href: '/admin', label: 'Dashboard', icon: '◈' },
    ],
  },
  {
    title: 'Events',
    items: [
      { href: '/admin/events', label: 'All Events', icon: '◎' },
    ],
  },
  {
    title: 'Marketing',
    items: [
      { href: '/admin/marketing/discounts', label: 'Discounts', icon: '◆' },
      { href: '/admin/marketing/promoters', label: 'Promoters', icon: '◉' },
      { href: '/admin/marketing/affiliates', label: 'Affiliates', icon: '◐' },
      { href: '/admin/marketing/web-integration', label: 'Web Integration', icon: '◫' },
    ],
  },
  {
    title: 'Sales',
    items: [
      { href: '/admin/sales/orders', label: 'Orders', icon: '▣' },
      { href: '/admin/sales/attendees', label: 'Attendees', icon: '◑' },
    ],
  },
  {
    title: 'Statistics',
    items: [
      { href: '/admin/statistics', label: 'Overview', icon: '◷' },
    ],
  },
  {
    title: 'Administration',
    items: [
      { href: '/admin/administration/scan-devices', label: 'Scan Devices', icon: '⬡' },
      { href: '/admin/administration/users', label: 'Users', icon: '◉' },
      { href: '/admin/administration/brand', label: 'Brand', icon: '◈' },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/settings/brand')
      .then(r => r.json())
      .then(d => { if (d.logo_url) setLogoUrl(d.logo_url); })
      .catch(() => {});
  }, []);

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  const SidebarContent = () => (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'var(--surface)', borderRight: '1px solid var(--border-muted)',
    }}>
      {/* Logo */}
      <div style={{
        padding: '20px 16px 16px',
        borderBottom: '1px solid var(--border-muted)',
      }}>
        <Link href="/admin" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={brand.name}
              width={44}
              height={44}
              style={{ borderRadius: '8px', objectFit: 'contain', flexShrink: 0 }}
              unoptimized
            />
          ) : (
            <div style={{
              width: '44px', height: '44px', borderRadius: '8px',
              background: 'var(--gold-subtle)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: '16px', fontWeight: 600 }} className="cl-gold-text">CL</span>
            </div>
          )}
          <div>
            <p style={{
              fontFamily: 'var(--font-cormorant)',
              fontSize: '16px',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }} className="cl-gold-text">
              Casa Luna
            </p>
            <p style={{ fontSize: '9px', letterSpacing: '0.14em', color: 'var(--text-dim)', textTransform: 'uppercase', marginTop: '1px' }}>
              Admin
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 8px' }}>
        {NAV.map((section) => (
          <div key={section.title}>
            {section.title && (
              <p style={{
                fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em',
                textTransform: 'uppercase', color: 'var(--text-dim)',
                padding: '16px 10px 6px',
              }}>
                {section.title}
              </p>
            )}
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '9px 12px', borderRadius: '8px',
                  fontSize: '13.5px', textDecoration: 'none',
                  color: isActive(item.href) ? 'var(--gold)' : 'var(--text-muted)',
                  background: isActive(item.href) ? 'var(--gold-subtle)' : 'transparent',
                  transition: 'all 0.15s',
                  marginBottom: '2px',
                }}
              >
                <span style={{ fontSize: '14px', opacity: 0.9 }}>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom: links */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border-muted)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <Link href="/" target="_blank" style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '8px 12px', borderRadius: '8px',
          fontSize: '13px', color: 'var(--text-dim)', textDecoration: 'none',
          transition: 'color 0.15s',
        }}>
          <span style={{ fontSize: '12px' }}>↗</span>
          View site
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '8px 12px', borderRadius: '8px',
            fontSize: '13px', color: 'var(--text-dim)',
            background: 'none', border: 'none', cursor: 'pointer',
            textAlign: 'left', transition: 'color 0.15s',
          }}
        >
          <span style={{ fontSize: '12px' }}>⏻</span>
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ── Desktop Sidebar ─────────────────────────────── */}
      <aside style={{
        width: '220px', flexShrink: 0,
        display: 'none',
        position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
      }} className="admin-sidebar-desktop">
        <SidebarContent />
      </aside>

      {/* ── Mobile overlay sidebar ──────────────────────── */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex' }}
          onClick={() => setSidebarOpen(false)}
        >
          <div
            style={{ width: '240px', height: '100%', zIndex: 61, flexShrink: 0 }}
            onClick={e => e.stopPropagation()}
          >
            <SidebarContent />
          </div>
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
        </div>
      )}

      {/* ── Main area ───────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Mobile top bar */}
        <header style={{
          height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px',
          borderBottom: '1px solid var(--border-muted)',
          background: 'var(--surface)',
          position: 'sticky', top: 0, zIndex: 30,
        }} className="admin-topbar-mobile">
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              background: 'none', border: 'none', color: 'var(--text-muted)',
              cursor: 'pointer', fontSize: '20px', padding: '4px',
            }}
          >
            ☰
          </button>
          <span style={{
            fontFamily: 'var(--font-cormorant)',
            fontSize: '18px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
          }} className="cl-gold-text">
            Casa Luna
          </span>
          <Link href="/" style={{ fontSize: '12px', color: 'var(--text-dim)', textDecoration: 'none' }}>
            ↗
          </Link>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '24px 20px', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (min-width: 900px) {
          .admin-sidebar-desktop { display: block !important; }
          .admin-topbar-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}
