import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { price_tiers, ...fields } = body;

  const allowed = [
    'name_en', 'name_es', 'description_en', 'description_es',
    'ticket_category', 'stock_total', 'attendees_per_ticket', 'units_per_order',
    'price_scaling', 'base_price', 'visibility', 'available_from', 'available_until',
    'collect_full_name', 'collect_email', 'collect_phone', 'collect_gender',
    'collect_role', 'collect_passport', 'collect_country', 'collect_city', 'sort_order',
  ];

  const updates: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  for (const field of allowed) {
    if (fields[field] !== undefined) {
      updates.push(`${field} = $${i}`);
      values.push(fields[field]);
      i++;
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (updates.length) {
      updates.push(`updated_at = now()`);
      values.push(id);
      await client.query(
        `UPDATE ticket_types SET ${updates.join(', ')} WHERE id = $${i}`,
        values
      );
    }

    if (price_tiers !== undefined) {
      // Replace all price tiers
      await client.query(`DELETE FROM price_tiers WHERE ticket_type_id = $1`, [id]);
      for (let j = 0; j < price_tiers.length; j++) {
        const tier = price_tiers[j];
        await client.query(
          `INSERT INTO price_tiers (id, ticket_type_id, valid_until, price, sort_order) VALUES ($1,$2,$3,$4,$5)`,
          [uuidv4(), id, tier.valid_until, tier.price, j]
        );
      }
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  const ticket = await queryOne(
    `SELECT tt.*, json_agg(pt ORDER BY pt.sort_order) FILTER (WHERE pt.id IS NOT NULL) AS price_tiers
     FROM ticket_types tt LEFT JOIN price_tiers pt ON pt.ticket_type_id = tt.id
     WHERE tt.id = $1 GROUP BY tt.id`,
    [id]
  );

  return NextResponse.json(ticket);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await query(`DELETE FROM ticket_types WHERE id = $1`, [id]);
  return NextResponse.json({ deleted: true });
}
