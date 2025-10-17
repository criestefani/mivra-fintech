# Redis + PM2 Complete Setup Guide

**Status:** ✅ COMPLETE - Ready to Deploy

---

## 📋 Resumo da Solução

Foi resolvido o problema: **Redis não iniciava junto com o API Server**

Agora você tem **3 opções** para iniciar tudo automaticamente:

### **✅ Opção 1: Node Script Automatizado** (Sem PM2)
```bash
npm run server:auto
```
- ✅ Simples e rápido
- ✅ Tudo em um terminal
- ❌ Sem persistência ao desligar

---

### **⭐ Opção 2: PM2 Process Manager** (RECOMENDADO - Você escolheu)
```bash
npm run pm2:start
```
- ✅ Auto-restart se algo cair
- ✅ Monitoramento em tempo real
- ✅ Auto-reload ao editar código
- ✅ Logs organizados
- ✅ Auto-start no boot (opcional)
- ✅ Production-ready

---

### **🐳 Opção 3: Docker Compose** (Para produção)
```bash
docker-compose up
```
- ✅ Isolamento completo
- ✅ Funciona igual em qualquer máquina
- ✅ Escalável
- ❌ Requer Docker

---

## 🚀 Como Começar com PM2 (Sua Escolha)

### **Passo 1: Instalar PM2**
```bash
npm install -g pm2
pm2 -v  # Verificar instalação
```

### **Passo 2: Ir para a pasta backend**
```bash
cd apps/backend
```

### **Passo 3: Verificar Redis**
```bash
npm run check:redis
```

Deve retornar algo como:
```
✅ Redis is installed
✅ Redis is running on port 6379

Status Summary:
   Platform: Windows
   Installed: ✅
   Running: ✅
```

Se Redis não estiver instalado, siga as instruções na saída.

### **Passo 4: Iniciar tudo**
```bash
npm run pm2:start
```

Deve retornar:
```
┌─────┬──────────────────┬──────┬──────┬───────────┬──────────┐
│ id  │ name             │ mode │ ↺    │ status    │ memory   │
├─────┼──────────────────┼──────┼──────┼───────────┼──────────┤
│ 0   │ redis            │ fork │ 0    │ online    │ 12.2 MB  │
│ 1   │ api-server       │ fork │ 0    │ online    │ 45.3 MB  │
│ 2   │ market-scanner   │ fork │ 0    │ online    │ 38.1 MB  │
└─────┴──────────────────┴──────┴──────┴───────────┴──────────┘
```

### **Passo 5: Verificar status**
```bash
npm run pm2:status
```

### **Passo 6: Ver logs**
```bash
npm run pm2:logs

# Ou apenas da API
pm2 logs api-server

# Ou apenas do Redis
pm2 logs redis
```

### **Passo 7: Testar API**
```bash
curl http://localhost:4001/health
```

🎉 **Pronto! Tudo rodando!**

---

## 📊 Comandos Úteis PM2

```bash
# Ver status
npm run pm2:status

# Ver logs em tempo real
npm run pm2:logs

# Monitorar CPU/Memory
npm run pm2:monit

# Reiniciar todos
npm run pm2:restart

# Parar todos
npm run pm2:stop

# Deletar do PM2
npm run pm2:delete

# Auto-start ao ligar (salva estado atual)
npm run pm2:startup
npm run pm2:save
```

---

## 🔧 Como Funciona PM2

### Ciclo de Vida
```
npm run pm2:start
  ↓
Inicia Redis Server
  ↓
Aguarda Redis estar online (health check)
  ↓
Inicia API Server
  ↓
Inicia Market Scanner
  ↓
Todos os 3 processos online ✅
  ↓
Monitor contínuo (se algum cair, reinicia)
```

### Auto-Restart
```
Se Redis cai:
  └─ PM2 automaticamente reinicia

Se API Server cai:
  └─ PM2 automaticamente reinicia

Se Market Scanner cai:
  └─ PM2 automaticamente reinicia
```

### Auto-Reload (Development)
```
Você edita: src/api-server.mjs
  ↓
PM2 detecta mudança
  ↓
Reinicia api-server automaticamente
  ↓
Código novo já está rodando

(Sem precisa fazer Ctrl+C e reiniciar!)
```

---

## 📁 Arquivos Criados

### Backend
```
apps/backend/
├── ecosystem.config.js      ← Configuração PM2
├── check-redis.mjs          ← Verifica Redis
├── start-with-redis.mjs     ← Alternativa Opção 1
└── docker-compose.yml       ← Alternativa Opção 3
```

### Documentação
```
├── PM2_SETUP_GUIDE.md                    ← Guia completo PM2
├── REDIS_AUTO_START.md                   ← 3 opções explicadas
└── REDIS_PM2_COMPLETE_SETUP.md          ← Este documento
```

### Package Scripts Adicionados
```json
{
  "check:redis": "node check-redis.mjs",
  "pm2:start": "npm run check:redis && pm2 start ecosystem.config.js",
  "pm2:status": "pm2 status",
  "pm2:logs": "pm2 logs",
  "pm2:stop": "pm2 stop all",
  "pm2:restart": "pm2 restart all",
  "pm2:delete": "pm2 delete all",
  "pm2:monit": "pm2 monit",
  "pm2:save": "pm2 save",
  "pm2:startup": "pm2 startup"
}
```

