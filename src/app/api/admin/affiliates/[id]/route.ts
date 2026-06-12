import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { queryOne, query } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  const a = await queryOne(
    `UPDATE affiliates SET
       name=$1, email=$2, website=$3,
       commission_type=$4, commission_value=$5,
       notes=$6, status=$7,
       event_id=$8,
       applies_to_ticket_type_ids=$9
     WHERE id=$10 RETURNING *`,
    [
      body.name, body.email || null, body.website || null,
      body.commission_type, body.commission_value || 0,
      body.notes || null, body.status || 'active',
      body.event_id || null,
      body.applies_to_ticket_type_ids?.length ? body.applies_to_ticket_type_ids : null,
      id,
    ]
  );

  if (!a) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(a);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await query(`DELETE FROM affiliates WHERE id=$1`, [id]);
  return NextResponse.json({ deleted: true });
}
