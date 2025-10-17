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
const SCAN_INTERVAL = 10000; // ⚡ PERFORMANCE: 10 seconds for high-frequency scans
const PARALLEL_BATCH_SIZE = 15; // 🔧 SEQUENTIAL: 15 combinations at a time
const AVALON_WS_URL = process.env.AVALON_WS_URL || 'wss://ws.trade.avalonbroker.com/echo/websocket';
const AVALON_API_HOST = process.env.AVALON_API_HOST || 'https://trade.avalonbroker.com';

// ⚡ OPTIMIZED: Supabase connection with pooling for better performance
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://vecofrvxrepogtigmeyj.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    db: { pool: { min: 2, max: 10 } },  // Connection pooling
    auth: { persistSession: false }      // Reduce overhead
  }
);

class MarketScanner {
  constructor() {
    this.sdk = null;
    this.blitz = null;
    this.candlesService = null;
    this.signalsCount = 0;
    this.systemSSID = null;
    this.scanCount = 0; // ✅ Counter for recovery/cleanup throttling
    this.isScanning = false; // ✅ Lock to prevent overlapping scans
    this.scanStartTime = null; // ✅ Track when scan started for timeout safety
    this.SCAN_TIMEOUT = 180000; // ✅ Max 180 seconds (3 min)
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
    console.log('🔄 Scanner tempo real iniciado (scan a cada 30s)\n');
    console.log('📊 Monitorando: 141 ativos × 4 timeframes = 564 combinações (Estratégia Híbrida Agressiva)\n');
    console.log(`⚡ Usando processamento PARALELO: ${PARALLEL_BATCH_SIZE} chamadas simultâneas\n`);

    let skippedScans = 0;
    let totalScans = 0;

    setInterval(async () => {
      totalScans++;
      const globalStartTime = Date.now();

      // ✅ SAFETY TIMEOUT: Check if previous scan exceeded timeout
      if (this.isScanning && this.scanStartTime) {
        const scanDuration = Date.now() - this.scanStartTime;
        if (scanDuration > this.SCAN_TIMEOUT) {
          console.error(`🚨 TIMEOUT RECOVERY: Previous scan exceeded ${this.SCAN_TIMEOUT}ms limit (${scanDuration}ms). Force-releasing lock...`);
          this.isScanning = false;
        }
      }

      // ✅ LOCK: Prevent overlapping scans
      if (this.isScanning) {
        skippedScans++;
        const pendingDuration = this.scanStartTime ? Date.now() - this.scanStartTime : 0;
        console.log(`⚠️  Scan #${totalScans} SKIPPED (anterior ainda em execução por ${pendingDuration}ms) - Total pulados: ${skippedScans}`);
        return;
      }

      this.isScanning = true;
      this.scanStartTime = Date.now();

      try {
        console.log(`\n🟢 ===== SCAN #${totalScans} INICIADO =====`);
        const startTime = Date.now();
        let analyzed = 0;
        let signalsFound = 0;

        // ✅ STAGE 1: Get fixed assets list
        const t1 = Date.now();
        const fixedAssets = getAvailableAssets();
        console.log(`⏱️ [STAGE 1] Get fixed assets: ${Date.now() - t1}ms`);

        // ✅ STAGE 2: Get available assets from SDK for validation
        const t2 = Date.now();
        const availableFromSDK = this.blitz.getActives();
        const availableIds = new Set(availableFromSDK.map(a => a.id));
        console.log(`⏱️ [STAGE 2] Get SDK actives: ${Date.now() - t2}ms`);

        // ✅ STAGE 3: Filter only assets that are currently available
        const t3 = Date.now();
        const actives = fixedAssets
          .filter(fixedAsset => availableIds.has(fixedAsset.id))
          .map(fixedAsset => {
            return availableFromSDK.find(sdkActive => sdkActive.id === fixedAsset.id);
          })
          .filter(active => active !== undefined);
        console.log(`⏱️ [STAGE 3] Filter actives: ${Date.now() - t3}ms`);
        console.log(`✅ ${actives.length}/${fixedAssets.length} ativos disponíveis\n`);

        // ✅ MICRO-BATCH PATTERN: Save signals as discovered (prevents data loss)
        const MICRO_BATCH_SIZE = 25; // ⚡ PERFORMANCE: 25 signals per batch - optimal PostgreSQL batch size
        let microBatch = [];
        let totalSignalsProcessed = 0;

        // ✅ Create array of all combinations to process
        const t4 = Date.now();
        const combinations = [];
        for (const active of actives) {
          for (const timeframe of TIMEFRAMES) {
            combinations.push({ active, timeframe });
          }
        }
        console.log(`⏱️ [STAGE 4] Create combinations: ${Date.now() - t4}ms`);
        console.log(`🔄 Processando ${combinations.length} combinações em ${Math.ceil(combinations.length / PARALLEL_BATCH_SIZE)} batches (${PARALLEL_BATCH_SIZE} por vez)...\n`);

        // ✅ STAGE 5: Process combinations in parallel batches
        const t5 = Date.now();
        let batchNumber = 0;
        let totalCandlesFetched = 0;
        let totalCandlesErrors = 0;

        for (let i = 0; i < combinations.length; i += PARALLEL_BATCH_SIZE) {
          batchNumber++;
          const batchStartTime = Date.now();
          const batch = combinations.slice(i, i + PARALLEL_BATCH_SIZE);

          // ✅ SEQUENTIAL API CALLS with rate limiting (50ms delay between calls)
          const batchResults = [];
          for (const { active, timeframe } of batch) {
            try {
              const candles = await this.candlesService.getCandles(active.id, timeframe, { count: 50 });

              if (!candles || candles.length < 50) {
                totalCandlesErrors++;
                // ⚡ SPEED: Skip individual error logs (no spam)
                batchResults.push(null);
              } else {
                totalCandlesFetched++;

                const candlesFormatted = candles.map(c => ({
                  open: +c.open,
                  high: +c.max,
                  low: +c.min,
                  close: +c.close,
                  timestamp: c.from
                }));

                const result = analyzeAggressive(candlesFormatted);

                if (result?.consensus && result.consensus !== 'NEUTRAL') {
                  const lastCandle = candles[candles.length - 1];
                  const ativoNome = getAssetName(active.id);
                  const signalPrice = +lastCandle.close;

                  const signal = {
                    active_id: active.id.toString(),
                    ativo_nome: ativoNome,
                    timeframe: timeframe,
                    signal_timestamp: new Date().toISOString(),
                    signal_direction: result.consensus,
                    signal_price: signalPrice,
                    result: 'PENDING'
                  };

                  microBatch.push(signal);

                  // ✅ MICRO-BATCH SAVE: Save every 5 signals immediately (prevents data loss)
                  if (microBatch.length >= MICRO_BATCH_SIZE) {
                    await this.saveMicroBatch(microBatch);
                    totalSignalsProcessed += microBatch.length;
                    signalsFound += microBatch.length;
                    microBatch = []; // Reset batch
                  }

                  batchResults.push(signal);
                } else {
                  batchResults.push(null);
                }
              }

              // ⚡ SPEED: REMOVED API delays (was 20ms) - SDK handles rate limiting internally
              // Sequential calls don't overwhelm API. Removal saves 11.28s per scan!

            } catch (err) {
              totalCandlesErrors++;
              console.error(`❌ Error fetching candles for ${active.ticker} @ ${timeframe}s: ${err.message}`);
              batchResults.push(null);
            }
          }

          // Count all results (already processed and saved above)
          batchResults.forEach(signal => {
            analyzed++;
          });

          const batchTime = Date.now() - batchStartTime;
          console.log(`⏱️ Batch #${batchNumber}: ${batch.length} combos em ${batchTime}ms (${(batchTime/batch.length).toFixed(1)}ms/combo)`);
        }

        const stage5Time = Date.now() - t5;
        console.log(`\n⏱️ [STAGE 5] All batches completed: ${stage5Time}ms`);
        console.log(`📊 Candles fetched: ${totalCandlesFetched}, Errors: ${totalCandlesErrors}`);

        // ✅ STAGE 6: SAVE REMAINING MICRO-BATCH (final signals)
        const t6 = Date.now();
        if (microBatch.length > 0) {
          console.log(`\n📊 STAGE 6: Saving final micro-batch of ${microBatch.length} signals...`);
          await this.saveMicroBatch(microBatch);
          totalSignalsProcessed += microBatch.length;
          signalsFound += microBatch.length;
          microBatch = [];
        } else {
          console.log(`✅ STAGE 6: All micro-batches already saved during processing`);
        }
        console.log(`⏱️ [STAGE 6] Micro-batch processing complete: ${Date.now() - t6}ms`);

        const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        this.signalsCount += signalsFound;

        console.log(`\n████████████████████████████████████████████████████████`);
        console.log(`⏱️ SCAN #${totalScans} SUMMARY:`);
        console.log(`   Total time: ${totalElapsed}s`);
        console.log(`   Combinations analyzed: ${analyzed}`);
        console.log(`   Signals found: ${signalsFound}`);
        console.log(`   Total accumulated: ${this.signalsCount}`);
        console.log(`   Skipped scans so far: ${skippedScans}`);
        console.log(`████████████████████████████████████████████████████████\n`);

        // ✅ Move recovery/cleanup to background (fire-and-forget) to avoid blocking scans
        console.log(`🔍 Recovery check: scanCount = ${this.scanCount}, will run? ${this.scanCount % 6 === 0}`);
        if (this.scanCount % 6 === 0) {
          // ✅ FIRE-AND-FORGET: Don't await these operations
          this.recuperarTradesPendentes().catch(err => {
            console.error(`❌ Background recovery error: ${err.message}`);
          });
          this.limparDadosAntigos().catch(err => {
            console.error(`❌ Background cleanup error: ${err.message}`);
          });
        }
        this.scanCount++;
      } catch (err) {
        console.error(`❌ CRITICAL ERROR in scan loop: ${err.message}`);
        console.error(`   Stack: ${err.stack}`);
      } finally {
        const globalElapsed = ((Date.now() - globalStartTime) / 1000).toFixed(2);
        console.log(`🟢 ===== SCAN #${totalScans} COMPLETED (${globalElapsed}s) =====\n`);
        // ✅ UNLOCK: Allow next scan
        this.isScanning = false;
      }
    }, SCAN_INTERVAL);
  }

