/**
 * QuestCard Component
 * Displays a quest with progress bar and claim button
 */

import { motion } from 'framer-motion';
import { GlassCard } from '../ui/gamification/GlassCard';
import { NeonButton } from '../ui/gamification/NeonButton';
import type { UserQuest } from '../../stores/questsStore';

interface QuestCardProps {
  quest: UserQuest;
  onClaim?: () => void;
  isLoading?: boolean;
}

export function QuestCard({ quest, onClaim, isLoading }: QuestCardProps) {
  const progress = Math.min(100, (quest.current_progress / quest.target_value) * 100);
  const isCompleted = quest.current_progress >= quest.target_value;
  const isClaimed = quest.status === 'completed';

  // Determine card variant based on quest type
  const variant = {
    daily: 'blue' as const,
    weekly: 'amber' as const,
    special: 'green' as const,
  }[quest.quests.quest_type] || 'default' as const;

  return (
    <GlassCard
      variant={variant}
      blurIntensity="md"
      withGlow={isCompleted && !isClaimed}
      className="p-4 hover:scale-[1.02] transition-transform"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {/* Icon */}
        <div className="text-4xl flex-shrink-0">{quest.quests.quest_icon}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-white mb-1 font-heading">
            {quest.quests.quest_name}
          </h3>
          <p className="text-sm text-gray-400">
            {quest.quests.quest_description}
          </p>
        </div>

        {/* XP Badge */}
        <div className="flex-shrink-0 px-3 py-1 rounded-full bg-golden-amber/20 border border-golden-amber/50">
          <span className="text-sm font-bold text-golden-amber">
            +{quest.quests.xp_reward} XP
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-400">Progresso</span>
          <span className="font-bold text-white">
            {quest.current_progress} / {quest.target_value}
          </span>
        </div>

        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`h-full rounded-full ${
              isCompleted
                ? 'bg-gradient-to-r from-profit-green to-profit-green-600'
                : 'bg-gradient-to-r from-electric-blue to-golden-amber'
            }`}
          >
            {/* Shine effect */}
            <motion.div
              animate={{
                x: ['-100%', '200%'],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatDelay: 2,
              }}
              className="h-full w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            />
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        {/* Quest Type Badge */}
        <div className="text-xs px-2 py-1 rounded-full bg-white/10 text-gray-300 uppercase tracking-wide">
          {quest.quests.quest_type}
        </div>

        {/* Claim Button or Status */}
        {isClaimed ? (
          <div className="flex items-center gap-1 text-profit-green font-medium">
            <span>✓</span>
            <span>Concluída</span>
          </div>
        ) : isCompleted ? (
          <NeonButton
            variant="success"
            size="sm"
            onClick={onClaim}
            loading={isLoading}
            icon="🎁"
            glow
          >
            Resgatar
          </NeonButton>
        ) : (
          <span className="text-sm text-gray-400">
            {Math.round(progress)}% completo
          </span>
        )}
      </div>
    </GlassCard>
  );
}

/**
 * QuestList Component
 * Groups and displays multiple quests
 */
interface QuestListProps {
  quests: UserQuest[];
  onClaimQuest: (questId: string) => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function QuestList({ quests, onClaimQuest, isLoading, emptyMessage }: QuestListProps) {
  if (quests.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">🎯</div>
        <p className="text-gray-400">
          {emptyMessage || 'Nenhuma quest disponível no momento'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {quests.map((quest, index) => (
        <motion.div
          key={quest.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <QuestCard
            quest={quest}
            onClaim={() => onClaimQuest(quest.quest_id)}
            isLoading={isLoading}
          />
        </motion.div>
      ))}
    </div>
  );
}
