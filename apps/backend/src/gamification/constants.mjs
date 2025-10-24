// ============================================================
// GAMIFICATION CONSTANTS
// ============================================================
// XP rewards, level progression, badges configuration
// ============================================================

/**
 * XP Rewards System
 * Based on VOLUME (trades executed), not time
 * Real trades = 20x more XP than Demo
 */
export const XP_REWARDS = {
  // TRADES (Main focus - VOLUME based)
  trade_demo: 1,              // Demo trade (⚠️ Does NOT count for badges)
  trade_real: 20,             // Real trade (20x more!)
  trade_win: 10,              // Bonus for WIN (Real only)
  trade_streak_3: 30,         // 3 wins in a row (Real only)
  trade_streak_5: 100,        // 5 wins in a row (Real only)
  trade_streak_10: 300,       // 10 wins in a row (Real only)

  // VOLUME MILESTONES (Real trades only)
  trades_real_10: 100,        // 10 Real trades
  trades_real_50: 400,        // 50 Real trades
  trades_real_100: 1000,      // 100 Real trades
  trades_real_500: 4000,      // 500 Real trades

  // CRITICAL ACTIONS (Deposit incentives)
  first_deposit: 500,         // ⭐ FIRST DEPOSIT (any amount)
  deposit_100: 200,           // Deposit R$100+
  deposit_500: 1000,          // Deposit R$500+
  deposit_1000: 2500,         // Deposit R$1000+

  // ENGAGEMENT
  daily_login: 10,            // Daily login
  use_scanner: 5,             // Use Market Scanner
  trade_from_scanner: 50,     // Real trade from Scanner signal

  // SOCIAL
  referral_signup: 100,       // Referral signed up
  referral_deposit: 500,      // Referral deposited
};

/**
 * Level Progression System (30 levels)
 * Polynomial XP curve (smooth progression): XP_per_level(L) = 100 + 50(L-1) + 1.8(L-1)²
 * Total XP at Level 30: 37,085 (sustainable, not 498,788 like exponential)
 */
export const LEVEL_SYSTEM = {
  1: { xp: 0, title: 'Novato', unlocks: 'Scanner Tier 1 (sees last 20 assets)' },
  2: { xp: 100, title: 'Aprendiz', unlocks: null },
  3: { xp: 252, title: 'Trader Júnior', unlocks: null },
  4: { xp: 459, title: 'Trader Júnior', unlocks: null },
  5: { xp: 725, title: 'Trader Júnior', unlocks: 'Scanner Tier 2 (sees last 26 assets)' },
  6: { xp: 1054, title: 'Trader Pleno', unlocks: null },
  7: { xp: 1449, title: 'Trader Pleno', unlocks: null },
  8: { xp: 1914, title: 'Trader Pleno', unlocks: null },
  9: { xp: 2452, title: 'Trader Pleno', unlocks: null },
  10: { xp: 3067, title: 'Trader Senior', unlocks: 'Scanner Tier 3 (sees last 28 assets)' },
  11: { xp: 3763, title: 'Trader Senior', unlocks: null },
  12: { xp: 4543, title: 'Trader Senior', unlocks: null },
  13: { xp: 5411, title: 'Trader Senior', unlocks: null },
  14: { xp: 6370, title: 'Trader Senior', unlocks: null },
  15: { xp: 7424, title: 'Trader Expert', unlocks: 'Advanced Analytics Dashboard' },
  16: { xp: 8577, title: 'Trader Expert', unlocks: null },
  17: { xp: 9832, title: 'Trader Expert', unlocks: null },
  18: { xp: 11193, title: 'Trader Expert', unlocks: null },
  19: { xp: 12663, title: 'Trader Expert', unlocks: null },
  20: { xp: 14246, title: 'Trader Elite', unlocks: 'Scanner Tier 4 Elite (sees all 30)' },
  21: { xp: 15946, title: 'Trader Elite', unlocks: null },
  22: { xp: 17766, title: 'Trader Elite', unlocks: null },
  23: { xp: 19710, title: 'Trader Elite', unlocks: null },
  24: { xp: 21781, title: 'Trader Elite', unlocks: null },
  25: { xp: 23983, title: 'Trader Elite', unlocks: null },
  26: { xp: 26320, title: 'Trader Elite', unlocks: null },
  27: { xp: 28795, title: 'Trader Elite', unlocks: null },
  28: { xp: 31412, title: 'Trader Elite', unlocks: null },
  29: { xp: 34174, title: 'Trader Elite', unlocks: null },
  30: { xp: 37085, title: 'Lenda', unlocks: 'Master Status + Priority Scanner' },
};

