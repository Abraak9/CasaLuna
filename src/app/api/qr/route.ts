import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';

export async function GET(req: NextRequest) {
  const data = req.nextUrl.searchParams.get('data');
  if (!data) return NextResponse.json({ error: 'data param required' }, { status: 400 });

  const buffer = await QRCode.toBuffer(data, {
    type: 'png',
    width: 300,
    margin: 2,
    color: { dark: '#09090f', light: '#f0ead6' },
  });

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400, immutable',
    },
  });
}
