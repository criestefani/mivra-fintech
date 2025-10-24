-- ============================================================
-- QUESTS SYSTEM EXPANSION - DATABASE SCHEMA
-- ============================================================
-- Expansion of quests system with:
-- - Difficulty & Priority levels
-- - Time-limited quests (Flash quests)
-- - Multiple reward types (XP, Scanner unlock, boosts, etc)
-- - Quest acceptance requirement (user must accept to participate)
-- ============================================================

-- ============================================================
-- 1. EXPAND QUESTS TABLE
-- ============================================================
ALTER TABLE quests
ADD COLUMN IF NOT EXISTS difficulty VARCHAR DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
ADD COLUMN IF NOT EXISTS time_limit_minutes INTEGER,
ADD COLUMN IF NOT EXISTS reward_type VARCHAR DEFAULT 'xp' CHECK (reward_type IN ('xp', 'scanner_unlock', 'xp_boost', 'demo_unlimited', 'early_access')),
ADD COLUMN IF NOT EXISTS reward_value INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reward_duration_hours INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS requires_acceptance BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS category VARCHAR CHECK (category IN ('onboarding', 'flash', 'daily', 'weekly', 'seasonal')),
ADD COLUMN IF NOT EXISTS is_repeatable BOOLEAN DEFAULT false;

-- ============================================================
-- 2. EXPAND USER_QUESTS TABLE FOR ACCEPTANCE FLOW
-- ============================================================
ALTER TABLE user_quests
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS reward_claimed_at TIMESTAMP;

-- Update status check constraint to include 'invited', 'rejected'
-- (Note: Supabase might require dropping and recreating)
-- This is handled by the code - we won't restrict the check here

-- ============================================================
-- 3. CREATE QUEST_REWARDS_GRANTED TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS quest_rewards_granted (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User and quest reference
  user_id VARCHAR NOT NULL,
  quest_id VARCHAR NOT NULL,

  -- Reward details
  reward_type VARCHAR NOT NULL CHECK (reward_type IN ('xp', 'scanner_unlock', 'xp_boost', 'demo_unlimited', 'early_access')),
  reward_value INTEGER NOT NULL,

  -- Duration (for temporary rewards)
  granted_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, quest_id, reward_type)
);

-- Indexes for quest_rewards_granted
CREATE INDEX IF NOT EXISTS idx_quest_rewards_user_id ON quest_rewards_granted(user_id);
CREATE INDEX IF NOT EXISTS idx_quest_rewards_quest_id ON quest_rewards_granted(quest_id);
CREATE INDEX IF NOT EXISTS idx_quest_rewards_is_active ON quest_rewards_granted(is_active);
CREATE INDEX IF NOT EXISTS idx_quest_rewards_expires_at ON quest_rewards_granted(expires_at);
CREATE INDEX IF NOT EXISTS idx_quest_rewards_user_active ON quest_rewards_granted(user_id, is_active);

-- ============================================================
-- 4. CREATE QUEST_REQUIREMENT_TRACKING TABLE
-- ============================================================
-- Tracks actual events/metrics for quest progress calculation
CREATE TABLE IF NOT EXISTS quest_requirement_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference
  user_id VARCHAR NOT NULL,
  requirement_type VARCHAR NOT NULL,

  -- Value tracked
  value INTEGER DEFAULT 1,

  -- Date tracking (to differentiate daily tracking)
  tracked_date DATE DEFAULT CURRENT_DATE,

  -- Event details
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, requirement_type, tracked_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_quest_tracking_user_id ON quest_requirement_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_quest_tracking_requirement ON quest_requirement_tracking(requirement_type);
CREATE INDEX IF NOT EXISTS idx_quest_tracking_date ON quest_requirement_tracking(tracked_date DESC);

-- ============================================================
-- 5. SAMPLE EXPANDED QUESTS (will be populated by quest-catalog.mjs)
-- ============================================================

