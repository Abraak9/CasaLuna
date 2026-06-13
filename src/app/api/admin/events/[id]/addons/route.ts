import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// GET /api/admin/events/[id]/addons — list all add-ons for an event
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: eventId } = await params;

  const addons = await query(
    `SELECT a.*,
       COALESCE(
         json_agg(atr.ticket_type_id) FILTER (WHERE atr.ticket_type_id IS NOT NULL),
         '[]'
       ) AS restricted_to_ticket_type_ids
     FROM event_addons a
     LEFT JOIN addon_ticket_restrictions atr ON atr.addon_id = a.id
     WHERE a.event_id = $1
     GROUP BY a.id
     ORDER BY a.sort_order ASC, a.created_at ASC`,
    [eventId]
  );

  return NextResponse.json(addons);
}

// POST /api/admin/events/[id]/addons — create a new add-on
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: eventId } = await params;
  const body = await req.json();

  const {
    name_en, name_es, description_en, description_es, image_url,
    price, currency, stock_total, max_per_order, scope, show_at,
    generates_voucher, visibility, sort_order,
    restricted_to_ticket_type_ids = [],
  } = body;

  if (!name_en) return NextResponse.json({ error: 'name_en is required' }, { status: 400 });

  const addonId = uuidv4();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO event_addons (
         id, event_id, name_en, name_es, description_en, description_es, image_url,
         price, currency, stock_total, max_per_order, scope, show_at,
         generates_voucher, visibility, sort_order
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
      [
        addonId, eventId,
        name_en, name_es || name_en, description_en || null, description_es || null, image_url || null,
        price || 0, currency || 'EUR', stock_total || null, max_per_order || 10,
        scope || 'per_order', show_at || 'addons',
        generates_voucher ?? false, visibility || 'visible', sort_order || 0,
      ]
    );

    for (const ttId of restricted_to_ticket_type_ids) {
      await client.query(
        `INSERT INTO addon_ticket_restrictions (addon_id, ticket_type_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [addonId, ttId]
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
    [addonId]
  );

  return NextResponse.json(addon, { status: 201 });
}
