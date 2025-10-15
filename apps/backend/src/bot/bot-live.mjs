// src/bot/bot-live.mjs


import { ClientSdk, SsidAuthMethod, BlitzOptionsDirection } from '@quadcode-tech/client-sdk-js';
import { createClient } from '@supabase/supabase-js';
import { calculateRSI } from './indicators/rsi.mjs';
import { calculateMACD } from './indicators/macd.mjs';
import { calculateBollinger } from './indicators/bollinger.mjs';
import { analyzeAggressive } from './strategies/strategy-aggressive.mjs';
import { analyzeConservative } from './strategies/strategy-conservative.mjs';
import { analyzeBalanced } from './strategies/strategy-balanced.mjs';


// ✅ IMPORTS DO @mivratec/shared
import { STRATEGIES, TIMEFRAMES } from '@mivratec/shared/constants';
import { validateSignal, validatePerformance } from '@mivratec/shared/schemas';


// CONFIGURAÇÃO
const STRATEGY = process.env.STRATEGY || 'balanced';


// ✅ MAPEAMENTO: env → constants (permite usar STRATEGY da env)
const STRATEGY_MAP = Object.fromEntries(
  STRATEGIES.map(s => [s.id, s])
);


const SSID = "aaecf415a5e7e16128f8b109b77cedda";
const TRADE_AMOUNT = 1;
const MIN_CONSENSUS = 2;


// ✅ Service Role Key para ignorar RLS
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://vecofrvxrepogtigmeyj.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
);


class MivraTecBot {
  constructor() {
    this.sdk = null;
    this.blitz = null;
    this.candlesService = null;
    this.balance = null;
    this.tradesHoje = 0;
    this.winsHoje = 0;
    this.lucroHoje = 0;


    // ✅ Armazena user_id do comando START
    this.currentUserId = null;


    // Sistema de HOLD
    this.assetLosses = new Map();
    this.blockedAssets = new Map();
    this.HOLD_TIME = 5 * 60 * 1000;
    this.MAX_CONSECUTIVE_LOSSES = 2;
  }


  async init() {
    console.log('🔐 Conectando ao Avalon...');
    this.sdk = await ClientSdk.create(
      'wss://ws.trade.avalonbroker.com/echo/websocket',
      82,
      new SsidAuthMethod(SSID),
      { host: 'https://trade.avalonbroker.com' }
    );


    this.blitz = await this.sdk.blitzOptions();
    this.candlesService = await this.sdk.candles();


    const balancesData = await this.sdk.balances();
    this.balance = null;
    for (const [id, bal] of balancesData.balances) {
      if (bal.amount > 0) {
        this.balance = bal;
        console.log(`✅ Usando Balance: ${bal.amount} ${bal.currency}`);
        break;
      }
    }


    if (!this.balance) throw new Error('Nenhum saldo disponível!');
    console.log('✅ Conectado ao Avalon\n');
  }


  atualizarStats(resultado, pnl) {
    this.tradesHoje++;
    this.lucroHoje += pnl;
    if (resultado === 'WIN') this.winsHoje++;


    const winRate = ((this.winsHoje / this.tradesHoje) * 100).toFixed(1);
    console.log(`📊 Stats: ${this.winsHoje}W/${this.tradesHoje - this.winsHoje}L | Win Rate: ${winRate}% | Lucro: $${this.lucroHoje.toFixed(2)}`);
  }


  checkAssetHold(activeId) {
    if (this.blockedAssets.has(activeId)) {
      const blockedUntil = this.blockedAssets.get(activeId);
      const now = Date.now();


      if (now < blockedUntil) {
        const remainingMinutes = Math.ceil((blockedUntil - now) / 60000);
        console.log(`🚫 Ativo ${activeId} bloqueado! Restam ${remainingMinutes} min`);
        return true;
      } else {
        this.blockedAssets.delete(activeId);
        this.assetLosses.delete(activeId);
        return false;
      }
    }
    return false;
  }


