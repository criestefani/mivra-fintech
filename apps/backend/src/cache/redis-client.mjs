/**
 * Redis Client Wrapper
 * Provides connection management, TTL handling, and error recovery
 *
 * @module cache/redis-client
 */

import redis from 'redis';

class RedisClient {
  constructor() {
    this.client = null;
    this.connected = false;
    this.retryCount = 0;
    this.maxRetries = 5;
    this.retryDelay = 1000; // Start with 1 second
  }

  /**
   * Initialize Redis connection
   * ✅ Handles connection pooling and auto-reconnect
   */
  async connect() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

      this.client = redis.createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > this.maxRetries) {
              console.error('❌ Redis max retries exceeded');
              return new Error('Max retries exceeded');
            }

            const delay = Math.min(1000 * Math.pow(2, retries), 30000);
            console.log(`⏳ Redis reconnect attempt ${retries + 1} in ${delay}ms`);
            return delay;
          },
          connectTimeout: 5000,
        },
        // Enable automatic command pipelining for better throughput
        maxRetriesPerRequest: 3,
      });

      // Set up event handlers
      this.client.on('error', (err) => {
        console.error('❌ Redis client error:', err.message);
        this.connected = false;
      });

      this.client.on('connect', () => {
        console.log('✅ Redis client connected');
        this.connected = true;
        this.retryCount = 0;
      });

      this.client.on('ready', () => {
        console.log('✅ Redis client ready');
      });

      // Connect to Redis
      await this.client.connect();
      this.connected = true;
    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error.message);
      this.connected = false;

      // Retry connection with exponential backoff
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        const delay = Math.min(1000 * Math.pow(2, this.retryCount), 30000);
        console.log(`⏳ Retrying Redis connection in ${delay}ms...`);

        setTimeout(() => this.connect(), delay);
      }
    }
  }

  /**
   * Get value from cache
   * Returns null if key doesn't exist or Redis is unavailable
   */
  async get(key) {
    if (!this.connected || !this.client) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (value) {
        console.log(`✅ Cache HIT: ${key}`);
        return JSON.parse(value);
      }
      return null;
    } catch (error) {
      console.warn(`⚠️ Cache get error for ${key}:`, error.message);
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   * ✅ Handles JSON serialization automatically
   */
  async set(key, value, ttlSeconds = 300) {
    if (!this.connected || !this.client) {
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      await this.client.setEx(key, ttlSeconds, serialized);
      console.log(`💾 Cache SET: ${key} (TTL: ${ttlSeconds}s)`);
      return true;
    } catch (error) {
      console.warn(`⚠️ Cache set error for ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Delete key from cache
   */
  async delete(key) {
    if (!this.connected || !this.client) {
      return false;
    }

    try {
      await this.client.del(key);
      console.log(`🗑️ Cache DELETE: ${key}`);
      return true;
    } catch (error) {
      console.warn(`⚠️ Cache delete error for ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Delete multiple keys (pattern-based)
   * ✅ Useful for cache invalidation
   */
  async deletePattern(pattern) {
    if (!this.connected || !this.client) {
      return 0;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
        console.log(`🗑️ Cache DELETE pattern: ${pattern} (${keys.length} keys)`);
      }
      return keys.length;
    } catch (error) {
      console.warn(`⚠️ Cache pattern delete error for ${pattern}:`, error.message);
      return 0;
    }
  }

  /**
   * Clear entire cache
   * ⚠️ Use with caution - clears all Redis data
   */
  async flush() {
    if (!this.connected || !this.client) {
      return false;
    }

    try {
      await this.client.flushDb();
      console.log('🗑️ Cache FLUSHED (all data cleared)');
      return true;
    } catch (error) {
      console.warn(`⚠️ Cache flush error:`, error.message);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    if (!this.connected || !this.client) {
      return null;
    }

    try {
      const info = await this.client.info('stats');
      return {
        connected: this.connected,
        info,
      };
    } catch (error) {
      console.warn('⚠️ Cache stats error:', error.message);
      return null;
    }
  }

  /**
   * Check if Redis is connected
   */
  isConnected() {
    return this.connected && this.client !== null;
  }

  /**
   * Gracefully close Redis connection
   */
  async disconnect() {
    if (this.client) {
      try {
        await this.client.quit();
        this.connected = false;
        console.log('✅ Redis connection closed');
      } catch (error) {
        console.error('⚠️ Error closing Redis connection:', error.message);
      }
    }
  }
}

// Export singleton instance
export const cacheClient = new RedisClient();

/**
 * Get cached value or execute function and cache result
 * ✅ Automatic cache management pattern
 */
export async function getOrCache(key, fetchFunction, ttlSeconds = 300) {
  // Try to get from cache first
  const cached = await cacheClient.get(key);
  if (cached !== null) {
    return cached;
  }

  // Cache miss - execute function and cache result
  console.log(`📡 Cache MISS: ${key}, fetching from source...`);
  const result = await fetchFunction();

  // Cache the result
  if (result !== null && result !== undefined) {
    await cacheClient.set(key, result, ttlSeconds);
  }

  return result;
}

/**
 * Wrapper for API endpoints to handle cache invalidation
 */
export async function invalidateCache(patterns) {
  if (!Array.isArray(patterns)) {
    patterns = [patterns];
  }

  let totalDeleted = 0;
  for (const pattern of patterns) {
    totalDeleted += await cacheClient.deletePattern(pattern);
  }

  return totalDeleted;
}

// Initialize Redis connection on module load
cacheClient.connect().catch((error) => {
  console.error('Failed to initialize Redis:', error.message);
  console.log('⚠️ Running without cache - database queries may be slower');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing Redis connection...');
  await cacheClient.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing Redis connection...');
  await cacheClient.disconnect();
  process.exit(0);
});
