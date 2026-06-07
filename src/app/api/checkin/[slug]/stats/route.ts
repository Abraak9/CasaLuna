import { NextRequest, NextResponse } from 'next/server';
import { queryOne, query } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const event = await queryOne<{ id: string }>(
    `SELECT id FROM events WHERE slug = $1`, [slug]
  );

  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const stats = await queryOne<{
    total_sold: string; checked_in: string; not_checked_in: string;
  }>(
    `SELECT
       COUNT(a.id) AS total_sold,
       COUNT(a.id) FILTER (WHERE a.checked_in = true) AS checked_in,
       COUNT(a.id) FILTER (WHERE a.checked_in = false) AS not_checked_in
     FROM attendees a
     JOIN orders o ON o.id = a.order_id
     WHERE o.event_id = $1 AND o.status = 'paid'`,
    [event.id]
  );

  const byTicketType = await query<{
    name_es: string; name_en: string;
    total: string; checked_in: string;
  }>(
    `SELECT tt.name_es, tt.name_en,
       COUNT(a.id) AS total,
       COUNT(a.id) FILTER (WHERE a.checked_in = true) AS checked_in
     FROM attendees a
     JOIN ticket_types tt ON tt.id = a.ticket_type_id
     JOIN orders o ON o.id = a.order_id
     WHERE o.event_id = $1 AND o.status = 'paid'
     GROUP BY tt.id`,
    [event.id]
  );

  const recentCheckins = await query<{
    first_name: string; last_name: string;
    checked_in_at: string; name_es: string; name_en: string;
  }>(
    `SELECT a.first_name, a.last_name, a.checked_in_at,
            tt.name_es, tt.name_en
     FROM attendees a
     JOIN ticket_types tt ON tt.id = a.ticket_type_id
     JOIN orders o ON o.id = a.order_id
     WHERE o.event_id = $1 AND a.checked_in = true
     ORDER BY a.checked_in_at DESC
     LIMIT 20`,
    [event.id]
  );

  return NextResponse.json({
    stats: {
      total_sold: Number(stats?.total_sold ?? 0),
      checked_in: Number(stats?.checked_in ?? 0),
      not_checked_in: Number(stats?.not_checked_in ?? 0),
    },
    byTicketType,
    recentCheckins,
  });
}
