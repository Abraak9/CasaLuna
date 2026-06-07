import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { queryOne, query } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const event = await queryOne(`SELECT * FROM events WHERE id = $1`, [id]);
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(event);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const fields = [
    'name_en', 'name_es', 'description_en', 'description_es',
    'date', 'end_date', 'location_name', 'location_address', 'location_city',
    'cover_image_url', 'status', 'checkin_pin', 'max_capacity', 'slug',
  ];

  const updates: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  for (const field of fields) {
    if (body[field] !== undefined) {
      updates.push(`${field} = $${i}`);
      values.push(body[field]);
      i++;
    }
  }

  if (!updates.length) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

  updates.push(`updated_at = now()`);
  values.push(id);

  const event = await queryOne(
    `UPDATE events SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`,
    values
  );

  return NextResponse.json(event);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await query(`DELETE FROM events WHERE id = $1`, [id]);
  return NextResponse.json({ deleted: true });
}
