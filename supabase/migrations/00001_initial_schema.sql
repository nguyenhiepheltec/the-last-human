-- The Last Human - Initial Schema
-- ================================

-- Signals: every "I'M STILL HERE" button press
CREATE TABLE signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT NOT NULL DEFAULT 'Anonymous',
  country_code TEXT,
  country_name TEXT,
  ip_hash TEXT NOT NULL,
  season INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for rate limiting and latest signal queries
CREATE INDEX idx_signals_ip_hash_created ON signals(ip_hash, created_at DESC);
CREATE INDEX idx_signals_created_at ON signals(created_at DESC);
CREATE INDEX idx_signals_season ON signals(season);

-- Timer state: single-row table tracking the current deadline
CREATE TABLE timer_state (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  deadline TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  status TEXT NOT NULL DEFAULT 'alive' CHECK (status IN ('alive', 'extinct')),
  season INT NOT NULL DEFAULT 1,
  last_reset_by UUID REFERENCES signals(id),
  last_reset_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert initial timer row
INSERT INTO timer_state (id, deadline, status, season)
VALUES (1, NOW() + INTERVAL '24 hours', 'alive', 1);

-- Stats view: efficient aggregation per season
CREATE OR REPLACE VIEW signal_stats AS
SELECT
  season,
  COUNT(*)::BIGINT AS total_signals,
  COUNT(DISTINCT ip_hash)::BIGINT AS unique_humans,
  MAX(created_at) AS last_signal_at
FROM signals
GROUP BY season;

-- Row Level Security
ALTER TABLE timer_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;

-- Anyone can read timer state
CREATE POLICY "timer_state_select" ON timer_state
  FOR SELECT USING (true);

-- Anyone can read signals (for last signal display)
CREATE POLICY "signals_select" ON signals
  FOR SELECT USING (true);

-- Enable Realtime for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE timer_state;
ALTER PUBLICATION supabase_realtime ADD TABLE signals;

-- Cron job: check extinction every 60 seconds
-- NOTE: Requires pg_cron extension (enabled by default on Supabase)
-- Run this in the Supabase SQL editor if pg_cron is available:
--
-- SELECT cron.schedule(
--   'check-extinction',
--   '* * * * *',
--   $$
--   UPDATE timer_state
--   SET status = 'extinct'
--   WHERE id = 1
--     AND status = 'alive'
--     AND deadline < NOW();
--   $$
-- );
