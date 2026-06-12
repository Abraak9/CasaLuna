import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const seatMap = await queryOne(
    `SELECT sm.id, sm.name, sm.image_url, sm.event_id,
       COALESCE(
         json_agg(s ORDER BY s.sort_order, s.created_at) FILTER (WHERE s.id IS NOT NULL),
         '[]'
       ) AS seats
     FROM seat_maps sm
     LEFT JOIN seats s ON s.seat_map_id = sm.id
     WHERE sm.event_id = $1
     GROUP BY sm.id`,
    [id]
  );

  return NextResponse.json(seatMap || null);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { name, image_url } = await req.json();

  const existing = await queryOne(`SELECT id FROM seat_maps WHERE event_id = $1`, [id]);
  if (existing) return NextResponse.json({ error: 'Seat map already exists' }, { status: 409 });

  const seatMap = await queryOne(
    `INSERT INTO seat_maps (id, event_id, name, image_url)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [uuidv4(), id, name || 'Venue Layout', image_url || null]
  );

  return NextResponse.json({ ...seatMap, seats: [] }, { status: 201 });
}
