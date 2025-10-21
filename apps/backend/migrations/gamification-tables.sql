-- ============================================================
-- GAMIFICATION SYSTEM - DATABASE SCHEMA
-- ============================================================
-- MivraTech Cyber Trading Arena
-- Phase 2: Database tables for XP, badges, streaks, quests
-- ============================================================

-- ============================================================
-- 1. USER GAMIFICATION (Main table)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_gamification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR UNIQUE NOT NULL,

  -- XP & Level System
  total_xp INTEGER DEFAULT 0 CHECK (total_xp >= 0),
  current_level INTEGER DEFAULT 1 CHECK (current_level >= 1 AND current_level <= 30),
  xp_current_level INTEGER DEFAULT 0 CHECK (xp_current_level >= 0),
  xp_next_level INTEGER DEFAULT 100 CHECK (xp_next_level > 0),
  level_title VARCHAR DEFAULT 'Novato',

  -- Streaks
  current_streak INTEGER DEFAULT 0 CHECK (current_streak >= 0),
  best_streak INTEGER DEFAULT 0 CHECK (best_streak >= 0),
  last_trade_date DATE,
  streak_freezes_available INTEGER DEFAULT 0 CHECK (streak_freezes_available >= 0 AND streak_freezes_available <= 7),

  -- Win Streak
  current_win_streak INTEGER DEFAULT 0 CHECK (current_win_streak >= 0),
  best_win_streak INTEGER DEFAULT 0 CHECK (best_win_streak >= 0),

  -- Trade Stats
  total_trades INTEGER DEFAULT 0 CHECK (total_trades >= 0),
  total_trades_demo INTEGER DEFAULT 0 CHECK (total_trades_demo >= 0),
  total_trades_real INTEGER DEFAULT 0 CHECK (total_trades_real >= 0),
  total_wins INTEGER DEFAULT 0 CHECK (total_wins >= 0),
  total_wins_real INTEGER DEFAULT 0 CHECK (total_wins_real >= 0),

  -- Demo Limits System
  demo_phase VARCHAR DEFAULT 'exploration' CHECK (demo_phase IN ('exploration', 'standard')),
  demo_trades_today INTEGER DEFAULT 0 CHECK (demo_trades_today >= 0),
  demo_last_trade TIMESTAMP,
  demo_started_at TIMESTAMP DEFAULT NOW(),
  demo_daily_limit INTEGER DEFAULT 999999, -- Unlimited during exploration

  -- Scanner Tier System
  scanner_tier INTEGER DEFAULT 1 CHECK (scanner_tier >= 1 AND scanner_tier <= 4),

  -- Deposit Tracking (for Demo Limits & Freezes calculation)
  total_deposits_last_30_days DECIMAL(10, 2) DEFAULT 0 CHECK (total_deposits_last_30_days >= 0),
  last_deposit_date TIMESTAMP,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_user_gamification_user_id ON user_gamification(user_id);
CREATE INDEX IF NOT EXISTS idx_user_gamification_level ON user_gamification(current_level);
CREATE INDEX IF NOT EXISTS idx_user_gamification_total_xp ON user_gamification(total_xp DESC);

-- ============================================================
-- 2. USER BADGES (Conquistas/Achievements)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL,
  badge_id VARCHAR NOT NULL,

  -- Badge Details
  badge_name VARCHAR NOT NULL,
  badge_icon VARCHAR, -- Emoji or icon identifier
  badge_category VARCHAR, -- 'volume', 'performance', 'behavior', 'social', 'special'
  badge_rarity VARCHAR DEFAULT 'common', -- 'common', 'rare', 'epic', 'legendary'

  -- Rewards
  xp_reward INTEGER DEFAULT 0,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  earned_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, badge_id)
);

-- Indexes for badges
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_earned_at ON user_badges(earned_at DESC);

-- ============================================================
-- 3. XP TRANSACTIONS (Audit log)
-- ============================================================
CREATE TABLE IF NOT EXISTS xp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL,

  -- Transaction Details
  amount INTEGER NOT NULL, -- Can be negative for penalties (future)
  source VARCHAR NOT NULL, -- 'trade_demo', 'trade_real', 'trade_win', 'badge', 'quest', etc.

  -- Context
  metadata JSONB DEFAULT '{}', -- Extra data (trade_id, badge_id, quest_id, etc.)

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for XP transactions
CREATE INDEX IF NOT EXISTS idx_xp_transactions_user_id ON xp_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_created_at ON xp_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_source ON xp_transactions(source);

