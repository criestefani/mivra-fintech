import { motion } from 'framer-motion';
import { XPBar } from '@/components/ui/gamification';
import type { UserStats } from '../hooks/useUserProfile';

interface ProfileHeaderProps {
  stats: UserStats | undefined;
  rank: number | null;
}

export function ProfileHeader({ stats, rank }: ProfileHeaderProps) {
  if (!stats) {
    return (
      <div className="flex items-center gap-6 text-slate-400">
        <div className="w-24 h-24 bg-gradient-to-br from-slate-700 to-slate-800 rounded-full animate-pulse" />
        <div className="space-y-2">
          <div className="h-8 bg-slate-700 rounded w-32 animate-pulse" />
          <div className="h-4 bg-slate-800 rounded w-24 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col md:flex-row items-start md:items-center gap-6"
    >
      {/* Avatar */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-5xl font-bold text-white flex-shrink-0 shadow-lg shadow-primary/30"
      >
        {stats.user_id?.[0]?.toUpperCase() || '👤'}
      </motion.div>

      {/* Info */}
      <div className="flex-1 space-y-3">
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">
            Level {stats.current_level}
          </h1>
          <p className="text-slate-400 text-sm md:text-base lg:text-lg">
            {stats.level_title} • {stats.total_xp.toLocaleString()} XP
          </p>
          {rank && (
            <p className="text-primary font-semibold text-sm mt-1">
              🏆 Rank #{rank}
            </p>
          )}
        </div>

        {/* XP Bar */}
        <div className="w-full max-w-md">
          <XPBar
            level={stats.current_level}
            currentXP={stats.xp_current_level || 0}
            nextLevelXP={stats.xp_next_level || 1}
            levelTitle={stats.level_title}
          />
          <p className="text-xs text-slate-500 mt-2">
            {(stats.xp_current_level || 0).toLocaleString()} / {(stats.xp_next_level || 1).toLocaleString()} XP
          </p>
        </div>
      </div>
    </motion.div>
  );
}
