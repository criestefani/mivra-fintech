# 📋 Admin Dashboard - Documentação Completa

**Versão:** 1.0

**Data:** 14/10/2025

**Status:** ✅ Implementado

**Foco:** Contas REAIS (Demo secundário)

---

## 🎯 Visão Geral

O **Admin Dashboard** é uma área administrativa completa do MivraTech que permite monitorar, gerenciar e analisar todos os aspectos da plataforma de trading. Focado principalmente em contas REAIS, oferece insights profundos sobre usuários, trades, performance e métricas financeiras.

### ✨ Principais Características

- **Dashboard Principal**: Métricas em tempo real com foco em contas reais
- **Gerenciamento de Usuários**: Lista, detalhes e histórico completo de todos os usuários
- **Análise de Trades**: Histórico completo de operações com filtros avançados
- **Analytics Avançados**: Gráficos de receita, crescimento e performance
- **Monitoramento**: Status de bots, sessões ativas e alertas
- **Configurações**: Gestão de limites, alertas e configurações da plataforma

---

## 🏗️ Arquitetura do Sistema

### Frontend (React + TypeScript)

```
src/features/admin/
├── components/          # Componentes React das páginas
│   ├── AdminDashboard.tsx
│   ├── AdminUsers.tsx
│   ├── AdminTrades.tsx
│   ├── AdminAnalytics.tsx
│   ├── AdminMonitoring.tsx
│   └── AdminSettings.tsx
├── hooks/               # Hooks customizados
│   ├── useAdminAuth.ts
│   └── useAdminData.ts
├── services/            # Serviços de API
│   └── admin-api.service.ts
├── types/              # TypeScript interfaces
│   └── admin.types.ts
└── layout/             # Layout e navegação
    ├── AdminLayout.tsx
    └── AdminProtectedRoute.tsx
```

### Sistema de Autenticação

- **Tabela**: `admin_users` no Supabase
- **RPC**: `check_admin_email()` para bypass do RLS durante login
- **Roles**: `super_admin`, `admin`, `support`, `analyst`
- **Proteção**: Rotas protegidas com verificação de permissões

---

## 📊 Páginas e Funcionalidades

### 🏠 Dashboard Principal

**Arquivo**: `AdminDashboard.tsx`

**Métricas Principais (REAL focus)**:

- **Usuários**: Total, ativos hoje, novos na semana, churn rate
- **Trading**: Trades hoje, win rate, volume, bots ativos
- **Financeiro**: Depósitos, saques, receita líquida
- **Conversão**: Taxa demo → real, tempo médio para converter

**Componentes Visuais**:

- Cards de métricas com variação percentual
- Lista dos top usuários por performance
- Gráficos de receita e crescimento (últimos 30 dias)

### 👥 Gerenciamento de Usuários

**Arquivo**: `AdminUsers.tsx`

**Funcionalidades**:

- **Lista Paginada**: Todos os usuários com filtros
- **Filtros**: Por tipo de conta, status ativo, busca por email
- **Informações**: Email, trades totais, win rate, P&L total, status do bot
- **Badges**: Status visual para contas ativas/inativas e bots rodando

**Dados Exibidos**:

- Email do usuário com badge de status
- Total de trades realizados
- Win rate percentual
- P&L total (colorido: verde para positivo, vermelho para negativo)
- Status do bot (1 para ativo, 0 para inativo)

### 📈 Análise de Trades

**Arquivo**: `AdminTrades.tsx`

**Funcionalidades**:

- **Lista Completa**: Histórico de todos os trades (REAL focus)
- **Filtros Avançados**: Por usuário, ativo, data, resultado
- **Busca**: Por email do usuário ou nome do ativo
- **Estatísticas**: Resumo de trades winning/losing, investimento médio

**Dados por Trade**:

- Ativo negociado
- Valor do investimento
- Duração da operação
- P&L (Profit/Loss) com cores
- Data/hora de abertura

### 📊 Analytics Avançados

