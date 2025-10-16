# 🚀 Supabase Local Development Setup

## Overview

This guide helps you set up a complete local Supabase environment for development, independent of production outages.

**Status**: Production Supabase is experiencing critical outages (10+ days)
**Goal**: Enable continued development with local database
**Impact**: Zero code changes required - entire app works with local stack

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        LOCAL DEVELOPMENT                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Frontend (Vite)          Backend (Node.js)                  │
│  :5173                    :4001                              │
│     │                        │                               │
│     └────────┬───────────────┘                               │
│              │                                               │
│         PostgreSQL (Docker)                                  │
│         :5432                                                │
│         postgres:postgres@localhost:5432/mivra_dev           │
│              │                                               │
│         PostgREST API (Docker)                               │
│         http://localhost:3000                                │
│                                                               │
│  All data stored locally - No connection to production!      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

1. **Docker & Docker Compose** installed
2. **Node.js** (already have it)
3. **Redis** running locally (for caching) - optional but recommended

---

## Quick Start (5 minutes)

### Step 1: Start Docker Containers

```bash
cd I:\Mivra Fintech

# Start PostgreSQL + PostgREST
docker-compose up -d

# Verify they're running
docker ps
# You should see:
# - mivra-postgres-dev (PostgreSQL on 5432)
# - mivra-postgrest-dev (PostgREST on 3000)
```

### Step 2: Verify Database is Initialized

```bash
# Check PostgreSQL logs
docker logs mivra-postgres-dev

# Should see: "database system is ready to accept connections"

# Connect to verify tables exist
psql -h localhost -U postgres -d mivra_dev

# At the psql prompt:
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
# Should show: strategy_trades, scanner_performance, trade_history, etc.

# Exit
\q
```

### Step 3: Start Backend (Development Mode)

```bash
cd apps/backend

# Use local environment
$env:SUPABASE_ENV = "local"
npm start

# Or with set command on Windows:
set SUPABASE_ENV=local && npm start

# You should see:
# ✅ Supabase client initialized
# 🌐 Connecting to LOCAL Supabase: http://localhost:3000
# ✅ API Server rodando em http://localhost:4001
```

### Step 4: Start Frontend (Development Mode)

```bash
cd apps/frontend

npm run dev

# You should see:
# ✅ Local: http://localhost:5173
```

### Step 5: Test Everything

```bash
# In browser, open:
http://localhost:5173

# Check that:
✅ Page loads without connection errors
✅ No "Supabase connection failed" messages
✅ Market Scanner can load (may show "No signals" - that's OK, data is empty)

# Test backend connection:
curl http://localhost:4001/api/scanner/top20
# Should return: {"success":true,"data":[],"count":0}
```

---

## Environment Variable Switching

### Option 1: Command Line (Recommended)

**Use Local:**
```bash
set SUPABASE_ENV=local && npm start
```

