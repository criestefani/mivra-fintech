// ============================================================
// NOTIFICATION SERVICE
// ============================================================
// Handles all notifications: push, email, in-app
// Integration with gamification events
// ============================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// WebSocket instance (will be set by api-server.mjs)
let ioInstance = null;

/**
 * Register Socket.io instance for real-time notifications
 */
export function setSocketIO(io) {
  ioInstance = io;
  console.log('✅ Socket.io registered for notification broadcasting');
}

/**
 * Send gamification notification
 */
export async function notifyGamification(userId, eventType, data) {
  try {
    const notification = {
      user_id: userId,
      event_type: eventType,
      data,
      read: false,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('notifications')
      .insert([notification]);

    if (error) throw error;

    // Broadcast via WebSocket if available
    broadcastNotification(userId, eventType, data);

    console.log(`📬 Notification sent to ${userId}: ${eventType}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Notify on badge unlock
 */
export async function notifyBadgeUnlock(userId, badgeName, icon, xpReward) {
  return notifyGamification(userId, 'badge_unlock', {
    badge_name: badgeName,
    badge_icon: icon,
    xp_reward: xpReward,
    message: `🎉 You unlocked "${badgeName}" and earned ${xpReward} XP!`,
  });
}

/**
 * Notify on level up
 */
export async function notifyLevelUp(userId, newLevel, levelTitle) {
  return notifyGamification(userId, 'level_up', {
    new_level: newLevel,
    level_title: levelTitle,
    message: `🚀 Congratulations! You reached Level ${newLevel}: ${levelTitle}`,
  });
}

/**
 * Notify on XP gain
 */
export async function notifyXPGain(userId, amount, source) {
  return notifyGamification(userId, 'xp_gain', {
    xp_amount: amount,
    source,
    message: `✨ +${amount} XP from ${source}`,
  });
}

/**
 * Notify streak expiring soon (6 hours before)
 */
export async function notifyStreakExpiring(userId, streakDays) {
  return notifyGamification(userId, 'streak_warning', {
    streak_days: streakDays,
    message: `⚠️ Your ${streakDays}-day streak expires in 6 hours! Trade now to keep it.`,
    priority: 'high',
  });
}

/**
 * Notify streak broken
 */
export async function notifyStreakBroken(userId, streakDays) {
  return notifyGamification(userId, 'streak_broken', {
    streak_days: streakDays,
    message: `😢 Your ${streakDays}-day streak was broken. Start a new one!`,
  });
}

/**
 * Notify quest progress
 */
export async function notifyQuestProgress(userId, questName, progress, target) {
  if (progress === target) {
    return notifyGamification(userId, 'quest_completed', {
      quest_name: questName,
      message: `🎯 Quest completed: "${questName}"! Claim your reward!`,
      priority: 'high',
    });
  }

  // Only notify on milestones (50%, 75%, 100%)
  const percentage = (progress / target) * 100;
  if (percentage % 25 === 0 && percentage < 100) {
    return notifyGamification(userId, 'quest_progress', {
      quest_name: questName,
      progress,
      target,
      message: `📈 "${questName}" progress: ${progress}/${target}`,
    });
  }

  return { success: true };
}

/**
 * Notify new leaderboard rank
 */
export async function notifyLeaderboardRank(userId, rank, category, period) {
  if (rank <= 10) {
    return notifyGamification(userId, 'leaderboard_achievement', {
      rank,
      category,
      period,
      message: `🏆 You're #${rank} in ${period} ${category} leaderboard!`,
      priority: 'high',
    });
  }

  return { success: true };
}

/**
 * Notify on first deposit
 */
export async function notifyFirstDeposit(userId, amount) {
  return notifyGamification(userId, 'first_deposit', {
    amount,
    message: `💰 Your deposit of R$ ${amount.toFixed(2)} unlocked Scanner Tier 2 and Streak Freezes!`,
    priority: 'high',
  });
}

/**
 * Check and notify expiring streaks (cron job)
 */
export async function checkAndNotifyExpiringStreaks() {
  try {
    console.log('🔔 Checking for expiring streaks...');

    const now = new Date();
    const notifyAfter = new Date(now.getTime() - 6 * 60 * 60 * 1000); // 6 hours ago
    const notifyBefore = new Date(now.getTime() - 5 * 60 * 60 * 1000); // 5 hours ago

    // Get users with streaks ending in next 6 hours
    const { data: users, error } = await supabase
      .from('user_gamification')
      .select('user_id, current_streak, last_trade_date')
      .gt('current_streak', 0)
      .limit(1000);

    if (error) throw error;

    let notified = 0;

    for (const user of users) {
      if (user.last_trade_date) {
        const lastTrade = new Date(user.last_trade_date);
        const expiresAt = new Date(lastTrade.getTime() + 24 * 60 * 60 * 1000);

        // Check if expiring in ~6 hours
        if (expiresAt >= notifyAfter && expiresAt <= notifyBefore) {
          await notifyStreakExpiring(user.user_id, user.current_streak);
          notified++;
        }
      }
    }

    console.log(`✅ Checked streaks, notified ${notified} users`);
    return { success: true, notified };
  } catch (error) {
    console.error('❌ Error checking expiring streaks:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Broadcast notification via WebSocket
 */
function broadcastNotification(userId, eventType, data) {
  console.log(`📡 Broadcasting to user ${userId}: ${eventType}`);

  if (ioInstance) {
    // Send to user's notification room
    ioInstance.to(`notifications:${userId}`).emit('new-notification', {
      event_type: eventType,
      data,
      timestamp: new Date().toISOString(),
    });
  } else {
    console.warn(`⚠️ Socket.io not initialized, notification not broadcast for user ${userId}`);
  }
}

// Export all functions
export default {
  setSocketIO,
  notifyGamification,
  notifyBadgeUnlock,
  notifyLevelUp,
  notifyXPGain,
  notifyStreakExpiring,
  notifyStreakBroken,
  notifyQuestProgress,
  notifyLeaderboardRank,
  notifyFirstDeposit,
  checkAndNotifyExpiringStreaks,
};