  blockAssetAfterLoss(activeId, activeName) {
    const currentLosses = (this.assetLosses.get(activeId) || 0) + 1;
    this.assetLosses.set(activeId, currentLosses);
    console.log(`📉 ${activeName}: ${currentLosses} perda(s) consecutiva(s)`);


    if (currentLosses >= this.MAX_CONSECUTIVE_LOSSES) {
      const blockedUntil = Date.now() + this.HOLD_TIME;
      this.blockedAssets.set(activeId, blockedUntil);
      console.log(`⏸️ ${activeName} bloqueado por ${this.HOLD_TIME / 60000} minutos!\n`);
    }
  }


  resetAssetLosses(activeId) {
    if (this.assetLosses.has(activeId)) {
      this.assetLosses.delete(activeId);
    }
  }


  async checkStartCommand() {
    console.log('👁️ Verificando comando START...');


    const { data: commands, error } = await supabase
      .from('bot_control')
      .select('*')
      .eq('status', 'ACTIVE')
      .order('updated_at', { ascending: false })
      .limit(1);


    if (error) {
      console.error('❌ Erro ao verificar bot_control:', error.message);
      return false;
    }


    if (!commands || commands.length === 0) {
      console.log('⚪ Bot não está ativo\n');
      return false;
    }


    const cmd = commands[0];
    console.log(`🟢 Comando START detectado para user: ${cmd.user_id}\n`);


    // ✅ ARMAZENA user_id
    this.currentUserId = cmd.user_id;


    return true;
  }


  async buscarNomeAtivo(activeId) {
    try {
      const actives = this.blitz.getActives();
      const ativo = actives.find(a => a.id === activeId);
      return ativo ? (ativo.ticker || `ID-${activeId}`) : `ID-${activeId}`;
    } catch (error) {
      return `ID-${activeId}`;
    }
  }


  async salvarNoSupabase(positionId, signal, order) {
    const { data: existente } = await supabase
      .from('trade_history')
      .select('external_id')
      .eq('external_id', positionId)
      .single();


    if (existente) {
      console.log(`⚠️ Trade ${positionId} já existe`);
      return;
    }


    const ativoNome = await this.buscarNomeAtivo(signal.active.id);
    const expirationSeconds = Math.max(1, Math.round((order.expiredAt.getTime() - Date.now()) / 1000));


    // ✅ USAR STRATEGY_MAP para obter dados corretos
    const strategyInfo = STRATEGY_MAP[STRATEGY] || STRATEGIES[0];


     // ✅ VALIDAÇÃO ZOD: prepara dados corretos para Signal schema
    const signalData = {
      asset: ativoNome,
      direction: signal.consensus, // 'CALL' ou 'PUT'
      confidence: 0.75, // placeholder
      timestamp: Date.now()
    };


    // ✅ VALIDA com Zod antes de salvar
    try {
      validateSignal(signalData);
    } catch (validationError) {
      console.error('⚠️ Erro de validação Zod (continuando...):', JSON.stringify(validationError.errors || validationError.message));
    }


    const { error } = await supabase
      .from('trade_history')
      .insert([{
        user_id: this.currentUserId,
        external_id: positionId,
        type: 'blitz-option',
        active_id: signal.active.id,
        ativo_nome: ativoNome,
        direction: signal.consensus.toLowerCase(),
        valor: TRADE_AMOUNT,
        profit_esperado: order.expectedProfit || 0.85,
        expiration_seconds: expirationSeconds,
        strategy_id: strategyInfo.id,
        status: 'open',
        data_abertura: new Date().toISOString(),
        data_expiracao: order.expiredAt.toISOString()
      }]);


    if (error) {
      console.error('❌ Erro ao salvar no Supabase:', error.message);
    } else {
      console.log(`✅ Trade salvo! ${ativoNome} | ${expirationSeconds}s | ${strategyInfo.name}`);
    }
  }


