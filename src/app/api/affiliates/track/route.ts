import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';

// POST /api/affiliates/track
// Public — no auth required
// Body: { tracking_code }
// Increments click count, returns affiliate_id for passing to checkout
export async function POST(req: NextRequest) {
  try {
    const { tracking_code } = await req.json();

    if (!tracking_code) {
      return NextResponse.json({ error: 'tracking_code is required' }, { status: 400 });
    }

    const affiliate = await queryOne<{ id: string; status: string }>(
      `UPDATE affiliates
         SET clicks = clicks + 1
       WHERE LOWER(tracking_code) = LOWER($1) AND status = 'active'
       RETURNING id, status`,
      [tracking_code]
    );

    if (!affiliate) {
      // Don't error — silently ignore invalid/inactive codes
      return NextResponse.json({ affiliate_id: null });
    }

    return NextResponse.json({ affiliate_id: affiliate.id });
  } catch (err) {
    console.error('Affiliate track error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
