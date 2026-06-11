import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const status = searchParams.get('status') || 'paid';
  const eventId = searchParams.get('event_id');
  const search = searchParams.get('search');
  const limit = Math.min(Number(searchParams.get('limit') || 100), 500);

  let conditions = ['1=1'];
  const params: (string | number)[] = [];
  let pi = 1;

  if (status !== 'all') {
    conditions.push(`o.status = $${pi++}`);
    params.push(status);
  }
  if (eventId) {
    conditions.push(`o.event_id = $${pi++}`);
    params.push(eventId);
  }
  if (search) {
    conditions.push(`(o.email ILIKE $${pi} OR o.id::text ILIKE $${pi})`);
    params.push(`%${search}%`);
    pi++;
  }

  const orders = await query(
    `SELECT
       o.id, o.email, o.status, o.total_amount, o.currency,
       o.created_at, o.paid_at, o.channel, o.payment_method,
       o.discount_code_id, o.discount_amount,
       e.name_en AS event_name, e.id AS event_id,
       COUNT(DISTINCT a.id) AS attendee_count,
       COUNT(DISTINCT a.id) FILTER (WHERE a.checked_in_at IS NOT NULL) AS checked_in_count,
       json_agg(json_build_object('ticket_name', tt.name_en, 'quantity', 1)) AS items
     FROM orders o
     JOIN events e ON e.id = o.event_id
     LEFT JOIN attendees a ON a.order_id = o.id
     LEFT JOIN ticket_types tt ON tt.id = a.ticket_type_id
     WHERE ${conditions.join(' AND ')}
     GROUP BY o.id, e.name_en, e.id
     ORDER BY o.created_at DESC
     LIMIT ${limit}`,
    params
  );

  return NextResponse.json(orders);
}
