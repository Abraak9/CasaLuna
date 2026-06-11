import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { queryOne, query } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  const device = await queryOne(
    `UPDATE scan_devices SET name=$1, event_id=$2, notes=$3, status=$4
     WHERE id=$5 RETURNING *`,
    [body.name, body.event_id || null, body.notes || null, body.status || 'active', id]
  );

  if (!device) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(device);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await query(`DELETE FROM scan_devices WHERE id=$1`, [id]);
  return NextResponse.json({ deleted: true });
}
