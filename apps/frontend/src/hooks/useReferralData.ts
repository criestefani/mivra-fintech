import { useEffect, useState } from 'react';

export interface ReferralStats {
  code: string;
  shareLink: string;
  totalReferrals: number;
  depositedReferrals: number;
  registeredReferrals: number;
  pendingReferrals: number;
  xpEarned: number;
}

export function useReferralData(userId: string | null) {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReferralData = async () => {
    if (!userId) {
      setStats(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch referral code
      const codeResponse = await fetch(`/api/referrals/my-code/${userId}`);
      if (!codeResponse.ok) throw new Error('Failed to fetch referral code');
      const codeData = await codeResponse.json();

      // Fetch referral stats
      const statsResponse = await fetch(`/api/referrals/stats/${userId}`);
      if (!statsResponse.ok) throw new Error('Failed to fetch referral stats');
      const statsData = await statsResponse.json();

      setStats({
        code: codeData.code,
        shareLink: codeData.shareLink,
        totalReferrals: statsData.totalReferrals,
        depositedReferrals: statsData.depositedReferrals,
        registeredReferrals: statsData.registeredReferrals,
        pendingReferrals: statsData.pendingReferrals,
        xpEarned: statsData.xpEarned,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('❌ Error fetching referral data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReferralData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchReferralData, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Failed to copy:', err);
      return false;
    }
  };

  return {
    stats,
    isLoading,
    error,
    copyToClipboard,
    refetch: fetchReferralData,
  };
}
