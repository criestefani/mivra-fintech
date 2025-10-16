-- MivraTech Database Schema Initialization
-- This script creates all necessary tables for local development

-- ============================
-- Create Required Extensions
-- ============================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================
-- Strategy Trades Table
-- ============================
CREATE TABLE IF NOT EXISTS strategy_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  active_id VARCHAR NOT NULL,
  ativo_nome VARCHAR NOT NULL,
  timeframe INTEGER NOT NULL,
  signal_timestamp TIMESTAMP DEFAULT NOW(),
  signal_direction VARCHAR NOT NULL, -- 'CALL' or 'PUT'
  signal_price NUMERIC(18,2),
  result VARCHAR DEFAULT 'PENDING', -- 'PENDING', 'WIN', 'LOSS'
  result_timestamp TIMESTAMP,
  result_price NUMERIC(18,2),
  price_diff NUMERIC(18,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_strategy_trades_result ON strategy_trades(result);
CREATE INDEX idx_strategy_trades_signal_timestamp ON strategy_trades(signal_timestamp DESC);
CREATE INDEX idx_strategy_trades_active_timeframe ON strategy_trades(active_id, timeframe);

-- ============================
-- Scanner Performance Table
-- ============================
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
  UNIQUE(active_id, ativo_nome, timeframe)
);

CREATE INDEX idx_scanner_performance_win_rate ON scanner_performance(win_rate DESC);
CREATE INDEX idx_scanner_performance_signals ON scanner_performance(total_signals DESC);
CREATE INDEX idx_scanner_performance_last_updated ON scanner_performance(last_updated DESC);

-- ============================
-- Trade History Table
-- ============================
CREATE TABLE IF NOT EXISTS trade_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR,
  external_id VARCHAR UNIQUE NOT NULL,
  type VARCHAR, -- 'blitz-option', etc
  active_id INTEGER,
  ativo_nome VARCHAR,
  direction VARCHAR,
  valor NUMERIC(18,2),
  profit_esperado NUMERIC(5,2),
  expiration_seconds INTEGER,
  strategy_id VARCHAR,
  status VARCHAR DEFAULT 'open', -- 'open', 'closed'
  resultado VARCHAR, -- 'WIN', 'LOSS', 'TIE'
  pnl NUMERIC(18,2),
  data_abertura TIMESTAMP,
  data_expiracao TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_trade_history_user_id ON trade_history(user_id);
CREATE INDEX idx_trade_history_external_id ON trade_history(external_id);
CREATE INDEX idx_trade_history_status ON trade_history(status);
CREATE INDEX idx_trade_history_created_at ON trade_history(created_at DESC);

-- ============================
-- Bot Status Table
-- ============================
CREATE TABLE IF NOT EXISTS bot_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR UNIQUE,
  ssid VARCHAR,
  status VARCHAR DEFAULT 'inactive', -- 'active', 'inactive', 'error'
  last_heartbeat TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_bot_status_user_id ON bot_status(user_id);
CREATE INDEX idx_bot_status_status ON bot_status(status);

-- ============================
-- Health Check Logs
-- ============================
CREATE TABLE IF NOT EXISTS health_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name VARCHAR NOT NULL,
  status VARCHAR NOT NULL, -- 'healthy', 'degraded', 'down'
  response_time_ms INTEGER,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_health_logs_service_name ON health_logs(service_name);
CREATE INDEX idx_health_logs_created_at ON health_logs(created_at DESC);

-- ============================
-- Set up Row Level Security
-- ============================
ALTER TABLE strategy_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE scanner_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_history ENABLE ROW LEVEL SECURITY;

-- Allow public read access (no write)
CREATE POLICY "Allow public read strategy_trades" ON strategy_trades
  FOR SELECT TO public USING (true);

CREATE POLICY "Allow public read scanner_performance" ON scanner_performance
  FOR SELECT TO public USING (true);

CREATE POLICY "Allow public read trade_history" ON trade_history
  FOR SELECT TO public USING (true);

-- Allow authenticated users full access
CREATE POLICY "Allow authenticated write strategy_trades" ON strategy_trades
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated write scanner_performance" ON scanner_performance
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated write trade_history" ON trade_history
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================
-- Grant Permissions
-- ============================
GRANT SELECT ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Confirmation
SELECT 'MivraTech database schema initialized successfully!' as status;
