#!/usr/bin/env node

/**
 * Simple startup script for Market Scanner and API Server
 * Run this instead of using PM2 if having issues
 *
 * Usage: node run-all.mjs
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n' + '='.repeat(80));
console.log('🚀 Starting Application Stack');
console.log('='.repeat(80) + '\n');

// Start API Server
console.log('▶️  Starting API Server...\n');
const apiServer = spawn('node', ['src/api-server.mjs'], {
  cwd: __dirname,
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'development', PORT: 4001 }
});

apiServer.on('exit', (code) => {
  console.log(`\n❌ API Server exited with code ${code}`);
  process.exit(code);
});

// Give API server 5 seconds to start before launching market scanner
setTimeout(() => {
  console.log('\n▶️  Starting Market Scanner...\n');
  const marketScanner = spawn('node', ['start-market-scanner.mjs'], {
    cwd: __dirname,
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'development' }
  });

  marketScanner.on('exit', (code) => {
    console.log(`\n⚠️  Market Scanner exited with code ${code}`);
  });

  // Handle termination
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down...');
    apiServer.kill('SIGINT');
    marketScanner.kill('SIGINT');
    setTimeout(() => {
      process.exit(0);
    }, 2000);
  });
}, 5000);

// Handle API server errors
apiServer.on('error', (err) => {
  console.error('❌ Failed to start API Server:', err.message);
  process.exit(1);
});

console.log('✅ Application stack initialized\n');
console.log('Available endpoints:');
console.log('  • API Server: http://localhost:4001');
console.log('  • WebSocket: ws://localhost:4001');
console.log('\nPress Ctrl+C to stop\n');