-- ONBOARDING QUESTS (appear once, user must accept)
INSERT INTO quests (quest_id, quest_type, category, quest_name, quest_description, quest_icon, target_value, requirement_type, xp_reward, difficulty, priority, requires_acceptance, is_repeatable, is_active)
VALUES
  ('onboarding_profile', 'daily', 'onboarding', 'Perfil Completo', 'Complete seu perfil preenchendo todos os dados', '👤', 1, 'profile_complete', 50, 'easy', 2, true, false, true),
  ('onboarding_bot_activate', 'daily', 'onboarding', 'Bot Ativo', 'Ative o bot no modo automático', '🤖', 1, 'bot_activated', 30, 'easy', 2, true, false, true),
  ('onboarding_scanner', 'daily', 'onboarding', 'Scanner Explorer', 'Explore o Market Scanner e clique em um card', '🔍', 1, 'scanner_click', 40, 'easy', 2, true, false, true),
  ('onboarding_scanner_trade', 'daily', 'onboarding', 'Scanner Trade', 'Execute uma operação clicando no Scanner', '⚡', 1, 'trade_via_scanner', 60, 'medium', 3, true, false, true),
  ('onboarding_first_deposit', 'daily', 'onboarding', 'Primeiro Depósito', 'Faça seu primeiro depósito na plataforma', '💰', 1, 'first_deposit', 80, 'medium', 4, true, false, true),
  ('onboarding_support', 'daily', 'onboarding', 'Suporte', 'Envie uma mensagem no suporte', '💬', 1, 'support_message', 20, 'easy', 1, true, false, true),
  ('onboarding_leverage', 'daily', 'onboarding', 'Leverage Master', 'Faça sua primeira operação com Leverage ativo', '📈', 1, 'leverage_trade', 50, 'medium', 3, true, false, true),
  ('onboarding_manual_m5', 'daily', 'onboarding', 'Trading Manual', 'Faça 5 operações em modo manual no timeframe de 5 minutos', '⏱️', 5, 'manual_trades_m5', 70, 'medium', 3, true, false, true),
  ('onboarding_referrals_quick', 'daily', 'onboarding', 'Evangelist', 'Indique 2 pessoas nas próximas 2 horas', '👥', 2, 'referrals_count', 80, 'hard', 4, true, false, true)
ON CONFLICT (quest_id) DO NOTHING;

-- FLASH QUESTS (time-limited, high priority, appear with notification)
INSERT INTO quests (quest_id, quest_type, category, quest_name, quest_description, quest_icon, target_value, requirement_type, xp_reward, reward_type, reward_value, reward_duration_hours, difficulty, priority, time_limit_minutes, requires_acceptance, is_repeatable, is_active)
VALUES
  ('flash_deposit_100_20min', 'daily', 'flash', 'Depósito Relâmpago', 'Deposite R$100+ nos próximos 20 minutos', '⚡', 100, 'deposit_amount', 300, 'scanner_unlock', 3, 4, 'expert', 5, 20, true, true, true),
  ('flash_3_wins_2h', 'daily', 'flash', '3 Vitórias Seguidas', 'Consiga 3 vitórias seguidas nas próximas 2 horas', '🔥', 3, 'win_streak_session', 200, 'xp_boost', 2, 2, 'hard', 5, 120, true, true, true),
  ('flash_session_10trades', 'daily', 'flash', 'Sessão Lucrativa', 'Tenha uma sessão positiva com no mínimo 10 trades na conta Real', '💎', 10, 'session_positive', 400, 'demo_unlimited', 3, 'expert', 5, 240, true, true, true),
  ('flash_deposit_50_15min', 'daily', 'flash', 'Depósito Urgente', 'Deposite R$50+ agora (15 minutos)', '⏰', 50, 'deposit_amount', 150, 'scanner_unlock', 2, 2, 'hard', 5, 15, true, true, true),
  ('flash_5trades_30min', 'daily', 'flash', '5 Trades Rápido', 'Execute 5 trades na conta Real nos próximos 30 minutos', '⚡', 5, 'trades_real', 120, 'xp_boost', 1, 1, 'medium', 5, 30, true, true, true)
ON CONFLICT (quest_id) DO NOTHING;

