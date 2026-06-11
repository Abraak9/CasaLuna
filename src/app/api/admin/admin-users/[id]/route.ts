import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  // Don't allow deleting the only remaining admin
  const count = await queryOne<{ count: string }>(`SELECT COUNT(*) AS count FROM admins`);
  if (count && Number(count.count) <= 1) {
    return NextResponse.json({ error: 'Cannot delete the only admin account' }, { status: 400 });
  }

  await query(`DELETE FROM admins WHERE id = $1`, [id]);
  return NextResponse.json({ deleted: true });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const { name, password } = await req.json();

  if (password) {
    // Update with new password
    const user = await queryOne(
      `UPDATE admins SET name = COALESCE($1, name), password_hash = crypt($2, gen_salt('bf'))
       WHERE id = $3 RETURNING id, email, name, created_at`,
      [name || null, password, id]
    );
    return NextResponse.json(user);
  } else {
    const user = await queryOne(
      `UPDATE admins SET name = COALESCE($1, name) WHERE id = $2 RETURNING id, email, name, created_at`,
      [name || null, id]
    );
    return NextResponse.json(user);
  }
}
