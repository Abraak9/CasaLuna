import { Resend } from 'resend';
import { generateQRDataURL } from './qr';

const resend = new Resend(process.env.RESEND_API_KEY);

interface AttendeeTicket {
  qr_code: string;
  first_name: string;
  last_name: string;
  ticket_name: string;
}

interface SendConfirmationEmailParams {
  toEmail: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  orderId: string;
  attendees: AttendeeTicket[];
}

export async function sendOrderConfirmationEmail(params: SendConfirmationEmailParams) {
  const { toEmail, eventName, eventDate, eventLocation, orderId, attendees } = params;

  // Generate QR data URLs for each attendee
  const ticketsHtml = await Promise.all(
    attendees.map(async (a) => {
      const qrDataUrl = await generateQRDataURL(a.qr_code);
      return `
        <div style="border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin:16px 0;text-align:center;background:#fafafa;">
          <p style="font-size:16px;font-weight:600;margin:0 0 4px;">${a.first_name} ${a.last_name}</p>
          <p style="font-size:14px;color:#6b7280;margin:0 0 16px;">${a.ticket_name}</p>
          <img src="${qrDataUrl}" alt="QR Code" style="width:200px;height:200px;" />
          <p style="font-size:11px;color:#9ca3af;margin:8px 0 0;">Scan this code at the door</p>
        </div>
      `;
    })
  );

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#1a1a1a;">
      <div style="text-align:center;padding:32px 0 16px;">
        <h1 style="font-size:28px;font-weight:700;margin:0;color:#1a1a1a;">Casa Luna</h1>
        <p style="color:#6b7280;margin:4px 0 0;">Your tickets are confirmed ✓</p>
      </div>

      <div style="background:#f9fafb;border-radius:16px;padding:24px;margin:24px 0;">
        <h2 style="font-size:20px;font-weight:700;margin:0 0 12px;">${eventName}</h2>
        <p style="margin:0 0 6px;color:#374151;">📅 ${eventDate}</p>
        <p style="margin:0;color:#374151;">📍 ${eventLocation}</p>
      </div>

      <p style="font-size:15px;color:#374151;">
        Your tickets are attached below. Present the QR code at the entrance — one per person.
      </p>

      ${ticketsHtml.join('')}

      <div style="margin-top:32px;padding-top:24px;border-top:1px solid #e5e7eb;text-align:center;">
        <p style="font-size:13px;color:#9ca3af;">Order #${orderId.slice(0, 8).toUpperCase()}</p>
        <p style="font-size:13px;color:#9ca3af;">Questions? Contact us at info@casaluna.se</p>
        <p style="font-size:13px;color:#9ca3af;margin-top:16px;">© Casa Luna AB</p>
      </div>
    </body>
    </html>
  `;

  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: toEmail,
    subject: `Your tickets for ${eventName}`,
    html,
  });
}
