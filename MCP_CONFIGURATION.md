# MCP (Model Context Protocol) Configuration Guide

## Overview

Configure Redis MCP server with your Redis API key to enable advanced monitoring and debugging through Claude Code.

---

## Step 1: Redis API Key Configuration

### Your Redis API Key
```
API Key: S4kf015ygcnjtnoh4kdsaczxb3uwi8mk4b59foi6uvqo1e3rjuz
```

### Environment Variables
Already configured in `.env`:
```env
# Redis Configuration
REDIS_API_KEY="S4kf015ygcnjtnoh4kdsaczxb3uwi8mk4b59foi6uvqo1e3rjuz"
REDIS_URL="redis://localhost:6379"
```

---

## Step 2: Redis MCP Server Setup

### Option A: Run as Standalone MCP (Recommended)

The MCP server is automatically available for use through Claude Code.

**Access Redis Tools:**
1. In Claude Code interface
2. Use the Redis MCP server tools:
   - `redis_stats` - Cache statistics
   - `redis_get` - Get cache values
   - `redis_set` - Set cache entries
   - `redis_delete` - Delete entries
   - `cache_keys_list` - List all patterns

### Option B: Use Redis MCP Tools in Claude Code

```
I can now access Redis tools through MCP. Available commands:

1. **redis_stats**
   - Get real-time cache statistics
   - See connection status, metrics, performance

2. **redis_get <key>**
   - Retrieve cached value by key
   - Inspect cached data
   - Debug cache issues

3. **redis_set <key> <value> [ttl]**
   - Store value in cache
   - Set custom TTL
   - Test cache functionality

4. **redis_delete <key>**
   - Remove specific cache entry
   - Clear outdated data
   - Manual cache management

5. **redis_delete_pattern <pattern>**
   - Clear cache by pattern
   - Invalidate related entries
   - Bulk cache cleanup (e.g., "analytics:*")

6. **redis_flush**
   - Clear entire Redis cache
   - ⚠️ Use only for testing/debugging

7. **cache_keys_list**
   - View all cache key patterns
   - See TTL configurations
   - Understand cache structure
```

---

## Step 3: API Key Integration

### Configuration in Code

The Redis API key is automatically used by:

1. **Cache Module** (`src/cache/redis-client.mjs`)
   - Reads `REDIS_API_KEY` from environment
   - Establishes authenticated connection
   - Manages connection pooling

2. **MCP Server** (`src/mcp/redis-mcp-server.mjs`)
   - Inherits Redis connection
   - Provides monitoring tools
   - Enables debugging

### Environment File Location
```
apps/backend/.env
```

### Verification
```bash
# Check if API key is loaded
grep REDIS_API_KEY apps/backend/.env
# Output: REDIS_API_KEY="S4kf015ygcnjtnoh4kdsaczxb3uwi8mk4b59foi6uvqo1e3rjuz"
```

---

## Step 4: Using MCP Tools

### Example 1: Get Cache Statistics

**Use Case:** Monitor cache health
```
Tool: redis_stats
Response:
{
  "connected": true,
  "metrics": {
    "totalQueries": 1523,
    "averageQueryTime": 234,
    "failedQueries": 2
  },
  "lastHealthCheck": {...}
}
```

### Example 2: Inspect Dashboard Metrics Cache

**Use Case:** Debug why dashboard is not updating
```
Tool: redis_get
Input: "analytics:dashboard_metrics"
Response:
{
  "total_users": 156,
  "active_users_today_real": 42,
  "trades_today_real": 1234,
  ...
}
```

### Example 3: Clear Outdated Cache

**Use Case:** Force refresh of user data
```
Tool: redis_delete_pattern
Input: "users:123:*"
Response: ✅ Deleted 4 keys matching pattern
```

### Example 4: View Cache Structure

**Use Case:** Understand what's cached
```
Tool: cache_keys_list
Response:
{
  "DASHBOARD_METRICS": "analytics:dashboard_metrics",
  "REVENUE_DATA": "analytics:revenue_data:*",
  "TTL_DASHBOARD": "60s",
  "TTL_REVENUE": "300s",
  ...
}
```

---

## Step 5: MCP Configuration in Claude Code

### Enable MCP Server

1. **Ensure Redis is Running**
   ```bash
   redis-cli ping
   # Response: PONG
   ```

2. **Start Backend Server**
   ```bash
   npm run server
   ```

3. **Redis MCP Becomes Available**
   - Automatically initialized
   - Ready for tool calls
   - API key already configured

### Use Redis MCP in Claude Code

The MCP tools are automatically available. Use them to:
- Monitor cache performance
- Debug cache issues
- Inspect cached values
- Invalidate cache entries
- Analyze cache statistics

---

## Step 6: Security Best Practices

### API Key Protection

✅ **Currently Configured:**
- API key stored in `.env` (not committed to git)
- `.env` in `.gitignore` (if configured)
- Used only for local/internal connections
- Not exposed in API responses
- Not logged in output

### Additional Security Steps

1. **Restrict Redis Access**
   ```env
   REDIS_URL="redis://localhost:6379"
   # Only accessible from local machine
   ```

2. **Use Redis AUTH if Available**
   ```env
   REDIS_URL="redis://:password@localhost:6379"
   ```

