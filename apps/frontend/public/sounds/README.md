# Sound Effects System for Mivra Fintech

This folder contains all sound effects for the Mivra Fintech trading application, including gamification sounds, UI feedback, and bot control sounds.

## Architecture

### Context-Based Singleton Pattern

The sound system is implemented using a **React Context + useRef Singleton Pattern** to ensure:
- **Single instance** of all sounds across the entire application
- **No memory leaks** - sounds persist throughout app lifecycle
- **Consistent audio** - all sounds loaded once at app mount
- **Easy integration** - simple `useSound()` hook in any component
- **Type-safe** - TypeScript interfaces for all sound methods

**Implementation Location**: `apps/frontend/src/contexts/SoundContext.tsx`

### How It Works

1. **SoundProvider** wraps the entire app (in App.tsx)
2. **useRef** stores Howler.js Howl instances (never recreated)
3. **useEffect** initializes sounds exactly ONCE on mount
4. **useSound hook** provides access to 9 sound methods from any component
5. **Cleanup** automatically unloads all sounds on app unmount

```tsx
// In App.tsx
<SoundProvider>
  {/* All components have access to useSound */}
</SoundProvider>

// In any component
const { playWin, playClick, playStartStopBot } = useSound();
```

## Sound Files (10 Total)

### **GAMIFICATION SOUNDS** (5 existing, pre-configured)

#### 1. **win.mp3** ⭐
- **Trigger**: Every trade win
- **Location**: Trade result effect in Operations.tsx
- **Frequency**: Very frequent (multiple per session)
- **Volume**: 0.5 (50%)
- **When**: Immediately when trade closes with WIN result

#### 2. **level-up.mp3** 🎯
- **Trigger**: User advances to new level
- **Location**: Gamification system (automatic via store)
- **Frequency**: Rare (only on level progression)
- **Volume**: 0.6 (60%)
- **When**: User's total XP reaches next threshold

#### 3. **winner-session.mp3** 🏆
- **Trigger**: Profitable session ends
- **Location**: Session summary modal
- **Frequency**: Occasional (positive sessions)
- **Volume**: 0.44 (44%)
- **When**: User closes session with P&L > 0

#### 4. **switch-pages.mp3** 🔄
- **Trigger**: Navigation or mode switching
- **Location**: Sidebar navigation, Mode toggle
- **Frequency**: Frequent (every page change)
- **Volume**: 0.32 (32%)
- **When**:
  - User clicks Sidebar link (Operations, History, Settings, Profile)
  - User switches between Auto/Manual mode
  - Mobile bottom nav clicks

#### 5. **streak.mp3** 🔥
- **Trigger**: 3+ consecutive wins
- **Location**: Streak detection in Operations.tsx
- **Frequency**: Common (with winning streaks)
- **Volume**: 0.45 (45%)
- **When**: Win count reaches 3, 4, 5, etc.

---

### **NEW UI SOUNDS** (2 new, for all clicks)

#### 6. **click.mp3** 🖱️
- **Trigger**: Generic UI button clicks
- **Location**: Menu buttons, dropdown selections, dialogs
- **Frequency**: Very frequent (every interactive element)
- **Volume**: 0.3 (30%)
- **Where Used**:
  - DashboardHeader: Menu button, Deposit button, Settings button, Logout, etc.
  - Operations: Strategy dropdown, Advanced settings buttons, help icons
  - Sidebar: All navigation items

#### 7. **loser-session.mp3** ❌
- **Trigger**: Losing session ends
- **Location**: Session summary modal
- **Frequency**: Occasional (negative sessions)
- **Volume**: 0.25 (25%)
- **When**: User closes session with P&L < 0

---

### **NEW BOT CONTROL SOUNDS** (3 new)

#### 8. **startstopBot.mp3** ⏱️ (Play/Stop)
- **Trigger**: Bot start/stop clicked
- **Location**: Operations page, bot control buttons
- **Frequency**: Occasional (bot session start/stop)
- **Volume**: 0.5 (50%)
- **When**:
  - User clicks "Start Bot" button
  - User clicks "Stop Bot" button

#### 9. **loss.mp3** 📉
- **Trigger**: Individual trade loss
- **Location**: Trade result effect in Operations.tsx
- **Frequency**: Very frequent (multiple losses per session)
- **Volume**: 0.25 (25%)
- **When**: Trade closes with LOSS result

---

## Sound Specifications

- **Format**: MP3
- **Sample Rate**: 44.1 kHz
- **Bit Rate**: 128-192 kbps
- **Duration**: 0.5-2 seconds
- **Channels**: Mono or Stereo
- **Preload**: 'metadata' (lightweight loading)
- **Audio Library**: Howler.js v2.2.4

## Summary Table

