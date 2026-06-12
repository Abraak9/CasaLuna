import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const { name, sort_order } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });
  const group = await queryOne(
    `UPDATE ticket_groups SET name=$1, sort_order=COALESCE($2,sort_order) WHERE id=$3 RETURNING *`,
    [name.trim(), sort_order ?? null, id]
  );
  if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(group);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  // Unassign tickets from this group first (ON DELETE SET NULL handles it in DB too)
  await query(`UPDATE ticket_types SET group_id = NULL WHERE group_id = $1`, [id]);
  await query(`DELETE FROM ticket_groups WHERE id = $1`, [id]);
  return NextResponse.json({ deleted: true });
}
