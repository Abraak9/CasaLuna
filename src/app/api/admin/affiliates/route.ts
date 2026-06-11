import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const affiliates = await query(`
    SELECT a.*,
      COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'paid') AS orders_count,
      COALESCE(SUM(o.total_amount) FILTER (WHERE o.status = 'paid'), 0) AS actual_revenue
    FROM affiliates a
    LEFT JOIN orders o ON o.affiliate_id = a.id
    GROUP BY a.id
    ORDER BY a.created_at DESC
  `);

  return NextResponse.json(affiliates);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, email, website, tracking_code, commission_type, commission_value, notes } = body;

  if (!name || !tracking_code) return NextResponse.json({ error: 'Name and tracking code required' }, { status: 400 });

  const existing = await queryOne(`SELECT id FROM affiliates WHERE tracking_code = $1`, [tracking_code.toLowerCase()]);
  if (existing) return NextResponse.json({ error: 'Tracking code already taken' }, { status: 409 });

  const affiliate = await queryOne(
    `INSERT INTO affiliates (id, name, email, website, tracking_code, commission_type, commission_value, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [uuidv4(), name, email || null, website || null, tracking_code.toLowerCase(), commission_type || 'percentage', commission_value || 0, notes || null]
  );

  return NextResponse.json(affiliate, { status: 201 });
}
