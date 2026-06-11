-- ============================================================
-- CasaLuna Tickets — Schema v2 additions
-- Run in Neon SQL Editor
-- ============================================================

-- Discount codes
CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,  -- NULL = applies to all events
  code VARCHAR(50) UNIQUE NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value NUMERIC(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  scope VARCHAR(20) DEFAULT 'order' CHECK (scope IN ('order', 'per_ticket')),
  usage_limit INTEGER,                    -- NULL = unlimited
  usage_count INTEGER DEFAULT 0,
  applies_to_ticket_type_ids TEXT[],      -- NULL = all ticket types
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Promoters (people who sell tickets and earn commission)
CREATE TABLE IF NOT EXISTS promoters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  email VARCHAR(200),
  phone VARCHAR(50),
  commission_type VARCHAR(20) DEFAULT 'percentage' CHECK (commission_type IN ('percentage', 'fixed')),
  commission_value NUMERIC(10,2) DEFAULT 0,
  promo_code VARCHAR(50) UNIQUE,          -- their unique promo/discount code
  discount_code_id UUID REFERENCES discount_codes(id),
  total_sales NUMERIC(10,2) DEFAULT 0,
  total_commission NUMERIC(10,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Affiliates (partners who drive traffic and earn on conversion)
CREATE TABLE IF NOT EXISTS affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  email VARCHAR(200),
  website VARCHAR(500),
  tracking_code VARCHAR(50) UNIQUE NOT NULL,
  commission_type VARCHAR(20) DEFAULT 'percentage' CHECK (commission_type IN ('percentage', 'fixed')),
  commission_value NUMERIC(10,2) DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  total_revenue NUMERIC(10,2) DEFAULT 0,
  total_commission NUMERIC(10,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Magic link / OTP tokens for customer portal login
CREATE TABLE IF NOT EXISTS magic_link_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(500) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_magic_link_email ON magic_link_tokens(email);

-- Scan devices for check-in management
CREATE TABLE IF NOT EXISTS scan_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  device_token VARCHAR(100) UNIQUE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,  -- which event it's assigned to
  check_ins_count INTEGER DEFAULT 0,
  last_seen TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Additional columns on orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_code_id UUID REFERENCES discount_codes(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS promoter_id UUID REFERENCES promoters(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS affiliate_id UUID REFERENCES affiliates(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'card';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS channel VARCHAR(50) DEFAULT 'web';

-- Index for discount code lookups
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_orders_discount ON orders(discount_code_id);
CREATE INDEX IF NOT EXISTS idx_orders_promoter ON orders(promoter_id);
CREATE INDEX IF NOT EXISTS idx_orders_affiliate ON orders(affiliate_id);
