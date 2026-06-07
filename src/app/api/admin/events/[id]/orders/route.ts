import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const orders = await query(
    `SELECT
       o.id, o.email, o.status, o.total_amount, o.currency,
       o.created_at, o.paid_at,
       json_agg(json_build_object(
         'ticket_name', tt.name_es,
         'quantity', oi.quantity,
         'unit_price', oi.unit_price
       )) AS items,
       COUNT(a.id) AS attendee_count,
       COUNT(a.id) FILTER (WHERE a.checked_in) AS checked_in_count
     FROM orders o
     JOIN order_items oi ON oi.order_id = o.id
     JOIN ticket_types tt ON tt.id = oi.ticket_type_id
     LEFT JOIN attendees a ON a.order_id = o.id
     WHERE o.event_id = $1
     GROUP BY o.id
     ORDER BY o.created_at DESC`,
    [id]
  );

  return NextResponse.json(orders);
}
