import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const eventId = searchParams.get('event_id');

  const eventFilter = eventId ? `AND o.event_id = '${eventId}'` : '';

  const [byType, byCategory, byRole, byGender, byCountry, revenueOverTime] = await Promise.all([
    // Tickets by type
    query(`
      SELECT tt.name_en AS label, COUNT(a.id) AS count,
             COALESCE(SUM(tt.base_price), 0) AS revenue
      FROM attendees a
      JOIN ticket_types tt ON tt.id = a.ticket_type_id
      JOIN orders o ON o.id = a.order_id
      WHERE o.status = 'paid' ${eventFilter}
      GROUP BY tt.name_en ORDER BY count DESC
    `),
    // By ticket category
    query(`
      SELECT COALESCE(tt.ticket_category, 'other') AS label, COUNT(a.id) AS count
      FROM attendees a
      JOIN ticket_types tt ON tt.id = a.ticket_type_id
      JOIN orders o ON o.id = a.order_id
      WHERE o.status = 'paid' ${eventFilter}
      GROUP BY tt.ticket_category ORDER BY count DESC
    `),
    // By dance role
    query(`
      SELECT COALESCE(a.role, 'not specified') AS label, COUNT(*) AS count
      FROM attendees a
      JOIN orders o ON o.id = a.order_id
      WHERE o.status = 'paid' ${eventFilter}
      GROUP BY a.role ORDER BY count DESC
    `),
    // By gender
    query(`
      SELECT COALESCE(a.gender, 'not specified') AS label, COUNT(*) AS count
      FROM attendees a
      JOIN orders o ON o.id = a.order_id
      WHERE o.status = 'paid' ${eventFilter}
      GROUP BY a.gender ORDER BY count DESC
    `),
    // By country (top 10)
    query(`
      SELECT COALESCE(a.residence_country, 'not specified') AS label, COUNT(*) AS count
      FROM attendees a
      JOIN orders o ON o.id = a.order_id
      WHERE o.status = 'paid' ${eventFilter}
      GROUP BY a.residence_country ORDER BY count DESC LIMIT 10
    `),
    // Revenue by day (last 30 days)
    query(`
      SELECT DATE(o.paid_at) AS date,
             COUNT(DISTINCT o.id) AS orders,
             COALESCE(SUM(o.total_amount), 0) AS revenue
      FROM orders o
      WHERE o.status = 'paid' AND o.paid_at > NOW() - INTERVAL '30 days' ${eventFilter}
      GROUP BY DATE(o.paid_at)
      ORDER BY date ASC
    `),
  ]);

  return NextResponse.json({ byType, byCategory, byRole, byGender, byCountry, revenueOverTime });
}
