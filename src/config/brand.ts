/**
 * Brand configuration for Casa Luna
 *
 * To update the logo without a code push:
 * 1. Upload your new logo image (square PNG/JPG, min 400×400px)
 * 2. Set NEXT_PUBLIC_BRAND_LOGO_URL in Vercel → Settings → Environment Variables
 * 3. Redeploy (or push any change) — new logo appears everywhere automatically
 *
 * If NEXT_PUBLIC_BRAND_LOGO_URL is not set, falls back to /logo.png in /public
 */

export const brand = {
  name: 'Casa Luna',
  logoUrl: process.env.NEXT_PUBLIC_BRAND_LOGO_URL || '/logo.png',
  tagline: 'Official Ticketing',
  email: 'info@casaluna.se',
  location: 'Göteborg, Sweden',
};
