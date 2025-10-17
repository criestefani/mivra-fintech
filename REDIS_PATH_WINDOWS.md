# Adicionar Redis ao PATH - Windows (Automático)

## ✨ Solução Automática (Recomendado)

Criei 2 scripts que **automaticamente** encontram Redis e adicionam ao PATH!

---

## 🚀 Como Usar (3 Passos)

### Passo 1: Localizar os Scripts

Na pasta `apps/backend`, existem 2 arquivos:
```
apps/backend/
├── add-redis-to-path.bat  ← Use este!
└── add-redis-to-path.ps1  ← Auxilia o .bat
```

### Passo 2: Executar como Administrador

**Clique com botão direito** em `add-redis-to-path.bat`

**Escolha:** "Executar como administrador"

### Passo 3: Aguardar

O script vai:
1. ✅ Procurar por `redis-server.exe`
2. ✅ Encontrar o caminho
3. ✅ Adicionar ao PATH automaticamente
4. ✅ Testar se funcionou

Quando terminar, pressione Enter.

---

## ✅ Resultado Esperado

```
🔍 Procurando por Redis...

✅ Redis encontrado em: C:\redis

🔧 Adicionando ao PATH...
✅ Redis adicionado ao PATH!

🔄 Testando Redis...
✅ Redis está acessível!
   Redis server version v7.0.0

✨ Próximas etapas:
   1. Feche este PowerShell
   2. Abra um NOVO PowerShell
   3. Execute: npm run check:redis
   4. Execute: npm run pm2:start
```

---

## 📋 Próximas Etapas (Após Executar Script)

### 1. Feche o PowerShell atual
Simplesmente feche a janela.

### 2. Abra um NOVO PowerShell
- **Pressione:** `Win + X`
- **Escolha:** `Windows PowerShell` (não precisa ser admin)
- **Ou:** `Command Prompt`

### 3. Vá para a pasta backend
```powershell
cd "I:\Mivra Fintech\apps\backend"
```

### 4. Verificar se Redis está no PATH
```powershell
npm run check:redis
```

Deve retornar:
```
✅ Redis is installed
✅ Redis is running on port 6379
```

### 5. Se Redis não estiver rodando, inicie-o
```powershell
redis-server
```

Deixe esse terminal aberto com Redis rodando.

### 6. Em outro terminal, inicie PM2
```powershell
npm run pm2:start
```

---

## 🔧 Se Algo Não Funcionar

### Script não encontra Redis

**Verificar:**
1. Redis está realmente instalado?
   ```powershell
   dir "C:\redis"
   # Ou procure em Program Files
   ```

2. Se não encontrou, faça download:
   https://github.com/microsoftarchive/redis/releases

3. Extraia em `C:\redis` (ou tome nota do caminho)

4. Execute o script novamente

### Script retorna "Access Denied"

**Solução:**
- Feche o PowerShell
- Abra PowerShell **como Administrador**
- Execute: `add-redis-to-path.bat`

### Redis não está acessível após script

**Solução:**
- Feche TODOS os terminais
- Abra um NOVO PowerShell
- Tente novamente: `redis-server --version`

---

## 🎯 Fluxo Completo

```
1. Duplo-clique em add-redis-to-path.bat
   ↓
2. Escolher "Executar como administrador"
   ↓
3. Aguardar até terminar
   ↓
4. Fechar PowerShell
   ↓
5. Abrir NOVO PowerShell
   ↓
6. npm run check:redis
   ↓
7. Se OK: redis-server (em um terminal)
   ↓
8. Em outro terminal: npm run pm2:start
   ↓
✨ Tudo rodando!
```

---

## 📝 O Que o Script Faz

1. **Procura** por `redis-server.exe` em:
   - `C:\redis`
   - `C:\Program Files\redis`
   - `C:\Program Files (x86)\redis`
   - E outros locais comuns

2. **Se encontra**, adiciona o caminho ao PATH do Windows

3. **Testa** se Redis ficou acessível

4. **Avisa** se você precisa fechar/reabrir o terminal

---

## ✨ Resultado Final

Após executar o script:
```powershell
redis-server --version
# Redis server version 7.0.0

redis-cli ping
# PONG

npm run check:redis
# ✅ Redis is installed
# ✅ Redis is running on port 6379
```

---

## 🎉 Próximo Passo

Depois que Redis está no PATH:

```powershell
npm run pm2:start
```

E tudo funciona! 🚀

---

**Se tiver dúvidas, abra uma issue com o output do script!**
