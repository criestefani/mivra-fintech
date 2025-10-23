import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/shared/utils/cn';

export interface FloatingPnLProps {
  /** PnL amount gained or lost */
  amount: number;
  /** Position where the animation should appear */
  x?: number;
  y?: number;
  /** Animation duration in milliseconds (default: 2000 for wins, 1500 for losses) */
  duration?: number;
  /** Type of animation: 'win' (green) or 'loss' (red) */
  variant?: 'win' | 'loss';
  /** Callback when animation completes */
  onComplete?: () => void;
}

/**
 * FloatingPnL - Animated PnL gain/loss notification
 *
 * Shows floating "+R$ XX,XX" or "-R$ XX,XX" text that rises and fades out
 * Triggers on trade wins (green, 2s) or losses (red, 1.5s)
 *
 * @example
 * ```tsx
 * {pnlInstance && (
 *   <FloatingPnL
 *     amount={17.50}
 *     variant="win"
 *     duration={2000}
 *     x={400}
 *     y={300}
 *     onComplete={() => setPnlInstance(null)}
 *   />
 * )}
 * ```
 */
export function FloatingPnL({ amount, x = 0, y = 0, duration = 2000, variant = 'win', onComplete }: FloatingPnLProps) {
  const [show, setShow] = useState(true);

  const isLoss = variant === 'loss';
  const durationSeconds = duration / 1000;

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      onComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  // Color configurations
  const colorConfig = isLoss
    ? {
        textColor: 'text-negative',
        glow: 'drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]',
        shadowColors: [
          '0 0 8px rgba(239, 68, 68, 0.8)',
          '0 0 20px rgba(239, 68, 68, 1)',
          '0 0 8px rgba(239, 68, 68, 0.8)',
        ],
      }
    : {
        textColor: 'text-positive',
        glow: 'drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]',
        shadowColors: [
          '0 0 8px rgba(16, 185, 129, 0.8)',
          '0 0 20px rgba(16, 185, 129, 1)',
          '0 0 8px rgba(16, 185, 129, 0.8)',
        ],
      };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={cn(
            'fixed z-50 pointer-events-none',
            'text-2xl font-bold',
            colorConfig.textColor,
            colorConfig.glow
          )}
          style={{ left: x, top: y }}
          initial={{ opacity: 1, y: 0, scale: 1 }}
          animate={{ opacity: 0, y: -50, scale: 1.2 }}
          exit={{ opacity: 0 }}
          transition={{ duration: durationSeconds, ease: 'easeOut' }}
        >
          <motion.div
            animate={{
              textShadow: colorConfig.shadowColors,
            }}
            transition={{ duration: 0.5, repeat: 2 }}
          >
            {isLoss ? '-' : '+'}R$ {Math.abs(amount).toFixed(2).replace('.', ',')}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Hook to manage multiple floating PnL instances
 */
export function useFloatingPnL() {
  const [pnlInstances, setPnlInstances] = useState<Array<{ id: string; amount: number; x: number; y: number; variant: 'win' | 'loss'; duration: number }>>([]);

  const showPnL = (amount: number, x: number, y: number, variant: 'win' | 'loss' = 'win') => {
    const id = `pnl-${Date.now()}-${Math.random()}`;
    const duration = variant === 'loss' ? 1500 : 2000;
    setPnlInstances((prev) => [...prev, { id, amount, x, y, variant, duration }]);
  };

  const showLoss = (amount: number, x: number, y: number) => {
    showPnL(amount, x, y, 'loss');
  };

  const removePnL = (id: string) => {
    setPnlInstances((prev) => prev.filter((pnl) => pnl.id !== id));
  };

  return {
    pnlInstances,
    showPnL,
    showLoss,
    removePnL,
  };
}
