// ============================================================
// REFERRAL SYSTEM API ROUTES
// ============================================================
// Express routes for referral endpoints
// ============================================================

import express from 'express';
import {
  generateReferralCode,
  ensureUserReferralCode,
  validateReferralCode,
  registerReferral,
  getUserReferrals,
} from './referral-service.mjs';

const router = express.Router();

/**
 * GET /api/referrals/my-code/:userId
 * Get or generate user's referral code
 * Response: { code: "ABC12XYZ", isNew: boolean, shareLink: string }
 */
router.get('/my-code/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId parameter' });
    }

    const result = await ensureUserReferralCode(req.db, userId);

    if (result.success) {
      const shareLink = `${process.env.FRONTEND_URL || 'https://mivratech.com'}?ref=${result.code}`;
      res.json({
        code: result.code,
        isNew: result.isNew,
        shareLink,
      });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('❌ Error in /my-code:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/referrals/my-referrals/:userId
 * Get all referrals for a user (as referrer)
 * Response: { pending: [], registered: [], deposited: [], all: [], stats: { total, deposited } }
 */
router.get('/my-referrals/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId parameter' });
    }

    const result = await getUserReferrals(req.db, userId);

    if (result.success) {
      const stats = {
        total: result.referrals.all.length,
        pending: result.referrals.pending.length,
        registered: result.referrals.registered.length,
        deposited: result.referrals.deposited.length,
      };

      res.json({
        referrals: result.referrals,
        stats,
      });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('❌ Error in /my-referrals:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/referrals/validate
 * Validate a referral code
 * Body: { code: "ABC12XYZ" }
 * Response: { valid: boolean, error?: string }
 */
router.post('/validate', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Missing code in request body' });
    }

    const result = await validateReferralCode(req.db, code);

    if (result.success) {
      res.json({ valid: true });
    } else {
      res.status(400).json({ valid: false, error: result.error });
    }
  } catch (error) {
    console.error('❌ Error in /validate:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/referrals/stats/:userId
 * Get referral statistics for a user
 * Response: { totalReferrals, depositedReferrals, pendingReferrals, xpEarned }
 */
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId parameter' });
    }

    // Get user's referrals
    const referralsResult = await getUserReferrals(req.db, userId);
    if (!referralsResult.success) {
      return res.status(500).json({ error: referralsResult.error });
    }

    // Get user's gamification stats
    const { data: gamification } = await req.db
      .from('user_gamification')
      .select('total_referrals_deposited')
      .eq('user_id', userId)
      .single();

    // Calculate XP earned from referrals
    const depositedCount = referralsResult.referrals.deposited.length;
    const xpEarned = depositedCount * 500; // 500 XP per referral deposit

    res.json({
      totalReferrals: referralsResult.referrals.all.length,
      depositedReferrals: depositedCount,
      registeredReferrals: referralsResult.referrals.registered.length,
      pendingReferrals: referralsResult.referrals.pending.length,
      xpEarned,
      totalFromDatabase: gamification?.total_referrals_deposited || 0,
    });
  } catch (error) {
    console.error('❌ Error in /stats:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/referrals/register
 * Register a referral when new user signs up with code
 * Body: { referralCode: "ABC12XYZ", refereeUserId: "user-uuid", refereeEmail?: "email@example.com" }
 * Response: { success: boolean, message: string }
 * NOTE: This is typically called from the signup flow after user creates account
 */
router.post('/register', async (req, res) => {
  try {
    const { referralCode, refereeUserId, refereeEmail } = req.body;

    if (!referralCode || !refereeUserId) {
      return res.status(400).json({ error: 'Missing required fields: referralCode, refereeUserId' });
    }

    const result = await registerReferral(req.db, referralCode, refereeUserId, refereeEmail);

    if (result.success) {
      res.json({ success: true, message: 'Referral registered successfully' });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('❌ Error in /register:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
