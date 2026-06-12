import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const rows = await query<{ value: string }>(
      `SELECT value FROM settings WHERE key = 'marquee_speed'`
    );
    return NextResponse.json({ speed: rows[0]?.value ? parseInt(rows[0].value) : 28 });
  } catch {
    return NextResponse.json({ speed: 28 });
  }
}
