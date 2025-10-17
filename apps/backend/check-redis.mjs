#!/usr/bin/env node

/**
 * Redis Availability Checker
 * Verifies if Redis is installed and accessible
 */

import { execSync } from 'child_process';

const isWindows = process.platform === 'win32';

function checkRedis() {
  try {
    if (isWindows) {
      try {
        execSync('redis-server.exe --version', { stdio: 'pipe' });
      } catch (e) {
        // Try full path if not in PATH
        execSync('"C:\\Program Files\\Redis\\redis-server.exe" --version', { stdio: 'pipe' });
      }
    } else {
      execSync('redis-server --version', { stdio: 'pipe' });
    }
    return true;
  } catch (e) {
    return false;
  }
}

function isRedisRunning() {
  try {
    try {
      execSync('redis-cli ping', { stdio: 'pipe' });
    } catch (e) {
      if (isWindows) {
        // Try full path if not in PATH
        execSync('"C:\\Program Files\\Redis\\redis-cli.exe" ping', { stdio: 'pipe' });
      } else {
        throw e;
      }
    }
    return true;
  } catch (e) {
    return false;
  }
}

console.log('\n🔍 Checking Redis availability...\n');

const redisInstalled = checkRedis();
const redisRunning = isRedisRunning();

if (redisInstalled) {
  console.log('✅ Redis is installed');
} else {
  console.log('❌ Redis is NOT installed');
}

if (redisRunning) {
  console.log('✅ Redis is running on port 6379');
} else if (redisInstalled) {
  console.log('⚠️  Redis is installed but not running');
  console.log('   You can start it with: redis-server');
} else {
  console.log('❌ Redis is not running (not installed)\n');
  console.log('📝 Install Redis:\n');

  if (isWindows) {
    console.log('   Windows:');
    console.log('   1. Download: https://github.com/microsoftarchive/redis/releases');
    console.log('   2. Extract and run: redis-server.exe');
    console.log('   3. Or use Docker: docker run -p 6379:6379 redis:latest\n');
  } else if (process.platform === 'darwin') {
    console.log('   macOS:');
    console.log('   brew install redis');
    console.log('   redis-server\n');
  } else {
    console.log('   Linux:');
    console.log('   sudo apt-get install redis-server');
    console.log('   redis-server\n');
  }
}

console.log('📊 Status Summary:');
console.log(`   Platform: ${isWindows ? 'Windows' : process.platform === 'darwin' ? 'macOS' : 'Linux'}`);
console.log(`   Installed: ${redisInstalled ? '✅' : '❌'}`);
console.log(`   Running: ${redisRunning ? '✅' : '❌'}\n`);

if (!redisInstalled && !redisRunning) {
  process.exit(1);
}

process.exit(0);
