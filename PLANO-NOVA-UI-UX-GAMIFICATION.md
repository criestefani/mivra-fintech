# 🎮 PLANO: Nova UI/UX Gamificada - MivraTech

## 📋 Sumário Executivo

Redesenhar completamente a interface do MivraTech com:
- **UI fluida, artística e não-convencional** (inspirada em Persona 5, Cyberpunk 2077, Destiny 2)
- **Sistema de gamificação estratégico (50% White Hat / 50% Black Hat)** focado em volume de operações
- **Design adulto e sofisticado** com efeitos visuais modernos (glassmorphism, glow, organic shapes)
- **Arquitetura game-like Mobile First + PWA** onde uma tela leva fluidamente à outra

**Princípio Central**: Transformar operação de bot de tarefa passiva em experiência viciante, onde cada trade é uma vitória épica.

**CONTEXTO REAL DO NEGÓCIO**:
- Trades de 10-60 segundos (operações RÁPIDAS)
- Usuários fazem sessões curtas (10-30min típico)
- O que importa é FREQUÊNCIA (operar várias vezes/semana), não duração de sessão

**Objetivos Críticos**:
1. **PRIMÁRIO**: **Fazer o cliente DEPOSITAR dinheiro real na corretora** (conversão demo → real)
2. **SECUNDÁRIO**: **Maximizar FREQUÊNCIA e VOLUME de operação** (número de trades, não tempo ligado)

---

## 🎯 FASE 1: ARQUITETURA VISUAL & ESTÉTICA

### 1.1 Identidade Visual Core

**Tema**: **"Cyber Trading Arena"** - Fusão de cyberpunk futurista com interface diegética de HUD militar

**Palette de Cores** (Original Mivra App):
```
Primária: hsl(26, 100%, 55%) (#FF8C1A - Vibrant Orange) - Energia, ação, tecnologia
Secundária: hsl(35, 96%, 52%) (#F5A623 - Golden Yellow) - Profit, premium, sofisticação
Accent: hsl(152, 71%, 45%) (#2DC294 - Success Green) - Ganhos, sucesso
Danger: hsl(0, 84%, 55%) (#EB2F2F - Alert Red) - Perdas, alertas
Background: hsl(24, 10%, 10%) (#1C1917 - Solar Dusk) - Profundidade, foco
Surface: rgba(255,255,255,0.05) com backdrop-blur - Glassmorphism
```

**Typography**:
- **Headings**: "Rajdhani" ou "Orbitron" (futurista, angular)
- **Body**: "Inter" ou "Nunito Sans" (legível, profissional)
- **Monospace**: "JetBrains Mono" (dados, números, código)

### 1.2 Efeitos Visuais Fundamentais

#### A. **Glassmorphism com Neon Glow**
```css
.glass-card {
  background: rgba(28, 25, 23, 0.7);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 140, 26, 0.3);
  box-shadow:
    0 8px 32px 0 rgba(31, 38, 135, 0.37),
    0 0 20px rgba(255, 140, 26, 0.5); /* Orange glow */
  border-radius: 24px;
}
```

**Onde aplicar**:
- Cards de estatísticas
- Painéis de controle de trading
- Modais de confirmação
- Navegação flutuante

#### B. **Organic Shapes & Fluid Backgrounds**

Backgrounds animados com formas orgânicas:
```jsx
// Gradient mesh dinâmico
<div className="absolute inset-0 -z-10">
  <div className="blob blob-purple" /> {/* Morphing SVG */}
  <div className="blob blob-blue" />
  <div className="noise-overlay" /> {/* Textura sutil */}
</div>
```

#### C. **Neon Borders & Glow Effects**

Elementos interativos com glow pulsante:
```css
.active-trade {
  border: 2px solid hsl(152, 71%, 45%);
  box-shadow:
    0 0 10px hsl(152, 71%, 45%),
    0 0 20px rgba(16, 185, 129, 0.5),
    0 0 30px rgba(16, 185, 129, 0.3);
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 10px hsl(152, 71%, 45%); }
  50% { box-shadow: 0 0 30px hsl(152, 71%, 45%), 0 0 60px rgba(16, 185, 129, 0.7); }
}
```

**Onde aplicar**:
- Trades ativos
- Botões de ação crítica (CALL/PUT)
- Notificações de profit/loss
- Elementos em hover

### 1.3 Layout Não-Convencional

**Abandonar**: Grids rígidos, módulos quadrados padronizados

**Adotar**:

#### **Hub Central Navigation** (Inspirado em jogos)
```
           [ACHIEVEMENTS]
                 |
    [SOCIAL]---[ARENA]---[MISSIONS]
                 |
            [INVENTORY]
```

Cada área é uma "cena" com:
- Background único e atmosférico
- Transições cinematográficas (wipe, fade, zoom)
- Música/sons ambiente diferentes

#### **Diagonal Layouts** (Persona 5-inspired)
```jsx
// Divisão diagonal com informação sempre no lado iluminado
<div className="relative overflow-hidden">
  <div className="diagonal-bg absolute inset-0
                  bg-gradient-to-br from-purple-600/20 via-transparent"
       style={{ clipPath: 'polygon(0 0, 100% 0, 100% 80%, 0 100%)' }} />
  <div className="content p-8 relative z-10">
    {/* Informação sempre legível */}
  </div>
</div>
```

#### **Cards Assimétricas Flutuantes**

Cards com rotação sutil, sobreposição e profundidade:
```jsx
<motion.div
  className="card"
  style={{
    transform: 'rotate(-2deg) translateY(10px)',
    zIndex: index
  }}
  whileHover={{
    scale: 1.05,
    rotate: 0,
    zIndex: 50
  }}
>
```

---

## 🎮 FASE 2: SISTEMA DE GAMIFICAÇÃO

### 2.1 Core Drives Priorizados (Octalysis Framework)

**Balanço 50/50** (White Hat / Black Hat):

**White Hat** (50% - Engajamento sustentável):
1. **Development & Accomplishment**: Progressão clara de XP/Níveis conforme bot opera
2. **Empowerment of Creativity**: Configurações do bot personalizáveis (estratégias, valores)
3. **Epic Meaning**: "Você está se tornando um operador profissional"

**Black Hat** (50% - Urgência e retenção):
4. **Scarcity & Impatience**: Sinais de mercado urgentes, "oportunidade expira em X min"
5. **Loss Avoidance**: Streaks de sessão, "você perderá status se parar o bot"
6. **Unpredictability**: Recompensas surpresa após sessões, loot boxes de XP/crystals

### 2.2 Mecânicas Específicas para Bot de Trading

**IMPORTANTE**: O MivraTech é um **BOT AUTOMATIZADO**. O usuário não opera manualmente - ele apenas:
1. Configura o bot (estratégia, valor de entrada, modo)
2. Liga o bot
3. Acompanha resultados em tempo real

#### A. **Sistema de XP & Níveis - BASEADO EM VOLUME**

**FILOSOFIA**: XP baseada em **QUANTIDADE de trades executados**, não tempo de sessão. **Operações reais valem 20x mais que Demo.**