-- DAILY QUESTS
INSERT INTO quests (quest_id, quest_type, category, quest_name, quest_description, quest_icon, target_value, requirement_type, xp_reward, reward_type, reward_value, reward_duration_hours, difficulty, priority, requires_acceptance, is_repeatable, is_active)
VALUES
  ('daily_assets_3', 'daily', 'daily', 'Multi Assets', 'Opere em 3 assets diferentes hoje', '📊', 3, 'trades_different_assets', 150, 'xp', 0, 0, 'medium', 4, true, true, true),
  ('daily_goal_50', 'daily', 'daily', 'Daily Goal R$50', 'Bata sua meta diária acima de R$50', '🎯', 50, 'profit_today', 200, 'xp_boost', 2, 4, 'hard', 4, true, true, true),
  ('daily_trade_20', 'daily', 'daily', 'Big Entry', 'Faça um trade com entrada acima de R$20', '💵', 1, 'trade_amount', 180, 'xp', 0, 0, 'medium', 3, true, true, true),
  ('daily_deposit_30', 'daily', 'daily', 'Daily Deposit', 'Deposite R$30 ou mais hoje', '💳', 30, 'deposit_amount', 250, 'scanner_unlock', 2, 12, 'hard', 5, true, true, true),
  ('daily_10trades', 'daily', 'daily', 'Volume Trader', 'Execute 10 trades na conta Real hoje', '📈', 10, 'trades_real', 200, 'xp', 0, 0, 'medium', 4, true, true, true),
  ('daily_profit_10', 'daily', 'daily', 'Ganho do Dia', 'Lucre R$10 ou mais hoje', '💰', 10, 'profit_today', 220, 'xp_boost', 2, 6, 'hard', 4, true, true, true),
  ('daily_winrate_65', 'daily', 'daily', 'Precisão 65%', 'Termine uma sessão com 65%+ de assertividade', '🎯', 65, 'win_rate_session', 300, 'demo_unlimited', 1, 'hard', 4, true, true, true),
  ('daily_positive', 'daily', 'daily', 'Encerre Positivo', 'Encerre o dia no positivo', '✅', 0, 'profit_today', 180, 'xp', 0, 0, 'medium', 4, true, true, true),
  ('daily_referral_1', 'daily', 'daily', 'Indicação Diária', 'Indique 1 pessoa hoje', '👤', 1, 'referrals_count', 100, 'xp', 0, 0, 'medium', 3, true, true, true)
ON CONFLICT (quest_id) DO NOTHING;

-- WEEKLY QUESTS
INSERT INTO quests (quest_id, quest_type, category, quest_name, quest_description, quest_icon, target_value, requirement_type, xp_reward, reward_type, reward_value, reward_duration_hours, difficulty, priority, requires_acceptance, is_repeatable, is_active)
VALUES
  ('weekly_profit_200', 'weekly', 'weekly', 'Semana Lucrativa', 'Termine a semana com R$200+ positivo', '🏆', 200, 'profit_today', 600, 'scanner_unlock', 4, 48, 'expert', 4, true, true, true),
  ('weekly_7days', 'weekly', 'weekly', 'Guerreiro Semanal', 'Opere todos os 7 dias da semana', '🔥', 7, 'active_days', 500, 'xp_boost', 3, 24, 'hard', 4, true, true, true),
  ('weekly_referrals_3', 'weekly', 'weekly', 'Evangelista Semanal', 'Indique 3 pessoas', '👥', 3, 'referrals_count', 450, 'early_access', 1, 0, 'medium', 3, true, true, true),
  ('weekly_advanced_config', 'weekly', 'weekly', 'Config Avançada', 'Use configurações avançadas todos os 7 dias', '⚙️', 7, 'advanced_config_used', 400, 'xp', 0, 0, 'medium', 3, true, true, true),
  ('weekly_min_trades', 'weekly', 'weekly', 'Volume Semanal', 'Mínimo 5 trades por dia na semana', '📊', 35, 'trades_real', 550, 'demo_unlimited', 7, 'hard', 4, true, true, true)
ON CONFLICT (quest_id) DO NOTHING;

-- ============================================================
-- 6. SUCCESS MESSAGE
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE 'Quests system expansion completed!';
  RAISE NOTICE 'New features: Difficulty levels, Priority, Time limits, Multiple reward types';
  RAISE NOTICE 'User acceptance required for quests to track';
  RAISE NOTICE 'Ready for quest service implementation!';
END $$;
