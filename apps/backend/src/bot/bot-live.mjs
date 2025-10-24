// src/bot/bot-live.mjs


import { ClientSdk, SsidAuthMethod, BlitzOptionsDirection } from '@quadcode-tech/client-sdk-js';
import { createClient } from '@supabase/supabase-js';
import { calculateRSI } from './indicators/rsi.mjs';
import { calculateMACD } from './indicators/macd.mjs';
import { calculateBollinger } from './indicators/bollinger.mjs';
import { analyzeAggressive } from './strategies/strategy-aggressive.mjs';
import { analyzeConservative } from './strategies/strategy-conservative.mjs';
import { analyzeBalanced } from './strategies/strategy-balanced.mjs';

// ✅ REAL-TIME BOT CONTROL LISTENER (replaces polling)
import { BotControlListener } from './bot-control-listener.mjs';

// ✅ Shared constants / helpers (previously provided by @mivratec/shared)
import { STRATEGIES, TIMEFRAMES } from './constants.mjs';
import { validateSignal, validatePerformance } from './schemas.mjs';

// ✅ GAMIFICATION: Process trade completions
import { processTradeCompletion } from '../gamification/gamification-service.mjs';


// CONFIGURAÇÃO
const STRATEGY = process.env.STRATEGY || 'balanced';
const NODE_USER_ID = process.env.NODE_USER_ID; // ✅ User ID passed from api-server

// ✅ MAPEAMENTO: env → constants (permite usar STRATEGY da env)
const STRATEGY_MAP = Object.fromEntries(
  STRATEGIES.map(s => [s.id, s])
);

// ✅ Hardcoded SSID as fallback, but should be overridden per user
const SSID = "aaecf415a5e7e16128f8b109b77cedda";
const TRADE_AMOUNT = 1;
const MIN_CONSENSUS = 2;

// ✅ Log user context at startup
console.log(`\n${'='.repeat(80)}`);
console.log(`🤖 MivraTec Bot Starting`);
console.log(`👤 User ID: ${NODE_USER_ID || 'SYSTEM'}`);
console.log(`${'='.repeat(80)}\n`);


// ✅ Service Role Key para ignorar RLS
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://vecofrvxrepogtigmeyj.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
);


class MivraTecBot {
  constructor(userId) {
    this.sdk = null;
    this.blitz = null;
    this.candlesService = null;
    this.balance = null;
    this.tradesHoje = 0;
    this.winsHoje = 0;
    this.lucroHoje = 0;

    // ✅ REAL-TIME BOT CONTROL LISTENER
    this.controlListener = null;
    this.isStarted = false;

    // ✅ Armazena user_id, SSID, estratégia e modo do comando START
    this.currentUserId = userId || NODE_USER_ID; // ✅ Use passed userId or from env
    this.userSSID = null;
    this.strategy = 'aggressive'; // Default: aggressive
    this.botMode = 'auto'; // Default: auto

    // ✅ MANUAL MODE: Asset and timeframe selection
    this.manualAsset = null; // Asset ID to trade (manual mode only)
    this.manualTimeframe = null; // Timeframe to use (manual mode only)

    // ✅ ENTRY VALUE AND ADVANCED CONFIG
    this.tradeAmount = 1; // Default entry value
    this.leverageEnabled = false;
    this.leverage = 2; // Martingale multiplier
    this.currentLeverageAmount = null; // Current leverage-adjusted amount
    this.consecutiveLosses = 0; // Track losses for martingale
    this.totalConsecutiveLosses = 0; // Track total losses for safety stop
    this.safetyStopEnabled = false;
    this.safetyStop = 3; // Stop after X consecutive losses
    this.dailyGoalEnabled = false;
    this.dailyGoal = 100; // Stop when profit reaches this
    this.shouldStop = false; // Flag to stop bot

    // Sistema de HOLD
    this.assetLosses = new Map();
    this.blockedAssets = new Map();
    this.HOLD_TIME = 5 * 60 * 1000;
    this.MAX_CONSECUTIVE_LOSSES = 2;

    // ✅ ONE-AT-A-TIME TRADING: Only one position open at a time
    this.currentOpenPosition = null;

    // ✅ OPERATION INTERVAL: 2-second delay between operations
    this.lastOperationClosedAt = null;
    this.operationCooldownMs = 2000; // 2 seconds between operations

    // ✅ DYNAMIC STATUS TRACKING
    this.botStatus = 'Starting bot...';
    this.currentAsset = null;
    this.currentAssetName = null;
  }


