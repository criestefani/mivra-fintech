-- ============================================
-- DATABASE OPTIMIZATION: Critical Indexes
-- ============================================
-- Execute these queries in Supabase SQL Editor to fix performance issues
-- https://app.supabase.com/project/[your-project-id]/sql/new

-- 1. trade_history: Filter by user_id (used by useTradeStats)
CREATE INDEX IF NOT EXISTS idx_trade_history_user_id ON public.trade_history(user_id) WHERE user_id IS NOT NULL;

-- 2. trade_history: Filter by external_id (used for individual lookups)
CREATE INDEX IF NOT EXISTS idx_trade_history_external_id ON public.trade_history(external_id) WHERE external_id IS NOT NULL;

-- 3. trade_history: Filter by status (used in sync-pending-positions)
CREATE INDEX IF NOT EXISTS idx_trade_history_status ON public.trade_history(status) WHERE status IS NOT NULL;

-- 4. trade_history: Composite index for user + date filtering (useTradeStats query)
CREATE INDEX IF NOT EXISTS idx_trade_history_user_date ON public.trade_history(user_id, data_abertura)
WHERE user_id IS NOT NULL AND data_abertura IS NOT NULL;

-- 5. bot_control: Filter by status (checkStartCommand in bot-live.mjs)
CREATE INDEX IF NOT EXISTS idx_bot_control_status ON public.bot_control(status) WHERE status = 'ACTIVE';

-- 6. bot_control: Composite for user + status (used in bot initialization)
CREATE INDEX IF NOT EXISTS idx_bot_control_user_status ON public.bot_control(user_id, status)
WHERE user_id IS NOT NULL AND status IS NOT NULL;

-- 7. bot_status: Filter by user_id (used to check bot running status)
CREATE INDEX IF NOT EXISTS idx_bot_status_user_id ON public.bot_status(user_id) WHERE user_id IS NOT NULL;

-- 8. strategy_trades: Filter by result status (market-scanner recovery loop)
CREATE INDEX IF NOT EXISTS idx_strategy_trades_result ON public.strategy_trades(result) WHERE result IS NOT NULL;

-- 9. strategy_trades: Filter by signal_timestamp (market-scanner recovery and cleanup)
CREATE INDEX IF NOT EXISTS idx_strategy_trades_signal_timestamp ON public.strategy_trades(signal_timestamp)
WHERE signal_timestamp IS NOT NULL;

-- 10. strategy_trades: Composite index for result + timestamp (recovery queries)
CREATE INDEX IF NOT EXISTS idx_strategy_trades_result_timestamp ON public.strategy_trades(result, signal_timestamp)
WHERE result IS NOT NULL AND signal_timestamp IS NOT NULL;

-- ============================================
-- ANALYZE QUERY PERFORMANCE (optional)
-- ============================================
-- Run ANALYZE to update statistics for query planner
-- ANALYZE;

-- ============================================
-- VERIFY INDEXES WERE CREATED (optional)
-- ============================================
-- Check which indexes exist:
-- SELECT schemaname, tablename, indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename;
