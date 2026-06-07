import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

export function generateQRToken(): string {
  return uuidv4();
}

export async function generateQRDataURL(token: string): Promise<string> {
  const url = `${process.env.NEXT_PUBLIC_BASE_URL}/ticket/${token}`;
  return QRCode.toDataURL(url, {
    width: 300,
    margin: 2,
    color: { dark: '#1a1a1a', light: '#ffffff' },
  });
}

export async function generateQRBuffer(token: string): Promise<Buffer> {
  const url = `${process.env.NEXT_PUBLIC_BASE_URL}/ticket/${token}`;
  return QRCode.toBuffer(url, {
    width: 300,
    margin: 2,
  });
}
