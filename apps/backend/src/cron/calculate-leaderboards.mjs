// ============================================================
// LEADERBOARD CALCULATION - CRON JOB
// ============================================================
// Runs daily at 00:00 UTC to calculate rankings
// Handles: daily, weekly, monthly, all_time rankings
// Categories: volume, profit, win_rate, xp, streak
// ============================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Calculate leaderboards for all periods and categories
 */
export async function calculateLeaderboards() {
  try {
    console.log('🏆 Starting leaderboard calculation...');

    const now = new Date();

    // Calculate different periods
    const periods = calculatePeriodDates(now);

    // Categories to calculate
    const categories = ['volume', 'profit', 'win_rate', 'xp', 'streak'];

    for (const [period, { start, end }] of Object.entries(periods)) {
      for (const category of categories) {
        await calculateLeaderboardCategory(period, category, start, end);
      }
    }

    console.log('✅ Leaderboard calculation completed!');
    return { success: true };
  } catch (error) {
    console.error('❌ Error calculating leaderboards:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Calculate period dates for different leaderboard types
 */
function calculatePeriodDates(now) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Daily (today)
  const dailyStart = today;
  const dailyEnd = tomorrow;

  // Weekly (Sunday to Saturday)
  const dayOfWeek = now.getDay();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - dayOfWeek);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  // Monthly (1st to last day)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  // All-time
  const allTimeStart = new Date(0);
  const allTimeEnd = new Date(2099, 11, 31);

  return {
    daily: { start: dailyStart, end: dailyEnd },
    weekly: { start: weekStart, end: weekEnd },
    monthly: { start: monthStart, end: monthEnd },
    all_time: { start: allTimeStart, end: allTimeEnd },
  };
}

/**
 * Calculate specific leaderboard category
 */
async function calculateLeaderboardCategory(period, category, periodStart, periodEnd) {
  try {
    console.log(`📊 Calculating ${period} - ${category}...`);

    let query = supabase.from('user_gamification').select('*');

    let ranking = [];

    switch (category) {
      case 'volume':
        // Total trades in period
        ranking = await calculateVolumeRanking(periodStart, periodEnd);
        break;

      case 'profit':
        // Total profit/loss in period
        ranking = await calculateProfitRanking(periodStart, periodEnd);
        break;

      case 'win_rate':
        // Win rate % (min 20 trades)
        ranking = await calculateWinRateRanking(periodStart, periodEnd);
        break;

      case 'xp':
        // Total XP
        ranking = await calculateXPRanking();
        break;

      case 'streak':
        // Current streak
        ranking = await calculateStreakRanking();
        break;
    }

    // Insert or update leaderboard entries
    if (ranking.length > 0) {
      await insertLeaderboardEntries(period, category, ranking, periodStart, periodEnd);
    }

    console.log(`✅ ${period} - ${category}: ${ranking.length} entries calculated`);
  } catch (error) {
    console.error(`❌ Error calculating ${period} - ${category}:`, error);
  }
}

/**
 * Volume ranking (total trades)
 */
async function calculateVolumeRanking(periodStart, periodEnd) {
  try {
    const { data, error } = await supabase
      .from('user_gamification')
      .select('user_id, total_trades_real, current_level')
      .order('total_trades_real', { ascending: false })
      .limit(100);

    if (error) throw error;

    return data.map((user, index) => ({
      user_id: user.user_id,
      rank: index + 1,
      value: user.total_trades_real,
      level: user.current_level,
    }));
  } catch (error) {
    console.error('❌ Error calculating volume ranking:', error);
    return [];
  }
}

/**
 * Profit ranking (from trades table)
 */
async function calculateProfitRanking(periodStart, periodEnd) {
  try {
    const { data, error } = await supabase
      .from('trades')
      .select('user_id, pnl')
      .gte('completed_at', periodStart.toISOString())
      .lt('completed_at', periodEnd.toISOString());

    if (error) throw error;

    // Aggregate profit by user
    const profitByUser = {};
    data.forEach(trade => {
      if (!profitByUser[trade.user_id]) {
        profitByUser[trade.user_id] = 0;
      }
      profitByUser[trade.user_id] += trade.pnl || 0;
    });

    // Sort and rank
    const ranking = Object.entries(profitByUser)
      .map(([user_id, profit]) => ({ user_id, value: profit }))
      .sort((a, b) => b.value - a.value)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

    return ranking.slice(0, 100);
  } catch (error) {
    console.error('❌ Error calculating profit ranking:', error);
    return [];
  }
}

/**
 * Win rate ranking (min 20 trades)
 */
async function calculateWinRateRanking(periodStart, periodEnd) {
  try {
    const { data: stats, error } = await supabase
      .from('user_gamification_stats')
      .select('user_id, win_rate_real, total_trades_real, current_level')
      .gte('total_trades_real', 20)
      .order('win_rate_real', { ascending: false })
      .limit(100);

    if (error) throw error;

    return stats.map((user, index) => ({
      user_id: user.user_id,
      rank: index + 1,
      value: user.win_rate_real,
      level: user.current_level,
    }));
  } catch (error) {
    console.error('❌ Error calculating win rate ranking:', error);
    return [];
  }
}

/**
 * XP ranking (all-time)
 */
async function calculateXPRanking() {
  try {
    const { data, error } = await supabase
      .from('user_gamification')
      .select('user_id, total_xp, current_level')
      .order('total_xp', { ascending: false })
      .limit(100);

    if (error) throw error;

    return data.map((user, index) => ({
      user_id: user.user_id,
      rank: index + 1,
      value: user.total_xp,
      level: user.current_level,
    }));
  } catch (error) {
    console.error('❌ Error calculating XP ranking:', error);
    return [];
  }
}

/**
 * Streak ranking (current best streaks)
 */
async function calculateStreakRanking() {
  try {
    const { data, error } = await supabase
      .from('user_gamification')
      .select('user_id, best_streak, current_level')
      .gt('best_streak', 0)
      .order('best_streak', { ascending: false })
      .limit(100);

    if (error) throw error;

    return data.map((user, index) => ({
      user_id: user.user_id,
      rank: index + 1,
      value: user.best_streak,
      level: user.current_level,
    }));
  } catch (error) {
    console.error('❌ Error calculating streak ranking:', error);
    return [];
  }
}

/**
 * Insert leaderboard entries (upsert)
 */
async function insertLeaderboardEntries(period, category, ranking, periodStart, periodEnd) {
  try {
    const entries = ranking.map(item => ({
      user_id: item.user_id,
      period,
      category,
      rank: item.rank,
      value: item.value,
      level: item.level,
      period_start: periodStart.toISOString().split('T')[0],
      period_end: periodEnd.toISOString().split('T')[0],
      calculated_at: new Date().toISOString(),
    }));

    // Delete old entries for this period/category
    await supabase
      .from('leaderboards')
      .delete()
      .eq('period', period)
      .eq('category', category)
      .gte('period_start', periodStart.toISOString().split('T')[0])
      .lt('period_start', periodEnd.toISOString().split('T')[0]);

    // Insert new entries
    const { error } = await supabase
      .from('leaderboards')
      .insert(entries);

    if (error) throw error;
  } catch (error) {
    console.error('❌ Error inserting leaderboard entries:', error);
  }
}

// Export for cron scheduler
export default calculateLeaderboards;