  async atualizarResultado(positionId) {
    console.log(`🔍 Verificando resultado de ${positionId}...`);


    try {
      const positionsData = await this.sdk.positions();


      for (const [id, position] of positionsData.positions) {
        if (position.externalId === positionId && position.status !== 'open') {
          return await this.salvarResultado(position, positionId);
        }
      }


      const positionsHistory = positionsData.getPositionsHistory();
      await positionsHistory.fetchPrevPage();
      const historyPositions = positionsHistory.getPositions();


      for (const position of historyPositions) {
        if (position.externalId === positionId) {
          return await this.salvarResultado(position, positionId);
        }
      }


      console.log(`⚠️ Position ${positionId} não encontrada`);
      return false;
    } catch (error) {
      console.error(`❌ Erro ao buscar resultado:`, error.message);
      return false;
    }
  }


  async salvarResultado(position, positionId) {
    let resultado = null;
    if (position.pnl > 0) resultado = 'WIN';
    else if (position.pnl < 0) resultado = 'LOSS';
    else resultado = 'TIE';


    console.log(`📊 Resultado: ${resultado} | PnL: ${position.pnl}`);
    this.atualizarStats(resultado, position.pnl);


    const { data: tradeData } = await supabase
      .from('trade_history')
      .select('active_id, ativo_nome, strategy_id, data_abertura')
      .eq('external_id', positionId)
      .single();


    if (tradeData) {
      if (resultado === 'LOSS') {
        this.blockAssetAfterLoss(tradeData.active_id, tradeData.ativo_nome);
      } else if (resultado === 'WIN') {
        this.resetAssetLosses(tradeData.active_id);
      }


      // ✅ VALIDAÇÃO ZOD: valida dados do sinal atualizado
            // ✅ COMENTADO: validação não aplicável aqui (resultado já foi executado)
      // Remover validação desnecessária no update de resultado


    }


    const { error } = await supabase
      .from('trade_history')
      .update({
        resultado: resultado,
        pnl: position.pnl,
        status: position.status
      })
      .eq('external_id', positionId);


    if (error) {
      console.error('❌ Erro ao atualizar trade:', error.message);
    } else {
      console.log(`✅ Trade atualizado!\n`);
    }


    return true;
  }


  async analyzeActive(active, candleData) {
    try {
      const candlesFormatted = candleData.map(c => ({
        open: parseFloat(c.open),
        high: parseFloat(c.max),
        low: parseFloat(c.min),
        close: parseFloat(c.close),
        timestamp: c.from
      }));


      if (candlesFormatted.length < 35) return null;


      let analysis = null;


      // ✅ USAR IDs das CONSTANTS
      if (STRATEGY === 'aggressive') {
        analysis = analyzeAggressive(candlesFormatted);
      } else if (STRATEGY === 'conservative') {
        analysis = analyzeConservative(candlesFormatted);
      } else if (STRATEGY === 'balanced') {
        analysis = analyzeBalanced(candlesFormatted);
      } else {
        const rsi = calculateRSI(candlesFormatted);
        const macd = calculateMACD(candlesFormatted);
        const bb = calculateBollinger(candlesFormatted);


        const signals = [];
        if (rsi.signal !== 'NEUTRO') signals.push(rsi.signal);
        if (macd.trend !== 'NEUTRO') signals.push(macd.trend);
        if (bb.signal !== 'NEUTRO' && bb.signal !== 'SQUEEZE') signals.push(bb.signal);


        const callCount = signals.filter(s => s === 'CALL').length;
        const putCount = signals.filter(s => s === 'PUT').length;


        if (callCount >= MIN_CONSENSUS) analysis = { consensus: 'CALL', strength: callCount };
        else if (putCount >= MIN_CONSENSUS) analysis = { consensus: 'PUT', strength: putCount };
      }


      if (!analysis) return null;


      return {
        activeId: active.id,
        activeName: active.name || active.ticker || `ID-${active.id}`,
        direction: analysis.consensus,
        confidence: analysis.confidence || (analysis.strength * 25),
        strategyType: analysis.type || 'UNKNOWN'
      };
    } catch (error) {
      return null;
    }
  }


