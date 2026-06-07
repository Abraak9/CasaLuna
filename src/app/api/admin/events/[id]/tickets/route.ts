import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const tickets = await query(
    `SELECT tt.*,
       json_agg(pt ORDER BY pt.sort_order) FILTER (WHERE pt.id IS NOT NULL) AS price_tiers
     FROM ticket_types tt
     LEFT JOIN price_tiers pt ON pt.ticket_type_id = tt.id
     WHERE tt.event_id = $1
     GROUP BY tt.id
     ORDER BY tt.sort_order ASC`,
    [id]
  );

  return NextResponse.json(tickets);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: event_id } = await params;
  const body = await req.json();

  const {
    name_en, name_es, description_en, description_es,
    ticket_category, stock_total, attendees_per_ticket, units_per_order,
    price_scaling, base_price, visibility,
    available_from, available_until,
    collect_full_name, collect_email, collect_phone, collect_gender,
    collect_role, collect_passport, collect_country, collect_city,
    sort_order, price_tiers,
  } = body;

  const ticketId = uuidv4();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO ticket_types
         (id, event_id, name_en, name_es, description_en, description_es,
          ticket_category, stock_total, attendees_per_ticket, units_per_order,
          price_scaling, base_price, visibility,
          available_from, available_until,
          collect_full_name, collect_email, collect_phone, collect_gender,
          collect_role, collect_passport, collect_country, collect_city, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)`,
      [
        ticketId, event_id, name_en, name_es, description_en, description_es,
        ticket_category || 'full_pass', stock_total || 100, attendees_per_ticket || 1,
        units_per_order || 1, price_scaling || 'fixed', base_price || 0,
        visibility || 'visible', available_from, available_until,
        collect_full_name ?? true, collect_email ?? true, collect_phone ?? false,
        collect_gender ?? false, collect_role ?? false, collect_passport ?? false,
        collect_country ?? false, collect_city ?? false, sort_order ?? 0,
      ]
    );

    if (price_tiers?.length) {
      for (let i = 0; i < price_tiers.length; i++) {
        const tier = price_tiers[i];
        await client.query(
          `INSERT INTO price_tiers (id, ticket_type_id, valid_until, price, sort_order)
           VALUES ($1, $2, $3, $4, $5)`,
          [uuidv4(), ticketId, tier.valid_until, tier.price, i]
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
    [ticketId]
  );

  return NextResponse.json(ticket, { status: 201 });
}
