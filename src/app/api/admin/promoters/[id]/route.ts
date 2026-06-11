import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { queryOne, query } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  const p = await queryOne(
    `UPDATE promoters SET
       name = COALESCE($1, name), email = $2, phone = $3,
       commission_type = COALESCE($4, commission_type),
       commission_value = COALESCE($5, commission_value),
       promo_code = $6, notes = $7, status = COALESCE($8, status)
     WHERE id = $9 RETURNING *`,
    [body.name, body.email || null, body.phone || null,
     body.commission_type, body.commission_value,
     body.promo_code ? body.promo_code.toUpperCase() : null,
     body.notes || null, body.status, id]
  );

  if (!p) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(p);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await query(`DELETE FROM promoters WHERE id = $1`, [id]);
  return NextResponse.json({ deleted: true });
}
