/**
 * Streaks Store
 * Manages daily streaks and win streaks
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ============================================================
// TYPES
// ============================================================

export interface StreakData {
  current_streak: number;
  best_streak: number;
  last_trade_date: string | null;
}

export interface WinStreakData {
  current_win_streak: number;
  best_win_streak: number;
}

export interface StreakMilestone {
  streak: number;
  xp_reward: number;
  reached: boolean;
}

// ============================================================
// STORE STATE
// ============================================================

interface StreaksState {
  // Daily Streak
  currentStreak: number;
  bestStreak: number;
  lastTradeDate: string | null;

  // Win Streak
  currentWinStreak: number;
  bestWinStreak: number;

  // Streak Freezes
  freezesAvailable: number;

  // UI State
  streakIncreased: boolean; // Animation trigger
  milestoneReached: StreakMilestone | null; // For celebration

  // Actions
  setDailyStreak: (data: StreakData) => void;
  setWinStreak: (data: WinStreakData) => void;
  setFreezesAvailable: (count: number) => void;

  // Event triggers
  triggerStreakIncrease: () => void;
  triggerMilestone: (milestone: StreakMilestone) => void;
  clearStreakEvents: () => void;

  // Reset
  reset: () => void;
}

// ============================================================
// MILESTONES CONFIGURATION
// ============================================================

export const STREAK_MILESTONES = [
  { streak: 3, xp_reward: 50 },
  { streak: 7, xp_reward: 150 },
  { streak: 14, xp_reward: 400 },
  { streak: 30, xp_reward: 1000 },
  { streak: 60, xp_reward: 3000 },
];

// ============================================================
// INITIAL STATE
// ============================================================

const initialState = {
  currentStreak: 0,
  bestStreak: 0,
  lastTradeDate: null,
  currentWinStreak: 0,
  bestWinStreak: 0,
  freezesAvailable: 0,
  streakIncreased: false,
  milestoneReached: null,
};

// ============================================================
// STORE
// ============================================================

export const useStreaksStore = create<StreaksState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Setters
      setDailyStreak: (data) => {
        const oldStreak = get().currentStreak;
        const newStreak = data.current_streak;

        set({
          currentStreak: newStreak,
          bestStreak: data.best_streak,
          lastTradeDate: data.last_trade_date,
        });

        // Check if streak increased
        if (newStreak > oldStreak) {
          get().triggerStreakIncrease();

          // Check for milestone
          const milestone = STREAK_MILESTONES.find((m) => m.streak === newStreak);
          if (milestone) {
            get().triggerMilestone({ ...milestone, reached: true });
          }
        }
      },

      setWinStreak: (data) => {
        set({
          currentWinStreak: data.current_win_streak,
          bestWinStreak: data.best_win_streak,
        });
      },

      setFreezesAvailable: (count) => set({ freezesAvailable: count }),

      // Event triggers
      triggerStreakIncrease: () => {
        set({ streakIncreased: true });
        setTimeout(() => set({ streakIncreased: false }), 2000);
      },

      triggerMilestone: (milestone) => {
        set({ milestoneReached: milestone });
        setTimeout(() => set({ milestoneReached: null }), 5000);
      },

      clearStreakEvents: () => {
        set({
          streakIncreased: false,
          milestoneReached: null,
        });
      },

      // Reset
      reset: () => set(initialState),
    }),
    { name: 'StreaksStore' }
  )
);

// ============================================================
// SELECTORS
// ============================================================

export const selectCurrentStreak = (state: StreaksState) => state.currentStreak;
export const selectBestStreak = (state: StreaksState) => state.bestStreak;
export const selectCurrentWinStreak = (state: StreaksState) => state.currentWinStreak;
export const selectFreezesAvailable = (state: StreaksState) => state.freezesAvailable;

// Computed selectors
export const selectStreakBonusXP = (state: StreaksState) => {
  const streak = state.currentStreak;
  if (streak >= 60) return 50;
  if (streak >= 30) return 20;
  if (streak >= 14) return 10;
  if (streak >= 7) return 5;
  return 0;
};

export const selectNextMilestone = (state: StreaksState) => {
  const currentStreak = state.currentStreak;
  return STREAK_MILESTONES.find((m) => m.streak > currentStreak) || null;
};

export const selectStreaksInDanger = (state: StreaksState) => {
  const lastTradeDate = state.lastTradeDate;
  if (!lastTradeDate) return false;

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // If last trade was yesterday, streak is in danger
  return lastTradeDate === yesterdayStr && state.currentStreak > 0;
};
