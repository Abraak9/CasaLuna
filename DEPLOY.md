# Deployment Guide — Tickets.CasaLuna.se

## Prerequisites
- GitHub account
- Vercel account (free) at vercel.com
- Neon account (free) at neon.tech
- Stripe account (existing CasaLuna account)
- Resend account (free) at resend.com

---

## Step 1: Database (Neon.tech)

1. Create a new project at neon.tech
2. Choose region: **EU West (Frankfurt)** for best performance
3. Copy the connection string (it looks like `postgresql://...@ep-xxx.neon.tech/neondb`)
4. Run the schema migration locally:
   ```bash
   # In the project folder:
   cp .env.local.example .env.local
   # Fill in DATABASE_URL in .env.local
   node scripts/migrate.js
   ```
5. Create the first admin user:
   ```bash
   node -e "
   const bcrypt = require('bcryptjs');
   const { Pool } = require('pg');
   require('dotenv').config({ path: '.env.local' });
   const pool = new Pool({ connectionString: process.env.DATABASE_URL });
   const hash = bcrypt.hashSync('YOUR_PASSWORD_HERE', 10);
   pool.query(
     'INSERT INTO admins (email, password_hash, name) VALUES (\$1, \$2, \$3)',
     ['a.rahim@abraak.se', hash, 'Abraak']
   ).then(() => { console.log('Admin created'); process.exit(0); });
   "
   ```

---

## Step 2: GitHub Repo

```bash
cd tickets-casaluna-app
git init
git add .
git commit -m "Initial commit — CasaLuna tickets platform"
git remote add origin https://github.com/your-org/tickets-casaluna.git
git push -u origin main
```

---

## Step 3: Deploy to Vercel

1. Go to vercel.com → New Project → Import your GitHub repo
2. Framework: **Next.js** (auto-detected)
3. Add all environment variables (see below)
4. Click **Deploy**

### Environment Variables to add in Vercel:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Your Neon connection string |
| `NEXTAUTH_SECRET` | Run: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://tickets.casaluna.se` |
| `STRIPE_SECRET_KEY` | From Stripe Dashboard → API Keys |
| `STRIPE_WEBHOOK_SECRET` | Set up in Step 4 |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | From Stripe Dashboard → API Keys |
| `RESEND_API_KEY` | From Resend Dashboard |
| `EMAIL_FROM` | `tickets@casaluna.se` |
| `NEXT_PUBLIC_BASE_URL` | `https://tickets.casaluna.se` |

---

## Step 4: Stripe Webhook

1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. URL: `https://tickets.casaluna.se/api/webhooks/stripe`
3. Events to listen for:
   - `checkout.session.completed`
4. Copy the **Signing secret** → add as `STRIPE_WEBHOOK_SECRET` in Vercel

---

## Step 5: DNS (one.com)

In your one.com control panel for casaluna.se:

1. Go to **DNS Settings**
2. Add a new CNAME record:
   - **Host:** `tickets`
   - **Value:** `cname.vercel-dns.com`
   - **TTL:** 3600
3. In Vercel → your project → Settings → Domains → Add `tickets.casaluna.se`
4. Vercel auto-provisions SSL — takes ~5 minutes

---

## Step 6: Email Domain Verification (Resend)

1. Resend Dashboard → Domains → Add Domain → `casaluna.se`
2. Add the required DNS records in one.com (Resend shows you exactly what to add)
3. Once verified, you can send from `tickets@casaluna.se`

---

## Step 7: Verify Everything

- [ ] `https://tickets.casaluna.se` loads the event listing
- [ ] `https://tickets.casaluna.se/admin/login` shows login page
- [ ] Admin login works
- [ ] Create a test event and publish it
- [ ] Buy a test ticket (use Stripe test card `4242 4242 4242 4242`)
- [ ] Check confirmation email arrives with QR code
- [ ] Open `/checkin/[event-slug]`, enter PIN, scan QR code
- [ ] Check-in dashboard at `/admin/events/[id]/checkin` shows correct stats

---

## Ongoing: Adding Admins

Run this locally with production DATABASE_URL:
```bash
node -e "
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'YOUR_PRODUCTION_DB_URL' });
const hash = bcrypt.hashSync('PASSWORD', 10);
pool.query('INSERT INTO admins (email, password_hash, name) VALUES (\$1, \$2, \$3)', ['email@example.com', hash, 'Name'])
  .then(() => { console.log('Done'); process.exit(0); });
"
```

---

## html5-qrcode CDN dependency

The QR scanner uses `html5-qrcode` which is dynamically imported on the client.
Install it:
```bash
npm install html5-qrcode
```
This is already in package.json — just run `npm install` when you first set up the project.

⚠️ Note: `html5-qrcode` must be added to package.json manually:
```json
"html5-qrcode": "^2.3.8"
```
