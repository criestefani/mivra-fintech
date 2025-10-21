import { HTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/shared/utils/cn';

export interface XPBarProps extends HTMLAttributes<HTMLDivElement> {
  /** Current level */
  level: number;
  /** Current XP in this level */
  currentXP: number;
  /** XP needed for next level */
  nextLevelXP: number;
  /** Level title (e.g., "Trader Pleno") */
  levelTitle?: string;
  /** Compact mode for smaller displays */
  compact?: boolean;
}

/**
 * XPBar - Experience progress bar for gamification
 *
 * Always visible at the top of operation screens
 * Shows level, progress, and XP with smooth animations
 *
 * @example
 * ```tsx
 * <XPBar
 *   level={5}
 *   currentXP={450}
 *   nextLevelXP={700}
 *   levelTitle="Trader Pleno"
 * />
 * ```
 */
export function XPBar({
  className,
  level,
  currentXP,
  nextLevelXP,
  levelTitle,
  compact = false,
  ...props
}: XPBarProps) {
  const progress = (currentXP / nextLevelXP) * 100;

  return (
    <div
      className={cn(
        'w-full bg-deep-space/90 backdrop-blur-lg px-4 py-2 border-b border-golden-amber/20',
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-golden-amber">
            Nível {level}
          </span>
          {!compact && levelTitle && (
            <span className="text-sm text-gray-400">- {levelTitle}</span>
          )}
        </div>
        <span className="text-sm text-gray-400">
          {currentXP.toLocaleString()} / {nextLevelXP.toLocaleString()} XP
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 bg-deep-space rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-golden-amber via-golden-amber-600 to-golden-amber rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {/* Animated shine effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{
              x: ['-100%', '200%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}
