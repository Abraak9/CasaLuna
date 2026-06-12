import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const { name_en, name_es, description_en, description_es, bundle_price, currency, visibility, sort_order, items } = await req.json();

  if (!name_en?.trim()) return NextResponse.json({ error: 'Bundle name required' }, { status: 400 });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE ticket_bundles SET name_en=$1, name_es=$2, description_en=$3, description_es=$4,
         bundle_price=$5, currency=$6, visibility=$7, sort_order=COALESCE($8,sort_order), updated_at=now()
       WHERE id=$9`,
      [name_en.trim(), name_es || name_en.trim(), description_en || null, description_es || null,
       bundle_price || 0, currency || 'EUR', visibility || 'visible', sort_order ?? null, id]
    );
    // Replace items
    await client.query(`DELETE FROM ticket_bundle_items WHERE bundle_id=$1`, [id]);
    if (items?.length) {
      for (const item of items) {
        await client.query(
          `INSERT INTO ticket_bundle_items (id, bundle_id, ticket_type_id, quantity) VALUES ($1,$2,$3,$4)`,
          [uuidv4(), id, item.ticket_type_id, item.quantity || 1]
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
    [id]
  );
  if (!bundle) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(bundle);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await query(`DELETE FROM ticket_bundles WHERE id=$1`, [id]);
  return NextResponse.json({ deleted: true });
}
