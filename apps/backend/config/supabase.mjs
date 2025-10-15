// Supabase Configuration Module

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vecofrvxrepogtigmeyj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlY29mcnZ4cmVwb2d0aWdtZXlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTI1NzQ1NSwiZXhwIjoyMDc0ODMzNDU1fQ.XQ57yvXp8mJc4ZE_cYnailskaPDFAhUSaUHNDbRZaOc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('✅ Supabase client initialized');
