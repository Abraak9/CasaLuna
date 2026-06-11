import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { queryOne, query } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const body = await req.json();
  const {
    code, type, value, currency, scope, usage_limit,
    applies_to_ticket_type_ids, valid_from, valid_until, status, event_id,
  } = body;

  const discount = await queryOne(
    `UPDATE discount_codes SET
       code = COALESCE($1, code),
       type = COALESCE($2, type),
       value = COALESCE($3, value),
       currency = COALESCE($4, currency),
       scope = COALESCE($5, scope),
       usage_limit = $6,
       applies_to_ticket_type_ids = $7,
       valid_from = $8,
       valid_until = $9,
       status = COALESCE($10, status),
       event_id = $11
     WHERE id = $12
     RETURNING *`,
    [code, type, value, currency, scope, usage_limit || null,
     applies_to_ticket_type_ids || null, valid_from || null, valid_until || null,
     status, event_id || null, id]
  );

  if (!discount) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(discount);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  await query(`DELETE FROM discount_codes WHERE id = $1`, [id]);
  return NextResponse.json({ deleted: true });
}
