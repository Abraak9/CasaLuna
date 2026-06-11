import { NextRequest, NextResponse } from 'next/server';
import { queryOne, query } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { email, code } = await req.json();

  if (!email || !code) {
    return NextResponse.json({ error: 'Email and code required' }, { status: 400 });
  }

  const token = await queryOne<{ id: string; expires_at: string; used: boolean }>(
    `SELECT id, expires_at, used FROM magic_link_tokens
     WHERE email = $1 AND otp_code = $2 AND used = FALSE
     ORDER BY created_at DESC LIMIT 1`,
    [email.toLowerCase(), code]
  );

  if (!token) {
    return NextResponse.json({ error: 'Invalid or expired code' }, { status: 401 });
  }

  if (new Date(token.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Code has expired. Please request a new one.' }, { status: 401 });
  }

  // Mark as used
  await query(`UPDATE magic_link_tokens SET used = TRUE WHERE id = $1`, [token.id]);

  // Fetch all paid orders for this email with attendees
  const orders = await query<{
    id: string;
    event_name: string;
    event_date: string;
    event_location: string;
    event_slug: string;
    total_amount: number;
    currency: string;
    paid_at: string;
    created_at: string;
    items: string;
    attendee_count: number;
  }>(
    `SELECT
       o.id,
       e.name_en AS event_name,
       e.date AS event_date,
       CONCAT(e.location_name, ', ', e.location_city) AS event_location,
       e.slug AS event_slug,
       o.total_amount,
       o.currency,
       o.paid_at,
       o.created_at,
       (
         SELECT json_agg(json_build_object(
           'ticket_name', tt.name_en,
           'first_name', a.first_name,
           'last_name', a.last_name,
           'qr_code', a.qr_code,
           'checked_in', a.checked_in_at IS NOT NULL
         ))
         FROM attendees a
         JOIN ticket_types tt ON tt.id = a.ticket_type_id
         WHERE a.order_id = o.id
       )::text AS items,
       COUNT(a.id) AS attendee_count
     FROM orders o
     JOIN events e ON e.id = o.event_id
     LEFT JOIN attendees a ON a.order_id = o.id
     WHERE o.email = $1 AND o.status = 'paid'
     GROUP BY o.id, e.name_en, e.date, e.location_name, e.location_city, e.slug
     ORDER BY o.created_at DESC`,
    [email.toLowerCase()]
  );

  return NextResponse.json({ verified: true, email: email.toLowerCase(), orders });
}
