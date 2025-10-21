// ============================================================
// DEPOSIT INTEGRATION
// ============================================================
// Handles deposit webhook from broker
// Updates demo limits, streaks freezes, scanner tier
// Awards XP for first deposit
// ============================================================

import { createClient } from '@supabase/supabase-js';
import { notifyFirstDeposit, notifyLevelUp } from '../notifications/notification-service.mjs';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Process deposit and update gamification benefits
 * Called when broker reports successful deposit
 */
export async function processDepositWebhook(userId, amount, brokerTransactionId) {
  try {
    console.log(`💰 Processing deposit for ${userId}: R$ ${amount}`);

    // Get current user gamification state
    const { data: userGamif, error: fetchError } = await supabase
      .from('user_gamification')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError) throw fetchError;

    const isFirstDeposit = !userGamif.total_deposits_last_30_days || userGamif.total_deposits_last_30_days === 0;

    // Calculate benefits from deposit
    const benefits = calculateDepositBenefits(amount, isFirstDeposit);

    // Update user_gamification
    const updates = {
      total_deposits_last_30_days: (userGamif.total_deposits_last_30_days || 0) + amount,
      last_deposit_date: new Date().toISOString(),
      streak_freezes_available: Math.min(
        (userGamif.streak_freezes_available || 0) + benefits.freezes,
        7 // Max 7 freezes
      ),
    };

    // Unlock scanner tiers based on total deposits
    if (userGamif.total_deposits_last_30_days + amount >= 500) {
      updates.scanner_tier = 3;
    } else if (userGamif.total_deposits_last_30_days + amount >= 100) {
      updates.scanner_tier = 2;
    }

    const { error: updateError } = await supabase
      .from('user_gamification')
      .update(updates)
      .eq('user_id', userId);

    if (updateError) throw updateError;

    // Record deposit
    const { error: depositError } = await supabase
      .from('deposit_tracking')
      .insert({
        user_id: userId,
        amount,
        broker_transaction_id: brokerTransactionId,
        streak_freezes_granted: benefits.freezes,
        scanner_tier_unlocked: updates.scanner_tier,
      });

    if (depositError) throw depositError;

    // Award XP
    const xpAwarded = await awardDepositXP(userId, amount, isFirstDeposit);

    // Send notifications
    if (isFirstDeposit) {
      await notifyFirstDeposit(userId, amount);
    }

    console.log(`✅ Deposit processed for ${userId}`);
    console.log(`   💎 Freezes: +${benefits.freezes}`);
    console.log(`   🔍 Scanner Tier: ${updates.scanner_tier}`);
    console.log(`   ✨ XP awarded: ${xpAwarded}`);

    return {
      success: true,
      benefits: {
        freezes: benefits.freezes,
        scannerTier: updates.scanner_tier,
        xpAwarded,
      },
    };
  } catch (error) {
    console.error('❌ Error processing deposit webhook:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Calculate benefits from deposit amount
 */
function calculateDepositBenefits(amount, isFirstDeposit) {
  let freezes = 0;

  // R$100 = 2 freezes
  freezes = Math.floor(amount / 100) * 2;

  return {
    freezes: Math.max(freezes, isFirstDeposit ? 2 : 0), // Min 2 for first deposit
  };
}

/**
 * Award XP for deposits
 */
async function awardDepositXP(userId, amount, isFirstDeposit) {
  try {
    let xpAmount = 0;

    // First deposit bonus
    if (isFirstDeposit) {
      xpAmount += 500;
    }

    // Tier-based XP
    if (amount >= 1000) {
      xpAmount += 2500; // Whale
    } else if (amount >= 500) {
      xpAmount += 1000; // Serious Trader
    } else if (amount >= 200) {
      xpAmount += 200; // Regular
    }

    // Get current user level
    const { data: user, error: getUserError } = await supabase
      .from('user_gamification')
      .select('total_xp, current_level')
      .eq('user_id', userId)
      .single();

    if (getUserError) throw getUserError;

    // Award XP (will trigger level-up if needed)
    const response = await awardXPWithLevelUp(userId, xpAmount, 'deposit');

    return xpAmount;
  } catch (error) {
    console.error('❌ Error awarding deposit XP:', error);
    return 0;
  }
}

/**
 * Award XP and check for level up
 */
async function awardXPWithLevelUp(userId, xpAmount, source) {
  try {
    // Record XP transaction
    const { error: transError } = await supabase
      .from('xp_transactions')
      .insert({
        user_id: userId,
        amount: xpAmount,
        source,
        metadata: { timestamp: new Date().toISOString() },
      });

    if (transError) throw transError;

    // Get current progress
    const { data: user, error: getUserError } = await supabase
      .from('user_gamification')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (getUserError) throw getUserError;

    // Calculate new XP
    const newTotalXP = user.total_xp + xpAmount;
    let newXPCurrentLevel = user.xp_current_level + xpAmount;
    let newLevel = user.current_level;
    let leveledUp = false;

    // Check for level ups
    while (newXPCurrentLevel >= user.xp_next_level) {
      newXPCurrentLevel -= user.xp_next_level;
      newLevel += 1;
      leveledUp = true;
    }

    // Get level info for title
    const levelTitles = {
      1: 'Novato',
      2: 'Aprendiz',
      3: 'Trader Júnior',
      5: 'Trader Pleno',
      10: 'Trader Senior',
      15: 'Trader Expert',
      20: 'Trader Elite',
      30: 'Lenda',
    };

    const levelTitle = levelTitles[newLevel] || `Level ${newLevel}`;

    // Calculate XP for next level
    const nextLevelXP = Math.floor(100 * Math.pow(1.5, newLevel - 1));

    // Update user
    const { error: updateError } = await supabase
      .from('user_gamification')
      .update({
        total_xp: newTotalXP,
        current_level: newLevel,
        xp_current_level: newXPCurrentLevel,
        xp_next_level: nextLevelXP,
        level_title: levelTitle,
      })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    // Notify if leveled up
    if (leveledUp) {
      await notifyLevelUp(userId, newLevel, levelTitle);
    }

    return { success: true, leveledUp, newLevel };
  } catch (error) {
    console.error('❌ Error awarding XP with level up:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Use streak freeze
 */
export async function useStreakFreeze(userId) {
  try {
    const { data: user, error: getUserError } = await supabase
      .from('user_gamification')
      .select('streak_freezes_available')
      .eq('user_id', userId)
      .single();

    if (getUserError) throw getUserError;

    if (!user || user.streak_freezes_available <= 0) {
      return { success: false, error: 'No freezes available' };
    }

    // Use one freeze
    const { error: updateError } = await supabase
      .from('user_gamification')
      .update({
        streak_freezes_available: user.streak_freezes_available - 1,
      })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    console.log(`❄️ Streak freeze used for ${userId}`);
    return { success: true, remainingFreezes: user.streak_freezes_available - 1 };
  } catch (error) {
    console.error('❌ Error using streak freeze:', error);
    return { success: false, error: error.message };
  }
}

export default {
  processDepositWebhook,
  useStreakFreeze,
};
