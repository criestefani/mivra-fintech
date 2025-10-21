/**
 * QuestTracker Component
 * Sidebar showing active quests with progress bars
 * Compact view for trading screens
 */

import { motion, AnimatePresence } from 'framer-motion';
import type { UserQuest } from '../../stores/questsStore';

interface QuestTrackerProps {
  quests: UserQuest[];
  maxQuests?: number;
  position?: 'left' | 'right';
  className?: string;
}

export function QuestTracker({
  quests,
  maxQuests = 3,
  position = 'left',
  className = ''
}: QuestTrackerProps) {
  const activeQuests = quests
    .filter((q) => q.status === 'active')
    .slice(0, maxQuests);

  if (activeQuests.length === 0) return null;

  return (
    <div
      className={`fixed top-1/2 -translate-y-1/2 ${
        position === 'left' ? 'left-4' : 'right-4'
      } z-30 w-72 ${className}`}
    >
      <div className="bg-deep-space/90 backdrop-blur-lg rounded-2xl border border-warning/30 p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-warning uppercase tracking-wide flex items-center gap-2">
            <span>🎯</span>
            <span>Quests Ativas</span>
          </h3>
          <span className="text-xs text-gray-400">
            {activeQuests.length}/{quests.length}
          </span>
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {activeQuests.map((quest, index) => (
              <QuestItem key={quest.id} quest={quest} index={index} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

interface QuestItemProps {
  quest: UserQuest;
  index: number;
}

function QuestItem({ quest, index }: QuestItemProps) {
  const progress = Math.min(100, (quest.current_progress / quest.target_value) * 100);
  const isCompleted = quest.current_progress >= quest.target_value;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.1 }}
      className={`rounded-lg p-3 border ${
        isCompleted
          ? 'bg-positive/10 border-positive/30'
          : 'bg-white/5 border-white/10'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-lg">{quest.quests.quest_icon}</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">
              {quest.quests.quest_name}
            </div>
            <div className="text-xs text-gray-400">
              {quest.current_progress} / {quest.target_value}
            </div>
          </div>
        </div>

        {/* Status indicator */}
        {isCompleted ? (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            className="flex-shrink-0 w-6 h-6 rounded-full bg-positive flex items-center justify-center"
          >
            <span className="text-xs">✓</span>
          </motion.div>
        ) : (
          <div className="flex-shrink-0 px-2 py-1 rounded-full bg-warning/20 text-xs text-warning font-bold">
            +{quest.quests.xp_reward}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-full rounded-full ${
            isCompleted
              ? 'bg-positive'
              : 'bg-gradient-to-r from-primary to-warning'
          }`}
        >
          {/* Shine effect */}
          {!isCompleted && (
            <motion.div
              animate={{
                x: ['-100%', '200%'],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatDelay: 1,
              }}
              className="h-full w-1/2 bg-gradient-to-r from-transparent via-white/50 to-transparent"
            />
          )}
        </motion.div>
      </div>

      {/* Check animation on completion */}
      {isCompleted && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-2 text-xs text-positive font-medium flex items-center gap-1"
        >
          <span>✓</span>
          <span>Completa! Resgate na aba Quests</span>
        </motion.div>
      )}
    </motion.div>
  );
}
