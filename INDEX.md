# Mivra Fintech - Project Index

## 📊 Project Overview

**Mivra Fintech** é uma plataforma completa de trading automatizado com análise de mercado em tempo real, construída com **Node.js/Express** (backend) e **React/TypeScript** (frontend).

**Versão Atual:** 1.0.0
**Status:** 🟢 Em Produção
**Última Atualização:** 2025-10-16

---

## 🏗️ Arquitetura do Projeto

```
mivra-fintech/
├── apps/
│   ├── backend/                 # Node.js + Express API
│   │   ├── src/
│   │   │   ├── api-server.mjs    # Main server (Socket.io, REST API)
│   │   │   ├── bot/
│   │   │   │   ├── bot-live.mjs  # Trading bot core logic
│   │   │   │   ├── constants.mjs # Shared constants
│   │   │   │   └── strategies/   # Trading strategies
│   │   │   ├── services/         # Business logic
│   │   │   ├── admin/            # Admin dashboard logic
│   │   │   └── crm/              # CRM integration
│   │   └── package.json
│   │
│   ├── frontend/                # React + Vite + TailwindCSS
│   │   ├── src/
│   │   │   ├── pages/           # Main pages
│   │   │   │   ├── Operations.tsx    # Bot trading interface
│   │   │   │   ├── History.tsx       # Trade history
│   │   │   │   ├── MarketScanner.tsx # Asset scanner
│   │   │   ├── features/        # Feature modules
│   │   │   ├── shared/          # Shared components/hooks
│   │   │   └── main.tsx
│   │   └── package.json
│   │
│   ├── admin-frontend/          # Admin dashboard (React)
│   └── admin-backend/           # Admin API endpoints
│
└── package.json
```

---

## 🚀 Features Principais

### 1. **Bot de Trading Automatizado**
- ✅ Modo AUTO: Bot escolhe ativos automaticamente
- ✅ Modo MANUAL: Usuário controla ativo específico
- ✅ Múltiplas estratégias: Conservative, Balanced, Aggressive
- ✅ Sistema HOLD: Bloqueia ativos após 2 perdas consecutivas por 5 minutos
- ✅ Timeframe dinâmico baseado em confiança do sinal

**Status Dinâmico:**
- "Starting bot..."
- "Analyzing markets..."
- "Opening position on [ASSET]..."
- "Tracking results..."
- "Position closed - ✅ WIN / ❌ LOSS"
- "Bot Stopped" (quando para)

### 2. **Market Scanner em Tempo Real**
- Análise de 140+ ativos (Forex, Cripto, Ações, Índices, Commodities)
- Indicadores técnicos: RSI, MACD, Bollinger Bands
- Heatmap visual com cores (Verde=Call, Vermelho=Put)
- Filtros por categoria e força do sinal

### 3. **Real-time Updates**
- WebSocket (Socket.io) para atualizações instantâneas
- Supabase real-time subscriptions para sincronização
- P&L Evolution chart atualiza ao vivo
- Trade History sincroniza automaticamente

### 4. **Dashboard & Métricas**
- Win Rate em tempo real
- Total de trades e lucro/prejuízo
- Gráfico de evolução de lucro (P&L)
- Histórico detalhado de operações

---

## 🔧 Tecnologias

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **WebSocket:** Socket.io
- **Database:** Supabase (PostgreSQL)
- **Broker API:** Avalon Broker SDK (WebSocket)
- **Indicators:** Custom RSI, MACD, Bollinger Bands

### Frontend
- **Framework:** React 18 + TypeScript
- **Build:** Vite
- **UI:** Shadcn/ui + TailwindCSS
- **Real-time:** Socket.io client + Supabase client
- **Charts:** Recharts
- **Icons:** Lucide React

---

## 📝 Principais Arquivos Backend

| Arquivo | Descrição |
|---------|-----------|
| `api-server.mjs` | Servidor principal, Socket.io, REST API endpoints |
| `bot/bot-live.mjs` | Motor do bot, lógica de trading |
| `bot/constants.mjs` | Constantes compartilhadas (estratégias, timeframes) |
| `bot/bot-websocket.mjs` | WebSocket para eventos do bot |
| `services/avalon-auth.mjs` | Autenticação com Avalon Broker |
| `services/ssid-manager.mjs` | Gerenciamento de SSID do usuário |
| `admin/health.mjs` | Health checks |
| `crm/crm.module.mjs` | Integração CRM |

