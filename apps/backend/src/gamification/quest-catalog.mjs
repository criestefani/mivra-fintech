// ============================================================
// QUEST CATALOG - PRE-DEFINED QUESTS
// ============================================================
// Complete catalog of all quests in the system
// Organized by category: Onboarding, Flash, Daily, Weekly
// ============================================================

/**
 * ONBOARDING QUESTS
 * Objective: Engage users, teach features, maintain simplicity
 * Rewards: 15-80 XP
 * User must ACCEPT to participate
 */
export const ONBOARDING_QUESTS = [
  {
    quest_id: 'onboarding_profile',
    quest_name: 'Perfil Completo',
    quest_description: 'Complete seu perfil preenchendo todos os dados',
    quest_icon: '👤',
    category: 'onboarding',
    difficulty: 'easy',
    priority: 2,
    target_value: 1,
    requirement_type: 'profile_complete',
    xp_reward: 50,
    reward_type: 'xp',
    requires_acceptance: true,
    is_repeatable: false,
  },
  {
    quest_id: 'onboarding_bot_activate',
    quest_name: 'Bot Ativo',
    quest_description: 'Ative o bot no modo automático',
    quest_icon: '🤖',
    category: 'onboarding',
    difficulty: 'easy',
    priority: 2,
    target_value: 1,
    requirement_type: 'bot_activated',
    xp_reward: 30,
    reward_type: 'xp',
    requires_acceptance: true,
    is_repeatable: false,
  },
  {
    quest_id: 'onboarding_scanner',
    quest_name: 'Scanner Explorer',
    quest_description: 'Explore o Market Scanner e clique em um card',
    quest_icon: '🔍',
    category: 'onboarding',
    difficulty: 'easy',
    priority: 2,
    target_value: 1,
    requirement_type: 'scanner_click',
    xp_reward: 40,
    reward_type: 'xp',
    requires_acceptance: true,
    is_repeatable: false,
  },
  {
    quest_id: 'onboarding_scanner_trade',
    quest_name: 'Scanner Trade',
    quest_description: 'Execute uma operação clicando no Scanner',
    quest_icon: '⚡',
    category: 'onboarding',
    difficulty: 'medium',
    priority: 3,
    target_value: 1,
    requirement_type: 'trade_via_scanner',
    xp_reward: 60,
    reward_type: 'xp',
    requires_acceptance: true,
    is_repeatable: false,
  },
  {
    quest_id: 'onboarding_first_deposit',
    quest_name: 'Primeiro Depósito',
    quest_description: 'Faça seu primeiro depósito na plataforma',
    quest_icon: '💰',
    category: 'onboarding',
    difficulty: 'medium',
    priority: 4,
    target_value: 1,
    requirement_type: 'first_deposit',
    xp_reward: 80,
    reward_type: 'xp',
    requires_acceptance: true,
    is_repeatable: false,
  },
  {
    quest_id: 'onboarding_support',
    quest_name: 'Suporte',
    quest_description: 'Envie uma mensagem no suporte',
    quest_icon: '💬',
    category: 'onboarding',
    difficulty: 'easy',
    priority: 1,
    target_value: 1,
    requirement_type: 'support_message',
    xp_reward: 20,
    reward_type: 'xp',
    requires_acceptance: true,
    is_repeatable: false,
  },
  {
    quest_id: 'onboarding_leverage',
    quest_name: 'Leverage Master',
    quest_description: 'Faça sua primeira operação com Leverage ativo',
    quest_icon: '📈',
    category: 'onboarding',
    difficulty: 'medium',
    priority: 3,
    target_value: 1,
    requirement_type: 'leverage_trade',
    xp_reward: 50,
    reward_type: 'xp',
    requires_acceptance: true,
    is_repeatable: false,
  },
  {
    quest_id: 'onboarding_manual_m5',
    quest_name: 'Trading Manual',
    quest_description: 'Faça 5 operações em modo manual no timeframe de 5 minutos',
    quest_icon: '⏱️',
    category: 'onboarding',
    difficulty: 'medium',
    priority: 3,
    target_value: 5,
    requirement_type: 'manual_trades_m5',
    xp_reward: 70,
    reward_type: 'xp',
    requires_acceptance: true,
    is_repeatable: false,
  },
  {
    quest_id: 'onboarding_referrals_quick',
    quest_name: 'Evangelist',
    quest_description: 'Indique 2 pessoas nas próximas 2 horas',
    quest_icon: '👥',
    category: 'onboarding',
    difficulty: 'hard',
    priority: 4,
    target_value: 2,
    requirement_type: 'referrals_count',
    time_limit_minutes: 120,
    xp_reward: 80,
    reward_type: 'xp',
    requires_acceptance: true,
    is_repeatable: false,
  },
];

