/**
 * Cache Keys Constants
 * Centralized cache key definitions for easy invalidation and management
 *
 * Pattern: [module]:[function]:[params]
 * Example: analytics:dashboard_metrics, users:list:real:50:0
 *
 * @module cache/cache-keys
 */

// ============================================================
// ANALYTICS CACHE KEYS
// ============================================================

export const CACHE_KEYS = {
  // Dashboard metrics
  DASHBOARD_METRICS: 'analytics:dashboard_metrics',

  // Revenue data (parameterized by days)
  REVENUE_DATA: (days = 30) => `analytics:revenue_data:${days}`,

  // User growth data (parameterized by days)
  USER_GROWTH_DATA: (days = 30) => `analytics:user_growth_data:${days}`,

  // Top users by PnL (parameterized)
  TOP_USERS_BY_PNL: (limit = 10, accountType = 'real') =>
    `analytics:top_users_pnl:${limit}:${accountType}`,

  // Top users by Volume (parameterized)
  TOP_USERS_BY_VOLUME: (limit = 10, accountType = 'real') =>
    `analytics:top_users_volume:${limit}:${accountType}`,

  // Asset performance (parameterized)
  ASSET_PERFORMANCE: (limit = 20, accountType = 'real') =>
    `analytics:asset_performance:${limit}:${accountType}`,

  // ============================================================
  // USERS CACHE KEYS
  // ============================================================

  // All users list (parameterized by filters)
  ALL_USERS: (accountType = 'real', limit = 50, offset = 0) =>
    `users:list:${accountType}:${limit}:${offset}`,

  // User details (specific user)
  USER_DETAILS: (userId) => `users:details:${userId}`,

  // User trades (parameterized)
  USER_TRADES: (userId, accountType = 'real', limit = 100, offset = 0) =>
    `users:trades:${userId}:${accountType}:${limit}:${offset}`,

  // User sessions (parameterized)
  USER_SESSIONS: (userId, limit = 50, offset = 0) =>
    `users:sessions:${userId}:${limit}:${offset}`,

  // ============================================================
  // INVALIDATION PATTERNS (for cache busting)
  // ============================================================

  // Invalidate all analytics cache when trade is completed
  ANALYTICS_ALL: 'analytics:*',

  // Invalidate specific user's data when trade is completed
  USER_DATA: (userId) => `users:${userId}:*`,

  // Invalidate all users list cache
  USERS_LIST_ALL: 'users:list:*',

  // ============================================================
  // TTL CONFIGURATIONS (in seconds)
  // ============================================================
};

export const CACHE_TTL = {
  // Dashboard metrics - update every 60 seconds (high traffic)
  DASHBOARD_METRICS: 60,

  // Revenue data - update every 5 minutes
  REVENUE_DATA: 300,

  // User growth data - update every 10 minutes
  USER_GROWTH_DATA: 600,

  // Top users - update every 5 minutes
  TOP_USERS: 300,

  // Asset performance - update every 5 minutes
  ASSET_PERFORMANCE: 300,

  // User list - update every 5 minutes
  USERS_LIST: 300,

  // User details - update every 5 minutes
  USER_DETAILS: 300,

  // User trades - update every 10 minutes (less volatile)
  USER_TRADES: 600,

  // User sessions - update every 10 minutes
  USER_SESSIONS: 600,
};

/**
 * Get invalidation patterns for when a trade completes
 * This ensures all affected caches are cleared
 */
export function getTradeCompletionInvalidationPatterns(userId) {
  return [
    CACHE_KEYS.ANALYTICS_ALL, // All dashboard metrics
    CACHE_KEYS.USER_DATA(userId), // All user-specific data
    'analytics:revenue_data:*', // All revenue data variations
    'analytics:top_users_*', // All top users queries
    'users:list:*', // All user list queries
  ];
}

/**
 * Get invalidation patterns for when user data changes
 */
export function getUserUpdateInvalidationPatterns(userId) {
  return [
    CACHE_KEYS.USER_DATA(userId), // This user's data
    CACHE_KEYS.USERS_LIST_ALL, // All user list queries
    'analytics:top_users_*', // Top users rankings may change
  ];
}
