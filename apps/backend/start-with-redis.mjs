#!/usr/bin/env node

/**
 * Start API Server with Redis
 * Automatically starts Redis + API Server in one command
 *
 * Usage: npm run server:auto
 * Or: node start-with-redis.mjs
 */

import { spawn } from 'child_process';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

/**
 * Check if Redis is already running
 */
async function isRedisRunning() {
  try {
    await execPromise('redis-cli ping');
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Start Redis server
 */
function startRedis() {
  console.log('\n🚀 Starting Redis server...');

  let redisProcess;

  // Detect OS and start Redis accordingly
  const isWindows = process.platform === 'win32';

  if (isWindows) {
    // Windows: Try redis-server command
    redisProcess = spawn('redis-server', [], {
      detached: false,
      stdio: 'inherit',
      shell: true,
    });
  } else {
    // macOS/Linux: Use redis-server
    redisProcess = spawn('redis-server', [], {
      detached: false,
      stdio: 'inherit',
    });
  }

  redisProcess.on('error', (error) => {
    console.error('❌ Failed to start Redis:', error.message);
    console.error('\n📝 Redis may not be installed or available in PATH');
    console.error('   Install Redis or add it to your PATH');
    process.exit(1);
  });

  redisProcess.on('exit', (code) => {
    console.log(`\n⚠️ Redis exited with code ${code}`);
  });

  return redisProcess;
}

/**
 * Start API Server
 */
function startApiServer() {
  console.log('\n🚀 Starting API Server...\n');

  const apiProcess = spawn('node', ['src/api-server.mjs'], {
    cwd: process.cwd(),
    detached: false,
    stdio: 'inherit',
  });

  apiProcess.on('error', (error) => {
    console.error('❌ Failed to start API Server:', error.message);
    process.exit(1);
  });

  apiProcess.on('exit', (code) => {
    console.log(`\n⚠️ API Server exited with code ${code}`);
    process.exit(code || 0);
  });

  return apiProcess;
}

/**
 * Main startup routine
 */
async function main() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   Starting Redis + API Server Stack   ║');
  console.log('╚════════════════════════════════════════╝');

  // Check if Redis is already running
  try {
    const redisAlreadyRunning = await isRedisRunning();
    if (redisAlreadyRunning) {
      console.log('✅ Redis is already running on port 6379');
    } else {
      console.log('❌ Redis is not running, attempting to start...');
      const redisProcess = startRedis();

      // Wait 2 seconds for Redis to start
      console.log('⏳ Waiting for Redis to initialize (2s)...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify Redis started
      const redisStarted = await isRedisRunning();
      if (!redisStarted) {
        console.error('❌ Failed to start Redis');
        console.error('\n💡 Please start Redis manually:');
        console.error('   docker run -p 6379:6379 redis:latest');
        process.exit(1);
      }

      console.log('✅ Redis started successfully!');
    }
  } catch (error) {
    console.error('⚠️ Error checking Redis:', error.message);
  }

  // Start API Server
  const apiProcess = startApiServer();

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n\n📋 Shutting down gracefully...');
    apiProcess.kill('SIGINT');
    console.log('✅ API Server stopped');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n\n📋 Shutting down gracefully...');
    apiProcess.kill('SIGTERM');
    console.log('✅ API Server stopped');
    process.exit(0);
  });
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