**Fontes de XP**:
```javascript
const XP_REWARDS = {
  // TRADES (Principal - foco em VOLUME)
  trade_demo: 1,                    // Trade em Demo (⚠️ NÃO conta para badges)
  trade_real: 20,                   // Trade em Real (20x mais!)
  trade_win: 10,                    // Bônus adicional por WIN (apenas Real)
  trade_streak_3: 30,               // 3 wins seguidos (apenas Real)
  trade_streak_5: 100,              // 5 wins seguidos (apenas Real)
  trade_streak_10: 300,             // 10 wins seguidos (apenas Real)

  // MILESTONES DE VOLUME (apenas trades REAL)
  trades_real_10: 100,              // 10 trades Real
  trades_real_50: 400,              // 50 trades Real
  trades_real_100: 1000,            // 100 trades Real
  trades_real_500: 4000,            // 500 trades Real

  // AÇÕES CRÍTICAS (Incentivo ao depósito)
  first_deposit: 500,               // ⭐ PRIMEIRO DEPÓSITO (qualquer valor)
  deposit_100: 200,                 // Depósito R$100+
  deposit_500: 1000,                // Depósito R$500+
  deposit_1000: 2500,               // Depósito R$1000+

  // ENGAJAMENTO
  daily_login: 10,                  // Login diário
  use_scanner: 5,                   // Usar Market Scanner
  trade_from_scanner: 50,           // Trade Real baseado em sinal Scanner

  // SOCIAL
  referral_signup: 100,             // Indicação se cadastrou
  referral_deposit: 500,            // Indicação depositou
};
```

**Curva de Progressão (30 Níveis)**:

| Nível | XP Total | Trades Demo¹ | Trades Real² | Título | Desbloqueia |
|-------|----------|--------------|--------------|--------|-------------|
| 1 | 0 | 0 | 0 | Novato | Scanner Tier 1 (vê últimos 20) |
| 2 | 100 | 100 | 4 | Aprendiz | - |
| 3 | 250 | 250 | 10 | Trader Júnior | - |
| 5 | 700 | 700 | 28 | Trader Pleno | **Scanner Tier 2** (vê últimos 26) |
| 10 | 3,200 | 3,200 | 128 | Trader Senior | **Scanner Tier 3** (vê últimos 28) |
| 15 | 7,500 | 7,500 | 300 | Trader Expert | Dashboard Analytics Avançado |
| 20 | 15,000 | 15,000 | 600 | Trader Elite | **Scanner Tier 4 Elite** (vê todos 30) |
| 30 | 50,000 | 50,000 | 2,000 | Lenda | Master Status + Priority Scanner |

¹ *Apenas trades Demo (1 XP cada) - ⚠️ Progressão 20x mais lenta!*
² *Trades Real com 50% win rate (média 25 XP por trade: 20 base + 10 win em metade)*

**Tempo Estimado para Progressão**:
- **Usuário Demo apenas** (10 trades/dia): Nível 5 em ~70 dias, Nível 10 em ~320 dias ⚠️ MUITO LENTO
- **Usuário Real ativo** (10 trades/dia): Nível 5 em ~3 dias, Nível 10 em ~13 dias ✅ RÁPIDO
- **Diferença**: Usuário Real progride **20x mais rápido** que Demo

**Curva XP Exponencial**:
```javascript
function getXPForNextLevel(currentLevel) {
  return Math.floor(100 * Math.pow(1.5, currentLevel - 1));
}
```

#### B. **Badges & Conquistas - APENAS TRADES REAL CONTAM** ⚠️

**IMPORTANTE**: Badges são conquistas de **operações REAL**. Trades Demo **NÃO contam** (exceto badge "Estrategista").

**Categorias**:

**Volume Milestones** (Principal - apenas trades REAL):
- 🎯 **"First Blood"** - 1 trade REAL executado → +20 XP
- 🚀 **"Getting Started"** - 10 trades REAL → +100 XP
- 📈 **"Trader Wannabe"** - 50 trades REAL → +400 XP
- 💯 **"100 Club"** - 100 trades REAL → +1000 XP
- 🎖️ **"Veteran Trader"** - 250 trades REAL → +2000 XP
- 💎 **"High Roller"** - 500 trades REAL → +4000 XP
- 🤖 **"Trading Machine"** - 1000 trades REAL → +10000 XP
- 👑 **"Trading God"** - 5000 trades REAL → +50000 XP

**Performance** (Mínimo 50 trades para qualificar):
- 📊 **"60% Club"** - 60%+ win rate → +300 XP
- 🎲 **"70% Elite"** - 70%+ win rate → +1000 XP
- 🔥 **"80% Legend"** - 80%+ win rate → +3000 XP
- 🔗 **"5 Streak Master"** - 5 wins seguidos → +100 XP
- 💪 **"10 Streak God"** - 10 wins seguidos → +300 XP
- 🏆 **"20 Streak Titan"** - 20 wins seguidos → +1000 XP

**Comportamento** (Incentivo ao depósito e engajamento):
- 🎁 **"First Deposit"** - Qualquer depósito → +500 XP + Unlock Tier 2
- 💼 **"Serious Trader"** - Depósito $200+ → +1000 XP + Unlock Tier 3
- 🐋 **"Whale"** - Depósito $1000+ → +5000 XP + Unlock Elite Scanner
- 📅 **"Daily Trader"** - 7 dias streak → +200 XP
- ⚔️ **"Weekly Warrior"** - 30 dias streak → +1000 XP
- 🔍 **"Scanner Pro"** - 100 trades via Scanner → +500 XP

**Onboarding** (apenas REAL):
- 🤖 **"Bot Activated"** - Primeiro trade REAL executado → +50 XP
- 💰 **"First Win"** - Primeiro trade REAL vencedor → +100 XP

**Demo Exploration** (ÚNICO badge de Demo) 🧪:
- 🔬 **"Estrategista"** - 500 trades Demo executados → +100 XP
  - *Descrição*: "Testador incansável. Domina diferentes estratégias antes de arriscar capital real."
  - *Objetivo*: Recompensar usuários que usam Demo para testar antes de operar Real

**Social**:
- 👥 **"Evangelista"** - 3 referrals cadastrados → +300 XP
- 🌟 **"Influencer"** - 10 referrals cadastrados → +1500 XP
- 🏆 **"Líder de Liga"** - Top 10 leaderboard semanal → +500 XP

**Especiais/Raros** (< 5% dos usuários):
- 🌟 **"Perfect 20"** - 20 wins seguidos → +2000 XP
- 💎 **"Profit King"** - R$10k lucro acumulado → +3000 XP
- 🔮 **"Consistency Master"** - 70%+ win rate em 500+ trades → +5000 XP

#### C. **Streaks - DIAS QUE OPEROU**

**Daily Trading Streak** (Principal):
- **Definição**: Pelo menos **1 trade no dia** (Demo ou Real) para contar
- Display visual: 🔥 [7 dias]
- **Objetivo**: Incentivo para operar FREQUENTEMENTE, não por tempo prolongado

**Recompensas por Milestone de Streak**:
- 3 dias → +50 XP
- 7 dias → +150 XP + Badge "Week Warrior"
- 14 dias → +400 XP
- 30 dias → +1000 XP + Badge "Monthly Master"
- 60 dias → +3000 XP + Badge "Elite Consistency"

**Bônus Diário por Streak Ativo** (multiplicador de XP):
```javascript
const streakBonus = {
  '1-6': 0,      // +0 XP por trade
  '7-13': 5,     // +5 XP por trade
  '14-29': 10,   // +10 XP por trade
  '30-59': 20,   // +20 XP por trade
  '60+': 50      // +50 XP por trade (INSANO!)
};
```