/**
 * FLASH QUESTS
 * Objective: Create URGENCY, immediate action required
 * Rewards: 80-600 XP + temporary boosts
 * Time-limited, HIGH PRIORITY, notification required
 * Can be repeatable (daily)
 */
export const FLASH_QUESTS = [
  {
    quest_id: 'flash_deposit_100_20min',
    quest_name: 'Depósito Relâmpago',
    quest_description: 'Deposite R$100+ nos próximos 20 minutos',
    quest_icon: '⚡',
    category: 'flash',
    difficulty: 'expert',
    priority: 5,
    target_value: 100,
    requirement_type: 'deposit_amount',
    time_limit_minutes: 20,
    xp_reward: 300,
    reward_type: 'scanner_unlock',
    reward_value: 3,
    reward_duration_hours: 4,
    requires_acceptance: true,
    is_repeatable: true,
  },
  {
    quest_id: 'flash_3_wins_2h',
    quest_name: '3 Vitórias Seguidas',
    quest_description: 'Consiga 3 vitórias seguidas nas próximas 2 horas',
    quest_icon: '🔥',
    category: 'flash',
    difficulty: 'hard',
    priority: 5,
    target_value: 3,
    requirement_type: 'win_streak_session',
    time_limit_minutes: 120,
    xp_reward: 200,
    reward_type: 'xp_boost',
    reward_value: 2,
    reward_duration_hours: 2,
    requires_acceptance: true,
    is_repeatable: true,
  },
  {
    quest_id: 'flash_session_10trades',
    quest_name: 'Sessão Lucrativa',
    quest_description: 'Tenha uma sessão positiva com no mínimo 10 trades na conta Real',
    quest_icon: '💎',
    category: 'flash',
    difficulty: 'expert',
    priority: 5,
    target_value: 10,
    requirement_type: 'session_positive',
    time_limit_minutes: 240,
    xp_reward: 400,
    reward_type: 'demo_unlimited',
    reward_value: 3,
    reward_duration_hours: 72,
    requires_acceptance: true,
    is_repeatable: true,
  },
  {
    quest_id: 'flash_deposit_50_15min',
    quest_name: 'Depósito Urgente',
    quest_description: 'Deposite R$50+ agora (15 minutos)',
    quest_icon: '⏰',
    category: 'flash',
    difficulty: 'hard',
    priority: 5,
    target_value: 50,
    requirement_type: 'deposit_amount',
    time_limit_minutes: 15,
    xp_reward: 150,
    reward_type: 'scanner_unlock',
    reward_value: 2,
    reward_duration_hours: 2,
    requires_acceptance: true,
    is_repeatable: true,
  },
  {
    quest_id: 'flash_5trades_30min',
    quest_name: '5 Trades Rápido',
    quest_description: 'Execute 5 trades na conta Real nos próximos 30 minutos',
    quest_icon: '⚡',
    category: 'flash',
    difficulty: 'medium',
    priority: 5,
    target_value: 5,
    requirement_type: 'trades_real',
    time_limit_minutes: 30,
    xp_reward: 120,
    reward_type: 'xp_boost',
    reward_value: 1,
    reward_duration_hours: 1,
    requires_acceptance: true,
    is_repeatable: true,
  },
];

/**
 * DAILY QUESTS
 * Objective: Maintain trading consistency, deposits, and referrals
 * Rewards: 80-600 XP + temporary boosts
 * Reset daily, user must accept
 */