**Arquivo**: `AdminAnalytics.tsx`

**Gráficos e Relatórios**:

- **Receita**: Depósitos, saques e receita líquida (30 dias)
- **Crescimento**: Novos usuários por dia
- **Top Usuários**: Por P&L e por volume negociado
- **Performance de Ativos**: Win rate por ativo

### 🔍 Monitoramento

**Arquivo**: `AdminMonitoring.tsx`

**Recursos**:

- **Sessões Ativas**: Usuários conectados em tempo real
- **Status de Bots**: Bots rodando e seus status
- **Alertas**: Notificações de problemas ou eventos importantes
- **Logs**: Histórico de atividades críticas

### ⚙️ Configurações

**Arquivo**: `AdminSettings.tsx`

**Configurações Disponíveis**:

- **Plataforma**: Modo manutenção, limites por usuário
- **Trading**: Stop automático, limites de drawdown
- **Alertas**: Email e webhooks para eventos críticos
- **Segurança**: 2FA obrigatório, IPs permitidos, auto-logout

---

## 🗄️ Schema do Banco de Dados

### Tabelas Principais

### `admin_users` (Controle de Acesso)

```sql
id                UUID PRIMARY KEY
email             TEXT UNIQUE
full_name         TEXT
role              TEXT -- 'super_admin'|'admin'|'support'|'analyst'
is_active         BOOLEAN DEFAULT true
avatar_url        TEXT
created_at        TIMESTAMPTZ DEFAULT NOW()
updated_at        TIMESTAMPTZ DEFAULT NOW()
last_login_at     TIMESTAMPTZ
```

### `trade_history` (⭐ Campo Novo: account_type)

```sql
id                  BIGINT PRIMARY KEY
external_id         BIGINT
user_id             UUID REFERENCES auth.users(id)
type                TEXT
active_id           INTEGER
direction           TEXT (call|put)
valor               DOUBLE PRECISION
profit_esperado     DOUBLE PRECISION
pnl                 DOUBLE PRECISION
status              TEXT
resultado           TEXT (WIN|LOSS|TIE)
ativo_nome          TEXT
data_abertura       TIMESTAMPTZ
data_expiracao      TIMESTAMPTZ
expiration_seconds  INTEGER
strategy_id         VARCHAR
created_at          TIMESTAMPTZ
account_type        TEXT  -- ⭐ NOVO: 'real'|'demo'
```

### `bot_status` (Status dos Bots)

```sql
id                          UUID PRIMARY KEY
user_id                     UUID REFERENCES auth.users(id)
is_connected                BOOLEAN
broker_balance              NUMERIC
account_type                TEXT (demo|real)
bot_running                 BOOLEAN
bot_pid                     INTEGER
ssid                        TEXT
avalon_ssid                 TEXT
avalon_user_id              INTEGER
avalon_username             TEXT
avalon_password_encrypted   TEXT
avalon_credentials_valid    BOOLEAN
avalon_last_login           TIMESTAMPTZ
ssid_expires_at             TIMESTAMPTZ
session_active              BOOLEAN
last_heartbeat              TIMESTAMPTZ
last_updated                TIMESTAMP
created_at                  TIMESTAMP
connection_type             TEXT
```

### Índices para Performance

```sql
-- Índices essenciais para queries rápidas
CREATE INDEX idx_trade_history_account_type ON trade_history(account_type);
CREATE INDEX idx_trade_history_account_date ON trade_history(account_type, DATE(data_abertura));
CREATE INDEX idx_trade_history_user_account ON trade_history(user_id, account_type);
CREATE INDEX idx_bot_status_account_type ON bot_status(account_type);
```

---

## 🔌 APIs e Endpoints

### Analytics Endpoints

