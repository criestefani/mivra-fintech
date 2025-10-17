# PM2 Process Manager - Setup Guide

**Status:** ✅ Arquivo `ecosystem.config.js` criado e pronto para usar

---

## 📋 Pré-requisitos

```bash
# Instalar PM2 globalmente (uma única vez)
npm install -g pm2

# Verificar instalação
pm2 -v
# Deve retornar: versão do PM2 (ex: 5.3.0)
```

---

## 🚀 Quick Start

### 1. Iniciar todos os processos

```bash
# Na pasta apps/backend
cd apps/backend

# Inicia Redis + API Server + Market Scanner
npm run pm2:start

# Ou diretamente
pm2 start ecosystem.config.js
```

**Output esperado:**
```
┌─────┬──────────────────┬──────┬──────┬───────────┬──────────┐
│ id  │ name             │ mode │ ↺    │ status    │ memory   │
├─────┼──────────────────┼──────┼──────┼───────────┼──────────┤
│ 0   │ redis            │ fork │ 0    │ online    │ 12.2 MB  │
│ 1   │ api-server       │ fork │ 0    │ online    │ 45.3 MB  │
│ 2   │ market-scanner   │ fork │ 0    │ online    │ 38.1 MB  │
└─────┴──────────────────┴──────┴──────┴───────────┴──────────┘
```

---

## 📊 Comandos Principais

### Ver status de todos os processos
```bash
npm run pm2:status

# Ou
pm2 status
```

### Ver logs em tempo real
```bash
npm run pm2:logs

# Ou
pm2 logs

# Ver logs de um processo específico
pm2 logs redis
pm2 logs api-server
pm2 logs market-scanner

# Ver apenas últimas 100 linhas
pm2 logs --lines 100

# Tail contínuo
pm2 logs --raw
```

### Monitoramento em tempo real
```bash
npm run pm2:monit

# Ou
pm2 monit
```
Mostra:
- CPU usage
- Memory usage
- Uptime
- Status de cada processo

### Reiniciar todos os processos
```bash
npm run pm2:restart

# Ou reiniciar um específico
pm2 restart api-server
pm2 restart redis
```

### Parar todos os processos
```bash
npm run pm2:stop

# Ou parar um específico
pm2 stop api-server
```

### Remover do PM2
```bash
npm run pm2:delete

# Ou remover um específico
pm2 delete api-server
```

---

## 🔄 Auto-Restart ao Ligar o PC

### Configurar PM2 para iniciar com o sistema

```bash
# Windows (rodar como Admin PowerShell):
pm2 install pm2-windows-startup
pm2 set pm2-windows-startup MACHINE_NAME "Mivra Bot"

# Ou no Command Prompt:
npm run pm2:startup
pm2 save
```

```bash
# macOS/Linux:
npm run pm2:startup
pm2 save

# Verificar:
pm2 startup
```

Depois de executar:
- PM2 iniciará automaticamente quando o PC ligar
- Redis + API Server + Market Scanner rodarão em background
- Se algum processo cair, reinicia automaticamente

---

## 🛠️ Configuração Detalhada

### Arquivo: `ecosystem.config.js`

O arquivo que criamos gerencia 3 processos:

#### 1️⃣ Redis
```javascript
{
  name: 'redis',
  script: 'redis-server',
  autorestart: true,
  max_restarts: 10,
  min_uptime: '10s',
  max_memory_restart: '500M'
}
```
- Inicia: `redis-server`
- Reinicia automaticamente se cair
- Máx de 10 tentativas de restart
- Máx 500MB de memória

#### 2️⃣ API Server
```javascript
{
  name: 'api-server',
  script: './src/api-server.mjs',
  watch: ['src/'], // Auto-reload em dev
  instances: 1,
  max_memory_restart: '1G'
}
```
- Inicia: `api-server.mjs`
- Auto-reload quando mudar arquivos em `src/`
- Máx 1GB de memória

#### 3️⃣ Market Scanner
```javascript
{
  name: 'market-scanner',
  script: './start-market-scanner.mjs',
  watch: ['src/'],
  instances: 1,
  max_memory_restart: '800M'
}
```
- Inicia: `market-scanner.mjs`
- Auto-reload quando mudar arquivos
- Máx 800MB de memória

---

## 📈 Monitoramento

### Dashboard Web (PM2 Plus - Opcional)

