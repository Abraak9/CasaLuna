import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

const DEFAULT_TEXT = 'CASA LUNA · SOCIAL DANCE · LATIN PARTIES · SALSA · BACHATA · KIZOMBA · WORKSHOPS · BOOTCAMPS · EVENTS · TICKETS · GÖTEBORG · ';

export async function GET() {
  try {
    const rows = await query<{ key: string; value: string }>(
      `SELECT key, value FROM settings WHERE key IN ('marquee_speed', 'marquee_text')`
    );
    const map = Object.fromEntries(rows.map(r => [r.key, r.value]));
    return NextResponse.json({
      speed: map.marquee_speed ? parseInt(map.marquee_speed) : 28,
      text: map.marquee_text ?? DEFAULT_TEXT,
    });
  } catch {
    return NextResponse.json({ speed: 28, text: DEFAULT_TEXT });
  }
}
