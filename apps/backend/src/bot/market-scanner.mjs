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

const TIMEFRAMES = [10, 30, 60, 180, 300]; // ✅ 10s, 30s, 1min, 3min, 5min
const SCAN_INTERVAL = 10000; // 10 seconds
const AVALON_WS_URL = process.env.AVALON_WS_URL || 'wss://ws.trade.avalonbroker.com/echo/websocket';
const AVALON_API_HOST = process.env.AVALON_API_HOST || 'https://trade.avalonbroker.com';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://vecofrvxrepogtigmeyj.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

class MarketScanner {
  constructor() {
    this.sdk = null;
    this.blitz = null;
    this.candlesService = null;
    this.signalsCount = 0;
    this.systemSSID = null;
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
    console.log('🔄 Scanner tempo real iniciado (scan a cada 10s)\n');
    console.log('📊 Monitorando: 49 ativos × 5 timeframes = 245 combinações (Estratégia Híbrida Agressiva)\n');

    setInterval(async () => {
      const startTime = Date.now();
      let analyzed = 0;
      let signalsFound = 0;

      // ✅ Get fixed assets list
      const fixedAssets = getAvailableAssets();

      // ✅ Get available assets from SDK for validation
      const availableFromSDK = this.blitz.getActives();
      const availableIds = new Set(availableFromSDK.map(a => a.id));

      // ✅ Filter only assets that are currently available
      const actives = fixedAssets
        .filter(fixedAsset => availableIds.has(fixedAsset.id))
        .map(fixedAsset => {
          return availableFromSDK.find(sdkActive => sdkActive.id === fixedAsset.id);
        })
        .filter(active => active !== undefined);

      console.log(`✅ ${actives.length}/${fixedAssets.length} ativos disponíveis agora\n`);

      for (const active of actives) {
        for (const timeframe of TIMEFRAMES) {
          try {
            const candles = await this.candlesService.getCandles(active.id, timeframe, { count: 50 });
            if (!candles || candles.length < 50) continue;

            const candlesFormatted = candles.map(c => ({
              open: parseFloat(c.open),
              high: parseFloat(c.max),
              low: parseFloat(c.min),
              close: parseFloat(c.close),
              timestamp: c.from
            }));

            // ✅ Use ONLY aggressive hybrid strategy (4 advisors)
            analyzed++;
            const result = analyzeAggressive(candlesFormatted);

            // Aggressive strategy ALWAYS returns a signal
            if (result?.consensus && result.consensus !== 'NEUTRAL') {
              signalsFound++;
              await this.registrarSinalSimulado(active, timeframe, result.consensus, candles[candles.length - 1], result);

              console.log(`✅ ${active.ticker || active.id} | ${timeframe}s | ${result.consensus} (${result.confidence}%)`);
            }

            await new Promise(r => setTimeout(r, 50)); // Rate limiting
          } catch (err) {
            // Silent - too many assets to log every error
          }
        }
      }

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      this.signalsCount += signalsFound;

      console.log(`\n⏱️ Scan completo: ${analyzed} combinações | ${signalsFound} sinais | ${elapsed}s`);
      console.log(`📈 Total acumulado: ${this.signalsCount} sinais\n`);

      // ✅ Recover orphaned PENDING trades from previous runs
      await this.recuperarTradesPendentes();
      await this.limparDadosAntigos();
    }, SCAN_INTERVAL);
  }

  async registrarSinalSimulado(active, timeframe, direction, lastCandle, strategyResult) {
    const signalTime = new Date();
    const signalPrice = parseFloat(lastCandle.close);
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

      const resultPrice = parseFloat(candles[candles.length - 1].close);
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
        console.log(`✅ Trade ${tradeId.substring(0, 8)} | ${isWin ? 'WIN' : 'LOSS'} | ${resultPrice.toFixed(2)}`);
      }
    } catch (err) {
      console.log(`❌ Erro ao verificar resultado: ${err.message}`);
    }
  }

  async recuperarTradesPendentes() {
    try {
      const { data: pendingTrades, error } = await supabase
        .from('strategy_trades')
        .select('*')
        .eq('result', 'PENDING')
        .lt('signal_timestamp', new Date(Date.now() - 15 * 1000).toISOString())
        .limit(50);

      if (error || !pendingTrades || pendingTrades.length === 0) return;

      console.log(`🔧 Recuperando ${pendingTrades.length} trades PENDING órfãos...`);

      for (const trade of pendingTrades) {
        const timeSinceSignal = Date.now() - new Date(trade.signal_timestamp).getTime();

        if (timeSinceSignal >= (trade.timeframe * 1000 + 2000)) {
          await this.verificarResultado(
            trade.id,
            parseInt(trade.active_id),
            trade.timeframe,
            trade.signal_price,
            trade.signal_direction
          );

          await new Promise(r => setTimeout(r, 100)); // Rate limiting
        }
      }
    } catch (err) {
      console.log(`⚠️ Erro na recuperação: ${err.message}`);
    }
  }

  async limparDadosAntigos() {
    // ✅ 30-minute TTL (Time To Live) for fresh signals
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    await supabase.from('strategy_trades').delete().lt('signal_timestamp', thirtyMinutesAgo);
  }

  async start() {
    await this.connect();
    this.scanLoop();
  }
}

const scanner = new MarketScanner();
scanner.start().catch(console.error);
