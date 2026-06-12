-- Migration: ticket groups (folders) and ticket bundles
-- Run once in Neon SQL Editor

-- Ticket groups / folders
CREATE TABLE IF NOT EXISTS ticket_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add group_id to ticket_types
ALTER TABLE ticket_types
  ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES ticket_groups(id) ON DELETE SET NULL;

-- Ticket bundles
CREATE TABLE IF NOT EXISTS ticket_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name_en TEXT NOT NULL,
  name_es TEXT,
  description_en TEXT,
  description_es TEXT,
  bundle_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
  visibility TEXT NOT NULL DEFAULT 'visible',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Bundle line items (which ticket types, how many)
CREATE TABLE IF NOT EXISTS ticket_bundle_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id UUID NOT NULL REFERENCES ticket_bundles(id) ON DELETE CASCADE,
  ticket_type_id UUID NOT NULL REFERENCES ticket_types(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_ticket_groups_event ON ticket_groups(event_id);
CREATE INDEX IF NOT EXISTS idx_ticket_bundles_event ON ticket_bundles(event_id);
CREATE INDEX IF NOT EXISTS idx_ticket_bundle_items_bundle ON ticket_bundle_items(bundle_id);
CREATE INDEX IF NOT EXISTS idx_ticket_types_group ON ticket_types(group_id);
