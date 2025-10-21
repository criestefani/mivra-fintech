# Sound Effects for Gamification

This folder contains sound effects for the gamification system.

## Required Sound Files

Place the following MP3 files in this directory:

1. **win.mp3** - Victory sound (upbeat, rewarding)
   - Plays when a trade wins
   - Volume: 100%

2. **loss.mp3** - Loss sound (subtle, not harsh)
   - Plays when a trade loses
   - Volume: 70% (quieter than wins)

3. **levelup.mp3** - Level up celebration
   - Plays when user reaches a new level
   - Volume: 120% (louder for big moments)

4. **achievement.mp3** - Achievement unlock
   - Plays when a badge is unlocked
   - Volume: 100%

5. **xp.mp3** - XP gain (subtle ping)
   - Plays when XP is awarded
   - Volume: 50% (very subtle)

6. **click.mp3** - UI click sound
   - Plays on button clicks
   - Volume: 30% (very quiet)

7. **streak.mp3** - Win streak celebration
   - Plays on 3+ win streak
   - Volume: 80%

## Recommended Sound Sources

### Free Resources:
- [Zapsplat](https://www.zapsplat.com/) - High-quality free sounds
- [Freesound](https://freesound.org/) - Creative Commons library
- [Mixkit](https://mixkit.co/free-sound-effects/) - Free commercial use

### Creating Your Own:
- Use [Audacity](https://www.audacityteam.org/) (free audio editor)
- Use online tone generators like [BeepBox](https://beepbox.co/)
- Record your own sounds with a microphone

## Sound Specifications

- **Format**: MP3 (widely supported)
- **Sample Rate**: 44.1 kHz recommended
- **Bit Rate**: 128-192 kbps (good balance of quality/size)
- **Duration**: 0.5-2 seconds (short and punchy)
- **Channels**: Mono or Stereo

## Temporary Solution

Until you add real sounds, the app will continue to work - sounds just won't play.
The `useSoundEffects` hook has error handling for missing files.

## Example Sound Ideas

- **Win**: Bell chime, cha-ching, success ding
- **Loss**: Subtle whoosh, gentle beep (avoid harsh sounds)
- **Level Up**: Fanfare, power-up sound, rising arpeggio
- **Achievement**: Trophy unlock, badge ping
- **XP**: Coin collect, subtle click
- **Streak**: Fire ignition, combo sound
