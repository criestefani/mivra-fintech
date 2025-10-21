/**
 * NotificationToast Component
 * Displays real-time gamification notifications with animations
 */

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useShallow } from 'zustand/react/shallow';
import { useGamificationStore } from '../../../stores/gamificationStore';
import { cn } from '@/shared/utils/cn';

export function NotificationToast() {
  const { recentNotification } = useGamificationStore(
    useShallow((state) => ({
      recentNotification: state.recentNotification,
    }))
  );

  // Memoize to prevent unnecessary re-renders
  const hasNotification = useMemo(() => !!recentNotification, [recentNotification]);

  if (!hasNotification) return null;

  // Color scheme based on event type
  const colorScheme = useMemo(() => {
    switch (recentNotification?.event_type) {
      case 'badge_unlock':
        return {
          bg: 'from-purple-900/80 to-purple-800/80',
          border: 'border-purple-500/50',
          icon: '🏆',
        };
      case 'level_up':
        return {
          bg: 'from-emerald-900/80 to-emerald-800/80',
          border: 'border-emerald-500/50',
          icon: '⬆️',
        };
      case 'quest_completed':
        return {
          bg: 'from-blue-900/80 to-blue-800/80',
          border: 'border-blue-500/50',
          icon: '🎯',
        };
      case 'leaderboard_achievement':
        return {
          bg: 'from-amber-900/80 to-amber-800/80',
          border: 'border-amber-500/50',
          icon: '🏅',
        };
      case 'streak_warning':
        return {
          bg: 'from-orange-900/80 to-orange-800/80',
          border: 'border-orange-500/50',
          icon: '⚠️',
        };
      case 'deposit_received':
        return {
          bg: 'from-green-900/80 to-green-800/80',
          border: 'border-green-500/50',
          icon: '💰',
        };
      default:
        return {
          bg: 'from-slate-900/80 to-slate-800/80',
          border: 'border-slate-500/50',
          icon: '📬',
        };
    }
  }, [recentNotification?.event_type]);

  return (
    <AnimatePresence mode="wait">
      {hasNotification && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: 20 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: -20, x: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-6 right-6 z-50 max-w-sm"
        >
          {/* Glow effect background */}
          <div
            className={cn(
              'absolute inset-0 rounded-lg blur-xl opacity-50',
              recentNotification?.event_type === 'badge_unlock' ? 'bg-purple-500' : '',
              recentNotification?.event_type === 'level_up' ? 'bg-emerald-500' : '',
              recentNotification?.event_type === 'quest_completed' ? 'bg-blue-500' : '',
              recentNotification?.event_type === 'leaderboard_achievement' ? 'bg-amber-500' : ''
            )}
          />

          {/* Main notification card */}
          <div
            className={cn(
              'relative backdrop-blur-xl border rounded-lg p-4',
              `bg-gradient-to-br ${colorScheme.bg}`,
              colorScheme.border,
              'shadow-2xl'
            )}
          >
            <div className="flex gap-3">
              {/* Icon */}
              <div className="text-2xl flex-shrink-0 flex items-center justify-center">
                {recentNotification?.icon || colorScheme.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Title */}
                <h3 className="text-white font-semibold text-sm truncate">
                  {recentNotification?.title}
                </h3>

                {/* Message */}
                <p className="text-slate-200 text-xs mt-1 line-clamp-2">
                  {recentNotification?.message}
                </p>

                {/* Metadata if available */}
                {recentNotification?.data && (
                  <div className="text-xs text-slate-300 mt-2 space-y-0.5">
                    {recentNotification.event_type === 'level_up' && (
                      <div>
                        Level {recentNotification.data.new_level} • {recentNotification.data.level_title}
                      </div>
                    )}
                    {recentNotification.event_type === 'badge_unlock' && (
                      <div>
                        {recentNotification.data.badge_rarity} • +{recentNotification.data.xp_reward} XP
                      </div>
                    )}
                    {recentNotification.event_type === 'quest_completed' && (
                      <div>Quest progress: 100% complete</div>
                    )}
                    {recentNotification.event_type === 'leaderboard_achievement' && (
                      <div>
                        #{recentNotification.data.rank} • {recentNotification.data.category} (
                        {recentNotification.data.period})
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 6, ease: 'linear' }}
              className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent origin-left"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default NotificationToast;
