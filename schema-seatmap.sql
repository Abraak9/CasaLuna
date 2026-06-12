-- ─────────────────────────────────────────────────────────────────────────────
-- Seat Map Migration — run in Neon SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- One venue floor plan per event
CREATE TABLE IF NOT EXISTS seat_maps (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   UUID         NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name       VARCHAR(200) NOT NULL DEFAULT 'Venue Layout',
  image_url  TEXT,
  created_at TIMESTAMPTZ  DEFAULT now(),
  updated_at TIMESTAMPTZ  DEFAULT now()
);

-- Individual seats / spots placed on the map
CREATE TABLE IF NOT EXISTS seats (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  seat_map_id  UUID         NOT NULL REFERENCES seat_maps(id) ON DELETE CASCADE,
  label        VARCHAR(50)  NOT NULL,
  x_percent    DECIMAL(5,2) NOT NULL,   -- 0-100 horizontal position
  y_percent    DECIMAL(5,2) NOT NULL,   -- 0-100 vertical position
  capacity     INT          NOT NULL DEFAULT 1,
  status       VARCHAR(20)  NOT NULL DEFAULT 'available', -- available | blocked
  sort_order   INT          NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ  DEFAULT now()
);

-- Seat holds & confirmed reservations
CREATE TABLE IF NOT EXISTS seat_reservations (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  seat_id             UUID         NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
  order_id            UUID         REFERENCES orders(id) ON DELETE SET NULL,
  stripe_session_id   VARCHAR(300),
  temp_token          VARCHAR(100) UNIQUE,
  status              VARCHAR(20)  NOT NULL DEFAULT 'held', -- held | confirmed | released
  held_until          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ  DEFAULT now()
);

-- Flag on ticket types: does purchasing this ticket require seat selection?
ALTER TABLE ticket_types
  ADD COLUMN IF NOT EXISTS requires_seat_selection BOOLEAN NOT NULL DEFAULT false;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_seat_maps_event_id    ON seat_maps(event_id);
CREATE INDEX IF NOT EXISTS idx_seats_map_id           ON seats(seat_map_id);
CREATE INDEX IF NOT EXISTS idx_seat_res_seat_id       ON seat_reservations(seat_id);
CREATE INDEX IF NOT EXISTS idx_seat_res_order_id      ON seat_reservations(order_id);
CREATE INDEX IF NOT EXISTS idx_seat_res_temp_token    ON seat_reservations(temp_token);
CREATE INDEX IF NOT EXISTS idx_seat_res_status        ON seat_reservations(status);
