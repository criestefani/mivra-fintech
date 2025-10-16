// Scanner Performance Table Initialization
// Creates scanner_performance table if it doesn't exist
// This table aggregates performance data from strategy_trades for the Market Scanner UI

import { supabase } from '../config/supabase.mjs';

export const initScannerPerformanceTable = async () => {
  try {
    console.log('🔧 [ScannerPerformanceInit] Checking scanner_performance table...');

    // Try to query the table to see if it exists
    const { error: checkError, data: existing } = await supabase
      .from('scanner_performance')
      .select('count(*)', { count: 'exact', head: true });

    if (!checkError) {
      console.log(`✅ [ScannerPerformanceInit] Table exists and is accessible`);
      return true;
    }

    if (checkError.code === 'PGRST116') {
      // Table doesn't exist, need to create it
      console.log(`⚠️  [ScannerPerformanceInit] Table does not exist. Cannot create via REST API.`);
      console.log(`   Please create the table manually in Supabase with:`);
      console.log(`\n   CREATE TABLE IF NOT EXISTS scanner_performance (`);
      console.log(`     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),`);
      console.log(`     active_id VARCHAR NOT NULL,`);
      console.log(`     ativo_nome VARCHAR NOT NULL,`);
      console.log(`     timeframe INTEGER NOT NULL,`);
      console.log(`     total_signals INTEGER DEFAULT 0,`);
      console.log(`     total_wins INTEGER DEFAULT 0,`);
      console.log(`     total_losses INTEGER DEFAULT 0,`);
      console.log(`     win_rate NUMERIC(5,2) DEFAULT 0,`);
      console.log(`     last_updated TIMESTAMP DEFAULT NOW(),`);
      console.log(`     created_at TIMESTAMP DEFAULT NOW(),`);
      console.log(`     UNIQUE(active_id, ativo_nome, timeframe)`);
      console.log(`   );\n`);
      console.log(`   Then create indexes:`);
      console.log(`   CREATE INDEX idx_scanner_performance_win_rate ON scanner_performance(win_rate DESC);`);
      console.log(`   CREATE INDEX idx_scanner_performance_signals ON scanner_performance(total_signals DESC);\n`);
      return false;
    }

    console.log(`⚠️  [ScannerPerformanceInit] Error checking table: ${checkError.message}`);
    return false;
  } catch (error) {
    console.error(`❌ [ScannerPerformanceInit] Unexpected error: ${error.message}`);
    return false;
  }
};

export default initScannerPerformanceTable;
