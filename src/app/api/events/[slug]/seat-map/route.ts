import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Release expired holds
  await query(
    `UPDATE seat_reservations SET status = 'released'
     WHERE status = 'held' AND held_until < now()`
  );

  const seatMap = await queryOne(
    `SELECT
       sm.id, sm.name, sm.image_url,
       COALESCE(
         json_agg(
           json_build_object(
             'id',           s.id,
             'label',        s.label,
             'x_percent',    s.x_percent::float,
             'y_percent',    s.y_percent::float,
             'capacity',     s.capacity,
             'status',       s.status,
             'is_available', (
               s.status = 'available' AND NOT EXISTS (
                 SELECT 1 FROM seat_reservations sr
                 WHERE sr.seat_id = s.id
                   AND sr.status IN ('held', 'confirmed')
               )
             )
           ) ORDER BY s.sort_order, s.created_at
         ) FILTER (WHERE s.id IS NOT NULL),
         '[]'
       ) AS seats
     FROM seat_maps sm
     JOIN events e ON e.id = sm.event_id
     LEFT JOIN seats s ON s.seat_map_id = sm.id
     WHERE e.slug = $1
     GROUP BY sm.id`,
    [slug]
  );

  return NextResponse.json(seatMap || null);
}
