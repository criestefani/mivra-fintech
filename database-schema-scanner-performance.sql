-- Scanner Performance Table Schema
-- This table aggregates performance data from strategy_trades for the Market Scanner UI
-- Run this SQL script in Supabase SQL Editor (go to SQL section in Supabase Dashboard)

-- Create the scanner_performance table
CREATE TABLE IF NOT EXISTS scanner_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  active_id VARCHAR NOT NULL,
  ativo_nome VARCHAR NOT NULL,
  timeframe INTEGER NOT NULL,
  total_signals INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  total_losses INTEGER DEFAULT 0,
  win_rate NUMERIC(5,2) DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),

  -- Ensure uniqueness per active_id/ativo_nome/timeframe combination
  UNIQUE(active_id, ativo_nome, timeframe)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_scanner_performance_win_rate
  ON scanner_performance(win_rate DESC);

CREATE INDEX IF NOT EXISTS idx_scanner_performance_signals
  ON scanner_performance(total_signals DESC);

CREATE INDEX IF NOT EXISTS idx_scanner_performance_last_updated
  ON scanner_performance(last_updated DESC);

-- Optional: Enable Row Level Security (RLS) for public read access
ALTER TABLE scanner_performance ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read (no write access to public)
CREATE POLICY "Allow public read access"
  ON scanner_performance
  FOR SELECT
  TO public
  USING (true);

-- Grant permissions
GRANT SELECT ON scanner_performance TO authenticated;
GRANT SELECT ON scanner_performance TO anon;

-- Display confirmation
SELECT 'Scanner Performance table created successfully!' as status;
