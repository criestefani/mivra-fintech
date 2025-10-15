// src/scanner/market-scanner.mjs
import { ClientSdk, SsidAuthMethod } from '@quadcode-tech/client-sdk-js';
import { createClient } from '@supabase/supabase-js';
import { calculateRSI } from '../bot/indicators/rsi.mjs';
import { calculateMACD } from '../bot/indicators/macd.mjs';
import { calculateBollinger } from '../bot/indicators/bollinger.mjs';
import { analyzeHybrid } from '../bot/strategies/strategy-hybrid.mjs';
// ✅ NOVA IMPORTAÇÃO: Lista fixa de ativos (140 ativos oficiais)
import { getAvailableAssets, resolveAssetById, getAssetName } from '../constants/fixed-assets.mjs';

const SSID = "128a3cf5b3857595e14391d79230a42s";
const TIMEFRAMES = [10, 30, 60, 180, 300]; // ✅ 10s, 30s, 1min, 3min, 5min
const SCAN_INTERVAL = 10000;
const MIN_CONSENSUS = 2;

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://vecofrvxrepogtigmeyj.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
);

class MarketScanner {
  constructor() {
    this.sdk = null;
    this.blitz = null;
    this.candlesService = null;
    this.signalsCount = 0;
  }

  async connect() {
    this.sdk = await ClientSdk.create(
      'wss://ws.trade.avalonbroker.com/echo/websocket',
      82,
      new SsidAuthMethod(SSID),
      { host: 'https://trade.avalonbroker.com' }
    );
    this.blitz = await this.sdk.blitzOptions();
    this.candlesService = await this.sdk.candles();
    console.log('✅ Conectado ao Avalon\n');
  }

  analyzeBalanced(candlesFormatted) {
    if (candlesFormatted.length < 35) return null;

    try {
      const rsi = calculateRSI(candlesFormatted);
      const macd = calculateMACD(candlesFormatted);
      const bb = calculateBollinger(candlesFormatted);

      const signals = [];
      if (rsi.signal !== 'NEUTRO') signals.push(rsi.signal);
      if (macd.trend !== 'NEUTRO') signals.push(macd.trend);
      if (bb.signal !== 'NEUTRO' && bb.signal !== 'SQUEEZE') signals.push(bb.signal);

      const callCount = signals.filter(s => s === 'CALL').length;
      const putCount = signals.filter(s => s === 'PUT').length;

      if (callCount >= MIN_CONSENSUS) {
        return { consensus: 'CALL', strength: callCount * 25 };
      } else if (putCount >= MIN_CONSENSUS) {
        return { consensus: 'PUT', strength: putCount * 25 };
      }
    } catch (err) {
      return null;
    }

    return null;
  }

  async scanLoop() {
    console.log('🔄 Scanner tempo real iniciado (scan a cada 10s)\n');
    console.log('📊 Monitorando: 140 ativos × 5 timeframes = 700 combinações (Estratégia Híbrida)\n');

    setInterval(async () => {
      const startTime = Date.now();
      let analyzed = 0;
      let signalsFound = 0;

      // ✅ MUDANÇA: Usar lista fixa ao invés de blitz.getActives()
      const fixedAssets = getAvailableAssets();

      // ✅ Obter ativos disponíveis do SDK apenas para validação
      const availableFromSDK = this.blitz.getActives();
      const availableIds = new Set(availableFromSDK.map(a => a.id));

      // ✅ Filtrar apenas ativos que estão disponíveis no SDK agora
      const actives = fixedAssets
        .filter(fixedAsset => availableIds.has(fixedAsset.id))
        .map(fixedAsset => {
          // Encontrar o objeto SDK correspondente para ter acesso aos métodos
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

            // ✅ Use ONLY hybrid strategy (combines all 4 signals with weighted voting)
            analyzed++;
            const result = analyzeHybrid(candlesFormatted);

            if (result?.consensus && result.consensus !== 'NEUTRAL') {
              signalsFound++;
              await this.registrarSinalSimulado(active, timeframe, result.consensus, candles[candles.length - 1]);

              console.log(`✅ ${active.ticker || active.id} | ${timeframe}s | Híbrida → ${result.consensus} (${result.confidence}%)`);
            }

            await new Promise(r => setTimeout(r, 50));
          } catch (err) {
            // Silencioso
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

  async registrarSinalSimulado(active, timeframe, direction, lastCandle) {
    const signalTime = new Date();
    const signalPrice = parseFloat(lastCandle.close);

    // ✅ MUDANÇA: Usar getAssetName da lista fixa para nome consistente
    const ativoNome = getAssetName(active.id);

    // ✅ Get the inserted record ID for reliable UPDATE
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
    console.log(`⏰ Agendando verificação do trade ${tradeId.substring(0, 8)} em ${delay}ms`);
    setTimeout(async () => {
      console.log(`🔍 Verificando resultado do trade ${tradeId.substring(0, 8)}...`);
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

      // ✅ Update by unique ID - much more reliable
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
      // ✅ Find PENDING trades older than their timeframe + grace period
      const { data: pendingTrades, error } = await supabase
        .from('strategy_trades')
        .select('*')
        .eq('result', 'PENDING')
        .lt('signal_timestamp', new Date(Date.now() - 15 * 1000).toISOString()) // Older than 15 seconds
        .limit(50);

      if (error || !pendingTrades || pendingTrades.length === 0) return;

      console.log(`🔧 Recuperando ${pendingTrades.length} trades PENDING órfãos...`);

      for (const trade of pendingTrades) {
        const timeSinceSignal = Date.now() - new Date(trade.signal_timestamp).getTime();

        // Only process if enough time has passed for this timeframe
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
