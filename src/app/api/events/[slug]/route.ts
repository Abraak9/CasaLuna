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

  const eventId = (event as { id: string }).id;

  const ticketTypes = await query(
    `SELECT tt.*,
      json_agg(pt ORDER BY pt.sort_order) FILTER (WHERE pt.id IS NOT NULL) AS price_tiers
     FROM ticket_types tt
     LEFT JOIN price_tiers pt ON pt.ticket_type_id = tt.id
     WHERE tt.event_id = $1
     GROUP BY tt.id
     ORDER BY tt.sort_order ASC`,
    [eventId]
  );

  const groups = await query(
    `SELECT * FROM ticket_groups WHERE event_id = $1 ORDER BY sort_order ASC, created_at ASC`,
    [eventId]
  );

  const bundles = await query(
    `SELECT b.*,
       COALESCE(
         json_agg(
           json_build_object(
             'ticket_type_id', bi.ticket_type_id,
             'quantity', bi.quantity,
             'ticket_name', tt.name_en,
             'ticket_price', tt.base_price,
             'ticket_currency', tt.currency,
             'stock_total', tt.stock_total,
             'stock_sold', tt.stock_sold,
             'collect_full_name', tt.collect_full_name,
             'collect_email', tt.collect_email,
             'collect_phone', tt.collect_phone,
             'collect_gender', tt.collect_gender,
             'collect_role', tt.collect_role,
             'collect_passport', tt.collect_passport,
             'collect_country', tt.collect_country,
             'collect_city', tt.collect_city
           ) ORDER BY bi.id
         ) FILTER (WHERE bi.id IS NOT NULL),
         '[]'
       ) AS items
     FROM ticket_bundles b
     LEFT JOIN ticket_bundle_items bi ON bi.bundle_id = b.id
     LEFT JOIN ticket_types tt ON tt.id = bi.ticket_type_id
     WHERE b.event_id = $1 AND b.visibility = 'visible'
     GROUP BY b.id
     ORDER BY b.sort_order ASC, b.created_at ASC`,
    [eventId]
  );

  return NextResponse.json({ event, ticketTypes, groups, bundles });
}
