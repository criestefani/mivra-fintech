/**
 * Redis MCP Server
 * Provides Model Context Protocol interface for Redis monitoring and management
 *
 * ✅ FEATURES:
 * - Real-time Redis cache monitoring
 * - Cache key inspection and management
 * - Performance analytics
 * - Debug utilities
 *
 * @module mcp/redis-mcp-server
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { cacheClient } from '../cache/redis-client.mjs';
import { CACHE_KEYS, CACHE_TTL } from '../cache/cache-keys.mjs';

const server = new Server({
  name: 'mivra-redis-mcp',
  version: '1.0.0',
});

/**
 * Tool: Get Redis Cache Statistics
 */
server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request;

  if (name === 'redis_stats') {
    try {
      const stats = await cacheClient.getStats();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(stats, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`,
          },
        ],
      };
    }
  }

  if (name === 'redis_get') {
    const { key } = args;
    try {
      const value = await cacheClient.get(key);
      return {
        content: [
          {
            type: 'text',
            text: value ? JSON.stringify(value, null, 2) : 'Key not found',
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`,
          },
        ],
      };
    }
  }

  if (name === 'redis_set') {
    const { key, value, ttl } = args;
    try {
      const success = await cacheClient.set(key, JSON.parse(value), ttl || 300);
      return {
        content: [
          {
            type: 'text',
            text: success ? `✅ Key set successfully (TTL: ${ttl || 300}s)` : '❌ Failed to set key',
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`,
          },
        ],
      };
    }
  }

  if (name === 'redis_delete') {
    const { key } = args;
    try {
      const success = await cacheClient.delete(key);
      return {
        content: [
          {
            type: 'text',
            text: success ? `✅ Key deleted` : '❌ Failed to delete key',
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`,
          },
        ],
      };
    }
  }

  if (name === 'redis_delete_pattern') {
    const { pattern } = args;
    try {
      const count = await cacheClient.deletePattern(pattern);
      return {
        content: [
          {
            type: 'text',
            text: `✅ Deleted ${count} keys matching pattern: ${pattern}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`,
          },
        ],
      };
    }
  }

  if (name === 'redis_flush') {
    try {
      const success = await cacheClient.flush();
      return {
        content: [
          {
            type: 'text',
            text: success ? '✅ Cache flushed' : '❌ Failed to flush cache',
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`,
          },
        ],
      };
    }
  }

  if (name === 'cache_keys_list') {
    try {
      const keys = {
        DASHBOARD_METRICS: CACHE_KEYS.DASHBOARD_METRICS,
        REVENUE_DATA: 'analytics:revenue_data:*',
        USER_GROWTH_DATA: 'analytics:user_growth_data:*',
        TOP_USERS_BY_PNL: 'analytics:top_users_pnl:*',
        TOP_USERS_BY_VOLUME: 'analytics:top_users_volume:*',
        ASSET_PERFORMANCE: 'analytics:asset_performance:*',
      };

      const ttls = {
        DASHBOARD_METRICS: `${CACHE_TTL.DASHBOARD_METRICS}s`,
        REVENUE_DATA: `${CACHE_TTL.REVENUE_DATA}s`,
        USER_GROWTH_DATA: `${CACHE_TTL.USER_GROWTH_DATA}s`,
        TOP_USERS: `${CACHE_TTL.TOP_USERS}s`,
        ASSET_PERFORMANCE: `${CACHE_TTL.ASSET_PERFORMANCE}s`,
      };

      return {
        content: [
          {
            type: 'text',
            text: `Cache Keys:\n${JSON.stringify(keys, null, 2)}\n\nTTL Configuration:\n${JSON.stringify(ttls, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`,
          },
        ],
      };
    }
  }

  return {
    content: [
      {
        type: 'text',
        text: `Unknown tool: ${name}`,
      },
    ],
  };
});

/**
 * List available tools
 */
server.setRequestHandler('tools/list', async () => {
  return {
    tools: [
      {
        name: 'redis_stats',
        description: 'Get Redis cache statistics and status',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'redis_get',
        description: 'Get a value from Redis cache by key',
        inputSchema: {
          type: 'object',
          properties: {
            key: {
              type: 'string',
              description: 'Cache key to retrieve',
            },
          },
          required: ['key'],
        },
      },
      {
        name: 'redis_set',
        description: 'Set a value in Redis cache',
        inputSchema: {
          type: 'object',
          properties: {
            key: {
              type: 'string',
              description: 'Cache key',
            },
            value: {
              type: 'string',
              description: 'JSON value to cache',
            },
            ttl: {
              type: 'number',
              description: 'Time to live in seconds (default: 300)',
            },
          },
          required: ['key', 'value'],
        },
      },
      {
        name: 'redis_delete',
        description: 'Delete a key from Redis cache',
        inputSchema: {
          type: 'object',
          properties: {
            key: {
              type: 'string',
              description: 'Cache key to delete',
            },
          },
          required: ['key'],
        },
      },
      {
        name: 'redis_delete_pattern',
        description: 'Delete all keys matching a pattern',
        inputSchema: {
          type: 'object',
          properties: {
            pattern: {
              type: 'string',
              description: 'Pattern to match (e.g., analytics:*)',
            },
          },
          required: ['pattern'],
        },
      },
      {
        name: 'redis_flush',
        description: 'Flush all data from Redis cache',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'cache_keys_list',
        description: 'List all cache key patterns and their TTLs',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

/**
 * Expose server for testing
 */
export const redisMcpServer = server;

/**
 * Start the MCP server over stdio
 */
export async function startRedisMcpServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log('✅ Redis MCP Server started');
}

// Start server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startRedisMcpServer().catch(console.error);
}
