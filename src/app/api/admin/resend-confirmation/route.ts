import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { queryOne, query } from '@/lib/db';
import { sendOrderConfirmationEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { order_id } = await req.json();
  if (!order_id) return NextResponse.json({ error: 'order_id required' }, { status: 400 });

  const order = await queryOne<{ id: string; email: string; status: string }>(
    `SELECT id, email, status FROM orders WHERE id = $1`,
    [order_id]
  );

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  if (order.status !== 'paid') return NextResponse.json({ error: 'Order not paid' }, { status: 400 });

  const attendees = await query<{
    qr_code: string; first_name: string; last_name: string;
    name_es: string; name_en: string;
  }>(
    `SELECT a.qr_code, a.first_name, a.last_name, tt.name_es, tt.name_en
     FROM attendees a
     JOIN ticket_types tt ON tt.id = a.ticket_type_id
     WHERE a.order_id = $1`,
    [order_id]
  );

  const eventInfo = await queryOne<{
    name_es: string; name_en: string; date: string;
    location_name: string; location_city: string;
  }>(
    `SELECT e.name_es, e.name_en, e.date, e.location_name, e.location_city
     FROM orders o JOIN events e ON e.id = o.event_id
     WHERE o.id = $1`,
    [order_id]
  );

  if (!eventInfo || !attendees.length) {
    return NextResponse.json({ error: 'Missing event or attendee data' }, { status: 400 });
  }

  const dateStr = new Date(eventInfo.date).toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  await sendOrderConfirmationEmail({
    toEmail: order.email,
    eventName: eventInfo.name_en || eventInfo.name_es,
    eventDate: dateStr,
    eventLocation: `${eventInfo.location_name}, ${eventInfo.location_city}`,
    orderId: order_id,
    attendees: attendees.map(a => ({
      qr_code: a.qr_code,
      first_name: a.first_name,
      last_name: a.last_name,
      ticket_name: a.name_en || a.name_es,
    })),
  });

  return NextResponse.json({ sent: true });
}
