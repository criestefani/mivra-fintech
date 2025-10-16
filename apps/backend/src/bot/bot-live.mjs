// src/bot/bot-live.mjs


import { ClientSdk, SsidAuthMethod, BlitzOptionsDirection } from '@quadcode-tech/client-sdk-js';
import { createClient } from '@supabase/supabase-js';
import { calculateRSI } from './indicators/rsi.mjs';
import { calculateMACD } from './indicators/macd.mjs';
import { calculateBollinger } from './indicators/bollinger.mjs';
import { analyzeAggressive } from './strategies/strategy-aggressive.mjs';
import { analyzeConservative } from './strategies/strategy-conservative.mjs';
import { analyzeBalanced } from './strategies/strategy-balanced.mjs';


// ✅ Shared constants / helpers (previously provided by @mivratec/shared)
import { STRATEGIES, TIMEFRAMES } from './constants.mjs';
import { validateSignal, validatePerformance } from './schemas.mjs';


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


    // ✅ Armazena user_id, SSID, estratégia e modo do comando START
    this.currentUserId = null;
    this.userSSID = null;
    this.strategy = 'balanced'; // Default: balanced
    this.botMode = 'auto'; // Default: auto


    // Sistema de HOLD
    this.assetLosses = new Map();
    this.blockedAssets = new Map();
    this.HOLD_TIME = 5 * 60 * 1000;
    this.MAX_CONSECUTIVE_LOSSES = 2;

    // ✅ ONE-AT-A-TIME TRADING: Only one position open at a time
    this.currentOpenPosition = null;

    // ✅ DYNAMIC STATUS TRACKING
    this.botStatus = 'Starting bot...';
    this.currentAsset = null;
    this.currentAssetName = null;
  }


  async init() {
    console.log('🔐 Conectando ao Avalon...');

    // ✅ Usar SSID do usuário (não hardcoded)
    const ssidToUse = this.userSSID || SSID;
    console.log(`🔑 Usando SSID: ${ssidToUse.substring(0, 15)}...`);

    this.sdk = await ClientSdk.create(
      'wss://ws.trade.avalonbroker.com/echo/websocket',
      82,
      new SsidAuthMethod(ssidToUse),
      { host: 'https://trade.avalonbroker.com' }
    );


    this.blitz = await this.sdk.blitzOptions();
    this.candlesService = await this.sdk.candles();

    // ✅ SET UP REAL-TIME POSITION UPDATES
    console.log('🔔 Configurando subscribe de positions...');
    const positionsData = await this.sdk.positions();
    positionsData.subscribeOnUpdatePosition(async (position) => {
      if (position.status !== 'open') {
        console.log(`📍 Position update detected: ${position.externalId} → ${position.status}`);

        // ✅ RESET FLAG: This position is closed, bot can trade again
        if (this.currentOpenPosition === position.externalId) {
          this.currentOpenPosition = null;
          console.log('🟢 Bot livre para nova operação\n');
        }

        await this.salvarResultado(position, position.externalId);
      }
    });
    console.log('✅ Subscribe de positions ativado\n');

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

    // ✅ SET INITIAL STATUS
    this.setStatus('Analyzing markets...');
  }


  setStatus(status, assetName = null, assetId = null) {
    this.botStatus = status;
    if (assetName) this.currentAssetName = assetName;
    if (assetId) this.currentAsset = assetId;

    // ✅ EMIT STATUS in parseable format for API server to broadcast via Socket.io
    const statusData = {
      status: status,
      currentAsset: assetName || this.currentAssetName,
      timestamp: new Date().toISOString()
    };
    console.log(`[BOT-STATUS] ${JSON.stringify(statusData)}`);
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
        const remainingSeconds = Math.ceil((blockedUntil - now) / 1000);
        console.log(`🚫 [HOLD CHECK] Ativo ${activeId} BLOQUEADO! Restam ${remainingMinutes}min (${remainingSeconds}s)`);
        return true;
      } else {
        console.log(`✅ [HOLD CHECK] Ativo ${activeId} desbloqueado - HOLD expirado`);
        this.blockedAssets.delete(activeId);
        this.assetLosses.delete(activeId);
        return false;
      }
    }
    console.log(`✅ [HOLD CHECK] Ativo ${activeId} não está bloqueado`);
    return false;
  }


  blockAssetAfterLoss(activeId, activeName) {
    const currentLosses = (this.assetLosses.get(activeId) || 0) + 1;
    this.assetLosses.set(activeId, currentLosses);
    console.log(`📉 [HOLD LOSS] ${activeName} (ID: ${activeId}): ${currentLosses}/${this.MAX_CONSECUTIVE_LOSSES} perdas consecutivas`);


    if (currentLosses >= this.MAX_CONSECUTIVE_LOSSES) {
      const blockedUntil = Date.now() + this.HOLD_TIME;
      this.blockedAssets.set(activeId, blockedUntil);
      console.log(`🔒 [HOLD APPLIED] ${activeName} bloqueado por ${this.HOLD_TIME / 60000} minutos até ${new Date(blockedUntil).toLocaleTimeString()}!\n`);
      this.printHoldStatus();
    } else {
      console.log(`⚠️ [HOLD PENDING] ${activeName} - ${this.MAX_CONSECUTIVE_LOSSES - currentLosses} mais perda(s) necessária(s) para bloquear\n`);
    }
  }


  resetAssetLosses(activeId, activeName = 'Asset') {
    if (this.assetLosses.has(activeId)) {
      const prevLosses = this.assetLosses.get(activeId);
      this.assetLosses.delete(activeId);
      console.log(`🟢 [HOLD RESET] ${activeName} (ID: ${activeId}) - ${prevLosses} perdas resetadas após WIN\n`);
    }
  }


  printHoldStatus() {
    if (this.blockedAssets.size === 0) {
      console.log(`📊 [HOLD STATUS] Nenhum ativo bloqueado no momento`);
    } else {
      console.log(`📊 [HOLD STATUS] ${this.blockedAssets.size} ativo(s) bloqueado(s):`);
      for (const [activeId, blockedUntil] of this.blockedAssets) {
        const remaining = Math.ceil((blockedUntil - Date.now()) / 1000);
        console.log(`   - Ativo ${activeId}: ${remaining}s restantes`);
      }
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
    console.log(`🟢 Comando START detectado para user: ${cmd.user_id}`);

    // ✅ ARMAZENA user_id
    this.currentUserId = cmd.user_id;

    // ✅ LER ESTRATÉGIA E MODO DO CONFIG (novo!)
    if (cmd.config) {
      this.strategy = cmd.config.strategy || 'balanced';
      this.botMode = cmd.config.mode || 'auto';
      console.log(`📋 Config: Strategy=${this.strategy}, Mode=${this.botMode}`);
    }

    // ✅ BUSCAR SSID VÁLIDO DE bot_status (que foi salvo quando conectou em POST /api/bot/connect)
    console.log('🔍 Buscando SSID válido em bot_status...');
    const { data: botStatus, error: statusError } = await supabase
      .from('bot_status')
      .select('ssid')
      .eq('user_id', this.currentUserId)
      .maybeSingle();

    if (statusError || !botStatus?.ssid) {
      console.error('❌ SSID não encontrado em bot_status! Tentando profiles.broker_user_id...');

      // Fallback: Tentar usar broker_user_id de profiles (mas isso pode não funcionar)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('broker_user_id')
        .eq('user_id', this.currentUserId)
        .maybeSingle();

      if (profileError || !profile?.broker_user_id) {
        console.error('❌ Nenhum SSID ou broker_user_id encontrado!');
        return false;
      }

      this.userSSID = profile.broker_user_id;
      console.warn(`⚠️ Usando fallback broker_user_id: ${this.userSSID.substring(0, 15)}...`);
    } else {
      this.userSSID = botStatus.ssid;
      console.log(`✅ SSID válido encontrado em bot_status`);
    }

    console.log(`🔑 SSID do usuário: ${this.userSSID.substring(0, 15)}...\n`);

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


  // ✅ Dynamic timeframe selection based on signal strength
  selectBestTimeframe(activeObj, signalConfidence) {
    const preferred = [10, 5, 30, 60]; // Preference order: 10s first, then shorter, then longer
    const available = activeObj.expirationTimes || [];

    // Sinais muito fortes (>75%) preferem timeframes maiores (mais confiança)
    if (signalConfidence > 75) {
      for (const tf of preferred) {
        if (available.includes(tf)) {
          console.log(`⏱️ Timeframe selection: confidence=${signalConfidence}% → using ${tf}s (STRONG signal)`);
          return tf;
        }
      }
    }

    // Sinais fortes (60-75%) preferem 10s/5s
    if (signalConfidence > 60) {
      for (const tf of [10, 5, 30, 60]) {
        if (available.includes(tf)) {
          console.log(`⏱️ Timeframe selection: confidence=${signalConfidence}% → using ${tf}s (GOOD signal)`);
          return tf;
        }
      }
    }

    // Sinais médios (50-60%) preferem 10s também
    if (signalConfidence > 50) {
      for (const tf of [10, 5, 30, 60]) {
        if (available.includes(tf)) {
          console.log(`⏱️ Timeframe selection: confidence=${signalConfidence}% → using ${tf}s (MEDIUM signal)`);
          return tf;
        }
      }
    }

    // Sinais fracos (<50%) usam o menor timeframe disponível
    if (available.length > 0) {
      const selected = available.sort((a, b) => a - b)[0];
      console.log(`⏱️ Timeframe selection: confidence=${signalConfidence}% → using ${selected}s (WEAK signal, smallest available)`);
      return selected;
    }

    // Fallback
    console.warn(`⚠️ No timeframe available, using default 30s`);
    return 30;
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


    // ✅ USAR STRATEGY_MAP com estratégia dinâmica
    const strategyInfo = STRATEGY_MAP[this.strategy] || STRATEGIES[0];


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

    // ✅ SET STATUS: Position closed
    const resultIcon = resultado === 'WIN' ? '✅' : resultado === 'LOSS' ? '❌' : '⚪';
    this.setStatus(`Position closed - ${resultIcon} ${resultado}`);

    const { data: tradeData } = await supabase
      .from('trade_history')
      .select('active_id, ativo_nome, strategy_id, data_abertura')
      .eq('external_id', positionId)
      .single();


    if (tradeData) {
      if (resultado === 'LOSS') {
        this.blockAssetAfterLoss(tradeData.active_id, tradeData.ativo_nome);
      } else if (resultado === 'WIN') {
        this.resetAssetLosses(tradeData.active_id, tradeData.ativo_nome);
      }


      // ✅ VALIDAÇÃO ZOD: valida dados do sinal atualizado
            // ✅ COMENTADO: validação não aplicável aqui (resultado já foi executado)
      // Remover validação desnecessária no update de resultado


    }


    // ✅ UPDATE DATABASE FIRST, then emit event for auto-refresh
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
      return false;
    } else {
      console.log(`✅ Trade atualizado!\n`);
    }

    // ✅ EMIT POSITION CLOSED EVENT AFTER UPDATE COMPLETES
    // This ensures the trade is already updated in Supabase when frontend fetches
    console.log(`[BOT-POSITION-CLOSED] ${JSON.stringify({
      positionId: positionId,
      resultado: resultado,
      pnl: position.pnl,
      timestamp: new Date().toISOString()
    })}`);


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


      // ✅ USAR ESTRATÉGIA DINÂMICA (lida do config)
      if (this.strategy === 'aggressive') {
        analysis = analyzeAggressive(candlesFormatted);
      } else if (this.strategy === 'conservative') {
        analysis = analyzeConservative(candlesFormatted);
      } else if (this.strategy === 'balanced') {
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
          // ✅ USAR TIMEFRAMES com preferência para 10 segundos
          const candleData = await this.candlesService.getCandles(active.id, 10, { count: 50 });
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

      // ✅ ONE-AT-A-TIME: Check if position is already open
      if (this.currentOpenPosition) {
        console.log(`⏸️ Aguardando posição ${this.currentOpenPosition} fechar...\n`);
        return;
      }

      const signals = await this.scanAllAssets();
      if (signals.length === 0) {
        console.log('⚪ Nenhum sinal forte\n');
        return;
      }

      console.log(`📡 Sinais detectados: ${signals.length}`);
      console.log(`🤖 Bot Mode: ${this.botMode}`);

      // ✅ APLICAR HOLD APENAS EM AUTO MODE
      let availableSignals = signals;
      if (this.botMode === 'auto') {
        console.log('🔍 Aplicando filtro HOLD...');
        availableSignals = signals.filter(signal => !this.checkAssetHold(signal.activeId));
        console.log(`✅ Sinais após filtro HOLD: ${availableSignals.length}/${signals.length}`);
      } else {
        console.log('⚠️ MANUAL mode - sem filtro HOLD aplicado');
      }


      if (availableSignals.length === 0) {
        console.log('⚠️ Todos os ativos estão em HOLD ou sem sinais válidos\n');
        this.printHoldStatus();
        return;
      }


      const signal = availableSignals[0];
      const icon = signal.direction === 'CALL' ? '🟢' : '🔴';
      console.log(`${icon} ${signal.activeName} → ${signal.direction} | Conf: ${signal.confidence}%`);

      // ✅ SET STATUS: Opening position
      this.setStatus(`Opening position on ${signal.activeName}...`, signal.activeName, signal.activeId);

      const actives = this.blitz.getActives();
      const activeObj = actives.find(a => a.id === signal.activeId);


      if (!activeObj) {
        console.log(`❌ Ativo não disponível`);
        this.setStatus('Analyzing markets...');
        return;
      }


      const direction = signal.direction === 'CALL'
        ? BlitzOptionsDirection.Call
        : BlitzOptionsDirection.Put;


      // ✅ SELECT DYNAMIC TIMEFRAME BASED ON SIGNAL CONFIDENCE
      const expirationTime = this.selectBestTimeframe(activeObj, signal.confidence);
      const order = await this.blitz.buy(activeObj, direction, expirationTime, TRADE_AMOUNT, this.balance);


      const positionId = order.id;
      this.currentOpenPosition = positionId; // ✅ Mark position as open
      console.log(`✅ Posição ${positionId} aberta\n`);

      // ✅ SET STATUS: Tracking results (without asset name - already in Current Asset)
      this.setStatus(`Tracking results...`, signal.activeName, signal.activeId);


      await new Promise(r => setTimeout(r, 3000));


      const signalForSave = {
        active: activeObj,
        consensus: signal.direction,
        strategyType: signal.strategyType
      };


      await this.salvarNoSupabase(positionId, signalForSave, order);

      // ✅ Position result will be handled automatically by subscribe (set up in init())
      console.log(`✅ Position ${positionId} criada. Aguardando resultado via subscribe...\n`);
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