/**
 * Calculate XP required to advance to next level
 * Formula: XP_per_level(L) = 100 + 50(L-1) + 1.8(L-1)²
 * Where L is the NEXT level (not current level)
 */
export function getXPForNextLevel(currentLevel) {
  if (currentLevel >= 30) return 0; // Max level reached

  const nextLevel = currentLevel + 1;
  const xpForNextLevel = Math.round(100 + 50 * (nextLevel - 1) + 1.8 * Math.pow(nextLevel - 1, 2));
  return xpForNextLevel;
}

/**
 * Get level from total XP
 */
export function getLevelFromXP(totalXP) {
  let level = 1;
  for (let lvl = 30; lvl >= 1; lvl--) {
    if (totalXP >= LEVEL_SYSTEM[lvl].xp) {
      level = lvl;
      break;
    }
  }
  return level;
}

/**
 * Get level info (title, unlocks)
 */
export function getLevelInfo(level) {
  return LEVEL_SYSTEM[level] || LEVEL_SYSTEM[1];
}

/**
 * Badge Definitions
 * IMPORTANT: Only REAL trades count for badges (except "Estrategista")
 */
export const BADGES = {
  // ============================================================
  // VOLUME MILESTONES (Real trades only)
  // ============================================================
  first_blood: {
    id: 'first_blood',
    name: 'First Blood',
    description: '1 trade REAL executado',
    icon: '🎯',
    category: 'volume',
    rarity: 'common',
    xp_reward: 20,
    requirement: { type: 'trades_real', value: 1 },
  },
  getting_started: {
    id: 'getting_started',
    name: 'Getting Started',
    description: '10 trades REAL executados',
    icon: '🚀',
    category: 'volume',
    rarity: 'common',
    xp_reward: 100,
    requirement: { type: 'trades_real', value: 10 },
  },
  trader_wannabe: {
    id: 'trader_wannabe',
    name: 'Trader Wannabe',
    description: '50 trades REAL executados',
    icon: '📈',
    category: 'volume',
    rarity: 'common',
    xp_reward: 400,
    requirement: { type: 'trades_real', value: 50 },
  },
  club_100: {
    id: 'club_100',
    name: '100 Club',
    description: '100 trades REAL executados',
    icon: '💯',
    category: 'volume',
    rarity: 'rare',
    xp_reward: 1000,
    requirement: { type: 'trades_real', value: 100 },
  },
  veteran_trader: {
    id: 'veteran_trader',
    name: 'Veteran Trader',
    description: '250 trades REAL executados',
    icon: '🎖️',
    category: 'volume',
    rarity: 'rare',
    xp_reward: 2000,
    requirement: { type: 'trades_real', value: 250 },
  },
  high_roller: {
    id: 'high_roller',
    name: 'High Roller',
    description: '500 trades REAL executados',
    icon: '💎',
    category: 'volume',
    rarity: 'epic',
    xp_reward: 4000,
    requirement: { type: 'trades_real', value: 500 },
  },
  trading_machine: {
    id: 'trading_machine',
    name: 'Trading Machine',
    description: '1000 trades REAL executados',
    icon: '🤖',
    category: 'volume',
    rarity: 'epic',
    xp_reward: 10000,
    requirement: { type: 'trades_real', value: 1000 },
  },
  trading_god: {
    id: 'trading_god',
    name: 'Trading God',
    description: '5000 trades REAL executados',
    icon: '👑',
    category: 'volume',
    rarity: 'legendary',
    xp_reward: 50000,
    requirement: { type: 'trades_real', value: 5000 },
  },

  // ============================================================
  // PERFORMANCE (Min 50 trades to qualify)
  // ============================================================
  club_60: {
    id: 'club_60',
    name: '60% Club',
    description: '60%+ win rate (min 50 trades)',
    icon: '📊',
    category: 'performance',
    rarity: 'rare',
    xp_reward: 300,
    requirement: { type: 'win_rate', value: 60, min_trades: 50 },
  },
  elite_70: {
    id: 'elite_70',
    name: '70% Elite',
    description: '70%+ win rate (min 50 trades)',
    icon: '🎲',
    category: 'performance',
    rarity: 'epic',
    xp_reward: 1000,
    requirement: { type: 'win_rate', value: 70, min_trades: 50 },
  },
  legend_80: {
    id: 'legend_80',
    name: '80% Legend',
    description: '80%+ win rate (min 50 trades)',
    icon: '🔥',
    category: 'performance',
    rarity: 'legendary',
    xp_reward: 3000,
    requirement: { type: 'win_rate', value: 80, min_trades: 50 },
  },
  streak_master_5: {
    id: 'streak_master_5',
    name: '5 Streak Master',
    description: '5 wins seguidos',
    icon: '🔗',
    category: 'performance',
    rarity: 'rare',
    xp_reward: 100,
    requirement: { type: 'win_streak', value: 5 },
  },
  streak_god_10: {
    id: 'streak_god_10',
    name: '10 Streak God',
    description: '10 wins seguidos',
    icon: '💪',
    category: 'performance',
    rarity: 'epic',
    xp_reward: 300,
    requirement: { type: 'win_streak', value: 10 },
  },
  streak_titan_20: {
    id: 'streak_titan_20',
    name: '20 Streak Titan',
    description: '20 wins seguidos',
    icon: '🏆',
    category: 'performance',
    rarity: 'legendary',
    xp_reward: 1000,
    requirement: { type: 'win_streak', value: 20 },
  },

  // ============================================================
  // BEHAVIOR (Deposit & Engagement incentives)
  // ============================================================
  first_deposit: {
    id: 'first_deposit',
    name: 'First Deposit',
    description: 'Primeiro depósito (qualquer valor)',
    icon: '🎁',
    category: 'behavior',
    rarity: 'epic',
    xp_reward: 500,
    requirement: { type: 'first_deposit', value: 1 },
  },
  serious_trader: {
    id: 'serious_trader',
    name: 'Serious Trader',
    description: 'Depósito R$200+',
    icon: '💼',
    category: 'behavior',
    rarity: 'epic',
    xp_reward: 1000,
    requirement: { type: 'deposit_amount', value: 200 },
  },
  whale: {
    id: 'whale',
    name: 'Whale',
    description: 'Depósito R$1000+',
    icon: '🐋',
    category: 'behavior',
    rarity: 'legendary',
    xp_reward: 5000,
    requirement: { type: 'deposit_amount', value: 1000 },
  },
  daily_trader: {
    id: 'daily_trader',
    name: 'Daily Trader',
    description: '7 dias streak',
    icon: '📅',
    category: 'behavior',
    rarity: 'rare',
    xp_reward: 200,
    requirement: { type: 'daily_streak', value: 7 },
  },
  weekly_warrior: {
    id: 'weekly_warrior',
    name: 'Weekly Warrior',
    description: '30 dias streak',
    icon: '⚔️',
    category: 'behavior',
    rarity: 'epic',
    xp_reward: 1000,
    requirement: { type: 'daily_streak', value: 30 },
  },
  scanner_pro: {
    id: 'scanner_pro',
    name: 'Scanner Pro',
    description: '100 trades via Scanner',
    icon: '🔍',
    category: 'behavior',
    rarity: 'rare',
    xp_reward: 500,
    requirement: { type: 'scanner_trades', value: 100 },
  },

  // ============================================================
  // ONBOARDING (Real trades only)
  // ============================================================
  bot_activated: {
    id: 'bot_activated',
    name: 'Bot Activated',
    description: 'Primeiro trade REAL executado',
    icon: '🤖',
    category: 'onboarding',
    rarity: 'common',
    xp_reward: 50,
    requirement: { type: 'trades_real', value: 1 },
  },
  first_win: {
    id: 'first_win',
    name: 'First Win',
    description: 'Primeiro trade REAL vencedor',
    icon: '💰',
    category: 'onboarding',
    rarity: 'common',
    xp_reward: 100,
    requirement: { type: 'wins_real', value: 1 },
  },

  // ============================================================
  // DEMO EXPLORATION (ONLY badge for Demo trades)
  // ============================================================
  estrategista: {
    id: 'estrategista',
    name: 'Estrategista',
    description: '500 trades Demo executados - Testador incansável',
    icon: '🔬',
    category: 'demo',
    rarity: 'rare',
    xp_reward: 100,
    requirement: { type: 'trades_demo', value: 500 },
  },

  // ============================================================
  // SOCIAL
  // ============================================================
  evangelista: {
    id: 'evangelista',
    name: 'Evangelista',
    description: '3 referrals cadastrados',
    icon: '👥',
    category: 'social',
    rarity: 'rare',
    xp_reward: 300,
    requirement: { type: 'referrals', value: 3 },
  },
  influencer: {
    id: 'influencer',
    name: 'Influencer',
    description: '10 referrals cadastrados',
    icon: '🌟',
    category: 'social',
    rarity: 'epic',
    xp_reward: 1500,
    requirement: { type: 'referrals', value: 10 },
  },
  league_leader: {
    id: 'league_leader',
    name: 'Líder de Liga',
    description: 'Top 10 leaderboard semanal',
    icon: '🏆',
    category: 'social',
    rarity: 'epic',
    xp_reward: 500,
    requirement: { type: 'leaderboard_rank', value: 10 },
  },

  // ============================================================
  // SPECIAL/RARE (< 5% of users)
  // ============================================================
  perfect_20: {
    id: 'perfect_20',
    name: 'Perfect 20',
    description: '20 wins seguidos',
    icon: '🌟',
    category: 'special',
    rarity: 'legendary',
    xp_reward: 2000,
    requirement: { type: 'win_streak', value: 20 },
  },
  profit_king: {
    id: 'profit_king',
    name: 'Profit King',
    description: 'R$10k lucro acumulado',
    icon: '💎',
    category: 'special',
    rarity: 'legendary',
    xp_reward: 3000,
    requirement: { type: 'total_profit', value: 10000 },
  },
  consistency_master: {
    id: 'consistency_master',
    name: 'Consistency Master',
    description: '70%+ win rate em 500+ trades',
    icon: '🔮',
    category: 'special',
    rarity: 'legendary',
    xp_reward: 5000,
    requirement: { type: 'win_rate', value: 70, min_trades: 500 },
  },
};

