# Trading Components - Gamified Overlays

Componentes de overlay gamificados para as telas de operação (Manual e Auto modes).

## 📦 Componentes Disponíveis

### Modo Manual (Candles Chart)

#### `BotStatusBar`
Barra superior mostrando status do bot, timer de sessão e PnL em tempo real.

```tsx
import { BotStatusBar } from '@/components/trading';

<BotStatusBar
  status="RUNNING"
  sessionDuration={3600} // seconds
  pnlToday={234.50}
  xpGained={120}
/>
```

#### `LiveTradeFeed`
Feed lateral com últimos 5 trades, com animações e confetti nos wins.

```tsx
import { LiveTradeFeed } from '@/components/trading';

<LiveTradeFeed
  trades={recentTrades}
  maxTrades={5}
  position="right"
/>
```

#### `StreakOverlay`
Overlay celebrando win streaks >= 3 com partículas de fogo.

```tsx
import { StreakOverlay } from '@/components/trading';

<StreakOverlay
  winStreak={5}
  position="top-right"
  minStreakToShow={3}
/>
```

#### `NextTradePreview`
Countdown e preview do próximo trade.

```tsx
import { NextTradePreview } from '@/components/trading';

<NextTradePreview
  secondsUntilNext={15}
  nextAsset="EURUSD"
  isAnalyzing={false}
/>
```

### Modo Auto (PnL Chart)

#### `CommandCenter`
Painel superior com avatar do bot, status e timer.

```tsx
import { CommandCenter } from '@/components/trading';

<CommandCenter
  botStatus="SCANNING"
  currentAsset="EURUSD"
  sessionTime={3600}
  userLevel={15}
/>
```

#### `MetricsGrid`
Grid de cards com métricas gamificadas (Win Rate, Profit, Trades).

```tsx
import { MetricsGrid } from '@/components/trading';

<MetricsGrid
  winRate={65.5}
  profit={234.50}
  totalTrades={42}
/>
```

#### `QuestTracker`
Sidebar com quests ativas e progress bars.

```tsx
import { QuestTracker } from '@/components/trading';

<QuestTracker
  quests={dailyQuests}
  maxQuests={3}
  position="left"
/>
```

## 🎵 Sound Effects

### `useSoundEffects`
Hook para tocar sound effects.

```tsx
import { useSoundEffects } from '@/hooks/useSoundEffects';

const sounds = useSoundEffects({ volume: 0.5, enabled: true });

// Tocar sons específicos
sounds.playWin();
sounds.playLoss();
sounds.playLevelUp();
sounds.playAchievement();
sounds.playXP();
sounds.playStreak();
```

### Arquivos de Som Necessários
Adicione os arquivos em `public/sounds/`:
- `win.mp3` - Som de vitória
- `loss.mp3` - Som de derrota (sutil)
- `levelup.mp3` - Som de level up
- `achievement.mp3` - Som de conquista
- `xp.mp3` - Som de XP ganho
- `click.mp3` - Som de clique
- `streak.mp3` - Som de streak

## 📱 Exemplo de Integração - Modo Manual

