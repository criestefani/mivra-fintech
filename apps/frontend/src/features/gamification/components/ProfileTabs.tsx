/**
 * ProfileTabs Component
 * Manages three tabs: Badges, Quests, and Rankings
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BadgesCollection } from './BadgesCollection';
import { QuestTracker } from './QuestTracker';
import { LeaderboardPage } from '../pages/Leaderboard';
import { cn } from '@/shared/utils/cn';

interface ProfileTabsProps {
  userId: string | null;
}

type TabType = 'badges' | 'quests' | 'rankings';

const TABS: { id: TabType; label: string; icon: string }[] = [
  { id: 'badges', label: 'Conquistas', icon: '🏆' },
  { id: 'quests', label: 'Missões', icon: '🎯' },
  { id: 'rankings', label: 'Rankings', icon: '📊' },
];

export function ProfileTabs({ userId }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('badges');

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1 md:gap-2 border-b border-slate-700/50 pb-4">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-2 md:px-4 py-2 rounded-lg font-medium transition-all relative text-xs md:text-sm',
              activeTab === tab.id
                ? 'text-white'
                : 'text-slate-400 hover:text-slate-300'
            )}
          >
            <span className="mr-1 md:mr-2">{tab.icon}</span>
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="tabUnderline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/60 to-primary"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {/* Badges Tab */}
          {activeTab === 'badges' && (
            <div className="space-y-4">
              <BadgesCollection userId={userId} maxColumns={4} />
            </div>
          )}

          {/* Quests Tab */}
          {activeTab === 'quests' && (
            <div className="space-y-4">
              <QuestTracker userId={userId} maxQuests={10} />
            </div>
          )}

          {/* Rankings Tab */}
          {activeTab === 'rankings' && (
            <div className="space-y-4">
              <LeaderboardPage limit={50} />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default ProfileTabs;
