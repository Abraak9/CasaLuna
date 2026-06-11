import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const eventId = searchParams.get('event_id');
  const search = searchParams.get('search');
  const role = searchParams.get('role');
  const gender = searchParams.get('gender');

  let conditions = ["o.status = 'paid'"];
  const params: (string | number)[] = [];
  let pi = 1;

  if (eventId) {
    conditions.push(`o.event_id = $${pi++}`);
    params.push(eventId);
  }
  if (search) {
    conditions.push(`(a.first_name ILIKE $${pi} OR a.last_name ILIKE $${pi} OR o.email ILIKE $${pi})`);
    params.push(`%${search}%`);
    pi++;
  }
  if (role) {
    conditions.push(`a.role = $${pi++}`);
    params.push(role);
  }
  if (gender) {
    conditions.push(`a.gender = $${pi++}`);
    params.push(gender);
  }

  const attendees = await query(
    `SELECT
       a.id, a.first_name, a.last_name, a.email AS attendee_email,
       a.gender, a.role, a.residence_country, a.residence_city,
       a.qr_code, a.checked_in_at,
       tt.name_en AS ticket_name, tt.ticket_category,
       o.email AS order_email, o.id AS order_id, o.created_at AS order_date,
       e.name_en AS event_name, e.id AS event_id, e.date AS event_date
     FROM attendees a
     JOIN orders o ON o.id = a.order_id
     JOIN ticket_types tt ON tt.id = a.ticket_type_id
     JOIN events e ON e.id = o.event_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY o.created_at DESC
     LIMIT 500`,
    params
  );

  return NextResponse.json(attendees);
}
