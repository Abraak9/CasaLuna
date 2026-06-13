import { NextResponse } from 'next/server';
import { queryOne, query } from '@/lib/db';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const event = await queryOne(
    `SELECT * FROM events WHERE slug = $1 AND status = 'published'`,
    [slug]
  );

  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  const ticketTypes = await query(
    `SELECT tt.*,
      json_agg(pt ORDER BY pt.sort_order) FILTER (WHERE pt.id IS NOT NULL) AS price_tiers
     FROM ticket_types tt
     LEFT JOIN price_tiers pt ON pt.ticket_type_id = tt.id
     WHERE tt.event_id = $1
     GROUP BY tt.id
     ORDER BY tt.sort_order ASC`,
    [(event as { id: string }).id]
  );

  return NextResponse.json({ event, ticketTypes });
}
