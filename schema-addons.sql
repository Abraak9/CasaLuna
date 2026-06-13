-- ─── Add-ons feature schema ───────────────────────────────────────────────────
-- Run in Neon SQL Editor

-- 1. Add-on types configured per event
CREATE TABLE IF NOT EXISTS event_addons (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name_en         TEXT NOT NULL,
  name_es         TEXT,
  description_en  TEXT,
  description_es  TEXT,
  image_url       TEXT,
  price           NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency        VARCHAR(3) NOT NULL DEFAULT 'EUR',
  stock_total     INT,          -- NULL = unlimited
  stock_sold      INT NOT NULL DEFAULT 0,
  max_per_order   INT NOT NULL DEFAULT 10,
  scope           TEXT NOT NULL DEFAULT 'per_order',    -- 'per_order' | 'per_attendee'
  show_at         TEXT NOT NULL DEFAULT 'addons',       -- 'addons' (dedicated step) | 'review' (rail on review page)
  generates_voucher BOOLEAN NOT NULL DEFAULT false,     -- true = each unit gets its own QR scannable voucher
  visibility      TEXT NOT NULL DEFAULT 'visible',      -- 'visible' | 'hidden'
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 2. Optional ticket-type restrictions (empty = event-wide, any ticket qualifies)
CREATE TABLE IF NOT EXISTS addon_ticket_restrictions (
  addon_id        UUID NOT NULL REFERENCES event_addons(id) ON DELETE CASCADE,
  ticket_type_id  UUID NOT NULL REFERENCES ticket_types(id) ON DELETE CASCADE,
  PRIMARY KEY (addon_id, ticket_type_id)
);

-- 3. Add-ons captured on an order
CREATE TABLE IF NOT EXISTS order_addons (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  addon_id        UUID NOT NULL REFERENCES event_addons(id),
  quantity        INT NOT NULL,
  unit_price      NUMERIC(10,2) NOT NULL,
  subtotal        NUMERIC(10,2) NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 4. Individual vouchers when generates_voucher = true (one row per unit)
CREATE TABLE IF NOT EXISTS addon_vouchers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_addon_id  UUID NOT NULL REFERENCES order_addons(id) ON DELETE CASCADE,
  order_id        UUID NOT NULL REFERENCES orders(id),
  addon_id        UUID NOT NULL REFERENCES event_addons(id),
  addon_name      TEXT NOT NULL,
  qr_code         TEXT NOT NULL UNIQUE,
  checked_in      BOOLEAN NOT NULL DEFAULT false,
  checked_in_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 5. Extend orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS addons_total NUMERIC(10,2) NOT NULL DEFAULT 0;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_event_addons_event_id ON event_addons(event_id);
CREATE INDEX IF NOT EXISTS idx_order_addons_order_id ON order_addons(order_id);
CREATE INDEX IF NOT EXISTS idx_addon_vouchers_qr ON addon_vouchers(qr_code);
CREATE INDEX IF NOT EXISTS idx_addon_vouchers_order_id ON addon_vouchers(order_id);
