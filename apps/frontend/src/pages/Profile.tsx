import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { motion } from 'framer-motion';
import { DashboardHeader, Sidebar } from '@/features/dashboard';
import { useUserProfile } from '@/features/gamification/hooks/useUserProfile';
import { useReferralData } from '@/hooks/useReferralData';
import { ProfileHeader } from '@/features/gamification/components/ProfileHeader';
import { MilestonesGrid } from '@/features/gamification/components/MilestonesGrid';
import { ProfileTabs } from '@/features/gamification/components/ProfileTabs';
import { ReferralCard } from '@/features/gamification/components/ReferralCard';
import { DiagonalSection } from '@/components/ui/gamification';
import { cn } from '@/shared/utils/cn';

const ProfilePage_Wrapper = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { data: profileData, isLoading: isProfileLoading, error: profileError } = useUserProfile(user?.id || null);
  const { stats: referralStats, isLoading: isReferralLoading, copyToClipboard } = useReferralData(user?.id || null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          navigate('/auth');
          return;
        }
        setUser(session.user);
      } catch (error) {
        console.error('Auth check failed:', error);
        navigate('/auth');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        navigate('/auth');
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <DashboardHeader user={user} />
      <Sidebar />

      <main className="lg:ml-64 pt-6 md:pt-8 pb-32 relative z-20">
        {/* Diagonal Section Header with Title */}
        <DiagonalSection
          direction="bottom-left"
          gradientFrom="from-primary/40"
          className="h-32 md:h-40 lg:h-48 relative z-20 mt-4 -mx-3 md:mx-0"
        >
          <div className="relative z-30">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">Seu Perfil</h1>
            <p className="text-muted-foreground mt-1 md:mt-2 text-xs md:text-sm lg:text-base">Acompanhe seu progresso e conquistas</p>
          </div>
        </DiagonalSection>

        <div className="px-3 md:px-4 pt-6 md:pt-8 pb-8 space-y-8 md:space-y-10 lg:space-y-12">
          {/* Profile Header - User Stats */}
          {!isProfileLoading && profileData?.stats ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <ProfileHeader stats={profileData.stats} rank={profileData.rank} />
            </motion.div>
          ) : (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          )}

          {/* Stats Cards */}
          {!isProfileLoading && profileData?.stats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3 lg:gap-4"
            >
              {/* Total Badges */}
              <div className="backdrop-blur-xl bg-slate-900/50 border border-slate-700/50 rounded-lg p-3 md:p-4 lg:p-6 text-center">
                <div className="text-2xl md:text-3xl mb-1 md:mb-2">🏆</div>
                <p className="text-slate-400 text-xs md:text-sm mb-1">Conquistas</p>
                <p className="text-lg md:text-2xl font-bold text-white">{profileData.totalBadges}</p>
              </div>

              {/* Total Trades */}
              <div className="backdrop-blur-xl bg-slate-900/50 border border-slate-700/50 rounded-lg p-3 md:p-4 lg:p-6 text-center">
                <div className="text-2xl md:text-3xl mb-1 md:mb-2">📊</div>
                <p className="text-slate-400 text-xs md:text-sm mb-1">Trades</p>
                <p className="text-lg md:text-2xl font-bold text-white">{profileData.stats.total_trades}</p>
              </div>

              {/* Win Rate */}
              <div className="backdrop-blur-xl bg-slate-900/50 border border-slate-700/50 rounded-lg p-3 md:p-4 lg:p-6 text-center">
                <div className="text-2xl md:text-3xl mb-1 md:mb-2">📈</div>
                <p className="text-slate-400 text-xs md:text-sm mb-1">Taxa de Vitória</p>
                <p className="text-lg md:text-2xl font-bold text-white">
                  {profileData.stats.total_trades > 0
                    ? ((profileData.stats.total_wins / profileData.stats.total_trades) * 100).toFixed(1)
                    : 0}%
                </p>
              </div>

              {/* Current Streak */}
              <div className="backdrop-blur-xl bg-slate-900/50 border border-slate-700/50 rounded-lg p-3 md:p-4 lg:p-6 text-center">
                <div className="text-2xl md:text-3xl mb-1 md:mb-2">🔥</div>
                <p className="text-slate-400 text-xs md:text-sm mb-1">Streak Atual</p>
                <p className="text-lg md:text-2xl font-bold text-white">{profileData.stats.current_streak}</p>
              </div>
            </motion.div>
          )}

          {/* Journey Milestones */}
          {!isProfileLoading && profileData?.milestones ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-4"
            >
              <h2 className="text-2xl font-bold text-white">Sua Jornada</h2>
              <MilestonesGrid milestones={profileData.milestones} isLoading={isProfileLoading} />
            </motion.div>
          ) : null}

          {/* Tabs Section - Badges, Quests, Rankings */}
          {!isProfileLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold text-white">Conteúdo</h2>
              <ProfileTabs userId={user?.id || null} />
            </motion.div>
          )}

          {/* Referral System Section */}
          {!isReferralLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="space-y-4"
            >
              <ReferralCard
                stats={referralStats}
                isLoading={isReferralLoading}
                onCopyToClipboard={copyToClipboard}
              />
            </motion.div>
          )}

          {/* Error State */}
          {profileError && (
            <div className="p-4 rounded-lg bg-red-900/20 border border-red-800/50 text-red-300">
              <p className="text-sm">Erro ao carregar perfil: {profileError}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProfilePage_Wrapper;
