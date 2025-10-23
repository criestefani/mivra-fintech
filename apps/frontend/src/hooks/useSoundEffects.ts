/**
 * useSoundEffects Hook
 * Sound effects system using Howler.js
 */

import { Howl } from 'howler';
import { useRef, useCallback, useEffect } from 'react';

interface SoundConfig {
  volume?: number;
  enabled?: boolean;
}

/**
 * Hook to manage sound effects
 * Preloads and caches sounds for instant playback
 */
export function useSoundEffects(config: SoundConfig = {}) {
  const { volume = 0.5, enabled = true } = config;
  const soundsRef = useRef<Record<string, Howl>>({});

  // Initialize sounds
  useEffect(() => {
    soundsRef.current = {
      win: new Howl({
        src: ['/sounds/win.mp3'],
        volume,
        preload: true,
      }),
      levelup: new Howl({
        src: ['/sounds/level-up.mp3'],
        volume: volume * 1.2, // Louder for level ups
        preload: true,
      }),
      winnersession: new Howl({
        src: ['/sounds/winner-session.mp3'],
        volume: volume * 1.1, // Slightly louder for session celebrations
        preload: true,
      }),
      switchpages: new Howl({
        src: ['/sounds/switch-pages.mp3'],
        volume: volume * 0.6, // Quieter for navigation
        preload: true,
      }),
      streak: new Howl({
        src: ['/sounds/streak.mp3'],
        volume: volume * 0.9,
        preload: true,
      }),
    };

    return () => {
      // Cleanup: unload all sounds
      Object.values(soundsRef.current).forEach((sound) => sound.unload());
    };
  }, [volume]);

  // Play sound with error handling
  const playSound = useCallback(
    (soundName: keyof typeof soundsRef.current) => {
      if (!enabled) return;

      const sound = soundsRef.current[soundName];
      if (sound) {
        try {
          sound.play();
        } catch (error) {
          console.warn(`Failed to play sound: ${soundName}`, error);
        }
      }
    },
    [enabled]
  );

  // Specific sound methods
  const playWin = useCallback(() => playSound('win'), [playSound]);
  const playLevelUp = useCallback(() => playSound('levelup'), [playSound]);
  const playWinnerSession = useCallback(() => playSound('winnersession'), [playSound]);
  const playSwitchPages = useCallback(() => playSound('switchpages'), [playSound]);
  const playStreak = useCallback(() => playSound('streak'), [playSound]);

  return {
    playWin,
    playLevelUp,
    playWinnerSession,
    playSwitchPages,
    playStreak,
    playSound,
  };
}

/**
 * Helper hook to auto-play sounds based on events
 */
export function useAutoSoundEffects() {
  const sounds = useSoundEffects();

  // You can use this with gamification stores to auto-play sounds
  // Example:
  // const { recentXPGain } = useGamificationStore();
  // useEffect(() => {
  //   if (recentXPGain) sounds.playXP();
  // }, [recentXPGain]);

  return sounds;
}

/**
 * Sound effects configuration
 * Place this in a settings context
 */
export interface SoundSettings {
  enabled: boolean;
  volume: number; // 0-1
  muteOnLoss: boolean;
}

export const defaultSoundSettings: SoundSettings = {
  enabled: true,
  volume: 0.5,
  muteOnLoss: false,
};
