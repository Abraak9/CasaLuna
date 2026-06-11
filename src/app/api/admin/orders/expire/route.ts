import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const result = await query(
    `UPDATE orders
     SET status = 'expired'
     WHERE status = 'pending'
       AND created_at < NOW() - INTERVAL '24 hours'
     RETURNING id`
  );

  return NextResponse.json({ expired: result.length });
}
