-- ============================================================
-- REFERRAL SYSTEM - DATABASE SCHEMA
-- ============================================================
-- MivraTech Referral Program with First-Time Deposit (FTD) tracking
-- ============================================================

-- ============================================================
-- 1. REFERRALS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Código único de 8 caracteres para compartilhamento
  referral_code VARCHAR(8) UNIQUE NOT NULL,

  -- Quem indicou (referrer)
  referrer_user_id VARCHAR NOT NULL,

  -- Quem foi indicado (referee)
  referee_user_id VARCHAR,
  referee_email VARCHAR,

  -- Status do referral (sem premiação até FTD)
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'registered', 'deposited')),
  -- pending: código gerado, ainda não utilizado
  -- registered: usuario criou conta com código
  -- deposited: fez primeiro depósito (PREMIADO AQUI)

  -- Timestamps de eventos
  signup_date TIMESTAMP,
  first_deposit_date TIMESTAMP,

  -- Primeiro depósito (necessário para completar referral)
  first_deposit_amount DECIMAL(10, 2),

  -- Quando a premiação foi processada
  rewarded_at TIMESTAMP,

  -- Timestamps de sistema
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 2. ÍNDICES PARA REFERRALS
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee ON referrals(referee_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_status ON referrals(referrer_user_id, status);

-- ============================================================
-- 3. ADICIONAR COLUNAS A USER_GAMIFICATION
-- ============================================================
ALTER TABLE user_gamification
ADD COLUMN IF NOT EXISTS referral_code VARCHAR(8) UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by_code VARCHAR(8),
ADD COLUMN IF NOT EXISTS total_referrals_deposited INTEGER DEFAULT 0;

-- ============================================================
-- 4. COMENTÁRIOS
-- ============================================================
COMMENT ON TABLE referrals IS 'Tracks referral program activity. Rewards given ONLY on first deposit (FTD)';
COMMENT ON COLUMN referrals.status IS 'pending → registered (no reward yet) → deposited (500 XP awarded)';
COMMENT ON COLUMN referrals.first_deposit_amount IS 'Required for FTD reward trigger';

-- ============================================================
-- 5. SUCCESS MESSAGE
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Referral system tables created successfully!';
  RAISE NOTICE '💎 Rewards: ONLY on First Time Deposit (500 XP)';
  RAISE NOTICE '🎁 Referral tracking ready for MivraTech!';
END $$;
