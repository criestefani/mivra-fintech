// Market Scanner - Real-time market analysis using Aggressive Hybrid Strategy


// Load environment variables first
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });


import { ClientSdk, SsidAuthMethod } from '@quadcode-tech/client-sdk-js';
import { createClient } from '@supabase/supabase-js';
import { analyzeAggressive } from './strategies/strategy-aggressive.mjs';
import { getAvailableAssets, getAssetName } from '../constants/fixed-assets.mjs';
import ssidManager from '../services/ssid-manager.mjs';


const TIMEFRAMES = [10, 30, 60, 300]; // ✅ 10s, 30s, 1min, 5min
const CONCURRENT_LIMIT = 2; // 🚀 2-CONCURRENT: Safe API-friendly parallelism
const INITIAL_SCAN_DELAY = 5000; // 5s before first scan
const AVALON_WS_URL = process.env.AVALON_WS_URL || 'wss://ws.trade.avalonbroker.com/echo/websocket';
const AVALON_API_HOST = process.env.AVALON_API_HOST || 'https://trade.avalonbroker.com';


class MarketScanner {
  scheduleVerification(payload) {
    const jitterMs = Number(process.env.TRADE_VERIFICATION_JITTER_MS ?? 5000);
    const timeframeSeconds = Number(
  payload?.timeframe ?? payload?.timeframe_seconds ?? 0
);
const baseDelayMs = Number.isFinite(timeframeSeconds)


      ? timeframeSeconds * 1000
      : 0;
    const delay =
      baseDelayMs + 2000 + Math.max(0, Math.random() * Math.max(0, jitterMs));


    if (!this.pendingVerificationTimers) {
      this.pendingVerificationTimers = new Map();
    }


    const tradeId = payload?.tradeId;
    const shortId = tradeId ? tradeId.substring(0, 8) : 'unknown';


    return new Promise((resolve) => {
      const timer = setTimeout(async () => {
        try {
          await this.verifyTrade(payload);
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          const logger = this.logger ?? console;
          logger.error?.(`❌ ${shortId}: ${err.message}`);
        } finally {
          if (tradeId && this.pendingVerificationTimers) {
            this.pendingVerificationTimers.delete(tradeId);
          }
          resolve();
        }
      }, delay);


      if (tradeId) {
        this.pendingVerificationTimers.set(tradeId, timer);
      }
    });
  }


  async verifyTrade(payload) {
    try {
      const { tradeId, activeId, timeframe, signalPrice, direction } = payload;
     
      // Fetch candles
      const candles = await this.candlesService.getCandles(activeId, timeframe);
     
      if (!candles || candles.length === 0) {
        console.log(`⚠️  [${tradeId.substring(0,8)}] No candles available`);
        return;
      }
     
      // Get last candle
      const lastCandle = candles[candles.length - 1];
     
      // Calculate result
      const result = direction === 'call'
        ? lastCandle.close > signalPrice ? 'WIN' : 'LOSS'
        : lastCandle.close < signalPrice ? 'WIN' : 'LOSS';
     
      // Calculate price difference
      const priceDiff = lastCandle.close - signalPrice;
     
      // Update Supabase (CAMPOS CORRETOS!)
      const { error } = await this.supabase
        .from('strategy_trades')
        .update({
          result: result,
          result_price: lastCandle.close,
          result_timestamp: new Date().toISOString(),
          price_diff: priceDiff
        })
        .eq('id', tradeId);
     
      if (error) {
        console.log(`❌ [${tradeId.substring(0,8)}] UPDATE failed: ${error.message}`);
      } else {
        console.log(`✅ [${tradeId.substring(0,8)}] → ${result}`);
      }
     
    } catch (err) {
      console.log(`❌ [${payload.tradeId?.substring(0,8)}] Error: ${err.message}`);
    }
  }


