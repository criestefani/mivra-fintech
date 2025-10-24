// ============================================================
// QUEST API ROUTES
// ============================================================
// Express routes for quest endpoints
// ============================================================

import express from 'express';
import {
  inviteQuestsToUser,
  acceptQuest,
  rejectQuest,
  updateQuestProgress,
  claimQuestReward,
  getUserActiveQuests,
  getUserInvitedQuests,
  getUserCompletedQuests,
  getUserActiveRewards,
  cleanupExpiredQuests,
  cleanupExpiredRewards,
} from './quest-service.mjs';

const router = express.Router();

/**
 * GET /api/quests/invited/:userId
 * Get user's invited quests (pending acceptance)
 */
router.get('/invited/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId parameter' });
    }

    const result = await getUserInvitedQuests(req.db, userId);

    if (result.success) {
      res.json({
        invited_quests: result.quests,
        count: result.quests.length,
      });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('❌ Error in /invited:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/quests/active/:userId
 * Get user's active quests (accepted, in progress)
 */
router.get('/active/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId parameter' });
    }

    const result = await getUserActiveQuests(req.db, userId);

    if (result.success) {
      res.json({
        active_quests: result.quests,
        count: result.quests.length,
      });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('❌ Error in /active:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/quests/completed/:userId
 * Get user's completed quests (ready to claim)
 */
router.get('/completed/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId parameter' });
    }

    const result = await getUserCompletedQuests(req.db, userId);

    if (result.success) {
      res.json({
        completed_quests: result.quests,
        count: result.quests.length,
        xp_available: result.quests.reduce((sum, q) => sum + (q.quests?.xp_reward || 0), 0),
      });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('❌ Error in /completed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/quests/rewards/:userId
 * Get user's active temporary rewards
 */
router.get('/rewards/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId parameter' });
    }

    const result = await getUserActiveRewards(req.db, userId);

    if (result.success) {
      res.json({
        active_rewards: result.rewards,
        count: result.rewards.length,
      });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('❌ Error in /rewards:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/quests/accept
 * Accept a quest invitation
 * Body: { userId, questId }
 */
router.post('/accept', async (req, res) => {
  try {
    const { userId, questId } = req.body;

    if (!userId || !questId) {
      return res.status(400).json({ error: 'Missing required fields: userId, questId' });
    }

    const result = await acceptQuest(req.db, userId, questId);

    if (result.success) {
      res.json({
        success: true,
        message: 'Quest accepted',
        quest: result.data,
      });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('❌ Error in /accept:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/quests/reject
 * Reject a quest invitation
 * Body: { userId, questId }
 */
router.post('/reject', async (req, res) => {
  try {
    const { userId, questId } = req.body;

    if (!userId || !questId) {
      return res.status(400).json({ error: 'Missing required fields: userId, questId' });
    }

    const result = await rejectQuest(req.db, userId, questId);

    if (result.success) {
      res.json({
        success: true,
        message: 'Quest rejected',
      });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('❌ Error in /reject:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/quests/claim
 * Claim completed quest reward
 * Body: { userId, questId }
 */
router.post('/claim', async (req, res) => {
  try {
    const { userId, questId } = req.body;

    if (!userId || !questId) {
      return res.status(400).json({ error: 'Missing required fields: userId, questId' });
    }

    const result = await claimQuestReward(req.db, userId, questId);

    if (result.success) {
      res.json({
        success: true,
        xp_awarded: result.xp_awarded,
        quest_name: result.quest_name,
        level_up: result.level_up,
        temporary_reward: result.temporary_reward,
      });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('❌ Error in /claim:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/quests/cleanup
 * Cleanup expired quests and rewards (internal endpoint)
 */
router.post('/cleanup', async (req, res) => {
  try {
    const questsResult = await cleanupExpiredQuests(req.db);
    const rewardsResult = await cleanupExpiredRewards(req.db);

    res.json({
      success: questsResult.success && rewardsResult.success,
      quests_cleaned: questsResult.success,
      rewards_cleaned: rewardsResult.success,
    });
  } catch (error) {
    console.error('❌ Error in /cleanup:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