```tsx
// Dashboard principal
GET /admin/analytics/dashboard
// Resposta: DashboardMetrics

// Dados de receita para gráficos
GET /admin/analytics/revenue?days=30
// Resposta: RevenueDataPoint[]

// Crescimento de usuários
GET /admin/analytics/user-growth?days=30
// Resposta: UserGrowthDataPoint[]

// Top usuários
GET /admin/analytics/top-users/pnl?limit=10&accountType=real
GET /admin/analytics/top-users/volume?limit=10&accountType=real
// Resposta: TopUser[]

// Performance de ativos
GET /admin/analytics/asset-performance?accountType=real&limit=20
// Resposta: AssetPerformance[]
```

### Users Endpoints

```tsx
// Lista de usuários com filtros
GET /admin/users?accountType=real&page=1&limit=25&search=email
// Resposta: { users: UserListItem[], total: number, page: number }

// Detalhes de um usuário
GET /admin/users/:userId
// Resposta: UserDetails

// Trades de um usuário
GET /admin/users/:userId/trades?accountType=real&limit=100
// Resposta: UserTrade[]

// Sessões de um usuário
GET /admin/users/:userId/sessions?limit=50
// Resposta: UserSession[]
```

### Trades Endpoints

```tsx
// Lista de trades com filtros
GET /admin/trades?accountType=real&userId=uuid&asset=EURUSD&dateStart=2025-01-01&dateEnd=2025-01-14&page=1&limit=100
// Resposta: { trades: TradeListItem[], total: number, page: number }

// Detalhes de um trade
GET /admin/trades/:tradeId
// Resposta: TradeDetails

// Estatísticas de trading
GET /admin/trades/stats?accountType=real&dateFrom=2025-01-01&dateTo=2025-01-14
// Resposta: TradeStats

// Volume diário para gráficos
GET /admin/trades/daily-volume?accountType=real&days=30
// Resposta: DailyVolume[]
```

---

## 🎨 Interface e UX

### Design System

- **Cores**: Segue o Mivra Design Guide
    - Primary: `#3B82F6` (blue-500)
    - Positive: `#10B981` (green-500) para WIN/gains
    - Negative: `#EF4444` (red-500) para LOSS/perdas
    - Warning: `#F59E0B` (amber-500) para alertas

### Componentes Reutilizáveis

- **Cards de Métricas**: Com ícones, valores e variação percentual
- **Badges de Status**: Para contas ativas/inativas, bots rodando
- **Tabelas Responsivas**: Com paginação e filtros
- **Gráficos**: Charts de linha para receita e crescimento

### Estados de Loading

- **Skeleton Loading**: Para carregamento inicial
- **Error States**: Mensagens de erro com retry
- **Empty States**: Quando não há dados disponíveis

---

## ⚡ Hooks e State Management

### useAdminAuth

**Funcionalidades**:

- Autenticação de admin
- Verificação de permissões por role
- Controle de sessão
- Redirect automático se não autorizado

### useAdminData

**React Query Hooks**:

- `useAdminDashboard()`: Métricas do dashboard (5min cache)
- `useAdminUsers()`: Lista de usuários (2min cache)
- `useAdminTrades()`: Lista de trades (2min cache)
- `useRevenueData()`: Dados de receita (10min cache)
- `useUserGrowthData()`: Crescimento de usuários (10min cache)

**Cache Strategy**:

- Dashboard metrics: 5 minutos
- Charts (revenue, growth): 10 minutos
- User list: 2 minutos
- User details: 1 minuto
- Trade list: 30 segundos

---

## 🔒 Segurança

### Controle de Acesso

- **RLS (Row Level Security)**: Aplicado em todas as tabelas sensíveis
- **RPC Functions**: Para bypass controlado do RLS durante operações específicas
- **Role-Based Access**: Diferentes níveis de acesso por role

### Validações

- **Input Validation**: Todos os inputs são validados no frontend e backend
- **SQL Injection**: Uso de queries parametrizadas
- **XSS Protection**: Sanitização de dados exibidos

### Auditoria

- **Logs de Admin**: Todas as ações são logadas na `user_activity_log`
- **Timestamps**: Controle de quando cada ação foi realizada
- **IP Tracking**: Rastreamento de IPs para auditoria

