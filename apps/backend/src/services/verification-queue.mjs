// 🔥 VERIFICATION QUEUE SYSTEM
// Replaces individual setTimeout() with controlled batch processing
// Eliminates deadlock issues by serializing operations

class VerificationQueue {
  constructor(candlesService, supabase, options = {}) {
    this.candlesService = candlesService;
    this.supabase = supabase; // ✅ Accept supabase client as parameter
    this.queue = [];
    this.processing = 0; // Track number of concurrent workers

    // Configuration
    this.BATCH_SIZE = options.batchSize || 50; // Process 50 verifications at a time (was 10)
    this.INTERVAL = options.interval || 500; // Process batch every 500ms (was 2000ms)
    this.MAX_RETRIES = options.maxRetries || 2;
    this.WORKERS = options.workers || 2; // Number of concurrent workers

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
   * Start queue processor with multiple workers
   */
  start() {
    // 🚨 EMERGENCY BRAKE: Prevent restart if too many workers still active
    if (this.processing > 5) {
      console.error(`🚨 EMERGENCY: Too many workers active (${this.processing}), aborting start(). Likely recovering from crash.`);
      return;
    }

    if (this.processorIntervals && this.processorIntervals.length > 0) {
      console.warn('⚠️  Queue processor already running');
      return;
    }

    console.log(`🚀 Starting verification queue processor with ${this.WORKERS} workers...`);
    this.processorIntervals = [];

    // Create multiple worker intervals
    for (let i = 0; i < this.WORKERS; i++) {
      const interval = setInterval(() => {
        // ✅ Heartbeat: Show queue is running
        console.log(`[Queue Heartbeat W${i}] Size: ${this.queue.length}, Active workers: ${this.processing}/${this.WORKERS}`);
        this.processBatch().catch(err => {
          console.error('❌ Error in queue processor:', err.message);
        });
      }, this.INTERVAL);

      this.processorIntervals.push(interval);
    }
  }

  /**
   * Stop queue processor
   */
  stop() {
    if (this.processorIntervals && this.processorIntervals.length > 0) {
      this.processorIntervals.forEach((interval, i) => {
        clearInterval(interval);
        console.log(`🛑 Worker ${i} stopped`);
      });
      this.processorIntervals = [];
      console.log('🛑 Queue processor completely stopped');
    }
  }

  /**
   * Process a batch of verifications
   */
  async processBatch() {
    // 🚨 EMERGENCY FIX: Prevent worker explosion (max N concurrent workers)
    if (this.processing >= this.WORKERS) {
      console.log(`⏸️  Max workers (${this.WORKERS}) active, skipping batch. Queue: ${this.queue.length}`);
      return;
    }

    // ✅ Increment active workers (no lock - allows true parallelism)
    this.processing++;

    try {
      const now = Date.now();

      // Get verifications ready to execute
      const ready = this.queue
        .filter(v => v.executeAt <= now)
        .slice(0, this.BATCH_SIZE);

      if (ready.length === 0) {
        // ✅ Show when next trade will be ready
        if (this.queue.length > 0) {
          const nextReady = Math.min(...this.queue.map(v => v.executeAt));
          const waitTime = Math.ceil((nextReady - now) / 1000);
          console.log(`⏳ Queue has ${this.queue.length} trades, next ready in ${waitTime}s`);
        } else {
          console.log(`✅ Queue is empty`);
        }
        return;
      }

      // ✅ Show queue status
      const totalInQueue = this.queue.length;
      const readyCount = this.queue.filter(v => v.executeAt <= now).length;
      console.log(`📊 Queue status: ${readyCount}/${totalInQueue} ready | Processing batch of ${ready.length}...`);
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

      // ✅ STEP 3: Batch UPDATE to Supabase (with connection limit)
      if (updates.length > 0) {
        const updateStartTime = Date.now();

        // 🚨 CONNECTION POOL SAFETY: Max 5 concurrent Supabase connections
        const SAFE_CONCURRENT = Math.min(updates.length, 5);
        let successCount = 0;
        let failureCount = 0;

        // Process updates in chunks of 5 to avoid connection pool overflow
        for (let i = 0; i < updates.length; i += SAFE_CONCURRENT) {
          const chunk = updates.slice(i, i + SAFE_CONCURRENT);
          const chunkReadies = ready.slice(i, i + SAFE_CONCURRENT);

          // Execute chunk in parallel (max 5 connections)
          const updateResults = await Promise.all(
            chunk.map(update =>
              this.supabase
                .from('strategy_trades')
                .update({
                  result: update.result,
                  result_price: update.result_price,
                  result_timestamp: update.result_timestamp,
                  price_diff: update.price_diff
                })
                .eq('id', update.id)
            )
          );

          // Process chunk results
          for (let j = 0; j < updateResults.length; j++) {
            const result = updateResults[j];
            const update = chunk[j];
            const verification = chunkReadies[j];

            if (result.error) {
              failureCount++;
              console.error(`   ❌ UPDATE failed for ${update.id.substring(0,8)}: ${result.error.message}`);

              // Re-queue on failure
              if (verification.retries < this.MAX_RETRIES) {
                verification.retries++;
                verification.executeAt = now + 10000;
                this.queue.push(verification);
                console.log(`   ⚠️  Re-queued ${update.id.substring(0,8)} (retry #${verification.retries})`);
              } else {
                console.log(`   ❌ Max retries reached for ${update.id.substring(0,8)}`);
              }
            } else {
              successCount++;
            }
          }
        }

        const updateDuration = Date.now() - updateStartTime;
        console.log(`   ✅ Batch UPDATE complete: ${successCount}/${updates.length} successful (${updateDuration}ms)`);
        this.stats.processed += successCount;
        this.stats.failed += failureCount;
      }

      // Remove processed items from queue
      this.queue = this.queue.filter(v => !ready.includes(v));

      const batchDuration = Date.now() - batchStartTime;
      this.stats.batchesProcessed++;
      console.log(`   ⏱️  Batch complete in ${batchDuration}ms (${this.queue.length} remaining in queue)\n`);

      // ✅ Print stats every 6 batches
      if (this.stats.batchesProcessed % 6 === 0 && this.stats.batchesProcessed > 0) {
        this.printStats();
      }

    } catch (error) {
      console.error('❌ Fatal error in batch processing:', error.message);
    } finally {
      // ✅ Decrement active workers
      this.processing--;
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
