/**
 * Gamification Store
 * Manages XP, levels, badges, and overall gamification state
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// ============================================================
// TYPES
// ============================================================

export interface Badge {
  id: string;
  badge_id: string;
  badge_name: string;
  badge_icon: string;
  badge_category: string;
  badge_rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xp_reward: number;
  earned_at: string;
  metadata?: Record<string, any>;
}

export interface UserProgress {
  id: string;
  user_id: string;

  // XP & Level
  total_xp: number;
  current_level: number;
  xp_current_level: number;
  xp_next_level: number;
  level_title: string;

  // Streaks
  current_streak: number;
  best_streak: number;
  last_trade_date: string | null;
  streak_freezes_available: number;

  // Win Streak
  current_win_streak: number;
  best_win_streak: number;

  // Trade Stats
  total_trades: number;
  total_trades_demo: number;
  total_trades_real: number;
  total_wins: number;
  total_wins_real: number;

  // Demo Limits
  demo_phase: 'exploration' | 'standard';
  demo_trades_today: number;
  demo_last_trade: string | null;
  demo_started_at: string;
  demo_daily_limit: number;

  // Scanner Tier
  scanner_tier: number;

  // Deposits
  total_deposits_last_30_days: number;
  last_deposit_date: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface XPTransaction {
  id: string;
  user_id: string;
  amount: number;
  source: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface LevelUpData {
  old_level: number;
  new_level: number;
  level_title: string;
  level_unlocks: string | null;
}

export interface BadgeUnlockData {
  badge_id: string;
  badge_name: string;
  badge_icon: string;
  xp_reward: number;
}

export interface GameificationNotification {
  id?: string;
  event_type: string;
  title: string;
  message: string;
  icon?: string;
  data?: Record<string, any>;
  timestamp: string;
  is_read?: boolean;
}

// ============================================================
// STORE STATE
// ============================================================

interface GamificationState {
  // User Progress
  progress: UserProgress | null;
  badges: Badge[];
  xpHistory: XPTransaction[];

  // Notifications
  recentNotification: GameificationNotification | null;

  // UI State
  isLoading: boolean;
  error: string | null;

  // Recent Events (for animations)
  recentXPGain: number | null;
  recentLevelUp: LevelUpData | null;
  recentBadgeUnlock: BadgeUnlockData | null;

  // Actions
  setProgress: (progress: UserProgress) => void;
  setBadges: (badges: Badge[]) => void;
  setXPHistory: (history: XPTransaction[]) => void;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Event handlers (for UI animations)
  triggerXPGain: (amount: number) => void;
  triggerLevelUp: (levelUpData: LevelUpData) => void;
  triggerBadgeUnlock: (badgeData: BadgeUnlockData) => void;
  addNotification: (notification: GameificationNotification) => void;
  clearRecentEvents: () => void;

  // API Actions
  fetchProgress: (userId: string) => Promise<void>;
  fetchBadges: (userId: string) => Promise<void>;
  fetchXPHistory: (userId: string, limit?: number) => Promise<void>;

  // Reset
  reset: () => void;
}

// ============================================================
// INITIAL STATE
// ============================================================

const initialState = {
  progress: null,
  badges: [],
  xpHistory: [],
  recentNotification: null,
  isLoading: false,
  error: null,
  recentXPGain: null,
  recentLevelUp: null,
  recentBadgeUnlock: null,
};

// ============================================================
// STORE
// ============================================================

export const useGamificationStore = create<GamificationState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Setters
        setProgress: (progress) => set({ progress }),
        setBadges: (badges) => set({ badges }),
        setXPHistory: (xpHistory) => set({ xpHistory }),
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),

        // Event triggers (for UI animations)
        triggerXPGain: (amount) => {
          set({ recentXPGain: amount });
          // Auto-clear after 2 seconds
          setTimeout(() => {
            if (get().recentXPGain === amount) {
              set({ recentXPGain: null });
            }
          }, 2000);
        },

        triggerLevelUp: (levelUpData) => {
          set({ recentLevelUp: levelUpData });
          // Auto-clear after 5 seconds
          setTimeout(() => {
            set({ recentLevelUp: null });
          }, 5000);
        },

        triggerBadgeUnlock: (badgeData) => {
          set({ recentBadgeUnlock: badgeData });
          // Auto-clear after 5 seconds
          setTimeout(() => {
            set({ recentBadgeUnlock: null });
          }, 5000);
        },

        addNotification: (notification) => {
          set({ recentNotification: notification });
          // Auto-clear after 6 seconds
          setTimeout(() => {
            set({ recentNotification: null });
          }, 6000);
        },

        clearRecentEvents: () => {
          set({
            recentXPGain: null,
            recentLevelUp: null,
            recentBadgeUnlock: null,
            recentNotification: null,
          });
        },

        // API Actions
        fetchProgress: async (userId: string) => {
          set({ isLoading: true, error: null });
          try {
            const response = await fetch(`/api/gamification/progress/${userId}`);
            if (!response.ok) {
              throw new Error('Failed to fetch progress');
            }
            const data = await response.json();
            set({ progress: data, isLoading: false });
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Unknown error',
              isLoading: false,
            });
          }
        },

        fetchBadges: async (userId: string) => {
          set({ isLoading: true, error: null });
          try {
            const response = await fetch(`/api/gamification/badges/${userId}`);
            if (!response.ok) {
              throw new Error('Failed to fetch badges');
            }
            const data = await response.json();
            set({ badges: data, isLoading: false });
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Unknown error',
              isLoading: false,
            });
          }
        },

        fetchXPHistory: async (userId: string, limit = 50) => {
          set({ isLoading: true, error: null });
          try {
            const response = await fetch(`/api/gamification/xp-history/${userId}?limit=${limit}`);
            if (!response.ok) {
              throw new Error('Failed to fetch XP history');
            }
            const data = await response.json();
            set({ xpHistory: data, isLoading: false });
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Unknown error',
              isLoading: false,
            });
          }
        },

        // Reset
        reset: () => set(initialState),
      }),
      {
        name: 'gamification-storage',
        partialize: (state) => ({
          progress: state.progress,
          badges: state.badges,
        }),
      }
    ),
    { name: 'GamificationStore' }
  )
);

// ============================================================
// SELECTORS (for optimized access)
// ============================================================

export const selectProgress = (state: GamificationState) => state.progress;
export const selectBadges = (state: GamificationState) => state.badges;
export const selectXPHistory = (state: GamificationState) => state.xpHistory;
export const selectIsLoading = (state: GamificationState) => state.isLoading;
export const selectError = (state: GamificationState) => state.error;

// Computed selectors
export const selectWinRate = (state: GamificationState) => {
  const progress = state.progress;
  if (!progress || progress.total_trades_real === 0) return 0;
  return Math.round((progress.total_wins_real / progress.total_trades_real) * 100);
};

export const selectXPProgress = (state: GamificationState) => {
  const progress = state.progress;
  if (!progress) return 0;
  return Math.round((progress.xp_current_level / progress.xp_next_level) * 100);
};

export const selectBadgesByCategory = (state: GamificationState) => {
  const badges = state.badges;
  return badges.reduce((acc, badge) => {
    const category = badge.badge_category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(badge);
    return acc;
  }, {} as Record<string, Badge[]>);
};
