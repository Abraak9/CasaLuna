import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const discounts = await query(`
    SELECT d.*,
      e.name_en AS event_name,
      COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'paid') AS times_used_orders
    FROM discount_codes d
    LEFT JOIN events e ON e.id = d.event_id
    LEFT JOIN orders o ON o.discount_code_id = d.id
    GROUP BY d.id, e.name_en
    ORDER BY d.created_at DESC
  `);

  return NextResponse.json(discounts);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const {
    event_id, code, type, value, currency, scope,
    usage_limit, applies_to_ticket_type_ids,
    valid_from, valid_until, status,
  } = body;

  if (!code || !type || value === undefined) {
    return NextResponse.json({ error: 'code, type and value are required' }, { status: 400 });
  }

  const existing = await queryOne(`SELECT id FROM discount_codes WHERE code = $1`, [code.toUpperCase()]);
  if (existing) return NextResponse.json({ error: 'Code already exists' }, { status: 409 });

  const discount = await queryOne(
    `INSERT INTO discount_codes
       (id, event_id, code, type, value, currency, scope, usage_limit,
        applies_to_ticket_type_ids, valid_from, valid_until, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING *`,
    [
      uuidv4(),
      event_id || null,
      code.toUpperCase(),
      type, value,
      currency || 'EUR',
      scope || 'order',
      usage_limit || null,
      applies_to_ticket_type_ids || null,
      valid_from || null,
      valid_until || null,
      status || 'active',
    ]
  );

  return NextResponse.json(discount, { status: 201 });
}
