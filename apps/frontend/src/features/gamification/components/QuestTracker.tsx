/**
 * QuestTracker Component
 * Displays active quests with progress bars and claim functionality
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useShallow } from 'zustand/react/shallow';
import { useQuests } from '../../../hooks/useGamification';
import { cn } from '@/shared/utils/cn';

interface QuestTrackerProps {
  userId: string | null;
  maxQuests?: number;
}

export function QuestTracker({ userId, maxQuests = 6 }: QuestTrackerProps) {
  const {
    dailyQuests,
    weeklyQuests,
    claimableQuests,
    hasClaimableQuests,
    claimQuest,
    isLoading,
    error,
  } = useQuests(userId);

  // Combine and sort quests by progress
  const allQuests = useMemo(() => {
    const combined = [...dailyQuests, ...weeklyQuests].sort((a, b) => {
      const progressA = a.current_progress / a.target_value;
      const progressB = b.current_progress / b.target_value;
      return progressB - progressA; // Sort by progress (highest first)
    });
    return combined.slice(0, maxQuests);
  }, [dailyQuests, weeklyQuests, maxQuests]);

  // Get quest icon based on type
  const getQuestIcon = (questName: string): string => {
    const nameUpper = questName.toUpperCase();
    if (nameUpper.includes('VOLUME')) return '📊';
    if (nameUpper.includes('WIN')) return '🏆';
    if (nameUpper.includes('SCANNER')) return '🔍';
    if (nameUpper.includes('LOGIN') || nameUpper.includes('GRIND')) return '💪';
    if (nameUpper.includes('STREAK')) return '🔥';
    if (nameUpper.includes('PROFIT')) return '💰';
    return '🎯';
  };

  // Calculate time remaining
  const getTimeRemaining = (expiresAt: string | undefined): string | null => {
    if (!expiresAt) return null;
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return 'Expirado';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (!userId) {
    return (
      <div className="flex items-center justify-center p-8 text-slate-400">
        <p>Sign in to view your quests</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-red-400">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Missões Ativas</h3>
          <p className="text-xs text-slate-400 mt-1">
            {claimableQuests.length} completada{claimableQuests.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Quests List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center p-6">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : allQuests.length === 0 ? (
          <div className="flex items-center justify-center p-6 text-slate-400 text-sm">
            <p>Nenhuma missão ativa</p>
          </div>
        ) : (
          allQuests.map((quest, index) => {
            const progress = (quest.current_progress / quest.target_value) * 100;
            const isCompleted = progress >= 100;
            const isClaimable = claimableQuests.some((q) => q.id === quest.id);
            const timeRemaining = getTimeRemaining(quest.expires_at);

            return (
              <motion.div
                key={quest.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  'p-3 rounded-lg border backdrop-blur-lg transition-all bg-gradient-to-r',
                  quest.quest_type === 'daily' && 'from-blue-900/40 to-blue-800/40 border-blue-500/30',
                  quest.quest_type === 'weekly' && 'from-purple-900/40 to-purple-800/40 border-purple-500/30',
                  quest.quest_type === 'special' && 'from-amber-900/40 to-amber-800/40 border-amber-500/30',
                  !['daily', 'weekly', 'special'].includes(quest.quest_type) && 'from-slate-900/40 to-slate-800/40 border-slate-500/30',
                  isClaimable && 'ring-2 ring-primary/50'
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="text-xl flex-shrink-0 mt-0.5">
                    {getQuestIcon(quest.quest_name)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Title and badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold text-white truncate">
                        {quest.quest_name}
                      </h4>
                      <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/70">
                        {quest.quest_type === 'daily' ? 'Diária' : 'Semanal'}
                      </span>
                      {timeRemaining && (
                        <span className="text-xs text-white/60">
                          ⏱️ {timeRemaining}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {quest.quest_description && (
                      <p className="text-xs text-slate-300 mt-1 line-clamp-1">
                        {quest.quest_description}
                      </p>
                    )}

                    {/* Progress */}
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-300">
                          {quest.current_progress} / {quest.target_value}
                        </span>
                        <span className="text-xs font-semibold text-white">
                          {Math.round(progress)}%
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full h-1.5 rounded-full bg-slate-800/60 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(progress, 100)}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                          className={cn(
                            'h-full rounded-full',
                            isClaimable
                              ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                              : 'bg-gradient-to-r from-primary to-primary/70'
                          )}
                        />
                      </div>
                    </div>

                    {/* Reward */}
                    <div className="flex items-center gap-1 mt-2 text-xs text-white/70">
                      <span>Recompensa:</span>
                      <span className="font-semibold text-white">+{quest.xp_reward || 0} XP</span>
                    </div>
                  </div>

                  {/* Claim Button */}
                  {isClaimable && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => claimQuest(quest.id)}
                      className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/50 font-semibold text-xs transition-all"
                    >
                      Claim
                    </motion.button>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* View all button */}
      {allQuests.length > 0 && (
        <button className="w-full py-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors">
          Ver todas as missões →
        </button>
      )}
    </div>
  );
}

export default QuestTracker;
