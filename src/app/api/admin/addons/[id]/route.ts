import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import pool from '@/lib/db';

// PUT /api/admin/addons/[id] — update add-on
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const {
    name_en, name_es, description_en, description_es, image_url,
    price, currency, stock_total, max_per_order, scope, show_at,
    generates_voucher, visibility, sort_order,
    restricted_to_ticket_type_ids = [],
  } = body;

  if (!name_en) return NextResponse.json({ error: 'name_en is required' }, { status: 400 });

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE event_addons SET
         name_en = $1, name_es = $2, description_en = $3, description_es = $4, image_url = $5,
         price = $6, currency = $7, stock_total = $8, max_per_order = $9,
         scope = $10, show_at = $11, generates_voucher = $12, visibility = $13, sort_order = $14,
         updated_at = now()
       WHERE id = $15`,
      [
        name_en, name_es || name_en, description_en || null, description_es || null, image_url || null,
        price || 0, currency || 'EUR', stock_total || null, max_per_order || 10,
        scope || 'per_order', show_at || 'addons',
        generates_voucher ?? false, visibility || 'visible', sort_order || 0,
        id,
      ]
    );

    // Replace ticket restrictions
    await client.query(`DELETE FROM addon_ticket_restrictions WHERE addon_id = $1`, [id]);
    for (const ttId of restricted_to_ticket_type_ids) {
      await client.query(
        `INSERT INTO addon_ticket_restrictions (addon_id, ticket_type_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [id, ttId]
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  const addon = await queryOne(
    `SELECT a.*,
       COALESCE(json_agg(atr.ticket_type_id) FILTER (WHERE atr.ticket_type_id IS NOT NULL), '[]') AS restricted_to_ticket_type_ids
     FROM event_addons a
     LEFT JOIN addon_ticket_restrictions atr ON atr.addon_id = a.id
     WHERE a.id = $1 GROUP BY a.id`,
    [id]
  );

  return NextResponse.json(addon);
}

// DELETE /api/admin/addons/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await query(`DELETE FROM event_addons WHERE id = $1`, [id]);
  return NextResponse.json({ deleted: true });
}
