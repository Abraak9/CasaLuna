import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const groups = await query(
    `SELECT * FROM ticket_groups WHERE event_id = $1 ORDER BY sort_order ASC, created_at ASC`,
    [id]
  );
  return NextResponse.json(groups);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id: event_id } = await params;
  const { name, sort_order } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });
  const group = await queryOne(
    `INSERT INTO ticket_groups (id, event_id, name, sort_order) VALUES ($1,$2,$3,$4) RETURNING *`,
    [uuidv4(), event_id, name.trim(), sort_order ?? 0]
  );
  return NextResponse.json(group, { status: 201 });
}