-- ============================================================
-- 4. QUESTS (Daily/Weekly challenges)
-- ============================================================
CREATE TABLE IF NOT EXISTS quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Quest Details
  quest_id VARCHAR UNIQUE NOT NULL, -- 'daily_10_trades', 'weekly_50_trades', etc.
  quest_type VARCHAR NOT NULL CHECK (quest_type IN ('daily', 'weekly', 'special')),
  quest_name VARCHAR NOT NULL,
  quest_description TEXT,
  quest_icon VARCHAR,

  -- Requirements
  target_value INTEGER NOT NULL, -- Target to complete (e.g., 10 trades)
  requirement_type VARCHAR NOT NULL, -- 'trades_real', 'wins_real', 'scanner_usage', etc.

  -- Rewards
  xp_reward INTEGER DEFAULT 0,

  -- Activation
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for active quests
CREATE INDEX IF NOT EXISTS idx_quests_quest_type ON quests(quest_type);
CREATE INDEX IF NOT EXISTS idx_quests_active ON quests(is_active);

-- ============================================================
-- 5. USER QUESTS (User progress on quests)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL,
  quest_id VARCHAR NOT NULL,

  -- Progress
  current_progress INTEGER DEFAULT 0,
  target_value INTEGER NOT NULL,

  -- Status
  status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),

  -- Timestamps
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  expires_at TIMESTAMP, -- For daily/weekly quests

  UNIQUE(user_id, quest_id, started_at::DATE) -- One quest per user per day
);

-- Indexes for user quests
CREATE INDEX IF NOT EXISTS idx_user_quests_user_id ON user_quests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quests_status ON user_quests(status);
CREATE INDEX IF NOT EXISTS idx_user_quests_expires_at ON user_quests(expires_at);

-- ============================================================
-- 6. LEADERBOARDS (Cached rankings)
-- ============================================================
CREATE TABLE IF NOT EXISTS leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL,

  -- Leaderboard Type
  period VARCHAR NOT NULL, -- 'daily', 'weekly', 'monthly', 'all_time'
  category VARCHAR NOT NULL, -- 'volume', 'profit', 'win_rate', 'xp', 'streak'

  -- Ranking
  rank INTEGER NOT NULL,
  value DECIMAL(10, 2) NOT NULL, -- The metric value (trades count, profit, xp, etc.)

  -- Metadata
  username VARCHAR,
  level INTEGER,

  -- Timestamps
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  calculated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, period, category, period_start)
);

-- Indexes for leaderboards
CREATE INDEX IF NOT EXISTS idx_leaderboards_period_category ON leaderboards(period, category);
CREATE INDEX IF NOT EXISTS idx_leaderboards_rank ON leaderboards(rank);
CREATE INDEX IF NOT EXISTS idx_leaderboards_user_id ON leaderboards(user_id);

-- ============================================================
-- 7. STREAK HISTORY (For analytics)
-- ============================================================
CREATE TABLE IF NOT EXISTS streak_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL,

  -- Streak Details
  streak_type VARCHAR NOT NULL, -- 'daily', 'win'
  streak_count INTEGER NOT NULL,

  -- Event
  event_type VARCHAR NOT NULL, -- 'started', 'increased', 'broken', 'milestone'

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for streak history
CREATE INDEX IF NOT EXISTS idx_streak_history_user_id ON streak_history(user_id);
CREATE INDEX IF NOT EXISTS idx_streak_history_created_at ON streak_history(created_at DESC);

-- ============================================================
-- 8. DEPOSIT TRACKING (For Demo Limits & Freezes)
-- ============================================================
CREATE TABLE IF NOT EXISTS deposit_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL,

  -- Deposit Details
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  broker_transaction_id VARCHAR,

  -- Benefits Granted
  streak_freezes_granted INTEGER DEFAULT 0,
  demo_trades_granted INTEGER DEFAULT 0,
  scanner_tier_unlocked INTEGER,

  -- Timestamps
  deposited_at TIMESTAMP DEFAULT NOW()
);

