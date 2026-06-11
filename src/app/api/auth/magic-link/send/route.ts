import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
  }

  // Check if email has any paid orders
  const hasOrders = await queryOne<{ count: string }>(
    `SELECT COUNT(*) AS count FROM orders WHERE email = $1 AND status = 'paid'`,
    [email.toLowerCase()]
  );

  if (!hasOrders || Number(hasOrders.count) === 0) {
    // Return success anyway to avoid email enumeration
    return NextResponse.json({ sent: true });
  }

  // Expire old tokens for this email
  await query(
    `UPDATE magic_link_tokens SET used = TRUE WHERE email = $1 AND used = FALSE`,
    [email.toLowerCase()]
  );

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

  await query(
    `INSERT INTO magic_link_tokens (email, otp_code, expires_at) VALUES ($1, $2, $3)`,
    [email.toLowerCase(), otp, expiresAt.toISOString()]
  );

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:500px;margin:0 auto;padding:32px 20px;background:#09090f;color:#f0ead6;">
      <div style="text-align:center;padding:0 0 32px;">
        <h1 style="font-size:24px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;background:linear-gradient(135deg,#c9a85c,#e8d5a0,#c9a85c);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin:0;">Casa Luna</h1>
      </div>

      <div style="background:#111118;border:1px solid rgba(201,168,92,0.15);border-radius:16px;padding:32px;text-align:center;">
        <p style="color:#8b8b9a;font-size:14px;margin:0 0 24px;">Your one-time access code</p>
        <div style="font-size:48px;font-weight:700;letter-spacing:0.2em;color:#c9a85c;margin-bottom:24px;">
          ${otp}
        </div>
        <p style="color:#8b8b9a;font-size:13px;margin:0;">
          This code expires in <strong style="color:#f0ead6;">15 minutes</strong>.<br>
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>

      <p style="text-align:center;font-size:12px;color:#4a4a5a;margin-top:24px;">
        © Casa Luna AB · info@casaluna.se
      </p>
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: email,
      subject: `${otp} — Your Casa Luna access code`,
      html,
    });
  } catch (err) {
    console.error('Email send error:', err);
    // Don't expose email errors to client
  }

  return NextResponse.json({ sent: true });
}
