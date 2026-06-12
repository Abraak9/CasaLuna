import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ seatId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { seatId } = await params;
  const body = await req.json();
  const allowed = ['label', 'x_percent', 'y_percent', 'capacity', 'status', 'sort_order'];
  const updates: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  for (const field of allowed) {
    if (body[field] !== undefined) {
      updates.push(`${field} = $${i++}`);
      values.push(body[field]);
    }
  }
  if (!updates.length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  values.push(seatId);
  const seat = await queryOne(
    `UPDATE seats SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`,
    values
  );
  return NextResponse.json(seat);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ seatId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { seatId } = await params;
  await query(`DELETE FROM seats WHERE id = $1`, [seatId]);
  return NextResponse.json({ deleted: true });
}
