# Setup Referral System - MivraTech

## ⚠️ IMPORTANTE: A tabela do Supabase ainda NÃO foi criada!

O código foi implementado, mas você precisa executar a migração SQL no Supabase para ativar o sistema.

---

## Passo 1: Acessar Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Entre em sua conta
3. Selecione o projeto **MivraTech**
4. No menu esquerdo, clique em **SQL Editor**

---

## Passo 2: Criar a tabela

### Opção A: Copiar e Colar (Recomendado para verificar)

1. Abra o arquivo: `apps/backend/migrations/referrals-system.sql`
2. Copie TODO o conteúdo
3. No Supabase SQL Editor, clique em **New Query**
4. Cole o código inteiro
5. Clique em **RUN** (botão verde)

### Opção B: Usar a CLI (se preferir)

```bash
# Se tem supabase CLI instalado
cd "I:\Mivra Fintech"
supabase db push
```

---

## Passo 3: Verificar se funcionou

Após executar, você deve ver:
- ✅ `Referral system tables created successfully!`
- ✅ `Rewards: ONLY on First Time Deposit (500 XP)`
- ✅ `Referral tracking ready for MivraTech!`

---

## Passo 4: Verificar tabelas criadas

No Supabase, acesse **Table Editor** e procure por:
- ✅ `referrals` (nova tabela)
- ✅ `user_gamification` (deve ter 3 colunas novas)

---

## Passo 5: Reiniciar Backend

Depois de criar a tabela, reinicie seu backend:

```bash
cd "I:\Mivra Fintech\apps\backend"
npm run dev
# ou
pnpm dev
```

---

## Passo 6: Testar no Frontend

1. Abra o app em `http://localhost:3000`
2. Vá para a página **Profile**
3. Procure por "Sistema de Referência 🎁" na parte inferior
4. Se vir a seção com código de referência → ✅ Funcionando!

Se não aparecer, abra o **DevTools (F12)** e procure por:
- `🔄 useReferralData: fetching data for userId:`
- `✅ Code data:` e `✅ Stats data:`

---

## O que vai aparecer após setup

- 🎁 **Seu Código de Referência** - Um código único de 8 caracteres
- 🔗 **Link de Compartilhamento** - URL completa para compartilhar
- 📊 **Estatísticas** - Total, Depositados, Registrados, XP Ganho
- 📋 Botões de copiar código, copiar link, e compartilhar

---

## Como funciona agora

1. **Você gera seu código** (automático na página Profile)
2. **Compartilha o link** `https://mivratech.com?ref=ABC12XYZ`
3. **Amigo se registra** com seu código (no URL)
4. **Amigo faz primeiro depósito**
5. **Você recebe 500 XP + 1 referral!**
6. **Badges** desbloqueadas em 3 e 10 referrals

---

## Troubleshooting

### ReferralCard mostra "Sistema de referência disponível quando a tabela for criada..."

**Solução:** Tabela não foi criada. Execute o SQL no Supabase (Passo 2).

### API retorna erro 500

**Solução:**
- Tabela não existe (execute SQL)
- Backend não foi reiniciado (reinicie)
- Confira logs do backend: `❌ Error in /my-code:`

### Nenhum código aparece

**Solução:**
- Abra DevTools (F12)
- Console deve mostrar os logs de debug
- Procure por `📍 Fetching referral code from`
- Se houver erro, copie e relate

---

## Sucesso! 🎉

Quando tudo funcionar:
- ✅ Código de referência gerado
- ✅ Link pronto para compartilhar
- ✅ Badges desbloqueáveis
- ✅ Sistema de recompensas ativo

**Próximos passos:**
- Testar fluxo completo de referência (signup com link)
- Testar recompensa de XP no primeiro depósito
- Integrar com sistema de quests (opcional)
