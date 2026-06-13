import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { query, queryOne } from '@/lib/db';
import { sendOrderConfirmationEmail } from '@/lib/email';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.order_id;

    if (!orderId) return NextResponse.json({ received: true });

    // Mark order as paid
    await query(
      `UPDATE orders SET
         status = 'paid',
         stripe_payment_intent_id = $1,
         paid_at = now()
       WHERE id = $2 AND status = 'pending'`,
      [session.payment_intent as string, orderId]
    );

    // Update stock counts
    const items = await query<{ ticket_type_id: string; quantity: number }>(
      `SELECT ticket_type_id, quantity FROM order_items WHERE order_id = $1`,
      [orderId]
    );
    for (const item of items) {
      await query(
        `UPDATE ticket_types SET stock_sold = stock_sold + $1 WHERE id = $2`,
        [item.quantity, item.ticket_type_id]
      );
    }

    // Send confirmation email
    const order = await queryOne<{ email: string }>(
      `SELECT email FROM orders WHERE id = $1`, [orderId]
    );

    const attendees = await query<{
      qr_code: string; first_name: string; last_name: string;
      name_es: string; name_en: string;
    }>(
      `SELECT a.qr_code, a.first_name, a.last_name,
              tt.name_es, tt.name_en
       FROM attendees a
       JOIN ticket_types tt ON tt.id = a.ticket_type_id
       WHERE a.order_id = $1`,
      [orderId]
    );

    const eventInfo = await queryOne<{
      name_es: string; name_en: string; date: string;
      location_name: string; location_city: string;
    }>(
      `SELECT e.name_es, e.name_en, e.date, e.location_name, e.location_city
       FROM orders o JOIN events e ON e.id = o.event_id
       WHERE o.id = $1`,
      [orderId]
    );

    if (order && eventInfo && attendees.length) {
      const dateStr = new Date(eventInfo.date).toLocaleDateString('en-GB', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });

      await sendOrderConfirmationEmail({
        toEmail: order.email,
        eventName: eventInfo.name_en || eventInfo.name_es,
        eventDate: dateStr,
        eventLocation: `${eventInfo.location_name}, ${eventInfo.location_city}`,
        orderId,
        attendees: attendees.map(a => ({
          qr_code: a.qr_code,
          first_name: a.first_name,
          last_name: a.last_name,
          ticket_name: a.name_en || a.name_es,
        })),
      });
    }
  }

  return NextResponse.json({ received: true });
}
