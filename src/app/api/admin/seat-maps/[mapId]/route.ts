import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ mapId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { mapId } = await params;
  const body = await req.json();
  const updates: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  if (body.name !== undefined)      { updates.push(`name = $${i++}`);       values.push(body.name); }
  if (body.image_url !== undefined)  { updates.push(`image_url = $${i++}`);  values.push(body.image_url); }
  if (!updates.length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  updates.push(`updated_at = now()`);
  values.push(mapId);

  const seatMap = await queryOne(
    `UPDATE seat_maps SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`,
    values
  );
  return NextResponse.json(seatMap);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ mapId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { mapId } = await params;
  await query(`DELETE FROM seat_maps WHERE id = $1`, [mapId]);
  return NextResponse.json({ deleted: true });
}
