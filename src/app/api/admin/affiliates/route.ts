import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const affiliates = await query(`
    SELECT a.*,
      e.name_en AS event_name,
      COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'paid') AS orders_count,
      COALESCE(SUM(o.total_amount) FILTER (WHERE o.status = 'paid'), 0) AS actual_revenue
    FROM affiliates a
    LEFT JOIN events e ON e.id = a.event_id
    LEFT JOIN orders o ON o.affiliate_id = a.id
    GROUP BY a.id, e.name_en
    ORDER BY a.created_at DESC
  `);

  return NextResponse.json(affiliates);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, email, website, tracking_code, commission_type, commission_value, notes, status, event_id, applies_to_ticket_type_ids } = body;

  if (!name || !tracking_code) return NextResponse.json({ error: 'Name and tracking code required' }, { status: 400 });

  const existing = await queryOne(`SELECT id FROM affiliates WHERE tracking_code = $1`, [tracking_code.toLowerCase()]);
  if (existing) return NextResponse.json({ error: 'Tracking code already taken' }, { status: 409 });

  const affiliate = await queryOne(
    `INSERT INTO affiliates (id, name, email, website, tracking_code, commission_type, commission_value, notes, status, event_id, applies_to_ticket_type_ids)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [
      uuidv4(), name, email || null, website || null,
      tracking_code.toLowerCase(),
      commission_type || 'percentage', commission_value || 0,
      notes || null,
      status || 'active',
      event_id || null,
      applies_to_ticket_type_ids?.length ? applies_to_ticket_type_ids : null,
    ]
  );

  return NextResponse.json(affiliate, { status: 201 });
}
