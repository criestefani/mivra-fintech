// Supabase Configuration Module
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;  // ← Use esta já que existe

console.log('DEBUG - URL exists:', !!SUPABASE_URL);
console.log('DEBUG - SERVICE_KEY exists:', !!SUPABASE_KEY);

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase environment variables:');
  console.error('SUPABASE_URL:', SUPABASE_URL);
  console.error('SUPABASE_SERVICE_KEY:', SUPABASE_KEY ? 'EXISTS' : 'MISSING');
  throw new Error('Missing required Supabase environment variables');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('✅ Supabase client initialized');
