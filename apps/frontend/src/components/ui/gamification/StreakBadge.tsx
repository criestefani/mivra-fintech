import { HTMLAttributes } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';

export interface StreakBadgeProps extends HTMLAttributes<HTMLDivElement> {
  /** Current streak count (days operated) */
  streakCount: number;
  /** Position on screen */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  /** Show fire particles for streaks >= 7 */
  showParticles?: boolean;
}

const positionStyles = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
};

/**
 * StreakBadge - Daily streak indicator
 *
 * Shows consecutive days operated (min 1 trade/day)
 * Fire particles appear at 7+ days
 * Fixed position, always visible
 *
 * @example
 * ```tsx
 * <StreakBadge streakCount={15} position="top-right" showParticles />
 * ```
 */
export function StreakBadge({
  className,
  streakCount,
  position = 'top-right',
  showParticles = true,
  ...props
}: StreakBadgeProps) {
  if (streakCount === 0) return null;

  const hasFireParticles = streakCount >= 7 && showParticles;

  return (
    <motion.div
      className={cn(
        'fixed z-40 flex items-center gap-2',
        'bg-deep-space/90 backdrop-blur-md',
        'border-2 border-golden-amber/50',
        'rounded-full px-4 py-2',
        'shadow-lg',
        hasFireParticles && 'shadow-[0_0_20px_rgba(245,158,11,0.6)]',
        positionStyles[position],
        className
      )}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      {...props}
    >
      {/* Fire icon */}
      <motion.span
        className="text-2xl"
        animate={
          hasFireParticles
            ? {
                scale: [1, 1.2, 1],
                rotate: [-5, 5, -5],
              }
            : undefined
        }
        transition={{
          duration: 0.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        🔥
      </motion.span>

      {/* Streak count */}
      <div className="flex flex-col">
        <span className="text-xl font-bold text-golden-amber leading-none">
          {streakCount}
        </span>
        <span className="text-xs text-gray-400 leading-none">
          {streakCount === 1 ? 'dia' : 'dias'}
        </span>
      </div>

      {/* Fire particles for long streaks */}
      <AnimatePresence>
        {hasFireParticles && (
          <>
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-golden-amber rounded-full"
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{
                  x: [0, (i - 1) * 20],
                  y: [0, -30 - i * 10],
                  opacity: [1, 0],
                  scale: [1, 0],
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: 'easeOut',
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
