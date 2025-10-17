/**
 * Cache Invalidation Hooks
 * Triggers cache busting on specific events (trade completion, user updates, etc.)
 *
 * @module cache/cache-invalidation
 */

import { cacheClient } from './redis-client.mjs';
import { getTradeCompletionInvalidationPatterns, getUserUpdateInvalidationPatterns } from './cache-keys.mjs';

/**
 * Invalidate cache when trade completes
 * ✅ Clears all analytics and user-specific cached data
 */
export async function onTradeCompletion(userId) {
  try {
    const patterns = getTradeCompletionInvalidationPatterns(userId);
    let totalDeleted = 0;

    for (const pattern of patterns) {
      const deleted = await cacheClient.deletePattern(pattern);
      totalDeleted += deleted;
    }

    console.log(`🔄 [Cache] Trade completion invalidation for user ${userId}: cleared ${totalDeleted} cache keys`);
    return totalDeleted;
  } catch (error) {
    console.error('[Cache] Error invalidating on trade completion:', error.message);
    return 0;
  }
}

/**
 * Invalidate cache when user data changes
 * ✅ Clears user list and rankings
 */
export async function onUserDataChange(userId) {
  try {
    const patterns = getUserUpdateInvalidationPatterns(userId);
    let totalDeleted = 0;

    for (const pattern of patterns) {
      const deleted = await cacheClient.deletePattern(pattern);
      totalDeleted += deleted;
    }

    console.log(`🔄 [Cache] User data update invalidation for user ${userId}: cleared ${totalDeleted} cache keys`);
    return totalDeleted;
  } catch (error) {
    console.error('[Cache] Error invalidating on user data change:', error.message);
    return 0;
  }
}

/**
 * Invalidate all analytics cache
 * ⚠️ Use sparingly - clears all dashboard metrics
 */
export async function invalidateAllAnalytics() {
  try {
    const deleted = await cacheClient.deletePattern('analytics:*');
    console.log(`🔄 [Cache] Cleared all analytics cache: ${deleted} keys`);
    return deleted;
  } catch (error) {
    console.error('[Cache] Error invalidating all analytics:', error.message);
    return 0;
  }
}

/**
 * Invalidate all user cache
 * ⚠️ Use sparingly - clears all user-specific data
 */
export async function invalidateAllUsers() {
  try {
    const deleted = await cacheClient.deletePattern('users:*');
    console.log(`🔄 [Cache] Cleared all user cache: ${deleted} keys`);
    return deleted;
  } catch (error) {
    console.error('[Cache] Error invalidating all users:', error.message);
    return 0;
  }
}

/**
 * Invalidate specific user's cache
 */
export async function invalidateUserCache(userId) {
  try {
    const deleted = await cacheClient.deletePattern(`users:${userId}:*`);
    console.log(`🔄 [Cache] Cleared user ${userId} cache: ${deleted} keys`);
    return deleted;
  } catch (error) {
    console.error('[Cache] Error invalidating user cache:', error.message);
    return 0;
  }
}

/**
 * Get cache statistics
 * ✅ Returns cache performance metrics
 */
export async function getCacheStats() {
  if (!cacheClient.isConnected()) {
    return {
      connected: false,
      stats: null,
    };
  }

  try {
    const stats = await cacheClient.getStats();
    return {
      connected: true,
      stats,
    };
  } catch (error) {
    console.error('[Cache] Error getting cache stats:', error.message);
    return {
      connected: false,
      stats: null,
      error: error.message,
    };
  }
}

/**
 * Manual cache flush (for debugging/testing)
 * ⚠️ DESTRUCTIVE - clears all Redis data
 */
export async function flushAllCache() {
  try {
    const success = await cacheClient.flush();
    if (success) {
      console.log('🗑️ [Cache] Flushed all cache data');
    }
    return success;
  } catch (error) {
    console.error('[Cache] Error flushing cache:', error.message);
    return false;
  }
}
