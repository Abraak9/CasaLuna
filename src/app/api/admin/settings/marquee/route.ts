import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

const DEFAULT_TEXT = 'CASA LUNA · SOCIAL DANCE · LATIN PARTIES · SALSA · BACHATA · KIZOMBA · WORKSHOPS · BOOTCAMPS · EVENTS · TICKETS · GÖTEBORG · ';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await query<{ key: string; value: string }>(
    `SELECT key, value FROM settings WHERE key IN ('marquee_speed', 'marquee_text')`
  );
  const map = Object.fromEntries(rows.map(r => [r.key, r.value]));
  return NextResponse.json({
    speed: map.marquee_speed ? parseInt(map.marquee_speed) : 28,
    text: map.marquee_text ?? DEFAULT_TEXT,
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  // Save speed
  if (body.speed !== undefined) {
    const s = Math.round(Number(body.speed));
    if (!s || s < 5 || s > 120) {
      return NextResponse.json({ error: 'speed must be 5–120 seconds' }, { status: 400 });
    }
    await query(
      `INSERT INTO settings (key, value, updated_at) VALUES ('marquee_speed', $1, now())
       ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = now()`,
      [String(s)]
    );
  }

  // Save text
  if (body.text !== undefined) {
    const t = String(body.text).trim();
    if (!t) return NextResponse.json({ error: 'text cannot be empty' }, { status: 400 });
    if (t.length > 500) return NextResponse.json({ error: 'text too long (max 500 chars)' }, { status: 400 });
    await query(
      `INSERT INTO settings (key, value, updated_at) VALUES ('marquee_text', $1, now())
       ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = now()`,
      [t]
    );
  }

  return NextResponse.json({ saved: true });
}