---

## 📱 Principais Páginas Frontend

| Página | Arquivo | Descrição |
|--------|---------|-----------|
| Operations | `Operations.tsx` | Interface principal do bot (auto/manual mode) |
| History | `History.tsx` | Histórico de trades do dia |
| Market Scanner | `MarketScanner.tsx` | Análise de ativos com heatmap |
| Settings | `Settings.tsx` | Configurações de broker e preferências |
| Admin | `AdminLayout.tsx` | Dashboard administrativo |

---

## 🔄 Recent Updates (Última Semana)

### Session 1: Bot Core Fixes
- ✅ Fixado HOLD system com logging detalhado
- ✅ Implementado status dinâmico do bot
- ✅ Mudado preferência de timeframe para 10s
- ✅ Adicionado auto-refresh em tempo real

**Commit:** `4a87132` - "fix: resolve all frontend build errors and implement dark mode"

### Session 2: Real-time Updates & JSON Parsing (Current)
- ✅ Implementado robust JSON parsing (`extractJsonFromOutput()`)
- ✅ Fixado "Bot Stopped" status com "None" asset
- ✅ Removido asset name redundante de "Tracking Results"
- ✅ Trades e P&L agora atualizam automaticamente

**Commit:** `34d88ee` - "fix: improve bot status display and real-time updates"

---

## 🛠️ Como Usar

### Backend Setup
```bash
cd apps/backend
npm install
npm run dev
```

### Frontend Setup
```bash
cd apps/frontend
npm install
npm run dev
```

### Variáveis de Ambiente (.env)
```
SUPABASE_URL=https://vecofrvxrepogtigmeyj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_key_here
STRATEGY=balanced
```

---

## 📊 Database Schema

### Main Tables
- `profiles` - Dados do usuário
- `bot_status` - Status atual do bot por usuário
- `bot_control` - Comandos de controle do bot
- `trade_history` - Histórico de trades
- `bot_logs` - Logs do bot para debug

---

## 🐛 Known Issues & Fixes

### ✅ RESOLVIDO: JSON Parsing Errors
**Problema:** "Unexpected non-whitespace character after JSON at position 108"
**Causa:** `lastIndexOf('}')` pegava brace errada em output multi-linha
**Solução:** Implementado `extractJsonFromOutput()` que conta chaves abertas/fechadas

### ✅ RESOLVIDO: Status não atualiza dinamicamente
**Problema:** Bot Status sempre mostrava "Running..."
**Solução:** Implementado máquina de estados e Socket.io broadcasting

### ✅ RESOLVIDO: Dados não atualizam em tempo real
**Problema:** Trade History e P&L não refrescavam automaticamente
**Solução:** Adicionado `position:closed` event e auto-refresh via Socket.io

---

## 🎯 Roadmap

### Próximas Features
- [ ] Suporte para múltiplos brokers
- [ ] Backtesting de estratégias
- [ ] Análise de performance com gráficos avançados
- [ ] Notificações (email, SMS, push)
- [ ] Exportação de trades em PDF/CSV
- [ ] API pública para integrações

### Performance Improvements
- [ ] Cache de ativos
- [ ] Otimização de queries
- [ ] Rate limiting para API
- [ ] Worker threads para processamento pesado

---

## 📚 Documentação Adicional

- **Trading Strategies:** `/docs/strategies.md`
- **API Reference:** `/docs/api.md`
- **Socket.io Events:** `/docs/websocket.md`
- **Database:** `/docs/database.md`

---

## 👤 Desenvolvedor

**Claude Code** - IA Assistant by Anthropic
Última sessão: 2025-10-16

## 📞 Support

Para issues ou dúvidas:
- GitHub Issues: https://github.com/criestefani/mivra-fintech/issues
- Verificar logs: `apps/backend/src/logs/`

---

**Made with ❤️ by MivraTech**