/**
 * Scanner Tier System
 * Unlock by Level OR Deposit
 */
export const SCANNER_TIERS = {
  1: {
    name: 'FREE',
    level_required: 1,
    deposit_required: 0,
    visible_assets: 20, // Sees positions #11-30
    blocked_top: 10,    // TOP 10 blocked
  },
  2: {
    name: 'INTERMEDIATE',
    level_required: 5,
    deposit_required: 200,
    visible_assets: 26, // Sees positions #5-30
    blocked_top: 4,     // TOP 4 blocked
    xp_bonus: 500,
  },
  3: {
    name: 'PRO',
    level_required: 10,
    deposit_required: 500,
    visible_assets: 28, // Sees positions #3-30
    blocked_top: 2,     // TOP 2 blocked (ELITE only)
    xp_bonus: 1000,
  },
  4: {
    name: 'ELITE',
    level_required: 20,
    deposit_required: 1500,
    visible_assets: 30, // Sees ALL positions #1-30
    blocked_top: 0,     // Nothing blocked
    xp_bonus: 2500,
  },
};

/**
 * Demo Limits System
 * Based on deposits in last 30 days
 */
export const DEMO_LIMITS = {
  exploration_days: 7,        // First 7 days = unlimited
  base_daily_limit: 20,       // After exploration = 20/day
  bonus_per_100: 50,          // +50 trades per R$100 deposited
  unlimited_threshold: 1000,  // R$1000+ = unlimited
};

/**
 * Streak Freeze System
 * Based on deposits in last 30 days
 */
export const STREAK_FREEZE = {
  freezes_per_100: 2,         // 2 freezes per R$100 deposited
  max_freezes: 7,             // Max 7 freezes accumulated
};

/**
 * Streak Bonus XP System
 * Daily streak multipliers
 */
export const STREAK_BONUS_XP = {
  '1-6': 0,       // +0 XP per trade
  '7-13': 5,      // +5 XP per trade
  '14-29': 10,    // +10 XP per trade
  '30-59': 20,    // +20 XP per trade
  '60+': 50,      // +50 XP per trade (INSANE!)
};

/**
 * Get streak bonus XP for current streak
 */
export function getStreakBonusXP(streakDays) {
  if (streakDays >= 60) return STREAK_BONUS_XP['60+'];
  if (streakDays >= 30) return STREAK_BONUS_XP['30-59'];
  if (streakDays >= 14) return STREAK_BONUS_XP['14-29'];
  if (streakDays >= 7) return STREAK_BONUS_XP['7-13'];
  return STREAK_BONUS_XP['1-6'];
}
