# Quadcode/Avalon Broker API - Guia Completo de Integração

> **Versão 2.0.0** - Atualizado com SDK Oficial + Todos os Endpoints Avalon

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [SDK Oficial (@quadcode-tech/client-sdk-js)](#sdk-oficial)
3. [Arquitetura da API](#arquitetura-da-api)
4. [Todos os Endpoints Avalon Broker](#todos-os-endpoints-avalon-broker)
5. [Autenticação e Sessão](#autenticação-e-sessão)
6. [WebSocket API](#websocket-api)
7. [Trading Operations](#trading-operations)
8. [Market Data](#market-data)
9. [Account Management](#account-management)
10. [APIs Adicionais](#apis-adicionais)
11. [Exemplos Práticos](#exemplos-práticos)
12. [Error Handling](#error-handling)
13. [Best Practices](#best-practices)
14. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

### O que é a Quadcode API?

A **Quadcode** (anteriormente IQOption Technology) é a plataforma tecnológica que alimenta diversas corretoras de opções binárias, incluindo:
- IQ Option
- **Avalon Broker** ⭐ (foco deste guia)
- Outras white-label brands

### Características Principais

- ✅ **SDK Oficial TypeScript/JavaScript** (@quadcode-tech/client-sdk-js v1.3.9)
- ✅ **Trading de Binary Options** (CALL/PUT em forex, crypto, stocks)
- ✅ **WebSocket em Tempo Real** (cotações, execução, notificações)
- ✅ **REST APIs Completas** (20+ endpoints especializados)
- ✅ **Multi-Asset Support** (Forex, Crypto, Commodities, Stocks, Indices)
- ✅ **Timeframes Flexíveis** (5s Blitz até 1 dia)

### Tipos de Operação Suportados

| Tipo | Duração | Payout | SDK Support |
|------|---------|--------|-------------|
| **Blitz** | 5s - 30s | Fixo (~85%) | ✅ BlitzOptionsDirection |
| **Turbo** | 1min - 5min | Fixo (~85%) | ✅ TurboOptionsDirection |
| **Binary** | 5min - 1h | Fixo (~85%) | ✅ BinaryOptionsDirection |
| **Digital** | 1min - 23h | Variável | ✅ DigitalOptionsDirection |

---

## 📦 SDK Oficial

### Instalação

```bash
npm install @quadcode-tech/client-sdk-js
```

**Versão atual**: 1.3.9 | **GitHub**: https://github.com/quadcode/client-sdk-js

### Imports Disponíveis

```typescript
import {
  QuadcodeClientSdk,        // SDK principal
  BalanceType,              // Tipos de conta (Real/Demo)
  BinaryOptionsDirection,   // CALL/PUT para Binary
  BlitzOptionsDirection,    // CALL/PUT para Blitz (5-30s)
  DigitalOptionsDirection,  // CALL/PUT para Digital
  TurboOptionsDirection,    // CALL/PUT para Turbo
  SsidAuthMethod,          // Autenticação por SSID ⭐
  OAuthMethod              // Autenticação OAuth (PKCE)
} from '@quadcode-tech/client-sdk-js';
```

### Quick Start

```typescript
import { QuadcodeClientSdk, SsidAuthMethod, TurboOptionsDirection } from '@quadcode-tech/client-sdk-js';

// 1. Criar SSID (ver seção Autenticação)
const ssid = 'seu-ssid-aqui';

// 2. Conectar SDK
const sdk = await QuadcodeClientSdk.create(
  'wss://ws.trade.avalonbroker.com/echo/websocket',
  82,  // Protocol version
  new SsidAuthMethod(ssid)
);

// 3. Obter balance
const balances = await sdk.balances().getBalances();
console.log('Balance:', balances[0].amount);

// 4. Comprar opção Turbo 1min
const turboApi = sdk.turboOptions();
await turboApi.buy({
  instrument_id: 'EURUSD',
  direction: TurboOptionsDirection.CALL,
  price: 10,
  expired: Math.floor(Date.now() / 1000) + 60
});
```

### APIs Principais do SDK

#### 1. Balances API

```typescript
const balancesApi = sdk.balances();

// Obter todas as contas
const allBalances = await balancesApi.getBalances();
// [{ id: 123456, type: 1, amount: 1050.50 }, ...]

// Obter conta específica
const balance = await balancesApi.getBalanceById(123456);

// Subscribe para updates em tempo real
balance.subscribeOnUpdate((updated) => {
  console.log('💵 New balance:', updated.amount);
});

// Resetar demo
await balancesApi.resetDemoBalance(demoBalanceId);
```

#### 2. Quotes API

```typescript
const quotesApi = sdk.quotes();

// Cotação atual
const quote = await quotesApi.getCurrentQuoteForActive('EURUSD');
console.log('EURUSD:', quote.value);

// Subscribe para ticks em tempo real
quotesApi.subscribeOnQuote('EURUSD', (tick) => {
  console.log('📊 Tick:', tick.value, tick.timestamp);
});
```

#### 3. Options APIs (Binary/Turbo/Blitz/Digital)

```typescript
// Turbo (1-5min)
const turboApi = sdk.turboOptions();
await turboApi.buy({
  instrument_id: 'BTCUSD',
  direction: TurboOptionsDirection.CALL,
  price: 25,
  expired: Math.floor(Date.now() / 1000) + 120 // 2min
});

// Blitz (5-30s)
const blitzApi = sdk.blitzOptions();
await blitzApi.buy({
  instrument_id: 'EURUSD',
  direction: BlitzOptionsDirection.PUT,
  price: 5,
  expired: Math.floor(Date.now() / 1000) + 15 // 15s
});

// Digital (com strike price)
const digitalApi = sdk.digitalOptions();
await digitalApi.buy({
  instrument_id: 'GBPUSD',
  direction: DigitalOptionsDirection.CALL,
  price: 10,
  strike: 1.2650,
  expired: Math.floor(Date.now() / 1000) + 3600 // 1h
});

// Subscribe para resultados
turboApi.subscribeOnClose((result) => {
  console.log(`💰 ${result.win} - $${result.profit_amount}`);
});
```

---

## 🏗️ Arquitetura da API

```
┌─────────────────────────────────────────────────────┐
│                CLIENT APPLICATION                    │
│         (Frontend/Backend Bot com SDK)               │
└────────┬────────────────────────────────┬───────────┘
         │                                │
         │ REST (HTTPS)                   │ WebSocket (WSS)
         │                                │
┌────────▼────────────┐         ┌────────▼─────────────┐
│   Session API       │         │  @quadcode SDK       │
│ (SSID Generation)   │         │ (Trading WebSocket)  │
└─────────────────────┘         └──────────────────────┘
         │                                │
         └────────────────┬───────────────┘
                          │
                ┌─────────▼──────────┐
                │  Avalon Platform   │
                │   (Quadcode Tech)  │
                │                    │
                │  ┌──────────────┐  │
                │  │   Gateway    │◄─┼─── api.trade.avalonbroker.com
                │  └──────┬───────┘  │
                │         │          │
                │  ┌──────▼───────┐  │
                │  │Microservices │  │
                │  │ • Billing    │  │
                │  │ • Chat       │  │
                │  │ • Auth       │  │
                │  │ • Notify     │  │
                │  │ • Wallet     │  │
                │  └──────────────┘  │
                └────────────────────┘
```

---

## 🌐 Todos os Endpoints Avalon Broker

### 🔐 Credenciais de Acesso

```bash
API_KEY=dfc29735b5450651d5c03f4fb6508ed9
USER_ID=183588600
```

### 🎯 Core APIs (Prioridade Alta)

| Endpoint | Uso | Método |
|----------|-----|--------|
| **Gateway API** | https://api.trade.avalonbroker.com | GET/POST |
| **Trading WebSocket** | wss://ws.trade.avalonbroker.com/echo/websocket | WSS |
| **Session API** | http://api-qc.avalonbots.com:3000/session/{user_id} | POST |
| **Logout** | https://api.trade.avalonbroker.com/v1/logout | POST |

### 💰 Financial APIs

| Endpoint | Funcionalidades |
|----------|----------------|
| **Billing API**<br>`https://billing.trade.avalonbroker.com` | • Saldo de contas<br>• Histórico de transações<br>• Depósitos/Saques<br>• P&L Reports |
| **Wallet Referral**<br>`https://wallet-referral.trade.avalonbroker.com` | • Sistema de afiliados<br>• Comissões de referência<br>• Link personalizado<br>• Dashboard de conversões |

### 👤 Authentication & User

| Endpoint | Funcionalidades |
|----------|----------------|
| **Auth API**<br>`https://auth.trade.avalonbroker.com` | • Login/Logout programático<br>• OAuth tokens<br>• Session refresh |
| **User Verification**<br>`https://user-verification.trade.avalonbroker.com` | • KYC/AML<br>• Upload de documentos<br>• Status de verificação |
| **Verify API**<br>`https://verify.trade.avalonbroker.com` | • Validações (email, telefone)<br>• Confirmação de ações |
| **Avatars API**<br>`https://avatars.trade.avalonbroker.com` | • Upload de avatar<br>• Gerenciar imagem de perfil |

### 📊 Real-Time Data

| Endpoint | Funcionalidades |
|----------|----------------|
| **Trading WebSocket**<br>`wss://ws.trade.avalonbroker.com/echo/websocket` | • Cotações em tempo real<br>• Execução de ordens<br>• Candles/Quotes |
| **Notification WebSocket**<br>`wss://notification.trade.avalonbroker.com:443/echo/websocket` | • Push notifications<br>• Alertas de operações<br>• Status updates |

### 💬 Support & Content

| Endpoint | Funcionalidades |
|----------|----------------|
| **Chat API**<br>`https://chat.trade.avalonbroker.com` | • Suporte em tempo real<br>• Histórico de conversas<br>• Anexos |
| **Blog**<br>`https://blog.trade.avalonbroker.com` | • Artigos educacionais<br>• Notícias de mercado |
| **Video Education**<br>`https://ve.trade.avalonbroker.com` | • Vídeos educacionais<br>• Tutoriais<br>• Webinars |

### ⚙️ Technical & Resources

| Endpoint | Funcionalidades |
|----------|----------------|
| **Features API**<br>`https://features.trade.avalonbroker.com` | • Feature flags<br>• A/B testing<br>• Disponibilidade dinâmica |
| **Event API**<br>`https://event.trade.avalonbroker.com` | • Analytics<br>• Tracking de eventos<br>• Métricas |
| **Updates API**<br>`https://updates.trade.avalonbroker.com` | • Changelogs<br>• Manutenções<br>• Atualizações |
| **FSMS (File Storage)**<br>`https://fsms.trade.avalonbroker.com` | • Upload/Download<br>• Documentos<br>• Comprovantes |
| **Static CDN**<br>`https://static.cdnroute.io` | • Assets estáticos<br>• Imagens<br>• Scripts |

### 🛡️ Legal & Compliance

| Endpoint | Documento |
|----------|-----------|
| `https://avalonbroker.io/legal/terms` | Terms & Conditions |
| `https://avalonbroker.io/legal/privacy` | Privacy Policy |
| `https://avalonbroker.io/legal/aml` | AML Policy |
| `https://avalonbroker.io/legal/payment-policy` | Payment Policy |
| `https://avalonbroker.io/legal/order-execution` | Order Execution |
| `https://avalonbroker.io/legal/general-fees` | General Fees |

### 🌍 Web Platforms

| URL | Descrição |
|-----|-----------|
| `https://trade.avalonbroker.com` | Plataforma principal |
| `https://eu.trade.avalonbroker.com` | Versão regulada (ESMA) |

---

## 🔐 Autenticação e Sessão

### Método 1: SSID (Recomendado para Bots)

**Endpoint**: `POST http://api-qc.avalonbots.com:3000/session/{user_id}`

```bash
curl -X POST \
  http://api-qc.avalonbots.com:3000/session/183588600 \
  -H "Authorization: Bearer dfc29735b5450651d5c03f4fb6508ed9" \
  -H "Content-Type: application/json"
```

**Response**:
```json
{
  "ssid": "1234567890abcdef1234567890abcdef",
  "userId": "183588600"
}
```

**JavaScript Implementation**:
```typescript
async function createSession(): Promise<string> {
  const response = await fetch(
    'http://api-qc.avalonbots.com:3000/session/183588600',
    {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer dfc29735b5450651d5c03f4fb6508ed9',
        'Content-Type': 'application/json'
      }
    }
  );

  const { ssid } = await response.json();
  return ssid;
}
```

### Método 2: OAuth com PKCE (Para Web Apps)

```typescript
const sdk = await QuadcodeClientSdk.create(
  'wss://ws.trade.avalonbroker.com/echo/websocket',
  82,
  new OAuthMethod(
    'https://api.trade.avalonbroker.com',
    'YOUR_CLIENT_ID',
    'https://your.app/callback',
    'full offline_access'
  )
);
```

**OAuth Flow**:
1. Redirecionar usuário: `https://auth.trade.avalonbroker.com/authorize?client_id=...`
2. User faz login
3. Callback recebe authorization code
4. Trocar code por access token
5. Usar token no SDK

### SSID Lifecycle

- ⏱️ **Validade**: ~24 horas
- 🔄 **Renovação**: Criar novo quando expirar
- 🔒 **Storage**: Em memória apenas (segurança)
- 📝 **Uso**: Um SSID por conexão SDK/WebSocket

---

## 🔌 WebSocket API

### Conectar (Manualmente)

```javascript
const ws = new WebSocket('wss://ws.trade.avalonbroker.com/echo/websocket');

ws.onopen = () => {
  // Autenticar com SSID
  ws.send(JSON.stringify({
    name: 'ssid',
    msg: ssid
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('📩', data);
};
```

### Principais Canais

#### Subscribe Candles

```json
{
  "name": "subscribeMessage",
  "msg": {
    "name": "candle-generated",
    "params": {
      "routingFilters": {
        "active_id": 1,
        "size": 60
      }
    }
  }
}
```

#### Trader Mood

```json
{
  "name": "subscribeMessage",
  "msg": {
    "name": "traders-mood-changed",
    "params": {
      "routingFilters": {
        "asset_id": 1,
        "instrument_type": "turbo-option"
      }
    }
  }
}
```

**Response**:
```json
{
  "name": "traders-mood-changed",
  "msg": {
    "asset_id": 1,
    "higher": 68,  // 68% acham que vai subir
    "lower": 32    // 32% acham que vai cair
  }
}
```

---

## 💰 Trading Operations

### Comprar Opção (via SDK)

```typescript
const turboApi = sdk.turboOptions();

const order = await turboApi.buy({
  instrument_id: 'EURUSD',
  direction: TurboOptionsDirection.CALL,
  price: 10,
  expired: Math.floor(Date.now() / 1000) + 60
});

console.log('Order ID:', order.id);
```

### Calcular Expiração

```typescript
// Turbo (redondo em minutos)
function getTurboExpiration(minutes: number): number {
  const now = Math.floor(Date.now() / 1000);
  const roundedMinute = Math.floor(now / 60) * 60;
  return roundedMinute + (minutes * 60);
}

// Binary (horários fixos de 5 em 5 minutos)
function getBinaryExpiration(): number {
  const now = new Date();
  const next = new Date(now);
  next.setMinutes(Math.ceil(now.getMinutes() / 5) * 5);
  next.setSeconds(0, 0);
  return Math.floor(next.getTime() / 1000);
}
```

### Subscribe Resultados

```typescript
turboApi.subscribeOnClose((result) => {
  console.log(`💰 Trade #${result.id}`);
  console.log(`Result: ${result.win}`); // 'win', 'loose', 'equal'
  console.log(`P&L: $${result.profit_amount}`);
});
```

---

## 📊 Market Data

### Candles Históricos (via WebSocket)

```json
{
  "name": "get-candles",
  "msg": {
    "active_id": 1,
    "size": 60,
    "to": 1707850800,
    "count": 100
  },
  "request_id": "candles_001"
}
```

### Top Assets

```json
{
  "name": "get-top-assets",
  "msg": {
    "instrument_type": "turbo-option",
    "limit": 10
  }
}
```

### Quotes em Tempo Real (via SDK)

```typescript
const quotesApi = sdk.quotes();

quotesApi.subscribeOnQuote('EURUSD', (quote) => {
  console.log(`📊 ${quote.value} @ ${new Date(quote.timestamp * 1000)}`);
});
```

---

## 👤 Account Management

### Obter Perfil (via WebSocket)

```json
{
  "name": "get-profile",
  "request_id": "profile_001"
}
```

### Trocar Conta (Real/Demo)

```json
{
  "name": "change-balance",
  "msg": {
    "balance_id": 123457
  }
}
```

### Histórico de Trades

```json
{
  "name": "get-options",
  "msg": {
    "instrument_type": "turbo-option",
    "limit": 50,
    "from": 1707764400,
    "to": 1707850800
  }
}
```

---

## 🚀 APIs Adicionais

### Billing API - Saldo e Transações

```bash
# Obter saldos
curl -X GET https://billing.trade.avalonbroker.com/v1/balances \
  -H "Authorization: Bearer {SSID}"

# Response
{
  "balances": [
    { "id": 123456, "type": 1, "amount": 1050.50, "currency": "USD" },
    { "id": 123457, "type": 4, "amount": 10000.00, "currency": "USD" }
  ]
}

# Histórico de transações
curl -X GET "https://billing.trade.avalonbroker.com/v1/transactions?from=2025-01-01&to=2025-01-31" \
  -H "Authorization: Bearer {SSID}"
```

### Wallet Referral - Sistema de Afiliados

```bash
# Obter link de afiliado
curl -X GET https://wallet-referral.trade.avalonbroker.com/v1/referral-link \
  -H "Authorization: Bearer {SSID}"

# Response
{
  "referral_code": "AVL-123456",
  "link": "https://avalonbroker.com/?ref=AVL-123456",
  "commission_rate": 0.25,
  "total_earned": 250.00
}

# Estatísticas
curl -X GET https://wallet-referral.trade.avalonbroker.com/v1/stats \
  -H "Authorization: Bearer {SSID}"

# Response
{
  "total_referrals": 15,
  "active_referrals": 8,
  "total_commission": 250.00
}
```

### Chat API - Suporte Integrado

```bash
# Iniciar conversa
curl -X POST https://chat.trade.avalonbroker.com/v1/conversations \
  -H "Authorization: Bearer {SSID}" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Problema com saque",
    "message": "Meu saque está pendente"
  }'

# Enviar mensagem
curl -X POST https://chat.trade.avalonbroker.com/v1/conversations/{id}/messages \
  -H "Authorization: Bearer {SSID}" \
  -d '{"message": "Alguma atualização?"}'
```

### Notification WebSocket - Push Alerts

```javascript
const notifWs = new WebSocket('wss://notification.trade.avalonbroker.com:443/echo/websocket');

notifWs.onopen = () => {
  notifWs.send(JSON.stringify({ name: 'ssid', msg: ssid }));

  notifWs.send(JSON.stringify({
    name: 'subscribeMessage',
    msg: {
      name: 'user-notification',
      params: { routingFilters: { user_id: 183588600 } }
    }
  }));
};

notifWs.onmessage = (event) => {
  const { name, msg } = JSON.parse(event.data);

  if (name === 'user-notification') {
    console.log('🔔', msg.title);
    console.log('📝', msg.body);
  }
};
```

### Features API - Feature Flags

```bash
curl -X GET https://features.trade.avalonbroker.com/v1/available \
  -H "Authorization: Bearer {SSID}"

# Response
{
  "features": {
    "blitz_options": true,
    "digital_options": true,
    "copy_trading": false,
    "tournaments": true
  }
}
```

---

## 💻 Exemplos Práticos

### Exemplo 1: Bot Completo com SDK

```typescript
import { QuadcodeClientSdk, SsidAuthMethod, TurboOptionsDirection } from '@quadcode-tech/client-sdk-js';

class TradingBot {
  private sdk: QuadcodeClientSdk;
  private isRunning = false;

  async connect() {
    const ssid = await this.createSession();
    this.sdk = await QuadcodeClientSdk.create(
      'wss://ws.trade.avalonbroker.com/echo/websocket',
      82,
      new SsidAuthMethod(ssid)
    );

    this.setupListeners();
    console.log('✅ Bot connected');
  }

  private async createSession(): Promise<string> {
    const res = await fetch('http://api-qc.avalonbots.com:3000/session/183588600', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer dfc29735b5450651d5c03f4fb6508ed9' }
    });
    return (await res.json()).ssid;
  }

  private setupListeners() {
    const turboApi = this.sdk.turboOptions();

    turboApi.subscribeOnClose((result) => {
      console.log(`💰 ${result.win} - $${result.profit_amount}`);

      // Martingale simples
      if (result.win === 'loose' && this.isRunning) {
        this.trade('EURUSD', 'call', result.price * 2);
      }
    });

    const quotesApi = this.sdk.quotes();
    quotesApi.subscribeOnQuote('EURUSD', (q) => console.log('📊', q.value));
  }

  async trade(asset: string, direction: 'call' | 'put', amount: number) {
    const turboApi = this.sdk.turboOptions();

    const order = await turboApi.buy({
      instrument_id: asset,
      direction: direction === 'call' ? TurboOptionsDirection.CALL : TurboOptionsDirection.PUT,
      price: amount,
      expired: Math.floor(Date.now() / 1000) + 60
    });

    console.log('✅ Order:', order.id);
  }

  start() {
    this.isRunning = true;
    setInterval(() => {
      if (this.isRunning) {
        const dir = Math.random() > 0.5 ? 'call' : 'put';
        this.trade('EURUSD', dir, 10);
      }
    }, 120000); // A cada 2min
  }

  stop() { this.isRunning = false; }
}

// Run
const bot = new TradingBot();
await bot.connect();
bot.start();
```

### Exemplo 2: Financial Dashboard

```typescript
async function getFinancialReport(ssid: string) {
  // Balances
  const balRes = await fetch('https://billing.trade.avalonbroker.com/v1/balances', {
    headers: { 'Authorization': `Bearer ${ssid}` }
  });
  const { balances } = await balRes.json();

  // Transactions
  const from = new Date();
  from.setDate(1);
  const to = new Date();

  const txRes = await fetch(
    `https://billing.trade.avalonbroker.com/v1/transactions?from=${from.toISOString()}&to=${to.toISOString()}`,
    { headers: { 'Authorization': `Bearer ${ssid}` } }
  );
  const { transactions } = await txRes.json();

  // Calcular
  const deposits = transactions.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0);
  const withdrawals = transactions.filter(t => t.type === 'withdrawal').reduce((s, t) => s + t.amount, 0);
  const profit = transactions.filter(t => t.type === 'trade_win').reduce((s, t) => s + t.amount, 0);
  const loss = transactions.filter(t => t.type === 'trade_loss').reduce((s, t) => s + Math.abs(t.amount), 0);

  console.log('📊 Financial Report');
  console.log(`Balance: $${balances[0].amount}`);
  console.log(`Deposits: $${deposits}`);
  console.log(`Profit: $${profit}`);
  console.log(`Loss: $${loss}`);
  console.log(`Net: $${profit - loss}`);
  console.log(`ROI: ${((profit - loss) / deposits * 100).toFixed(2)}%`);
}
```

---

## ❌ Error Handling

### Códigos de Erro Comuns

| Código | Causa | Solução |
|--------|-------|---------|
| `insufficient_balance` | Saldo < valor | Verificar balance antes |
| `market_closed` | Mercado fechado | Verificar `is_suspended` |
| `invalid_amount` | Valor fora dos limites | Checar min/max |
| `expired_session` | SSID expirou | Criar novo SSID |
| `rate_limit` | Muitas requests | Aguardar e reduzir frequência |

### Implementação

```typescript
try {
  const order = await turboApi.buy({ ... });

  if (order.status === 'error') {
    switch (order.code) {
      case 'insufficient_balance':
        console.error('❌ Saldo insuficiente');
        break;
      case 'market_closed':
        console.error('❌ Mercado fechado');
        break;
      default:
        console.error('❌', order.message);
    }
  }
} catch (error) {
  console.error('❌ Erro de rede:', error);
  await sdk.reconnect();
}
```

---

## ✅ Best Practices

### 1. Use o SDK Oficial

```typescript
// ✅ BOM - SDK oficial
import { QuadcodeClientSdk } from '@quadcode-tech/client-sdk-js';
const sdk = await QuadcodeClientSdk.create(...);

// ❌ EVITAR - WebSocket manual
const ws = new WebSocket('wss://...');
```

**Vantagens do SDK**:
- Reconnection automático
- Heartbeat integrado
- Type safety
- Error handling robusto
- Mantido pela Quadcode

### 2. Reutilize SSID

```typescript
// ✅ BOM - Um SSID por 24h
const ssid = await createSession();
const sdk = await QuadcodeClientSdk.create(..., new SsidAuthMethod(ssid));

// Use por 24h
for (let i = 0; i < 1000; i++) {
  await sdk.turboOptions().buy(...);
}

// ❌ RUIM - Criar SSID toda hora
for (let i = 0; i < 1000; i++) {
  const ssid = await createSession(); // Rate limit!
  await sdk.turboOptions().buy(...);
}
```

### 3. Valide Antes de Enviar

```typescript
function validateOrder(order: any) {
  if (order.price < 1 || order.price > 1000) {
    throw new Error('Price must be $1-$1000');
  }
  if (order.expired <= Date.now() / 1000) {
    throw new Error('Expired must be future');
  }
  if (!['call', 'put'].includes(order.direction)) {
    throw new Error('Invalid direction');
  }
}
```

### 4. Implemente Retry Logic

```typescript
async function buyWithRetry(sdk: QuadcodeClientSdk, params: any, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await sdk.turboOptions().buy(params);
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      const delay = 1000 * Math.pow(2, i);
      console.log(`⏳ Retry in ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}
```

### 5. Use TypeScript

```typescript
// ✅ Type safety
import { TurboOptionsDirection } from '@quadcode-tech/client-sdk-js';

const order = await turboApi.buy({
  instrument_id: 'EURUSD',
  direction: TurboOptionsDirection.CALL, // Autocomplete + validation
  price: 10,
  expired: 1234567890
});

// ❌ Propenso a erros
const order = await turboApi.buy({
  instrument_id: 'EURUSD',
  direction: 'CALL', // Typo? Compilador não pega
  price: 10,
  expired: 1234567890
});
```

---

## 🔍 Troubleshooting

### Problema: SDK não conecta

**Sintomas**: `QuadcodeClientSdk.create()` timeout

**Soluções**:
```typescript
// 1. Verificar SSID
const ssid = await createSession();
console.log('SSID:', ssid); // Deve ter 32 caracteres

// 2. Testar WebSocket manual
const ws = new WebSocket('wss://ws.trade.avalonbroker.com/echo/websocket');
ws.onopen = () => console.log('✅ WS OK');
ws.onerror = (e) => console.error('❌ WS Error:', e);

// 3. Verificar firewall/proxy
```

### Problema: Ordem não executa

**Sintomas**: `buy()` não retorna erro mas ordem não aparece

**Debug**:
```typescript
const turboApi = sdk.turboOptions();

// Subscribe antes de comprar
turboApi.subscribeOnClose((result) => {
  console.log('✅ Order closed:', result.id);
});

// Comprar com timeout
const orderPromise = turboApi.buy({ ... });
const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject('Timeout'), 10000)
);

try {
  const order = await Promise.race([orderPromise, timeoutPromise]);
  console.log('Order ID:', order.id);
} catch (error) {
  console.error('❌', error);
}
```

### Problema: Balance não atualiza

**Sintomas**: SDK mostra balance antigo

**Solução**:
```typescript
const balancesApi = sdk.balances();
const balance = await balancesApi.getBalanceById(123456);

// Force refresh
balance.refresh(); // Força nova query

// Ou subscribe
balance.subscribeOnUpdate((updated) => {
  console.log('New balance:', updated.amount);
});
```

---

## 📚 Referências Rápidas

### Active IDs Comuns

| ID | Nome | Tipo |
|----|------|------|
| 1 | EURUSD | Forex |
| 2 | GBPUSD | Forex |
| 76 | BTCUSD | Crypto |
| 77 | ETHUSD | Crypto |
| 100 | XAUUSD | Gold |
| 200 | SPX500 | Index |

### Timeframes (segundos)

| Value | Label | Tipo |
|-------|-------|------|
| 15 | 15s | Blitz |
| 60 | 1min | Turbo |
| 120 | 2min | Turbo |
| 300 | 5min | Binary |
| 3600 | 1h | Binary |

### Balance Types

| ID | Tipo |
|----|------|
| 1 | Real |
| 4 | Demo |

---

## 🎓 Conceitos-Chave

### SSID vs OAuth
- **SSID**: Para bots/scripts. Válido 24h. Simples.
- **OAuth**: Para web apps. Tokens refresh. Complexo mas seguro.

### Turbo vs Digital
- **Turbo**: Payout fixo (85%). Simples.
- **Digital**: Payout variável. Tem strike price. Mais avançado.

### Win/Loose/Equal
- **WIN**: Acertou a direção → Lucro
- **LOOSE**: Errou a direção → Prejuízo
- **EQUAL**: Preço igual → Reembolso

---


## 📖 Links Úteis

- **SDK npm**: https://www.npmjs.com/package/@quadcode-tech/client-sdk-js
- **SDK GitHub**: https://github.com/quadcode/client-sdk-js
- **Quadcode**: https://quadcode.com
- **Avalon Broker**: https://trade.avalonbroker.com

---

**FIM DA DOCUMENTAÇÃO**

*Versão: 2.0.0*
*Data: 2025-10-06*
*Baseado em: @quadcode-tech/client-sdk-js v1.3.9 + Avalon Broker APIs*

⚠️ **AVISO**: Sempre use o SDK oficial. Teste em conta DEMO antes de real.

💡 **RECOMENDAÇÃO**: SDK > WebSocket manual. SDK tem reconnection, heartbeat, types, e error handling integrados.
