// ============================================================
// GAMIFICATION SERVICE
// ============================================================
// Core logic for XP, levels, badges, streaks
// ============================================================

import {
  XP_REWARDS,
  LEVEL_SYSTEM,
  BADGES,
  SCANNER_TIERS,
  DEMO_LIMITS,
  STREAK_FREEZE,
  getXPForNextLevel,
  getLevelFromXP,
  getLevelInfo,
  getStreakBonusXP,
} from './constants.mjs';

/**
 * Initialize user gamification profile
 * Called when user first registers
 */
export async function initializeUserGamification(supabase, userId) {
  try {
    const { data, error } = await supabase
      .from('user_gamification')
      .insert({
        user_id: userId,
        total_xp: 0,
        current_level: 1,
        xp_current_level: 0,
        xp_next_level: 100,
        level_title: 'Novato',
        scanner_tier: 1,
        demo_phase: 'exploration',
        demo_daily_limit: 999999, // Unlimited for first 7 days
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error initializing gamification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get user gamification progress
 * Automatically recalculates xp_next_level using new polynomial formula
 * (handles legacy data from exponential formula)
 */
export async function getUserProgress(supabase, userId) {
  try {
    const { data, error } = await supabase
      .from('user_gamification')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // User not initialized yet
      if (error.code === 'PGRST116') {
        const initResult = await initializeUserGamification(supabase, userId);
        if (initResult.success) {
          return { success: true, data: initResult.data };
        }
      }
      throw error;
    }

    // Recalculate xp_next_level using new polynomial formula (handles legacy data)
    const correctXpForNextLevel = getXPForNextLevel(data.current_level);

    // If mismatch detected (legacy exponential formula), update it silently
    if (data.xp_next_level !== correctXpForNextLevel) {
      // Update in background without blocking response
      supabase
        .from('user_gamification')
        .update({ xp_next_level: correctXpForNextLevel })
        .eq('user_id', userId)
        .then(() => {
          console.log(`✅ Updated xp_next_level for ${userId}: ${data.xp_next_level} → ${correctXpForNextLevel}`);
        })
        .catch((err) => {
          console.error(`⚠️ Error updating xp_next_level for ${userId}:`, err);
        });

      // Return corrected data to user
      data.xp_next_level = correctXpForNextLevel;
    }

    return { success: true, data };
  } catch (error) {
    console.error('❌ Error getting user progress:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Award XP to user
 * Handles level ups, badge unlocks, XP transactions
 */
export async function awardXP(supabase, userId, amount, source, metadata = {}) {
  try {
    // Get current progress
    const progressResult = await getUserProgress(supabase, userId);
    if (!progressResult.success) throw new Error(progressResult.error);

    const progress = progressResult.data;

    // Calculate new XP
    const oldTotalXP = progress.total_xp;
    const newTotalXP = oldTotalXP + amount;

    // Calculate new level
    const oldLevel = progress.current_level;
    const newLevel = getLevelFromXP(newTotalXP);
    const leveledUp = newLevel > oldLevel;

    // Get level info
    const levelInfo = getLevelInfo(newLevel);
    const xpForNextLevel = getXPForNextLevel(newLevel);

    // Calculate XP in current level
    const levelStartXP = LEVEL_SYSTEM[newLevel].xp;
    const xpCurrentLevel = newTotalXP - levelStartXP;

    // Update user_gamification
    const { data: updatedProgress, error: updateError } = await supabase
      .from('user_gamification')
      .update({
        total_xp: newTotalXP,
        current_level: newLevel,
        xp_current_level: xpCurrentLevel,
        xp_next_level: xpForNextLevel,
        level_title: levelInfo.title,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log XP transaction
    await supabase.from('xp_transactions').insert({
      user_id: userId,
      amount,
      source,
      metadata,
    });

    // Check for Scanner Tier unlock (if leveled up)
    let scannerTierUnlocked = null;
    if (leveledUp) {
      for (const [tier, tierInfo] of Object.entries(SCANNER_TIERS)) {
        if (newLevel >= tierInfo.level_required && progress.scanner_tier < parseInt(tier)) {
          await supabase
            .from('user_gamification')
            .update({ scanner_tier: parseInt(tier) })
            .eq('user_id', userId);

          scannerTierUnlocked = parseInt(tier);
          break;
        }
      }

      // Create level up notification
      await createNotification(supabase, userId, 'level_up', {
        title: `🎉 Level ${newLevel}!`,
        message: `Congrats! You reached Level ${newLevel} (${levelInfo.title})`,
        icon: '⬆️',
        metadata: { new_level: newLevel, old_level: oldLevel, level_title: levelInfo.title },
      });
    }

    // Check for badge unlocks
    const badgesUnlocked = await checkBadgeUnlocks(supabase, userId, updatedProgress);

    return {
      success: true,
      data: {
        xp_awarded: amount,
        old_level: oldLevel,
        new_level: newLevel,
        leveled_up: leveledUp,
        total_xp: newTotalXP,
        xp_current_level: xpCurrentLevel,
        xp_next_level: xpForNextLevel,
        level_title: levelInfo.title,
        level_unlocks: levelInfo.unlocks,
        scanner_tier_unlocked: scannerTierUnlocked,
        badges_unlocked: badgesUnlocked,
      },
    };
  } catch (error) {
    console.error('❌ Error awarding XP:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check and unlock eligible badges
 */
export async function checkBadgeUnlocks(supabase, userId, progress) {
  try {
    const badgesUnlocked = [];

    // Get user's existing badges
    const { data: existingBadges } = await supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', userId);

    const existingBadgeIds = existingBadges ? existingBadges.map((b) => b.badge_id) : [];

    // Check each badge
    for (const [badgeId, badge] of Object.entries(BADGES)) {
      // Skip if already has badge
      if (existingBadgeIds.includes(badgeId)) continue;

      // Check requirement
      const eligible = checkBadgeRequirement(progress, badge.requirement);

      if (eligible) {
        // Award badge
        const { data: newBadge, error } = await supabase
          .from('user_badges')
          .insert({
            user_id: userId,
            badge_id: badgeId,
            badge_name: badge.name,
            badge_icon: badge.icon,
            badge_category: badge.category,
            badge_rarity: badge.rarity,
            xp_reward: badge.xp_reward,
          })
          .select()
          .single();

        if (!error) {
          badgesUnlocked.push(newBadge);

          // Create badge unlock notification
          await createNotification(supabase, userId, 'badge_unlock', {
            title: `${badge.icon} ${badge.name} Unlocked!`,
            message: `You earned the ${badge.name} badge (${badge.rarity})`,
            icon: badge.icon,
            metadata: { badge_id: badgeId, badge_name: badge.name, badge_rarity: badge.rarity },
          });

          // Award badge XP (recursive, but safe since badges won't trigger more badges)
          if (badge.xp_reward > 0) {
            await awardXP(supabase, userId, badge.xp_reward, 'badge', { badge_id: badgeId });
          }
        }
      }
    }

    return badgesUnlocked;
  } catch (error) {
    console.error('❌ Error checking badge unlocks:', error);
    return [];
  }
}

/**
 * Check if user meets badge requirement
 */
function checkBadgeRequirement(progress, requirement) {
  const { type, value, min_trades } = requirement;

  switch (type) {
    case 'trades_real':
      return progress.total_trades_real >= value;

    case 'trades_demo':
      return progress.total_trades_demo >= value;

    case 'wins_real':
      return progress.total_wins_real >= value;

    case 'win_rate':
      if (progress.total_trades_real < (min_trades || 50)) return false;
      const winRate = (progress.total_wins_real / progress.total_trades_real) * 100;
      return winRate >= value;

    case 'win_streak':
      return progress.best_win_streak >= value;

    case 'daily_streak':
      return progress.best_streak >= value;

    case 'first_deposit':
      return progress.total_deposits_last_30_days > 0;

    case 'deposit_amount':
      return progress.total_deposits_last_30_days >= value;

    default:
      return false;
  }
}

/**
 * Update daily streak
 * Called when user executes at least 1 trade in a day
 */
export async function updateDailyStreak(supabase, userId) {
  try {
    const progressResult = await getUserProgress(supabase, userId);
    if (!progressResult.success) throw new Error(progressResult.error);

    const progress = progressResult.data;
    const today = new Date().toISOString().split('T')[0];
    const lastTradeDate = progress.last_trade_date;

    let newStreak = progress.current_streak;
    let streakIncreased = false;

    if (!lastTradeDate) {
      // First trade ever
      newStreak = 1;
      streakIncreased = true;
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastTradeDate === yesterdayStr) {
        // Consecutive day
        newStreak = progress.current_streak + 1;
        streakIncreased = true;
      } else if (lastTradeDate === today) {
        // Already traded today
        return { success: true, streak_increased: false, current_streak: newStreak };
      } else {
        // Streak broken
        newStreak = 1;
      }
    }

    // Update best streak
    const newBestStreak = Math.max(progress.best_streak, newStreak);

    // Update database
    await supabase
      .from('user_gamification')
      .update({
        current_streak: newStreak,
        best_streak: newBestStreak,
        last_trade_date: today,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    // Log streak event
    await supabase.from('streak_history').insert({
      user_id: userId,
      streak_type: 'daily',
      streak_count: newStreak,
      event_type: streakIncreased ? 'increased' : 'started',
    });

    // Check for streak milestone rewards
    if (streakIncreased) {
      const milestones = [3, 7, 14, 30, 60];
      if (milestones.includes(newStreak)) {
        const xpReward = { 3: 50, 7: 150, 14: 400, 30: 1000, 60: 3000 }[newStreak];
        await awardXP(supabase, userId, xpReward, 'streak_milestone', { streak: newStreak });
      }
    }

    return {
      success: true,
      streak_increased: streakIncreased,
      current_streak: newStreak,
      best_streak: newBestStreak,
    };
  } catch (error) {
    console.error('❌ Error updating daily streak:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update win streak
 * Called after each trade result
 */
export async function updateWinStreak(supabase, userId, isWin) {
  try {
    const progressResult = await getUserProgress(supabase, userId);
    if (!progressResult.success) throw new Error(progressResult.error);

    const progress = progressResult.data;

    let newWinStreak = 0;
    let streakBonus = 0;

    if (isWin) {
      newWinStreak = progress.current_win_streak + 1;

      // Check for win streak XP bonuses
      if (newWinStreak === 3) {
        streakBonus = XP_REWARDS.trade_streak_3;
      } else if (newWinStreak === 5) {
        streakBonus = XP_REWARDS.trade_streak_5;
      } else if (newWinStreak === 10) {
        streakBonus = XP_REWARDS.trade_streak_10;
      }
    }

    // Update best win streak
    const newBestWinStreak = Math.max(progress.best_win_streak, newWinStreak);

    // Update database
    await supabase
      .from('user_gamification')
      .update({
        current_win_streak: newWinStreak,
        best_win_streak: newBestWinStreak,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    // Award streak bonus XP
    if (streakBonus > 0) {
      await awardXP(supabase, userId, streakBonus, 'win_streak', {
        streak: newWinStreak,
      });
    }

    return {
      success: true,
      current_win_streak: newWinStreak,
      best_win_streak: newBestWinStreak,
      streak_bonus_xp: streakBonus,
    };
  } catch (error) {
    console.error('❌ Error updating win streak:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Process trade completion (main entry point for bot)
 * Awards XP, updates streaks, checks badges
 */
export async function processTradeCompletion(supabase, userId, tradeData) {
  try {
    const { isDemo, isWin, tradeId } = tradeData;

    // Get user progress
    const progressResult = await getUserProgress(supabase, userId);
    if (!progressResult.success) throw new Error(progressResult.error);

    const progress = progressResult.data;

    // Calculate base XP
    let baseXP = isDemo ? XP_REWARDS.trade_demo : XP_REWARDS.trade_real;

    // Add win bonus (Real only)
    if (isWin && !isDemo) {
      baseXP += XP_REWARDS.trade_win;
    }

    // Add streak bonus (based on daily streak)
    const streakBonusXP = getStreakBonusXP(progress.current_streak);
    baseXP += streakBonusXP;

    // Award XP
    const xpResult = await awardXP(supabase, userId, baseXP, isDemo ? 'trade_demo' : 'trade_real', {
      trade_id: tradeId,
      is_win: isWin,
      streak_bonus: streakBonusXP,
    });

    // Update trade counts
    await supabase
      .from('user_gamification')
      .update({
        total_trades: progress.total_trades + 1,
        total_trades_demo: isDemo ? progress.total_trades_demo + 1 : progress.total_trades_demo,
        total_trades_real: !isDemo ? progress.total_trades_real + 1 : progress.total_trades_real,
        total_wins: isWin ? progress.total_wins + 1 : progress.total_wins,
        total_wins_real: isWin && !isDemo ? progress.total_wins_real + 1 : progress.total_wins_real,
      })
      .eq('user_id', userId);

    // Update daily streak (at least 1 trade today)
    const streakResult = await updateDailyStreak(supabase, userId);

    // Update win streak
    const winStreakResult = await updateWinStreak(supabase, userId, isWin);

    // Check Demo Limits
    if (isDemo) {
      await incrementDemoTradeCount(supabase, userId);
    }

    return {
      success: true,
      xp_awarded: baseXP,
      leveled_up: xpResult.data?.leveled_up || false,
      new_level: xpResult.data?.new_level,
      badges_unlocked: xpResult.data?.badges_unlocked || [],
      daily_streak: streakResult.current_streak,
      win_streak: winStreakResult.current_win_streak,
    };
  } catch (error) {
    console.error('❌ Error processing trade completion:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check Demo Limits
 * Returns { allowed: boolean, remaining: number, limit: number }
 */
export async function checkDemoLimit(supabase, userId) {
  try {
    const progressResult = await getUserProgress(supabase, userId);
    if (!progressResult.success) throw new Error(progressResult.error);

    const progress = progressResult.data;

    // Check if in exploration phase (first 7 days)
    const demoStarted = new Date(progress.demo_started_at);
    const now = new Date();
    const daysSinceStart = Math.floor((now - demoStarted) / (1000 * 60 * 60 * 24));

    if (daysSinceStart < DEMO_LIMITS.exploration_days) {
      // Unlimited during exploration
      return {
        allowed: true,
        remaining: Infinity,
        limit: Infinity,
        phase: 'exploration',
        days_remaining: DEMO_LIMITS.exploration_days - daysSinceStart,
      };
    }

    // Calculate daily limit based on deposits
    const baseLimit = DEMO_LIMITS.base_daily_limit;
    const bonusTrades = Math.floor(progress.total_deposits_last_30_days / 100) * DEMO_LIMITS.bonus_per_100;
    let dailyLimit = baseLimit + bonusTrades;

    // Unlimited if deposited R$1000+
    if (progress.total_deposits_last_30_days >= DEMO_LIMITS.unlimited_threshold) {
      return {
        allowed: true,
        remaining: Infinity,
        limit: Infinity,
        phase: 'unlimited',
      };
    }

    // Check if reset needed (new day)
    const lastTrade = progress.demo_last_trade ? new Date(progress.demo_last_trade) : null;
    const today = new Date().toISOString().split('T')[0];
    const lastTradeDate = lastTrade ? lastTrade.toISOString().split('T')[0] : null;

    let tradesUsedToday = progress.demo_trades_today;

    if (lastTradeDate !== today) {
      // New day - reset counter
      tradesUsedToday = 0;
      await supabase
        .from('user_gamification')
        .update({ demo_trades_today: 0 })
        .eq('user_id', userId);
    }

    const remaining = dailyLimit - tradesUsedToday;
    const allowed = remaining > 0;

    return {
      allowed,
      remaining: Math.max(0, remaining),
      limit: dailyLimit,
      phase: 'standard',
      trades_used_today: tradesUsedToday,
    };
  } catch (error) {
    console.error('❌ Error checking demo limit:', error);
    return { allowed: true, remaining: 0, limit: 0, error: error.message };
  }
}

/**
 * Increment demo trade count
 */
async function incrementDemoTradeCount(supabase, userId) {
  try {
    const progressResult = await getUserProgress(supabase, userId);
    if (!progressResult.success) return;

    const progress = progressResult.data;

    await supabase
      .from('user_gamification')
      .update({
        demo_trades_today: progress.demo_trades_today + 1,
        demo_last_trade: new Date().toISOString(),
      })
      .eq('user_id', userId);
  } catch (error) {
    console.error('❌ Error incrementing demo trade count:', error);
  }
}

/**
 * Process deposit
 * Updates deposits, grants streak freezes, unlocks scanner tiers
 */
export async function processDeposit(supabase, userId, amount, brokerTransactionId = null) {
  try {
    const progressResult = await getUserProgress(supabase, userId);
    if (!progressResult.success) throw new Error(progressResult.error);

    const progress = progressResult.data;

    // Calculate benefits
    const streakFreezesGranted = Math.floor(amount / 100) * STREAK_FREEZE.freezes_per_100;
    const demoTradesGranted = Math.floor(amount / 100) * DEMO_LIMITS.bonus_per_100;

    // Determine scanner tier unlock
    let scannerTierUnlocked = null;
    for (const [tier, tierInfo] of Object.entries(SCANNER_TIERS).reverse()) {
      if (amount >= tierInfo.deposit_required && progress.scanner_tier < parseInt(tier)) {
        scannerTierUnlocked = parseInt(tier);
        break;
      }
    }

    // Update user_gamification
    const newFreezesAvailable = Math.min(
      progress.streak_freezes_available + streakFreezesGranted,
      STREAK_FREEZE.max_freezes
    );

    const newTotalDeposits = progress.total_deposits_last_30_days + amount;

    const updateData = {
      total_deposits_last_30_days: newTotalDeposits,
      last_deposit_date: new Date().toISOString(),
      streak_freezes_available: newFreezesAvailable,
    };

    if (scannerTierUnlocked) {
      updateData.scanner_tier = scannerTierUnlocked;
    }

    await supabase
      .from('user_gamification')
      .update(updateData)
      .eq('user_id', userId);

    // Log deposit
    await supabase.from('deposit_tracking').insert({
      user_id: userId,
      amount,
      broker_transaction_id: brokerTransactionId,
      streak_freezes_granted: streakFreezesGranted,
      demo_trades_granted: demoTradesGranted,
      scanner_tier_unlocked: scannerTierUnlocked,
    });

    // Award XP for deposit milestones
    const isFirstDeposit = progress.total_deposits_last_30_days === 0;
    let xpAwarded = 0;

    if (isFirstDeposit) {
      await awardXP(supabase, userId, XP_REWARDS.first_deposit, 'first_deposit', { amount });
      xpAwarded += XP_REWARDS.first_deposit;
    }

    if (amount >= 1000) {
      await awardXP(supabase, userId, XP_REWARDS.deposit_1000, 'deposit_1000', { amount });
      xpAwarded += XP_REWARDS.deposit_1000;
    } else if (amount >= 500) {
      await awardXP(supabase, userId, XP_REWARDS.deposit_500, 'deposit_500', { amount });
      xpAwarded += XP_REWARDS.deposit_500;
    } else if (amount >= 100) {
      await awardXP(supabase, userId, XP_REWARDS.deposit_100, 'deposit_100', { amount });
      xpAwarded += XP_REWARDS.deposit_100;
    }

    // Award scanner tier unlock XP bonus
    if (scannerTierUnlocked && SCANNER_TIERS[scannerTierUnlocked].xp_bonus) {
      await awardXP(
        supabase,
        userId,
        SCANNER_TIERS[scannerTierUnlocked].xp_bonus,
        'scanner_tier_unlock',
        { tier: scannerTierUnlocked }
      );
      xpAwarded += SCANNER_TIERS[scannerTierUnlocked].xp_bonus;
    }

    // Create deposit notification
    let depositMessage = `Deposit received: R$ ${amount.toFixed(2)}`;
    if (streakFreezesGranted > 0) {
      depositMessage += ` • +${streakFreezesGranted} Freezes`;
    }
    if (scannerTierUnlocked) {
      depositMessage += ` • Scanner Tier ${scannerTierUnlocked} Unlocked`;
    }

    await createNotification(supabase, userId, 'deposit_received', {
      title: isFirstDeposit ? '🎁 First Deposit!' : '💰 Deposit Received',
      message: depositMessage,
      icon: '💰',
      metadata: {
        amount,
        streak_freezes: streakFreezesGranted,
        scanner_tier: scannerTierUnlocked,
        is_first: isFirstDeposit,
      },
    });

    return {
      success: true,
      data: {
        amount,
        streak_freezes_granted: streakFreezesGranted,
        demo_trades_granted: demoTradesGranted,
        scanner_tier_unlocked: scannerTierUnlocked,
        xp_awarded: xpAwarded,
        is_first_deposit: isFirstDeposit,
      },
    };
  } catch (error) {
    console.error('❌ Error processing deposit:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get user's badges
 */
export async function getUserBadges(supabase, userId) {
  try {
    const { data, error } = await supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('❌ Error getting user badges:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get XP transaction history
 */
export async function getXPHistory(supabase, userId, limit = 50) {
  try {
    const { data, error } = await supabase
      .from('xp_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('❌ Error getting XP history:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create notification for user
 */
export async function createNotification(supabase, userId, eventType, { title, message, icon = null, metadata = {} }) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        event_type: eventType,
        title,
        message,
        icon,
        metadata,
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`📬 Notification created for ${userId}:`, title);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    return { success: false, error: error.message };
  }
}
