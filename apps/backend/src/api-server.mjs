// Load environment variables
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import { ClientSdk, SsidAuthMethod } from '@quadcode-tech/client-sdk-js'; // ✅ WebSocket SDK
import { supabase } from '../config/supabase.mjs';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Admin modules
import logger from './admin/logger.mjs';
import alerts from './admin/alerts.mjs';
import { registerLogsAlertsEndpoints } from './admin/api-endpoints.mjs';
import * as UserManagement from './admin/users.mjs';
import * as Analytics from './admin/analytics.mjs';
import * as Trades from './admin/trades.mjs';
import { performHealthCheck } from './admin/health.mjs';
import * as Metrics from './admin/metrics.mjs';
import { setupAdminWebSocket } from './admin/websocket.mjs';

// Bot WebSocket Module
import { setupBotWebSocket } from './bot/bot-websocket.mjs';

// CRM Module
import crmRouter from './crm/crm.module.mjs';

// Integrations Module
import integrationsRouter from './integrations/integrations.mjs';

// Avalon Auth Service
import avalonAuthService from './services/avalon-auth.mjs';

// Session Manager (FASE 3)
import sessionManager from './bot/session-manager.mjs';

// SSID Manager - Automatic SSID generation and renewal
import ssidManager from './services/ssid-manager.mjs';

// ✅ NOVA IMPORTAÇÃO: Lista fixa de ativos (140 ativos oficiais)
import { FIXED_ASSETS, ASSETS_BY_CATEGORY, resolveAssetById, resolveAssetByName, getTotalAssetsCount } from './constants/fixed-assets.mjs';

const app = express();
const httpServer = createServer(app);

// Configure CORS
app.use(cors());
app.use(express.json());

// Middleware to attach database connection to requests
app.use((req, res, next) => {
  req.db = supabase;
  next();
});

// DEBUG: Descobrir IDs de ativos da Avalon
app.get('/api/debug/discover-assets', async (req, res) => {
  try {
    if (!sdkInstance) {
      return res.json({ error: 'SDK not initialized' })
    }

    const methods = []
    const results = {}

    if (sdkInstance.activesFacade?.getActives) {
      methods.push('activesFacade.getActives')
      try {
        const actives = await sdkInstance.activesFacade.getActives()
        results.activesFacade = actives.map(a => ({
          id: a.id,
          name: a.name,
          type: a.type || 'unknown'
        }))
      } catch (e) {
        results.activesFacade = { error: e.message }
      }
    }

    return res.json({
      methods,
      results,
      sdkKeys: Object.keys(sdkInstance)
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ✅ Avalon WebSocket Configuration (replaces REST API)
const AVALON_WS_URL = 'wss://ws.trade.avalonbroker.com/echo/websocket';
const AVALON_API_HOST = 'https://trade.avalonbroker.com';
// ✅ SSID agora é gerenciado pelo ssidManager - removidas constantes hardcoded



// ✅ Estado global do bot
let botStatus = {
  running: false,
  connected: false,
  lastUpdate: new Date().toISOString(),
  ssid: null
};

// ✅ SDK connection instance (cached for reuse)
let sdkInstance = null;

// ✅ Bot runtime process management
let botProcess = null;
let botProcessPID = null;

// ✅ Função para inicializar SDK Avalon com SSID Manager (NON-BLOCKING)
async function initializeAvalonSDK() {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('🔄 Inicializando SDK Avalon com SSID Manager...');
    console.log('='.repeat(80) + '\n');

    // 1️⃣ Gerar System SSID primeiro
    const systemSSID = await ssidManager.initializeSystemSSID();

    if (!systemSSID) {
      console.warn('⚠️ Failed to initialize system SSID - Avalon features will be unavailable');
      console.warn('⚠️ Server will start without Avalon connection\n');
      return null;
    }

    console.log(`🔑 System SSID: ${systemSSID.substring(0, 15)}...`);
    console.log(`👤 System User ID: ${ssidManager.AVALON_SYSTEM_USER_ID}`);

    // 2️⃣ Criar SDK com System SSID
    sdkInstance = await ClientSdk.create(
      AVALON_WS_URL,
      parseInt(ssidManager.AVALON_SYSTEM_USER_ID),
      new SsidAuthMethod(systemSSID),
      { host: AVALON_API_HOST }
    );

    console.log('✅ SDK Avalon inicializado com sucesso!');
    console.log('⏰ SSID será renovado automaticamente a cada 23 horas\n');

    return sdkInstance;
  } catch (error) {
    console.error('❌ Erro ao inicializar SDK:', error.message);
    console.warn('⚠️ Server will start without Avalon connection\n');
    return null;
  }
}

// Setup WebSocket with Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Function to get metrics context
function getMetricsContext() {
  return {
    supabase,
    sdkInstance,
    botProcess,
    botStatus
  };
}

// Setup Admin WebSocket namespace with authentication
const adminNamespace = setupAdminWebSocket(io, supabase, getMetricsContext);

// ✅ Setup Bot WebSocket for real-time trading events
const botWebSocket = setupBotWebSocket(io);
console.log('✅ Bot WebSocket initialized');

// ===================================================================
// ✅ ASSET MANAGEMENT: Using centralized fixed-assets.mjs module
// ===================================================================
// All 140 assets are now managed in src/constants/fixed-assets.mjs

/**
 * ✅ Initialize asset mapping (now using centralized module)
 */
async function initializeAssetMap() {
  console.log('🔄 Inicializando mapeamento de Asset IDs (lista fixa)...');
  const assetCount = Object.keys(FIXED_ASSETS).length;
  const totalCount = getTotalAssetsCount();
  console.log(`✅ ${assetCount} aliases carregados (${totalCount} ativos únicos)`);
}

// ✅ CANDLES PROXY: Track active subscriptions
const chartLayerSubscriptions = new Map(); // socketId -> { chartLayer, handler, asset, timeframe, strategy }

// ✅ CANDLES PROXY: Setup handlers function (to be called AFTER SDK initialization)
function setupCandlesHandlers() {
  io.on('connection', (socket) => {
    console.log('🔌 Frontend connected:', socket.id);

    // Subscribe to candles using realTimeChartDataLayer
    socket.on('subscribe-candles', async ({ asset, timeframe, strategy }) => {
      console.log('📡 === SUBSCRIBE-CANDLES RECEBIDO ===');
      console.log(`📊 Socket: ${socket.id}`);
      console.log(`📊 Asset: ${asset} | Timeframe: ${timeframe}s | Strategy: ${strategy}`);

      try {
        // ✅ Verificação do SDK
        if (!sdkInstance) {
          throw new Error('SDK não inicializado');
        }

        // ✅ Map asset name to ID using centralized module
        const resolvedAsset = resolveAssetByName(asset);

        if (!resolvedAsset) {
          console.error(`❌ Asset ${asset} não encontrado na lista fixa de 140 ativos`);
          socket.emit('subscription-error', {
            message: `Asset ${asset} não disponível. Verifique os ativos disponíveis.`,
            error: 'ASSET_NOT_FOUND'
          });
          return;
        }

        const activeId = resolvedAsset.id;
        console.log(`🆔 Asset ${asset} → ${resolvedAsset.name} (ID: ${activeId})`);

        // Cleanup previous subscription if exists
        const existingSub = chartLayerSubscriptions.get(socket.id);
        if (existingSub) {
          try {
            existingSub.chartLayer.unsubscribeOnLastCandleChanged(existingSub.handler);
            console.log(`🛑 Unsubscribed previous: ${existingSub.asset}`);
          } catch (err) {
            console.warn('⚠️ Error cleaning up previous subscription:', err.message);
          }
        }

        // Create chart data layer instance
        console.log('🔄 Creating realTimeChartDataLayer...');
        const chartLayer = await sdkInstance.realTimeChartDataLayer(
  activeId, 
  timeframe,
  { useOTC: true } // ← PARÂMETRO EXTRA PARA FORÇAR OTC
);
        // Fetch initial candles for chart initialization
        const nowSec = Math.floor(Date.now() / 1000);
        const from = nowSec - (200 * timeframe);
        console.log('📥 Fetching initial candles...');
        const initialCandles = await chartLayer.fetchAllCandles(from);
        const sortedCandles = initialCandles.sort((a, b) => a.to - b.to).slice(-200);

        // Send initial candles to frontend
        const formattedInitial = sortedCandles.map(c => ({
          time: c.to,
          open: c.open,
          high: c.max || c.high,
          low: c.min || c.low,
          close: c.close,
          volume: c.volume || 0
        }));

        console.log(`📤 Sending ${formattedInitial.length} initial candles`);
        socket.emit('historical-candles', formattedInitial);

        // Subscribe to real-time updates
        const handler = (candle) => {
          // Log full candle object to debug structure
          console.log(`📊 FULL CANDLE OBJECT ${asset}:`, JSON.stringify(candle, null, 2));

          console.log(`📊 CANDLE UPDATE ${asset}:`, {
            time: candle.to,
            open: candle.open,
            close: candle.close,
            high: candle.high,
            low: candle.low,
            max: candle.max,
            min: candle.min
          });

          const candleData = {
            time: candle.to,
            open: candle.open,
            high: candle.max || candle.high,
            low: candle.min || candle.low,
            close: candle.close,
            volume: candle.volume || 0
          };
          socket.emit('candle-update', candleData);
        };

        chartLayer.subscribeOnLastCandleChanged(handler);

        // Store for cleanup
        chartLayerSubscriptions.set(socket.id, {
          chartLayer,
          handler,
          asset,
          timeframe,
          strategy
        });

        console.log(`✅ Subscription created successfully: ${socket.id}`);
        socket.emit('subscribed', { asset, timeframe, strategy });

      } catch (error) {
        console.error('❌ Subscription error:', error.message);
        console.error('Stack:', error.stack);
        socket.emit('subscription-error', { message: error.message });
      }
    });

    // Unsubscribe from candles
    socket.on('unsubscribe-candles', () => {
      const sub = chartLayerSubscriptions.get(socket.id);
      if (sub) {
        try {
          sub.chartLayer.unsubscribeOnLastCandleChanged(sub.handler);
          chartLayerSubscriptions.delete(socket.id);
          console.log(`🛑 Unsubscribed: ${socket.id}`);
        } catch (error) {
          console.error('❌ Unsubscribe error:', error.message);
        }
      }
    });

    // Client disconnected
    socket.on('disconnect', (reason) => {
      const sub = chartLayerSubscriptions.get(socket.id);
      if (sub) {
        try {
          sub.chartLayer.unsubscribeOnLastCandleChanged(sub.handler);
          chartLayerSubscriptions.delete(socket.id);
          console.log(`🛑 Cleaned up subscription on disconnect: ${socket.id}`);
        } catch (error) {
          console.error('❌ Cleanup error:', error.message);
        }
      }
      console.log(`❌ Frontend disconnected: ${socket.id} (${reason})`);
    });
  });
}


// ✅ Candles Proxy setup function will be called after SDK initialization

// Register logs and alerts endpoints
registerLogsAlertsEndpoints(app, adminNamespace, supabase);

// ✅ Endpoint: Rota raiz - Status da API
app.get('/', (req, res) => {
  res.json({
    name: 'MivraTec API Server',
    version: '2.0.0',
    status: 'online',
    timestamp: new Date().toISOString(),
    endpoints: {
      status: 'GET /api/bot/status',
      connect: 'POST /api/bot/connect',
      balance: 'GET /api/bot/balance',
      accountType: 'POST /api/bot/account-type',
      startRuntime: 'POST /api/bot/start-runtime',
      stopRuntime: 'POST /api/bot/stop-runtime',
      runtimeStatus: 'GET /api/bot/runtime-status',
      marketScanner: 'GET /api/market-scanner',
      strategyPerformance: 'GET /api/strategy-performance'
    },
    connection: {
      avalon: sdkInstance ? 'connected' : 'disconnected',
      supabase: 'connected'
    }
  });
});

// ✅ Endpoint: Health check (for external monitoring)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    connections: {
      avalon: sdkInstance ? 'connected' : 'disconnected',
      supabase: 'connected'
    }
  });
});

