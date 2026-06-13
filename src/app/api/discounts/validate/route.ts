import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';

// POST /api/discounts/validate
// Public — no auth required
// Body: { code, event_slug, subtotal, currency }
export async function POST(req: NextRequest) {
  try {
    const { code, event_slug, subtotal } = await req.json();

    if (!code || !event_slug || subtotal === undefined) {
      return NextResponse.json({ error: 'code, event_slug and subtotal are required' }, { status: 400 });
    }

    // Resolve event
    const event = await queryOne<{ id: string }>(
      `SELECT id FROM events WHERE slug = $1 AND status = 'published'`,
      [event_slug]
    );
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    // Look up discount code
    const discount = await queryOne<{
      id: string; type: string; value: number; currency: string;
      scope: string; usage_limit: number | null; usage_count: number;
      valid_from: string | null; valid_until: string | null;
      status: string; event_id: string | null;
    }>(
      `SELECT id, type, value, currency, scope, usage_limit, usage_count,
              valid_from, valid_until, status, event_id
       FROM discount_codes
       WHERE UPPER(code) = UPPER($1)`,
      [code]
    );

    if (!discount) return NextResponse.json({ error: 'Invalid promo code' }, { status: 404 });
    if (discount.status !== 'active') return NextResponse.json({ error: 'This promo code is no longer active' }, { status: 400 });

    // Event scope check
    if (discount.event_id && discount.event_id !== event.id) {
      return NextResponse.json({ error: 'This code is not valid for this event' }, { status: 400 });
    }

    // Date range check
    const now = new Date();
    if (discount.valid_from && new Date(discount.valid_from) > now) {
      return NextResponse.json({ error: 'This code is not yet active' }, { status: 400 });
    }
    if (discount.valid_until && new Date(discount.valid_until) < now) {
      return NextResponse.json({ error: 'This promo code has expired' }, { status: 400 });
    }

    // Usage limit check
    if (discount.usage_limit !== null && discount.usage_count >= discount.usage_limit) {
      return NextResponse.json({ error: 'This promo code has reached its usage limit' }, { status: 400 });
    }

    // Calculate discount amount
    const sub = Number(subtotal);
    let discountAmount = 0;
    if (discount.type === 'percentage') {
      discountAmount = Math.round(sub * (Number(discount.value) / 100) * 100) / 100;
    } else {
      // fixed
      discountAmount = Math.min(Number(discount.value), sub);
    }

    return NextResponse.json({
      discount_id: discount.id,
      type: discount.type,
      value: Number(discount.value),
      currency: discount.currency,
      discount_amount: discountAmount,
      final_price: Math.max(0, sub - discountAmount),
      label: discount.type === 'percentage'
        ? `${discount.value}% off`
        : `${discount.currency} ${discount.value} off`,
    });
  } catch (err) {
    console.error('Discount validate error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
