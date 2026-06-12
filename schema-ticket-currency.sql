-- Migration: add currency to ticket_types
-- Run once in Neon SQL Editor
ALTER TABLE ticket_types
  ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL DEFAULT 'EUR';
