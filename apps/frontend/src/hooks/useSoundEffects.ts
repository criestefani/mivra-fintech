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
    // Note: You'll need to add actual sound files to public/sounds/
    // These are placeholder paths
    soundsRef.current = {
      win: new Howl({
        src: ['/sounds/win.mp3'],
        volume,
        preload: true,
      }),
      loss: new Howl({
        src: ['/sounds/loss.mp3'],
        volume: volume * 0.7, // Quieter for losses
        preload: true,
      }),
      levelup: new Howl({
        src: ['/sounds/levelup.mp3'],
        volume: volume * 1.2, // Louder for level ups
        preload: true,
      }),
      achievement: new Howl({
        src: ['/sounds/achievement.mp3'],
        volume,
        preload: true,
      }),
      xp: new Howl({
        src: ['/sounds/xp.mp3'],
        volume: volume * 0.5, // Very subtle
        preload: true,
      }),
      click: new Howl({
        src: ['/sounds/click.mp3'],
        volume: volume * 0.3,
        preload: true,
      }),
      streak: new Howl({
        src: ['/sounds/streak.mp3'],
        volume: volume * 0.8,
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
  const playLoss = useCallback(() => playSound('loss'), [playSound]);
  const playLevelUp = useCallback(() => playSound('levelup'), [playSound]);
  const playAchievement = useCallback(() => playSound('achievement'), [playSound]);
  const playXP = useCallback(() => playSound('xp'), [playSound]);
  const playClick = useCallback(() => playSound('click'), [playSound]);
  const playStreak = useCallback(() => playSound('streak'), [playSound]);

  return {
    playWin,
    playLoss,
    playLevelUp,
    playAchievement,
    playXP,
    playClick,
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
