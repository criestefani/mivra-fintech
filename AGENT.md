# Platform Overview

## MivraTech - AI-Powered Trading Intelligence Platform
MivraTech é uma plataforma fintech avançada que combina inteligência artificial e análise de mercado em tempo real para entregar sinais automatizados de trading e gestão de portfólio voltados a opções binárias. O ecossistema processa grandes volumes de dados em múltiplos ativos e timeframes, aplicando estratégias híbridas agressivas proprietárias para identificar oportunidades com alta probabilidade de acerto.

### Core Value Proposition
- **Real-time Market Scanning:** monitora continuamente 139+ ativos em 4 janelas (10s, 30s, 1m, 5m)
- **AI-Driven Signal Generation:** algoritmos proprietários identificam trades com vantagem estatística comprovada
- **Risk Management:** só expõe sinais com pelo menos 15 ocorrências históricas e taxa de vitória validada
- **Broker Integration:** integração direta com o broker Quadcode/Avalon para execução em tempo real
- **Portfolio Analytics:** rastreamento completo de performance e ferramentas de otimização de portfólio

## Dual System Architecture
A solução é composta por dois sistemas interligados, porém distintos, compartilhando infraestrutura, dados e serviços de trading.

### 1. MivraTech Client Platform (produto principal)
Aplicação voltada ao cliente final, responsável pela experiência completa de trading assistido.

#### Key Features
- **Market Scanner Dashboard:** heatmap em tempo real destacando ativos e estratégias com melhor desempenho
- **Trading Operations Interface:** execução de sinais, gerenciamento de posições e monitoramento contínuo
- **Portfolio Management:** visão consolidada de conta, métricas de performance e avaliação de risco
- **User Authentication:** login seguro, gestão de assinatura e preferências do usuário
- **Mobile & Desktop Support:** layout responsivo otimizado para múltiplos dispositivos

#### Target Users
Traders individuais, investidores de varejo e entusiastas de trading que buscam insights de mercado baseados em dados.

### 2. Admin Management System
Console interno para operação, governança e acompanhamento do negócio.

#### Key Features
- **User Management:** analytics de clientes, controle de assinaturas e monitoramento de comportamento
- **Trading Analytics:** métricas agregadas, análise de efetividade de sinais e histórico operacional
- **Revenue Dashboard:** relatórios financeiros, acompanhamento de receita e indicadores de negócio
- **System Monitoring:** monitoramento de saúde da plataforma, status de APIs e métricas técnicas
- **Customer Support Tools:** gestão de tickets, acompanhamento de issues e ferramentas de diagnóstico

#### Target Users
Administradores da plataforma, times de suporte, analistas de negócios e operações técnicas.

## Business Model
- **B2C SaaS Platform:** acesso por assinatura aos módulos de inteligência e análise de mercado
- **Freemium Tiers:** camada gratuita com sinais básicos e upgrade para recursos avançados e automação
- **Broker Revenue Share:** participação em receitas via integrações com brokers parceiros
- **Enterprise Solutions:** implementações customizadas para traders institucionais e gestores

## Core Commands
### Essential Development Commands
- `cd apps/frontend && npm run dev` — inicia o frontend com hot reload (use `pnpm run dev` se preferir pnpm)
- `cd apps/frontend && npm run preview` — pré-visualização otimizada para mobile/produção
- `node apps/backend/src/bot/market-scanner.mjs` — executa o market scanner em tempo real
- `node apps/backend/src/api-server.mjs` — sobe a API REST/Socket para cliente e admin
- `npx tsc --noEmit` — verificação de tipos (executar dentro dos workspaces TypeScript)
- `npm run lint` — linting (disponível nos frontends; ajuste o diretório antes de rodar)
- `cd apps/backend && npm run test` — suíte de testes do backend/bot
- `cd apps/frontend && npm run build` — build de produção do frontend

### Database Management
- `npx supabase start` — inicia a stack Supabase local para desenvolvimento
- `npx supabase db reset` — recria o banco local do zero
- `npx supabase db push` — aplica migrações pendentes (schema e funções)

### Frontend Development Modes
- **Desktop Development:** `npm run dev` dentro de `apps/frontend` para desenvolvimento padrão
- **Mobile Testing:** `npm run preview` para validar responsividade e fluxo mobile
- **Production Build:** `npm run build` seguido de `npm run preview` para inspecionar o bundle final

## Project Architecture
```
apps/
  frontend/        # React + TypeScript (cliente e consoles admin)
    src/pages/     # Interfaces principais (trading, scanner, admin dashboard)
    src/features/  # Componentes de domínio (trading, admin, market-scanner)
    src/shared/    # UI compartilhada, hooks e utilitários
  backend/         # API Node.js/Express e serviços de trading
    src/bot/       # Bot live, market scanner, estratégias e sessão
    src/services/  # Autenticação, portfólio, integrações auxiliares
    src/api-server.mjs  # API REST/WebSocket unificada
packages/
  client-sdk-js/   # SDK para integração com o broker Avalon (Quadcode)
  agent-sdk/       # Infra de agentes/automação e ferramentas MCP
```

### Key Backend Services
- **Market Scanner (`apps/backend/src/bot/market-scanner.mjs`):** análise contínua dos ativos e consolidação de sinais
- **API Server (`apps/backend/src/api-server.mjs`):** endpoints REST, WebSocket namespaces e roteamento para cliente/admin
- **Service Layer (`apps/backend/src/services/`):** autenticação, processamento de sinais, gestão de portfólio e analytics administrativos

## System Boundaries
- **Shared Infrastructure:** banco de dados, autenticação e serviços de trading servem tanto clientes quanto admins
- **Separate UI Flows:** interfaces e permissões dedicadas para o público final versus operadores internos
- **Unified Backend:** API única com controle de acesso baseado em papéis para cada tipo de usuário
- **Common Data Layer:** dados compartilhados de analytics e trading apresentados em perspectivas distintas conforme o contexto
