/**
 * PM2 Ecosystem Configuration
 * Manages Redis, API Server, and Market Scanner
 *
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 status
 *   pm2 logs
 *   pm2 stop all
 *   pm2 restart all
 */

module.exports = {
  apps: [
    // ============================================
    // Redis Cache Server
    // ============================================
    {
      name: 'redis',
      script: process.platform === 'win32'
        ? 'C:\\Program Files\\Redis\\redis-server.exe'
        : 'redis-server',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      ignore_watch: ['node_modules', 'logs'],
      error_file: './logs/redis-error.log',
      out_file: './logs/redis-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development'
      },
      // Health check
      listen_timeout: 3000,
      kill_timeout: 5000,
      // Ignorar se Redis não conseguir iniciar
      node_args: '--enable-source-maps',
      interpreter_args: '--port 6379'
    },

    // ============================================
    // API Server (Main application)
    // ============================================
    {
      name: 'api-server',
      script: './src/api-server.mjs',
      instances: 1,
      exec_mode: 'fork',
      watch: ['src/'], // Auto-reload on file changes
      ignore_watch: ['node_modules', 'logs', '.env'],
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 4001,
        REDIS_URL: 'redis://localhost:6379'
      },
      // Only start after Redis is healthy
      wait_ready: true,
      listen_timeout: 3000,
      kill_timeout: 5000
    },

    // ============================================
    // Market Scanner (Optional - comment to disable)
    // ============================================
    {
      name: 'market-scanner',
      script: './start-market-scanner.mjs',
      instances: 1,
      exec_mode: 'fork',
      watch: ['src/'],
      ignore_watch: ['node_modules', 'logs', '.env'],
      error_file: './logs/scanner-error.log',
      out_file: './logs/scanner-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '800M',
      env: {
        NODE_ENV: 'development',
        REDIS_URL: 'redis://localhost:6379'
      },
      // Only start after API server is ready
      wait_ready: true,
      listen_timeout: 3000,
      kill_timeout: 5000
    }
  ],

  // ============================================
  // Deployment Configuration
  // ============================================
  deploy: {
    production: {
      user: 'node',
      host: 'localhost',
      ref: 'origin/main',
      repo: 'git@github.com:mivra/fintech.git',
      path: '/var/www/mivra-bot',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
};
