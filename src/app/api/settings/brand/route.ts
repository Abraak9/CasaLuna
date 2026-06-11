import { NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';

// Public endpoint — returns current brand logo URL
// Cached 5 minutes on the homepage
export async function GET() {
  try {
    const row = await queryOne<{ value: string }>(
      `SELECT value FROM settings WHERE key = 'brand_logo_url'`
    );
    return NextResponse.json({ logo_url: row?.value || null }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' },
    });
  } catch {
    // Settings table may not exist yet — return null gracefully
    return NextResponse.json({ logo_url: null });
  }
}
