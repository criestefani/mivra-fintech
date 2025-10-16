// Market Scanner Startup Script
// Runs market-scanner.mjs as a standalone process

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n' + '='.repeat(80));
console.log('🚀 Starting Market Scanner Process');
console.log('='.repeat(80) + '\n');

// Spawn market-scanner.mjs as a child process
const scanner = spawn('node', ['src/bot/market-scanner.mjs'], {
  cwd: __dirname,
  stdio: 'inherit', // Forward stdout/stderr to parent process
  env: { ...process.env }
});

// Handle scanner process events
scanner.on('spawn', () => {
  console.log(`✅ Market Scanner started with PID: ${scanner.pid}`);
  console.log('📊 Scanning 141 assets across 5 timeframes every 10 seconds');
  console.log('📡 Data will be saved to strategy_trades table');
  console.log('🔄 Real-time updates via scanner_performance table\n');
});

scanner.on('error', (error) => {
  console.error('❌ Failed to start market scanner:', error.message);
  process.exit(1);
});

scanner.on('exit', (code, signal) => {
  if (code !== null) {
    console.log(`\n⚠️ Market Scanner exited with code ${code}`);
  }
  if (signal !== null) {
    console.log(`\n⚠️ Market Scanner terminated by signal ${signal}`);
  }

  // Auto-restart on unexpected exit
  if (code !== 0 && signal !== 'SIGTERM' && signal !== 'SIGINT') {
    console.log('🔄 Restarting market scanner in 5 seconds...\n');
    setTimeout(() => {
      console.log('♻️ Restarting market scanner...');
      // Re-import and run this script
      import('./start-market-scanner.mjs');
    }, 5000);
  } else {
    process.exit(code);
  }
});

// Handle termination signals gracefully
process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, stopping market scanner...');
  scanner.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, stopping market scanner...');
  scanner.kill('SIGINT');
  process.exit(0);
});
