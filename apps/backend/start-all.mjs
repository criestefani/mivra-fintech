import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('\n================================================================================');
console.log('🚀 Starting Backend Server + Market Scanner');
console.log('================================================================================\n');

// Spawn server
const server = spawn('node', ['src/api-server.mjs'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

// Spawn scanner
const scanner = spawn('node', ['start-market-scanner.mjs'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

// Handle termination
process.on('SIGINT', () => {
  console.log('\n\n⚠️ Shutting down...');
  server.kill();
  scanner.kill();
  process.exit(0);
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
});

scanner.on('error', (err) => {
  console.error('❌ Scanner error:', err);
});

console.log(`
✅ Backend Server iniciado (PID: ${server.pid})
✅ Market Scanner iniciado (PID: ${scanner.pid})

📍 API: http://localhost:4001
📊 Scanner: Monitorando 141 assets

Pressione Ctrl+C para parar...
`);
