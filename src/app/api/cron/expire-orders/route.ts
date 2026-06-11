import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Called by Vercel cron daily, or manually from admin
// Marks pending orders older than 24h as expired
export async function GET(req: NextRequest) {
  // Verify cron secret (set CRON_SECRET in Vercel env vars)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const result = await query(
    `UPDATE orders
     SET status = 'expired'
     WHERE status = 'pending'
       AND created_at < NOW() - INTERVAL '24 hours'
     RETURNING id`
  );

  return NextResponse.json({ expired: result.length, ids: result.map((r: { id: string }) => r.id) });
}
