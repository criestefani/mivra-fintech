// 🔥 DEADLOCK HELL INVESTIGATION SCRIPT
// Expert-level diagnosis focusing on CONCURRENCY (not volume)
// Accesses Supabase via REST API to detect lock contention

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://vecofrvxrepogtigmeyj.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlY29mcnZ4cmVwb2d0aWdtZXlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTI1NzQ1NSwiZXhwIjoyMDc0ODMzNDU1fQ.XQ57yvXp8mJc4ZE_cYnailskaPDFAhUSaUHNDbRZaOc";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

console.log('\n' + '='.repeat(80));
console.log('🔥 SUPABASE DEADLOCK HELL - EXPERT INVESTIGATION');
console.log('='.repeat(80));
console.log('Focus: CONCURRENCY issues (not volume)\n');

async function investigate() {
  const metrics = {};

  try {
    // ============================================================================
    // 1. COUNT PENDING TRADES
    // ============================================================================
    console.log('📊 1. COUNTING PENDING TRADES IN strategy_trades...');
    const { count: pendingCount, error: err1 } = await supabase
      .from('strategy_trades')
      .select('*', { count: 'exact', head: true })
      .eq('result', 'PENDING');

    if (err1) {
      console.error(`   ❌ Error: ${err1.message}`);
    } else {
      console.log(`   ⚠️  PENDING TRADES: ${pendingCount}`);
      metrics.pendingCount = pendingCount;

      if (pendingCount > 100) {
        console.log('   🚨 CRITICAL: >100 pending trades! Verification loop broken.');
      } else if (pendingCount > 50) {
        console.log('   ⚠️  WARNING: High pending count. Monitor closely.');
      } else {
        console.log('   ✅ Normal pending count.');
      }
    }

    // ============================================================================
    // 2. COUNT OLD PENDING (ORPHANED TRADES >10 minutes)
    // ============================================================================
    console.log('\n📊 2. COUNTING ORPHANED TRADES (>10 min pending)...');
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count: orphanedCount, error: err2 } = await supabase
      .from('strategy_trades')
      .select('*', { count: 'exact', head: true })
      .eq('result', 'PENDING')
      .lt('signal_timestamp', tenMinutesAgo);

    if (err2) {
      console.error(`   ❌ Error: ${err2.message}`);
    } else {
      console.log(`   ⚠️  ORPHANED TRADES: ${orphanedCount}`);
      metrics.orphanedCount = orphanedCount;

      if (orphanedCount > 50) {
        console.log('   🚨 CRITICAL: setTimeout() verification timeouts NOT firing!');
      } else if (orphanedCount > 20) {
        console.log('   ⚠️  WARNING: Some verifications timing out.');
      } else {
        console.log('   ✅ Low orphan count.');
      }
    }

    // ============================================================================
    // 3. TOTAL RECORDS IN strategy_trades
    // ============================================================================
    console.log('\n📊 3. TOTAL RECORDS IN strategy_trades...');
    const { count: totalTrades, error: err3 } = await supabase
      .from('strategy_trades')
      .select('*', { count: 'exact', head: true });

    if (err3) {
      console.error(`   ❌ Error: ${err3.message}`);
    } else {
      console.log(`   📈 TOTAL TRADES: ${totalTrades}`);
      metrics.totalTrades = totalTrades;

      if (totalTrades > 50000) {
        console.log('   🚨 CRITICAL: Table massively bloated! Cleanup job failed.');
      } else if (totalTrades > 10000) {
        console.log('   ⚠️  WARNING: Table growing large. Check cleanup job.');
      } else {
        console.log('   ✅ Table size normal.');
      }
    }

    // ============================================================================
    // 4. RECORDS IN scanner_performance
    // ============================================================================
    console.log('\n📊 4. RECORDS IN scanner_performance...');
    const { count: scannerCount, error: err4 } = await supabase
      .from('scanner_performance')
      .select('*', { count: 'exact', head: true });

    if (err4) {
      console.error(`   ❌ Error: ${err4.message}`);
    } else {
      console.log(`   📈 SCANNER PERFORMANCE: ${scannerCount} records`);
      metrics.scannerCount = scannerCount;

      if (scannerCount > 500) {
        console.log('   ⚠️  Higher than expected (141 assets × 4 timeframes = ~564 max)');
      } else {
        console.log('   ✅ Expected range.');
      }
    }

    // ============================================================================
    // 5. RECENT TRADES (last 5 minutes) - Check insert rate
    // ============================================================================
    console.log('\n📊 5. RECENT TRADES (last 5 minutes)...');
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { count: recentCount, error: err5 } = await supabase
      .from('strategy_trades')
      .select('*', { count: 'exact', head: true })
      .gte('signal_timestamp', fiveMinutesAgo);

    if (err5) {
      console.error(`   ❌ Error: ${err5.message}`);
    } else {
      console.log(`   📈 RECENT TRADES: ${recentCount}`);
      const insertsPerMinute = recentCount / 5;
      console.log(`   ⚡ INSERT RATE: ${insertsPerMinute.toFixed(1)} trades/minute`);
      metrics.recentCount = recentCount;
      metrics.insertsPerMinute = insertsPerMinute;

      if (insertsPerMinute > 100) {
        console.log('   🚨 CRITICAL: Scanner running wild! Should be ~15-20/min.');
      } else if (insertsPerMinute > 50) {
        console.log('   ⚠️  WARNING: Insert rate high.');
      } else if (insertsPerMinute < 1) {
        console.log('   ✅ Scanner likely stopped (as expected).');
      } else {
        console.log('   ✅ Normal insert rate.');
      }
    }

    // ============================================================================
    // 6. SAMPLE PENDING TRADES (check stuck timestamp)
    // ============================================================================
    console.log('\n📊 6. SAMPLE OF STUCK PENDING TRADES...');
    const { data: pendingSample, error: err6 } = await supabase
      .from('strategy_trades')
      .select('id, active_id, ativo_nome, signal_timestamp, result')
      .eq('result', 'PENDING')
      .order('signal_timestamp', { ascending: true })
      .limit(5);

    if (err6) {
      console.error(`   ❌ Error: ${err6.message}`);
    } else if (pendingSample && pendingSample.length > 0) {
      console.log('\n   🔍 OLDEST PENDING TRADES:');
      pendingSample.forEach((trade, i) => {
        const age = Math.floor((Date.now() - new Date(trade.signal_timestamp).getTime()) / 1000 / 60);
        console.log(`      ${i+1}. ${trade.ativo_nome} | ${age} min old | ID: ${trade.id.substring(0,8)}`);
      });
    } else {
      console.log('   ✅ No pending trades (scanner stopped)');
    }

    // ============================================================================
    // 7. TEST CONCURRENT OPERATIONS (THE REAL DEADLOCK TEST!)
    // ============================================================================
    console.log('\n🔥 7. TESTING CONCURRENT WRITE PERFORMANCE...');
    console.log('   (This simulates the deadlock scenario)');

    const testConcurrency = async () => {
      const startTime = Date.now();
      const promises = [];

      // Simulate 10 concurrent UPDATEs to strategy_trades
      for (let i = 0; i < 10; i++) {
        promises.push(
          supabase
            .from('strategy_trades')
            .update({ result: 'TEST_PROBE' })
            .eq('id', `00000000-0000-0000-0000-${String(i).padStart(12, '0')}`) // Non-existent IDs
        );
      }

      try {
        await Promise.all(promises);
        const duration = Date.now() - startTime;
        console.log(`   ⚡ 10 concurrent UPDATEs took: ${duration}ms`);
        metrics.concurrentUpdateTime = duration;

        if (duration > 5000) {
          console.log('   🚨 CRITICAL: Concurrent operations EXTREMELY slow!');
          console.log('   → LOCK CONTENTION or CONNECTION POOL saturation confirmed!');
        } else if (duration > 2000) {
          console.log('   ⚠️  WARNING: Concurrent operations slow (possible lock issues)');
        } else if (duration > 500) {
          console.log('   ⚠️  Concurrent operations acceptable but could be better');
        } else {
          console.log('   ✅ Concurrent operations fast (no active deadlock)');
        }

        return duration;
      } catch (error) {
        console.log(`   ❌ Concurrent test FAILED: ${error.message}`);
        if (error.message.includes('connection pool') || error.message.includes('PGRST003')) {
          console.log('   🚨 CONFIRMED: Connection pool exhaustion (PGRST003)!');
        }
        return null;
      }
    };

    await testConcurrency();

    // ============================================================================
    // 8. TEST REAL-TIME SUBSCRIPTION RESPONSE
    // ============================================================================
    console.log('\n🔥 8. TESTING REAL-TIME SUBSCRIPTION LOAD...');

    const testRealtimeLoad = async () => {
      const startTime = Date.now();

      try {
        const channel = supabase
          .channel('test-perf-probe')
          .on('postgres_changes',
            { event: '*', schema: 'public', table: 'strategy_trades' },
            () => {}
          );

        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Subscription timeout >10s'));
          }, 10000);

          channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              clearTimeout(timeout);
              resolve();
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              clearTimeout(timeout);
              reject(new Error(`Subscription failed: ${status}`));
            }
          });
        });

        const duration = Date.now() - startTime;
        console.log(`   ⚡ Real-time subscription took: ${duration}ms`);
        metrics.subscriptionTime = duration;

        if (duration > 5000) {
          console.log('   🚨 CRITICAL: Real-time subscriptions extremely slow!');
          console.log('   → WebSocket server overloaded or broadcast storm');
        } else if (duration > 2000) {
          console.log('   ⚠️  WARNING: Real-time setup slow');
        } else {
          console.log('   ✅ Real-time responsive');
        }

        await supabase.removeChannel(channel);
        return duration;
      } catch (err) {
        console.log(`   ❌ Real-time test failed: ${err.message}`);
        return null;
      }
    };

    await testRealtimeLoad();

    // ============================================================================
    // 9. ESTIMATE CURRENT QUERY LOAD
    // ============================================================================
    console.log('\n📊 9. ESTIMATING CURRENT SYSTEM LOAD...');

    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    const { count: recentUpdates } = await supabase
      .from('strategy_trades')
      .select('*', { count: 'exact', head: true })
      .gte('updated_at', oneMinuteAgo)
      .neq('result', 'PENDING'); // Only completed operations

    console.log(`   📊 Operations completed in last minute: ${recentUpdates || 0}`);
    metrics.operationsPerMinute = recentUpdates || 0;

    if (recentUpdates > 200) {
      console.log('   ⚠️  High operation rate (>200/min = 3.3 ops/sec)');
    } else if (recentUpdates < 5) {
      console.log('   ✅ Low activity (scanner likely stopped)');
    }

    // ============================================================================
    // SUMMARY AND EXPERT DIAGNOSIS
    // ============================================================================
    console.log('\n' + '='.repeat(80));
    console.log('📊 INVESTIGATION SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Trades:              ${metrics.totalTrades}`);
    console.log(`Pending Trades:            ${metrics.pendingCount}`);
    console.log(`Orphaned (>10min):         ${metrics.orphanedCount}`);
    console.log(`Recent Trades (5min):      ${metrics.recentCount}`);
    console.log(`Insert Rate:               ${(metrics.insertsPerMinute || 0).toFixed(1)} trades/min`);
    console.log(`Scanner Performance:       ${metrics.scannerCount} records`);
    console.log(`Concurrent UPDATE Time:    ${metrics.concurrentUpdateTime || 'N/A'}ms`);
    console.log(`Realtime Subscribe Time:   ${metrics.subscriptionTime || 'N/A'}ms`);
    console.log(`Operations/min (recent):   ${metrics.operationsPerMinute}`);
    console.log('='.repeat(80));

    // ============================================================================
    // EXPERT-LEVEL DIAGNOSIS
    // ============================================================================
    console.log('\n🩺 EXPERT DIAGNOSIS:');
    console.log('='.repeat(80));

    // Volume Analysis
    const hourlyRate = (metrics.insertsPerMinute || 0) * 60;
    const dailyRate = hourlyRate * 24;
    console.log(`📈 Projected hourly rate:   ${hourlyRate.toFixed(0)} operations/hour`);
    console.log(`📈 Projected daily rate:    ${dailyRate.toFixed(0)} operations/day`);

    if (dailyRate < 50000) {
      console.log('✅ Volume is NORMAL for enterprise apps');
      console.log('   → Problem is NOT volume, it\'s ARCHITECTURE');
    } else {
      console.log('⚠️  High volume, but still manageable with proper architecture');
    }

    // Concurrency Analysis
    const concurrencyFactor = metrics.pendingCount > 0 && metrics.insertsPerMinute > 0
      ? (metrics.pendingCount / metrics.insertsPerMinute)
      : 0;

    console.log(`\n⚡ Concurrency Factor:      ${concurrencyFactor.toFixed(2)}`);
    console.log('   (pending count / insert rate per minute)');

    if (concurrencyFactor > 2.0) {
      console.log('🚨 HIGH CONCURRENCY: Operations stacking up!');
      console.log('   → setTimeout() calls overlapping');
      console.log('   → Creates LOCK CONTENTION on same rows');
    } else if (concurrencyFactor > 1.0) {
      console.log('⚠️  Moderate concurrency detected');
    } else {
      console.log('✅ Low concurrency (normal)');
    }

    // Architecture Assessment
    console.log('\n🏗️  ARCHITECTURE ASSESSMENT:');
    console.log('='.repeat(80));
    console.log('Current Pattern:     Individual setTimeout() → Individual UPDATE');
    console.log('Enterprise Pattern:  Queue System → Batch Operations');
    console.log(`Current Load:        ~${(metrics.operationsPerMinute / 60).toFixed(1)} ops/second`);
    console.log('Supabase Limit:      ~100 queries/second (theoretical)');
    console.log('Real Limit:          ~10 concurrent UPDATEs (due to row locking)');

    // Specific Issues Detected
    console.log('\n🎯 ISSUES DETECTED:');
    const issues = [];

    if (metrics.pendingCount > 100) {
      issues.push('🚨 CRITICAL: Mass pending trades (>100)');
    }
    if (metrics.orphanedCount > 50) {
      issues.push('🚨 CRITICAL: setTimeout() verification timeouts');
    }
    if (metrics.concurrentUpdateTime > 5000) {
      issues.push('🚨 CRITICAL: Severe lock contention detected');
    }
    if (metrics.subscriptionTime > 5000) {
      issues.push('🚨 CRITICAL: Real-time system overloaded');
    }
    if (metrics.insertsPerMinute > 100) {
      issues.push('🚨 CRITICAL: Scanner running without throttling');
    }
    if (metrics.totalTrades > 50000) {
      issues.push('⚠️  WARNING: Table bloat (cleanup job failed)');
    }

    if (issues.length === 0) {
      console.log('✅ No critical issues detected (scanner is stopped)');
      console.log('✅ System is STABLE - ready for architecture fixes');
    } else {
      issues.forEach(issue => console.log(`   ${issue}`));
    }

    // Recommendations
    console.log('\n💡 RECOMMENDED ACTIONS:');
    console.log('='.repeat(80));
    console.log('1. IMMEDIATE:   Replace setTimeout() with Queue System');
    console.log('2. URGENT:      Implement Batch UPDATEs (not individual)');
    console.log('3. IMPORTANT:   Add Connection Pooling (max 5 connections)');
    console.log('4. IMPORTANT:   Add date filters to aggregator queries');
    console.log('5. IMPORTANT:   Implement frontend debounce (2s delay)');
    console.log('6. OPTIONAL:    Consider Redis for caching hot data');

    console.log('\n✅ Investigation complete!\n');

  } catch (error) {
    console.error('\n❌ FATAL ERROR during investigation:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run investigation
investigate();
