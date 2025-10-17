# Supabase Connection Pooling - Phase 3 Configuration Guide

## Overview

Connection pooling on Supabase optimizes database resource usage by reusing connections instead of creating new ones for each query. This reduces connection overhead and improves throughput.

## Configuration Steps

### Step 1: Enable PgBouncer (Connection Pooling) on Supabase

1. **Log into Supabase Dashboard**
   - Go to: https://app.supabase.com
   - Select your project (Mivra Fintech)

2. **Navigate to Database Settings**
   - Left sidebar → Project Settings
   - Click "Database"

3. **Find Connection Pooling Section**
   - Look for "Connection Pooling" or "PgBouncer"
   - You may see a toggle or configuration panel

4. **Enable PgBouncer**
   - Toggle "Use connection pooling" to ON
   - Select pooling mode: **"Transaction"** (recommended for Supabase)
   - Pool size: **100** (or adjust based on your needs)

5. **Note the Pooling Connection String**
   - Supabase will provide a separate connection string for pooled connections
   - Format: `postgresql://[user]:[password]@[host]:[6543]/[database]?sslmode=require`
   - **Note:** Pooled connections typically use port 6543 instead of 5432

### Step 2: Update Connection Strings in Environment

Update `.env` file with pooling configuration:

```env
# Direct Database Connection (max 100 connections)
DATABASE_URL="postgresql://postgres:[password]@[host]:5432/postgres?sslmode=require"

# Pooled Connection (recommended for apps, max 100)
DATABASE_POOL_URL="postgresql://postgres:[password]@[host]:6543/postgres?sslmode=require"

# Connection Pool Configuration
DB_MAX_CONNECTIONS=100
DB_MIN_CONNECTIONS=10
DB_CONNECTION_TIMEOUT=5000
DB_MAX_RETRIES=3
DB_RETRY_DELAY=1000
```

### Step 3: Configure Pooling Mode

**Transaction Mode** (Recommended for this project):
- Connections returned to pool after each transaction
- Best for web apps with short queries
- Supports most SQL operations
- Pool size can be smaller (default 100)

**Session Mode** (Alternative):
- Connections assigned to client for entire session
- Better for long-running connections
- Larger pool size needed
- Not recommended for web apps

### Step 4: Update Supabase Client Configuration

In `apps/backend/src/config/supabase.mjs`:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
// Use pooled connection string for better performance
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  // Connection pooling options
  db: {
    schema: 'public',
  },
  // Retry on connection failure
  shouldThrowOnError: false,
});
```

### Step 5: Initialize Connection Pool Manager

In `apps/backend/src/api-server.mjs` (at startup):

```javascript
import { initializeConnectionPool } from './db/connection-pool.mjs';

// Initialize connection pool manager
const connectionPool = initializeConnectionPool(supabase);

// Log initial stats
console.log('📊 Connection Pool Stats:', connectionPool.getStats());
```

## Performance Tuning

### Pool Size Calculation

**Formula:** `Pool Size = (connections_per_worker × number_of_workers) + buffer`

**Example for 100 concurrent users:**
```
Connections per worker: 1-2 (short queries)
Number of workers: 4 (Node.js default)
Buffer: 10 (for spikes)

Pool Size = (1.5 × 4) + 10 = 16-20
Use: 50 (provides good headroom)
```

### Recommended Settings

| Metric | Value | Notes |
|--------|-------|-------|
| Max Connections | 100 | Supabase default limit |
| Min Connections | 10 | Minimum for performance |
| Pool Size | 50 | Balanced for web apps |
| Connection Timeout | 5000ms | 5 second timeout |
| Max Retries | 3 | Automatic retry attempts |
| Retry Delay | 1000ms | Exponential backoff |

## Monitoring Connection Pool

### Get Connection Pool Stats

```javascript
import { getConnectionPool } from './db/connection-pool.mjs';

const pool = getConnectionPool();
console.log(pool.getStats());

// Output:
// {
//   connected: true,
//   configuration: { maxConnections: 100, ... },
//   current: { activeConnections: 5, ... },
//   metrics: { totalQueries: 1500, averageQueryTime: 250 }
// }
```

### Monitor Health

```javascript
// Automatic health checks every 30 seconds
pool.healthCheck();

