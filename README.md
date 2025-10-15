# 🚀 Mivra Fintech - Trading Bot Platform

![License](https://img.shields.io/badge/license-Private-red)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![React](https://img.shields.io/badge/react-18.3.1-blue)

## 📊 Sobre o Projeto

**Mivra Fintech** é uma plataforma completa de trading automatizado com integração à **Avalon Broker**. O sistema oferece análise de mercado em tempo real, execução automatizada de trades baseada em múltiplas estratégias, e um painel administrativo completo para gerenciamento de usuários e performance.

## ✨ Features Principais

### 🤖 Bot de Trading Automatizado
- **4 Estratégias de Trading**: Conservative, Balanced, Aggressive, Support/Resistance
- **Análise Técnica Avançada**: RSI, MACD, Bollinger Bands, ADX, Stochastic RSI
- **Gestão Inteligente de Risco**: Stop-loss, take-profit, martingale adaptativo
- **Multi-user Session Management**: Cada usuário pode executar seu próprio bot
- **49 Assets Disponíveis**: Forex, Crypto, Commodities, Índices, Ações

### 📈 Market Scanner em Tempo Real
- Análise simultânea de múltiplos ativos
- Identificação automática de oportunidades de trading
- Heatmap visual de performance
- Filtros por categoria e estratégia
- WebSocket para atualizações em tempo real

### 🔐 Sistema de Autenticação & SSID
- **Gerenciamento Automático de SSID**: Renovação a cada 23 horas
- **Multi-user Support**: SSID individual por usuário
- **Integração Supabase**: Autenticação segura e persistência de dados
- **Criação Automática de Contas**: Integração direta com Avalon Broker

### 📊 Admin Dashboard
- Métricas em tempo real de todos os usuários
- Gerenciamento completo de usuários
- Análise detalhada de trades e performance
- Sistema de alertas e notificações
- Exportação de relatórios (CSV/PDF)

### 💼 CRM Integrado
- Gestão de contatos e leads
- Segmentação dinâmica de clientes
- Workflows de automação
- Campanhas de email personalizadas
- Templates de email customizáveis

## 🏗️ Arquitetura

```
mivra-fintech/
├── apps/
│   ├── frontend/          # React + TypeScript + Vite
│   │   ├── src/
│   │   │   ├── features/  # Features modulares (admin, trading, scanner)
│   │   │   ├── pages/     # Páginas principais
│   │   │   └── shared/    # Componentes reutilizáveis
│   │   └── package.json
│   │
│   └── backend/           # Node.js + Express
│       ├── src/
│       │   ├── admin/     # Módulos administrativos
│       │   ├── bot/       # Lógica do trading bot
│       │   ├── crm/       # Sistema CRM
│       │   └── services/  # Serviços (SSID Manager, Avalon Auth)
│       └── package.json
│
├── packages/
│   ├── client-sdk-js/     # SDK Avalon Broker
│   └── agent-sdk/         # SDK de Agentes Claude
│
└── docs/                  # Documentação completa
```

## 🚀 Quick Start

### Pré-requisitos
- Node.js >= 18.0.0
- npm ou yarn
- Conta Supabase
- Conta Avalon Broker

### 1. Clone o repositório
```bash
git clone https://github.com/criestefani/mivra-fintech.git
cd mivra-fintech
```

### 2. Configure as variáveis de ambiente

**Backend** (`apps/backend/.env`):
```bash
# Copie o arquivo de exemplo
cp apps/backend/.env.example apps/backend/.env

# Edite com suas credenciais:
# - SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
# - AVALON_API_TOKEN e AVALON_SYSTEM_USER_ID
```

**Frontend** (`apps/frontend/.env`):
```bash
# Configure as variáveis do Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Instale as dependências

**Backend:**
```bash
cd apps/backend
npm install
```

**Frontend:**
```bash
cd apps/frontend
npm install
```

### 4. Inicie os servidores

**Backend (Terminal 1):**
```bash
cd apps/backend
node src/api-server.mjs
```
Servidor rodando em: `http://localhost:4001`

**Frontend (Terminal 2):**
```bash
cd apps/frontend
npm run dev
```
Aplicação rodando em: `http://localhost:5174`

## 📚 Documentação

Documentação completa disponível em `/docs`:

- **[Trading Bot System](docs/overview/Trading%20Bot%20System/)**: Estratégias e indicadores
- **[Backend API](docs/overview/)**: Endpoints e arquitetura
- **[Frontend Architecture](docs/overview/)**: Estrutura de componentes
- **[Admin Dashboard](docs/overview/)**: Guia completo do painel admin
- **[Database Schema](docs/overview/)**: Estrutura do banco de dados

## 🔧 Tecnologias Utilizadas

### Frontend
- **React 18** - UI Library
- **TypeScript** - Type Safety
- **Vite** - Build Tool
- **TailwindCSS** - Styling
- **shadcn/ui** - Component Library
- **Socket.IO Client** - Real-time Communication
- **Recharts** - Charting Library
- **Supabase JS** - Database & Auth

### Backend
- **Node.js** - Runtime
- **Express** - Web Framework
- **Socket.IO** - WebSocket Server
- **Supabase** - PostgreSQL Database
- **Avalon SDK** - Broker Integration
- **ES Modules** - Module System

### Broker Integration
- **@quadcode-tech/client-sdk-js** - Avalon Broker WebSocket SDK
- **SSID Manager** - Automatic session management
- **Real-time Candles** - Live market data

## 🔐 Segurança

- ✅ Variáveis de ambiente não commitadas (`.env`, `.mcp.json`)
- ✅ Autenticação JWT via Supabase
- ✅ SSID com renovação automática a cada 23h
- ✅ Rate limiting nos endpoints
- ✅ Validação de dados no backend
- ✅ Sanitização de inputs

## 📊 Funcionalidades do SSID Manager

O sistema implementa um gerenciador automático de SSID (Session ID) para a Avalon Broker:

- **Geração Automática**: SSID gerado via POST para Avalon API
- **Cache Individual**: Cada usuário mantém seu próprio SSID
- **Renovação Automática**: Renova a cada 23 horas automaticamente
- **Retry Logic**: Tenta novamente em caso de falha (5 minutos)
- **System SSID**: SSID de sistema para inicialização (ID: 183588600)
- **Cleanup**: Limpeza periódica de SSIDs expirados

### Endpoints de Monitoramento
```bash
GET  /api/admin/ssid/stats           # Estatísticas gerais
GET  /api/admin/ssid/:userId         # Info de SSID específico
POST /api/admin/ssid/:userId/renew   # Forçar renovação
POST /api/admin/ssid/cleanup         # Limpar expirados
```

## 🤝 Contribuindo

Este é um projeto privado. Para contribuir, entre em contato com o proprietário do repositório.

## 📝 Licença

Este projeto é proprietário e confidencial. Todos os direitos reservados.

## 👤 Autor

**Cristian De Estefani**
- GitHub: [@criestefani](https://github.com/criestefani)
- Email: cristiandeestefani@gmail.com

---

🤖 *Generated with [Claude Code](https://claude.com/claude-code)*

Co-Authored-By: Claude <noreply@anthropic.com>
