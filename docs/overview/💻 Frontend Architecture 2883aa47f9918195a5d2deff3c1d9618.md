# 💻 Frontend Architecture

Arquitetura frontend React + TypeScript + Vite, organizada por features com design system próprio.

🏗️ Estrutura do Projeto

- apps/frontend/src/
- ├── features/ (módulos por funcionalidade)
- ├── pages/ (páginas principais)
- ├── shared/ (componentes e hooks compartilhados)
- └── index.css (Mivra Design System)

🎨 Design System (Mivra Design Guide)

Cores Principais:

- Primary: #3B82F6 (blue-500)
- Positive: #10B981 (green-500) - WIN, gains
- Negative: #EF4444 (red-500) - LOSS, losses
- Warning: #F59E0B (amber-500)
- Info: #3B82F6 (blue-500)

Tipografia: Inter font family

📦 Features Principais

1. features/auth/ - Autenticação

- Auth.tsx - Login/Signup com Supabase Auth
- Suporta: Email/Password, Google OAuth

2. features/dashboard/ - Dashboard Principal

- DashboardHeader.tsx - Header com AccountToggle
- AccountToggle.tsx - Switch Demo/Real account

3. features/bot-control/ - Controle do Bot

- hooks/useBotControl.ts - Custom hook para comandos (START/STOP/PAUSE)
- Integração com tabela bot_control

4. features/market-scanner/ - Market Scanner UI

- MarketScanner.tsx - Top 20 sinais por assertividade
- Atualização em tempo real

5. features/trading/ - Operações e Histórico

- TradingControls.tsx - Manual trading controls
- TradingChart.tsx - Gráfico de candles (lightweight-charts)
- TradeHistory.tsx - Histórico de trades

6. features/settings/ - Configurações

- Settings.tsx - Config do bot (ativo, valor, estratégia, etc)

🪢 Custom Hooks Principais

shared/hooks/useBotSocket.ts

- WebSocket connection para eventos do bot em tempo real
- Eventos: bot:status, bot:pnl, trade:completed

shared/hooks/useBackendCandles.ts

- Busca candles do backend (endpoint /api/candles)
- Fallback: useAvalonCandles se backend indisponível

📱 Páginas Principais

- / (Dashboard) - Overview com métricas, PnL, status do bot
- /operations (Operations) - Controle manual, auto-mode, gráficos
- /history (History) - Histórico completo de trades
- /settings (Settings) - Configurações do bot e perfil

💎 Stack Tecnológico

- React 18 + TypeScript
- Vite (build tool)
- TailwindCSS (styling)
- Supabase Client (@supabase/supabase-js)
- Lightweight Charts (trading charts)
- Lucide React (icons)