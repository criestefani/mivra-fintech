import { motion } from 'framer-motion';
import { cn } from '@/shared/utils/cn';
import type { Milestone } from '../hooks/useUserProfile';

interface MilestoneCardProps {
  milestone: Milestone;
  index?: number;
}

export function MilestoneCard({ milestone, index = 0 }: MilestoneCardProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={milestone.achieved ? { scale: 1.05 } : {}}
      className={cn(
        'backdrop-blur-xl bg-slate-900/50 border-slate-700/50 rounded-lg p-3 md:p-4 lg:p-6 transition-all duration-300 border',
        milestone.achieved
          ? 'hover:shadow-lg hover:shadow-primary/20 cursor-pointer'
          : 'opacity-50 grayscale'
      )}
    >
      {/* Icon */}
      <div className="text-4xl md:text-5xl mb-2 md:mb-4">{milestone.icon}</div>

      {/* Content */}
      <h3 className="font-bold text-white text-sm md:text-base lg:text-lg truncate">
        {milestone.name}
      </h3>

      {/* Date or Status */}
      {milestone.achieved && milestone.date ? (
        <p className="text-xs text-slate-400 mt-3">
          ✓ {formatDate(milestone.date)}
        </p>
      ) : !milestone.achieved ? (
        <p className="text-xs text-slate-500 mt-3">
          🔒 Bloqueado
        </p>
      ) : null}

      {/* Value (for deposits) */}
      {milestone.value && (
        <p className="text-sm text-primary font-semibold mt-2">
          R$ {milestone.value.toFixed(2)}
        </p>
      )}

      {/* Category Badge */}
      <div className="mt-3 inline-block">
        <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary-foreground/80">
          {milestone.category === 'trading' && '📊 Trading'}
          {milestone.category === 'account' && '💼 Conta'}
          {milestone.category === 'achievement' && '🎯 Conquista'}
          {milestone.category === 'level' && '📈 Nível'}
        </span>
      </div>
    </motion.div>
  );
}
