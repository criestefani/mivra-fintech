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
    console.log('🚀 HIGH-PERFORMANCE SCANNER: 2-Concurrent API + Dynamic Interval\n');
    console.log('📊 Monitorando: 141 ativos × 4 timeframes = 564 combinações\n');

    let totalScans = 0;

    const performScan = async () => {
      totalScans++;

      // ✅ PREVENT OVERLAPS: Skip if already scanning
      if (this.isScanning) {
        console.log(`⏳ Scan #${totalScans} waiting... (previous still running)`);
        setTimeout(performScan, 5000); // Retry in 5s
        return;
      }

      this.isScanning = true;
      const scanStartTime = Date.now();

      try {
        console.log(`\n🟢 SCAN #${totalScans} INICIADO`);

        // Get combinations to process
        const fixedAssets = getAvailableAssets();
        const availableFromSDK = this.blitz.getActives();
        const availableIds = new Set(availableFromSDK.map(a => a.id));
        const actives = fixedAssets
          .filter(a => availableIds.has(a.id))
          .map(a => availableFromSDK.find(sdk => sdk.id === a.id))
          .filter(a => a !== undefined);

        const combinations = [];
        for (const active of actives) {
          for (const timeframe of TIMEFRAMES) {
            combinations.push({ active, timeframe });
          }
        }

        console.log(`🔄 Processing ${combinations.length} combinations with 2-concurrent calls...`);

        // ✅ 2-CONCURRENT PROCESSING: Process in pairs
        let signalsFound = 0;
        let totalCandlesFetched = 0;
        let totalErrors = 0;

        for (let i = 0; i < combinations.length; i += CONCURRENT_LIMIT) {
          const concurrentPair = combinations.slice(i, i + CONCURRENT_LIMIT);

          // Process 2 calls in parallel
          const promises = concurrentPair.map(async ({ active, timeframe }) => {
            try {
              const candles = await this.candlesService.getCandles(active.id, timeframe, { count: 50 });

              if (!candles || candles.length < 50) {
                totalErrors++;
                return null;
              }

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

                return {
                  active_id: active.id.toString(),
                  ativo_nome: ativoNome,
                  timeframe: timeframe,
                  signal_timestamp: new Date().toISOString(),
                  signal_direction: result.consensus,
                  signal_price: signalPrice,
                  result: 'PENDING'
                };
              }

              return null;
            } catch (err) {
              totalErrors++;
              return null;
            }
          });

          // Wait for pair to complete
          const pairResults = await Promise.all(promises);

          // ✅ STREAMING SAVES: Save each signal immediately
          for (const signal of pairResults) {
            if (signal) {
              try {
                const { data, error } = await supabase
                  .from('strategy_trades')
                  .insert(signal)
                  .select('id');

                if (!error && data?.length > 0) {
                  signalsFound++;
                  this.signalsCount++;

                  // Schedule verification immediately
                  const tradeId = data[0].id;
                  const delay = signal.timeframe * 1000 + 2000;

                  setTimeout(async () => {
                    await this.verificarResultado(
                      tradeId,
                      +signal.active_id,
                      signal.timeframe,
                      signal.signal_price,
                      signal.signal_direction
                    );
                  }, delay);

                  console.log(`✅ ${signal.ativo_nome} | ${signal.timeframe}s | ${signal.signal_direction}`);
                }
              } catch (err) {
                console.error(`❌ Save error: ${err.message}`);
              }
            }
          }
        }

        const scanDuration = Date.now() - scanStartTime;
        const scanSeconds = (scanDuration / 1000).toFixed(1);

        console.log(`\n📊 Scan complete:`);
        console.log(`   Time: ${scanSeconds}s`);
        console.log(`   Fetched: ${totalCandlesFetched}, Errors: ${totalErrors}`);
        console.log(`   Signals found: ${signalsFound}`);
        console.log(`   Total accumulated: ${this.signalsCount}\n`);

        // ✅ BACKGROUND TASKS: Fire-and-forget
        if (this.scanCount % 6 === 0) {
          this.recuperarTradesPendentes().catch(err => console.error(`Recovery error: ${err.message}`));
          this.limparDadosAntigos().catch(err => console.error(`Cleanup error: ${err.message}`));
        }
        this.scanCount++;

        // ✅ DYNAMIC INTERVAL: Schedule next scan based on duration
        const nextInterval = Math.max(15000, scanDuration + 10000);
        console.log(`⏰ Next scan in ${(nextInterval / 1000).toFixed(1)}s...\n`);
        setTimeout(performScan, nextInterval);

      } catch (err) {
        console.error(`❌ SCAN ERROR: ${err.message}`);
        console.error(`   Stack: ${err.stack}`);

        // Retry on error
        setTimeout(performScan, 30000);
      } finally {
        this.isScanning = false;
      }
    };

    // Start first scan after initial delay
    setTimeout(performScan, INITIAL_SCAN_DELAY);
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
