// ============================================================
// REFERRAL SYSTEM SERVICE
// ============================================================
// Handles referral code generation, validation, and FTD rewards
// IMPORTANT: XP is ONLY awarded on First Time Deposit (FTD), NOT on signup
// ============================================================

import { nanoid } from 'nanoid';
import { XP_REWARDS, BADGES } from './constants.mjs';
import { awardXP } from './gamification-service.mjs';

/**
 * Custom Nanoid alphabet for referral codes
 * Excludes confusing characters: 0/O (zero/letter), 1/l/I (one/letter-l/letter-i)
 * URL-safe and easy to read
 */
const REFERRAL_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Generate a unique 8-character referral code
 * Uses Nanoid with custom alphabet for readability
 */
export function generateReferralCode() {
  return nanoid(8, REFERRAL_CODE_ALPHABET);
}

/**
 * Validate if referral code format is valid
 * (Note: actual code existence checked in registerReferral)
 */
export function isValidReferralCodeFormat(code) {
  if (!code || typeof code !== 'string') return false;
  return /^[A-Z23456789]{8}$/.test(code);
}

/**
 * Register or get referral code for a user
 * Creates if doesn't exist, returns existing if it does
 */
export async function ensureUserReferralCode(supabase, userId) {
  try {
    // Check if user already has a referral code
    const { data: existing, error: selectError } = await supabase
      .from('user_gamification')
      .select('referral_code')
      .eq('user_id', userId)
      .single();

    if (selectError && selectError.code !== 'PGRST116') throw selectError;

    if (existing?.referral_code) {
      return { success: true, code: existing.referral_code, isNew: false };
    }

    // Generate new code
    let referralCode;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      referralCode = generateReferralCode();

      // Check if code already exists
      const { data: existing } = await supabase
        .from('user_gamification')
        .select('id')
        .eq('referral_code', referralCode)
        .limit(1);

      isUnique = !existing || existing.length === 0;
      attempts++;
    }

    if (!isUnique) {
      throw new Error('Failed to generate unique referral code after 10 attempts');
    }

    // Store referral code in user_gamification
    const { data: updated, error: updateError } = await supabase
      .from('user_gamification')
      .update({ referral_code: referralCode })
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) throw updateError;

    console.log(`✅ Generated referral code for ${userId}: ${referralCode}`);
    return { success: true, code: referralCode, isNew: true };
  } catch (error) {
    console.error('❌ Error ensuring user referral code:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Validate a referral code exists
 */
export async function validateReferralCode(supabase, code) {
  try {
    if (!isValidReferralCodeFormat(code)) {
      return { success: false, error: 'Invalid referral code format' };
    }

    const { data, error } = await supabase
      .from('user_gamification')
      .select('user_id')
      .eq('referral_code', code)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: 'Referral code not found' };
      }
      throw error;
    }

    return { success: true, referrer_user_id: data.user_id };
  } catch (error) {
    console.error('❌ Error validating referral code:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Register a referral when a new user signs up with a code
 * STATUS: pending → registered (no XP awarded here)
 * XP will be awarded ONLY on first deposit
 */
export async function registerReferral(supabase, referralCode, refereeUserId, refereeEmail = null) {
  try {
    // Validate referral code
    const validationResult = await validateReferralCode(supabase, referralCode);
    if (!validationResult.success) {
      return { success: false, error: validationResult.error };
    }

    const referrerUserId = validationResult.referrer_user_id;

    // Check if referral already exists for this referee
    const { data: existing } = await supabase
      .from('referrals')
      .select('id')
      .eq('referee_user_id', refereeUserId)
      .limit(1);

    if (existing && existing.length > 0) {
      return { success: false, error: 'User already has a referral' };
    }

    // Create referral record (status: registered, no XP awarded)
    const { data: newReferral, error } = await supabase
      .from('referrals')
      .insert({
        referrer_user_id: referrerUserId,
        referee_user_id: refereeUserId,
        referee_email: refereeEmail,
        status: 'registered',
        signup_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Store referred_by_code in user_gamification for easy lookup
    await supabase
      .from('user_gamification')
      .update({ referred_by_code: referralCode })
      .eq('user_id', refereeUserId);

    console.log(`✅ Registered referral: ${referrerUserId} → ${refereeUserId} (status: registered, no XP yet)`);
    return { success: true, data: newReferral };
  } catch (error) {
    console.error('❌ Error registering referral:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Process first deposit and award referral XP
 * STATUS: registered → deposited (500 XP awarded HERE ONLY)
 * Called from deposit webhook
 */
export async function processFirstDeposit(supabase, userId, depositAmount) {
  try {
    // Check if user has a referrer
    const { data: userGamification } = await supabase
      .from('user_gamification')
      .select('referred_by_code')
      .eq('user_id', userId)
      .single();

    if (!userGamification?.referred_by_code) {
      console.log(`ℹ️ User ${userId} has no referral code, skipping referral rewards`);
      return { success: true, referralProcessed: false };
    }

    // Find the referral record
    const { data: referralRecords } = await supabase
      .from('referrals')
      .select('*')
      .eq('referee_user_id', userId)
      .limit(1);

    if (!referralRecords || referralRecords.length === 0) {
      console.log(`ℹ️ No referral record found for ${userId}`);
      return { success: true, referralProcessed: false };
    }

    const referral = referralRecords[0];

    // Check if already processed
    if (referral.status === 'deposited' || referral.rewarded_at) {
      console.log(`ℹ️ Referral for ${userId} already processed`);
      return { success: true, referralProcessed: false };
    }

    // Update referral status to deposited
    const { error: updateError } = await supabase
      .from('referrals')
      .update({
        status: 'deposited',
        first_deposit_date: new Date().toISOString(),
        first_deposit_amount: depositAmount,
        rewarded_at: new Date().toISOString(),
      })
      .eq('id', referral.id);

    if (updateError) throw updateError;

    // Award XP to referrer (only on FTD)
    const xpAmount = XP_REWARDS.referral_deposit; // 500 XP
    const awardResult = await awardXP(
      supabase,
      referral.referrer_user_id,
      xpAmount,
      'referral_deposit',
      {
        referee_user_id: userId,
        deposit_amount: depositAmount,
        referral_id: referral.id,
      }
    );

    if (!awardResult.success) {
      throw new Error(`Failed to award referral XP: ${awardResult.error}`);
    }

    // Increment referral count
    const incrementResult = await incrementReferralCount(supabase, referral.referrer_user_id);

    // Check for referral badges
    const badgeResult = await checkReferralBadges(supabase, referral.referrer_user_id);

    console.log(`✅ First deposit processed for ${userId}, awarded ${xpAmount} XP to referrer ${referral.referrer_user_id}`);

    return {
      success: true,
      referralProcessed: true,
      xp_awarded: xpAmount,
      referrer_user_id: referral.referrer_user_id,
      badges_unlocked: badgeResult.badges_unlocked || [],
    };
  } catch (error) {
    console.error('❌ Error processing first deposit referral:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all referrals for a user (as referrer)
 */
export async function getUserReferrals(supabase, userId) {
  try {
    const { data, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Split by status
    const referrals = {
      pending: data.filter((r) => r.status === 'pending'),
      registered: data.filter((r) => r.status === 'registered'),
      deposited: data.filter((r) => r.status === 'deposited'),
      all: data,
    };

    return { success: true, referrals };
  } catch (error) {
    console.error('❌ Error getting user referrals:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Increment total_referrals_deposited count
 */
export async function incrementReferralCount(supabase, userId) {
  try {
    // Get current count
    const { data: current } = await supabase
      .from('user_gamification')
      .select('total_referrals_deposited')
      .eq('user_id', userId)
      .single();

    const newCount = (current?.total_referrals_deposited || 0) + 1;

    // Update count
    const { error } = await supabase
      .from('user_gamification')
      .update({ total_referrals_deposited: newCount })
      .eq('user_id', userId);

    if (error) throw error;

    console.log(`✅ Updated referral count for ${userId}: ${newCount}`);
    return { success: true, count: newCount };
  } catch (error) {
    console.error('❌ Error incrementing referral count:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check and unlock referral badges
 * - Evangelista: 3 referrals deposited
 * - Influencer: 10 referrals deposited
 */
export async function checkReferralBadges(supabase, userId) {
  try {
    const badgesUnlocked = [];

    // Get current referral count
    const { data: gamification } = await supabase
      .from('user_gamification')
      .select('total_referrals_deposited')
      .eq('user_id', userId)
      .single();

    const referralCount = gamification?.total_referrals_deposited || 0;

    // Get existing badges
    const { data: existingBadges } = await supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', userId);

    const existingBadgeIds = existingBadges ? existingBadges.map((b) => b.badge_id) : [];

    // Check Evangelista (3 referrals)
    if (referralCount >= 3 && !existingBadgeIds.includes('evangelista')) {
      const evangelistaBadge = BADGES.evangelista;

      const { data: newBadge, error } = await supabase
        .from('user_badges')
        .insert({
          user_id: userId,
          badge_id: 'evangelista',
          badge_name: evangelistaBadge.name,
          badge_icon: evangelistaBadge.icon,
          badge_category: evangelistaBadge.category,
          badge_rarity: evangelistaBadge.rarity,
          xp_reward: evangelistaBadge.xp_reward,
        })
        .select()
        .single();

      if (!error) {
        badgesUnlocked.push(newBadge);
        console.log(`✅ Unlocked Evangelista badge for ${userId}`);
      }
    }

    // Check Influencer (10 referrals)
    if (referralCount >= 10 && !existingBadgeIds.includes('influencer')) {
      const influencerBadge = BADGES.influencer;

      const { data: newBadge, error } = await supabase
        .from('user_badges')
        .insert({
          user_id: userId,
          badge_id: 'influencer',
          badge_name: influencerBadge.name,
          badge_icon: influencerBadge.icon,
          badge_category: influencerBadge.category,
          badge_rarity: influencerBadge.rarity,
          xp_reward: influencerBadge.xp_reward,
        })
        .select()
        .single();

      if (!error) {
        badgesUnlocked.push(newBadge);
        console.log(`✅ Unlocked Influencer badge for ${userId}`);
      }
    }

    return { success: true, badges_unlocked: badgesUnlocked, referral_count: referralCount };
  } catch (error) {
    console.error('❌ Error checking referral badges:', error);
    return { success: false, error: error.message };
  }
}
