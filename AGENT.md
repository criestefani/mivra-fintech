# AGENT Overview

## Visao Geral
- Mivra Fintech e uma plataforma completa de trading automatizado integrada ao broker Avalon.
- Existem dois sistemas distintos operando no monorepo: **MivraTech** (produto usado pelos clientes finais) e a **Admin Platform** (ferramenta interna para monitoramento e gestao dos clientes e do bot).
- O sistema entrega analise de mercado em tempo real, execucao automatica de ordens, dashboard administrativo completo e recursos de CRM planejados.
- Arquitetura monorepo com apps de backend (Node.js/Express) e frontend (React/TypeScript/Vite), além de pacotes compartilhados (`client-sdk-js`, `agent-sdk`).

## Componentes Principais
### Backend (`apps/backend`)
- Servidor Express principal (`src/api-server.mjs`) exposto em `http://localhost:4001`, com REST/Socket.IO para bot, admin, scanner e CRM.
- Bot multi-usuario (`src/bot/bot-live.mjs`) gerenciado por `SessionManager` e `BotSession`, suportando 4 estrategias (Conservative, Balanced, Aggressive, Support-Resistance) e 6 indicadores tecnicos (RSI, MACD, Bollinger, ADX, Stochastic RSI, Trend).
- Market scanner (`src/bot/market-scanner.mjs`) analisa ~150 ativos em 5 timeframes a cada 10 segundos e persiste sinais em `strategy_trades`.
- Integracoes com Avalon SDK via WebSocket (`@quadcode-tech/client-sdk-js`), Supabase (auth, banco de dados) e gerenciador de SSID com renovacao automatica.
- Admin APIs para usuarios, trades, analytics e CRM (em desenvolvimento).

### Frontend (`apps/frontend`)
- React 18 + TypeScript, Vite, TailwindCSS, shadcn/ui e design system proprio descrito em `theme.md` e `tailwind.config.js`.
- Voltado ao cliente final (MivraTech), com páginas principais: Dashboard, Operations (trading manual/auto), History, Settings, Market Scanner, Auth e seções de trading em tempo real.
- Hooks de tempo real (`useBotSocket`, `useScannerSubscription`) e integracao com Supabase (`supabase/client.ts`) e backend (`shared/services/api`).
- Componentes trading: graficos com `lightweight-charts`, cards de metricas, controles de bot e historico de trades.

### Admin Platform (`apps/admin-frontend`, `apps/admin-backend`)
- Foco interno: monitoramento de clientes MivraTech, gestao de usuarios, analises financeiras e operacionais.
- Stack similar (React/TypeScript no frontend, Node/Express no backend) com layout dedicado e permissoes diferenciadas para `super_admin`, `admin`, `support`, `analyst`.
- GUI composta por dashboard principal, gerenciamento de usuarios, historico de trades, analytics avancados, monitoramento em tempo real e configuracoes administrativas.
- Backend oferece APIs administrativas dedicadas (health, metrics, alerts, CRM futuro) e integra com Supabase e Avalon para consolidar dados operacionais.

### Pacotes Compartilhados (`packages`)
- `client-sdk-js`: SDK customizado para interagir com Avalon Broker.
- `agent-sdk`: Ferramentas de integracao com agentes (Claude) e automacoes futuras.

## Fluxos Centrais
- **Execucao do Bot**: comandos sao gravados em `bot_control` (Supabase); `bot-live.mjs` verifica a cada 5 s, conecta ao Avalon via SSID, avalia ativos conforme estrategia e executa ordens (`blitz.buy()`), salvando resultados em `trades_history`.
- **Market Scanner**: coleta candles via Avalon SDK, calcula assertividade por estrategia/timeframe, alimenta `strategy_trades` e `scanner_performance`, exposto no frontend via WebSocket e APIs.
- **Admin Dashboard**: namespace `/admin` no Socket.IO para metricas em tempo real, paginas React dedicadas a usuarios, trades, analytics, monitoring e settings com design orientado a contas reais.
- **Autenticacao**: Supabase Auth (email/password e OAuth), com tabelas `profiles`, `admin_users` e gerenciamento de roles (`super_admin`, `admin`, `support`, `analyst`).

## Integracoes Externas
- **Avalon Broker**: WebSocket `wss://ws.trade.avalonbroker.com/echo/websocket`, APIs auxiliares documentadas em `docs/QUADCODE_API_GUIDE.md` e `docs/Outros endpoints Avalon.md`.
- **Supabase**: banco PostgreSQL gerenciando tabelas de bot, trades, scanner, usuarios, admin e futuras estruturas de CRM.
- **MCP (Model Context Protocol)**: configuracoes no repo (`claude_desktop_config.json`, `.mcp.json`) habilitam servidores Supabase, GitHub, Filesystem, Notion, Magic, ShadCN, Brave Search, entre outros.

## Setup Essencial
1. Instalar dependencias separadamente em `apps/backend` e `apps/frontend` (`npm install`).
2. Configurar variaveis de ambiente (`apps/backend/.env`, `apps/frontend/.env`) com credenciais Supabase e Avalon.
3. Iniciar backend (`node src/api-server.mjs` com Node >= 18) e frontend (`npm run dev`).
4. Opcional: executar `apps/backend/src/bot/bot-live.mjs` para rodar o bot em modo standalone.

## Estado Atual e Roadmap
- De acordo com `docs/PROJETO_PROGRESSO.md` (15/10/2025), build frontend esta funcional, com todos componentes trading e admin implementados e integracoes finalizadas.
- Backend e banco estao completos para MVP (fase 2); modulo CRM extensivo permanece planejado para versoes futuras.
- Pendencias: validar fluxos end-to-end (auth, bot, scanner, admin), garantir renovacao de SSID automatica em producao, implementar tabelas e funcoes do CRM.

## Documentacao de Referencia
- `README.md` para resumo inicial e quick start.
- Pasta `docs/overview/` para arquitetura detalhada de backend, frontend, bot, scanner, dashboard e schema de banco.
- `docs/QUADCODE_API_GUIDE.md` e `docs/WEBSOCKET_MIGRATION.md` para integracao Avalon.
- `docs/PLANO_CORRECAO_BUILD.md` e `docs/PROJETO_PROGRESSO.md` para status de build e roadmap.
- `docs/MCP_*.md` para configuracao de agentes MCP e automacao com Claude.
