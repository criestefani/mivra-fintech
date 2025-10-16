# ✅ Market Scanner - Sistema Completo e Funcional

## 🎯 Status: PRONTO PARA USO

Todas as correções foram implementadas e o Market Scanner está completamente funcional!

---

## 🔧 O Que Foi Corrigido

### 1. **Asset IDs Atualizados** ✅
- **Arquivo:** `apps/backend/src/constants/fixed-assets.mjs`
- **Mudanças:**
  - Atualizado de 56 assets para **141 assets oficiais**
  - IDs agora correspondem aos valores de `docs/IDs-Definitivo.txt`
  - Adicionadas funções ausentes: `getAvailableAssets()` e `getAssetName()`
  - Incluídos todos os pares OTC, cripto, ações, índices, commodities e pares derivativos

### 2. **Endpoint `/api/scanner/top20` Criado** ✅
- **Arquivo:** `apps/backend/src/api-server.mjs` (linha 587-612)
- **Funcionalidade:**
  - Retorna top 20 ativos por `win_rate` da tabela `scanner_performance`
  - Formato de resposta compatível com frontend
  - Ordenação por taxa de vitória (descendente)

### 3. **Variáveis de Ambiente Corrigidas** ✅
- **Arquivo:** `apps/backend/src/bot/market-scanner.mjs`
- **Mudanças:**
  - Adicionado carregamento de `.env` via `dotenv`
  - SSID Manager agora inicializa automaticamente
  - Conexão Avalon via SDK configurada corretamente

### 4. **Script de Startup Criado** ✅
- **Arquivo:** `apps/backend/start-market-scanner.mjs`
- **Funcionalidade:**
  - Inicia market-scanner.mjs como processo standalone
  - Auto-restart em caso de falha inesperada
  - Logging detalhado de eventos
  - Gerenciamento de sinais (SIGTERM, SIGINT)

### 5. **Scripts NPM Adicionados** ✅
- **Arquivo:** `apps/backend/package.json`
- **Novos comandos:**
  ```json
  {
    "server": "node src/api-server.mjs",
    "scanner": "node start-market-scanner.mjs",
    "dev": "concurrently \"npm run server\" \"npm run scanner\"",
    "start:all": "npm run dev"
  }
  ```

---

## 🚀 Como Executar

### Opção 1: Executar Tudo de Uma Vez (Recomendado)
```bash
cd I:\Mivra Fintech\apps\backend
npm run dev
```
Isso inicia **simultaneamente**:
- API Server (porta 4001)
- Market Scanner (análise em tempo real)

### Opção 2: Executar Separadamente

**Terminal 1 - API Server:**
```bash
cd I:\Mivra Fintech\apps\backend
npm run server
```

**Terminal 2 - Market Scanner:**
```bash
cd I:\Mivra Fintech\apps\backend
npm run scanner
```

### Opção 3: Executar Frontend
```bash
cd I:\Mivra Fintech\apps\frontend
npm run dev
```

---

## 📊 Fluxo de Dados Completo

```
Market Scanner (backend)
  ↓
Conecta ao Avalon WebSocket (SSID automático)
  ↓
Analisa 141 ativos × 5 timeframes = 705 combinações
  ↓
Aplica Estratégia Híbrida Agressiva (4 conselheiros)
  ↓
Salva sinais na tabela 'strategy_trades' (Supabase)
  ↓
Trigger automático atualiza 'scanner_performance' (agregação)
  ↓
Frontend subscreve via Supabase Realtime
  ↓
Chama GET /api/scanner/top20 para dados
  ↓
Exibe Heatmap em tempo real
```

---

## 🗄️ Estrutura do Banco de Dados

### Tabela: `strategy_trades`
- **Propósito:** Armazena cada sinal gerado pelo scanner
- **TTL:** 30 minutos (auto-limpeza)
- **Campos principais:**
  - `active_id`: ID do ativo
  - `ativo_nome`: Nome do ativo
  - `timeframe`: Período (10, 30, 60, 180, 300 segundos)
  - `signal_direction`: CALL ou PUT
  - `signal_price`: Preço de entrada
  - `result`: PENDING, WIN, LOSS
  - `confidence`: Confiança da estratégia (%)
  - `advisor_scores`: JSON com scores dos 4 conselheiros