```tsx
import { useState, useEffect } from 'react';
import {
  BotStatusBar,
  LiveTradeFeed,
  StreakOverlay,
  NextTradePreview,
  QuestTracker,
} from '@/components/trading';
import { XPBar, FloatingXP, StreakBadge } from '@/components/ui/gamification';
import { useGamification, useStreaks, useQuests } from '@/hooks/useGamification';
import { useFloatingXP } from '@/hooks/useFloatingXP';
import { useSoundEffects } from '@/hooks/useSoundEffects';

export function ManualTradingScreen() {
  const { progress } = useGamification(userId);
  const { currentWinStreak, currentStreak } = useStreaks(userId);
  const { dailyQuests } = useQuests(userId);
  const { xpInstances, showXP } = useFloatingXP();
  const sounds = useSoundEffects();

  const [botStatus, setBotStatus] = useState('RUNNING');
  const [sessionTime, setSessionTime] = useState(0);
  const [pnlToday, setPnlToday] = useState(0);
  const [recentTrades, setRecentTrades] = useState([]);

  // Timer de sessão
  useEffect(() => {
    if (botStatus === 'RUNNING') {
      const interval = setInterval(() => {
        setSessionTime((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [botStatus]);

  // Handler de trade completado
  const handleTradeCompleted = (trade) => {
    setRecentTrades((prev) => [trade, ...prev]);

    if (trade.result === 'WIN') {
      sounds.playWin();
      showXP(25, window.innerWidth / 2, window.innerHeight / 2);
    } else {
      sounds.playLoss();
    }
  };

  return (
    <div className="relative min-h-screen bg-deep-space">
      {/* Top Bar */}
      <BotStatusBar
        status={botStatus}
        sessionDuration={sessionTime}
        pnlToday={pnlToday}
        xpGained={progress?.total_xp}
      />

      {/* XP Bar (sempre visível) */}
      <XPBar
        level={progress?.current_level || 1}
        currentXP={progress?.xp_current_level || 0}
        nextLevelXP={progress?.xp_next_level || 100}
        levelTitle={progress?.level_title || 'Novato'}
        compact
      />

      {/* Lightweight Charts aqui */}
      <div className="p-4">
        {/* Seu componente de chart */}
      </div>

      {/* Overlays */}
      <LiveTradeFeed trades={recentTrades} position="right" />
      <StreakOverlay winStreak={currentWinStreak} />
      <StreakBadge streakCount={currentStreak} position="top-right" />
      <NextTradePreview secondsUntilNext={15} nextAsset="EURUSD" />
      <QuestTracker quests={dailyQuests} position="left" />

      {/* Floating XP */}
      {xpInstances.map((instance) => (
        <FloatingXP
          key={instance.id}
          amount={instance.amount}
          x={instance.x}
          y={instance.y}
        />
      ))}
    </div>
  );
}
```

## 📱 Exemplo de Integração - Modo Auto

```tsx
export function AutoTradingScreen() {
  const { progress } = useGamification(userId);
  const { currentStreak } = useStreaks(userId);
  const { dailyQuests } = useQuests(userId);
  const sounds = useSoundEffects();

  return (
    <div className="relative min-h-screen bg-deep-space">
      {/* Command Center */}
      <CommandCenter
        botStatus="SCANNING"
        currentAsset="EURUSD"
        sessionTime={sessionTime}
        userLevel={progress?.current_level}
      />

      {/* XP Bar */}
      <XPBar {...progress} compact />

      {/* PnL Chart aqui */}
      <div className="p-4">
        {/* Seu componente de PnL chart */}
      </div>

      {/* Metrics Grid */}
      <div className="p-4">
        <MetricsGrid
          winRate={65.5}
          profit={pnlToday}
          totalTrades={totalTrades}
        />
      </div>

      {/* Quest Tracker */}
      <QuestTracker quests={dailyQuests} position="left" />

      {/* Streak Badge */}
      <StreakBadge streakCount={currentStreak} position="top-right" />
    </div>
  );
}
```

## 🎨 Customização

Todos os componentes aceitam `className` para customização adicional:

```tsx
<BotStatusBar
  {...props}
  className="shadow-2xl"
/>
```

## ⚡ Performance

- Todos os componentes usam `framer-motion` para animações otimizadas
- Sound effects são preloaded para playback instantâneo
- Trade feed usa `AnimatePresence` com `popLayout` para evitar layout shifts
- Progress bars usam CSS transforms (GPU-accelerated)

## 🔊 Sons Recomendados

Você pode usar sons de:
- [Zapsplat](https://www.zapsplat.com/) (free)
- [Freesound](https://freesound.org/) (creative commons)
- [Mixkit](https://mixkit.co/free-sound-effects/) (free)

Ou criar seus próprios com ferramentas como Audacity.
