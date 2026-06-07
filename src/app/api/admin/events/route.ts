import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const events = await query(`
    SELECT e.*,
      COALESCE(SUM(tt.stock_total), 0) AS tickets_total,
      COUNT(DISTINCT a.id) FILTER (WHERE o.status = 'paid') AS tickets_sold,
      COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'paid') AS orders_count,
      COALESCE(SUM(o.total_amount) FILTER (WHERE o.status = 'paid'), 0) AS revenue
    FROM events e
    LEFT JOIN ticket_types tt ON tt.event_id = e.id
    LEFT JOIN orders o ON o.event_id = e.id
    LEFT JOIN attendees a ON a.order_id = o.id
    GROUP BY e.id
    ORDER BY e.date DESC
  `);

  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const {
    slug, name_en, name_es, description_en, description_es,
    date, end_date, location_name, location_address, location_city,
    cover_image_url, status, checkin_pin, max_capacity,
  } = body;

  if (!slug || !name_es || !date) {
    return NextResponse.json({ error: 'slug, name_es, and date are required' }, { status: 400 });
  }

  const existing = await queryOne(`SELECT id FROM events WHERE slug = $1`, [slug]);
  if (existing) return NextResponse.json({ error: 'Slug already taken' }, { status: 409 });

  const event = await queryOne(
    `INSERT INTO events
       (id, slug, name_en, name_es, description_en, description_es,
        date, end_date, location_name, location_address, location_city,
        cover_image_url, status, checkin_pin, max_capacity)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
     RETURNING *`,
    [
      uuidv4(), slug, name_en, name_es, description_en, description_es,
      date, end_date, location_name, location_address, location_city,
      cover_image_url, status || 'draft', checkin_pin, max_capacity,
    ]
  );

  return NextResponse.json(event, { status: 201 });
}
