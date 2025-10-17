# Redis Auto-Start Options

Existem **3 formas** de iniciar Redis automaticamente com o API Server. Escolha a melhor para você!

---

## **Opção 1: Script Node.js Automatizado ⭐ RECOMENDADO PARA DESENVOLVIMENTO**

### Como usar:
```bash
npm run server:auto
```

### O que faz:
1. Verifica se Redis está rodando
2. Se não estiver, inicia automaticamente
3. Aguarda Redis estar pronto
4. Inicia o API Server
5. Mantém tudo rodando em um só terminal

### Vantagens:
✅ Simples e rápido
✅ Sem dependências extras
✅ Funciona em Windows, Mac e Linux
✅ Tudo em um só terminal
✅ Ctrl+C fecha tudo gracefully

### Desvantagens:
❌ Requer Redis instalado no sistema (redis-server no PATH)

### Se Redis não estiver no PATH:
```bash
# Windows: Download https://github.com/microsoftarchive/redis/releases
# Mac: brew install redis
# Linux: sudo apt-get install redis-server

# Depois adicione ao PATH do seu sistema
```

### Testes:
```bash
# Verificar se Redis está instalado
redis-cli --version

# Testar se está funcionando
npm run server:auto
# Deve mostrar:
# ✅ Redis is already running on port 6379
# ✅ Redis started successfully!
# 🚀 Starting API Server...
# ✅ API Server rodando em http://localhost:4001
```

---

## **Opção 2: Docker Compose ⭐ RECOMENDADO PARA PRODUÇÃO**

### Pré-requisitos:
```bash
# Instalar Docker
# macOS/Windows: https://www.docker.com/products/docker-desktop
# Linux: sudo apt-get install docker.io
```

### Como usar:
```bash
# Inicia Redis + API Server em containers
docker-compose up

# Ou em background
docker-compose up -d

# Parar
docker-compose down
```

### O que faz:
1. Cria um container Redis isolado
2. Cria um container API Server isolado
3. Conecta os dois automaticamente
4. Gerencia logs e volumes

### Vantagens:
✅ Isolamento completo
✅ Sem dependências no sistema local
✅ Perfeito para produção
✅ Fácil de escalar
✅ Funciona sempre igual em qualquer máquina
✅ Inclui health checks automáticos
✅ Data de Redis persistida em volume

### Desvantagens:
❌ Requer Docker instalado
❌ Overhead de virtualização (minimal)
❌ Um pouco mais lento que local (na primeira vez)

### Testes:
```bash
# Ver containers rodando
docker ps

# Ver logs do Docker Compose
docker-compose logs

# Testar Redis dentro do container
docker exec mivra-redis redis-cli ping
# Deve retornar: PONG

# Testar API Server
curl http://localhost:4001/health
```

### Arquivos necessários (vou criar):
- `docker-compose.yml` ✅ Criado
- `Dockerfile.api` ← Precisa criar
- `Dockerfile.scanner` ← Precisa criar

---

## **Opção 3: PM2 Process Manager ⭐ RECOMENDADO PARA PRODUCTION/SEMPRE LIGADO**

### Instalar:
```bash
npm install -g pm2
```

### Criar arquivo ecosystem.config.js:
```javascript
module.exports = {
  apps: [
    {
      name: 'redis',
      script: 'redis-server',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      error_file: './logs/redis-error.log',
      out_file: './logs/redis-out.log'
    },
    {
      name: 'api-server',
      script: './src/api-server.mjs',
      instances: 1,
      exec_mode: 'fork',
      watch: ['src/'],
      ignore_watch: ['node_modules', 'logs'],
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      env: {
        NODE_ENV: 'development'
      },
      wait_ready: true,
      listen_timeout: 3000
    }
  ]
};
```

### Como usar:
```bash
# Inicia tudo
pm2 start ecosystem.config.js

# Ver status
pm2 status

# Ver logs
pm2 logs

# Parar tudo
pm2 stop all

# Deletar do PM2
pm2 delete all

# Reiniciar ao ligar o PC
pm2 startup
pm2 save
```

### Vantagens:
✅ Monitoramento avançado
✅ Auto-restart se cair
✅ Histórico de logs
✅ Cluster mode disponível
✅ Dashboard web (pm2 plus)
✅ Perfeito para production

### Desvantagens:
❌ Mais complexo de configurar
❌ Requer instalação global

---

## **Recomendações por Cenário**

### 🔧 Desenvolvimento Local
```bash
npm run server:auto
```
- Rápido, simples, tudo em um terminal
- Ideal enquanto você está desenvolvendo

### 🐳 Desenvolvimento em Containers
```bash
docker-compose up
```
- Simula melhor o ambiente de produção
- Mais isolado e consistente

### 🏭 Production/Sempre Ligado
```bash
pm2 start ecosystem.config.js
```
- Monitoramento completo
- Auto-restart se cair
- Escalável

---

## **Comparação Rápida**

| Feature | Opção 1 | Opção 2 | Opção 3 |
|---------|---------|---------|---------|
| Simplicidade | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Setup Time | <1 min | 2-3 min | 5-10 min |
| Requisitos | Redis instalado | Docker | Node.js + PM2 |
| Production-Ready | ❌ | ✅ | ✅ |
| Auto-Restart | ❌ | ✅ | ✅ |
| Isolamento | ❌ | ✅ | ⚠️ Parcial |
| Monitoramento | Básico | Bom | Excelente |
| Escalabilidade | ❌ | ✅ | ✅ |

---

## **Próximas Passos**

### Se você quer usar Opção 1 (Recomendado agora):
```bash
# Já está pronto!
npm run server:auto
```

### Se você quer usar Opção 2 (Docker):
```bash
# Preciso criar os Dockerfiles
# Peça para eu criar: Dockerfile.api e Dockerfile.scanner
```

### Se você quer usar Opção 3 (PM2):
```bash
# Preciso criar ecosystem.config.js
# Peça para eu criar o arquivo de configuração
```

---

## **Problemas Comuns**

### "redis-server not found"
```bash
# Solução: Instalar Redis
# Mac: brew install redis
# Windows: Download MSI
# Linux: sudo apt-get install redis-server
```

### "Port 6379 already in use"
```bash
# Redis já está rodando de outra forma
# Opção 1: Parar o Redis existente
redis-cli shutdown

# Opção 2: Usar porta diferente
# Editar docker-compose.yml ou arquivo de config
```

### "Connection refused"
```bash
# Verificar se Redis está realmente rodando
redis-cli ping
# Deve retornar: PONG

# Se não funcionar, iniciar manualmente
redis-server
```

---

## **Status Atual**

✅ **Opção 1:** Pronta para usar (script criado e package.json atualizado)
✅ **Opção 2:** Pronta para usar (docker-compose.yml criado, mas faltam Dockerfiles)
⏳ **Opção 3:** Aguardando sua decisão

---

**Qual opção você prefere usar?**
