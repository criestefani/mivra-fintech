/**
 * Admin API Routes
 *
 * Provides REST API endpoints for admin dashboard.
 * Uses real Supabase data with REAL account focus.
 *
 * @module admin/routes
 */

import express from 'express';

// Import services
import * as analyticsService from '../services/analytics.mjs';
import * as usersService from '../services/users.mjs';
import * as tradesService from '../services/trades.mjs';

const router = express.Router();

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * Verify admin authentication
 * TODO: Implement proper JWT/session validation
 */
function verifyAdmin(req, res, next) {
  // For now, allow all requests
  // In production, this should validate admin JWT token
  next();
}

// Apply to all routes
router.use(verifyAdmin);

// ============================================================================
// ANALYTICS ENDPOINTS
// ============================================================================

/**
 * GET /api/admin/analytics/dashboard
 * Get complete dashboard metrics
 */
router.get('/analytics/dashboard', async (req, res) => {
  try {
    const metrics = await analyticsService.getDashboardMetrics();
    res.json({ success: true, data: metrics });
  } catch (error) {
    console.error('[Admin API] Error getting dashboard metrics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/analytics/revenue
 * Get revenue data for charts (30 days by default)
 */
router.get('/analytics/revenue', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const data = await analyticsService.getRevenueData(days);
    res.json({ success: true, data });
  } catch (error) {
    console.error('[Admin API] Error getting revenue data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/analytics/user-growth
 * Get user growth data for charts
 */
router.get('/analytics/user-growth', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const data = await analyticsService.getUserGrowthData(days);
    res.json({ success: true, data });
  } catch (error) {
    console.error('[Admin API] Error getting user growth data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/analytics/top-users-pnl
 * Get top users by PnL
 */
router.get('/analytics/top-users-pnl', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const accountType = req.query.accountType || 'real';
    const data = await analyticsService.getTopUsersByPnL(limit, accountType);
    res.json({ success: true, data });
  } catch (error) {
    console.error('[Admin API] Error getting top users by PnL:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/analytics/top-users-volume
 * Get top users by volume
 */
router.get('/analytics/top-users-volume', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const accountType = req.query.accountType || 'real';
    const data = await analyticsService.getTopUsersByVolume(limit, accountType);
    res.json({ success: true, data });
  } catch (error) {
    console.error('[Admin API] Error getting top users by volume:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/analytics/asset-performance
 * Get asset performance stats
 */
router.get('/analytics/asset-performance', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const accountType = req.query.accountType || 'real';
    const data = await analyticsService.getAssetPerformance(limit, accountType);
    res.json({ success: true, data });
  } catch (error) {
    console.error('[Admin API] Error getting asset performance:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// USERS ENDPOINTS
// ============================================================================

/**
 * GET /api/admin/users
 * Get paginated list of users with filters
 * Query params: accountType, search, isActive, sortBy, sortOrder, limit, offset
 */
router.get('/users', async (req, res) => {
  try {
    const filters = {
      accountType: req.query.accountType || 'real',
      search: req.query.search,
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      sortBy: req.query.sortBy || 'created_at',
      sortOrder: req.query.sortOrder || 'desc',
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0,
    };

    const users = await usersService.getAllUsers(filters);
    res.json({ success: true, data: users, filters });
  } catch (error) {
    console.error('[Admin API] Error getting users:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/users/:userId
 * Get complete user details
 */
router.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await usersService.getUserDetails(userId);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('[Admin API] Error getting user details:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/users/:userId/trades
 * Get user's trade history
 * Query params: accountType, limit, offset
 */
router.get('/users/:userId/trades', async (req, res) => {
  try {
    const { userId } = req.params;
    const accountType = req.query.accountType || 'real';
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    const trades = await usersService.getUserTrades(userId, accountType, limit, offset);
    res.json({ success: true, data: trades });
  } catch (error) {
    console.error('[Admin API] Error getting user trades:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/users/:userId/sessions
 * Get user's session history
 * Query params: limit, offset
 */
router.get('/users/:userId/sessions', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const sessions = await usersService.getUserSessions(userId, limit, offset);
    res.json({ success: true, data: sessions });
  } catch (error) {
    console.error('[Admin API] Error getting user sessions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// TRADES ENDPOINTS
// ============================================================================

/**
 * GET /api/admin/trades
 * Get paginated list of trades with filters
 * Query params: accountType, userId, asset, resultado, dateFrom, dateTo, sortBy, sortOrder, limit, offset
 */
router.get('/trades', async (req, res) => {
  try {
    const filters = {
      accountType: req.query.accountType || 'real',
      userId: req.query.userId,
      asset: req.query.asset,
      resultado: req.query.resultado,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      sortBy: req.query.sortBy || 'data_abertura',
      sortOrder: req.query.sortOrder || 'desc',
      limit: parseInt(req.query.limit) || 100,
      offset: parseInt(req.query.offset) || 0,
    };

    const trades = await tradesService.getAllTrades(filters);
    res.json({ success: true, data: trades, filters });
  } catch (error) {
    console.error('[Admin API] Error getting trades:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/trades/:tradeId
 * Get trade details by ID
 */
router.get('/trades/:tradeId', async (req, res) => {
  try {
    const { tradeId } = req.params;
    const trade = await tradesService.getTradeById(tradeId);

    if (!trade) {
      return res.status(404).json({ success: false, error: 'Trade not found' });
    }

    res.json({ success: true, data: trade });
  } catch (error) {
    console.error('[Admin API] Error getting trade details:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/trades/stats
 * Get trade statistics
 * Query params: accountType, dateFrom, dateTo
 */
router.get('/trades/stats', async (req, res) => {
  try {
    const accountType = req.query.accountType || 'real';
    const dateFrom = req.query.dateFrom;
    const dateTo = req.query.dateTo;

    const stats = await tradesService.getTradeCountByResult(accountType, dateFrom, dateTo);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('[Admin API] Error getting trade stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/trades/asset-stats
 * Get asset performance stats
 * Query params: accountType, limit
 */
router.get('/trades/asset-stats', async (req, res) => {
  try {
    const accountType = req.query.accountType || 'real';
    const limit = parseInt(req.query.limit) || 50;

    const stats = await tradesService.getAssetStats(accountType, limit);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('[Admin API] Error getting asset stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/trades/daily-volume
 * Get daily trade volume for charts
 * Query params: accountType, days
 */
router.get('/trades/daily-volume', async (req, res) => {
  try {
    const accountType = req.query.accountType || 'real';
    const days = parseInt(req.query.days) || 30;

    const data = await tradesService.getDailyTradeVolume(accountType, days);
    res.json({ success: true, data });
  } catch (error) {
    console.error('[Admin API] Error getting daily volume:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * GET /api/admin/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

export default router;