  async registrarSinalSimulado(active, timeframe, direction, lastCandle, strategyResult) {
    const signalTime = new Date();
    const signalPrice = +lastCandle.close;
    const ativoNome = getAssetName(active.id);

    // ✅ Save signal to strategy_trades (only columns that exist)
    const { data, error } = await supabase.from('strategy_trades').insert({
      active_id: active.id.toString(),
      ativo_nome: ativoNome,
      timeframe: timeframe,
      signal_timestamp: signalTime.toISOString(),
      signal_direction: direction,
      signal_price: signalPrice,
      result: 'PENDING'
    }).select('id').single();

    if (error || !data) {
      console.log(`❌ Erro ao inserir trade: ${error?.message}`);
      return;
    }

    const tradeId = data.id;
    const delay = timeframe * 1000 + 2000;

    // ✅ Schedule verification using unique ID
    setTimeout(async () => {
      await this.verificarResultado(tradeId, active.id, timeframe, signalPrice, direction);
    }, delay);
  }

  async verificarResultado(tradeId, activeId, timeframe, signalPrice, direction) {
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
      const { error } = await supabase
        .from('strategy_trades')
        .update({
          result_timestamp: new Date().toISOString(),
          result_price: resultPrice,
          result: isWin ? 'WIN' : 'LOSS',
          price_diff: resultPrice - signalPrice
        })
        .eq('id', tradeId);

      if (error) {
        console.log(`❌ Erro ao atualizar trade ${tradeId}: ${error.message}`);
      } else {
        console.log(`✅ Trade ${tradeId.substring(0, 8)} | ${isWin ? 'WIN' : 'LOSS'} | ${resultPrice.toFixed(4)}`);
      }
    } catch (err) {
      console.log(`❌ Erro ao verificar resultado: ${err.message}`);
    }
  }

  async recuperarTradesPendentes() {
    try {
      const recoveryStartTime = Date.now();
      console.log(`🔧 [RECOVERY] Starting pending trades recovery...`);

      const { data: pendingTrades, error } = await supabase
        .from('strategy_trades')
        .select('*')
        .eq('result', 'PENDING')
        .lt('signal_timestamp', new Date(Date.now() - 15 * 1000).toISOString())
        .limit(50);

      if (error) {
        console.error(`❌ [RECOVERY] Error fetching pending trades: ${error.message}`);
        console.error(`   Code: ${error.code}, Details: ${JSON.stringify(error.details)}`);
        return;
      }

      if (!pendingTrades || pendingTrades.length === 0) {
        console.log(`✅ [RECOVERY] No pending trades to recover`);
        return;
      }

      console.log(`🔧 [RECOVERY] Found ${pendingTrades.length} orphaned PENDING trades. Verifying results...`);

      let verified = 0;
      for (const trade of pendingTrades) {
        try {
          const timeSinceSignal = Date.now() - new Date(trade.signal_timestamp).getTime();

          if (timeSinceSignal >= (trade.timeframe * 1000 + 2000)) {
            await this.verificarResultado(
              trade.id,
              parseInt(trade.active_id),
              trade.timeframe,
              trade.signal_price,
              trade.signal_direction
            );
            verified++;

            await new Promise(r => setTimeout(r, 100)); // Rate limiting
          }
        } catch (err) {
          console.error(`❌ [RECOVERY] Error verifying trade ${trade.id}: ${err.message}`);
        }
      }

      const recoveryTime = Date.now() - recoveryStartTime;
      console.log(`✅ [RECOVERY] Completed in ${recoveryTime}ms. Verified: ${verified}/${pendingTrades.length}`);
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

      const { count, error } = await supabase
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
   * Save micro-batch of signals and schedule immediate verification
   * @param {Array} signals - Batch of signals to save (max 25)
   */
  async saveMicroBatch(signals) {
    const batchStartTime = Date.now();

    try {
      const { data: insertedSignals, error } = await supabase
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

      // ✅ IMMEDIATE VERIFICATION SCHEDULING (direct setTimeout - no queue overhead)
      insertedSignals.forEach((inserted, index) => {
        const signal = signals[index];
        if (!inserted?.id) return;

        const delay = signal.timeframe * 1000 + 2000;

        // ✅ Direct setTimeout (proven pattern from old code)
        setTimeout(async () => {
          await this.verificarResultado(
            inserted.id,
            +signal.active_id,  // Unary + for faster conversion
            signal.timeframe,
            signal.signal_price,
            signal.signal_direction
          );
        }, delay);
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
