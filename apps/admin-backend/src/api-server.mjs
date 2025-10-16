// Load environment variables
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import { supabase } from '../config/supabase.mjs';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Admin modules
import logger from './admin/logger.mjs';
import alerts from './admin/alerts.mjs';
import { registerLogsAlertsEndpoints } from './admin/api-endpoints.mjs';
import * as UserManagement from './admin/users.mjs';
import * as Analytics from './admin/analytics.mjs';
import * as Trades from './admin/trades.mjs';
import { performHealthCheck } from './admin/health.mjs';
import * as Metrics from './admin/metrics.mjs';
import { setupAdminWebSocket } from './admin/websocket.mjs';

const app = express();
const httpServer = createServer(app);

// Configure CORS
app.use(cors());
app.use(express.json());

// Middleware to attach database connection to requests
app.use((req, res, next) => {
  req.db = supabase;
  next();
});

// Setup WebSocket with Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Function to get metrics context for MivraTech data
function getMetricsContext() {
  return {
    supabase
  };
}

// Setup Admin WebSocket namespace with authentication
const adminNamespace = setupAdminWebSocket(io, supabase, getMetricsContext);

// Register logs and alerts endpoints
registerLogsAlertsEndpoints(app, adminNamespace, supabase);

// Root endpoint - API Status
app.get('/', (req, res) => {
  res.json({
    name: 'MivraTech Admin API Server',
    version: '1.0.0',
    status: 'online',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: 'GET /api/admin/health',
      metrics: 'GET /api/admin/metrics/*',
      users: 'GET /api/admin/users',
      trades: 'GET /api/admin/trades',
      analytics: 'GET /api/admin/analytics/*'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ============================================================================
// ADMIN API ENDPOINTS - Health Check & Metrics
// ============================================================================

// GET /api/admin/health - System health check
app.get('/api/admin/health', async (req, res) => {
  try {
    const context = getMetricsContext();
    const health = await performHealthCheck(context);
    res.json(health);
  } catch (error) {
    console.error('Error in health check:', error);
    res.status(500).json({
      status: 'down',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// GET /api/admin/metrics/realtime - Real-time metrics
app.get('/api/admin/metrics/realtime', async (req, res) => {
  try {
    const metrics = await Metrics.getRealtimeMetrics(supabase);
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error fetching realtime metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/admin/metrics/daily - Daily aggregated metrics
app.get('/api/admin/metrics/daily', async (req, res) => {
  try {
    const metrics = await Metrics.getDailyMetrics(supabase);
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error fetching daily metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/admin/metrics/summary - Summary metrics
app.get('/api/admin/metrics/summary', async (req, res) => {
  try {
    const metrics = await Metrics.getSummaryMetrics(supabase);
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error fetching summary metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/admin/metrics/top-users - Top performing users
app.get('/api/admin/metrics/top-users', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const topUsers = await Metrics.getTopUsers(supabase, limit);
    res.json({
      success: true,
      data: topUsers
    });
  } catch (error) {
    console.error('Error fetching top users:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/admin/metrics/activity - Recent activity feed
app.get('/api/admin/metrics/activity', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const activity = await Metrics.getRecentActivity(supabase, limit);
    res.json({
      success: true,
      data: activity
    });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// ADMIN API ENDPOINTS - User Management
// ============================================================================

// Middleware: Verify admin authorization
async function verifyAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Missing or invalid authorization header'
      });
    }

    const token = authHeader.substring(7);

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    // Check if user has admin role
    const isAdmin = await UserManagement.isAdmin(user.id);

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin role required.'
      });
    }

    // Attach user to request for downstream use
    req.user = user;
    next();
  } catch (error) {
    console.error('Error in admin verification:', error);
    res.status(500).json({
      success: false,
      error: 'Authorization verification failed'
    });
  }
}

// GET /api/admin/users - List all users with pagination and filters
app.get('/api/admin/users', verifyAdmin, async (req, res) => {
  try {
    const filters = {
      search: req.query.search || '',
      isActive: req.query.isActive ? req.query.isActive === 'true' : null,
      accountType: req.query.accountType || null,
      sortBy: req.query.sortBy || 'created_at',
      sortOrder: req.query.sortOrder || 'desc',
      limit: parseInt(req.query.limit) || 20,
      offset: parseInt(req.query.offset) || 0
    };

    const result = await UserManagement.getAllUsers(filters);
    res.json(result);
  } catch (error) {
    console.error('Error in GET /api/admin/users:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/admin/users/:id - Get detailed user information
app.get('/api/admin/users/:id', verifyAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const result = await UserManagement.getUserById(userId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error in GET /api/admin/users/:id:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Implement remaining user management endpoints here...
// (getUserMetrics, getUserTrades, getUserActivityLog, activateUser, suspendUser, etc.)

// ============================================================================
// ADMIN API ENDPOINTS - Analytics
// ============================================================================

// GET /api/admin/analytics/daily - Get daily performance metrics
app.get('/api/admin/analytics/daily', verifyAdmin, async (req, res) => {
  try {
    const startDate = req.query.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = req.query.endDate || new Date().toISOString();

    const data = await Analytics.getDailyPerformance(startDate, endDate);
    res.json({
      success: true,
      data,
      filters: { startDate, endDate }
    });
  } catch (error) {
    console.error('Error in GET /api/admin/analytics/daily:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Implement remaining analytics endpoints here...
// (getStrategyPerformance, getAssetPerformance, getHourlyPerformance, etc.)

// ============================================================================
// ADMIN API ENDPOINTS - Trades Management
// ============================================================================

// GET /api/admin/trades - List all trades with filters and pagination
app.get('/api/admin/trades', verifyAdmin, async (req, res) => {
  try {
    const filters = {
      startDate: req.query.startDate || null,
      endDate: req.query.endDate || null,
      userId: req.query.userId || null,
      asset: req.query.asset || null,
      strategy: req.query.strategy || null,
      result: req.query.result || null,
      minPayout: req.query.minPayout ? parseFloat(req.query.minPayout) : undefined,
      maxPayout: req.query.maxPayout ? parseFloat(req.query.maxPayout) : undefined,
      timeframe: req.query.timeframe || null
    };

    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 50;

    const result = await Trades.getAllTrades(filters, page, pageSize);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error in GET /api/admin/trades:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Implement remaining trades endpoints here...
// (getTradeStatistics, getRecentTrades, getTradeById, etc.)

// ============================================================================
// Start Server
// ============================================================================

const PORT = 4002;
httpServer.listen(PORT, () => {
  console.log(`✅ Admin API Server running on http://localhost:${PORT}`);
  console.log(`📡 Admin Endpoints available:`);
  console.log(`   GET  /api/admin/health`);
  console.log(`   GET  /api/admin/metrics/*`);
  console.log(`   GET  /api/admin/users`);
  console.log(`   GET  /api/admin/trades`);
  console.log(`   GET  /api/admin/analytics/*`);
  console.log(`\n   WebSocket: /admin namespace - Real-time updates`);
});

// Keep-alive: prevent process from exiting
setInterval(() => {
  // Heartbeat every 30 seconds
}, 30000);
