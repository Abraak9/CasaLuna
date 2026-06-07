// Run with: node scripts/migrate.js
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const schema = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Admins
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Events
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name_en TEXT,
  name_es TEXT NOT NULL,
  description_en TEXT,
  description_es TEXT,
  date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location_name TEXT,
  location_address TEXT,
  location_city TEXT,
  cover_image_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','published','cancelled','past')),
  checkin_pin TEXT,
  max_capacity INT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ticket Types
CREATE TABLE IF NOT EXISTS ticket_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name_en TEXT,
  name_es TEXT NOT NULL,
  description_en TEXT,
  description_es TEXT,
  ticket_category TEXT DEFAULT 'full_pass' CHECK (ticket_category IN ('full_pass','day_pass','pack','vip','other')),
  stock_total INT NOT NULL DEFAULT 100,
  stock_sold INT NOT NULL DEFAULT 0,
  attendees_per_ticket INT NOT NULL DEFAULT 1,
  units_per_order INT NOT NULL DEFAULT 1,
  price_scaling TEXT DEFAULT 'fixed' CHECK (price_scaling IN ('fixed','by_date','by_stock')),
  base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  visibility TEXT DEFAULT 'visible' CHECK (visibility IN ('visible','hidden')),
  available_from TIMESTAMPTZ,
  available_until TIMESTAMPTZ,
  collect_full_name BOOLEAN DEFAULT true,
  collect_email BOOLEAN DEFAULT true,
  collect_phone BOOLEAN DEFAULT false,
  collect_gender BOOLEAN DEFAULT false,
  collect_role BOOLEAN DEFAULT false,
  collect_passport BOOLEAN DEFAULT false,
  collect_country BOOLEAN DEFAULT false,
  collect_city BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Price Tiers (for date-scaled or stock-scaled pricing)
CREATE TABLE IF NOT EXISTS price_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_type_id UUID NOT NULL REFERENCES ticket_types(id) ON DELETE CASCADE,
  valid_until TIMESTAMPTZ NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  sort_order INT DEFAULT 0
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id),
  email TEXT NOT NULL,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_session_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','paid','cancelled','refunded')),
  total_amount DECIMAL(10,2),
  currency TEXT DEFAULT 'EUR',
  created_at TIMESTAMPTZ DEFAULT now(),
  paid_at TIMESTAMPTZ
);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  ticket_type_id UUID NOT NULL REFERENCES ticket_types(id),
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL
);

-- Attendees (one per ticket slot, e.g. Couple Pass → 2 attendees per order_item)
CREATE TABLE IF NOT EXISTS attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  ticket_type_id UUID NOT NULL REFERENCES ticket_types(id),
  order_item_id UUID NOT NULL REFERENCES order_items(id),
  qr_code TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  gender TEXT,
  role TEXT,
  passport_number TEXT,
  residence_country TEXT,
  residence_city TEXT,
  checked_in BOOLEAN DEFAULT false,
  checked_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_ticket_types_event ON ticket_types(event_id);
CREATE INDEX IF NOT EXISTS idx_orders_event ON orders(event_id);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_attendees_qr ON attendees(qr_code);
CREATE INDEX IF NOT EXISTS idx_attendees_order ON attendees(order_id);
`;

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Running migrations...');
    await client.query(schema);
    console.log('✅ Schema applied successfully.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