| # | File | Trigger | Location | Frequency | Volume |
|---|------|---------|----------|-----------|--------|
| 1 | win.mp3 | Trade WIN | Operations trade effect | Very Frequent | 50% |
| 2 | level-up.mp3 | Level advancement | Gamification store | Rare | 60% |
| 3 | winner-session.mp3 | Session profit | Session summary | Occasional | 44% |
| 4 | switch-pages.mp3 | Navigation | Sidebar, Mode toggle | Frequent | 32% |
| 5 | streak.mp3 | 3+ win streak | Streak detection | Common | 45% |
| 6 | click.mp3 | UI button click | Menu, dropdowns, buttons | Very Frequent | 30% |
| 7 | loser-session.mp3 | Session loss | Session summary | Occasional | 25% |
| 8 | startstopBot.mp3 | Bot control | Start/Stop buttons | Occasional | 35% |
| 9 | loss.mp3 | Trade LOSS | Operations trade effect | Very Frequent | 25% |

## Component Integration Points

### **Sidebar.tsx**
- **Sound**: `playSwitchPages()`
- **Trigger**: Navigation link clicks (both desktop and mobile)
- **Line**: 58, 93

### **DashboardHeader.tsx**
- **Sounds**: `playClick()` for all interactions
- **Triggers**:
  - Menu button (open/close)
  - Deposit button
  - Account toggle
  - Menu item selections (Settings, Withdraw, Reload Demo, Logout)
- **Lines**: Multiple onClick handlers

### **Operations.tsx**
- **Sounds**: Multiple depending on mode and action
- **Triggers**:
  - `playSwitchPages()`: Mode toggle (Auto ↔ Manual)
  - `playClick()`: Strategy dropdown, Advanced settings, Help buttons
  - `playStartStopBot()`: Start Bot / Stop Bot buttons
  - `playWin()`: Trade WIN result
  - `playLoss()`: Trade LOSS result
  - `playWinnerSession()`: Session ends with profit
  - `playLoserSession()`: Session ends with loss
  - `playStreak()`: 3+ consecutive wins detected

## Usage in Components

### Basic Import and Usage

```tsx
import { useSound } from '@/contexts/SoundContext';

export const MyComponent = () => {
  const { playClick, playWin, playStartStopBot } = useSound();

  return (
    <button onClick={() => {
      playClick();
      // Do something
    }}>
      Click Me
    </button>
  );
};
```

### Integration Pattern

1. Import the hook
2. Destructure needed sounds
3. Call in event handlers
4. Sounds play immediately with no setup needed

## File Locations

```
apps/
├── frontend/
│   ├── public/sounds/          # All sound files (this folder)
│   │   ├── win.mp3
│   │   ├── level-up.mp3
│   │   ├── winner-session.mp3
│   │   ├── switch-pages.mp3
│   │   ├── streak.mp3
│   │   ├── click.mp3
│   │   ├── loser-session.mp3
│   │   ├── startstopBot.mp3
│   │   ├── loss.mp3
│   │   └── README.md
│   ├── src/
│   │   ├── contexts/SoundContext.tsx    # Context implementation
│   │   ├── features/dashboard/
│   │   │   └── components/
│   │   │       ├── Sidebar.tsx          # Navigation sounds
│   │   │       └── DashboardHeader.tsx  # Menu/UI sounds
│   │   └── pages/
│   │       └── Operations.tsx           # All bot/trade sounds
│   └── App.tsx                          # SoundProvider wrapper
```

## Best Practices

### ✅ DO

- Use `useSound()` hook directly in components
- Call sounds in event handlers (onClick, onChange, etc.)
- Keep sound calls fast and non-blocking
- Test sounds work on mobile (autoplay restrictions may apply)

### ❌ DON'T

- Call sounds inside render functions
- Try to create new Howl instances in components
- Call `useSoundEffects()` hook (old system - deprecated)
- Forget to add sounds to interactive elements

## Error Handling

- **Silent Failures**: If a sound file is missing, it logs a warning but doesn't crash
- **Mobile Autoplay**: Browsers may restrict audio; handled gracefully
- **Type Safety**: TypeScript ensures only valid sounds can be called

## Maintenance Notes

- All sounds initialized once at app mount (performance optimized)
- Sounds persist throughout session (no re-initialization)
- Automatic cleanup on app unmount
- No memory leaks (proper resource management)
- Add new sounds: Edit SoundContext.tsx + add MP3 file

## Future Enhancements

- [ ] Global volume control in Settings
- [ ] Mute/unmute toggle
- [ ] Sound preference persistence
- [ ] Custom sound themes
- [ ] Per-sound enable/disable toggles

---

**Last Updated**: October 24, 2025
**System**: Context + Singleton Pattern (React Context + useRef)
**Status**: ✅ Production Ready