export const DAILY_QUESTS = [
  {
    quest_id: 'daily_assets_3',
    quest_name: 'Multi Assets',
    quest_description: 'Opere em 3 assets diferentes hoje',
    quest_icon: '📊',
    category: 'daily',
    difficulty: 'medium',
    priority: 4,
    target_value: 3,
    requirement_type: 'trades_different_assets',
    xp_reward: 150,
    reward_type: 'xp',
    requires_acceptance: true,
    is_repeatable: true,
  },
  {
    quest_id: 'daily_goal_50',
    quest_name: 'Daily Goal R$50',
    quest_description: 'Bata sua meta diária acima de R$50',
    quest_icon: '🎯',
    category: 'daily',
    difficulty: 'hard',
    priority: 4,
    target_value: 50,
    requirement_type: 'profit_today',
    xp_reward: 200,
    reward_type: 'xp_boost',
    reward_value: 2,
    reward_duration_hours: 4,
    requires_acceptance: true,
    is_repeatable: true,
  },
  {
    quest_id: 'daily_trade_20',
    quest_name: 'Big Entry',
    quest_description: 'Faça um trade com entrada acima de R$20',
    quest_icon: '💵',
    category: 'daily',
    difficulty: 'medium',
    priority: 3,
    target_value: 1,
    requirement_type: 'trade_amount',
    xp_reward: 180,
    reward_type: 'xp',
    requires_acceptance: true,
    is_repeatable: true,
  },
  {
    quest_id: 'daily_deposit_30',
    quest_name: 'Daily Deposit',
    quest_description: 'Deposite R$30 ou mais hoje',
    quest_icon: '💳',
    category: 'daily',
    difficulty: 'hard',
    priority: 5,
    target_value: 30,
    requirement_type: 'deposit_amount',
    xp_reward: 250,
    reward_type: 'scanner_unlock',
    reward_value: 2,
    reward_duration_hours: 12,
    requires_acceptance: true,
    is_repeatable: true,
  },
  {
    quest_id: 'daily_10trades',
    quest_name: 'Volume Trader',
    quest_description: 'Execute 10 trades na conta Real hoje',
    quest_icon: '📈',
    category: 'daily',
    difficulty: 'medium',
    priority: 4,
    target_value: 10,
    requirement_type: 'trades_real',
    xp_reward: 200,
    reward_type: 'xp',
    requires_acceptance: true,
    is_repeatable: true,
  },
  {
    quest_id: 'daily_profit_10',
    quest_name: 'Ganho do Dia',
    quest_description: 'Lucre R$10 ou mais hoje',
    quest_icon: '💰',
    category: 'daily',
    difficulty: 'hard',
    priority: 4,
    target_value: 10,
    requirement_type: 'profit_today',
    xp_reward: 220,
    reward_type: 'xp_boost',
    reward_value: 2,
    reward_duration_hours: 6,
    requires_acceptance: true,
    is_repeatable: true,
  },
  {
    quest_id: 'daily_winrate_65',
    quest_name: 'Precisão 65%',
    quest_description: 'Termine uma sessão com 65%+ de assertividade',
    quest_icon: '🎯',
    category: 'daily',
    difficulty: 'hard',
    priority: 4,
    target_value: 65,
    requirement_type: 'win_rate_session',
    xp_reward: 300,
    reward_type: 'demo_unlimited',
    reward_value: 1,
    reward_duration_hours: 24,
    requires_acceptance: true,
    is_repeatable: true,
  },
  {
    quest_id: 'daily_positive',
    quest_name: 'Encerre Positivo',
    quest_description: 'Encerre o dia no positivo',
    quest_icon: '✅',
    category: 'daily',
    difficulty: 'medium',
    priority: 4,
    target_value: 0,
    requirement_type: 'profit_today',
    xp_reward: 180,
    reward_type: 'xp',
    requires_acceptance: true,
    is_repeatable: true,
  },
  {
    quest_id: 'daily_referral_1',
    quest_name: 'Indicação Diária',
    quest_description: 'Indique 1 pessoa hoje',
    quest_icon: '👤',
    category: 'daily',
    difficulty: 'medium',
    priority: 3,
    target_value: 1,
    requirement_type: 'referrals_count',
    xp_reward: 100,
    reward_type: 'xp',
    requires_acceptance: true,
    is_repeatable: true,
  },
];

