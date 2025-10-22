import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { DashboardHeader, Sidebar } from '@/features/dashboard';
import { LeaderboardPage } from '@/features/gamification/pages/Leaderboard';
import { DiagonalSection } from '@/components/ui/gamification';

const LeaderboardPage_Wrapper = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      {/* Organic Background Animation - REMOVED */}

      <DashboardHeader user={user} />
      <Sidebar />

      <main className="lg:ml-64 relative z-20" style={{ marginTop: 'max(1.5rem, calc(env(safe-area-inset-top) + 1.5rem))' }}>
        {/* Diagonal Section Header with Title */}
        <DiagonalSection
          direction="bottom-right"
          gradientFrom="from-primary/40"
          className="h-48 lg:h-64 relative z-20 mt-4"
        >
          <div className="relative z-30">
            <h1 className="text-4xl lg:text-5xl font-bold text-white">Top Rankings</h1>
            <p className="text-muted-foreground mt-2 text-lg">Compete and climb the leaderboards</p>
          </div>
        </DiagonalSection>

        <div className="px-4 pt-8 pb-8">
          <LeaderboardPage />
        </div>
      </main>
    </div>
  );
};

export default LeaderboardPage_Wrapper;
