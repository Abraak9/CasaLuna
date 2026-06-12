import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const bundles = await query(
    `SELECT b.*,
       COALESCE(
         json_agg(
           json_build_object(
             'id', bi.id,
             'ticket_type_id', bi.ticket_type_id,
             'quantity', bi.quantity,
             'ticket_name', tt.name_en,
             'ticket_price', tt.base_price,
             'ticket_currency', tt.currency
           )
         ) FILTER (WHERE bi.id IS NOT NULL),
         '[]'
       ) AS items
     FROM ticket_bundles b
     LEFT JOIN ticket_bundle_items bi ON bi.bundle_id = b.id
     LEFT JOIN ticket_types tt ON tt.id = bi.ticket_type_id
     WHERE b.event_id = $1
     GROUP BY b.id
     ORDER BY b.sort_order ASC, b.created_at ASC`,
    [id]
  );

  return NextResponse.json(bundles);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id: event_id } = await params;
  const { name_en, name_es, description_en, description_es, bundle_price, currency, visibility, sort_order, items } = await req.json();

  if (!name_en?.trim()) return NextResponse.json({ error: 'Bundle name required' }, { status: 400 });

  const bundleId = uuidv4();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO ticket_bundles (id, event_id, name_en, name_es, description_en, description_es, bundle_price, currency, visibility, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [bundleId, event_id, name_en.trim(), name_es || name_en.trim(), description_en || null, description_es || null,
       bundle_price || 0, currency || 'EUR', visibility || 'visible', sort_order ?? 0]
    );
    if (items?.length) {
      for (const item of items) {
        await client.query(
          `INSERT INTO ticket_bundle_items (id, bundle_id, ticket_type_id, quantity) VALUES ($1,$2,$3,$4)`,
          [uuidv4(), bundleId, item.ticket_type_id, item.quantity || 1]
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

  const bundle = await queryOne(
    `SELECT b.*, COALESCE(json_agg(json_build_object('id',bi.id,'ticket_type_id',bi.ticket_type_id,'quantity',bi.quantity,'ticket_name',tt.name_en,'ticket_price',tt.base_price,'ticket_currency',tt.currency)) FILTER (WHERE bi.id IS NOT NULL),'[]') AS items
     FROM ticket_bundles b LEFT JOIN ticket_bundle_items bi ON bi.bundle_id=b.id LEFT JOIN ticket_types tt ON tt.id=bi.ticket_type_id
     WHERE b.id=$1 GROUP BY b.id`,
    [bundleId]
  );
  return NextResponse.json(bundle, { status: 201 });
}
