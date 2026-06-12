import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ mapId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { mapId } = await params;
  const { label, x_percent, y_percent, capacity, sort_order } = await req.json();

  if (x_percent === undefined || y_percent === undefined) {
    return NextResponse.json({ error: 'x_percent and y_percent required' }, { status: 400 });
  }

  const seat = await queryOne(
    `INSERT INTO seats (id, seat_map_id, label, x_percent, y_percent, capacity, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [uuidv4(), mapId, label || '?', x_percent, y_percent, capacity || 1, sort_order ?? 0]
  );

  return NextResponse.json(seat, { status: 201 });
}
