# ⚙️ Backend API - Express Server

Servidor Express.js completo que gerencia toda a comunicação entre frontend, broker Avalon, banco de dados Supabase e sistema de trading bot.

Arquivo: `apps/backend/api-server.mjs` (2038 linhas)

## 📋 Visão Geral

- Stack: Express.js + Socket.IO + Supabase + Avalon SDK
- Porta: 4001
- CORS: Habilitado para todos os origins
- WebSocket: Socket.IO para comunicação real-time
- Broker: Avalon WebSocket SDK (@quadcode-tech/client-sdk-js)

## 🔌 Integrações Principais

### 1. Avalon Broker SDK

URL WebSocket: wss://ws.trade.avalonbroker.com/echo/websocket

Autenticação: SSID (expira a cada 24h)

- sdkInstance.balances() - Consultar saldos demo/real
- sdkInstance.realTimeChartDataLayer() - Dados de candles em tempo real
- sdkInstance.actives() - Lista de ativos disponíveis

### 2. Supabase Database

- Conexão: createClient() com service_role key
- Tabelas principais: bot_status, trades_history, strategy_trades, scanner_performance

### 3. Socket.IO WebSocket

- Namespace /admin - Admin dashboard real-time
- Namespace default - Bot events (status, trades, PNL)
- Candles Proxy - subscribe-candles, candle-update eventos

## 🛣️ Rotas Principais

### Bot Control Endpoints

`POST /api/bot/connect` - Conectar ao broker Avalon via WebSocket SDK

`POST /api/bot/disconnect` - Desconectar do broker

`POST /api/bot/reconnect` - Forçar reconexão (se SDK foi perdido)

`GET /api/bot/balance?accountType=demo|real` - Consultar saldo da conta

`POST /api/bot/account-type` - Alternar entre conta demo/real

`POST /api/bot/start-runtime` - Iniciar processo bot-live.mjs (spawn)

`POST /api/bot/stop-runtime` - Parar processo do bot (SIGTERM/SIGKILL)

`GET /api/bot/runtime-status` - Verificar se bot está rodando

`GET /api/bot/status` - Status geral do bot (connected, running)

### Admin Endpoints (Requer Autenticação)

`GET /api/admin/health` - Health check do sistema

`GET /api/admin/metrics/realtime` - Métricas em tempo real

`GET /api/admin/users` - Listar todos os usuários (paginação)

`GET /api/admin/users/:id` - Detalhes de usuário específico

`GET /api/admin/analytics/daily` - Performance diária (30 dias)

`GET /api/admin/trades` - Listar todos os trades com filtros

`GET /api/admin/analytics/export?type=daily&format=csv` - Exportar analytics (CSV/PDF)

### CRM Endpoints

`GET /api/crm/stats` - Dashboard CRM (total contacts, leads, customers)

`/api/crm/contacts/*` - CRUD de contatos

`/api/crm/workflows/*` - Workflows de automação (React Flow)

`/api/crm/campaigns/*` - Campanhas de email

`/api/crm/templates/*` - Templates de email (Unlayer)

## 📡 WebSocket Events

Bot WebSocket (Namespace padrão):

- bot_status - Status do bot (analyzing, signal_found, win, loss)
- trade_completed - Trade finalizado com resultado
- pnl_update - Atualização de PNL total e win rate
- subscribe-candles - Inscrever em candles de um ativo
- candle-update - Novo candle recebido (tempo real)

Admin WebSocket (Namespace /admin):

- metrics:update - Métricas atualizadas
- user:activated / user:suspended - Eventos de usuário
- alert:new - Novo alerta do sistema

## 💻 Exemplo de Código

### Conectar ao Broker Avalon

`async function initializeAvalonSDK() {
  sdkInstance = await ClientSdk.create(
    AVALON_WS_URL,
    AVALON_USER_ID,
    new SsidAuthMethod(AVALON_SSID),
    { host: AVALON_API_HOST }
  );
  
  // Verifica saldo
  const balancesData = await sdkInstance.balances();
  const balance = balancesData.getBalances().find(b => b.amount > 0);
  
  return sdkInstance;
}`

### Analytics com Cache (5 min TTL)

`// apps/backend/src/admin/analytics.mjs
function getCached(key, queryFn) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return Promise.resolve(cached.data);
  }
  
  return queryFn().then(data => {
    cache.set(key, { data, timestamp: Date.now() });
    return data;
  });
}`

## ⚠️ Limitações Conhecidas

- SSID expira a cada 24h - precisa ser atualizado manualmente
- Bot runtime suporta apenas 1 usuário por vez (sdkInstance global)
- Asset ID Map fixo com 150+ ativos (FIXED_ASSET_MAP)
- Cache de analytics: 5 minutos (pode estar desatualizado)

🔧 Atualização 2025-10-10: Novo serviço avalon-ssid-generator.mjs implementado. Usa POST api-qc.avalonbots.com:3000/session/{userId} com Bearer token. BotSession._fetchUserSSID() refatorado para uso correto da API.