// ✅ Endpoint: Status do bot
app.get('/api/bot/status', (req, res) => {
  res.json(botStatus);
});

// ✅ Endpoint: Conectar ao Avalon usando WebSocket SDK
app.post('/api/bot/connect', async (req, res) => {
  try {
    const { userId } = req.body;

    console.log('🔗 Conectando via WebSocket SDK...');
    console.log(`📡 URL: ${AVALON_WS_URL}`);
    console.log(`🆔 User ID: ${userId}`);

    // ✅ PASSO 1: Buscar broker_user_id do usuário
    console.log('🔍 Buscando ID da corretora no banco...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('broker_user_id')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.error('❌ Erro ao buscar profile:', profileError);
      return res.status(400).json({
        success: false,
        error: 'Usuário não encontrado no sistema.'
      });
    }

    if (!profile?.broker_user_id) {
      console.error('❌ Broker User ID não encontrado para o usuário');
      return res.status(400).json({
        success: false,
        error: 'ID da corretora não encontrado. Complete seu cadastro primeiro.'
      });
    }

    const avalonUserId = parseInt(profile.broker_user_id);
    console.log(`🎯 ID da Avalon encontrado: ${avalonUserId}`);

    // ✅ PASSO 2: Gerar SSID individual para este usuário
    console.log(`🔐 Gerando SSID individual para usuário Avalon ${avalonUserId}...`);
    const userSSID = await ssidManager.getSSID(avalonUserId.toString());
    console.log(`✅ SSID gerado: ${userSSID.substring(0, 15)}...`);

    // Reuse existing SDK instance if available, otherwise create new one
    if (!sdkInstance) {
      console.log('⏳ Inicializando SDK...');
      const startTime = Date.now();

      sdkInstance = await ClientSdk.create(
        AVALON_WS_URL,
        avalonUserId,  // ✅ ID dinâmico do usuário
        new SsidAuthMethod(userSSID),  // ✅ SSID dinâmico do usuário
        { host: AVALON_API_HOST }
      );

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ SDK inicializado em ${elapsed}s`);
    } else {
      console.log('♻️ Reutilizando conexão SDK existente');
    }

    // Verify connection by retrieving balances
    console.log('🔍 Verificando saldo...');
    const balancesData = await sdkInstance.balances();
    console.log('✅ Saldo verificado com sucesso');
    let demoBalance = null;
    let realBalance = null;

    console.log('🔍 All balances from SDK:');
    const allBalances = balancesData.getBalances();
    for (const bal of allBalances) {
      console.log(`  ID: ${bal.id}, Amount: ${bal.amount}, Currency: ${bal.currency}, Type: ${bal.type || 'N/A'}`);

      if (bal.amount > 0) {
        // Check if type property exists to differentiate demo/real
        if (bal.type === 'demo') {
          demoBalance = bal;
        } else if (bal.type === 'real') {
          realBalance = bal;
        } else if (!demoBalance) {
          // Fallback: first balance with amount > 0
          demoBalance = bal;
        }
      }
    }

    const balance = demoBalance || realBalance;
    if (!balance) {
      console.warn('⚠️ Nenhum saldo disponível');
    } else {
      console.log(`💰 Selected Balance: ${balance.amount} ${balance.currency} (ID: ${balance.id})`);
    }

    // Update bot status
    botStatus = {
      running: false, // ✅ Bot runtime is NOT running - only broker is connected
      connected: true,
      lastUpdate: new Date().toISOString(),
      ssid: userSSID.substring(0, 15) + '...'  // ✅ SSID individual do usuário
    };

    console.log('✅ Conectado ao Avalon via WebSocket\n');

    // ✅ Update bot_status in Supabase
    if (userId) {
      try {
        const { data: existing } = await supabase
          .from('bot_status')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        const statusData = {
          user_id: userId,
          is_connected: true,
          broker_balance: balance ? balance.amount : 0,
          ssid: userSSID,  // ✅ SSID individual do usuário
          connection_type: 'websocket'
        };

        if (existing) {
          await supabase
            .from('bot_status')
            .update(statusData)
            .eq('user_id', userId);
        } else {
          await supabase
            .from('bot_status')
            .insert({
              ...statusData,
              account_type: 'demo' // Default to demo
            });
        }

        console.log('✅ bot_status atualizado no Supabase');
      } catch (dbError) {
        console.warn('⚠️ Falha ao atualizar bot_status:', dbError.message);
      }
    }

    res.json({
      success: true,
      message: 'Conectado ao Avalon via WebSocket',
      ssid: userSSID.substring(0, 15) + '...',  // ✅ SSID individual (parcial por segurança)
      balance: balance ? `${balance.amount} ${balance.currency}` : 'N/A',
      balanceAmount: balance ? balance.amount : 0,
      connectionType: 'WebSocket'
    });

  } catch (error) {
    console.error('❌ Erro ao conectar:', error.message);
    botStatus.connected = false;
    sdkInstance = null; // Reset SDK instance on error

    res.status(500).json({
      success: false,
      error: error.message,
      details: 'Falha na conexão WebSocket. Verifique credenciais e conectividade.'
    });
  }
});

// ✅ Endpoint: Check broker connection status
app.get('/api/bot/connection-status', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    console.log(`🔍 Checking connection status for user ${userId}`);

    // Query bot_status table
    const { data, error } = await supabase
      .from('bot_status')
      .select('is_connected, broker_balance, ssid, connection_type, updated_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('❌ Error querying bot_status:', error);
      return res.status(500).json({
        success: false,
        error: 'Database error'
      });
    }

    if (!data) {
      console.log('ℹ️ No bot_status record found for user');
      return res.json({
        success: true,
        connected: false,
        message: 'No connection record found'
      });
    }

    console.log(`✅ Connection status: ${data.is_connected ? 'Connected' : 'Disconnected'}`);

    res.json({
      success: true,
      connected: data.is_connected || false,
      balance: data.broker_balance || 0,
      ssid: data.ssid ? data.ssid.substring(0, 15) + '...' : null,
      connectionType: data.connection_type || 'unknown',
      lastUpdate: data.updated_at
    });
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ✅ Market Scanner
app.get('/api/market-scanner', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('strategy_trades')
      .select('*')
      .order('signal_timestamp', { ascending: false })
      .limit(20);

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Strategy Performance
app.get('/api/strategy-performance', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('scanner_performance')
      .select('*')
      .order('last_updated', { ascending: false })
      .limit(10);

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Scanner Top 20 - Best performing asset/timeframe combinations
app.get('/api/scanner/top20', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('scanner_performance')
      .select('*')
      .not('total_signals', 'is', null) // Filter out null signals
      .gte('total_signals', 15) // Only assets with 15+ signals for statistical relevance
      .order('win_rate', { ascending: false })
      .limit(20);

    if (error) throw error;

    // Return data as-is (no strategy fields needed)
    res.json({
      success: true,
      data: data || [],
      timestamp: new Date().toISOString(),
      count: (data || []).length
    });
  } catch (error) {
    console.error('❌ Error fetching scanner top20:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ✅ Endpoint: Get all available assets (141 assets from fixed list)
app.get('/api/assets', (req, res) => {
  try {
    const { category } = req.query;

    // Helper function to add keys to asset objects
    const enrichAssetsWithKeys = (assets) => {
      const enriched = {};
      Object.keys(assets).forEach(categoryKey => {
        enriched[categoryKey] = Object.entries(FIXED_ASSETS)
          .filter(([_, asset]) => asset.category === categoryKey)
          .map(([key, asset]) => ({
            key,           // ← Asset key (e.g., "EURUSD-OTC", "INDU")
            id: asset.id,
            name: asset.name,
            category: asset.category
          }));
      });
      return enriched;
    };

    // If category filter is provided, return only that category
    if (category) {
      const categoryAssets = ASSETS_BY_CATEGORY[category];
      if (!categoryAssets) {
        return res.status(400).json({
          success: false,
          error: `Invalid category. Valid categories: ${Object.keys(ASSETS_BY_CATEGORY).join(', ')}`
        });
      }

      const enrichedAssets = Object.entries(FIXED_ASSETS)
        .filter(([_, asset]) => asset.category === category)
        .map(([key, asset]) => ({
          key,
          id: asset.id,
          name: asset.name,
          category: asset.category
        }));

      return res.json({
        success: true,
        category,
        count: enrichedAssets.length,
        assets: enrichedAssets
      });
    }

    // Return all assets organized by category with keys
    const assetsWithKeys = enrichAssetsWithKeys(ASSETS_BY_CATEGORY);

    return res.json({
      success: true,
      total: getTotalAssetsCount(),
      categories: Object.keys(ASSETS_BY_CATEGORY),
      assets: assetsWithKeys
    });
  } catch (error) {
    console.error('❌ Error fetching assets:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ✅ Endpoint: Get candles for asset/timeframe (REST fallback for WebSocket)
app.get('/api/candles', async (req, res) => {
  try {
    const { asset, timeframe, limit = 200 } = req.query;

    if (!asset || !timeframe) {
      return res.status(400).json({
        success: false,
        error: 'asset and timeframe are required query parameters'
      });
    }

    if (!sdkInstance) {
      return res.status(503).json({
        success: false,
        error: 'SDK not initialized. Server may be starting up.'
      });
    }

    console.log(`📊 [API] Fetching candles: ${asset} ${timeframe}s (limit: ${limit})`);

    // Map asset name to ID using centralized module
    const resolvedAsset = resolveAssetByName(asset);

    if (!resolvedAsset) {
      console.error(`❌ [API] Asset ${asset} not found in fixed assets list`);
      return res.status(404).json({
        success: false,
        error: `Asset '${asset}' not found. Check available assets at /api/assets`
      });
    }

    const activeId = resolvedAsset.id;
    console.log(`🆔 [API] Asset ${asset} → ${resolvedAsset.name} (ID: ${activeId})`);

    // Create chart data layer
    const chartLayer = await sdkInstance.realTimeChartDataLayer(
      activeId,
      parseInt(timeframe),
      { useOTC: true }
    );

    // Fetch historical candles
    const nowSec = Math.floor(Date.now() / 1000);
    const from = nowSec - (parseInt(limit) * parseInt(timeframe));
    const candles = await chartLayer.fetchAllCandles(from);

    // Format candles
    const formattedCandles = candles
      .sort((a, b) => a.to - b.to)
      .slice(-parseInt(limit))
      .map(c => ({
        time: c.to,
        open: c.open,
        high: c.max || c.high,
        low: c.min || c.low,
        close: c.close,
        volume: c.volume || 0
      }));

    console.log(`✅ [API] Sending ${formattedCandles.length} candles`);

    res.json({
      success: true,
      asset,
      timeframe: parseInt(timeframe),
      count: formattedCandles.length,
      candles: formattedCandles
    });
  } catch (error) {
    console.error('❌ [API] Error fetching candles:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ✅ Endpoint: Iniciar bot
app.post('/api/bot/start', async (req, res) => {
  botStatus.running = true;
  botStatus.lastUpdate = new Date().toISOString();
  res.json({ success: true, message: 'Bot iniciado' });
});

// ✅ Endpoint: Parar bot
app.post('/api/bot/stop', async (req, res) => {
  botStatus.running = false;
  botStatus.lastUpdate = new Date().toISOString();
  res.json({ success: true, message: 'Bot parado' });
});

// ============================================================================
// AVALON USER CREATION ENDPOINT - FUNCIONANDO! ✅
// ============================================================================

app.post('/api/avalon/create-user', async (req, res) => {
  console.log('🔄 [AVALON PROXY] Criando usuário na Avalon via backend...');
  console.log('📋 [AVALON PROXY] Dados recebidos:', JSON.stringify(req.body, null, 2));

  try {
    // ✅ URL CORRETA que funcionou no Postman
    const avalonApiUrl = 'http://api-qc.avalonbots.com:3000';
    const bearerToken = 'dfc29735b5450651d5c03f4fb6508ed9';

    console.log('🌐 [AVALON PROXY] Enviando para:', `${avalonApiUrl}/users`);
    
    const response = await fetch(`${avalonApiUrl}/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // ✅ FORMATO CORRETO que funcionou
        name: `${req.body.first_name} ${req.body.last_name}`,
        email: req.body.email,
        password: req.body.password,
        affId: req.body.affId || 430322
      })
    });

    const data = await response.json();
    
    console.log('📤 [AVALON PROXY] Resposta da Avalon:', {
      status: response.status,
      statusText: response.statusText,
      data: JSON.stringify(data, null, 2)
    });

    if (!response.ok) {
      console.error('❌ [AVALON PROXY] Erro da API Avalon:', data);
      return res.status(response.status).json(data);
    }
    
    console.log('✅ [AVALON PROXY] Usuário criado na Avalon com sucesso!');
    res.json(data);
    
  } catch (error) {
    console.error('❌ [AVALON PROXY] Erro no proxy Avalon:', error.message);
    res.status(500).json({ 
      error: error.message,
      message: 'Erro interno no proxy da Avalon'
    });
  }
});


