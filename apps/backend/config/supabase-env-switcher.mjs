// Supabase Environment Switcher
// Automatically selects between local development and production based on environment

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Detect which environment to use
 * Priority:
 * 1. SUPABASE_ENV environment variable (explicit: 'local' or 'production')
 * 2. NODE_ENV environment variable (development = local, production = production)
 * 3. Default to production for safety
 */
export const detectEnvironment = () => {
  const explicitEnv = process.env.SUPABASE_ENV?.toLowerCase();
  if (explicitEnv === 'local' || explicitEnv === 'development') {
    return 'local';
  }
  if (explicitEnv === 'production') {
    return 'production';
  }

  const nodeEnv = process.env.NODE_ENV?.toLowerCase();
  if (nodeEnv === 'development') {
    return 'local';
  }

  // Default to production for safety
  return 'production';
};

/**
 * Load environment variables with support for .env.local override
 */
export const loadEnvironmentConfig = () => {
  const env = detectEnvironment();
  const isDevelopment = env === 'local';

  console.log(`🔧 [SupabaseEnvSwitcher] Detected environment: ${env.toUpperCase()}`);

  if (isDevelopment) {
    // Try to load .env.local
    const envLocalPath = path.resolve(__dirname, '../.env.local');
    if (fs.existsSync(envLocalPath)) {
      console.log(`📝 [SupabaseEnvSwitcher] Loading .env.local from: ${envLocalPath}`);
    } else {
      console.warn(`⚠️  [SupabaseEnvSwitcher] .env.local not found at: ${envLocalPath}`);
      console.warn(`    Using default .env instead (which may have production settings)`);
    }
  }

  return {
    environment: env,
    isDevelopment,
    isProduction: env === 'production',
    isLocal: env === 'local'
  };
};

/**
 * Get Supabase URLs based on current environment
 */
export const getSupabaseConfig = () => {
  const envConfig = loadEnvironmentConfig();

  const config = {
    url: process.env.SUPABASE_URL,
    serviceKey: process.env.SUPABASE_SERVICE_KEY,
    anonKey: process.env.SUPABASE_ANON_KEY,
    ...envConfig
  };

  // Validate configuration
  if (!config.url) {
    throw new Error('❌ SUPABASE_URL is not configured');
  }
  if (!config.serviceKey) {
    throw new Error('❌ SUPABASE_SERVICE_KEY is not configured');
  }

  // Log which Supabase instance we're connecting to
  if (config.isLocal) {
    console.log(`🌐 Connecting to LOCAL Supabase: ${config.url}`);
  } else {
    console.log(`🌐 Connecting to PRODUCTION Supabase`);
  }

  return config;
};

/**
 * Show helpful information about environment switching
 */
export const showEnvironmentInfo = () => {
  const config = getSupabaseConfig();

  console.log(`
================================================================================
🔧 SUPABASE ENVIRONMENT CONFIGURATION
================================================================================
Environment:    ${config.environment.toUpperCase()}
Supabase URL:   ${config.url}
Node Env:       ${process.env.NODE_ENV || 'not set'}
Supabase Env:   ${process.env.SUPABASE_ENV || 'not set'}

💡 How to switch environments:
   • LOCAL:       SUPABASE_ENV=local npm start
   • PRODUCTION:  SUPABASE_ENV=production npm start
   • Or set NODE_ENV=development for local, NODE_ENV=production for prod

📝 Configuration files:
   • .env         (default, currently ${config.isProduction ? 'USED' : 'overridden'})
   • .env.local   (for local development, currently ${config.isLocal ? 'USED' : 'NOT used'})
================================================================================
`);
};

export default {
  detectEnvironment,
  loadEnvironmentConfig,
  getSupabaseConfig,
  showEnvironmentInfo
};
