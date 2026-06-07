import { NextRequest, NextResponse } from 'next/server';
import { queryOne, query } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { token, event_id } = await req.json();

  if (!token || !event_id) {
    return NextResponse.json({ status: 'invalid', message: 'Missing token or event' }, { status: 400 });
  }

  // Extract token from URL if full URL was scanned
  const qrToken = token.includes('/ticket/') ? token.split('/ticket/').pop() : token;

  const attendee = await queryOne<{
    id: string; first_name: string; last_name: string;
    checked_in: boolean; checked_in_at: string;
    order_id: string; name_es: string; name_en: string;
    event_id: string;
  }>(
    `SELECT a.id, a.first_name, a.last_name, a.checked_in, a.checked_in_at,
            a.order_id, tt.name_es, tt.name_en,
            o.event_id
     FROM attendees a
     JOIN ticket_types tt ON tt.id = a.ticket_type_id
     JOIN orders o ON o.id = a.order_id
     WHERE a.qr_code = $1 AND o.status = 'paid'`,
    [qrToken]
  );

  if (!attendee) {
    return NextResponse.json({
      status: 'invalid',
      message: 'Ticket not found or not paid',
    });
  }

  if (attendee.event_id !== event_id) {
    return NextResponse.json({
      status: 'invalid',
      message: 'Ticket is for a different event',
    });
  }

  if (attendee.checked_in) {
    const time = new Date(attendee.checked_in_at).toLocaleTimeString('en-GB', {
      hour: '2-digit', minute: '2-digit',
    });
    return NextResponse.json({
      status: 'already_scanned',
      message: `Already checked in at ${time}`,
      attendee: { name: `${attendee.first_name} ${attendee.last_name}`, ticket: attendee.name_en || attendee.name_es },
    });
  }

  // Mark as checked in
  await query(
    `UPDATE attendees SET checked_in = true, checked_in_at = now() WHERE id = $1`,
    [attendee.id]
  );

  return NextResponse.json({
    status: 'success',
    message: 'Welcome!',
    attendee: { name: `${attendee.first_name} ${attendee.last_name}`, ticket: attendee.name_en || attendee.name_es },
  });
}