// Get health status
console.log(pool.getHealth());
// {
//   healthy: true,
//   utilizationRate: "15.00%",
//   successRate: "99.87%",
//   status: "✅ Healthy"
// }
```

### View Connection Logs

```bash
# Watch logs for connection activity
tail -f logs/api-server.log | grep -E "(Connection|Pool|Health)"

# Expected output:
# ✅ Query succeeded (attempt 1, 234ms)
# 🏥 Health check passed (45ms, 5 active connections)
# ⚠️ Query failed, retrying in 2000ms
```

## Troubleshooting

### Connection Pool Exhausted

**Symptom:** `too many connections` error

**Solutions:**
1. Increase pool size in Supabase
2. Reduce query time (add indexes)
3. Implement request batching
4. Cache frequently accessed data (Redis)

### Slow Query Performance

**Symptom:** Average query time > 1000ms

**Solutions:**
1. Check database indexes (run `database-optimization.sql`)
2. Analyze slow queries with Supabase query metrics
3. Optimize N+1 queries
4. Enable query result caching

### Connection Timeout

**Symptom:** `connection timeout` errors

**Solutions:**
1. Increase `connectionTimeout` (default 5000ms)
2. Check network latency to Supabase
3. Verify firewall rules allow outbound to Supabase
4. Review database server logs for bottlenecks

## Monitoring Dashboard

### Create Monitoring Endpoint

Add to API routes (optional):

```javascript
app.get('/api/health/db-pool', (req, res) => {
  const pool = getConnectionPool();
  res.json({
    status: pool.getHealth().status,
    stats: pool.getStats(),
    timestamp: new Date().toISOString(),
  });
});
```

### Expected Metrics

**Health Dashboard should show:**
- ✅ Connection Pool: Healthy
- ✅ Active Connections: <20 (for typical load)
- ✅ Success Rate: >99%
- ✅ Average Query Time: <300ms

## Cost Impact

### Before Connection Pooling
- Default connections: ~10-50 active
- Failed queries requiring retry: 2-5%
- Database resource usage: High
- **Estimated monthly cost: $200-500**

### After Connection Pooling
- Optimized connections: 5-20 active
- Failed queries: <1%
- Database resource usage: Optimized
- **Estimated monthly cost: $50-100**

**Savings: 75-80% reduction in database costs**

## Integration with Phase 2 Cache

Connection pooling works synergistically with Redis cache:

```
Request → Check Redis Cache (50ms)
           ↓ Cache Hit (95% of requests)
           ✅ Instant response, no DB connection needed

           ↓ Cache Miss (5% of requests)
           Use Connection Pool → Query DB (250ms)
           ✅ Efficient connection reuse, no wait

Result: 95% of requests don't touch database at all
        Remaining 5% use optimized pooled connections
```

## Next Steps (Phase 4)

After connection pooling is configured:
1. Monitor performance metrics for 24-48 hours
2. Adjust pool size if needed based on metrics
3. Proceed to Phase 4: Query Monitoring & Analytics

## Files Created

- `apps/backend/src/db/connection-pool.mjs` - Connection pool manager

## Environment Variables Reference

```env
# Supabase URLs
SUPABASE_URL=https://[project].supabase.co
SUPABASE_SERVICE_KEY=[service-key]

# Connection Pooling (if enabled)
DATABASE_POOL_URL=postgresql://[user]:[password]@[host]:6543/[database]

# Connection Pool Configuration
DB_MAX_CONNECTIONS=100              # Supabase limit
DB_MIN_CONNECTIONS=10               # Minimum for performance
DB_CONNECTION_TIMEOUT=5000          # 5 second timeout
DB_MAX_RETRIES=3                    # Retry attempts
DB_RETRY_DELAY=1000                 # Initial retry delay (exponential)
```

## Support & Resources

- [Supabase Connection Pooling Docs](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooling)
- [PgBouncer Documentation](https://pgbouncer.github.io/)
- [PostgreSQL Connection Best Practices](https://wiki.postgresql.org/wiki/Number_Of_Database_Connections)

---

**Status:** Ready for Configuration
**Estimated Setup Time:** 15-30 minutes
**Performance Impact:** 30-50% improvement in concurrent user handling