**Win Streak** (Secundário):
- Trades vencedores consecutivos
- Display: ⚡ [5 wins]
- Recompensas: Glow effect, badges especiais, bônus XP

**Proteções & Benefícios** (Sistema de incentivo a depósitos):

**Streak Freeze** 🛡️:
- **Como ganhar**: A cada **R$100 depositados** no broker (últimos 30 dias) = **2 freezes**
- **Máximo acumulado**: 7 freezes guardados
- **Função**: Protege streak por 1 dia se você não puder operar
- **Exemplo**: Depositou R$300 nos últimos 30 dias = 6 freezes disponíveis

**Streak Insurance** 🔔:
- Notificação push **6h antes de perder streak** ("⚠️ Seu streak de 15 dias expira em 6h!")
- Sistema automático, sempre ativo

**Streak Revival** 🔄:
- **Função**: Recupera streak perdido (1x/mês)
- **Como conseguir**: Fazer novo depósito no broker parceiro (valor mínimo R$50)
- **Limitação**: Apenas 1 Revival por mês

**POR QUE MANTER STREAKS LONGOS?** 🎯

Streaks não são apenas "figurinhas" - eles desbloqueiam **vantagens reais de trading**:

1. **Bônus XP Progressivo** (acelera desbloqueios):
   - 7-13 dias: +5 XP por trade
   - 14-29 dias: +10 XP por trade
   - 30-59 dias: +20 XP por trade
   - 60+ dias: +50 XP por trade (DOBRA progressão!)

2. **Acesso Prioritário ao Scanner** 🔥:
   - Streaks 30+ dias: Notificações de oportunidades 98%+ **antes** dos outros usuários
   - Streaks 60+ dias: **Filtro exclusivo** "Only Elite Signals" no Scanner

3. **Desbloqueio de Níveis Mais Rápido**:
   - Com bônus de +50 XP/trade (streak 60 dias), você sobe níveis 3x mais rápido
   - Mais níveis = mais ativos Scanner desbloqueados

4. **Status Visual**:
   - Badge de fogo 🔥 ao lado do nome
   - Ranking exclusivo de streaks no leaderboard

#### D. **Scanner Tiers - BLOQUEIO DOS MAIS ASSERTIVOS** ⭐🔥

**CONCEITO**: Market Scanner mostra 30 assets/timeframes ranqueados por **assertividade em tempo real** (98% → 60%). Seu tier determina **quantos dos TOP você pode ver**. Os mais assertivos (oportunidades premium) ficam bloqueados até você subir de nível OU depositar.

**IMPORTANTE**: Não bloqueamos ativos específicos (ex: EURUSD). Bloqueamos os **TOP ranqueados por assertividade**. Se hoje EURUSD está em #1 (98%), ele fica bloqueado para Tier 1. Amanhã pode estar em #15 (75%) e ficar desbloqueado.

---