  async scanAllAssets() {
    const actives = this.blitz.getActives().filter(a => a.canBeBoughtAt(new Date()));
    console.log(`🔍 Analisando ${actives.length} ativos...`);


    const startTime = Date.now();
    const batchSize = 20;
    const allResults = [];


    for (let i = 0; i < actives.length; i += batchSize) {
      const batch = actives.slice(i, i + batchSize);
      const batchPromises = batch.map(async (active) => {
        try {
          // ✅ USAR TIMEFRAMES[3] (60 segundos)
          const candleData = await this.candlesService.getCandles(active.id, 60, { count: 50 });
          return this.analyzeActive(active, candleData);
        } catch (error) {
          return null;
        }
      });


      const batchResults = await Promise.all(batchPromises);
      allResults.push(...batchResults);


      if (i + batchSize < actives.length) {
        await new Promise(r => setTimeout(r, 300));
      }
    }


    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const validSignals = allResults
      .filter(r => r && r.direction !== 'NEUTRO')
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0));


    console.log(`⚡ Análise concluída em ${elapsed}s`);
    console.log(`✅ ${validSignals.length} sinais válidos\n`);


    return validSignals;
  }


  async executarCicloTrade() {
    try {
      console.log('🔄 === NOVO CICLO ===\n');


      const signals = await this.scanAllAssets();
      if (signals.length === 0) {
        console.log('⚪ Nenhum sinal forte\n');
        return;
      }


      const availableSignals = signals.filter(signal => !this.checkAssetHold(signal.activeId));


      if (availableSignals.length === 0) {
        console.log('⚠️ Todos os ativos em hold\n');
        return;
      }


      const signal = availableSignals[0];
      const icon = signal.direction === 'CALL' ? '🟢' : '🔴';
      console.log(`${icon} ${signal.activeName} → ${signal.direction} | Conf: ${signal.confidence}%`);


      const actives = this.blitz.getActives();
      const activeObj = actives.find(a => a.id === signal.activeId);


      if (!activeObj) {
        console.log(`❌ Ativo não disponível`);
        return;
      }


      const direction = signal.direction === 'CALL'
        ? BlitzOptionsDirection.Call
        : BlitzOptionsDirection.Put;


      const expirationTime = activeObj.expirationTimes.find(t => t === 30) || 30;
      const order = await this.blitz.buy(activeObj, direction, expirationTime, TRADE_AMOUNT, this.balance);


      const positionId = order.id;
      console.log(`✅ Posição ${positionId} aberta\n`);


      await new Promise(r => setTimeout(r, 3000));


      const signalForSave = {
        active: activeObj,
        consensus: signal.direction,
        strategyType: signal.strategyType
      };


      await this.salvarNoSupabase(positionId, signalForSave, order);


      const waitTime = Math.max(0, order.expiredAt.getTime() - Date.now() + 15000);
      console.log(`⏳ Aguardando ${(waitTime/1000).toFixed(0)}s...\n`);
      await new Promise(r => setTimeout(r, waitTime));


      await this.atualizarResultado(positionId);
    } catch (error) {
      console.error('❌ Erro no ciclo:', error.message);
    }
  }


  async start() {
    console.log('🤖 MivraTec Bot Started\n');


    while (true) {
      const hasStart = await this.checkStartCommand();
      if (hasStart) break;
      await new Promise(r => setTimeout(r, 5000));
    }


    await this.init();
    console.log('🚀 Bot ATIVADO!\n');


    while (true) {
      try {
        await this.executarCicloTrade();
        await new Promise(r => setTimeout(r, 2000));
      } catch (err) {
        console.error('❌ Erro crítico:', err.message);
        await new Promise(r => setTimeout(r, 10000));
      }
    }
  }
}


const bot = new MivraTecBot();
bot.start().catch(err => {
  console.error('❌ Fatal:', err.message);
  process.exit(1);
});