### Tabela/View: `scanner_performance`
- **Propósito:** Agregação de performance dos últimos 30 minutos
- **Atualização:** Automática via trigger
- **Campos principais:**
  - `active_id`: ID do ativo
  - `ativo_nome`: Nome do ativo
  - `timeframe`: Período
  - `total_signals`: Total de sinais gerados
  - `total_wins`: Total de acertos
  - `total_losses`: Total de perdas
  - `win_rate`: Taxa de vitória (%)
  - `last_updated`: Timestamp última atualização

---

## 🎨 Frontend - Market Scanner Page

### Localização
- **Arquivo:** `apps/frontend/src/pages/MarketScanner.tsx`

### Funcionalidades
- ✅ Heatmap interativo com cards de ativos
- ✅ Real-time updates via Supabase subscriptions
- ✅ Filtros por timeframe, estratégia, win rate
- ✅ Botão de refresh manual
- ✅ Contador de ativos ativos
- ✅ Click em card navega para Operations com config pré-setada
- ✅ Timestamp de última atualização

### Hook de Subscrição
- **Arquivo:** `apps/frontend/src/features/market-scanner/hooks/useScannerSubscription.ts`
- Subscreve automaticamente a mudanças em `scanner_performance`
- Chama `/api/scanner/top20` para buscar dados
- Atualiza interface em tempo real

---

## 🔑 Variáveis de Ambiente Necessárias

### `apps/backend/.env`
```env
# Supabase
SUPABASE_URL="https://vecofrvxrepogtigmeyj.supabase.co"
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Avalon
AVALON_API_KEY="dfc29735b5450651d5c03f4fb6508ed9"
AVALON_SYSTEM_USER_ID="183588600"
AVALON_WS_URL="wss://ws.trade.avalonbroker.com/echo/websocket"
AVALON_API_HOST="https://trade.avalonbroker.com"
```

### `apps/frontend/.env`
```env
VITE_API_URL="http://localhost:4001"
VITE_SUPABASE_URL="https://vecofrvxrepogtigmeyj.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 📡 Endpoints da API

### Market Scanner Endpoints
```
GET /api/scanner/top20
  - Retorna top 20 asset/timeframe combinations por win rate
  - Response: { success: true, data: [...], timestamp, count }

GET /api/market-scanner
  - Retorna últimos 20 sinais da tabela strategy_trades
  - Response: [{ active_id, signal_direction, confidence, ... }]

GET /api/strategy-performance
  - Retorna últimos 10 registros de scanner_performance
  - Response: [{ active_id, ativo_nome, win_rate, ... }]
```

### Outros Endpoints
```
GET /api/assets
  - Retorna todos os 141 ativos organizados por categoria

GET /api/bot/status
  - Status do bot e conexões

POST /api/bot/connect
  - Conectar ao broker Avalon

GET /api/bot/balance
  - Saldo da conta
```

---

## 🧪 Testando o Sistema

### 1. Verificar Backend Rodando
```bash
curl http://localhost:4001/health
```
**Resposta esperada:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-15T...",
  "uptime": 123.45,
  "connections": {
    "avalon": "connected",
    "supabase": "connected"
  }
}
```

### 2. Testar Endpoint do Scanner
```bash
curl http://localhost:4001/api/scanner/top20
```
**Resposta esperada:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "active_id": "2278",
      "ativo_nome": "ONYXCOIN/USD OTC",
      "timeframe": 300,
      "win_rate": 100.00,
      "total_signals": 21,
      "total_wins": 21,
      "total_losses": 0
    },
    ...
  ],
  "timestamp": "2025-10-15T...",
  "count": 20
}
```

### 3. Verificar Real-Time Updates
- Abra `http://localhost:5173/market-scanner`
- Você deve ver:
  - Cards de ativos com performance
  - Atualização automática quando novos sinais chegam
  - Timestamp de última atualização
  - Contador de ativos

### 4. Verificar Supabase Diretamente
```bash
# Ver últimos sinais
curl -X GET "https://vecofrvxrepogtigmeyj.supabase.co/rest/v1/strategy_trades?limit=5&order=signal_timestamp.desc" \
  -H "apikey: YOUR_ANON_KEY"

# Ver performance agregada
curl -X GET "https://vecofrvxrepogtigmeyj.supabase.co/rest/v1/scanner_performance?limit=5&order=win_rate.desc" \
  -H "apikey: YOUR_ANON_KEY"
```

---

## ⚙️ Estratégia Híbrida Agressiva

### 4 Conselheiros (Advisors)

