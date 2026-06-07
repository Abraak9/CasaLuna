import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  const events = await query(`
    SELECT
      e.id, e.slug, e.name_en, e.name_es,
      e.description_en, e.description_es,
      e.date, e.end_date,
      e.location_name, e.location_city,
      e.cover_image_url, e.status,
      COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'paid') AS orders_count,
      COALESCE(SUM(tt.stock_sold), 0) AS tickets_sold
    FROM events e
    LEFT JOIN orders o ON o.event_id = e.id
    LEFT JOIN ticket_types tt ON tt.event_id = e.id
    WHERE e.status = 'published'
    GROUP BY e.id
    ORDER BY e.date ASC
  `);

  return NextResponse.json(events);
}