PM2 oferece um dashboard web pago, mas você pode usar o `pm2 monit` grátis:

```bash
npm run pm2:monit
```

Mostra em tempo real:
- CPU, Memory, Uptime
- Quantidade de restarts
- Status de cada processo

### Verificar saúde

```bash
# Ver processos online/offline
pm2 status

# Ver memória usada
pm2 status | grep memory

# Ver se há crashes
pm2 logs | grep "Error"
```

---

## 🔧 Troubleshooting

### PM2 não inicia

```bash
# Verificar se PM2 está instalado
pm2 -v

# Se não estiver:
npm install -g pm2

# Verificar permissões
pm2 kill  # Mata todos os processos
pm2 start ecosystem.config.js
```

### Redis não inicia

```bash
# Verificar se redis-server está no PATH
redis-cli ping

# Se der erro, instalar Redis:
# macOS: brew install redis
# Windows: Download https://github.com/microsoftarchive/redis/releases
# Linux: sudo apt-get install redis-server
```

### API Server não inicia

```bash
# Ver logs
npm run pm2:logs

# Ou
pm2 logs api-server --lines 50

# Verificar se há erros de dependência
npm install
```

### Market Scanner não inicia

```bash
# Ver logs específicos
pm2 logs market-scanner --lines 50

# Reiniciar
pm2 restart market-scanner
```

### Limpar PM2 completamente

```bash
# Parar tudo
pm2 stop all

# Deletar tudo do PM2
pm2 delete all

# Limpar logs
pm2 flush

# Recomeçar
npm run pm2:start
```

---

## 🔐 Segurança

### Salvar estado do PM2

```bash
# Salvar lista de processos atuais
npm run pm2:save

# Restaurar depois
pm2 resurrect

# Ou automático com startup
npm run pm2:startup
```

### Logs em produção

Todos os logs são salvos em:
```
logs/
├── redis-error.log
├── redis-out.log
├── api-error.log
├── api-out.log
├── scanner-error.log
└── scanner-out.log
```

---

## 📊 Estatísticas Úteis

### Ver uptime total

```bash
pm2 show redis
pm2 show api-server
pm2 show market-scanner
```

Mostra:
- Quando iniciou
- Uptime
- Quantidade de restarts
- Memória usada
- CPU usage

### Contar processos

```bash
pm2 list
# Mostra quantos estão online/offline
```

---

## 🚀 Workflow de Desenvolvimento

### Ao iniciar o dia:
```bash
cd apps/backend
npm run pm2:start
npm run pm2:status
```

### Enquanto desenvolve:
```bash
# Deixar logs abertos em outro terminal
npm run pm2:logs

# Editar código - auto-reloads automaticamente!
# Não precisa reiniciar manualmente
```

### Quando termina:
```bash
npm run pm2:stop

# Ou deixar rodando em background
# Volta amanhã e tudo está lá
```

---

## 🎯 Resumo de Comandos

| Comando | Descrição |
|---------|-----------|
| `npm run pm2:start` | Inicia Redis + API + Scanner |
| `npm run pm2:status` | Ver status de todos |
| `npm run pm2:logs` | Ver logs em tempo real |
| `npm run pm2:monit` | Monitorar CPU/Memory |
| `npm run pm2:restart` | Reiniciar todos |
| `npm run pm2:stop` | Parar todos |
| `npm run pm2:delete` | Remover do PM2 |
| `npm run pm2:startup` | Auto-start no boot |
| `npm run pm2:save` | Salvar estado |

---

## ✅ Setup Completo - Checklist

- [x] PM2 instalado globalmente
- [x] `ecosystem.config.js` criado
- [x] Scripts adicionados ao `package.json`
- [x] Redis instalado
- [x] Pronto para usar!

---

## 🎉 Primeiro Uso

```bash
# 1. Ir para a pasta backend
cd apps/backend

# 2. Instalar PM2 (primeira vez apenas)
npm install -g pm2

# 3. Iniciar tudo
npm run pm2:start

# 4. Ver status
npm run pm2:status

# 5. Ver logs
npm run pm2:logs

# 6. Em outro terminal, testar API
curl http://localhost:4001/health

# 7. Monitorar (em outro terminal)
npm run pm2:monit
```

---

**Próximo passo:** Execute `npm run pm2:start` e veja tudo funcionando! 🚀