-- Index for deposits
CREATE INDEX IF NOT EXISTS idx_deposit_tracking_user_id ON deposit_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_deposit_tracking_deposited_at ON deposit_tracking(deposited_at DESC);

-- ============================================================
-- TRIGGERS: Auto-update timestamps
-- ============================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user_gamification
DROP TRIGGER IF EXISTS update_user_gamification_updated_at ON user_gamification;
CREATE TRIGGER update_user_gamification_updated_at
  BEFORE UPDATE ON user_gamification
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- INITIAL BADGE DEFINITIONS
-- ============================================================

-- Insert default quests (will be managed by backend later)
-- These are just examples for the initial setup

-- Daily Quests
INSERT INTO quests (quest_id, quest_type, quest_name, quest_description, quest_icon, target_value, requirement_type, xp_reward, is_active)
VALUES
  ('daily_10_trades', 'daily', 'Volume Trader', 'Execute 10+ trades REAL today', '🎯', 10, 'trades_real', 200, true),
  ('daily_5_wins', 'daily', 'Winner''s Circle', 'Get 5+ wins REAL today', '🏆', 5, 'wins_real', 150, true),
  ('daily_scanner', 'daily', 'Scanner Pro', 'Use Market Scanner 1x today', '🔍', 1, 'scanner_usage', 50, true),
  ('daily_login', 'daily', 'Daily Grind', 'Login and execute 1 trade REAL', '💪', 1, 'trades_real', 100, true)
ON CONFLICT (quest_id) DO NOTHING;

-- Weekly Quests
INSERT INTO quests (quest_id, quest_type, quest_name, quest_description, quest_icon, target_value, requirement_type, xp_reward, is_active)
VALUES
  ('weekly_50_trades', 'weekly', 'Volume King', 'Execute 50+ trades REAL this week', '👑', 50, 'trades_real', 1000, true),
  ('weekly_60_winrate', 'weekly', 'Consistency Master', 'Win rate >60% with min 20 trades REAL', '📊', 60, 'win_rate', 500, true),
  ('weekly_10_scanner', 'weekly', 'Scanner Expert', 'Execute 10 trades REAL via Scanner', '🎯', 10, 'scanner_trades', 500, true),
  ('weekly_5_days', 'weekly', 'Weekly Warrior', 'Operate 5+ days (min 1 trade REAL/day)', '🔥', 5, 'active_days', 300, true)
ON CONFLICT (quest_id) DO NOTHING;

-- ============================================================
-- UTILITY VIEWS
-- ============================================================

-- View: User stats with calculated win rate
CREATE OR REPLACE VIEW user_gamification_stats AS
SELECT
  ug.*,
  CASE
    WHEN ug.total_trades_real > 0 THEN
      ROUND((ug.total_wins_real::DECIMAL / ug.total_trades_real::DECIMAL) * 100, 2)
    ELSE 0
  END AS win_rate_real,
  CASE
    WHEN ug.total_trades > 0 THEN
      ROUND((ug.total_wins::DECIMAL / ug.total_trades::DECIMAL) * 100, 2)
    ELSE 0
  END AS win_rate_overall
FROM user_gamification ug;

-- ============================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================

COMMENT ON TABLE user_gamification IS 'Main gamification table tracking XP, levels, streaks, and demo limits';
COMMENT ON TABLE user_badges IS 'Tracks all badges/achievements earned by users';
COMMENT ON TABLE xp_transactions IS 'Audit log of all XP awarded or removed';
COMMENT ON TABLE quests IS 'Available quests (daily/weekly challenges)';
COMMENT ON TABLE user_quests IS 'User progress on active quests';
COMMENT ON TABLE leaderboards IS 'Cached leaderboard rankings by period and category';
COMMENT ON TABLE streak_history IS 'Historical log of streak events';
COMMENT ON TABLE deposit_tracking IS 'Tracks deposits for Demo Limits and Streak Freezes calculation';

-- ============================================================
-- SUCCESS MESSAGE
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Gamification tables created successfully!';
  RAISE NOTICE '📊 Tables: user_gamification, user_badges, xp_transactions, quests, user_quests, leaderboards, streak_history, deposit_tracking';
  RAISE NOTICE '🎮 Ready for Phase 2 implementation!';
END $$;
