/**
 * useGamification Hook
 * Main hook for gamification system
 */

import { useEffect, useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
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
  // Stores (useShallow to prevent infinite loops from object destructuring)
  const { progress, badges, isLoading, error, fetchProgress, fetchBadges } = useGamificationStore(
    useShallow((state) => ({
      progress: state.progress,
      badges: state.badges,
      isLoading: state.isLoading,
      error: state.error,
      fetchProgress: state.fetchProgress,
      fetchBadges: state.fetchBadges,
    }))
  );
  const { currentStreak } = useStreaksStore(
    useShallow((state) => ({
      currentStreak: state.currentStreak,
    }))
  );
  const { dailyQuests, fetchQuests } = useQuestsStore(
    useShallow((state) => ({
      dailyQuests: state.dailyQuests,
      fetchQuests: state.fetchQuests,
    }))
  );

  // Computed values (before return to avoid recreating on every render)
  const winRate = useGamificationStore(selectWinRate);
  const xpProgress = useGamificationStore(selectXPProgress);
  const streakBonusXP = useStreaksStore(selectStreakBonusXP);

  // Fetch initial data when userId changes
  useEffect(() => {
    if (userId) {
      fetchProgress(userId);
      fetchBadges(userId);
      fetchQuests(userId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]); // Only depend on userId, not on functions

  // Refresh function
  const refresh = useCallback(async () => {
    if (userId) {
      await fetchProgress(userId);
      await fetchBadges(userId);
      await fetchQuests(userId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]); // Only depend on userId, not on functions

  return {
    // User Progress
    progress,
    badges,
    currentStreak,
    dailyQuests,

    // Computed values
    winRate,
    xpProgress,
    streakBonusXP,

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
  const { badges, isLoading, error, fetchBadges } = useGamificationStore(
    useShallow((state) => ({
      badges: state.badges,
      isLoading: state.isLoading,
      error: state.error,
      fetchBadges: state.fetchBadges,
    }))
  );

  useEffect(() => {
    if (userId) {
      fetchBadges(userId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]); // Only depend on userId, not on functions

  // Group badges by category (memoized)
  const badgesByCategory = useMemo(
    () =>
      badges.reduce((acc, badge) => {
        const category = badge.badge_category || 'other';
        if (!acc[category]) acc[category] = [];
        acc[category].push(badge);
        return acc;
      }, {} as Record<string, typeof badges>),
    [badges]
  );

  // Group badges by rarity (memoized)
  const badgesByRarity = useMemo(
    () =>
      badges.reduce((acc, badge) => {
        const rarity = badge.badge_rarity || 'common';
        if (!acc[rarity]) acc[rarity] = [];
        acc[rarity].push(badge);
        return acc;
      }, {} as Record<string, typeof badges>),
    [badges]
  );

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
    lastTradeDate,
  } = useStreaksStore(
    useShallow((state) => ({
      currentStreak: state.currentStreak,
      bestStreak: state.bestStreak,
      currentWinStreak: state.currentWinStreak,
      bestWinStreak: state.bestWinStreak,
      freezesAvailable: state.freezesAvailable,
      streakIncreased: state.streakIncreased,
      milestoneReached: state.milestoneReached,
      lastTradeDate: state.lastTradeDate,
    }))
  );

  const streakBonusXP = useStreaksStore(selectStreakBonusXP);

  // Check if streak is in danger (last trade was yesterday) - memoized
  const isInDanger = useMemo(() => {
    if (!lastTradeDate) return false;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    return lastTradeDate === yesterdayStr && currentStreak > 0;
  }, [lastTradeDate, currentStreak]);

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
  } = useQuestsStore(
    useShallow((state) => ({
      dailyQuests: state.dailyQuests,
      weeklyQuests: state.weeklyQuests,
      specialQuests: state.specialQuests,
      isLoading: state.isLoading,
      error: state.error,
      fetchQuests: state.fetchQuests,
      claimQuest: state.claimQuest,
      recentQuestCompleted: state.recentQuestCompleted,
    }))
  );

  useEffect(() => {
    if (userId) {
      fetchQuests(userId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]); // Only depend on userId, not on functions

  // Get quests that can be claimed (useShallow prevents infinite re-renders from array selector)
  const activeQuests = useQuestsStore(useShallow(selectActiveQuests));
  const claimableQuests = useMemo(
    () => activeQuests.filter((q) => q.current_progress >= q.target_value),
    [activeQuests]
  );

  // Claim quest handler
  const handleClaimQuest = useCallback(
    async (questId: string) => {
      if (userId) {
        await claimQuest(userId, questId);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId] // Only depend on userId, not on functions
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

  // Memoize calculated values to avoid recalculation on every render
  return useMemo(() => {
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
  }, [progress]);
}

/**
 * Hook for scanner tier
 */
export function useScannerTier(userId: string | null) {
  const progress = useGamificationStore(selectProgress);

  // Memoize calculated values to avoid recalculation on every render
  return useMemo(() => {
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
  }, [progress?.scanner_tier]);
}

/**
 * Hook for XP animations
 */
export function useXPAnimations() {
  const { recentXPGain, recentLevelUp, recentBadgeUnlock, clearRecentEvents } =
    useGamificationStore(
      useShallow((state) => ({
        recentXPGain: state.recentXPGain,
        recentLevelUp: state.recentLevelUp,
        recentBadgeUnlock: state.recentBadgeUnlock,
        clearRecentEvents: state.clearRecentEvents,
      }))
    );

  return {
    recentXPGain,
    recentLevelUp,
    recentBadgeUnlock,
    clearEvents: clearRecentEvents,
  };
}
