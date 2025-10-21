// ============================================================
// GAMIFICATION API ROUTES
// ============================================================
// Express routes for gamification endpoints
// ============================================================

import express from 'express';
import {
  getUserProgress,
  awardXP,
  processTradeCompletion,
  processDeposit,
  getUserBadges,
  getXPHistory,
  checkDemoLimit,
  updateDailyStreak,
} from './gamification-service.mjs';

const router = express.Router();

/**
 * GET /api/gamification/progress/:userId
 * Get user's gamification progress (XP, level, streaks, etc.)
 */
router.get('/progress/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await getUserProgress(req.db, userId);

    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('❌ Error in /progress:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/gamification/award-xp
 * Award XP to user
 * Body: { userId, amount, source, metadata? }
 */
router.post('/award-xp', async (req, res) => {
  try {
    const { userId, amount, source, metadata = {} } = req.body;

    if (!userId || !amount || !source) {
      return res.status(400).json({ error: 'Missing required fields: userId, amount, source' });
    }

    const result = await awardXP(req.db, userId, amount, source, metadata);

    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('❌ Error in /award-xp:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/gamification/trade-completed
 * Process trade completion (main entry point for bot)
 * Body: { userId, tradeId, isDemo, isWin }
 */
router.post('/trade-completed', async (req, res) => {
  try {
    const { userId, tradeId, isDemo, isWin } = req.body;

    if (userId === undefined || tradeId === undefined || isDemo === undefined || isWin === undefined) {
      return res.status(400).json({ error: 'Missing required fields: userId, tradeId, isDemo, isWin' });
    }

    const result = await processTradeCompletion(req.db, userId, {
      tradeId,
      isDemo,
      isWin,
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('❌ Error in /trade-completed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/gamification/deposit
 * Process deposit (grants freezes, unlocks tiers, awards XP)
 * Body: { userId, amount, brokerTransactionId? }
 */
router.post('/deposit', async (req, res) => {
  try {
    const { userId, amount, brokerTransactionId } = req.body;

    if (!userId || !amount) {
      return res.status(400).json({ error: 'Missing required fields: userId, amount' });
    }

    const result = await processDeposit(req.db, userId, amount, brokerTransactionId);

    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('❌ Error in /deposit:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/gamification/badges/:userId
 * Get user's earned badges
 */
router.get('/badges/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await getUserBadges(req.db, userId);

    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('❌ Error in /badges:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/gamification/xp-history/:userId
 * Get user's XP transaction history
 * Query params: ?limit=50
 */
router.get('/xp-history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    const result = await getXPHistory(req.db, userId, limit);

    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('❌ Error in /xp-history:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/gamification/demo-limit/:userId
 * Check demo trade limit for user
 */
router.get('/demo-limit/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await checkDemoLimit(req.db, userId);

    res.json(result);
  } catch (error) {
    console.error('❌ Error in /demo-limit:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/gamification/update-streak
 * Manually update daily streak (called after first trade of the day)
 * Body: { userId }
 */
router.post('/update-streak', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Missing required field: userId' });
    }

    const result = await updateDailyStreak(req.db, userId);

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('❌ Error in /update-streak:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/gamification/leaderboards/:period
 * Get leaderboards
 * Params: period = 'daily' | 'weekly' | 'monthly' | 'all_time'
 * Query: ?category=volume|profit|win_rate|xp|streak&limit=100
 */
router.get('/leaderboards/:period', async (req, res) => {
  try {
    const { period } = req.params;
    const category = req.query.category || 'xp';
    const limit = parseInt(req.query.limit) || 100;

    // Validate period
    if (!['daily', 'weekly', 'monthly', 'all_time'].includes(period)) {
      return res.status(400).json({ error: 'Invalid period. Must be: daily, weekly, monthly, all_time' });
    }

    // Calculate period dates
    const now = new Date();
    let periodStart, periodEnd;

    switch (period) {
      case 'daily':
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodEnd = new Date(periodStart);
        periodEnd.setDate(periodEnd.getDate() + 1);
        break;
      case 'weekly':
        const dayOfWeek = now.getDay();
        periodStart = new Date(now);
        periodStart.setDate(now.getDate() - dayOfWeek);
        periodStart.setHours(0, 0, 0, 0);
        periodEnd = new Date(periodStart);
        periodEnd.setDate(periodEnd.getDate() + 7);
        break;
      case 'monthly':
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      case 'all_time':
        periodStart = new Date(0); // Unix epoch
        periodEnd = new Date(2099, 11, 31);
        break;
    }

    // Query leaderboard
    const { data, error } = await req.db
      .from('leaderboards')
      .select('*')
      .eq('period', period)
      .eq('category', category)
      .gte('period_start', periodStart.toISOString().split('T')[0])
      .lte('period_end', periodEnd.toISOString().split('T')[0])
      .order('rank', { ascending: true })
      .limit(limit);

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('❌ Error in /leaderboards:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/gamification/quests/:userId
 * Get user's active quests
 */
router.get('/quests/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get active quests for user
    const { data: userQuests, error: userQuestsError } = await req.db
      .from('user_quests')
      .select('*, quests(*)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString());

    if (userQuestsError) throw userQuestsError;

    res.json(userQuests);
  } catch (error) {
    console.error('❌ Error in /quests:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/gamification/claim-quest
 * Claim completed quest reward
 * Body: { userId, questId }
 */
router.post('/claim-quest', async (req, res) => {
  try {
    const { userId, questId } = req.body;

    if (!userId || !questId) {
      return res.status(400).json({ error: 'Missing required fields: userId, questId' });
    }

    // Get quest
    const { data: userQuest, error: questError } = await req.db
      .from('user_quests')
      .select('*, quests(*)')
      .eq('user_id', userId)
      .eq('quest_id', questId)
      .eq('status', 'active')
      .single();

    if (questError || !userQuest) {
      return res.status(404).json({ error: 'Quest not found or already claimed' });
    }

    // Check if quest is completed
    if (userQuest.current_progress < userQuest.target_value) {
      return res.status(400).json({ error: 'Quest not completed yet' });
    }

    // Mark as completed
    await req.db
      .from('user_quests')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', userQuest.id);

    // Award XP
    const xpResult = await awardXP(req.db, userId, userQuest.quests.xp_reward, 'quest', {
      quest_id: questId,
    });

    res.json({
      success: true,
      xp_awarded: userQuest.quests.xp_reward,
      quest_name: userQuest.quests.quest_name,
      leveled_up: xpResult.data?.leveled_up || false,
    });
  } catch (error) {
    console.error('❌ Error in /claim-quest:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/gamification/stats
 * Get global gamification stats (for dashboard)
 */
router.get('/stats', async (req, res) => {
  try {
    // Total users with gamification
    const { count: totalUsers } = await req.db
      .from('user_gamification')
      .select('*', { count: 'exact', head: true });

    // Total XP awarded
    const { data: xpStats } = await req.db
      .from('xp_transactions')
      .select('amount')
      .gte('amount', 0);

    const totalXP = xpStats ? xpStats.reduce((sum, t) => sum + t.amount, 0) : 0;

    // Total badges earned
    const { count: totalBadges } = await req.db
      .from('user_badges')
      .select('*', { count: 'exact', head: true });

    // Average level
    const { data: levels } = await req.db
      .from('user_gamification')
      .select('current_level');

    const avgLevel = levels && levels.length > 0
      ? levels.reduce((sum, u) => sum + u.current_level, 0) / levels.length
      : 0;

    res.json({
      total_users: totalUsers || 0,
      total_xp_awarded: totalXP,
      total_badges_earned: totalBadges || 0,
      average_level: Math.round(avgLevel * 10) / 10,
    });
  } catch (error) {
    console.error('❌ Error in /stats:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
