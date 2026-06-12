-- Migration: event + ticket targeting for promoters and affiliates
-- Run once in Neon SQL Editor
-- (discount_codes already had these columns from schema-v2.sql)

ALTER TABLE promoters
  ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS applies_to_ticket_type_ids TEXT[];

ALTER TABLE affiliates
  ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS applies_to_ticket_type_ids TEXT[];
