import { useState, useEffect } from 'react';

export interface UserStats {
  id: string;
  user_id: string;
  total_xp: number;
  current_level: number;
  xp_current_level: number;
  xp_next_level: number;
  level_title: string;
  current_streak: number;
  best_streak: number;
  current_win_streak: number;
  best_win_streak: number;
  total_trades: number;
  total_trades_demo: number;
  total_trades_real: number;
  total_wins: number;
  total_wins_real: number;
  updated_at: string;
}

export interface Milestone {
  id: string;
  name: string;
  icon: string;
  category: 'trading' | 'account' | 'achievement' | 'level';
  achieved: boolean;
  date?: string;
  value?: number;
}

export interface ProfileData {
  stats: UserStats;
  totalBadges: number;
  milestones: Milestone[];
  rank: number | null;
}

export function useUserProfile(userId: string | null) {
  const [data, setData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/gamification/profile/${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }

        const profileData = await response.json();
        setData(profileData);
      } catch (err) {
        console.error('❌ Error fetching profile:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  // Calculate win rate
  const getWinRate = () => {
    if (!data?.stats || data.stats.total_trades === 0) return 0;
    return ((data.stats.total_wins / data.stats.total_trades) * 100).toFixed(1);
  };

  return {
    data,
    isLoading,
    error,
    winRate: getWinRate(),
  };
}
