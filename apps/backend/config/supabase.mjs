// Supabase Configuration Module

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://vecofrvxrepogtigmeyj.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('✅ Supabase client initialized');
