import { createContext, useContext, useRef, useEffect, ReactNode } from 'react'
// @ts-ignore - Howler doesn't have type declarations
import { Howl } from 'howler'

interface SoundContextType {
  // UI Navigation Sounds
  playSwitchPages: () => void
  playClick: () => void

  // Bot Control Sounds
  playStartStopBot: () => void

  // Trade Result Sounds
  playLoss: () => void
  playLoserSession: () => void

  // Gamification Sounds (existing)
  playWin: () => void
  playLevelUp: () => void
  playWinnerSession: () => void
  playStreak: () => void
}

const SoundContext = createContext<SoundContextType | undefined>(undefined)

export const SoundProvider = ({ children }: { children: ReactNode }) => {
  const soundsRef = useRef<Record<string, Howl>>({})
  const isInitializedRef = useRef(false)

  // Initialize sounds ONCE on mount
  useEffect(() => {
    // Avoid re-initialization if already done
    if (isInitializedRef.current) return
    isInitializedRef.current = true

    console.log('🔊 [SoundContext] Initializing sounds...')

    soundsRef.current = {
      // UI Navigation Sounds
      switchpages: new Howl({
        src: ['/sounds/switch-pages.mp3'],
        volume: 0.4,
        preload: 'metadata',
        html5: true,
        onload: () => console.log('✅ switch-pages.mp3 loaded'),
        onloaderror: (id, err) => console.warn('❌ Error loading switch-pages.mp3:', err),
      }),
      click: new Howl({
        src: ['/sounds/click.mp3'],
        volume: 0.3,
        preload: 'metadata',
        html5: true,
        onload: () => console.log('✅ click.mp3 loaded'),
        onloaderror: (id, err) => console.warn('❌ Error loading click.mp3:', err),
      }),

      // Bot Control Sounds
      startstopbot: new Howl({
        src: ['/sounds/startstopBot.mp3'],
        volume: 0.5,
        preload: 'metadata',
        html5: true,
        onload: () => console.log('✅ startstopBot.mp3 loaded'),
        onloaderror: (id, err) => console.warn('❌ Error loading startstopBot.mp3:', err),
      }),

      // Trade Result Sounds
      loss: new Howl({
        src: ['/sounds/loss.mp3'],
        volume: 0.5,
        preload: 'metadata',
        html5: true,
        onload: () => console.log('✅ loss.mp3 loaded'),
        onloaderror: (id, err) => console.warn('❌ Error loading loss.mp3:', err),
      }),
      losersession: new Howl({
        src: ['/sounds/loser-session.mp3'],
        volume: 0.5,
        preload: 'metadata',
        html5: true,
        onload: () => console.log('✅ loser-session.mp3 loaded'),
        onloaderror: (id, err) => console.warn('❌ Error loading loser-session.mp3:', err),
      }),

      // Gamification Sounds (existing - replicate from useSoundEffects)
      win: new Howl({
        src: ['/sounds/win.mp3'],
        volume: 0.5,
        preload: 'metadata',
        html5: true,
        onload: () => console.log('✅ win.mp3 loaded'),
        onloaderror: (id, err) => console.warn('❌ Error loading win.mp3:', err),
      }),
      levelup: new Howl({
        src: ['/sounds/level-up.mp3'],
        volume: 0.6,
        preload: 'metadata',
        html5: true,
        onload: () => console.log('✅ level-up.mp3 loaded'),
        onloaderror: (id, err) => console.warn('❌ Error loading level-up.mp3:', err),
      }),
      winnersession: new Howl({
        src: ['/sounds/winner-session.mp3'],
        volume: 0.55,
        preload: 'metadata',
        html5: true,
        onload: () => console.log('✅ winner-session.mp3 loaded'),
        onloaderror: (id, err) => console.warn('❌ Error loading winner-session.mp3:', err),
      }),
      streak: new Howl({
        src: ['/sounds/streak.mp3'],
        volume: 0.45,
        preload: 'metadata',
        html5: true,
        onload: () => console.log('✅ streak.mp3 loaded'),
        onloaderror: (id, err) => console.warn('❌ Error loading streak.mp3:', err),
      }),
    }

    console.log('🔊 [SoundContext] All sounds initialized')

    // Cleanup on unmount
    return () => {
      console.log('🔊 [SoundContext] Cleaning up sounds...')
      Object.entries(soundsRef.current).forEach(([name, sound]) => {
        try {
          sound.unload()
          console.log(`✅ ${name} unloaded`)
        } catch (e) {
          console.warn(`⚠️ Error unloading ${name}:`, e)
        }
      })
    }
  }, [])

  const playSound = (name: string) => {
    const sound = soundsRef.current[name]
    if (!sound) {
      console.warn(`🔊 Sound "${name}" not found`)
      return
    }

    try {
      // Stop previous if playing
      sound.stop()
      // Play sound
      sound.play()
      console.log(`▶️ Playing: ${name}`)
    } catch (error) {
      console.warn(`❌ Error playing ${name}:`, error)
    }
  }

  const contextValue: SoundContextType = {
    // UI Navigation Sounds
    playSwitchPages: () => playSound('switchpages'),
    playClick: () => playSound('click'),

    // Bot Control Sounds
    playStartStopBot: () => playSound('startstopbot'),

    // Trade Result Sounds
    playLoss: () => playSound('loss'),
    playLoserSession: () => playSound('losersession'),

    // Gamification Sounds
    playWin: () => playSound('win'),
    playLevelUp: () => playSound('levelup'),
    playWinnerSession: () => playSound('winnersession'),
    playStreak: () => playSound('streak'),
  }

  return (
    <SoundContext.Provider value={contextValue}>
      {children}
    </SoundContext.Provider>
  )
}

export const useSound = () => {
  const context = useContext(SoundContext)
  if (!context) {
    throw new Error('🔊 useSound must be used within SoundProvider')
  }
  return context
}

export default SoundContext
