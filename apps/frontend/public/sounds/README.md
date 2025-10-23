# Sound Effects for Gamification

This folder contains sound effects for the Mivra Fintech gamification system.

## Sound Files

### 1. **win.mp3**
- **Trigger**: Every time a user wins a trade
- **When**: Immediately after a trade closes with WIN result
- **Frequency**: Very frequent (multiple times per session)

### 2. **level-up.mp3**
- **Trigger**: Every time the user advances to a new level
- **When**: User's total XP reaches next level threshold
- **Frequency**: Rare (only on level progression)

### 3. **winner-session.mp3**
- **Trigger**: When a positive trading session ends
- **When**: User clicks "Close & Reset Session" with P&L > 0
- **Frequency**: Occasional (only on profitable sessions)

### 4. **switch-pages.mp3**
- **Trigger**: Navigation or mode switching
- **When**:
  - User clicks on different page (Settings, History, Profile, Scanner)
  - User switches between Auto Mode and Manual Mode in Operations
- **Frequency**: Frequent (every navigation)

### 5. **streak.mp3**
- **Trigger**: When user achieves 3+ consecutive wins
- **When**: Third win in a row is achieved
- **Frequency**: Common (with winning streaks)

## Sound Specifications

- **Format**: MP3
- **Sample Rate**: 44.1 kHz
- **Bit Rate**: 128-192 kbps
- **Duration**: 0.5-2 seconds
- **Channels**: Mono or Stereo

## Files Summary Table

| File | Trigger | Where | Frequency |
|------|---------|-------|-----------|
| win.mp3 | Trade WIN | Trade result handler | Very Frequent |
| level-up.mp3 | Level up | Gamification system | Rare |
| winner-session.mp3 | Session end (Profit) | Session Summary | Occasional |
| switch-pages.mp3 | Navigation/Mode switch | Route change, mode change | Frequent |
| streak.mp3 | 3+ consecutive wins | Streak system | Common |

