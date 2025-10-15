# MivraTec Trading Bot SDK

> **Automated Binary Options Trading Bot with Supabase Integration**

![Status](https://img.shields.io/badge/status-production%20ready-brightgreen)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![License](https://img.shields.io/badge/license-ISC-blue)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Testing](#testing)
- [Deployment](#deployment)
- [Admin Dashboard](#admin-dashboard)
- [Database Schema](#database-schema)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)

---

## 🎯 Overview

MivraTec is an advanced automated trading bot for binary options that:

- ✅ **Polls Supabase** for START/STOP commands every 5 seconds
- ✅ **Connects to Avalon Broker** via QuadCode SDK
- ✅ **Analyzes markets** using RSI, MACD, and Bollinger Bands
- ✅ **Executes real trades** automatically
- ✅ **Stores all results** in Supabase database
- ✅ **Manages risk** with stop-loss and take-profit rules
- ✅ **Supports multiple strategies** (balanced, aggressive, conservative)

---

## ✨ Features

### Core Trading

- 🤖 **Automated Trading:** Continuous market analysis and trade execution
- 📊 **Technical Indicators:** RSI, MACD, Bollinger Bands
- 🎯 **Multiple Strategies:** Balanced, Aggressive, Conservative, Support/Resistance
- 💰 **Risk Management:** Consecutive loss limits, daily P&L targets
- 🔄 **Real-time Updates:** WebSocket connection to broker

### Database Integration

- 📝 **Command Control:** START/STOP via Supabase `bot_control` table
- 💾 **Trade History:** All trades stored in `trades_history`
- 📈 **Bot Status:** Real-time status updates in `bot_status`
- 🔐 **Secure:** Service role authentication

### Monitoring

- 📊 **Live Stats:** Win rate, P&L, consecutive losses
- ⏱️ **Heartbeat:** Regular status updates
- 🚨 **Safety Stops:** Automatic halt on risk limits
- 📝 **Detailed Logging:** Console output for all events

---

## 🏗️ Architecture

```
┌─────────────────┐
│   Supabase DB   │
│  bot_control    │──┐
│  bot_status     │  │  Polling (5s)
│  trades_history │  │
└─────────────────┘  │
                     ▼
              ┌──────────────┐
              │  bot-live.mjs│
              │              │
              │ - Poll loop  │
              │ - Strategies │
              │ - Risk mgmt  │
              └──────────────┘
                     │
                     │ WebSocket
                     ▼
              ┌──────────────┐
              │ Avalon Broker│
              │  (QuadCode)  │
              └──────────────┘
```

### Key Components

1. **Polling Loop:** Checks `bot_control` every 5 seconds
2. **Trading Engine:** Analyzes assets and executes trades
3. **Strategy System:** RSI/MACD/Bollinger indicator integration
4. **Risk Manager:** Monitors P&L and consecutive losses
5. **Database Layer:** Supabase client for all data operations

---

## 📦 Installation

### Prerequisites

- Node.js 18.0.0 or higher
- Supabase account (free tier works)
- Avalon broker account
- Git (for cloning)

### Steps

```bash
# Clone repository
git clone https://github.com/your-org/mivrabot-sdk.git
cd mivrabot-sdk

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env
```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here

# Avalon Broker Configuration
AVALON_API_KEY=your-avalon-api-key
AVALON_USER_ID=your-avalon-user-id
AVALON_WS_URL=wss://ws.trade.avalonbroker.com/echo/websocket

# Bot Configuration
POLLING_INTERVAL=5000
RISK_MAX_CONSECUTIVE_LOSSES=5
RISK_DAILY_LOSS_LIMIT=1000
RISK_DAILY_PROFIT_TARGET=5000

# Environment
NODE_ENV=production
```

### Getting Credentials

**Supabase Service Key:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Settings → API
4. Copy `service_role` key (⚠️ **NOT** the `anon` key)

**Avalon API Key:**
1. Log in to Avalon broker
2. Account Settings → API Keys
3. Generate new API key
4. Copy key and user ID

---

## 🚀 Usage

### Starting the Bot

```bash
# Start bot
npm start

# Or with node directly
node bot-live.mjs
```

**Expected Output:**
```
🤖 MivraTec Trading Bot Started
⏰ Polling interval: 5000ms
👀 Watching for START commands...
```

### Sending Commands

#### Via Supabase Dashboard

1. **Create Bot Configuration:**

```sql
INSERT INTO bot_status (user_id, name, strategy, assets, trade_amount, avalon_ssid, status, current_balance)
VALUES (
  'user-123',
  'My Trading Bot',
  'strategy_balanced',
  ARRAY['EURUSD', 'GBPUSD', 'BTCUSD'],
  1,
  'your-avalon-ssid',
  'idle',
  1000
);
```

2. **Send START Command:**

```sql
INSERT INTO bot_control (user_id, bot_id, command, status)
VALUES (
  'user-123',
  '<bot-id-from-above>',
  'START',
  'pending'
);
```

3. **Monitor Console:**

```
🚀 === TRADING SESSION STARTED ===
Bot ID: abc-123
User ID: user-123

🔐 Connecting to Avalon...
✅ Balance: 1000 USD
✅ Connected to Avalon broker

🔍 Analyzing 3 assets with strategy [STRATEGY_BALANCED]...
⚡ Analysis completed in 12.3s
✅ 2 valid signals found

🟢 EURUSD → CALL (V1_RSI_OVERSOLD) | Conf: 75%
✅ Position opened: ID 12345
⏱️  Expires at: 10/3/2025, 3:45:00 PM

⏳ Waiting 65s for result...

📊 Result: WIN | PnL: 0.85
📊 Stats: 1W/0L | Win Rate: 100.0% | Daily P&L: $0.85
✅ Trade updated in Supabase
```

4. **Send STOP Command:**

```sql
INSERT INTO bot_control (user_id, bot_id, command, status)
VALUES (
  'user-123',
  '<bot-id>',
  'STOP',
  'pending'
);
```

#### Via Admin Dashboard (Coming Soon)

The Phase 3 Admin Dashboard (`src/admin/`) provides a web UI for:
- Starting/stopping bots
- Viewing live stats
- Monitoring trades
- Managing configurations

---

## 🧪 Testing

### Automated Tests

```bash
# Run test suite
npm test
```

**Test Coverage:**
- ✅ Supabase connection
- ✅ Database table structures
- ✅ Bot configuration creation
- ✅ START command insertion
- ✅ Command processing
- ✅ Bot status updates
- ✅ Trade history validation
- ✅ Environment variable checks

### Manual Testing

1. **Syntax Check:**
```bash
node --check bot-live.mjs
```

2. **Start Bot:**
```bash
npm start
```

3. **Insert START Command** (see Usage section)

4. **Monitor Logs:**
- Check for "TRADING SESSION STARTED"
- Verify Avalon connection
- Wait for trade signals (5-10 minutes)
- Verify trade execution

5. **Verify Database:**
```sql
-- Check trades
SELECT * FROM trades_history ORDER BY created_at DESC LIMIT 10;

-- Check bot status
SELECT * FROM bot_status WHERE id = '<bot-id>';

-- Check commands
SELECT * FROM bot_control ORDER BY created_at DESC LIMIT 10;
```

---

## 🌐 Deployment

### Option 1: Render

1. **Create Account:** [render.com](https://render.com)
2. **New Web Service** → Connect GitHub
3. **Configuration:**
   - Build Command: `npm install`
   - Start Command: `npm start`
4. **Environment Variables:** Add all from `.env`
5. **Deploy** 🚀

### Option 2: Railway

1. **Create Account:** [railway.app](https://railway.app)
2. **New Project** → Deploy from GitHub
3. **Add Environment Variables**
4. **Deploy** 🚀

### Option 3: VPS (Ubuntu)

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repository
git clone <your-repo>
cd mivrabot-sdk

# Install dependencies
npm install

# Create .env file
nano .env
# (paste configuration)

# Install PM2
sudo npm install -g pm2

# Start bot
pm2 start bot-live.mjs --name mivrabot

# Enable auto-start on boot
pm2 startup
pm2 save

# Monitor logs
pm2 logs mivrabot
```

---

## 📊 Admin Dashboard

### Phase 3 Complete ✅

The admin dashboard is fully implemented in `src/admin/` with:

**Features:**
- 📊 **Dashboard Page:** 16 live metrics, charts, top users
- 👥 **User Management:** Paginated table, filters, search
- 🔍 **User Detail:** 360° profile view with trades history
- 📈 **Analytics:** Revenue charts, growth charts
- 🎨 **Modern UI:** Tailwind CSS, responsive design

**Tech Stack:**
- React 18+ with TypeScript
- TanStack React Query v5
- TanStack Table v8
- Recharts for visualizations
- React Router for navigation

**Setup:**
```bash
cd src/admin
npm install
npm run dev
```

See `src/admin/README.md` for full documentation.

---

## 💾 Database Schema

### Required Tables

#### bot_control
```sql
CREATE TABLE bot_control (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  bot_id UUID REFERENCES bot_status(id),
  command TEXT NOT NULL CHECK (command IN ('START', 'STOP')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed')),
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);

CREATE INDEX idx_bot_control_status ON bot_control(status);
CREATE INDEX idx_bot_control_command ON bot_control(command);
```

#### bot_status
```sql
CREATE TABLE bot_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  strategy TEXT DEFAULT 'strategy_balanced',
  assets TEXT[] DEFAULT ARRAY['EURUSD', 'GBPUSD'],
  trade_amount NUMERIC DEFAULT 1,
  avalon_ssid TEXT NOT NULL,
  status TEXT DEFAULT 'idle' CHECK (status IN ('idle', 'running', 'stopped')),
  current_balance NUMERIC DEFAULT 0,
  total_trades INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  last_heartbeat TIMESTAMP,
  started_at TIMESTAMP,
  stopped_at TIMESTAMP,
  stop_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### trades_history
```sql
CREATE TABLE trades_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  bot_id UUID REFERENCES bot_status(id),
  external_id TEXT UNIQUE,
  ativo TEXT NOT NULL,
  direcao TEXT NOT NULL CHECK (direcao IN ('CALL', 'PUT')),
  valor NUMERIC NOT NULL,
  strategy_id TEXT,
  horario_entrada TIMESTAMP NOT NULL,
  horario_saida TIMESTAMP NOT NULL,
  resultado TEXT CHECK (resultado IN ('WIN', 'LOSS', 'DRAW')),
  profit_loss NUMERIC DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_trades_user ON trades_history(user_id);
CREATE INDEX idx_trades_bot ON trades_history(bot_id);
CREATE INDEX idx_trades_date ON trades_history(created_at DESC);
```

---

## 🔧 Troubleshooting

### Bot doesn't start

**Symptoms:**
- No console output
- Immediate crash
- "Missing required environment variables"

**Solutions:**
1. Check `.env` file exists
2. Verify all required variables are set
3. Ensure `SUPABASE_SERVICE_KEY` is not placeholder
4. Check Node.js version: `node --version` (must be 18+)

### Bot doesn't detect START command

**Symptoms:**
- Bot shows "Watching for START commands..."
- No response after inserting command

**Solutions:**
1. Verify command status is `'pending'` (not `'processed'`)
2. Check `bot_id` matches existing `bot_status.id`
3. Ensure Supabase service key has read permissions
4. Check console for polling errors

### Can't connect to Avalon

**Symptoms:**
- "Error connecting to Avalon"
- WebSocket connection fails
- "No balance available"

**Solutions:**
1. Verify `AVALON_WS_URL` is correct
2. Check `avalon_ssid` in `bot_status` is valid
3. Ensure Avalon account has balance
4. Try logging into Avalon web interface manually

### Trades not saving to database

**Symptoms:**
- Console shows "Position opened"
- No entries in `trades_history`
- "Error saving to trades_history"

**Solutions:**
1. Verify `trades_history` table exists
2. Check Supabase service key has insert permissions
3. Review console for SQL errors
4. Ensure `bot_id` and `user_id` are valid

### Risk management stops bot immediately

**Symptoms:**
- Bot starts then immediately stops
- "SAFETY STOP" or "DAILY LOSS LIMIT"

**Solutions:**
1. Check `bot_status.current_balance` is positive
2. Verify daily P&L tracking is accurate
3. Adjust `RISK_DAILY_LOSS_LIMIT` in `.env`
4. Reset `bot_status` counters if needed

---

## ❓ FAQ

### Q: Can I run multiple bots simultaneously?

**A:** Yes, but each bot needs a separate `bot_status` entry. Current implementation runs one bot per process. Deploy multiple instances for parallel bots.

### Q: How much balance do I need in Avalon?

**A:** Minimum recommended: $100. Each trade uses `trade_amount` (default $1). Budget for at least 50-100 trades.

### Q: Which strategy should I use?

**A:**
- `strategy_balanced` - Default, best for beginners
- `strategy_aggressive` - Higher risk, faster trades
- `strategy_conservative` - Lower risk, fewer trades
- `strategy_support_resistance` - Advanced technical analysis

### Q: How do I change bot configuration?

**A:** Update the `bot_status` table:
```sql
UPDATE bot_status
SET strategy = 'strategy_aggressive',
    assets = ARRAY['EURUSD', 'GBPUSD', 'BTCUSD'],
    trade_amount = 2
WHERE id = '<bot-id>';
```

### Q: Can I backtest strategies?

**A:** Not yet. Backtesting feature is planned for Phase 5. Currently, use demo account for testing.

### Q: How do I stop a runaway bot?

**A:**
1. Insert STOP command in `bot_control`
2. Or kill process: `Ctrl+C` (local) or `pm2 stop mivrabot` (PM2)
3. Or update `bot_status.status = 'stopped'`

### Q: Is my data secure?

**A:** Yes:
- Supabase uses PostgreSQL with row-level security
- Service key is server-side only
- Never commit `.env` to git
- Use `.gitignore` for sensitive files

---

## 📈 Roadmap

- [x] **Phase 1:** Foundation (types, utils, indicators)
- [x] **Phase 2:** Dashboard (analytics, charts)
- [x] **Phase 3:** User Management (admin UI)
- [x] **Phase 4:** Supabase Integration (bot-live.mjs)
- [ ] **Phase 5:** CRM Module (interactions, campaigns)
- [ ] **Phase 6:** Advanced Analytics (backtesting, ML)
- [ ] **Phase 7:** Multi-bot orchestration
- [ ] **Phase 8:** Mobile app

---

## 📝 Project Status

| Component | Status | Version | Lines | Tests |
|-----------|--------|---------|-------|-------|
| **Bot Engine** | ✅ Complete | 1.0.0 | 734 | Manual |
| **Indicators** | ✅ Complete | 1.0.0 | 500+ | Manual |
| **Strategies** | ✅ Complete | 1.0.0 | 600+ | Manual |
| **Admin Dashboard** | ✅ Complete | 1.0.0 | 3,210 | 36 tests |
| **Database Schema** | ⚠️ Manual | - | - | - |
| **Deployment** | ⚠️ Manual | - | - | - |

**Overall Progress:** 80% Complete

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## 📄 License

ISC License - See LICENSE file for details.

---

## 🔗 Links

- **Supabase:** [supabase.com](https://supabase.com)
- **Avalon Broker:** [avalonbroker.com](https://avalonbroker.com)
- **QuadCode SDK:** [GitHub](https://github.com/quadcode-tech/client-sdk-js)
- **Admin Dashboard:** See `src/admin/README.md`

---

## 📞 Support

For issues or questions:

1. Check [Troubleshooting](#troubleshooting) section
2. Review [FAQ](#faq)
3. Open GitHub issue
4. Contact: support@mivratec.com

---

**Built with ❤️ by MivraTec Team**

*Last Updated: 2025-10-03*