3. **Rotate API Keys Periodically**
   - Change key every 90 days
   - Update in .env file
   - Restart services

4. **Monitor MCP Tool Usage**
   - Log all cache operations
   - Alert on suspicious patterns
   - Audit access logs

---

## Troubleshooting

### MCP Server Not Responding

**Problem:** Tools not available
```
Solution:
1. Verify Redis is running: redis-cli ping
2. Check environment: env | grep REDIS
3. Restart backend: npm run server
4. Check logs for errors
```

### "Connection Refused" Error

**Problem:** Can't connect to Redis
```
Solution:
1. Start Redis: docker run -p 6379:6379 redis:latest
2. Verify connection: redis-cli ping
3. Check REDIS_URL in .env
```

### MCP Tools Return Empty Results

**Problem:** No cache data found
```
Solution:
1. Verify cache is being used: Check logs for "Cache SET"
2. Check TTL: Key might have expired
3. Run cache_keys_list to see available keys
4. Set test data: redis_set test '{"data": "value"}' 300
```

### API Key Not Working

**Problem:** Authentication error
```
Solution:
1. Verify key in .env: grep REDIS_API_KEY .env
2. Restart backend: npm run server
3. Check Redis requires no auth: redis-cli (no -a flag)
4. Update key if needed
```

---

## Integration with Phases 1-3

### How MCP Fits Into Optimization

```
System Architecture:
├─ Phase 1: Real-time subscriptions (bot-control-listener)
├─ Phase 2: Redis Cache (redis-client, cache-keys)
├─ Phase 3: Connection Pooling (connection-pool)
└─ MCP Tools: Monitoring & Debugging
     ├─ redis_stats → Monitor Phase 2
     ├─ redis_get → Inspect cache entries
     ├─ cache_keys_list → View cache structure
     └─ redis_delete_pattern → Invalidate cache
```

### Common Debugging Tasks

**Task 1: Dashboard is showing stale data**
```
1. Use: cache_keys_list
   → Find: analytics:dashboard_metrics
2. Use: redis_get analytics:dashboard_metrics
   → Check data freshness
3. Use: redis_delete_pattern analytics:*
   → Force cache refresh
```

**Task 2: Cache hit rate is low**
```
1. Use: redis_stats
   → Check metrics.totalQueries
2. Check TTL: cache_keys_list
3. Verify cache keys: redis_stats
4. Monitor: Watch logs for "Cache HIT/MISS"
```

**Task 3: Memory usage concerns**
```
1. Use: redis_stats
   → Check memory usage
2. Use: redis_delete_pattern <pattern>
   → Clean old entries
3. Review: cache-keys.mjs TTL settings
4. Consider: Reduce TTL or add eviction policy
```

---

## Advanced Usage

### Custom Cache Inspection

**View all dashboard metrics:**
```
Tool: redis_get
Key: "analytics:dashboard_metrics"
→ Full dashboard state
```

**Check top users cache:**
```
Tool: redis_get
Key: "analytics:top_users_pnl:10:real"
→ Top 10 real account users by PnL
```

**Bulk invalidation after data import:**
```
Tool: redis_delete_pattern
Pattern: "users:*"
→ Clear all user caches
```

### Monitoring Dashboard

**Create monitoring script (optional):**
```bash
#!/bin/bash
while true; do
  curl http://localhost:4001/api/admin/health/db-pool | jq .
  sleep 5
done
```

### Performance Analysis

**Analyze cache effectiveness:**
```
1. Check stats: redis_stats
2. Note: totalQueries, averageQueryTime
3. Compare: Before/after cache setup
4. Result: Calculate hit rate and savings
```

---

## MCP Environment Variables Summary

```env
# Redis Configuration (Phase 2)
REDIS_API_KEY="S4kf015ygcnjtnoh4kdsaczxb3uwi8mk4b59foi6uvqo1e3rjuz"
REDIS_URL="redis://localhost:6379"

# Connection Pool (Phase 3)
DB_MAX_CONNECTIONS=100
DB_MIN_CONNECTIONS=10
DB_CONNECTION_TIMEOUT=5000
DB_MAX_RETRIES=3
DB_RETRY_DELAY=1000
```

---

## Next Steps

1. ✅ **Verify Redis Connection**
   ```bash
   redis-cli ping
   # Expected: PONG
   ```

2. ✅ **Confirm MCP Tools Available**
   - Test: `redis_stats`
   - Should return cache statistics

3. ✅ **Monitor Performance**
   - Watch logs for cache activity
   - Use health endpoint
   - Track improvement metrics

4. 🔄 **Proceed to Phase 4**
   - Query monitoring
   - Performance analytics
   - Alert system

---

## Support Resources

- **Redis Documentation:** https://redis.io/docs/
- **MCP Protocol:** https://modelcontextprotocol.io/
- **Supabase Docs:** https://supabase.com/docs/
- **Project Docs:** See `PERFORMANCE_OPTIMIZATION_SUMMARY.md`

---

**Status:** ✅ MCP Configured with API Key
**API Key:** Configured in `.env`
**Services:** Redis, Connection Pool, MCP Tools Ready
**Next:** Phase 4 - Query Monitoring
