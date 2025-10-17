/**
 * Cache Module - Main Export
 * Provides centralized access to all caching functionality
 *
 * ✅ FEATURES:
 * - Redis connection management with automatic retry
 * - TTL-based cache expiration
 * - Pattern-based cache invalidation
 * - Event-driven cache busting
 * - Performance monitoring
 *
 * @module cache
 */

export { cacheClient, getOrCache, invalidateCache } from './redis-client.mjs';
export { CACHE_KEYS, CACHE_TTL, getTradeCompletionInvalidationPatterns, getUserUpdateInvalidationPatterns } from './cache-keys.mjs';
export {
  onTradeCompletion,
  onUserDataChange,
  invalidateAllAnalytics,
  invalidateAllUsers,
  invalidateUserCache,
  getCacheStats,
  flushAllCache,
} from './cache-invalidation.mjs';
