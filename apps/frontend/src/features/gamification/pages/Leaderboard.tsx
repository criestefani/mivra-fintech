/**
 * Leaderboard Page Component
 * Displays rankings by period and category with real-time updates
 */

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@clerk/clerk-react';
import { cn } from '@/shared/utils/cn';

const PERIODS = ['daily', 'weekly', 'monthly', 'all_time'];
const CATEGORIES = ['xp', 'volume', 'profit', 'win_rate', 'streak'];

interface LeaderboardEntry {
  user_id: string;
  username?: string;
  rank: number;
  value: number;
  level?: number;
}

interface LeaderboardPageProps {
  limit?: number;
}

export function LeaderboardPage({ limit = 100 }: LeaderboardPageProps) {
  const { userId } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<string>('daily');
  const [selectedCategory, setSelectedCategory] = useState<string>('xp');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch leaderboard data
  useEffect(() => {
    fetchLeaderboard();
  }, [selectedPeriod, selectedCategory]);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/gamification/leaderboards/${selectedPeriod}?category=${selectedCategory}&limit=${limit}`
      );
      if (!response.ok) throw new Error('Failed to fetch leaderboard');
      const data = await response.json();
      setLeaderboard(data || []);

      // Find user's rank
      if (userId) {
        const userEntry = data?.find((entry: LeaderboardEntry) => entry.user_id === userId);
        setUserRank(userEntry || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  // Format value based on category
  const formatValue = (value: number, category: string): string => {
    switch (category) {
      case 'profit':
        return `R$ ${value.toFixed(2)}`;
      case 'win_rate':
        return `${value.toFixed(1)}%`;
      case 'xp':
      case 'volume':
      case 'streak':
        return value.toLocaleString();
      default:
        return value.toString();
    }
  };

  // Get category label
  const getCategoryLabel = (category: string): string => {
    switch (category) {
      case 'xp':
        return 'XP Total';
      case 'volume':
        return 'Volume (Trades)';
      case 'profit':
        return 'Lucro';
      case 'win_rate':
        return 'Taxa de Vitória';
      case 'streak':
        return 'Melhor Streak';
      default:
        return category;
    }
  };

  // Get period label
  const getPeriodLabel = (period: string): string => {
    switch (period) {
      case 'daily':
        return 'Hoje';
      case 'weekly':
        return 'Esta Semana';
      case 'monthly':
        return 'Este Mês';
      case 'all_time':
        return 'Tudo';
      default:
        return period;
    }
  };

  // Get rank medal emoji
  const getRankMedal = (rank: number): string => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Ranking</h1>
        <p className="text-slate-400 mt-2">
          {getPeriodLabel(selectedPeriod)} • {getCategoryLabel(selectedCategory)}
        </p>
      </div>

      {/* Period Filter */}
      <div className="flex flex-wrap gap-2">
        {PERIODS.map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-all',
              selectedPeriod === period
                ? 'bg-primary text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            )}
          >
            {getPeriodLabel(period)}
          </button>
        ))}
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
              selectedCategory === category
                ? 'bg-primary/30 border border-primary text-primary'
                : 'bg-slate-800/30 border border-slate-700 text-slate-400 hover:bg-slate-700/30'
            )}
          >
            {getCategoryLabel(category)}
          </button>
        ))}
      </div>

      {/* User's Current Rank */}
      {userRank && userId && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30"
        >
          <p className="text-sm text-slate-300">Seu ranking</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-lg font-bold text-white">
              #{userRank.rank} • {formatValue(userRank.value, selectedCategory)}
            </span>
            <span className="text-2xl">{getRankMedal(userRank.rank)}</span>
          </div>
        </motion.div>
      )}

      {/* Leaderboard Table */}
      <div className="overflow-hidden rounded-lg border border-slate-700/50">
        <div className="backdrop-blur-xl bg-slate-900/50">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-700/50 bg-slate-800/50 font-semibold text-slate-300 text-sm">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-6">Jogador</div>
            <div className="col-span-3 text-right">Nível</div>
            <div className="col-span-2 text-right">{getCategoryLabel(selectedCategory)}</div>
          </div>

          {/* Rows */}
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center p-12 text-red-400">
              <p>{error}</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="flex items-center justify-center p-12 text-slate-400">
              <p>Nenhuma entrada no ranking</p>
            </div>
          ) : (
            leaderboard.map((entry, index) => (
              <motion.div
                key={`${entry.user_id}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
                className={cn(
                  'grid grid-cols-12 gap-4 p-4 border-b border-slate-700/30 transition-colors hover:bg-slate-700/20',
                  entry.user_id === userId && 'bg-primary/10 border-primary/30'
                )}
              >
                {/* Rank */}
                <div className="col-span-1 flex items-center justify-center">
                  <span className="text-xl font-bold">
                    {getRankMedal(entry.rank) || <span className="text-sm text-slate-400">#{entry.rank}</span>}
                  </span>
                </div>

                {/* Username */}
                <div className="col-span-6 flex items-center">
                  <div>
                    <p className="font-semibold text-white">
                      {entry.username || `User #${entry.user_id?.slice(-6)}`}
                    </p>
                    {entry.user_id === userId && (
                      <p className="text-xs text-primary">Você</p>
                    )}
                  </div>
                </div>

                {/* Level */}
                <div className="col-span-3 flex items-center justify-end">
                  {entry.level && (
                    <span className="text-sm font-medium text-slate-300">Nível {entry.level}</span>
                  )}
                </div>

                {/* Value */}
                <div className="col-span-2 flex items-center justify-end">
                  <span className="font-bold text-white">
                    {formatValue(entry.value, selectedCategory)}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Info */}
      <p className="text-xs text-slate-500 text-center">
        Rankings atualizados diariamente à 00:00 UTC
      </p>
    </div>
  );
}

export default LeaderboardPage;
