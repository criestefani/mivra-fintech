// 🔥 VERIFICATION QUEUE SYSTEM
// Replaces individual setTimeout() with controlled batch processing
// Eliminates deadlock issues by serializing operations

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://vecofrvxrepogtigmeyj.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

class VerificationQueue {
  constructor(candlesService, options = {}) {
    this.candlesService = candlesService;
    this.queue = [];
    this.processing = false;

    // Configuration
    this.BATCH_SIZE = options.batchSize || 10; // Process 10 verifications at a time
    this.INTERVAL = options.interval || 2000; // Process batch every 2 seconds
    this.MAX_RETRIES = options.maxRetries || 2;

    // Stats
    this.stats = {
      queued: 0,
      processed: 0,
      successful: 0,
      failed: 0,
      batchesProcessed: 0
    };

    console.log(`✅ Verification Queue initialized (batch: ${this.BATCH_SIZE}, interval: ${this.INTERVAL}ms)`);
  }

  /**
   * Add verification to queue
   * @param {Object} verification - Verification details
   * @param {string} verification.tradeId - UUID of trade
   * @param {number} verification.activeId - Asset ID
   * @param {number} verification.timeframe - Timeframe in seconds
   * @param {number} verification.signalPrice - Entry price
   * @param {string} verification.direction - 'CALL' or 'PUT'
   */
  add(verification) {
    const executeAt = Date.now() + (verification.timeframe * 1000 + 2000);

    this.queue.push({
      ...verification,
      executeAt,
      addedAt: Date.now(),
      retries: 0
    });

    this.stats.queued++;
  }

  /**
   * Start queue processor
   */
  start() {
    if (this.processorInterval) {
      console.warn('⚠️  Queue processor already running');
      return;
    }

    console.log('🚀 Starting verification queue processor...');
    this.processorInterval = setInterval(() => {
      this.processBatch().catch(err => {
        console.error('❌ Error in queue processor:', err.message);
      });
    }, this.INTERVAL);
  }

  /**
   * Stop queue processor
   */
  stop() {
    if (this.processorInterval) {
      clearInterval(this.processorInterval);
      this.processorInterval = null;
      console.log('🛑 Queue processor stopped');
    }
  }

  /**
   * Process a batch of verifications
   */
  async processBatch() {
    if (this.processing) {
      return; // Skip if previous batch still processing
    }

    this.processing = true;

    try {
      const now = Date.now();

      // Get verifications ready to execute
      const ready = this.queue
        .filter(v => v.executeAt <= now)
        .slice(0, this.BATCH_SIZE);

      if (ready.length === 0) {
        this.processing = false;
        return;
      }

      console.log(`\n🔄 Processing batch of ${ready.length} verifications...`);
      const batchStartTime = Date.now();

      // ✅ STEP 1: Fetch candles in parallel (fast)
      const candleResults = await Promise.all(
        ready.map(v => this.fetchCandles(v))
      );

      // ✅ STEP 2: Process results
      const updates = [];
      for (let i = 0; i < ready.length; i++) {
        const v = ready[i];
        const candlesResult = candleResults[i];

        if (candlesResult.success) {
          const resultPrice = candlesResult.resultPrice;
          const isWin = (v.direction === 'CALL' && resultPrice > v.signalPrice) ||
                       (v.direction === 'PUT' && resultPrice < v.signalPrice);

          updates.push({
            id: v.tradeId,
            result: isWin ? 'WIN' : 'LOSS',
            result_price: resultPrice,
            result_timestamp: new Date().toISOString(),
            price_diff: resultPrice - v.signalPrice
          });

          this.stats.successful++;
          console.log(`   ✅ ${v.tradeId.substring(0,8)} → ${isWin ? 'WIN' : 'LOSS'} (${resultPrice.toFixed(2)})`);
        } else {
          // Retry or mark as failed
          if (v.retries < this.MAX_RETRIES) {
            v.retries++;
            v.executeAt = now + 5000; // Retry in 5s
            this.queue.push(v); // Re-queue
            console.log(`   ⚠️  ${v.tradeId.substring(0,8)} → RETRY #${v.retries} (${candlesResult.error})`);
          } else {
            updates.push({
              id: v.tradeId,
              result: 'TIMEOUT',
              result_timestamp: new Date().toISOString()
            });
            this.stats.failed++;
            console.log(`   ❌ ${v.tradeId.substring(0,8)} → TIMEOUT (max retries)`);
          }
        }
      }

      // ✅ STEP 3: Batch UPDATE to Supabase (1 query instead of N)
      if (updates.length > 0) {
        const updateStartTime = Date.now();
        const { error: upsertError } = await supabase
          .from('strategy_trades')
          .upsert(updates, { onConflict: 'id', ignoreDuplicates: false });

        const updateDuration = Date.now() - updateStartTime;

        if (upsertError) {
          console.error(`   ❌ Batch UPDATE failed (${updateDuration}ms): ${upsertError.message}`);
          // Re-queue failed updates for retry
          ready.forEach(v => {
            if (v.retries < this.MAX_RETRIES) {
              v.retries++;
              v.executeAt = now + 10000;
              this.queue.push(v);
            }
          });
        } else {
          console.log(`   ✅ Batch UPDATE complete: ${updates.length} trades (${updateDuration}ms)`);
          this.stats.processed += updates.length;
        }
      }

      // Remove processed items from queue
      this.queue = this.queue.filter(v => !ready.includes(v));

      const batchDuration = Date.now() - batchStartTime;
      this.stats.batchesProcessed++;
      console.log(`   ⏱️  Batch complete in ${batchDuration}ms (${this.queue.length} remaining in queue)\n`);

    } catch (error) {
      console.error('❌ Fatal error in batch processing:', error.message);
    } finally {
      this.processing = false;
    }
  }

  /**
   * Fetch candles for verification
   * @private
   */
  async fetchCandles(verification) {
    try {
      const candles = await this.candlesService.getCandles(
        verification.activeId,
        verification.timeframe,
        { count: 5 }
      );

      if (!candles || candles.length === 0) {
        return { success: false, error: 'No candles returned' };
      }

      const resultPrice = parseFloat(candles[candles.length - 1].close);
      return { success: true, resultPrice };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      stats: { ...this.stats }
    };
  }

  /**
   * Print stats
   */
  printStats() {
    console.log('\n📊 Verification Queue Stats:');
    console.log(`   Queued:            ${this.stats.queued}`);
    console.log(`   Processed:         ${this.stats.processed}`);
    console.log(`   Successful:        ${this.stats.successful}`);
    console.log(`   Failed:            ${this.stats.failed}`);
    console.log(`   Batches Processed: ${this.stats.batchesProcessed}`);
    console.log(`   Currently in queue: ${this.queue.length}`);
    console.log(`   Success rate:      ${this.stats.processed > 0 ? ((this.stats.successful / this.stats.processed) * 100).toFixed(1) : 0}%\n`);
  }
}

export default VerificationQueue;