**Use Production (when it's back online):**
```bash
set SUPABASE_ENV=production && npm start
```

### Option 2: .env Files

**Local Development** (automatically used):
- `apps/backend/.env.local` - Local Supabase settings
- `apps/frontend/.env.local` - Local API URLs

**Production** (default):
- `apps/backend/.env` - Production Supabase settings
- `apps/frontend/.env.production` - Production API URLs

### How It Works

The backend automatically detects which environment to use:

```
Priority:
1. SUPABASE_ENV environment variable
2. NODE_ENV environment variable (development = local)
3. Falls back to production (safe default)
```

---

## Common Tasks

### View Database in GUI

```bash
# Using pgAdmin (optional)
# Or use DBeaver (free database tool)

# Or use command line:
psql -h localhost -U postgres -d mivra_dev

# Useful queries:
SELECT COUNT(*) FROM strategy_trades;
SELECT * FROM scanner_performance;
SELECT * FROM trade_history LIMIT 10;
```

### Stop Local Supabase

```bash
docker-compose down

# To also remove all data:
docker-compose down -v
```

### Restart Docker Containers

```bash
# Restart just PostgreSQL
docker-compose restart postgres

# Restart all
docker-compose restart
```

### View Logs

```bash
# PostgreSQL logs
docker logs -f mivra-postgres-dev

# PostgREST logs
docker logs -f mivra-postgrest-dev

# Both together
docker-compose logs -f
```

### Reset Database (Remove All Data)

```bash
# Stop containers
docker-compose down -v

# Start fresh
docker-compose up -d

# Database will reinitialize from database/init.sql
```

---

## Testing Local Setup

### Test 1: Database Connection

```bash
# Backend should log:
🌐 Connecting to LOCAL Supabase: http://localhost:3000

# If you see this, database connection works!
```

### Test 2: API Endpoints

```bash
# Get scanner top 20
curl http://localhost:4001/api/scanner/top20
# Returns: {"success":true,"data":[],"timestamp":"...","count":0}

# Manual aggregation
curl -X POST http://localhost:4001/api/scanner/aggregate
# Returns: {"success":true,"message":"...","result":{...}}
```

### Test 3: Frontend Connection

```bash
# Browser console should have no errors
# Check Network tab - should see requests to:
# - http://localhost:3000 (Supabase)
# - http://localhost:4001 (Backend API)
```

### Test 4: Real-time Subscriptions

Market Scanner frontend uses real-time subscriptions. They should work the same locally as in production.

---

## Troubleshooting

### Error: "Cannot find Docker"

**Solution**: Install Docker Desktop
- Windows: https://www.docker.com/products/docker-desktop
- After install, restart terminal/cmd

### Error: "Port 5432 already in use"

**Solution**: Change PostgreSQL port in `docker-compose.yml`:
```yaml
services:
  postgres:
    ports:
      - "5433:5432"  # Change 5432 to 5433
```

Then update `.env.local`:
```
LOCAL_DB_PORT="5433"
```

### Error: "Cannot connect to PostgreSQL"

**Solution**: Check Docker is running
```bash
docker ps

# If empty, Docker isn't running. Start Docker Desktop.

# If containers don't exist:
docker-compose up -d
```

### Error: "Supabase connection failed"

**Solution**: Check environment variable
```bash
echo %SUPABASE_ENV%
# Should print: local

# If not set:
set SUPABASE_ENV=local
```

### Error: "PostgREST not responding"

**Solution**: Restart containers
```bash
docker-compose restart postgrest
```

### Database shows "No signals" / Empty data

**Solution**: This is expected for new local database
- Database starts empty
- Market Scanner needs to generate trades first
- Or import production data (see next section)

---

## Advanced: Import Production Data (Optional)

If you want to test with real data, you can export from production and import locally:

```bash
# Export from production
pg_dump -h vecofrvxrepogtigmeyj.supabase.co \
  -U postgres \
  -d postgres \
  > production_backup.sql

# Import to local
psql -h localhost -U postgres -d mivra_dev < production_backup.sql
```

**Note**: This requires production credentials. Use with caution.

---

## Switching Back to Production

When production Supabase is back online:

```bash
# Option 1: Use environment variable
set SUPABASE_ENV=production && npm start

# Option 2: Remove .env.local files (will use .env defaults)
del apps/backend/.env.local
del apps/frontend/.env.local

# Option 3: Just change backend to use production
# Edit apps/backend/config/supabase.mjs to read from .env instead of .env.local
```

---

## File Structure

```
I:\Mivra Fintech\
├── docker-compose.yml          ← Defines PostgreSQL + PostgREST containers
├── database/
│   └── init.sql               ← Database schema (auto-runs on startup)
├── apps/
│   ├── backend/
│   │   ├── .env              ← Production settings (don't modify)
│   │   ├── .env.local        ← Local settings (use for development)
│   │   ├── config/
│   │   │   └── supabase-env-switcher.mjs  ← Handles env switching
│   │   └── src/
│   │       └── api-server.mjs
│   └── frontend/
│       ├── .env              ← Production settings
│       ├── .env.local        ← Local settings
│       └── src/
```

---

## Performance Notes

### Local vs Production

| Aspect | Local | Production |
|--------|-------|-------------|
| Latency | ~1-5ms | 50-200ms+ |
| Reliability | 100% (you control) | Subject to outages |
| Data | Isolated locally | Shared production |
| Auth | Not needed for dev | Required |
| Cost | Free (on your machine) | Paid |

### Recommendations

- **Development**: Always use local
- **Testing**: Use production when stable
- **Production deployment**: Push to production for real trades

---

## Summary

✅ **Setup completed**:
- Docker Compose for containers
- Database schema ready
- Environment switching logic in place
- Both frontend and backend configured

✅ **Next steps**:
1. `docker-compose up -d`
2. `set SUPABASE_ENV=local && npm start` (backend)
3. `npm run dev` (frontend)
4. Open `http://localhost:5173`

✅ **You're now independent from production outages!**

---

**Questions?** Check troubleshooting section or verify Docker is running and containers are healthy.
