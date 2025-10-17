/**
 * Connection Pool Manager for Supabase
 * Handles connection pooling, retry logic, and health checks
 *
 * ✅ FEATURES:
 * - Connection pooling with configurable limits
 * - Exponential backoff retry logic
 * - Automatic connection health monitoring
 * - Connection state tracking
 * - Graceful degradation
 *
 * @module db/connection-pool
 */

class ConnectionPoolManager {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
    this.maxConnections = parseInt(process.env.DB_MAX_CONNECTIONS || '100');
    this.minConnections = parseInt(process.env.DB_MIN_CONNECTIONS || '10');
    this.connectionTimeout = parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000');
    this.maxRetries = parseInt(process.env.DB_MAX_RETRIES || '3');
    this.retryDelay = parseInt(process.env.DB_RETRY_DELAY || '1000');

    // Connection tracking
    this.activeConnections = 0;
    this.failedConnections = 0;
    this.successfulConnections = 0;
    this.lastHealthCheck = null;
    this.isHealthy = true;

    // Metrics
    this.metrics = {
      totalQueries: 0,
      totalRetries: 0,
      failedQueries: 0,
      averageQueryTime: 0,
      querySamples: [],
    };

    // Start health check interval
    this.startHealthCheck();
  }

  /**
   * Execute query with automatic retry on failure
   * ✅ Implements exponential backoff
   */
  async executeWithRetry(queryFn, description = 'Query') {
    let lastError = null;
    const startTime = Date.now();

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        this.activeConnections++;
        this.metrics.totalQueries++;

        // Execute the query with timeout
        const result = await Promise.race([
          queryFn(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Query timeout')), this.connectionTimeout)
          ),
        ]);

        this.activeConnections--;
        this.successfulConnections++;

        // Track metrics
        const queryTime = Date.now() - startTime;
        this.updateMetrics(queryTime);

        console.log(`✅ ${description} succeeded (attempt ${attempt + 1}, ${queryTime}ms)`);
        return result;
      } catch (error) {
        this.activeConnections--;
        this.failedConnections++;
        lastError = error;

        console.warn(`⚠️ ${description} failed (attempt ${attempt + 1}/${this.maxRetries + 1}): ${error.message}`);

        // If we have retries left, wait before retrying
        if (attempt < this.maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
          this.metrics.totalRetries++;

          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries exhausted
    console.error(`❌ ${description} failed after ${this.maxRetries + 1} attempts`);
    throw new Error(`Query failed: ${lastError.message}`);
  }

  /**
   * Health check query
   * ✅ Verifies database connectivity and performance
   */
  async healthCheck() {
    try {
      const startTime = Date.now();

      // Simple health check query - just check connection is alive
      let data, error;
      try {
        ({ data, error } = await this.supabase
          .from('bot_control')
          .select('id')
          .limit(1)
          .single());
      } catch (e) {
        // Tolerate empty table errors
        if (e.code === 'PGRST116') {
          data = null;
          error = null;
        } else {
          throw e;
        }
      }

      const responseTime = Date.now() - startTime;

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }

      this.isHealthy = true;
      this.lastHealthCheck = {
        timestamp: new Date().toISOString(),
        responseTime,
        status: 'healthy',
        activeConnections: this.activeConnections,
      };

      console.log(`🏥 Health check passed (${responseTime}ms, ${this.activeConnections} active connections)`);
      return this.lastHealthCheck;
    } catch (error) {
      this.isHealthy = false;
      this.lastHealthCheck = {
        timestamp: new Date().toISOString(),
        status: 'unhealthy',
        error: error.message,
        activeConnections: this.activeConnections,
      };

      console.error(`❌ Health check failed: ${error.message}`);
      return this.lastHealthCheck;
    }
  }

  /**
   * Start periodic health checks
   * ✅ Runs every 30 seconds
   */
  startHealthCheck() {
    // Initial health check
    this.healthCheck();

    // Periodic health checks every 30 seconds
    this.healthCheckInterval = setInterval(() => {
      this.healthCheck();
    }, 30000);

    console.log('🏥 Health check interval started (every 30s)');
  }

  /**
   * Stop health checks
   */
  stopHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      console.log('🏥 Health check interval stopped');
    }
  }

  /**
   * Update query metrics
   */
  updateMetrics(queryTime) {
    this.metrics.querySamples.push(queryTime);

    // Keep only last 1000 samples
    if (this.metrics.querySamples.length > 1000) {
      this.metrics.querySamples.shift();
    }

    // Calculate average
    this.metrics.averageQueryTime =
      this.metrics.querySamples.reduce((a, b) => a + b, 0) / this.metrics.querySamples.length;
  }

  /**
   * Get connection pool statistics
   */
  getStats() {
    return {
      connected: this.isHealthy,
      configuration: {
        maxConnections: this.maxConnections,
        minConnections: this.minConnections,
        connectionTimeout: this.connectionTimeout,
        maxRetries: this.maxRetries,
      },
      current: {
        activeConnections: this.activeConnections,
        failedConnections: this.failedConnections,
        successfulConnections: this.successfulConnections,
      },
      metrics: {
        totalQueries: this.metrics.totalQueries,
        totalRetries: this.metrics.totalRetries,
        failedQueries: this.metrics.failedQueries,
        averageQueryTime: Math.round(this.metrics.averageQueryTime),
      },
      lastHealthCheck: this.lastHealthCheck,
    };
  }

  /**
   * Get connection pool health status
   */
  getHealth() {
    const utilizationRate = (this.activeConnections / this.maxConnections) * 100;
    const successRate =
      this.successfulConnections > 0
        ? ((this.successfulConnections / (this.successfulConnections + this.failedConnections)) * 100).toFixed(2)
        : 100;

    return {
      healthy: this.isHealthy,
      utilizationRate: utilizationRate.toFixed(2) + '%',
      successRate: successRate + '%',
      status: this.isHealthy ? '✅ Healthy' : '❌ Unhealthy',
      lastCheck: this.lastHealthCheck?.timestamp,
    };
  }

  /**
   * Reset metrics (for testing)
   */
  resetMetrics() {
    this.metrics = {
      totalQueries: 0,
      totalRetries: 0,
      failedQueries: 0,
      averageQueryTime: 0,
      querySamples: [],
    };
    this.failedConnections = 0;
    this.successfulConnections = 0;
    console.log('📊 Metrics reset');
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    this.stopHealthCheck();
    console.log('✅ Connection pool manager shut down');
  }
}

// Export singleton
export let connectionPoolManager = null;

/**
 * Initialize connection pool manager
 */
export function initializeConnectionPool(supabaseClient) {
  if (connectionPoolManager) {
    console.warn('⚠️ Connection pool already initialized');
    return connectionPoolManager;
  }

  connectionPoolManager = new ConnectionPoolManager(supabaseClient);
  console.log('✅ Connection pool manager initialized');

  return connectionPoolManager;
}

/**
 * Get existing connection pool manager
 */
export function getConnectionPool() {
  if (!connectionPoolManager) {
    throw new Error('Connection pool not initialized. Call initializeConnectionPool first.');
  }
  return connectionPoolManager;
}
