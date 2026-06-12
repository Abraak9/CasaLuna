-- Migration: allow custom ticket categories
-- Run this once in Neon SQL Editor
-- Drops the hard-coded CHECK constraint so any free-text category is accepted

ALTER TABLE ticket_types
  DROP CONSTRAINT IF EXISTS ticket_types_ticket_category_check;
