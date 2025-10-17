// 🧹 AUTOMATED CLEANUP SCRIPT - Orphaned Trades via REST API
// Alternative to SQL Editor - executes cleanup programmatically

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://vecofrvxrepogtigmeyj.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlY29mcnZ4cmVwb2d0aWdtZXlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTI1NzQ1NSwiZXhwIjoyMDc0ODMzNDU1fQ.XQ57yvXp8mJc4ZE_cYnailskaPDFAhUSaUHNDbRZaOc";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

console.log('\n' + '='.repeat(80));
console.log('🧹 AUTOMATED CLEANUP - Orphaned Trades');
console.log('='.repeat(80));
console.log('Target: 6066 orphaned PENDING trades (>10 minutes old)\n');

async function cleanup() {
  try {
    // ========================================================================
    // Step 1: Pre-cleanup diagnostics
    // ========================================================================
    console.log('📊 Step 1: Pre-cleanup diagnostics...\n');

    const { count: totalBefore } = await supabase
      .from('strategy_trades')
      .select('*', { count: 'exact', head: true });

    const { count: pendingBefore } = await supabase
      .from('strategy_trades')
      .select('*', { count: 'exact', head: true })
      .eq('result', 'PENDING');

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count: orphanedBefore } = await supabase
      .from('strategy_trades')
      .select('*', { count: 'exact', head: true })
      .eq('result', 'PENDING')
      .lt('signal_timestamp', tenMinutesAgo);

    console.log(`   Total trades:        ${totalBefore}`);
    console.log(`   Pending trades:      ${pendingBefore}`);
    console.log(`   Orphaned (>10min):   ${orphanedBefore}`);
    console.log('');

    if (orphanedBefore === 0) {
      console.log('✅ No orphaned trades to clean. Exiting.\n');
      return;
    }

    // ========================================================================
    // Step 2: Sample orphaned trades
    // ========================================================================
    console.log('📊 Step 2: Sample of orphaned trades (oldest 5)...\n');

    const { data: sample } = await supabase
      .from('strategy_trades')
      .select('id, ativo_nome, signal_timestamp, result')
      .eq('result', 'PENDING')
      .lt('signal_timestamp', tenMinutesAgo)
      .order('signal_timestamp', { ascending: true })
      .limit(5);

    if (sample && sample.length > 0) {
      sample.forEach((trade, i) => {
        const age = Math.floor((Date.now() - new Date(trade.signal_timestamp).getTime()) / 60000);
        console.log(`   ${i+1}. ${trade.ativo_nome} | ${age} min old | ${trade.id.substring(0,8)}`);
      });
      console.log('');
    }

    // ========================================================================
    // Step 3: UPDATE orphaned trades to TIMEOUT
    // ========================================================================
    console.log('🔄 Step 3: Marking orphaned trades as TIMEOUT...');

    const { data: updated, error: updateError } = await supabase
      .from('strategy_trades')
      .update({
        result: 'TIMEOUT',
        result_timestamp: new Date().toISOString()
      })
      .eq('result', 'PENDING')
      .lt('signal_timestamp', tenMinutesAgo)
      .select('id');

    if (updateError) {
      throw new Error(`Update failed: ${updateError.message}`);
    }

    const updatedCount = updated ? updated.length : 0;
    console.log(`   ✅ Marked ${updatedCount} trades as TIMEOUT\n`);

    // ========================================================================
    // Step 4: Verify UPDATE
    // ========================================================================
    console.log('📊 Step 4: Verifying UPDATE...\n');

    const { count: timeoutCount } = await supabase
      .from('strategy_trades')
      .select('*', { count: 'exact', head: true })
      .eq('result', 'TIMEOUT');

    const { count: pendingAfterUpdate } = await supabase
      .from('strategy_trades')
      .select('*', { count: 'exact', head: true })
      .eq('result', 'PENDING');

    console.log(`   TIMEOUT trades:      ${timeoutCount}`);
    console.log(`   Remaining PENDING:   ${pendingAfterUpdate}`);
    console.log('');

    // ========================================================================
    // Step 5: DELETE old trades (>2 hours)
    // ========================================================================
    console.log('🗑️  Step 5: Deleting old trades (>2 hours)...');

    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    // Delete TIMEOUT trades
    const { error: deleteTimeoutError } = await supabase
      .from('strategy_trades')
      .delete()
      .eq('result', 'TIMEOUT')
      .lt('signal_timestamp', twoHoursAgo);

    if (deleteTimeoutError) {
      console.log(`   ⚠️  Error deleting TIMEOUT trades: ${deleteTimeoutError.message}`);
    } else {
      console.log(`   ✅ Deleted old TIMEOUT trades`);
    }

    // Delete completed trades (WIN/LOSS)
    const { error: deleteCompletedError } = await supabase
      .from('strategy_trades')
      .delete()
      .in('result', ['WIN', 'LOSS'])
      .lt('signal_timestamp', twoHoursAgo);

    if (deleteCompletedError) {
      console.log(`   ⚠️  Error deleting completed trades: ${deleteCompletedError.message}`);
    } else {
      console.log(`   ✅ Deleted old completed trades (WIN/LOSS)`);
    }

    console.log('');

    // ========================================================================
    // Step 6: Final diagnostics
    // ========================================================================
    console.log('📊 Step 6: Post-cleanup diagnostics...\n');

    const { count: totalAfter } = await supabase
      .from('strategy_trades')
      .select('*', { count: 'exact', head: true });

    const { count: pendingAfter } = await supabase
      .from('strategy_trades')
      .select('*', { count: 'exact', head: true })
      .eq('result', 'PENDING');

    const { count: timeoutAfter } = await supabase
      .from('strategy_trades')
      .select('*', { count: 'exact', head: true })
      .eq('result', 'TIMEOUT');

    const { count: winAfter } = await supabase
      .from('strategy_trades')
      .select('*', { count: 'exact', head: true })
      .eq('result', 'WIN');

    const { count: lossAfter } = await supabase
      .from('strategy_trades')
      .select('*', { count: 'exact', head: true })
      .eq('result', 'LOSS');

    console.log(`   Total trades:        ${totalAfter} (was ${totalBefore})`);
    console.log(`   PENDING trades:      ${pendingAfter} (was ${pendingBefore})`);
    console.log(`   TIMEOUT trades:      ${timeoutAfter}`);
    console.log(`   WIN trades:          ${winAfter}`);
    console.log(`   LOSS trades:         ${lossAfter}`);
    console.log('');

    // ========================================================================
    // Summary
    // ========================================================================
    console.log('='.repeat(80));
    console.log('✅ CLEANUP COMPLETE');
    console.log('='.repeat(80));
    console.log(`Orphaned trades cleaned:  ${updatedCount}`);
    console.log(`Table reduced from:       ${totalBefore} → ${totalAfter} records`);
    console.log(`Reduction:                ${((totalBefore - totalAfter) / totalBefore * 100).toFixed(1)}%`);
    console.log('='.repeat(80));
    console.log('\n✅ Database is now clean and ready for architecture fixes!\n');

  } catch (error) {
    console.error('\n❌ CLEANUP FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Execute cleanup
cleanup();
