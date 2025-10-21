/**
 * useGamification Hook
 * Main hook for gamification system
 */

import { useEffect, useCallback } from 'react';
import {
  useGamificationStore,
  selectProgress,
  selectBadges,
  selectWinRate,
  selectXPProgress,
} from '../stores/gamificationStore';
import { useStreaksStore, selectCurrentStreak, selectStreakBonusXP } from '../stores/streaksStore';
import { useQuestsStore, selectActiveQuests } from '../stores/questsStore';

/**
 * Main gamification hook
 * Provides access to all gamification data and actions
 */
export function useGamification(userId: string | null) {
  // Stores
  const { progress, badges, isLoading, error, fetchProgress, fetchBadges } = useGamificationStore();
  const { currentStreak, fetchQuests } = useStreaksStore();
  const { dailyQuests } = useQuestsStore();

  // Fetch initial data when userId changes
  useEffect(() => {
    if (userId) {
      fetchProgress(userId);
      fetchBadges(userId);
      fetchQuests(userId);
    }
  }, [userId, fetchProgress, fetchBadges, fetchQuests]);

  // Refresh function
  const refresh = useCallback(async () => {
    if (userId) {
      await fetchProgress(userId);
      await fetchBadges(userId);
      await fetchQuests(userId);
    }
  }, [userId, fetchProgress, fetchBadges, fetchQuests]);

  return {
    // User Progress
    progress,
    badges,
    currentStreak,
    dailyQuests,

    // Computed values
    winRate: useGamificationStore(selectWinRate),
    xpProgress: useGamificationStore(selectXPProgress),
    streakBonusXP: useStreaksStore(selectStreakBonusXP),

    // State
    isLoading,
    error,

    // Actions
    refresh,
  };
}

/**
 * Hook specifically for badges
 */
export function useBadges(userId: string | null) {
  const { badges, isLoading, error, fetchBadges } = useGamificationStore();

  useEffect(() => {
    if (userId) {
      fetchBadges(userId);
    }
  }, [userId, fetchBadges]);

  // Group badges by category
  const badgesByCategory = badges.reduce((acc, badge) => {
    const category = badge.badge_category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(badge);
    return acc;
  }, {} as Record<string, typeof badges>);

  // Group badges by rarity
  const badgesByRarity = badges.reduce((acc, badge) => {
    const rarity = badge.badge_rarity || 'common';
    if (!acc[rarity]) acc[rarity] = [];
    acc[rarity].push(badge);
    return acc;
  }, {} as Record<string, typeof badges>);

  return {
    badges,
    badgesByCategory,
    badgesByRarity,
    totalBadges: badges.length,
    isLoading,
    error,
  };
}

/**
 * Hook specifically for streaks
 */
export function useStreaks(userId: string | null) {
  const {
    currentStreak,
    bestStreak,
    currentWinStreak,
    bestWinStreak,
    freezesAvailable,
    streakIncreased,
    milestoneReached,
  } = useStreaksStore();

  const streakBonusXP = useStreaksStore(selectStreakBonusXP);

  // Check if streak is in danger (last trade was yesterday)
  const isInDanger = useStreaksStore((state) => {
    const lastTradeDate = state.lastTradeDate;
    if (!lastTradeDate) return false;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    return lastTradeDate === yesterdayStr && state.currentStreak > 0;
  });

  return {
    // Daily Streak
    currentStreak,
    bestStreak,
    isInDanger,
    streakBonusXP,
    freezesAvailable,

    // Win Streak
    currentWinStreak,
    bestWinStreak,

    // Events
    streakIncreased,
    milestoneReached,
  };
}

/**
 * Hook specifically for quests
 */
export function useQuests(userId: string | null) {
  const {
    dailyQuests,
    weeklyQuests,
    specialQuests,
    isLoading,
    error,
    fetchQuests,
    claimQuest,
    recentQuestCompleted,
  } = useQuestsStore();

  useEffect(() => {
    if (userId) {
      fetchQuests(userId);
    }
  }, [userId, fetchQuests]);

  // Get quests that can be claimed
  const claimableQuests = useQuestsStore(selectActiveQuests).filter(
    (q) => q.current_progress >= q.target_value
  );

  // Claim quest handler
  const handleClaimQuest = useCallback(
    async (questId: string) => {
      if (userId) {
        await claimQuest(userId, questId);
      }
    },
    [userId, claimQuest]
  );

  return {
    // Quests by type
    dailyQuests,
    weeklyQuests,
    specialQuests,

    // Claimable quests
    claimableQuests,
    hasClaimableQuests: claimableQuests.length > 0,

    // Actions
    claimQuest: handleClaimQuest,

    // Events
    recentQuestCompleted,

    // State
    isLoading,
    error,
  };
}

/**
 * Hook for demo limits
 */
export function useDemoLimits(userId: string | null) {
  const progress = useGamificationStore(selectProgress);

  const demoLimit = progress?.demo_daily_limit || 0;
  const demoUsed = progress?.demo_trades_today || 0;
  const demoRemaining = Math.max(0, demoLimit - demoUsed);
  const isExploration = progress?.demo_phase === 'exploration';

  // Calculate days remaining in exploration
  const explorationDaysRemaining = isExploration
    ? Math.max(
        0,
        7 -
          Math.floor(
            (Date.now() - new Date(progress?.demo_started_at || Date.now()).getTime()) /
              (1000 * 60 * 60 * 24)
          )
      )
    : 0;

  return {
    demoLimit,
    demoUsed,
    demoRemaining,
    isExploration,
    explorationDaysRemaining,
    isUnlimited: isExploration || demoLimit >= 999999,
    canTrade: isExploration || demoRemaining > 0,
  };
}

/**
 * Hook for scanner tier
 */
export function useScannerTier(userId: string | null) {
  const progress = useGamificationStore(selectProgress);

  const currentTier = progress?.scanner_tier || 1;

  // Scanner tier configuration
  const tierConfig = {
    1: { name: 'FREE', visible: 20, blocked: 10 },
    2: { name: 'INTERMEDIATE', visible: 26, blocked: 4 },
    3: { name: 'PRO', visible: 28, blocked: 2 },
    4: { name: 'ELITE', visible: 30, blocked: 0 },
  }[currentTier] || { name: 'FREE', visible: 20, blocked: 10 };

  // Calculate next tier
  const nextTier = currentTier < 4 ? currentTier + 1 : null;
  const nextTierRequirements = {
    2: { level: 5, deposit: 200 },
    3: { level: 10, deposit: 500 },
    4: { level: 20, deposit: 1500 },
  }[nextTier || 0];

  return {
    currentTier,
    tierName: tierConfig.name,
    visibleAssets: tierConfig.visible,
    blockedAssets: tierConfig.blocked,
    nextTier,
    nextTierRequirements,
    isMaxTier: currentTier === 4,
  };
}

/**
 * Hook for XP animations
 */
export function useXPAnimations() {
  const { recentXPGain, recentLevelUp, recentBadgeUnlock, clearRecentEvents } =
    useGamificationStore();

  return {
    recentXPGain,
    recentLevelUp,
    recentBadgeUnlock,
    clearEvents: clearRecentEvents,
  };
}