  clearVerificationTimers() {
    if (!this.pendingVerificationTimers) {
      return;
    }


    for (const [, timeoutId] of this.pendingVerificationTimers) {
      clearTimeout(timeoutId);
    }


    this.pendingVerificationTimers.clear();
  }
  constructor() {
    this.sdk = null;
    this.blitz = null;
    this.candlesService = null;
    this.signalsCount = 0;
    this.systemSSID = null;
    this.scanCount = 0;
    this.scanStartTime = null;
    this.SCAN_TIMEOUT = 180000;


    // ✅ SUPABASE AS CLASS PROPERTY: Can be managed/reset
    this.supabase = createClient(
      process.env.SUPABASE_URL || 'https://vecofrvxrepogtigmeyj.supabase.co',
      process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        db: { pool: { min: 5, max: 30 } },  // ✅ Increased from 10 to 30
        auth: { persistSession: false }
      }
    );


    // ✅ VERIFICATION QUEUE: Placeholder, initialized in connect()
  }


  async connect() {
    console.log('🔐 Market Scanner conectando ao Avalon...');


    // ✅ Initialize system SSID if not available
    this.systemSSID = ssidManager.getSystemSSID();


    if (!this.systemSSID) {
      console.log('⏳ Inicializando System SSID...');
      try {
        this.systemSSID = await ssidManager.initializeSystemSSID();
      } catch (error) {
        console.error('❌ Failed to initialize System SSID:', error.message);
        throw new Error('System SSID initialization failed. Cannot connect to Avalon.');
      }
    }


    if (!this.systemSSID) {
      throw new Error('System SSID not available. Cannot connect to Avalon.');
    }


    console.log(`✅ Using System SSID: ${this.systemSSID.substring(0, 15)}...`);


    this.sdk = await ClientSdk.create(
      AVALON_WS_URL,
      parseInt(ssidManager.AVALON_SYSTEM_USER_ID),
      new SsidAuthMethod(this.systemSSID),
      { host: AVALON_API_HOST }
    );


    this.blitz = await this.sdk.blitzOptions();
    this.candlesService = await this.sdk.candles();


        console.log('✅ Market Scanner conectado ao Avalon\n');
  }


  async scanLoop() {
    console.log('🚀 FAST SEQUENTIAL SCANNER: Proven High-Performance Pattern\n');
    console.log('📊 Monitorando: 141 ativos × 4 timeframes = 564 combinações\n');


    let totalScans = 0;


    const performScan = async () => {
      totalScans++;
      const scanStartTime = Date.now();


      try {
        console.log(`\n🟢 SCAN #${totalScans} INICIADO`);


        // Get available actives
        const fixedAssets = getAvailableAssets();
        const availableFromSDK = this.blitz.getActives();
        const availableIds = new Set(availableFromSDK.map(a => a.id));
        const actives = fixedAssets
          .filter(a => availableIds.has(a.id))
          .map(a => availableFromSDK.find(sdk => sdk.id === a.id))
          .filter(a => a !== undefined);


        console.log(`🔄 Processing ${actives.length} actives × ${TIMEFRAMES.length} timeframes = ${actives.length * TIMEFRAMES.length} combinations...`);


        // ✅ SIMPLE SEQUENTIAL: No Promise.all, no batch accumulation
        let signalsFound = 0;
        let totalCombinations = 0;


        // Simple nested loops: actives → timeframes
        for (const active of actives) {
          for (const timeframe of TIMEFRAMES) {
            totalCombinations++;


            try {
              // Fetch candles
              const candles = await this.candlesService.getCandles(active.id, timeframe, { count: 50 });


              if (!candles || candles.length < 50) {
                // Not enough data, skip
              } else {
                // Format candles
                const candlesFormatted = candles.map(c => ({
                  open: +c.open,
                  high: +c.max,
                  low: +c.min,
                  close: +c.close,
                  timestamp: c.from
                }));


                // Analyze
                const result = analyzeAggressive(candlesFormatted);


                // If signal found, register immediately (fire-and-forget for speed)
                if (result?.consensus && result.consensus !== 'NEUTRAL') {
                  const lastCandle = candles[candles.length - 1];
                  // ✅ FIRE-AND-FORGET: Don't await, let it save in background
                  this.registrarSinalSimulado(active, timeframe, result.consensus, lastCandle, result)
                    .catch(err => console.error(`❌ Save error: ${active.id}`, err.message));
                  signalsFound++;
                  this.signalsCount++;
                }
              }
            } catch (err) {
              // Log error but continue to next combination
              console.error(`❌ Error processing ${active.id} × ${timeframe}s: ${err.message}`);
            }


            // ✅ RATE LIMITING: 50ms delay between iterations (natural pacing)
            await new Promise(r => setTimeout(r, 50));
          }
        }


        const scanDuration = Date.now() - scanStartTime;
        const scanSeconds = (scanDuration / 1000).toFixed(1);


        // ✅ Get queue stats


        console.log(`\n📊 Scan complete:`);
        console.log(`   Time: ${scanSeconds}s`);
        console.log(`   Combinations: ${totalCombinations}`);
        console.log(`   Signals found: ${signalsFound}`);
        console.log(`   Total accumulated: ${this.signalsCount}`);
        console.log(`\n📈 Queue Status:`);
        console.log(`   Pending: ${queueStats.queueLength}`);
        console.log(`   Processing: ${queueStats.processing}/${2} workers`);
        console.log(`   Processed: ${queueStats.stats.processed}/${queueStats.stats.queued} total`);
        console.log(`   Success rate: ${queueStats.stats.processed > 0 ? ((queueStats.stats.successful / queueStats.stats.processed) * 100).toFixed(1) : 0}%\n`);


        // ✅ BACKGROUND TASKS: Fire-and-forget (every 6 scans)
        if (this.scanCount % 6 === 0) {
          this.recuperarTradesPendentes().catch(err => console.error(`Recovery error: ${err.message}`));
          this.limparDadosAntigos().catch(err => console.error(`Cleanup error: ${err.message}`));
        }
        this.scanCount++;


      } catch (err) {
        console.error(`❌ SCAN ERROR: ${err.message}`);
        console.error(`   Stack: ${err.stack}`);
      }
    };


    // ✅ Start with fixed interval (10 seconds) - fire-and-forget saves handle throughput
    console.log(`⏰ Starting scan loop with fixed 10-second interval\n`);
    setInterval(performScan, 10000);


    // Run initial scan immediately
    performScan();
  }


  async registrarSinalSimulado(active, timeframe, direction, lastCandle, strategyResult, maxRetries = 2) {
    const signalTime = new Date();
    const signalPrice = +lastCandle.close;
    const ativoNome = getAssetName(active.id);


    let retries = 0;
    while (retries < maxRetries) {
      try {
        // ✅ Save signal to strategy_trades (only columns that exist)
        const { data, error } = await this.supabase.from('strategy_trades').insert({
          active_id: active.id.toString(),
          ativo_nome: ativoNome,
          timeframe: timeframe,
          signal_timestamp: signalTime.toISOString(),
          signal_direction: direction,
          signal_price: signalPrice,
          result: 'PENDING'
        }).select('id').single();


        if (error) {
          // Retry on fetch failed, give up on other errors
          if (error?.message?.includes?.('fetch failed') && retries < maxRetries - 1) {
            retries++;
            console.warn(`⚠️  Supabase fetch failed (retry ${retries}/${maxRetries})...`);
            await new Promise(r => setTimeout(r, 500)); // Wait 500ms before retry
            continue;
          }
          console.error(`❌ Erro ao inserir trade: ${error?.message}`);
          return false;
        }


        if (!data) {
          console.error(`❌ Erro ao inserir trade: No data returned`);
          return false;
        }


        const tradeId = data.id;


        // ✅ Add to Verification Queue (no setTimeout, queue handles scheduling)
    this.scheduleVerification({
          tradeId: tradeId,
          activeId: active.id,
          timeframe: timeframe,
          signalPrice: signalPrice,
          direction: direction
        });


        return true; // ✅ SUCCESS
      } catch (err) {
        console.error(`❌ Erro ao inserir trade: ${err.message}`);
        return false;
      }
    }


    return false; // Failed after all retries
  }


  async verificarResultado(tradeId, activeId, timeframe, signalPrice, direction, retryCount = 0) {
    const maxRetries = 2;


    try {
      const candles = await this.candlesService.getCandles(activeId, timeframe, { count: 5 });
      if (!candles || candles.length === 0) {
        console.log(`⚠️ Sem candles para verificar trade ${tradeId}`);
        return;
      }


      const resultPrice = +candles[candles.length - 1].close;
      const isWin = (direction === 'CALL' && resultPrice > signalPrice) ||
                    (direction === 'PUT' && resultPrice < signalPrice);


      // ✅ Update by unique ID
      const { error } = await this.supabase
        .from('strategy_trades')
        .update({
          result_timestamp: new Date().toISOString(),
          result_price: resultPrice,
          result: isWin ? 'WIN' : 'LOSS',
          price_diff: resultPrice - signalPrice
        })
        .eq('id', tradeId);


      if (error) {
        // Retry on fetch failed
        if (error?.message?.includes?.('fetch failed') && retryCount < maxRetries) {
          console.warn(`⚠️  Supabase fetch failed on UPDATE (retry ${retryCount + 1}/${maxRetries})...`);
          await new Promise(r => setTimeout(r, 500));
          return this.verificarResultado(tradeId, activeId, timeframe, signalPrice, direction, retryCount + 1);
        }
        console.error(`❌ Erro ao atualizar trade ${tradeId}: ${error?.message}`);
      } else {
        console.log(`✅ Trade ${tradeId.substring(0, 8)} | ${isWin ? 'WIN' : 'LOSS'} | ${resultPrice.toFixed(4)}`);
      }
    } catch (err) {
      console.error(`❌ Erro ao verificar resultado: ${err.message}`);
    }
  }


  async recuperarTradesPendentes(retryCount = 0) {
    const maxRetries = 2;


    try {
      const recoveryStartTime = Date.now();
      console.log(`🔧 [RECOVERY] Starting pending trades recovery...`);


      const { data: pendingTrades, error } = await this.supabase
        .from('strategy_trades')
        .select('*')
        .eq('result', 'PENDING')
        .lt('signal_timestamp', new Date(Date.now() - 15 * 1000).toISOString())
        .limit(10);


      if (error) {
        // Retry on fetch failed
        if (error?.message?.includes?.('fetch failed') && retryCount < maxRetries) {
          console.warn(`⚠️  [RECOVERY] Supabase fetch failed (retry ${retryCount + 1}/${maxRetries})...`);
          await new Promise(r => setTimeout(r, 1000));
          return this.recuperarTradesPendentes(retryCount + 1);
        }
        console.error(`❌ [RECOVERY] Error fetching pending trades: ${error?.message}`);
        console.error(`   Code: ${error?.code}, Details: ${JSON.stringify(error?.details)}`);
        return;
      }


      if (!pendingTrades || pendingTrades.length === 0) {
        console.log(`✅ [RECOVERY] No pending trades to recover`);
        return;
      }


      console.log(`🔧 [RECOVERY] Found ${pendingTrades.length} orphaned PENDING trades. Adding to Verification Queue...`);


      let queued = 0;
      for (const trade of pendingTrades) {
        try {
          const timeSinceSignal = Date.now() - new Date(trade.signal_timestamp).getTime();


          if (timeSinceSignal >= (trade.timeframe * 1000 + 2000)) {
            // ✅ Add to Verification Queue (not direct call)
    this.scheduleVerification({
              tradeId: trade.id,
              activeId: parseInt(trade.active_id),
              timeframe: trade.timeframe,
              signalPrice: trade.signal_price,
              direction: trade.signal_direction
            });
            queued++;
          }
        } catch (err) {
          console.error(`❌ [RECOVERY] Error queueing trade ${trade.id}: ${err.message}`);
        }
      }


      const recoveryTime = Date.now() - recoveryStartTime;
      console.log(`✅ [RECOVERY] Completed in ${recoveryTime}ms. Queued: ${queued}/${pendingTrades.length}`);
    } catch (err) {
      console.error(`❌ [RECOVERY] Fatal error: ${err.message}`);
      console.error(`   Stack: ${err.stack}`);
    }
  }


  async limparDadosAntigos() {
    try {
      const cleanupStartTime = Date.now();
      console.log(`🧹 [CLEANUP] Starting old data cleanup...`);


      // ✅ 30-minute TTL (Time To Live) for fresh signals
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();


      const { count, error } = await this.supabase
        .from('strategy_trades')
        .delete()
        .lt('signal_timestamp', thirtyMinutesAgo);


      if (error) {
        console.error(`❌ [CLEANUP] Error deleting old data: ${error.message}`);
        console.error(`   Code: ${error.code}, Details: ${JSON.stringify(error.details)}`);
        return;
      }


      const cleanupTime = Date.now() - cleanupStartTime;
      console.log(`✅ [CLEANUP] Completed in ${cleanupTime}ms. Deleted: ${count} old trades`);
    } catch (err) {
      console.error(`❌ [CLEANUP] Fatal error: ${err.message}`);
      console.error(`   Stack: ${err.stack}`);
    }
  }


  /**
   * Batch save signals and schedule verifications
   * @param {Array} signals - Array of signals (up to 20)
   */
  async saveBatch(signals) {
    const batchStartTime = Date.now();


    if (!signals || signals.length === 0) {
      return;
    }


    try {
      // ✅ BATCH INSERT: All signals in one query
      const { data: insertedSignals, error } = await this.supabase
        .from('strategy_trades')
        .insert(signals)
        .select('id');


      if (error) {
        console.error(`❌ Batch insert error: ${error.message}`);
        // ⚠️ FALLBACK: If batch fails, try individual inserts
        console.log(`⚠️ Attempting fallback: individual inserts for ${signals.length} signals`);
        let successCount = 0;
        for (const signal of signals) {
          try {
            const { data: result, error: err } = await this.supabase
              .from('strategy_trades')
              .insert(signal)
              .select('id')
              .single();


            if (err) {
              console.error(`❌ Individual insert failed: ${err.message}`);
              continue;
            }


            if (result?.id) {
              successCount++;
              // Add to Verification Queue (no setTimeout)
    this.scheduleVerification({
                tradeId: result.id,
                activeId: +signal.active_id,
                timeframe: signal.timeframe,
                signalPrice: signal.signal_price,
                direction: signal.signal_direction
              });
            }
          } catch (err) {
            console.error(`❌ Fallback insert exception: ${err.message}`);
          }
        }
        console.log(`⚠️ Fallback complete: ${successCount}/${signals.length} signals inserted`);
        return;
      }


      if (!insertedSignals || insertedSignals.length === 0) {
        console.error(`❌ Batch insert returned no IDs`);
        return;
      }


      const batchTime = Date.now() - batchStartTime;
      console.log(`✅ Batch saved: ${signals.length} signals in ${batchTime}ms`);


      // ✅ SCHEDULE VERIFICATIONS: Use Verification Queue
      insertedSignals.forEach((inserted, index) => {
        const signal = signals[index];
        if (!inserted?.id) return;


        // Add to queue (no setTimeout - queue handles scheduling)
    this.scheduleVerification({
          tradeId: inserted.id,
          activeId: +signal.active_id,
          timeframe: signal.timeframe,
          signalPrice: signal.signal_price,
          direction: signal.signal_direction
        });
      });


    } catch (err) {
      console.error(`❌ Batch save exception: ${err.message}`);
      console.error(`   Stack: ${err.stack}`);
    }
  }


  async saveMicroBatch(signals) {
    const batchStartTime = Date.now();


    try {
      const { data: insertedSignals, error } = await this.supabase
        .from('strategy_trades')
        .insert(signals)
        .select('id');


      if (error) {
        console.error(`❌ Batch error: ${error.message}`);
        return;
      }


      if (!insertedSignals) {
        console.error(`❌ Batch returned no data`);
        return;
      }


      const batchTime = Date.now() - batchStartTime;
      console.log(`✅ ${signals.length} signals saved in ${batchTime}ms`);


      // ✅ SCHEDULE VERIFICATIONS: Use Verification Queue
      insertedSignals.forEach((inserted, index) => {
        const signal = signals[index];
        if (!inserted?.id) return;


        // Add to queue (no setTimeout - queue handles scheduling)
    this.scheduleVerification({
          tradeId: inserted.id,
          activeId: +signal.active_id,
          timeframe: signal.timeframe,
          signalPrice: signal.signal_price,
          direction: signal.signal_direction
        });
      });
    } catch (err) {
      console.error(`❌ Batch exception: ${err.message}`);
    }
  }


  async start() {
    await this.connect();
    this.scanLoop();
  }
}


const scanner = new MarketScanner();
scanner.start().catch(console.error);
