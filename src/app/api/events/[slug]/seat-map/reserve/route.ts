import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await req.json();
  const seat_ids: string[] = body.seat_ids;

  if (!Array.isArray(seat_ids) || seat_ids.length === 0) {
    return NextResponse.json({ error: 'seat_ids required' }, { status: 400 });
  }

  // Release any stale holds
  await query(
    `UPDATE seat_reservations SET status = 'released'
     WHERE status = 'held' AND held_until < now()`
  );

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Validate each seat: must belong to this event and be available
    for (const seatId of seat_ids) {
      const res = await client.query(
        `SELECT s.id, s.status
         FROM seats s
         JOIN seat_maps sm ON sm.id = s.seat_map_id
         JOIN events e    ON e.id  = sm.event_id
         WHERE s.id = $1 AND e.slug = $2`,
        [seatId, slug]
      );
      if (!res.rows.length) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: `Seat not found` }, { status: 404 });
      }
      if (res.rows[0].status === 'blocked') {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: `Seat is blocked` }, { status: 409 });
      }
      const taken = await client.query(
        `SELECT id FROM seat_reservations
         WHERE seat_id = $1 AND status IN ('held', 'confirmed')`,
        [seatId]
      );
      if (taken.rows.length) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: `Seat already reserved` }, { status: 409 });
      }
    }

    const heldUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const reservationIds: string[] = [];

    for (const seatId of seat_ids) {
      const resId = uuidv4();
      reservationIds.push(resId);
      await client.query(
        `INSERT INTO seat_reservations (id, seat_id, temp_token, status, held_until)
         VALUES ($1, $2, $3, 'held', $4)`,
        [resId, seatId, uuidv4(), heldUntil]
      );
    }

    await client.query('COMMIT');
    return NextResponse.json({ reservation_ids: reservationIds, reserved_until: heldUntil });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[seat-reserve]', err);
    return NextResponse.json({ error: 'Reservation failed' }, { status: 500 });
  } finally {
    client.release();
  }
}
