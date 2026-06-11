import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const devices = await query(`
    SELECT sd.*, e.name_en AS event_name
    FROM scan_devices sd
    LEFT JOIN events e ON e.id = sd.event_id
    ORDER BY sd.created_at DESC
  `);

  return NextResponse.json(devices);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, event_id, notes } = body;

  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });

  const device_token = Math.random().toString(36).substring(2, 10).toUpperCase();

  const device = await queryOne(
    `INSERT INTO scan_devices (id, name, device_token, event_id, notes)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [uuidv4(), name, device_token, event_id || null, notes || null]
  );

  return NextResponse.json(device, { status: 201 });
}