#### 1. Pattern Counter (40% peso)
- Analisa últimas 3 velas
- Detecta padrões de reversão
- Confiança: 55-80%

#### 2. Moving Average (30% peso)
- Compara preço com SMA20
- Estratégia de reversão à média
- Confiança: 50-85%

#### 3. Gap Hunter (20% peso)
- Detecta gaps entre velas
- Expectativa de fechamento de gap
- Confiança: 50-90%

#### 4. Level Analyst (10% peso)
- Identifica suporte/resistência
- Usa máximas/mínimas recentes
- Confiança: 55-80%

### Características
- **SEMPRE retorna um sinal** (nunca espera condições perfeitas)
- Combina scores ponderados: CALL > PUT determina direção
- Confiança final = max(callScore, putScore)
- Tolerante a erros: retorna CALL padrão se falhar

---

## 📈 Parâmetros de Configuração

### Market Scanner
```javascript
const TIMEFRAMES = [10, 30, 60, 180, 300]; // 10s, 30s, 1min, 3min, 5min
const SCAN_INTERVAL = 10000; // Scan a cada 10 segundos
const CANDLES_COUNT = 50; // 50 velas para análise
```

### Strategy Trades TTL
```sql
-- Auto-limpeza após 30 minutos
DELETE FROM strategy_trades
WHERE signal_timestamp < NOW() - INTERVAL '30 minutes';
```

---

## 🐛 Troubleshooting

### Market Scanner não inicia
**Problema:** `Error: System SSID not available`
**Solução:** Verifique que as credenciais Avalon estão corretas no `.env`

### Frontend não recebe dados
**Problema:** API retorna 404 em `/api/scanner/top20`
**Solução:** Reinicie o servidor backend: `npm run server`

### Sem dados em scanner_performance
**Problema:** Tabela vazia
**Solução:**
1. Verifique se market scanner está rodando
2. Aguarde pelo menos 10 segundos (um ciclo de scan)
3. Verifique se trigger está ativo no Supabase

### Real-time não funciona
**Problema:** Frontend não atualiza automaticamente
**Solução:**
1. Verifique se Supabase Realtime está habilitado para `scanner_performance`
2. No Supabase Dashboard → Database → Replication → Enable para a tabela
3. Reinicie o frontend

---

## 🎯 Próximos Passos Opcionais

### Melhorias Futuras
1. **PM2 para produção:**
   ```bash
   npm install -g pm2
   pm2 start start-market-scanner.mjs --name market-scanner
   pm2 start src/api-server.mjs --name api-server
   pm2 save
   pm2 startup
   ```

2. **Adicionar mais estratégias:**
   - Criar `strategy-conservative.mjs`
   - Criar `strategy-balanced.mjs`
   - Permitir seleção no frontend

3. **Notificações push:**
   - Alertar quando win_rate > 80%
   - Integrar com Telegram/Discord

4. **Backtesting:**
   - Testar estratégias com dados históricos
   - Comparar performance

---

## ✅ Checklist Final

- [x] 141 assets carregados corretamente
- [x] Market scanner conecta ao Avalon
- [x] Dados salvos em strategy_trades
- [x] Trigger atualiza scanner_performance
- [x] Endpoint `/api/scanner/top20` funcionando
- [x] Frontend recebe dados via API
- [x] Real-time subscriptions funcionando
- [x] Heatmap exibe performance
- [x] Filtros e navegação funcionam
- [x] Scripts de startup criados

---

## 📞 Suporte

Se encontrar algum problema:
1. Verifique os logs do backend e scanner
2. Confirme que todas as variáveis de ambiente estão setadas
3. Teste os endpoints da API manualmente
4. Verifique o Supabase Dashboard para dados

---

## 🎉 Conclusão

O Market Scanner está **100% operacional** e pronto para uso!

**Para iniciar tudo:**
```bash
cd I:\Mivra Fintech\apps\backend
npm run dev
```

**Acesse:**
- Backend: http://localhost:4001
- Frontend: http://localhost:5173/market-scanner

**Documentação completa em:**
- `docs/overview/🗄️ Database Schema 2883aa47f99181a59d62cecc59335ba9.md`
- `docs/overview/⚙️ Backend API - Express Server 2883aa47f991813bb144f5bb5d4b5f79.md`

---

*Gerado em: 2025-10-15*
*Versão: 1.0.0*
*Status: ✅ Produção Ready*