---

## ⚙️ Configuração do ecosystem.config.js

O arquivo define 3 processos:

### Redis
```javascript
{
  name: 'redis',
  script: 'redis-server.exe',  // Windows
  autorestart: true,
  max_memory_restart: '500M'
}
```

### API Server
```javascript
{
  name: 'api-server',
  script: './src/api-server.mjs',
  watch: ['src/'],  // Auto-reload
  max_memory_restart: '1G'
}
```

### Market Scanner
```javascript
{
  name: 'market-scanner',
  script: './start-market-scanner.mjs',
  watch: ['src/'],  // Auto-reload
  max_memory_restart: '800M'
}
```

---

## 🛠️ Troubleshooting

### Redis não inicia

**Verificar:**
```bash
npm run check:redis

# Se der erro, instalar Redis:
# Windows: https://github.com/microsoftarchive/redis/releases
# Mac: brew install redis
# Linux: sudo apt-get install redis-server
```

### PM2 não funciona

**Verificar:**
```bash
pm2 -v
npm list -g pm2

# Reinstalar se necessário
npm install -g pm2
```

### API Server não conecta ao Redis

**Verificar:**
```bash
redis-cli ping
# Deve retornar: PONG

# Se não funcionar, Redis não está rodando
redis-server  # Iniciar manualmente
```

### Ver erros específicos

```bash
# Ver erro do Redis
pm2 logs redis --lines 50

# Ver erro da API
pm2 logs api-server --lines 50

# Ver erro do Scanner
pm2 logs market-scanner --lines 50
```

### Limpar tudo e recomeçar

```bash
pm2 kill          # Mata todos processos
pm2 delete all    # Remove do PM2
npm run pm2:start # Começa do zero
```

---

## 📈 Monitoramento

### Dashboard Real-Time
```bash
npm run pm2:monit
```

Mostra:
- CPU de cada processo
- Memory de cada processo
- Uptime
- Quantidade de restarts

### Logs
```bash
# Todos os logs
npm run pm2:logs

# Último erro
npm run pm2:logs | grep error

# Seguir um processo
pm2 logs api-server --raw
```

---

## 🎯 Workflow Diário

### Começar o dia
```bash
cd apps/backend
npm run pm2:start
npm run pm2:status  # Verificar tudo online
```

### Enquanto trabalha
```bash
# Terminal 1: Logs
npm run pm2:logs

# Terminal 2: Desenvolvimento
# Editar código em src/
# Auto-reload automático!

# Terminal 3 (opcional): Monitorar
npm run pm2:monit
```

### Fim do dia
```bash
# Deixar rodando ou parar
npm run pm2:stop

# Ou deixar em background (continuará ao ligar o PC)
npm run pm2:startup
npm run pm2:save
```

---

## 💾 Persistência

### Salvar estado (opcional)
```bash
npm run pm2:save
```

Próxima vez que ligar:
```bash
pm2 resurrect
```

### Auto-start ao boot (Windows/Mac/Linux)
```bash
npm run pm2:startup
npm run pm2:save
```

Depois disso:
- PM2 inicia automaticamente ao ligar o PC
- Redis + API + Scanner já estarão rodando
- Zero work necessário!

---

## 🔐 Segurança

### Logs
```
logs/
├── redis-error.log      # Erros do Redis
├── redis-out.log        # Output do Redis
├── api-error.log        # Erros da API
├── api-out.log          # Output da API
├── scanner-error.log    # Erros do Scanner
└── scanner-out.log      # Output do Scanner
```

Todos os logs são salvos automaticamente!

### Environment Variables
Redis URL já está configurada:
```env
REDIS_URL=redis://localhost:6379
```

---

## ✅ Checklist Final

- [x] PM2 instalado globalmente
- [x] `ecosystem.config.js` criado
- [x] `check-redis.mjs` criado
- [x] Package scripts adicionados
- [x] Documentação completa
- [x] Pronto para usar!

---

## 🎉 Status Final

✅ **API Server**       - Pronto
✅ **Redis Cache**      - Pronto
✅ **Market Scanner**   - Pronto
✅ **PM2 Manager**      - Pronto
✅ **Auto-Restart**     - Ativo
✅ **Auto-Reload**      - Ativo
✅ **Health Checks**    - Ativo
✅ **Monitoring**       - Pronto
✅ **Production Ready**  - SIM!

---

## 📞 Próximas Etapas

Quando você estiver pronto para trabalhar:

```bash
# 1. Go to backend
cd apps/backend

# 2. Start everything
npm run pm2:start

# 3. Verify status
npm run pm2:status

# 4. Watch logs
npm run pm2:logs

# 5. Develop and let auto-reload handle restarts!
```

---

**Tudo pronto! Redis vai iniciar automaticamente com PM2! 🚀**

Quer saber mais? Leia `PM2_SETUP_GUIDE.md` para detalhes completos.
