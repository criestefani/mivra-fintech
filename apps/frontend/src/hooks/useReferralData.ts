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
      console.log('⏭️ useReferralData: no userId, skipping');
      setStats(null);
      return;
    }

    console.log('🔄 useReferralData: fetching data for userId:', userId);
    setIsLoading(true);
    setError(null);

    try {
      // Fetch referral code
      console.log('📍 Fetching referral code from /api/referrals/my-code/' + userId);
      const codeResponse = await fetch(`/api/referrals/my-code/${userId}`);
      if (!codeResponse.ok) {
        const errorText = await codeResponse.text();
        throw new Error(`Failed to fetch referral code: ${codeResponse.status} ${errorText}`);
      }
      const codeData = await codeResponse.json();
      console.log('✅ Code data:', codeData);

      // Fetch referral stats
      console.log('📍 Fetching referral stats from /api/referrals/stats/' + userId);
      const statsResponse = await fetch(`/api/referrals/stats/${userId}`);
      if (!statsResponse.ok) {
        const errorText = await statsResponse.text();
        throw new Error(`Failed to fetch referral stats: ${statsResponse.status} ${errorText}`);
      }
      const statsData = await statsResponse.json();
      console.log('✅ Stats data:', statsData);

      const newStats = {
        code: codeData.code,
        shareLink: codeData.shareLink,
        totalReferrals: statsData.totalReferrals,
        depositedReferrals: statsData.depositedReferrals,
        registeredReferrals: statsData.registeredReferrals,
        pendingReferrals: statsData.pendingReferrals,
        xpEarned: statsData.xpEarned,
      };
      console.log('✅ useReferralData: successfully loaded stats', newStats);
      setStats(newStats);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      console.error('❌ Error fetching referral data:', errorMsg);
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