// ✅ Endpoint: Get current balance from Avalon
// Accepts optional query param: ?accountType=demo|real
app.get('/api/bot/balance', async (req, res) => {
  try {
    if (!sdkInstance) {
      return res.status(400).json({
        success: false,
        error: 'Not connected to Avalon. Call /api/bot/connect first.'
      });
    }

    const accountType = req.query.accountType || 'demo'; // default to demo
    const balancesData = await sdkInstance.balances();
    let demoBalance = null;
    let realBalance = null;

    // Iterate through all balances and categorize them
    const allBalances = balancesData.getBalances();
    for (const bal of allBalances) {
      // ✅ Process ALL balances, not just ones with amount > 0
      const idStr = bal.id.toString().toLowerCase();
      const typeStr = (bal.type || '').toString().toLowerCase();

      // Try to identify demo vs real by type
      if (typeStr === 'demo' || idStr.includes('demo')) {
        demoBalance = bal;
      } else if (typeStr === 'real' || idStr.includes('real')) {
        realBalance = bal;
      } else if (!demoBalance) {
        // Fallback: first balance is assumed demo
        demoBalance = bal;
      }
    }

    // ✅ Select balance based on requested account type WITHOUT fallback
    // This ensures Real account shows $0.00 instead of falling back to demo
    const selectedBalance = accountType === 'real' ? realBalance : demoBalance;

    if (!selectedBalance) {
      return res.json({
        success: true,
        balance: {
          amount: 0,
          currency: 'USD',
          id: null,
          type: accountType
        },
        availableBalances: {
          demo: demoBalance ? demoBalance.amount : 0,
          real: realBalance ? realBalance.amount : 0
        }
      });
    }

    res.json({
      success: true,
      balance: {
        amount: selectedBalance.amount,
        currency: selectedBalance.currency,
        id: selectedBalance.id,
        type: accountType
      },
      availableBalances: {
        demo: demoBalance ? demoBalance.amount : 0,
        real: realBalance ? realBalance.amount : 0
      }
    });
  } catch (error) {
    console.error('❌ Error fetching balance:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ✅ Endpoint: Disconnect broker
app.post('/api/bot/disconnect', async (req, res) => {
  try {
    const { userId } = req.body;
    console.log('🔌 Disconnect request for user:', userId);

    // Destroy SDK instance
    if (sdkInstance) {
      try {
        await sdkInstance.shutdown();
        console.log('✅ SDK shutdown complete');
      } catch (err) {
        console.warn('⚠️ SDK shutdown warning:', err.message);
      }
      sdkInstance = null;
    }

    // Update Supabase bot_status
    const { error: updateError } = await supabase
      .from('bot_status')
      .update({
        is_connected: false,
        ssid: null,
        connection_type: null,
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('❌ Failed to update bot_status:', updateError);
    }

    res.json({
      success: true,
      message: 'Disconnected from broker'
    });
  } catch (error) {
    console.error('❌ Disconnect failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ✅ Endpoint: Update account type in bot_status
app.post('/api/bot/account-type', async (req, res) => {
  const { userId, accountType } = req.body;

  if (!userId || !accountType) {
    return res.status(400).json({
      success: false,
      error: 'userId and accountType are required'
    });
  }

  if (!['demo', 'real'].includes(accountType)) {
    return res.status(400).json({
      success: false,
      error: 'accountType must be "demo" or "real"'
    });
  }

  try {
    // Check if bot_status exists for this user
    const { data: existing } = await supabase
      .from('bot_status')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('bot_status')
        .update({ account_type: accountType })
        .eq('user_id', userId);

      if (error) throw error;
    } else {
      // Create new
      const { error } = await supabase
        .from('bot_status')
        .insert({
          user_id: userId,
          account_type: accountType,
          is_connected: false,
          broker_balance: 0
        });

      if (error) throw error;
    }

    res.json({
      success: true,
      message: `Account type updated to ${accountType}`
    });
  } catch (error) {
    console.error('❌ Error updating account type:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ✅ Endpoint: Start bot runtime (spawn bot-live.mjs process)
app.post('/api/bot/start-runtime', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: 'userId is required'
    });
  }

  try {
    // Check if bot is already running
    if (botProcess && !botProcess.killed) {
      return res.status(400).json({
        success: false,
        error: 'Bot is already running',
        pid: botProcessPID
      });
    }

    // Check if SDK is connected
    if (!sdkInstance) {
      return res.status(400).json({
        success: false,
        error: 'Not connected to Avalon. Connect broker first.'
      });
    }

    console.log('🚀 Starting bot-live.mjs process...');

    // Spawn bot-live.mjs process
    botProcess = spawn('node', ['src/bot/bot-live.mjs'], {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
      env: { ...process.env }
    });

    botProcessPID = botProcess.pid;

    console.log(`✅ Bot process started with PID: ${botProcessPID}`);

    // Listen to stdout
    botProcess.stdout.on('data', (data) => {
      console.log(`[BOT] ${data.toString()}`);
    });

    // Listen to stderr
    botProcess.stderr.on('data', (data) => {
      console.error(`[BOT ERROR] ${data.toString()}`);
    });

    // Handle process exit
    botProcess.on('exit', (code, signal) => {
      console.log(`🛑 Bot process exited with code ${code}, signal ${signal}`);
      botProcess = null;
      botProcessPID = null;
      // ✅ Update global botStatus
      botStatus.running = false;
      botStatus.lastUpdate = new Date().toISOString();


      // Update bot_status
      supabase
        .from('bot_status')
        .update({ bot_running: false, bot_pid: null })
        .eq('user_id', userId)
        .then(() => console.log('✅ Bot status updated: stopped'));
    });

    // Update bot_status in Supabase
    const { error } = await supabase
      .from('bot_status')
      .update({
        bot_running: true,
        bot_pid: botProcessPID
      })
      .eq('user_id', userId);

    if (error) {
      console.warn('⚠️ Failed to update bot_status:', error.message);
    }

    // ✅ Update global botStatus to reflect bot is running
    botStatus.running = true;
    botStatus.lastUpdate = new Date().toISOString();

    res.json({
      success: true,
      message: 'Bot runtime started successfully',
      pid: botProcessPID
    });
  } catch (error) {
    console.error('❌ Error starting bot:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ✅ Endpoint: Stop bot runtime
app.post('/api/bot/stop-runtime', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: 'userId is required'
    });
  }

  try {
    // ✅ Check database state first
    const { data: dbStatus } = await supabase
      .from('bot_status')
      .select('bot_running, bot_pid')
      .eq('user_id', userId)
      .single();

    let pid = null;

    // If process exists and is running, kill it
    if (botProcess && !botProcess.killed) {
      console.log(`🛑 Stopping bot process PID: ${botProcessPID}`);

      // Kill the process
      botProcess.kill('SIGTERM');

      // Wait a bit, then force kill if needed
      setTimeout(() => {
        if (botProcess && !botProcess.killed) {
          console.warn('⚠️ Force killing bot process');
          botProcess.kill('SIGKILL');
        }
      }, 5000);

      pid = botProcessPID;
      botProcess = null;
      botProcessPID = null;

      console.log(`✅ Bot process ${pid} stopped`);
    } else if (dbStatus?.bot_running) {
      // ✅ Process not running but database says it is - sync database state
      console.warn('⚠️ Bot process not found but database shows running - syncing state');
      pid = dbStatus.bot_pid;
    } else {
      // Neither process nor database shows running
      return res.status(400).json({
        success: false,
        error: 'Bot is not running'
      });
    }

    // Update bot_status in Supabase (always sync to stopped state)
    const { error } = await supabase
      .from('bot_status')
      .update({
        bot_running: false,
        bot_pid: null
      })
      .eq('user_id', userId);

    if (error) {
      console.warn('⚠️ Failed to update bot_status:', error.message);
    }

    // ✅ Update global botStatus to reflect bot is NOT running
    botStatus.running = false;
    botStatus.lastUpdate = new Date().toISOString();

    res.json({
      success: true,
      message: 'Bot runtime stopped successfully',
      pid
    });
  } catch (error) {
    console.error('❌ Error stopping bot:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ✅ Endpoint: Get bot runtime status
app.get('/api/bot/runtime-status', (req, res) => {
  res.json({
    success: true,
    running: botProcess && !botProcess.killed,
    pid: botProcessPID
  });
});

// ✅ Endpoint: Reconnect to Avalon (if SDK was lost)
app.post('/api/bot/reconnect', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: 'userId is required'
    });
  }

  console.log('🔄 Reconnecting to Avalon...');

  try {
    // ✅ Buscar broker_user_id do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('broker_user_id')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile?.broker_user_id) {
      return res.status(400).json({
        success: false,
        error: 'Usuário não encontrado ou sem ID de corretora'
      });
    }

    const avalonUserId = parseInt(profile.broker_user_id);
    console.log(`🎯 ID da Avalon: ${avalonUserId}`);

    // ✅ Gerar novo SSID para este usuário
    console.log(`🔐 Gerando novo SSID para usuário Avalon ${avalonUserId}...`);
    const userSSID = await ssidManager.getSSID(avalonUserId.toString());
    console.log(`✅ SSID gerado: ${userSSID.substring(0, 15)}...`);

    // Force recreate SDK instance
    sdkInstance = null;

    const startTime = Date.now();
    sdkInstance = await ClientSdk.create(
      AVALON_WS_URL,
      avalonUserId,
      new SsidAuthMethod(userSSID),
      { host: AVALON_API_HOST }
    );

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ SDK reconectado em ${elapsed}s`);

    // Verify connection
    const balancesData = await sdkInstance.balances();
    let balance = null;

    const allBalances = balancesData.getBalances();
    for (const bal of allBalances) {
      if (bal.amount > 0) {
        balance = bal;
        break;
      }
    }

    // Update bot_status in Supabase
    try {
      const { error } = await supabase
        .from('bot_status')
        .update({
          is_connected: true,
          broker_balance: balance ? balance.amount : 0,
          ssid: userSSID,  // ✅ SSID individual do usuário
          connection_type: 'websocket'
        })
        .eq('user_id', userId);

      if (error) {
        console.warn('⚠️ Failed to update bot_status:', error.message);
      }
    } catch (dbError) {
      console.warn('⚠️ Database error:', dbError.message);
    }

    res.json({
      success: true,
      message: 'Reconnected to Avalon',
      balance: balance ? balance.amount : 0
    });
  } catch (error) {
    console.error('❌ Reconnection failed:', error.message);
    sdkInstance = null;

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// USER API ENDPOINTS - Avalon Auth Service (FASE 2)
// ============================================================================

// POST /api/user/generate-ssid - Gera SSID individual para um usuário
app.post('/api/user/generate-ssid', async (req, res) => {
  const { userId, avalonCredentials } = req.body;

  console.log('🔐 [API] Solicitação de geração de SSID para usuário:', userId);

  // Validação de entrada
  if (!userId) {
    return res.status(400).json({
      success: false,
      error: 'userId é obrigatório'
    });
  }

  if (!avalonCredentials || !avalonCredentials.ssid || !avalonCredentials.avalonUserId) {
    return res.status(400).json({
      success: false,
      error: 'avalonCredentials com ssid e avalonUserId são obrigatórios',
      expected: {
        userId: 'string (UUID)',
        avalonCredentials: {
          ssid: 'string (SSID Avalon)',
          avalonUserId: 'number (User ID Avalon)'
        }
      }
    });
  }

  try {
    // Chamar serviço de autenticação
    const result = await avalonAuthService.generateSSIDForUser(userId, avalonCredentials);

    if (result.success) {
      console.log('✅ [API] SSID gerado com sucesso para:', userId);

      return res.json({
        success: true,
        message: 'SSID gerado e validado com sucesso',
        data: {
          ssid: result.ssid,
          avalonUserId: result.avalonUserId,
          balance: result.balance,
          currency: result.currency,
          sessionId: result.sessionId
        }
      });
    } else {
      console.error('❌ [API] Falha ao gerar SSID:', result.error);

      return res.status(500).json({
        success: false,
        error: result.error,
        message: 'Falha ao gerar SSID para o usuário'
      });
    }

  } catch (error) {
    console.error('❌ [API] Erro ao processar geração de SSID:', error.message);

    return res.status(500).json({
      success: false,
      error: error.message,
      message: 'Erro interno ao gerar SSID'
    });
  }
});

// POST /api/user/validate-ssid - Valida um SSID existente
app.post('/api/user/validate-ssid', async (req, res) => {
  const { userId, ssid } = req.body;

  console.log('🔍 [API] Solicitação de validação de SSID para usuário:', userId);

  // Validação de entrada
  if (!userId || !ssid) {
    return res.status(400).json({
      success: false,
      error: 'userId e ssid são obrigatórios'
    });
  }

  try {
    const result = await avalonAuthService.validateSSID(userId, ssid);

    if (result.valid) {
      console.log('✅ [API] SSID válido para:', userId);

      return res.json({
        success: true,
        valid: true,
        message: 'SSID validado com sucesso'
      });
    } else {
      console.warn('⚠️ [API] SSID inválido ou expirado:', result.error);

      return res.status(401).json({
        success: false,
        valid: false,
        error: result.error,
        message: 'SSID inválido ou expirado'
      });
    }

  } catch (error) {
    console.error('❌ [API] Erro ao validar SSID:', error.message);

    return res.status(500).json({
      success: false,
      error: error.message,
      message: 'Erro interno ao validar SSID'
    });
  }
});

// GET /api/user/session/:userId - Retorna estatísticas da sessão
app.get('/api/user/session/:userId', async (req, res) => {
  const { userId } = req.params;

  console.log('📊 [API] Solicitação de stats de sessão para:', userId);

  try {
    const stats = await avalonAuthService.getSessionStats(userId);

    if (stats) {
      return res.json({
        success: true,
        data: stats
      });
    } else {
      return res.status(404).json({
        success: false,
        error: 'Sessão ativa não encontrada para o usuário'
      });
    }

  } catch (error) {
    console.error('❌ [API] Erro ao buscar stats de sessão:', error.message);

    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/user/close-session - Encerra a sessão de um usuário
app.post('/api/user/close-session', async (req, res) => {
  const { userId } = req.body;

  console.log('🛑 [API] Solicitação de encerramento de sessão para:', userId);

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: 'userId é obrigatório'
    });
  }

  try {
    const result = await avalonAuthService.closeSession(userId);

    if (result.success) {
      console.log('✅ [API] Sessão encerrada para:', userId);

      return res.json({
        success: true,
        message: 'Sessão encerrada com sucesso'
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ [API] Erro ao encerrar sessão:', error.message);

    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/user/avalon-credentials - Salva credenciais Avalon criptografadas (AUTOMATIC SSID GENERATION)
app.post('/api/user/avalon-credentials', async (req, res) => {
  const { userId, avalonUsername, avalonPassword, accountType } = req.body;

  console.log('🔐 [API] Solicitação para salvar credenciais Avalon');
  console.log(`📋 [API] UserId: ${userId}`);
  console.log(`📋 [API] Username: ${avalonUsername}`);
  console.log(`📋 [API] Account Type: ${accountType}`);

  // Validação de entrada
  if (!userId) {
    return res.status(400).json({
      success: false,
      error: 'userId é obrigatório'
    });
  }

  if (!avalonUsername || !avalonPassword) {
    return res.status(400).json({
      success: false,
      error: 'avalonUsername e avalonPassword são obrigatórios'
    });
  }

  if (accountType && !['demo', 'real'].includes(accountType)) {
    return res.status(400).json({
      success: false,
      error: 'accountType deve ser "demo" ou "real"'
    });
  }

  try {
    // Importar serviço de criptografia dinamicamente
    const { encrypt } = await import('./src/services/encryption.mjs');

    // Criptografar senha
    console.log('🔐 [API] Criptografando senha Avalon...');
    const encryptedPassword = encrypt(avalonPassword);
    console.log('✅ [API] Senha criptografada com sucesso');

    // Verificar se usuário já tem registro no bot_status
    const { data: existing } = await supabase
      .from('bot_status')
      .select('id, user_id')
      .eq('user_id', userId)
      .maybeSingle();

    const credentialsData = {
      avalon_username: avalonUsername,
      avalon_password_encrypted: encryptedPassword,
      avalon_credentials_valid: false, // Será validado no primeiro uso
      avalon_last_login: null
    };

    // Se accountType foi fornecido, atualizar também
    if (accountType) {
      credentialsData.account_type = accountType;
    }

    if (existing) {
      // Atualizar registro existente
      console.log('🔄 [API] Atualizando credenciais existentes...');
      const { error: updateError } = await supabase
        .from('bot_status')
        .update(credentialsData)
        .eq('user_id', userId);

      if (updateError) {
        console.error('❌ [API] Erro ao atualizar credenciais:', updateError);
        throw updateError;
      }

      console.log('✅ [API] Credenciais atualizadas com sucesso');
    } else {
      // Criar novo registro
      console.log('🆕 [API] Criando novo registro com credenciais...');
      const { error: insertError } = await supabase
        .from('bot_status')
        .insert({
          user_id: userId,
          ...credentialsData,
          is_connected: false,
          broker_balance: 0,
          account_type: accountType || 'demo'
        });

      if (insertError) {
        console.error('❌ [API] Erro ao criar registro:', insertError);
        throw insertError;
      }

      console.log('✅ [API] Novo registro criado com sucesso');
    }

    return res.json({
      success: true,
      message: 'Credenciais Avalon salvas com sucesso. O sistema gerará SSID automaticamente quando necessário.'
    });

  } catch (error) {
    console.error('❌ [API] Erro ao salvar credenciais Avalon:', error.message);

    return res.status(500).json({
      success: false,
      error: error.message,
      message: 'Erro ao salvar credenciais Avalon'
    });
  }
});

// ============================================================================
// BOT MULTI-USER API ENDPOINTS - Session Management (FASE 3)
// ============================================================================

// POST /api/bot/sessions/:userId/start - Inicia sessão de bot para usuário específico
app.post('/api/bot/sessions/:userId/start', async (req, res) => {
  const { userId } = req.params;
  const config = req.body.config || {};

  console.log(`\n${'='.repeat(80)}`);
  console.log(`🚀 [API] POST /api/bot/sessions/:userId/start`);
  console.log(`📋 [API] UserId: ${userId}`);
  console.log(`📋 [API] Request Body:`, JSON.stringify(req.body, null, 2));
  console.log(`📋 [API] Config extraído:`, JSON.stringify(config, null, 2));
  console.log(`${'='.repeat(80)}\n`);

  if (!userId) {
    console.error(`❌ [API] Validação falhou: userId é obrigatório`);
    return res.status(400).json({
      success: false,
      error: 'userId é obrigatório'
    });
  }

  try {
    console.log(`🔄 [API] Chamando sessionManager.startUserSession()`);
    const result = await sessionManager.startUserSession(userId, config);

    console.log(`📤 [API] Resultado do SessionManager:`, JSON.stringify(result, null, 2));

    if (result.success) {
      console.log(`✅ [API] Sessão iniciada com sucesso! Retornando 200`);
      return res.json(result);
    } else {
      console.error(`❌ [API] SessionManager retornou erro: ${result.error}`);
      console.log(`📤 [API] Retornando 400 Bad Request`);
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error(`❌ [API] Exceção capturada:`, error.message);
    console.error(`📚 [API] Stack trace:`, error.stack);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/bot/sessions/:userId/stop - Para sessão de bot para usuário específico
app.post('/api/bot/sessions/:userId/stop', async (req, res) => {
  const { userId } = req.params;

  console.log(`🛑 [API] Parando sessão de bot para usuário: ${userId}`);

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: 'userId é obrigatório'
    });
  }

  try {
    const result = await sessionManager.stopUserSession(userId);

    if (result.success) {
      return res.json(result);
    } else {
      return res.status(404).json(result);
    }
  } catch (error) {
    console.error(`❌ [API] Erro ao parar sessão:`, error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/bot/sessions/:userId/status - Obtém status da sessão do usuário
app.get('/api/bot/sessions/:userId/status', (req, res) => {
  const { userId } = req.params;

  console.log(`📊 [API] Status da sessão para usuário: ${userId}`);

  try {
    const status = sessionManager.getUserSessionStatus(userId);
    return res.json({
      success: true,
      ...status
    });
  } catch (error) {
    console.error(`❌ [API] Erro ao obter status:`, error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/bot/sessions/:userId/pause - Pausa sessão (sem encerrar)
app.post('/api/bot/sessions/:userId/pause', async (req, res) => {
  const { userId } = req.params;

  console.log(`⏸️ [API] Pausando sessão para usuário: ${userId}`);

  try {
    const result = await sessionManager.pauseUserSession(userId);

    if (result.success) {
      return res.json(result);
    } else {
      return res.status(404).json(result);
    }
  } catch (error) {
    console.error(`❌ [API] Erro ao pausar sessão:`, error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/bot/sessions/:userId/resume - Retoma sessão pausada
app.post('/api/bot/sessions/:userId/resume', async (req, res) => {
  const { userId } = req.params;

  console.log(`▶️ [API] Retomando sessão para usuário: ${userId}`);

  try {
    const result = await sessionManager.resumeUserSession(userId);

    if (result.success) {
      return res.json(result);
    } else {
      return res.status(404).json(result);
    }
  } catch (error) {
    console.error(`❌ [API] Erro ao retomar sessão:`, error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/bot/sessions - Lista todas as sessões ativas
app.get('/api/bot/sessions', (req, res) => {
  console.log(`📊 [API] Listando todas as sessões ativas`);

  try {
    const sessions = sessionManager.getActiveSessions();
    return res.json({
      success: true,
      count: sessions.length,
      sessions
    });
  } catch (error) {
    console.error(`❌ [API] Erro ao listar sessões:`, error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/bot/stats - Obtém estatísticas globais de todas as sessões
app.get('/api/bot/stats', (req, res) => {
  console.log(`📊 [API] Obtendo estatísticas globais`);

  try {
    const stats = sessionManager.getGlobalStats();
    return res.json({
      success: true,
      ...stats
    });
  } catch (error) {
    console.error(`❌ [API] Erro ao obter estatísticas:`, error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/bot/sessions/stop-all - Para todas as sessões (admin only)
app.post('/api/bot/sessions/stop-all', async (req, res) => {
  console.log(`🛑 [API] Parando TODAS as sessões`);

  try {
    const result = await sessionManager.stopAllSessions();
    return res.json(result);
  } catch (error) {
    console.error(`❌ [API] Erro ao parar todas as sessões:`, error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/bot/sessions/cleanup - Executa cleanup manual de sessões inativas
app.post('/api/bot/sessions/cleanup', async (req, res) => {
  console.log(`🧹 [API] Executando cleanup de sessões`);

  try {
    const result = await sessionManager.cleanup();
    return res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error(`❌ [API] Erro no cleanup:`, error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// ADMIN API ENDPOINTS - Health Check & Metrics
// ============================================================================

// GET /api/admin/health - System health check
app.get('/api/admin/health', async (req, res) => {
  try {
    const context = getMetricsContext();
    const health = await performHealthCheck(context);
    res.json(health);
  } catch (error) {
    console.error('Error in health check:', error);
    res.status(500).json({
      status: 'down',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// GET /api/admin/metrics/realtime - Real-time metrics
app.get('/api/admin/metrics/realtime', async (req, res) => {
  try {
    const metrics = await Metrics.getRealtimeMetrics(supabase);
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error fetching realtime metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/admin/metrics/daily - Daily aggregated metrics
app.get('/api/admin/metrics/daily', async (req, res) => {
  try {
    const metrics = await Metrics.getDailyMetrics(supabase);
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error fetching daily metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/admin/metrics/summary - Summary metrics
app.get('/api/admin/metrics/summary', async (req, res) => {
  try {
    const metrics = await Metrics.getSummaryMetrics(supabase);
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error fetching summary metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/admin/metrics/top-users - Top performing users
app.get('/api/admin/metrics/top-users', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const topUsers = await Metrics.getTopUsers(supabase, limit);
    res.json({
      success: true,
      data: topUsers
    });
  } catch (error) {
    console.error('Error fetching top users:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/admin/metrics/activity - Recent activity feed
app.get('/api/admin/metrics/activity', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const activity = await Metrics.getRecentActivity(supabase, limit);
    res.json({
      success: true,
      data: activity
    });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// ADMIN API ENDPOINTS - User Management
// ============================================================================

// Middleware: Verify admin authorization
async function verifyAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Missing or invalid authorization header'
      });
    }

    const token = authHeader.substring(7);

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    // Check if user has admin role
    const isAdmin = await UserManagement.isAdmin(user.id);

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin role required.'
      });
    }

    // Attach user to request for downstream use
    req.user = user;
    next();
  } catch (error) {
    console.error('Error in admin verification:', error);
    res.status(500).json({
      success: false,
      error: 'Authorization verification failed'
    });
  }
}

// GET /api/admin/users - List all users with pagination and filters
app.get('/api/admin/users', verifyAdmin, async (req, res) => {
  try {
    const filters = {
      search: req.query.search || '',
      isActive: req.query.isActive ? req.query.isActive === 'true' : null,
      accountType: req.query.accountType || null,
      sortBy: req.query.sortBy || 'created_at',
      sortOrder: req.query.sortOrder || 'desc',
      limit: parseInt(req.query.limit) || 20,
      offset: parseInt(req.query.offset) || 0
    };

    const result = await UserManagement.getAllUsers(filters);
    res.json(result);
  } catch (error) {
    console.error('Error in GET /api/admin/users:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/admin/users/:id - Get detailed user information
app.get('/api/admin/users/:id', verifyAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const result = await UserManagement.getUserById(userId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error in GET /api/admin/users/:id:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/admin/users/:id/metrics - Get user performance metrics
app.get('/api/admin/users/:id/metrics', verifyAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const metrics = await UserManagement.getUserMetrics(userId);

    if (!metrics) {
      return res.status(404).json({
        success: false,
        error: 'User not found or no metrics available'
      });
    }

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error in GET /api/admin/users/:id/metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/admin/users/:id/trades - Get user trade history
app.get('/api/admin/users/:id/trades', verifyAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const filters = {
      startDate: req.query.startDate || null,
      endDate: req.query.endDate || null,
      resultado: req.query.resultado || null,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0
    };

    const result = await UserManagement.getUserTrades(userId, filters);
    res.json(result);
  } catch (error) {
    console.error('Error in GET /api/admin/users/:id/trades:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/admin/users/:id/activity - Get user activity log
app.get('/api/admin/users/:id/activity', verifyAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const filters = {
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0
    };

    const result = await UserManagement.getUserActivityLog(userId, filters);
    res.json(result);
  } catch (error) {
    console.error('Error in GET /api/admin/users/:id/activity:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/admin/users/:id/activate - Activate a suspended user
app.put('/api/admin/users/:id/activate', verifyAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const adminUserId = req.user.id;

    const result = await UserManagement.activateUser(userId, adminUserId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Emit real-time event to admin dashboard
    adminNamespace.emit('user:activated', {
      userId,
      adminUserId,
      timestamp: new Date().toISOString()
    });

    res.json(result);
  } catch (error) {
    console.error('Error in PUT /api/admin/users/:id/activate:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/admin/users/:id/suspend - Suspend a user account
app.put('/api/admin/users/:id/suspend', verifyAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const adminUserId = req.user.id;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Suspension reason is required'
      });
    }

    const result = await UserManagement.suspendUser(userId, adminUserId, reason);

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Emit real-time event to admin dashboard
    adminNamespace.emit('user:suspended', {
      userId,
      adminUserId,
      reason,
      timestamp: new Date().toISOString()
    });

    res.json(result);
  } catch (error) {
    console.error('Error in PUT /api/admin/users/:id/suspend:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/admin/users/:id/role - Update user role
app.put('/api/admin/users/:id/role', verifyAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const adminUserId = req.user.id;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({
        success: false,
        error: 'Role is required'
      });
    }

    const result = await UserManagement.updateUserRole(userId, role, adminUserId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Emit real-time event to admin dashboard
    adminNamespace.emit('user:roleUpdated', {
      userId,
      adminUserId,
      newRole: role,
      timestamp: new Date().toISOString()
    });

    res.json(result);
  } catch (error) {
    console.error('Error in PUT /api/admin/users/:id/role:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/admin/users/:id/reset-password - Reset user password
app.post('/api/admin/users/:id/reset-password', verifyAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const adminUserId = req.user.id;

    const result = await UserManagement.resetUserPassword(userId, adminUserId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Emit real-time event to admin dashboard
    adminNamespace.emit('user:passwordReset', {
      userId,
      adminUserId,
      timestamp: new Date().toISOString()
    });

    res.json(result);
  } catch (error) {
    console.error('Error in POST /api/admin/users/:id/reset-password:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// ADMIN API ENDPOINTS - Analytics
// ============================================================================

// GET /api/admin/analytics/daily - Get daily performance metrics
app.get('/api/admin/analytics/daily', verifyAdmin, async (req, res) => {
  try {
    const startDate = req.query.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = req.query.endDate || new Date().toISOString();

    const data = await Analytics.getDailyPerformance(startDate, endDate);
    res.json({
      success: true,
      data,
      filters: { startDate, endDate }
    });
  } catch (error) {
    console.error('Error in GET /api/admin/analytics/daily:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/admin/analytics/strategy - Get strategy performance breakdown
app.get('/api/admin/analytics/strategy', verifyAdmin, async (req, res) => {
  try {
    const data = await Analytics.getStrategyPerformance();
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error in GET /api/admin/analytics/strategy:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/admin/analytics/asset - Get asset performance breakdown
app.get('/api/admin/analytics/asset', verifyAdmin, async (req, res) => {
  try {
    const data = await Analytics.getAssetPerformance();
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error in GET /api/admin/analytics/asset:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/admin/analytics/hourly - Get hourly performance distribution
app.get('/api/admin/analytics/hourly', verifyAdmin, async (req, res) => {
  try {
    const data = await Analytics.getHourlyPerformance();
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error in GET /api/admin/analytics/hourly:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/admin/analytics/users - Get user performance ranking
app.get('/api/admin/analytics/users', verifyAdmin, async (req, res) => {
  try {
    const data = await Analytics.getUserPerformance();
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error in GET /api/admin/analytics/users:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/admin/analytics/health - Get system health metrics
app.get('/api/admin/analytics/health', verifyAdmin, async (req, res) => {
  try {
    const data = await Analytics.getSystemHealth();
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error in GET /api/admin/analytics/health:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/admin/analytics/comparison - Get comparison data (best/worst/avg/trend)
app.get('/api/admin/analytics/comparison', verifyAdmin, async (req, res) => {
  try {
    const startDate = req.query.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = req.query.endDate || new Date().toISOString();

    const data = await Analytics.getComparison(startDate, endDate);
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error in GET /api/admin/analytics/comparison:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/admin/analytics/charts - Get chart data formatted for Recharts
app.get('/api/admin/analytics/charts', verifyAdmin, async (req, res) => {
  try {
    const startDate = req.query.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = req.query.endDate || new Date().toISOString();

    const data = await Analytics.getChartsData(startDate, endDate);
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error in GET /api/admin/analytics/charts:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/admin/analytics/export - Export analytics data
app.get('/api/admin/analytics/export', verifyAdmin, async (req, res) => {
  try {
    const type = req.query.type || 'daily'; // daily, strategy, asset, hourly, users
    const format = req.query.format || 'csv'; // csv, pdf
    const startDate = req.query.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = req.query.endDate || new Date().toISOString();

    const data = await Analytics.exportAnalytics(type, format, { startDate, endDate });

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="analytics_${type}_${Date.now()}.csv"`);
      res.send(data);
    } else if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="analytics_${type}_${Date.now()}.pdf"`);
      res.send(data);
    }
  } catch (error) {
    console.error('Error in GET /api/admin/analytics/export:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// ADMIN API ENDPOINTS - Trades Management
// ============================================================================

// GET /api/admin/trades - List all trades with filters and pagination
app.get('/api/admin/trades', verifyAdmin, async (req, res) => {
  try {
    const filters = {
      startDate: req.query.startDate || null,
      endDate: req.query.endDate || null,
      userId: req.query.userId || null,
      asset: req.query.asset || null,
      strategy: req.query.strategy || null,
      result: req.query.result || null,
      minPayout: req.query.minPayout ? parseFloat(req.query.minPayout) : undefined,
      maxPayout: req.query.maxPayout ? parseFloat(req.query.maxPayout) : undefined,
      timeframe: req.query.timeframe || null
    };

    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 50;

    const result = await Trades.getAllTrades(filters, page, pageSize);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error in GET /api/admin/trades:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/admin/trades/stats - Get trade statistics summary
app.get('/api/admin/trades/stats', verifyAdmin, async (req, res) => {
  try {
    const filters = {
      startDate: req.query.startDate || null,
      endDate: req.query.endDate || null,
      userId: req.query.userId || null,
      asset: req.query.asset || null,
      strategy: req.query.strategy || null,
      result: req.query.result || null
    };

    const stats = await Trades.getTradeStatistics(filters);
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error in GET /api/admin/trades/stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/admin/trades/recent - Get recent trades
app.get('/api/admin/trades/recent', verifyAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const trades = await Trades.getRecentTrades(limit);
    res.json({
      success: true,
      data: trades
    });
  } catch (error) {
    console.error('Error in GET /api/admin/trades/recent:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/admin/trades/:id - Get trade details by ID
app.get('/api/admin/trades/:id', verifyAdmin, async (req, res) => {
  try {
    const tradeId = req.params.id;
    const trade = await Trades.getTradeById(tradeId);
    res.json({
      success: true,
      data: trade
    });
  } catch (error) {
    console.error('Error in GET /api/admin/trades/:id:', error);
    res.status(error.message === 'Trade not found' ? 404 : 500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/admin/trades/:id/context - Get trade context (market conditions, strategy, user)
app.get('/api/admin/trades/:id/context', verifyAdmin, async (req, res) => {
  try {
    const tradeId = req.params.id;
    const context = await Trades.getTradeContext(tradeId);
    res.json({
      success: true,
      data: context
    });
  } catch (error) {
    console.error('Error in GET /api/admin/trades/:id/context:', error);
    res.status(error.message === 'Trade not found' ? 404 : 500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/admin/trades/:id/timeline - Get trade timeline (entry, signals, exit)
app.get('/api/admin/trades/:id/timeline', verifyAdmin, async (req, res) => {
  try {
    const tradeId = req.params.id;
    const timeline = await Trades.getTradeTimeline(tradeId);
    res.json({
      success: true,
      data: timeline
    });
  } catch (error) {
    console.error('Error in GET /api/admin/trades/:id/timeline:', error);
    res.status(error.message === 'Trade not found' ? 404 : 500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/admin/trades/export - Export trades data
app.get('/api/admin/trades/export', verifyAdmin, async (req, res) => {
  try {
    const filters = {
      startDate: req.query.startDate || null,
      endDate: req.query.endDate || null,
      userId: req.query.userId || null,
      asset: req.query.asset || null,
      strategy: req.query.strategy || null,
      result: req.query.result || null
    };

    const format = req.query.format || 'csv'; // csv, pdf
    const maxRecords = parseInt(req.query.maxRecords) || 10000;

    const data = await Trades.exportTrades(filters, format, { maxRecords });

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="trades_${Date.now()}.csv"`);
      res.send(data);
    } else if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="trades_${Date.now()}.pdf"`);
      res.send(data);
    }
  } catch (error) {
    console.error('Error in GET /api/admin/trades/export:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// End of Admin API Endpoints
// ============================================================================

// ============================================================================
// SSID MANAGEMENT ENDPOINTS - Monitor and manage SSIDs
// ============================================================================

// GET /api/admin/ssid/stats - Get SSID statistics
app.get('/api/admin/ssid/stats', (req, res) => {
  try {
    const stats = ssidManager.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching SSID stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/admin/ssid/:userId - Get SSID info for specific user
app.get('/api/admin/ssid/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const info = ssidManager.getSSIDInfo(userId);
    res.json({
      success: true,
      data: info
    });
  } catch (error) {
    console.error('Error fetching SSID info:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/admin/ssid/:userId/renew - Force SSID renewal for user
app.post('/api/admin/ssid/:userId/renew', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`🔄 Forçando renovação de SSID para usuário: ${userId}`);

    const newSSID = await ssidManager.renewSSID(userId);

    res.json({
      success: true,
      message: 'SSID renewed successfully',
      ssid: newSSID.substring(0, 15) + '...'
    });
  } catch (error) {
    console.error('Error renewing SSID:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/admin/ssid/cleanup - Execute cleanup of expired SSIDs
app.post('/api/admin/ssid/cleanup', (req, res) => {
  try {
    const cleaned = ssidManager.cleanupExpiredSSIDs();
    res.json({
      success: true,
      message: `Cleaned up ${cleaned} expired SSIDs`,
      cleaned
    });
  } catch (error) {
    console.error('Error cleaning up SSIDs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Mount CRM module
app.use('/api/crm', crmRouter);

// Mount Integrations module
app.use('/api/crm/integrations', integrationsRouter);

// ✅ Inicializar servidor de forma assíncrona
(async () => {
  try {
    // 1️⃣ Inicializar SDK Avalon PRIMEIRO
    await initializeAvalonSDK();

    // 2️⃣ Descobrir e mapear Asset IDs dinamicamente
    await initializeAssetMap(sdkInstance);

    // 3️⃣ Setup Socket.IO Candles Handlers
    setupCandlesHandlers();
    console.log('✅ Candles Proxy initialized');

    // 4️⃣ Limpar estados órfãos do Supabase (sessões de servidor anterior)
    console.log('🧹 [Startup] Limpando estados órfãos do banco de dados...');
    try {
      const { error: cleanupError } = await supabase
        .from('bot_status')
        .update({
          bot_running: false,
          session_active: false,
          bot_pid: null
        })
        .eq('bot_running', true);

      if (cleanupError) {
        console.warn('⚠️ [Startup] Erro ao limpar estados órfãos:', cleanupError.message);
      } else {
        console.log('✅ [Startup] Estados órfãos limpos - todos os bots marcados como parados');
      }
    } catch (cleanupErr) {
      console.warn('⚠️ [Startup] Cleanup falhou:', cleanupErr.message);
    }

    // 5️⃣ Iniciar servidor HTTP
    const PORT = 4001;
    const server = httpServer.listen(PORT, () => {
      console.log(`✅ API Server rodando em http://localhost:${PORT}`);
      console.log(`🔄 Conexão: WebSocket via @quadcode-tech/client-sdk-js`);
      console.log(`📡 Endpoints disponíveis:`);
      console.log(`\n   BOT ENDPOINTS:`);
      console.log(`   GET  /api/bot/status`);
      console.log(`   POST /api/bot/connect             (WebSocket)`);
      console.log(`   GET  /api/bot/balance             (Get broker balance)`);
      console.log(`   POST /api/bot/account-type        (Set demo/real)`);
      console.log(`   POST /api/bot/start-runtime       (Start bot-live.mjs)`);
      console.log(`\n   CRM ENDPOINTS:`);
      console.log(`   GET  /api/crm/stats              (CRM Dashboard)`);
      console.log(`   ALL  /api/crm/contacts/*         (Contact Management)`);
      console.log(`   ALL  /api/crm/segments/*         (Dynamic Segmentation)`);
      console.log(`   ALL  /api/crm/workflows/*        (Workflow Automation)`);
      console.log(`   ALL  /api/crm/campaigns/*        (Email Campaigns)`);
      console.log(`   ALL  /api/crm/templates/*        (Email Templates)`);
      console.log(`   POST /api/bot/stop-runtime        (Stop bot-live.mjs)`);
      console.log(`   GET  /api/bot/runtime-status      (Check bot process)`);
      console.log(`   POST /api/bot/start`);
      console.log(`   POST /api/bot/stop`);
      console.log(`   GET  /api/market-scanner`);
      console.log(`   GET  /api/strategy-performance`);
      console.log(`\n   ADMIN ENDPOINTS:`);
      console.log(`   GET  /api/admin/health            (System health check)`);
      console.log(`   GET  /api/admin/metrics/realtime  (Real-time metrics)`);
      console.log(`   GET  /api/admin/metrics/daily     (Daily metrics)`);
      console.log(`   GET  /api/admin/metrics/summary   (Summary metrics)`);
      console.log(`   GET  /api/admin/metrics/top-users (Top performing users)`);
      console.log(`   GET  /api/admin/metrics/activity  (Recent activity feed)`);
      console.log(`\n   ADMIN USER MANAGEMENT (require admin auth):`);
      console.log(`   GET  /api/admin/users             (List all users)`);
      console.log(`   GET  /api/admin/users/:id         (Get user details)`);
      console.log(`   GET  /api/admin/users/:id/metrics (Get user metrics)`);
      console.log(`   GET  /api/admin/users/:id/trades  (Get user trades)`);
      console.log(`   GET  /api/admin/users/:id/activity (Get activity log)`);
      console.log(`   PUT  /api/admin/users/:id/activate (Activate user)`);
      console.log(`   PUT  /api/admin/users/:id/suspend (Suspend user)`);
      console.log(`   PUT  /api/admin/users/:id/role    (Update user role)`);
      console.log(`   POST /api/admin/users/:id/reset-password (Reset password)`);
      console.log(`\n   WebSocket: /admin namespace - Authenticated real-time updates`);
      console.log(`   Events: metrics:update, health:change, trade:completed, alert:new, log:new`);
    });

  } catch (error) {
    console.error('❌ Erro fatal ao iniciar servidor:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
})();

// Keep-alive: prevent process from exiting on Windows MINGW64
setInterval(() => {
  // Heartbeat every 30 seconds - keeps event loop active
}, 30000);