  async init() {
    console.log('🔐 Conectando ao Avalon...');

    // ✅ Fetch user's SSID from bot_control table if available
    if (this.currentUserId && !this.userSSID) {
      try {
        const { data: controlEntry, error } = await supabase
          .from('bot_control')
          .select('ssid')
          .eq('user_id', this.currentUserId)
          .eq('status', 'ACTIVE')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (controlEntry?.ssid) {
          this.userSSID = controlEntry.ssid;
          console.log(`✅ Fetched SSID for user ${this.currentUserId}: ${this.userSSID.substring(0, 15)}...`);
        } else if (error && error.code !== 'PGRST116') { // 'PGRST116' = no rows returned
          console.warn(`⚠️ Failed to fetch SSID from bot_control:`, error.message);
        }
      } catch (err) {
        console.warn(`⚠️ Error fetching SSID:`, err.message);
      }
    }

    // ✅ Usar SSID do usuário (ou fallback para hardcoded)
    const ssidToUse = this.userSSID || SSID;
    console.log(`🔑 Usando SSID: ${ssidToUse.substring(0, 15)}...`);
    console.log(`👤 User ID: ${this.currentUserId || 'SYSTEM'}`);

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
          // ✅ SET COOLDOWN: 2-second delay before next operation
          this.lastOperationClosedAt = Date.now();
          console.log('🟢 Bot livre para nova operação (aguardando 2 segundos)\n');
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


  /**
   * ✅ NEW: Handle bot command from real-time event
   * Replaces the old polling-based checkStartCommand
   */
  async handleBotCommand(cmd) {
    try {
      // ✅ Skip if already started
      if (this.isStarted) {
        console.log('⚠️ Bot already started, ignoring duplicate command');
        return;
      }

      console.log(`🟢 START command received for user: ${cmd.user_id}`);

      // ✅ STORE user_id
      this.currentUserId = cmd.user_id;

      // ✅ READ STRATEGY, MODE AND ADVANCED CONFIG
      if (cmd.config) {
        this.strategy = cmd.config.strategy || 'aggressive';
        this.botMode = cmd.config.mode || 'auto';
        this.tradeAmount = cmd.config.amount || 1;
        this.leverage = cmd.config.leverage || 2;
        this.safetyStop = cmd.config.safetyStop || 3;
        this.dailyGoal = cmd.config.dailyGoal || 100;

        // ✅ MANUAL MODE: Read asset and timeframe
        if (this.botMode === 'manual') {
          this.manualAsset = cmd.config.asset || null;
          this.manualTimeframe = cmd.config.timeframe || 60;
          console.log(`🎮 Manual Mode Config: Asset=${this.manualAsset}, Timeframe=${this.manualTimeframe}s`);
        }

        // ✅ Read advanced settings state
        if (cmd.config.leverageEnabled !== undefined) {
          this.leverageEnabled = cmd.config.leverageEnabled;
        }
        if (cmd.config.safetyStopEnabled !== undefined) {
          this.safetyStopEnabled = cmd.config.safetyStopEnabled;
        }
        if (cmd.config.dailyGoalEnabled !== undefined) {
          this.dailyGoalEnabled = cmd.config.dailyGoalEnabled;
        }

        console.log(`📋 Config: Strategy=${this.strategy}, Mode=${this.botMode}`);
        console.log(`💰 Entry Value: ${this.tradeAmount} | Leverage: ${this.leverageEnabled ? this.leverage + 'x' : 'OFF'}`);
        console.log(`🛑 Safety Stop: ${this.safetyStopEnabled ? this.safetyStop : 'OFF'} | Daily Goal: ${this.dailyGoalEnabled ? this.dailyGoal : 'OFF'}`);
      }

      // ✅ FETCH SSID from bot_status (saved when user connected in POST /api/bot/connect)
      console.log('🔍 Fetching SSID from bot_status...');
      const { data: botStatus, error: statusError } = await supabase
        .from('bot_status')
        .select('ssid')
        .eq('user_id', this.currentUserId)
        .maybeSingle();

      if (statusError || !botStatus?.ssid) {
        console.warn('⚠️ SSID not found in bot_status, trying profiles.broker_user_id...');

        // Fallback: Try broker_user_id from profiles
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('broker_user_id')
          .eq('user_id', this.currentUserId)
          .maybeSingle();

        if (profileError || !profile?.broker_user_id) {
          console.error('❌ No SSID or broker_user_id found!');
          return;
        }

        this.userSSID = profile.broker_user_id;
        console.warn(`⚠️ Using fallback broker_user_id: ${this.userSSID.substring(0, 15)}...`);
      } else {
        this.userSSID = botStatus.ssid;
        console.log(`✅ Valid SSID found in bot_status`);
      }

      console.log(`🔑 User SSID: ${this.userSSID.substring(0, 15)}...\n`);

      // ✅ Initialize Avalon connection
      await this.init();

      // ✅ Mark as started so main loop can proceed
      this.isStarted = true;
    } catch (error) {
      console.error('❌ Error handling bot command:', error.message);
      this.isStarted = false;
    }
  }

  /**
   * ✅ DEPRECATED: Old polling method - kept for reference only
   * Use handleBotCommand instead (called by real-time listener)
   */
  async checkStartCommand() {
    // This method is no longer used but kept for backwards compatibility
    console.warn('⚠️ checkStartCommand() is deprecated - using real-time listener instead');
    return false;
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


  async salvarNoSupabase(positionId, signal, order, indicators = null) {
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
      confidence: signal.confidence || 0.75,
      timestamp: Date.now()
    };


    // ✅ VALIDA com Zod antes de salvar
    try {
      validateSignal(signalData);
    } catch (validationError) {
      console.error('⚠️ Erro de validação Zod (continuando...):', JSON.stringify(validationError.errors || validationError.message));
    }


    // ✅ BUILD TECHNICAL EXPLANATION FROM INDICATORS
    let strategy_explanation = `The bot has identified a ${signal.consensus.toLowerCase()} opportunity on ${ativoNome}. `;

    if (indicators) {
      const { rsi, macd, bb } = indicators;

      if (rsi) strategy_explanation += `RSI at ${rsi.value.toFixed(1)} (${rsi.signal.toLowerCase()}), `;
      if (macd) strategy_explanation += `MACD showing ${macd.trend.toLowerCase()} momentum. `;

      strategy_explanation += `Using the ${strategyInfo.name} strategy with ${signal.confidence || 75}% confidence in this trade decision.`;
    } else {
      strategy_explanation += `Using the ${strategyInfo.name} strategy with ${signal.confidence || 75}% confidence in this trade decision.`;
    }

    // ✅ BUILD INDICATORS SNAPSHOT
    const indicators_snapshot = indicators ? {
      rsi: indicators.rsi ? { value: indicators.rsi.value, signal: indicators.rsi.signal } : null,
      macd: indicators.macd ? { value: indicators.macd.macd, signal_line: indicators.macd.signal, histogram: indicators.macd.histogram, trend: indicators.macd.trend } : null,
      bollinger_bands: indicators.bb ? { lower: indicators.bb.lower, upper: indicators.bb.upper, middle: indicators.bb.middle, signal: indicators.bb.signal } : null
    } : null;

    // ✅ BUILD TECHNICAL SUMMARY
    let technical_summary = '';
    if (indicators) {
      if (indicators.rsi) technical_summary += `RSI at ${indicators.rsi.value.toFixed(1)} (${indicators.rsi.signal.toLowerCase()}) `;
      if (indicators.macd) technical_summary += `| MACD ${indicators.macd.trend.toLowerCase()}`;
      if (indicators.bb && indicators.bb.signal !== 'SQUEEZE') technical_summary += ` | BB ${indicators.bb.signal}`;
    }

    // ✅ BUILD MARKET CONDITIONS
    const market_conditions = {
      price: signal.currentPrice || order.openPrice || 0,
      timestamp: new Date().toISOString(),
      volatility: 'Unknown',
      volume_trend: 'Unknown',
      market_session: 'Unknown'
    };

    // ✅ GET ENTRY PRICE
    const entry_price = order.openPrice || signal.currentPrice || null;


    const { error } = await supabase
      .from('trade_history')
      .insert([{
        user_id: this.currentUserId,
        external_id: positionId,
        type: 'blitz-option',
        active_id: signal.active.id,
        ativo_nome: ativoNome,
        direction: signal.consensus.toLowerCase(),
        valor: this.tradeAmount,
        profit_esperado: order.expectedProfit || 0.85,
        expiration_seconds: expirationSeconds,
        strategy_id: strategyInfo.id,
        status: 'open',
        data_abertura: new Date().toISOString(),
        data_expiracao: order.expiredAt.toISOString(),
        strategy_explanation,
        indicators_snapshot,
        confidence_score: signal.confidence || 75,
        market_conditions,
        entry_price,
        technical_summary
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
    console.log(`🔍 Position Object Debug:`, {
      closePrice: position.closePrice,
      price: position.price,
      openPrice: position.openPrice,
      entryPrice: position.entryPrice,
      exitPrice: position.exitPrice
    });
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
      // ✅ HOLD SYSTEM
      if (resultado === 'LOSS') {
        this.blockAssetAfterLoss(tradeData.active_id, tradeData.ativo_nome);
      } else if (resultado === 'WIN') {
        this.resetAssetLosses(tradeData.active_id, tradeData.ativo_nome);
      }

      // ✅ MARTINGALE (Leverage) SYSTEM
      if (resultado === 'LOSS') {
        this.consecutiveLosses++;
        this.totalConsecutiveLosses++;

        if (this.leverageEnabled) {
          // Apply leverage multiplier for next trade
          this.currentLeverageAmount = this.tradeAmount * Math.pow(this.leverage, this.consecutiveLosses);
          console.log(`📈 [MARTINGALE] Loss #${this.consecutiveLosses} → Next entry: ${this.currentLeverageAmount.toFixed(2)}`);
        } else {
          this.currentLeverageAmount = null;
          console.log(`📊 [MARTINGALE] OFF - Using default entry`);
        }
      } else if (resultado === 'WIN') {
        if (this.leverageEnabled && this.consecutiveLosses > 0) {
          console.log(`✅ [MARTINGALE] WIN after ${this.consecutiveLosses} loss(es) → Resetting leverage`);
        }
        this.consecutiveLosses = 0;
        this.totalConsecutiveLosses = 0; // ✅ RESET CONSECUTIVE LOSS COUNTER FOR SAFETY STOP
        this.currentLeverageAmount = null;
      }

      // ✅ SAFETY STOP (Stop Loss) SYSTEM
      if (this.safetyStopEnabled && this.totalConsecutiveLosses >= this.safetyStop) {
        console.log(`🛑 [SAFETY STOP] ${this.totalConsecutiveLosses} consecutive losses reached! Stopping bot...`);
        this.shouldStop = true;
        this.setStatus(`Bot stopped - Safety Stop triggered (${this.totalConsecutiveLosses} losses)`);
      }

      // ✅ DAILY GOAL (Take Profit) SYSTEM
      if (this.dailyGoalEnabled && this.lucroHoje >= this.dailyGoal) {
        console.log(`🎯 [DAILY GOAL] Profit target reached: R$ ${this.lucroHoje.toFixed(2)} >= R$ ${this.dailyGoal}`);
        this.shouldStop = true;
        this.setStatus(`Bot stopped - Daily Goal reached: R$ ${this.lucroHoje.toFixed(2)}`);
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
        status: position.status,
        exit_price: position.closePrice || position.price || null
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

    // ✅ GAMIFICATION: Process trade completion
    if (this.currentUserId) {
      try {
        const isWin = resultado === 'WIN';
        // TODO: Detect if trade is Demo or Real (currently assuming Real)
        // For now, all bot trades are considered Real trades
        const isDemo = false;

        const gamificationResult = await processTradeCompletion(supabase, this.currentUserId, {
          tradeId: positionId,
          isDemo,
          isWin,
        });

        if (gamificationResult.success) {
          console.log(`✨ [GAMIFICATION] +${gamificationResult.xp_awarded} XP`);
          if (gamificationResult.leveled_up) {
            console.log(`🎉 [LEVEL UP] Nível ${gamificationResult.new_level}!`);
          }
          if (gamificationResult.badges_unlocked?.length > 0) {
            console.log(`🏆 [BADGES] ${gamificationResult.badges_unlocked.length} novo(s) badge(s)!`);
          }
        }
      } catch (gamificationError) {
        console.error('⚠️ [GAMIFICATION] Erro ao processar:', gamificationError.message);
        // Don't fail the trade if gamification fails
      }
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


      // ✅ CALCULATE INDICATORS (always needed for explanation)
      const rsi = calculateRSI(candlesFormatted);
      const macd = calculateMACD(candlesFormatted);
      const bb = calculateBollinger(candlesFormatted);

      let analysis = null;


      // ✅ USAR ESTRATÉGIA DINÂMICA (lida do config)
      if (this.strategy === 'aggressive') {
        analysis = analyzeAggressive(candlesFormatted);
      } else if (this.strategy === 'conservative') {
        analysis = analyzeConservative(candlesFormatted);
      } else if (this.strategy === 'balanced') {
        analysis = analyzeBalanced(candlesFormatted);
      } else {
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


      // ✅ GET CURRENT PRICE FROM LAST CANDLE
      const currentPrice = candlesFormatted[candlesFormatted.length - 1].close;

      return {
        activeId: active.id,
        activeName: active.name || active.ticker || `ID-${active.id}`,
        direction: analysis.consensus,
        confidence: analysis.confidence || (analysis.strength * 25),
        strategyType: analysis.type || 'UNKNOWN',
        currentPrice,
        indicators: { rsi, macd, bb }
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

      // ✅ CHECK SAFETY STOP AND DAILY GOAL BEFORE EXECUTING
      if (this.shouldStop) {
        console.log('⛔ Bot is flagged to stop. Not executing trade cycle.\n');
        return;
      }

      // ✅ ONE-AT-A-TIME: Check if position is already open
      if (this.currentOpenPosition) {
        console.log(`⏸️ Aguardando posição ${this.currentOpenPosition} fechar...\n`);
        return;
      }

      // ✅ COOLDOWN CHECK: Ensure 2 seconds between operations
      if (this.lastOperationClosedAt) {
        const timeSinceLastOperation = Date.now() - this.lastOperationClosedAt;
        if (timeSinceLastOperation < this.operationCooldownMs) {
          const remainingMs = this.operationCooldownMs - timeSinceLastOperation;
          console.log(`⏳ Aguardando cooldown: ${Math.ceil(remainingMs / 1000)}s restantes\n`);
          return;
        }
      }

      let signals = [];

      // ✅ MANUAL MODE: Analyze only the selected asset with selected timeframe
      if (this.botMode === 'manual') {
        console.log(`🎮 MANUAL MODE: Analyzing ${this.manualAsset} on ${this.manualTimeframe}s timeframe`);

        if (!this.manualAsset) {
          console.log('❌ Manual asset not configured');
          return;
        }

        const actives = this.blitz.getActives();
        const manualActiveObj = actives.find(a => a.ticker === this.manualAsset || a.id === this.manualAsset);

        if (!manualActiveObj) {
          console.log(`❌ Manual asset ${this.manualAsset} not found in available actives`);
          return;
        }

        try {
          // ✅ Get candles for manual asset with manual timeframe
          const candleData = await this.candlesService.getCandles(manualActiveObj.id, this.manualTimeframe, { count: 50 });
          const analysis = await this.analyzeActive(manualActiveObj, candleData);

          if (analysis && analysis.direction !== 'NEUTRO') {
            signals = [analysis];
            console.log(`✅ Manual analysis complete: ${analysis.activeName} → ${analysis.direction}`);
          } else {
            console.log('⚪ No strong signal on manual asset\n');
            return;
          }
        } catch (error) {
          console.error(`❌ Error analyzing manual asset: ${error.message}`);
          return;
        }
      } else {
        // ✅ AUTO MODE: Scan all assets
        signals = await this.scanAllAssets();
        if (signals.length === 0) {
          console.log('⚪ Nenhum sinal forte\n');
          return;
        }
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


      // ✅ SELECT TIMEFRAME: Use manual timeframe if in manual mode, otherwise dynamic
      let expirationTime;
      if (this.botMode === 'manual') {
        expirationTime = this.manualTimeframe;
        console.log(`⏱️ Using manual timeframe: ${expirationTime}s`);
      } else {
        expirationTime = this.selectBestTimeframe(activeObj, signal.confidence);
      }

      // ✅ USE MARTINGALE AMOUNT IF APPLICABLE, OTHERWISE USE DEFAULT ENTRY VALUE
      const tradeValue = this.currentLeverageAmount || this.tradeAmount;
      console.log(`💰 Executing trade with amount: R$ ${tradeValue}`);

      const order = await this.blitz.buy(activeObj, direction, expirationTime, tradeValue, this.balance);


      const positionId = order.id;
      this.currentOpenPosition = positionId; // ✅ Mark position as open
      console.log(`✅ Posição ${positionId} aberta\n`);

      // ✅ SET STATUS: Opening position - broadcast immediately
      this.setStatus(`Opening position on ${signal.activeName}...`, signal.activeName, signal.activeId);

      // ✅ SAVE TO DATABASE IMMEDIATELY (no delay!)
      // This ensures frontend receives INSERT event right away
      const signalForSave = {
        active: activeObj,
        consensus: signal.direction,
        strategyType: signal.strategyType,
        confidence: signal.confidence,
        currentPrice: signal.currentPrice
      };

      await this.salvarNoSupabase(positionId, signalForSave, order, signal.indicators);

      // ✅ UPDATE STATUS: Now tracking (after database is updated)
      this.setStatus(`Tracking results...`, signal.activeName, signal.activeId);

      // ✅ EMIT POSITION OPENED EVENT for frontend refresh
      console.log(`[BOT-POSITION-OPENED] ${JSON.stringify({
        positionId: positionId,
        activeName: signal.activeName,
        activeId: signal.activeId,
        direction: signal.direction,
        timestamp: new Date().toISOString()
      })}`);

      // ✅ Position result will be handled automatically by subscribe (set up in init())
      console.log(`✅ Position ${positionId} criada. Aguardando resultado via subscribe...\n`);
    } catch (error) {
      console.error('❌ Erro no ciclo:', error.message);
    }
  }


  async start() {
    console.log('🤖 MivraTec Bot Started\n');

    // ✅ SET UP REAL-TIME BOT CONTROL LISTENER (replaces polling!)
    console.log('🔔 Setting up real-time bot control listener...');
    this.controlListener = new BotControlListener(supabase);

    // ✅ Register callback for bot commands
    this.controlListener.onBotCommand(async (event) => {
      try {
        if (event.type === 'START_BOT') {
          await this.handleBotCommand(event.command);
        } else if (event.type === 'STOP_BOT') {
          console.log('🛑 STOP command received via real-time');
          this.shouldStop = true;
        }
      } catch (err) {
        console.error('❌ Error handling bot command:', err.message);
      }
    });

    // ✅ Start listening for real-time events
    await this.controlListener.start();

    // ✅ Check for any existing ACTIVE commands (race condition safeguard)
    const existingCommands = await this.controlListener.getActiveCommands();
    if (existingCommands.length > 0) {
      console.log(`📋 Found ${existingCommands.length} existing ACTIVE command(s)`);
      await this.handleBotCommand(existingCommands[0]);
    }

    // ✅ Wait for bot to be started via real-time event or initial command
    console.log('⏳ Waiting for START command...');
    while (!this.isStarted) {
      await new Promise(r => setTimeout(r, 1000));
    }

    console.log('🚀 Bot ATIVADO!\n');

    // ✅ MAIN TRADE LOOP (unchanged - still every 2 seconds)
    while (true) {
      try {
        if (this.shouldStop) {
          console.log('⛔ Bot stopping as requested');
          break;
        }
        await this.executarCicloTrade();
        await new Promise(r => setTimeout(r, 2000));
      } catch (err) {
        console.error('❌ Erro crítico:', err.message);
        await new Promise(r => setTimeout(r, 10000));
      }
    }

    // ✅ CLEANUP
    if (this.controlListener) {
      await this.controlListener.stop();
    }
  }
}


// ✅ Create bot instance with userId context
const bot = new MivraTecBot(NODE_USER_ID);
bot.start().catch(err => {
  console.error(`❌ Fatal for user ${NODE_USER_ID}:`, err.message);
  process.exit(1);
});