---

## 📈 Métricas e KPIs

### Métricas de Usuários

- **Total Users Real**: Usuários com contas reais
- **Active Users Today**: Usuários que fizeram login hoje
- **New Users Week**: Novos usuários na semana
- **Churn Rate**: Taxa de abandono nos últimos 30 dias
- **Conversion Rate**: Taxa de conversão demo → real

### Métricas de Trading

- **Trades Today Real**: Total de trades em contas reais hoje
- **Platform Win Rate**: Win rate geral da plataforma
- **Volume Today**: Volume financeiro negociado hoje
- **Active Bots Real**: Número de bots ativos em contas reais

### Métricas Financeiras

- **Deposits Today**: Total depositado hoje
- **Withdrawals Today**: Total sacado hoje
- **Net Revenue**: Receita líquida (depósitos - saques)
- **Average Deposit Size**: Valor médio dos depósitos

---

## 🚀 Performance e Otimizações

### Database Optimization

- **Índices Compostos**: Para queries complexas com múltiplos filtros
- **Query Optimization**: Uso de CTEs e window functions para agregações
- **Connection Pooling**: Pool de conexões para evitar overhead

### Frontend Optimization

- **Code Splitting**: Carregamento lazy das páginas admin
- **React Query**: Cache inteligente com invalidação automática
- **Virtualization**: Para listas grandes de usuários/trades
- **Debounced Search**: Busca otimizada com delay

### API Optimization

- **Pagination**: Todas as listas são paginadas
- **Field Selection**: Retorno apenas dos campos necessários
- **Response Compression**: Gzip para reduzir payload
- **Rate Limiting**: Proteção contra spam de requests

---

## 🔧 Manutenção e Monitoramento

### Health Checks

- **API Health**: Endpoint `/admin/health` para verificar status
- **Database Health**: Monitora conexões e performance
- **Real-time Metrics**: Dashboard com métricas em tempo real

### Alertas e Notificações

- **Email Alerts**: Para eventos críticos
- **Webhook Notifications**: Integração com sistemas externos
- **Threshold Alerts**: Quando limites são ultrapassados

### Backup e Recovery

- **Automated Backups**: Backup automático do Supabase
- **Point-in-time Recovery**: Recuperação para qualquer momento
- **Data Export**: Exportação de dados para análise externa

---

## 🛠️ Desenvolvimento e Deploy

### Ambiente de Desenvolvimento

- **Hot Reload**: Desenvolvimento com recarga automática
- **TypeScript**: Type safety em todo o código
- **ESLint + Prettier**: Padronização de código
- **Testing**: Testes unitários para funções críticas

### Deploy e Produção

- **Build Otimizado**: Bundle minificado para produção
- **Environment Variables**: Configuração por ambiente
- **SSL/HTTPS**: Conexões seguras obrigatórias
- **CDN**: Assets estáticos servidos via CDN

---

## 📋 Roadmap e Próximos Passos

### Features Planejadas

- **Real-time Dashboard**: Updates em tempo real via WebSocket
- **Advanced Filtering**: Filtros mais granulares para análises
- **Export Functions**: Exportação de relatórios em PDF/Excel
- **Mobile Responsive**: Otimização completa para mobile
- **Dark Mode**: Tema escuro para o dashboard

### Integrações Futuras

- **Slack/Discord**: Notificações em canais de equipe
- **Google Analytics**: Integração com GA para métricas web
- **Sentry**: Monitoramento de erros em produção
- **DataDog**: APM e monitoramento de performance

---

## 👥 Equipe e Responsabilidades

**Desenvolvedor Principal**: @claudecode

**Última Atualização**: 14/10/2025

**Status**: ✅ Implementado e em produção

**Próxima Revisão**: 01/11/2025

---

*Esta documentação é mantida automaticamente e reflete o estado atual do sistema. Para mudanças ou sugestões, contate a equipe de desenvolvimento.*