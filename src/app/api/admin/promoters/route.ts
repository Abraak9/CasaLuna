import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const promoters = await query(`
    SELECT p.*,
      e.name_en AS event_name,
      COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'paid') AS orders_count,
      COALESCE(SUM(o.total_amount) FILTER (WHERE o.status = 'paid'), 0) AS actual_sales
    FROM promoters p
    LEFT JOIN events e ON e.id = p.event_id
    LEFT JOIN orders o ON o.promoter_id = p.id
    GROUP BY p.id, e.name_en
    ORDER BY p.created_at DESC
  `);

  return NextResponse.json(promoters);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, email, phone, commission_type, commission_value, promo_code, notes, status, event_id, applies_to_ticket_type_ids } = body;

  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  if (promo_code) {
    const existing = await queryOne(`SELECT id FROM promoters WHERE promo_code = $1`, [promo_code.toUpperCase()]);
    if (existing) return NextResponse.json({ error: 'Promo code already taken' }, { status: 409 });
  }

  const promoter = await queryOne(
    `INSERT INTO promoters (id, name, email, phone, commission_type, commission_value, promo_code, notes, status, event_id, applies_to_ticket_type_ids)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [
      uuidv4(), name, email || null, phone || null,
      commission_type || 'percentage', commission_value || 0,
      promo_code ? promo_code.toUpperCase() : null,
      notes || null,
      status || 'active',
      event_id || null,
      applies_to_ticket_type_ids?.length ? applies_to_ticket_type_ids : null,
    ]
  );

  return NextResponse.json(promoter, { status: 201 });
}
