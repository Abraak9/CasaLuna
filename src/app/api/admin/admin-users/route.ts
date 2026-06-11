import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const users = await query(`SELECT id, email, name, created_at FROM admins ORDER BY created_at ASC`);
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { email, name, password } = await req.json();

  if (!email || !password || !name) {
    return NextResponse.json({ error: 'Email, name and password required' }, { status: 400 });
  }

  const existing = await queryOne(`SELECT id FROM admins WHERE email = $1`, [email.toLowerCase()]);
  if (existing) return NextResponse.json({ error: 'Email already exists' }, { status: 409 });

  const user = await queryOne(
    `INSERT INTO admins (id, email, password_hash, name)
     VALUES ($1, $2, crypt($3, gen_salt('bf')), $4)
     RETURNING id, email, name, created_at`,
    [uuidv4(), email.toLowerCase(), password, name]
  );

  return NextResponse.json(user, { status: 201 });
}
