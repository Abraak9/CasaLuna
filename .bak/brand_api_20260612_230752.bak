import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await query<{ key: string; value: string }>(
    `SELECT key, value FROM settings WHERE key = 'brand_logo_url'`
  );
  return NextResponse.json({ logo_url: rows[0]?.value || null });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { logo_url } = await req.json();
  if (!logo_url || typeof logo_url !== 'string') {
    return NextResponse.json({ error: 'logo_url required' }, { status: 400 });
  }

  await query(
    `INSERT INTO settings (key, value, updated_at)
     VALUES ('brand_logo_url', $1, now())
     ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = now()`,
    [logo_url]
  );

  return NextResponse.json({ logo_url, saved: true });
}
