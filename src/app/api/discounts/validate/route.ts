import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';

// POST /api/discounts/validate
// Public — no auth required
// Body: { code, event_slug, subtotal, cart_ticket_type_ids }
// Resolves both discount_codes and promoters.promo_code
export async function POST(req: NextRequest) {
  try {
    const { code, event_slug, subtotal, cart_ticket_type_ids = [] } = await req.json();

    if (!code || !event_slug || subtotal === undefined) {
      return NextResponse.json({ error: 'code, event_slug and subtotal are required' }, { status: 400 });
    }

    const event = await queryOne<{ id: string }>(
      `SELECT id FROM events WHERE slug = $1 AND status = 'published'`,
      [event_slug]
    );
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    const sub = Number(subtotal);

    // ── 1. Try discount_codes table ─────────────────────────────────────────────
    const dc = await queryOne<{
      id: string; type: string; value: number; currency: string;
      scope: string; usage_limit: number | null; usage_count: number;
      valid_from: string | null; valid_until: string | null;
      status: string; event_id: string | null;
      applies_to_ticket_type_ids: string[] | null;
    }>(
      `SELECT id, type, value, currency, scope, usage_limit, usage_count,
              valid_from, valid_until, status, event_id,
              applies_to_ticket_type_ids
       FROM discount_codes WHERE UPPER(code) = UPPER($1)`,
      [code]
    );

    if (dc) {
      if (dc.status !== 'active') return NextResponse.json({ error: 'This promo code is no longer active' }, { status: 400 });
      if (dc.event_id && dc.event_id !== event.id) return NextResponse.json({ error: 'This code is not valid for this event' }, { status: 400 });

      const now = new Date();
      if (dc.valid_from && new Date(dc.valid_from) > now) return NextResponse.json({ error: 'This code is not yet active' }, { status: 400 });
      if (dc.valid_until && new Date(dc.valid_until) < now) return NextResponse.json({ error: 'This promo code has expired' }, { status: 400 });
      if (dc.usage_limit !== null && dc.usage_count >= dc.usage_limit) return NextResponse.json({ error: 'This promo code has reached its usage limit' }, { status: 400 });

      const restricted = dc.applies_to_ticket_type_ids;
      if (restricted && restricted.length > 0) {
        const hasMatch = restricted.some((id: string) => (cart_ticket_type_ids as string[]).includes(id));
        if (!hasMatch) return NextResponse.json({ error: 'This code is not valid for the tickets in your cart' }, { status: 400 });
      }

      const discountAmount = dc.type === 'percentage'
        ? Math.round(sub * (Number(dc.value) / 100) * 100) / 100
        : Math.min(Number(dc.value), sub);

      return NextResponse.json({
        discount_id: dc.id,
        promoter_id: null,
        type: dc.type,
        value: Number(dc.value),
        currency: dc.currency,
        discount_amount: discountAmount,
        final_price: Math.max(0, sub - discountAmount),
        label: dc.type === 'percentage' ? `${dc.value}% off` : `${dc.currency} ${dc.value} off`,
        source: 'discount_code',
      });
    }

    // ── 2. Try promoters.promo_code ─────────────────────────────────────────────
    const promoter = await queryOne<{
      id: string; name: string; status: string; event_id: string | null;
      applies_to_ticket_type_ids: string[] | null;
      discount_code_id: string | null;
    }>(
      `SELECT id, name, status, event_id, applies_to_ticket_type_ids, discount_code_id
       FROM promoters WHERE UPPER(promo_code) = UPPER($1)`,
      [code]
    );

    if (promoter) {
      if (promoter.status !== 'active') return NextResponse.json({ error: 'This promo code is no longer active' }, { status: 400 });
      if (promoter.event_id && promoter.event_id !== event.id) return NextResponse.json({ error: 'This code is not valid for this event' }, { status: 400 });

      const restricted = promoter.applies_to_ticket_type_ids;
      if (restricted && restricted.length > 0) {
        const hasMatch = restricted.some((id: string) => (cart_ticket_type_ids as string[]).includes(id));
        if (!hasMatch) return NextResponse.json({ error: 'This code is not valid for the tickets in your cart' }, { status: 400 });
      }

      // Check if promoter has a linked discount
      let discountAmount = 0;
      let discountType = 'none';
      let discountValue = 0;
      let discountCurrency = 'EUR';
      let discountId: string | null = null;
      let label = `Promoter: ${promoter.name}`;

      if (promoter.discount_code_id) {
        const linkedDc = await queryOne<{
          id: string; type: string; value: number; currency: string; status: string;
        }>(
          `SELECT id, type, value, currency, status FROM discount_codes WHERE id = $1`,
          [promoter.discount_code_id]
        );
        if (linkedDc && linkedDc.status === 'active') {
          discountId = linkedDc.id;
          discountType = linkedDc.type;
          discountValue = Number(linkedDc.value);
          discountCurrency = linkedDc.currency;
          discountAmount = linkedDc.type === 'percentage'
            ? Math.round(sub * (discountValue / 100) * 100) / 100
            : Math.min(discountValue, sub);
          label = linkedDc.type === 'percentage'
            ? `${discountValue}% off (${promoter.name})`
            : `${discountCurrency} ${discountValue} off (${promoter.name})`;
        }
      }

      return NextResponse.json({
        discount_id: discountId,
        promoter_id: promoter.id,
        type: discountType,
        value: discountValue,
        currency: discountCurrency,
        discount_amount: discountAmount,
        final_price: Math.max(0, sub - discountAmount),
        label,
        source: 'promoter',
      });
    }

    return NextResponse.json({ error: 'Invalid promo code' }, { status: 404 });

  } catch (err) {
    console.error('Discount validate error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
