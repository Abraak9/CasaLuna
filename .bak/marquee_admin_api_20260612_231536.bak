import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await query<{ value: string }>(
    `SELECT value FROM settings WHERE key = 'marquee_speed'`
  );
  return NextResponse.json({ speed: rows[0]?.value ? parseInt(rows[0].value) : 28 });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { speed } = await req.json();
  const s = Math.round(Number(speed));
  if (!s || s < 5 || s > 120) {
    return NextResponse.json({ error: 'speed must be 5–120 seconds' }, { status: 400 });
  }

  await query(
    `INSERT INTO settings (key, value, updated_at)
     VALUES ('marquee_speed', $1, now())
     ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = now()`,
    [String(s)]
  );

  return NextResponse.json({ speed: s, saved: true });
}