**Tier 1: FREE** (Nível 1-4, padrão)
- **Vê**: Últimos 20 assets ranqueados (posições #11-30)
- **Bloqueado**: TOP 10 mais assertivos (🔒 com blur)
- **Exemplo**: Vê assets com 60%-85% assertividade, não vê 86%-98%
- **Status**: Todos usuários começam aqui

**Tier 2: INTERMEDIATE** (Nível 5 OU Depósito R$200)
- **Vê**: Últimos 26 assets ranqueados (posições #5-30)
- **Bloqueado**: TOP 4 mais assertivos (🔒 com blur)
- **Exemplo**: Vê 60%-92%, não vê 93%-98%
- **Bônus unlock**: +500 XP, Filtro Win Rate, Notificações
- **Atalho**: Deposite R$200 → Unlock instantâneo (ignora nível)

**Tier 3: PRO** (Nível 10 OU Depósito R$500)
- **Vê**: Últimos 28 assets ranqueados (posições #3-30)
- **Bloqueado**: TOP 2 mais assertivos (🔒 com blur) - **ELITE ONLY**
- **Exemplo**: Vê 60%-96%, não vê 97%-98%
- **Bônus unlock**: +1000 XP, Alertas Push Priority, Heatmap Pro
- **Atalho**: Deposite R$500 → Unlock instantâneo

**Tier 4: ELITE** (Nível 20 OU Depósito R$1500)
- **Vê**: TODOS os 30 assets (posições #1-30)
- **Bloqueado**: NADA - acesso completo às oportunidades premium
- **Exemplo**: Vê 100% incluindo 97%-98% (ouro puro)
- **Bônus unlock**: +2500 XP, AI Win Rate Predictor, Badge "Elite Scanner", Priority Notifications (5min antes dos outros)
- **Atalho**: Deposite R$1500 → Unlock instantâneo

---

**UI do Scanner com Bloqueio**:

```jsx
<ScannerScreen>
  {/* TOP 10 bloqueados (Tier 1) */}
  {userTier === 1 && top10Assets.map((asset, index) => (
    <LockedAssetCard key={asset.id} position={index + 1} blur>
      <LockIcon>🔒</LockIcon>
      <BlurredContent>
        <WinRate blur>9?%</WinRate>
        <AssetName blur>??????</AssetName>
      </BlurredContent>

      <UnlockTooltip>
        <Title>🔥 Oportunidade Premium Bloqueada</Title>
        <Message>Este asset tem {asset.winRate}% de assertividade!</Message>
        <Options>
          <Option>✅ Nível 5 (faltam {xpNeeded} XP)</Option>
          <Option highlight>💰 OU Deposite R$200 AGORA</Option>
        </Options>
      </UnlockTooltip>
    </LockedAssetCard>
  ))}

  {/* Assets desbloqueados */}
  {unlockedAssets.map(asset => (
    <AssetCard key={asset.id} clickable>
      <WinRate color={asset.winRate > 80 ? 'green' : 'amber'}>
        {asset.winRate}%
      </WinRate>
      <AssetName>{asset.name}</AssetName>
      <Timeframe>{asset.timeframe}s</Timeframe>
      <CTAButton>Operar Agora</CTAButton>
    </AssetCard>
  ))}
</ScannerScreen>
```

---

**Notificações FOMO** (Push):

```jsx
// Quando aparecem oportunidades TOP bloqueadas
if (top10HasHighWinRate && userTier < 2) {
  sendPushNotification({
    title: "🔥 OPORTUNIDADE 98% AGORA!",
    body: "Asset com 98% assertividade disponível. Apenas Tier 2+",
    action: "Deposite R$200 para desbloquear",
    urgency: "high"
  });
}
```

**Exemplos de Notificações**:
- "🚨 AGORA: 3 ativos com 95%+ assertividade bloqueados para você. Nível 5 ou R$200 para desbloquear"
- "💎 João desbloqueou Tier 3 e já fez R$420 com sinais 96%+. Deposite R$500"
- "⏰ Última hora: Oferta Tier 2 com bônus +1000 XP expira em 2h"

**Indicador Visual no Scanner**:
```jsx
<ScannerHeader>
  <TierBadge tier={userTier}>
    Tier {userTier} {tierNames[userTier]}
  </TierBadge>
  <LockedCount>
    🔒 {lockedCount} oportunidades premium bloqueadas
  </LockedCount>
  <UpgradeButton>Fazer Upgrade</UpgradeButton>
</ScannerHeader>
```

---

#### F. **Demo Limits - SISTEMA DE ESCASSEZ PROGRESSIVA** 🚨

**OBJETIVO**: Criar escassez controlada para incentivar depósito, mas permitir teste inicial generoso.

**Fase 1: EXPLORAÇÃO LIVRE** (Primeiros 7 dias)
- **Trades Demo ILIMITADOS** por 7 dias
- **Sem cooldown** entre trades
- Mensagem: "✨ Período de teste: 7 dias para explorar à vontade!"
- **Objetivo**: Permitir teste livre e aprendizado inicial
- **Countdown visível**: "🎁 Ainda restam 4 dias de Demo ilimitado"

**Fase 2: DEMO PADRÃO** (Após 7 dias, sem depósito)
- **20 trades Demo/dia** (renovado diariamente às 00h)
- **Não é cumulativo**: Se não usar hoje, perde
- Mensagem: "✅ 20 trades Demo/dia disponíveis. Deposite para aumentar."
- **Contador visível**: "15/20 trades Demo hoje"

**Desbloqueio por Depósito** (Baseado em depósitos dos últimos 30 dias):

```javascript
const demoLimitsCalculation = (totalDepositsLast30Days) => {
  // Base: 20 trades/dia (após 7 dias iniciais)
  let dailyLimit = 20;

  // A cada R$100 depositados = +50 trades Demo
  const bonusTrades = Math.floor(totalDepositsLast30Days / 100) * 50;
  dailyLimit += bonusTrades;

  // R$1000+ depositados = ilimitado por 30 dias
  if (totalDepositsLast30Days >= 1000) {
    dailyLimit = Infinity;
    message = "🎉 Demo ILIMITADO (R$1000+ depositados últimos 30 dias)";
  } else if (totalDepositsLast30Days >= 100) {
    message = `✅ ${dailyLimit} trades Demo/dia (R$${totalDepositsLast30Days} depositados)`;
  } else {
    message = "⚠️ 20 trades Demo/dia. Deposite R$100+ para aumentar.";
  }

  return { dailyLimit, message };
};
```

**Exemplos Práticos**:
- **R$0 depositado** (após 7 dias): 20 trades Demo/dia
- **R$100 depositado** (últimos 30 dias): 70 trades Demo/dia (20 + 50)
- **R$300 depositado**: 170 trades Demo/dia (20 + 150)
- **R$500 depositado**: 270 trades Demo/dia (20 + 250)
- **R$1000+ depositado**: **ILIMITADO** por 30 dias

**Renovação**:
- Todo dia às **00h** os 20 trades base são renovados
- **Não é cumulativo**: Se hoje você tinha 20 e usou 10, amanhã volta a ter 20 (não vira 30)

**UI do Limite**:
```jsx
{demoLimitReached && (
  <DemoLimitModal>
    <Icon>⚠️</Icon>
    <Title>Limite Demo Atingido</Title>
    <Message>Você usou seus 20 trades Demo hoje.</Message>

    <DepositBenefits>
      <Benefit>R$100 → 70 trades/dia</Benefit>
      <Benefit>R$300 → 170 trades/dia</Benefit>
      <Benefit highlight>R$1000 → ILIMITADO</Benefit>
    </DepositBenefits>

    <CTAButton>Depositar no Broker</CTAButton>
    <SecondaryText>Renovação diária às 00h</SecondaryText>
  </DemoLimitModal>
)}
```

---

#### G. **Leaderboards Segmentados**

**Global Ranking**:
- Top 100 operadores por lucro mensal (bot)
- Top 50 por win rate do bot
- Top 20 por tempo total de bot ligado

**Ligas Semanais** (Duolingo-style):
- Bronze → Silver → Gold → Platinum → Diamond
- 50 usuários por liga
- Top 10 promovidos, bottom 10 rebaixados
- Recompensas ao fim da semana (XP, badges, Streak Freezes)

#### H. **Missions & Challenges - FOCO EM VOLUME (Apenas REAL)**

**IMPORTANTE**: Quests são baseadas em trades **REAL**. Trades Demo não contam para quests.

**Daily Quests** (reset 00h - garantir engajamento diário):
- [ ] Executar 10+ trades REAL (Reward: 200 XP)
- [ ] 5+ trades REAL vencedores (Reward: 150 XP)
- [ ] Usar Market Scanner 1x (Reward: 50 XP)
- [ ] Login diário + 1 trade REAL (Reward: 100 XP)

**Weekly Challenges** (apenas REAL):
- [ ] 50+ trades REAL executados esta semana (Reward: 1000 XP)
- [ ] Win rate >60% com min 20 trades REAL (Reward: Badge especial + 500 XP)
- [ ] 10 trades REAL via Scanner (Reward: 500 XP + Priority Scanner 24h)
- [ ] Operar 5+ dias (min 1 trade REAL/dia) (Reward: Badge "Weekly Warrior")

**Deposit-Incentive Quests** (aparecem após 100 trades Demo):
- [ ] Primeiro depósito (qualquer valor) (Reward: 500 XP + Unlock Tier 2 + Badge "First Deposit" + 2 Freezes)
- [ ] Executar 1 trade Real (Reward: 200 XP + Badge "Real Trader")
- [ ] 10 trades Real (Reward: 500 XP)
- [ ] Depositar R$200+ (Reward: 1000 XP + Unlock Scanner Tier 2 + 4 Freezes)

**Seasonal Events** (mensal):
- "Volume Rush" - Competição de número de trades REAL
- "Profit King" - Maior lucro acumulado (REAL)
- "Consistency Cup" - Premia win rate + volume (min 100 trades REAL)

#### G. **🔥 GAMIFICAÇÃO DAS TELAS DE OPERAÇÃO** (CRÍTICO!)

**ESTAS SÃO AS TELAS MAIS IMPORTANTES DO APP** - Onde o usuário passa mais tempo e onde precisamos maximizar engajamento para manter bot ligado.

##### **MODO MANUAL** - Gráfico de Candles (Lightweight Charts)

**Modificar**: `TradingChart.tsx` (mantém Lightweight Charts existente)

**ADICIONAR Trade Markers** (setinhas de entrada + resultado):

```javascript
// Lightweight Charts - Adicionar markers de entrada e expiração
const addTradeMarker = (time: number, direction: 'CALL' | 'PUT', result?: 'WIN' | 'LOSS') => {
  const markers = [
    {
      time: time,
      position: direction === 'CALL' ? 'belowBar' : 'aboveBar',
      color: direction === 'CALL' ? '#10B981' : '#EF4444',
      shape: direction === 'CALL' ? 'arrowUp' : 'arrowDown',
      text: direction === 'CALL' ? '▲ CALL' : '▼ PUT',
    }
  ];

  // Adicionar resultado no ponto EXATO de expiração
  if (result) {
    markers.push({
      time: time + timeframe, // Ponto exato da expiração
      position: result === 'WIN' ? 'aboveBar' : 'belowBar',
      color: result === 'WIN' ? '#10B981' : '#EF4444',
      shape: 'circle',
      text: result === 'WIN' ? '✓ WIN' : '✗ LOSS'
    });
  }

  candleSeriesRef.current?.setMarkers(markers);
};
```

**ADICIONAR Overlays Gamificados**:

```jsx
<ManualModeScreen>
  {/* TOP BAR - Status do Bot */}
  <BotStatusBar status="RUNNING" glow="green" animated>
    🤖 Bot Ativo • 00:47:32 • +R$234 hoje
    <LiveXPGain>+10 XP</LiveXPGain> {/* Animação de XP flutuante */}
  </BotStatusBar>

  {/* CANDLE CHART - Lightweight Charts com markers */}
  <CandleChart asset={selectedAsset} timeframe={timeframe}>
    {/* Trade Markers integrados via setMarkers() */}
    {/* Renderizado automaticamente pelo Lightweight Charts */}

    {/* Overlay de Streak (quando >= 3 wins) */}
    {winStreak >= 3 && (
      <StreakOverlay position="top-right">
        🔥 {winStreak} WINS SEGUIDAS!
        <FireParticles />
      </StreakOverlay>
    )}
  </CandleChart>

  {/* LIVE FEED lateral - Trades em tempo real */}
  <LiveTradeFeed className="absolute right-0 top-16 w-64">
    {recentTrades.slice(0, 5).map(trade => (
      <TradeCard key={trade.id} result={trade.result} animated>
        {trade.result === 'WIN' ? '✅' : '❌'} {trade.asset} • R${trade.pnl}
        {trade.result === 'WIN' && <ConfettiEffect />}
      </TradeCard>
    ))}
  </LiveTradeFeed>

  {/* BOTTOM OVERLAY - Próximo Trade */}
  <NextTradePreview animated pulse>
    ⏳ Próximo trade em ~12s...
    <LoadingBar animated />
  </NextTradePreview>
</ManualModeScreen>
```

**Efeitos Visuais**:
- ✅ **Win Trade**: Confetti explosion, green glow no chart, sound effect, +XP flutuando
- ❌ **Loss Trade**: Red pulse, shake animation sutil, -R$ com fade out
- 🔥 **Streak >= 3**: Fire particles, golden border no chart, "STREAK MODE" badge
- ⚡ **Fast Trade (< 30s)**: Lightning effect, bonus XP popup

---

##### **MODO AUTO** - Gráfico de PnL (Profit & Loss)

**Elementos Gamificados Integrados**:

```jsx
<AutoModeScreen>
  {/* TOP COMMAND CENTER */}
  <CommandCenter glass neonBorder>
    <BotAvatar animated breathing level={userLevel} />

    <RealTimeStatus>
      🤖 SCANNING MARKETS... {currentAsset}
      <ScanAnimation />
    </RealTimeStatus>

    <SessionTimer>
      ⏱️ 01:23:45 {/* +100 XP bonus em 30min */}
      <ProgressRing />
    </SessionTimer>
  </CommandCenter>

  {/* PNL CHART - Principal do Modo Auto */}
  <PnLChart data={pnlData} height={400}>
    {/* Área do gráfico com gradient */}
    <AreaGradient from="green" to="transparent" />

    {/* Linha do zero */}
    <ZeroLine dashed />

    {/* Markers de trades importantes */}
    {bigWins.map(win => (
      <BigWinMarker value={win.amount} time={win.time}>
        💎 +R${win.amount}
      </BigWinMarker>
    ))}

    {/* Live value cursor */}
    <CurrentValueCursor animated glow>
      R$ {currentPnL} {trend}
    </CurrentValueCursor>
  </PnLChart>

  {/* LIVE METRICS CARDS */}
  <MetricsGrid>
    <MetricCard icon="🎯" label="Win Rate" value={`${winRate}%`}
                glow={winRate > 60 ? 'green' : 'amber'} />
    <MetricCard icon="💰" label="Lucro" value={`R$ ${profit}`}
                glow="green" animated={profitIncreasing} />
    <MetricCard icon="📊" label="Trades" value={totalTrades}
                pulse />
  </MetricsGrid>

  {/* ACHIEVEMENTS POPUP */}
  <AnimatePresence>
    {newAchievement && (
      <AchievementUnlock badge={newAchievement}>
        🏆 NOVO BADGE DESBLOQUEADO!
        <Confetti />
      </AchievementUnlock>
    )}
  </AnimatePresence>

  {/* QUEST PROGRESS TRACKER (Sidebar) */}
  <QuestTracker>
    <QuestItem>
      ☑️ Bot ligado 30min+ (50 XP)
      <CheckAnimation />
    </QuestItem>
    <QuestItem active>
      🎯 5 trades executados (2/5)
      <ProgressBar value={40} />
    </QuestItem>
  </QuestTracker>
</AutoModeScreen>
```

**Efeitos de Milestone**:
- 💰 **Primeiro lucro do dia**: Golden flash, "FIRST BLOOD" badge popup
- 📈 **PnL cruza zero (de loss → profit)**: "COMEBACK" animation, green particles
- 🎖️ **Meta diária atingida**: Full screen celebration, confetti, badge unlock
- ⏰ **30min de sessão**: "MARATHON BONUS" popup com +100 XP

---

##### **Mecânicas Compartilhadas (Ambos Modos)**

**1. Live XP Gain System**:
```jsx
// Toda vez que bot ganha trade
<FloatingXP>
  +60 XP
  <AnimateUp />
  <GlowPulse color="gold" />
</FloatingXP>

// XP Bar no topo sempre visível
<XPBarTop>
  <ProgressFill animated gradient />
  <LevelDisplay>Nível 15</LevelDisplay>
  <NextLevel>2,450 / 3,000 XP</NextLevel>
</XPBarTop>
```

**2. Streak Indicator Permanente**:
```jsx
<StreakBadge position="top-right" animated>
  {dailyStreak > 0 && (
    <>
      🔥 {dailyStreak} dias
      {dailyStreak >= 7 && <FlameParticles />}
    </>
  )}
</StreakBadge>
```

**3. Bot Mascot (Opcional mas Poderoso)**:
```jsx
<BotMascot position="bottom-right" interactive>
  {/* Rive animation - reage a eventos */}
  <RiveCharacter
    idle={botRunning}
    happy={lastTradeWin}
    thinking={analyzing}
    celebrating={milestone}
  />

  {/* Speech bubbles contextuais */}
  {analyzing && (
    <SpeechBubble>
      Analisando EURUSD... 🔍
    </SpeechBubble>
  )}
</BotMascot>
```

**4. Sound Design**:
- 🎵 **Bot Start**: Cyberpunk ignition sound
- ✅ **Win Trade**: Coin drop, positive chime
- ❌ **Loss Trade**: Low hum (não punitivo)
- 🏆 **Achievement**: Epic fanfare
- ⏱️ **Milestone Time**: Clock tick + celebration
- 🔥 **Streak increase**: Fire whoosh

---

##### **Objetivo Psicológico das Telas**

**Criar "Flow State" onde usuário quer assistir bot operar**:
1. **Visual Feedback Constante**: Algo sempre mudando/animando
2. **Antecipação**: "Próximo trade em X segundos" cria suspense
3. **Micro-celebrations**: Cada win é celebrado como vitória épica
4. **Progress Tangível**: XP, crystals, trades contando em tempo real
5. **FOMO de Parar**: "Se eu parar agora, perco streak/miss próximo big win"

**Métricas de Sucesso Específicas**:
- Tempo médio na tela de operação: > 45min/dia
- Taxa de abandono após 1 trade: < 10%
- Sessões que chegam a 30min+: > 60%

### 2.3 Black Hat Focado em CONVERSÃO (Depósito)

**Objetivo Primário**: Fazer o usuário **DEPOSITAR** dinheiro real na corretora.
**Objetivo Secundário**: Maximizar **VOLUME de trades** e engajamento frequente.

#### **Scarcity (Escassez)** - Criar percepção de recursos limitados
- 🔒 **Demo Limits progressivos**: "Você tem 5 trades Demo restantes hoje. Deposite R$100 para ganhar +50 trades."
- 📊 **Scanner TOP assets bloqueados**: "🔒 10 oportunidades premium bloqueadas (86%-98% assertividade). Nível 5 OU R$200"
- 🔥 **Oportunidades em tempo real**: "🚨 AGORA: Asset com 98% assertividade disponível. Apenas Tier 2+"
- ⏰ **Notificações urgentes**: "3 ativos 95%+ bloqueados para você. Deposite R$200 para desbloquear"
- 💎 **FOMO de oportunidade perdida**: "Você perdeu 12 sinais 90%+ esta semana (bloqueados)"

#### **Loss Avoidance (Aversão à perda)** - Medo de perder progresso
- ⚠️ **Streak em risco**: "Seu streak de 15 dias expira em 6h! Opere 1 trade para manter acesso prioritário ao Scanner."
- 📉 **Progressão MUITO lenta Demo**: "Usuários Demo progridem **20x mais devagar** (1 XP vs 20 XP Real)"
- 🔥 **Oportunidades perdidas**: "Você perdeu 12 sinais 95%+ bloqueados esta semana"
- 💎 **XP deixado na mesa**: "Se tivesse operado Real, teria **+5000 XP** hoje (vs +250 XP Demo)"
- ⏰ **Freezes perdendo validade**: "Você tem 4 freezes que expiram em 15 dias (R$200 depositados há 15 dias)"

#### **Social Proof (Prova social)** - Validação social da conversão
- 📊 **Estatísticas agregadas**: "87% dos traders ativos já depositaram"
- 👥 **Atividade de peers**: "João e 47 outros depositaram hoje e desbloquearam Tier 3"
- 🏆 **Leaderboards**: "Top 10: Todos com conta Real"
- 💬 **Testimonials**: "Maria: 'Depositei $50 e já recuperei em 2 dias!'"

#### **FOMO (Fear of Missing Out)** - Urgência de não perder benefícios
- ⏰ **Ofertas limitadas**: "🎁 Apenas hoje: Depósito $50 = Tier 3 Scanner (valor $200)"
- 🎯 **Bônus temporários**: "Deposite nas próximas 6h = 2x XP por 48h"
- 🔥 **Vagas limitadas**: "12 vagas restantes para 'Early Depositor' badge"
- 📈 **Market timing**: "Scanner detectou 5 oportunidades 85%+ win rate - Tier 3 necessário"

#### **Urgency (Urgência)** - Pressão temporal
- ⚡ **Contadores regressivos**: "Oferta expira em: 05:43:21"
- 🎁 **Bônus de volume**: "Faltam 3 trades para badge '100 Club'. Deposite para acelerar 5x"
- 🚀 **Níveis próximos**: "Você está a 400 XP do Nível 10. Deposite = 5x XP"
- 📊 **Oportunidades NOW**: "🔥 EURUSD 88% win rate AGORA - Tier 2+ apenas"

#### **Variable Rewards (Recompensas variáveis)** - Reforço intermitente
- 🎰 **First Deposit Surprise**: "Deposite qualquer valor = Mystery Badge (500-5000 XP)"
- 🎁 **Deposit Milestones**: Depósitos desbloqueiam loot boxes com XP/crystals/badges aleatórios
- ✨ **Real Money Streaks**: "5 trades Real seguidos = Chance de Legendary Badge"

#### **Comparação Demo vs Real** (Tabela de conversão)
```jsx
<ComparisonModal>
  <Table>
    <Row>
      <Cell>XP por trade</Cell>
      <Cell>Demo: 5 XP</Cell>
      <Cell highlight>Real: 25 XP (5x!)</Cell>
    </Row>
    <Row>
      <Cell>Demo Limits</Cell>
      <Cell>20 trades/dia, cooldown 5min</Cell>
      <Cell highlight>Real: ILIMITADO</Cell>
    </Row>
    <Row>
      <Cell>Scanner Tiers</Cell>
      <Cell>Bloqueado por nível</Cell>
      <Cell highlight>Atalho instantâneo por depósito</Cell>
    </Row>
    <Row>
      <Cell>Badges</Cell>
      <Cell>Apenas badges básicos</Cell>
      <Cell highlight>Badges exclusivos Real</Cell>
    </Row>
  </Table>
  <CTA>Deposite $50 agora e desbloqueie tudo</CTA>
</ComparisonModal>
```

#### **Gatilhos de Conversão** (Quando mostrar CTAs)
1. **Após 50 trades Demo** - Modal: "Você dominou o Demo. Hora do Real?"
2. **Demo Limit atingido** - Overlay: "Limite atingido. Deposite para continuar"
3. **Scanner bloqueado** - Click em asset Tier 2+: "Deposite para desbloquear"
4. **Nível milestone** - Atingiu nível 5/10: "Parabéns! Deposite $X para acelerar"
5. **Streak longo** - 7+ dias: "Você é dedicado. Deposite para maximizar ganhos"

**Importante**: Escape hatch nos Settings - "Modo Zen" reduz frequência de CTAs de depósito mas mantém funcionalidade Demo disponível.


---

## 🛠️ STACK TECNOLÓGICO

**Frontend** (já existente, adicionar):
- Framer Motion para micro-interactions e transições
- GSAP para animações complexas de scroll
- Rive (opcional) para Bot Mascot animado
- Canvas Confetti para celebrações
- Howler.js para sound effects

**Backend** (adicionar tabelas Supabase):
```sql
-- user_gamification (tabela principal)
CREATE TABLE user_gamification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR UNIQUE NOT NULL,

  -- XP & Level
  total_xp INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  xp_current_level INTEGER DEFAULT 0,
  xp_next_level INTEGER DEFAULT 100,

  -- Streaks
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  last_trade_date DATE,
  streak_freezes_available INTEGER DEFAULT 0,

  -- Stats
  total_trades INTEGER DEFAULT 0,
  total_trades_demo INTEGER DEFAULT 0,
  total_trades_real INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  current_win_streak INTEGER DEFAULT 0,
  best_win_streak INTEGER DEFAULT 0,

  -- Demo Limits
  demo_phase VARCHAR DEFAULT 'exploration',
  demo_trades_today INTEGER DEFAULT 0,
  demo_last_trade TIMESTAMP,
  demo_started_at TIMESTAMP DEFAULT NOW(),

  -- Scanner
  scanner_tier INTEGER DEFAULT 1,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- user_badges
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL,
  badge_id VARCHAR NOT NULL,
  badge_name VARCHAR,
  badge_icon VARCHAR,
  xp_reward INTEGER,
  earned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- xp_transactions (log de XP)
CREATE TABLE xp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL,
  amount INTEGER NOT NULL,
  source VARCHAR NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- leaderboards, quests (existing)
```

**Lightweight Charts** (já integrado):
- Usar para candles no Modo Manual
- Adicionar trade markers overlays
- Custom plugins para streak indicators

---

## 🚶 JORNADA DO USUÁRIO & FUNIL DE CONVERSÃO

### 5.1 Onboarding (Primeira Vez)

**Criar**: `Onboarding.tsx` (modal ou rota separada)

**4 Steps**:
1. "Bem-vindo ao MivraTech! Configure seu bot: Manual/Auto"
2. "Sistema de Progressão: Ganhe XP, suba níveis, desbloqueie badges"
3. "Acompanhe PnL e histórico em tempo real"
4. "Market Scanner: Oportunidades de alta assertividade 24/7"

**Após onboarding** → Badge "First Blood" + 20 XP

### 5.2 Flow Principal

```
Auth → Onboarding → Operations (default) → Configurar Bot → START → Tela Gamificada Ativa!
```

**Durante operação**:
- **Manual**: Candles + overlays + trade markers + live feed
- **Auto**: PnL + command center + quest tracker + metrics

### 5.3 Funil de Conversão (7-14 dias)

**Objetivo**: Converter usuários Demo em usuários Real (depósito).

**Timeline Esperado**:

| Dia | Fase | Ação | Gatilho |
|-----|------|------|---------|
| **0-1** | Exploração | 50 trades/dia Demo livre | Onboarding + primeiros trades |
| **1-3** | Engajamento | Atingir Nível 5 | Modal: "🎉 Desbloqueie Tier 2 Scanner depositando $50!" |
| **3-7** | Restrição | Demo Limits ativam (20 trades/dia) | Pressão via cooldown + contador |
| **7-14** | Conversão | Modal comparativo Demo vs Real | "100 trades Demo completos. Deposite para continuar." |

**Gatilhos de Conversão** (quando mostrar CTAs):
1. ⏰ **Após 50 trades Demo** - Modal: "Você dominou o Demo. Hora do Real?"
2. 🚨 **Demo Limit atingido** - Overlay: "Limite atingido. Deposite para continuar"
3. 🔒 **Scanner bloqueado** - Click em asset Tier 2+: "Deposite para desbloquear"
4. 🎉 **Nível milestone** - Atingiu nível 5/10: "Parabéns! Deposite $X para acelerar progressão"
5. 🔥 **Streak longo** - 7+ dias: "Você é dedicado. Deposite para maximizar ganhos"
6. 💎 **High win rate** - 70%+ em 50 trades: "Com essa habilidade, Real money = lucros reais!"

### 5.4 Funil Esperado (Métricas)

```
1000 cadastros
├─ 800 (80%) completam onboarding
├─ 500 (50%) fazem 10+ trades Demo
├─ 300 (30%) chegam Nível 5
├─ 150 (15%) depositam $50+ ← META PRIMÁRIA
└─ 50 (5%) se tornam whales ($500+)
```

**Taxa de conversão alvo**: **15% depositam em 7-14 dias**

**Valor médio de depósito alvo**: **$200**

---

## 📅 ROADMAP DE EXECUÇÃO (FASES 1 e 2)

### 🎨 FASE 1: ARQUITETURA VISUAL & ESTÉTICA (2-3 semanas)

**Objetivo**: Estabelecer identidade visual "Cyber Trading Arena" e componentes base.

#### Semana 1: Design System & Componentes Base
**Tasks**:
1. ✅ Setup dependências: `framer-motion`, `gsap`, `canvas-confetti`, `howler`
2. ✅ Tailwind config: Adicionar palette (Electric Blue, Golden Amber, Profit Green, Loss Red)
3. ✅ Criar componentes estéticos base:
   - `GlassCard` - Glassmorphism com golden glow
   - `NeonButton` - Botões com particle effects
   - `OrganicBackground` - SVG animated blobs
   - `DiagonalSection` - Layouts diagonais Persona 5-style
4. ✅ Typography system: Rajdhani/Orbitron para headings
5. ✅ **Botões de Broker** (críticos para conversão):
   - `DepositButton` - Botão "Depositar no Broker" (abre popup)
   - `WithdrawButton` - Botão "Sacar do Broker" (abre popup)
   - **Localização**: Header (top-right), Sidebar, modais de conversão
   - **Design**: Golden Amber com glow, sempre visível

**Entregável**: 6-7 componentes estéticos reutilizáveis + botões broker

**UI dos Botões Broker**:
```jsx
// Header (sempre visível)
<Header>
  <Logo />
  <Nav />
  <BrokerActions>
    <WithdrawButton variant="ghost" icon="💰">
      Sacar
    </WithdrawButton>
    <DepositButton variant="primary" glow icon="💎">
      Depositar
    </DepositButton>
  </BrokerActions>
  <UserMenu />
</Header>

// Popup de Depósito
<DepositModal>
  <Title>💎 Depositar no Broker Parceiro</Title>
  <BenefitsGrid>
    <Benefit>+50 trades Demo a cada R$100</Benefit>
    <Benefit>20x mais XP (Real vs Demo)</Benefit>
    <Benefit>Desbloqueia Scanner Tiers</Benefit>
    <Benefit>2 Streak Freezes a cada R$100</Benefit>
  </BenefitsGrid>

  <QuickAmounts>
    <AmountButton>R$100</AmountButton>
    <AmountButton highlight>R$200</AmountButton>
    <AmountButton>R$500</AmountButton>
    <AmountButton premium>R$1000</AmountButton>
  </QuickAmounts>

  <CTAButton size="large">Ir para Broker Parceiro</CTAButton>
</DepositModal>
```

---

#### Semana 2-3: Gamificação Visual das Telas de Operação

**MODO MANUAL (Candles Chart)**:
1. ✅ Overlay components sobre Lightweight Charts:
   - `BotStatusBar` - Top bar com status "RUNNING" + timer + PnL
   - `TradeMarkers` - Markers de CALL/PUT com glow effects
   - `StreakOverlay` - "🔥 5 WINS SEGUIDAS!" quando streak >= 3
   - `NextTradePreview` - "Próximo trade em ~15s..."
2. ✅ Animações de feedback:
   - Win trade: Confetti + green glow + sound + floating XP
   - Loss trade: Red pulse + shake + fade out
   - Streak mode: Fire particles + golden border
3. ✅ `LiveTradeFeed` - Feed lateral com últimos 5 trades auto-scroll

**MODO AUTO (PnL Chart)**:
1. ✅ `CommandCenter` - Top glass panel com:
   - Bot avatar animated
   - Real-time status "SCANNING MARKETS..."
   - Session timer com progress ring
2. ✅ PnL Chart enhancements:
   - Gradient area chart
   - Zero line dashed
   - Big win markers
   - Animated current value cursor
3. ✅ `MetricsGrid` - Cards de Win Rate, Lucro, Trades com glow effects
4. ✅ `QuestTracker` - Sidebar com progress bars de daily quests

**Mecânicas Compartilhadas**:
- ✅ `XPBarTop` - Barra de XP sempre visível no topo
- ✅ `FloatingXP` - Animação de "+60 XP" flutuando quando bot ganha
- ✅ `StreakBadge` - Badge de streak "🔥 7 dias" sempre visível
- ✅ Sound effects: win.mp3, loss.mp3, levelup.mp3, achievement.mp3

**Entregável**: Telas de operação totalmente gamificadas e viciantes

---

### 🎮 FASE 2: SISTEMA DE GAMIFICAÇÃO BACKEND + INTEGRAÇÃO (2-3 semanas)

**Objetivo**: Implementar lógica de XP, badges, streaks, quests e conectar ao bot.

#### Semana 1: Database & Backend Logic

**Tasks**:
1. ✅ Criar tabelas Supabase (user_progress, badges, achievements, etc)
2. ✅ Backend endpoints:
   - `POST /api/gamification/award-xp` - Dar XP ao usuário
   - `POST /api/gamification/track-session` - Tracker tempo de sessão
   - `GET /api/gamification/progress` - Buscar progresso (XP, level, badges)
   - `POST /api/gamification/claim-quest` - Coletar recompensa de quest
   - `GET /api/leaderboards/:period` - Buscar rankings
3. ✅ Lógica de XP calculation:
   ```js
   // XP curve exponencial
   function getXPForNextLevel(currentLevel) {
     return Math.floor(100 * Math.pow(1.5, currentLevel - 1));
   }
   ```
4. ✅ Badge unlocking system:
   - Check criteria quando trade closes ou milestone alcançado
   - Notify frontend via WebSocket

**Entregável**: Backend gamification API funcional

---

#### Semana 2: Frontend Hooks & State Management

**Tasks**:
1. ✅ Zustand stores:
   - `gamificationStore` - XP, level, crystals, badges
   - `streaksStore` - daily streak, win streak
   - `questsStore` - active quests, progress
2. ✅ React hooks:
   - `useGamification()` - Subscribe a XP/level updates
   - `useBadges()` - Listen to badge unlocks
   - `useStreaks()` - Track streaks
   - `useQuests()` - Manage daily/weekly quests
3. ✅ Componentes UI:
   - `XPBar` com level up modal
   - `BadgeUnlockAnimation` - Full screen celebration
   - `StreakCounter` - Display de streaks
   - `QuestCard` - Card de quest com progress bar

**Entregável**: Sistema de gamification frontend funcional

---

#### Semana 3: Integração com Bot & Leaderboards

**Tasks**:
1. ✅ Integrar bot events → gamification (volume-based, Demo 20x menos):
   - Trade Demo executado → Award XP (1 XP) ⚠️ NÃO conta para badges
   - Trade Real executado → Award XP (20 XP)
   - Trade Real WIN → Award bonus XP (+10 XP adicional)
   - Win Streak Real (3/5/10) → Award streak bonus XP (30/100/300)
   - Primeiro trade do dia → Update daily streak (mínimo 1 trade/dia)
   - Demo Limit check → Enforce daily limit (20 base + R$100 deposits)
   - Scanner Tier check → Filter TOP assets by user tier (block top assertive)
   - Deposit event → Update freezes (R$100 = 2 freezes), unlock Scanner Tiers, increase Demo Limits
2. ✅ Leaderboard system:
   - Cron job diário: Calculate rankings (lucro, win rate, volume de trades)
   - Weekly leagues: Promote/demote users (Bronze → Diamond)
   - Frontend: `LeaderboardPanel` component
   - Ranking categories: Volume (trades/semana), Profit, Win Rate, Streaks
3. ✅ Quest auto-generation:
   - Diariamente 00h: Generate 3 daily quests
   - Semanalmente: Generate 3 weekly challenges
4. ✅ Notificações push:
   - Streak em risco (2h antes de expirar)
   - Quest quase completo
   - Nova posição em leaderboard

**Entregável**: Sistema completo integrado e funcional

---

## 📊 MÉTRICAS DE SUCESSO

### KPIs Críticos (Foco: CONVERSÃO & VOLUME)

**Conversão (Objetivo Primário)**:
- [ ] **Taxa de conversão (depósito) > 15%** (vs atual ~5%)
- [ ] **Tempo até primeiro depósito < 7 dias**
- [ ] **Valor médio de depósito > $200**
- [ ] % usuários que passam de Demo → Real: 15%+

**Volume de Operações (Objetivo Secundário)**:
- [ ] **Trades por usuário/semana > 50** (vs atual ~20)
- [ ] Taxa de usuários que operam 3+ dias/semana > 60%
- [ ] Abandono após 1 trade < 10%
- [ ] % usuários que completam 100 trades Demo: 30%+

**Engajamento**:
- [ ] DAU/MAU ratio > 40%
- [ ] 80%+ users engage com sistema de XP
- [ ] 60%+ users completam daily quests
- [ ] % usuários que usam Scanner: 50%+

**Retenção**:
- [ ] Day 1 retention > 50%
- [ ] Day 7 retention > 40%
- [ ] Day 30 retention > 25%
- [ ] Daily streak médio > 5 dias

**Performance Visual**:
- [ ] Lighthouse performance score > 85
- [ ] 60fps constante nas animações
- [ ] Time to interactive < 2s

### Testes A/B Críticos

**Teste 1: Gamificação ON vs OFF**
- Grupo A (50%): Nova UI gamificada com sistema completo
- Grupo B (50%): UI atual tradicional
- **Métrica primária**: Taxa de conversão (depósito)
- **Métrica secundária**: Volume de trades/semana
- **Duração**: 2 semanas

**Teste 2: Demo Limits Timing**
- Grupo A (33%): Limites após 3 dias
- Grupo B (33%): Limites após 5 dias
- Grupo C (34%): Limites após 7 dias
- **Métrica primária**: Taxa de conversão (depósito)
- **Métrica secundária**: NPS (satisfação)
- **Duração**: 2 semanas

**Teste 3: Scanner Tiers Pricing**
- Grupo A (50%): Tier 2 = $50, Tier 3 = $200
- Grupo B (50%): Tier 2 = $30, Tier 3 = $100
- **Métrica primária**: Valor médio de depósito
- **Métrica secundária**: Taxa de conversão
- **Duração**: 2 semanas

---

## 🎯 CONCLUSÃO

Este plano transforma o MivraTech de plataforma de bot funcional em **experiência viciante** que maximiza conversões e volume de operações através de:

✅ **UI Artística**: Glassmorphism, golden glow, organic shapes, layouts não-convencionais (Persona 5, Cyberpunk)
✅ **Gamificação 50/50**: XP/Levels baseados em VOLUME, badges, streaks (dias operados), quests - balance ético White/Black Hat
✅ **Foco em CONVERSÃO**: Scanner Tiers, Demo Limits, XP 5x Real money - todas mecânicas levam ao depósito
✅ **Foco em VOLUME**: XP por trade (não tempo), badges por milestones de trades, quests diárias de volume
✅ **Telas de Operação Críticas**: Modo Manual (candles + markers) + Modo Auto (PnL + command center) com feedback visual constante
✅ **Funil de Conversão**: 7-14 dias de jornada estruturada (Exploração → Restrição → Conversão)
✅ **Mobile First + PWA**: Otimizado para uso mobile, instalável, notificações push
✅ **Execução Simples**: 2 fases, 4-6 semanas total, sem over-engineering

**Diferenciais Estratégicos**:
- XP baseada em **trades executados** (5 Demo, 25 Real) - não tempo de sessão
- Scanner Tiers com **atalho por depósito** (nível OU $$$)
- Demo Limits progressivos criando **escassez controlada**
- Streaks = **dias que operou** (min 1 trade), não tempo ligado
- Black Hat focado em **FOMO de depósito**, não urgência de sessão

**Próximos Passos Imediatos**:
1. Aprovar este plano
2. Iniciar Fase 1 - Semana 1 (Design System & Componentes Base)
3. Implementar Fase 2 (Gamification Backend + Scanner Tiers + Demo Limits)
4. Launch MVP e testar funil de conversão

**Resultado Esperado**:
- **15% de taxa de conversão** (depósito) em 7-14 dias
- **$200 valor médio de depósito**
- **50+ trades/usuário/semana** (volume)
- **40% D7 retention**

Transformando usuário Demo em cliente Real através de gamificação estratégica e funil estruturado. 🎮💎🚀
