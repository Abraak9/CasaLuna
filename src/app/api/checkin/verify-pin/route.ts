import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { slug, pin } = await req.json();

  if (!slug || !pin) {
    return NextResponse.json({ error: 'Missing slug or pin' }, { status: 400 });
  }

  const event = await queryOne<{ id: string; checkin_pin: string; name_es: string; name_en: string; date: string }>(
    `SELECT id, checkin_pin, name_es, name_en, date FROM events WHERE slug = $1 AND status = 'published'`,
    [slug]
  );

  if (!event || event.checkin_pin !== pin.trim()) {
    return NextResponse.json({ error: 'Invalid PIN or event not found' }, { status: 401 });
  }

  return NextResponse.json({
    valid: true,
    event: {
      id: event.id,
      name: event.name_en || event.name_es,
      date: event.date,
    },
  });
}