/**
 * WEEKLY QUESTS
 * Objective: Maintain weekly consistency, high rewards
 * Rewards: 200-900 XP + long-duration boosts
 * Reset weekly, user must accept
 */
export const WEEKLY_QUESTS = [
  {
    quest_id: 'weekly_profit_200',
    quest_name: 'Semana Lucrativa',
    quest_description: 'Termine a semana com R$200+ positivo',
    quest_icon: '🏆',
    category: 'weekly',
    difficulty: 'expert',
    priority: 4,
    target_value: 200,
    requirement_type: 'profit_today',
    xp_reward: 600,
    reward_type: 'scanner_unlock',
    reward_value: 4,
    reward_duration_hours: 48,
    requires_acceptance: true,
    is_repeatable: true,
  },
  {
    quest_id: 'weekly_7days',
    quest_name: 'Guerreiro Semanal',
    quest_description: 'Opere todos os 7 dias da semana',
    quest_icon: '🔥',
    category: 'weekly',
    difficulty: 'hard',
    priority: 4,
    target_value: 7,
    requirement_type: 'active_days',
    xp_reward: 500,
    reward_type: 'xp_boost',
    reward_value: 3,
    reward_duration_hours: 24,
    requires_acceptance: true,
    is_repeatable: true,
  },
  {
    quest_id: 'weekly_referrals_3',
    quest_name: 'Evangelista Semanal',
    quest_description: 'Indique 3 pessoas',
    quest_icon: '👥',
    category: 'weekly',
    difficulty: 'medium',
    priority: 3,
    target_value: 3,
    requirement_type: 'referrals_count',
    xp_reward: 450,
    reward_type: 'early_access',
    reward_value: 1,
    reward_duration_hours: 0,
    requires_acceptance: true,
    is_repeatable: true,
  },
  {
    quest_id: 'weekly_advanced_config',
    quest_name: 'Config Avançada',
    quest_description: 'Use configurações avançadas todos os 7 dias',
    quest_icon: '⚙️',
    category: 'weekly',
    difficulty: 'medium',
    priority: 3,
    target_value: 7,
    requirement_type: 'advanced_config_used',
    xp_reward: 400,
    reward_type: 'xp',
    requires_acceptance: true,
    is_repeatable: true,
  },
  {
    quest_id: 'weekly_min_trades',
    quest_name: 'Volume Semanal',
    quest_description: 'Mínimo 5 trades por dia na semana',
    quest_icon: '📊',
    category: 'weekly',
    difficulty: 'hard',
    priority: 4,
    target_value: 35,
    requirement_type: 'trades_real',
    xp_reward: 550,
    reward_type: 'demo_unlimited',
    reward_value: 7,
    reward_duration_hours: 168,
    requires_acceptance: true,
    is_repeatable: true,
  },
];

/**
 * Get all quests by category
 */
export function getQuestsByCategory(category) {
  switch (category) {
    case 'onboarding':
      return ONBOARDING_QUESTS;
    case 'flash':
      return FLASH_QUESTS;
    case 'daily':
      return DAILY_QUESTS;
    case 'weekly':
      return WEEKLY_QUESTS;
    default:
      return [];
  }
}

/**
 * Get all quests
 */
export function getAllQuests() {
  return [
    ...ONBOARDING_QUESTS,
    ...FLASH_QUESTS,
    ...DAILY_QUESTS,
    ...WEEKLY_QUESTS,
  ];
}

/**
 * Get quest by ID
 */
export function getQuestById(questId) {
  const allQuests = getAllQuests();
  return allQuests.find(q => q.quest_id === questId);
}

/**
 * Get quests that require acceptance
 */
export function getQuestsRequiringAcceptance() {
  return getAllQuests().filter(q => q.requires_acceptance);
}
