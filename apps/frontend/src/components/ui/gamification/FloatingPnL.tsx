import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/shared/utils/cn';

export interface FloatingPnLProps {
  /** PnL amount gained */
  amount: number;
  /** Position where the animation should appear */
  x?: number;
  y?: number;
  /** Callback when animation completes */
  onComplete?: () => void;
}

/**
 * FloatingPnL - Animated PnL gain notification
 *
 * Shows floating "+R$ XX,XX" text that rises and fades out
 * Triggers only on trade wins
 *
 * @example
 * ```tsx
 * {pnlInstance && (
 *   <FloatingPnL
 *     amount={17.50}
 *     x={400}
 *     y={300}
 *     onComplete={() => setPnlInstance(null)}
 *   />
 * )}
 * ```
 */
export function FloatingPnL({ amount, x = 0, y = 0, onComplete }: FloatingPnLProps) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      onComplete?.();
    }, 1500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={cn(
            'fixed z-50 pointer-events-none',
            'text-2xl font-bold',
            'text-positive',
            'drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]'
          )}
          style={{ left: x, top: y }}
          initial={{ opacity: 1, y: 0, scale: 1 }}
          animate={{ opacity: 0, y: -50, scale: 1.2 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        >
          <motion.div
            animate={{
              textShadow: [
                '0 0 8px rgba(16, 185, 129, 0.8)',
                '0 0 20px rgba(16, 185, 129, 1)',
                '0 0 8px rgba(16, 185, 129, 0.8)',
              ],
            }}
            transition={{ duration: 0.5, repeat: 2 }}
          >
            +R$ {amount.toFixed(2).replace('.', ',')}
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
  const [pnlInstances, setPnlInstances] = useState<Array<{ id: string; amount: number; x: number; y: number }>>([]);

  const showPnL = (amount: number, x: number, y: number) => {
    const id = `pnl-${Date.now()}-${Math.random()}`;
    setPnlInstances((prev) => [...prev, { id, amount, x, y }]);
  };

  const removePnL = (id: string) => {
    setPnlInstances((prev) => prev.filter((pnl) => pnl.id !== id));
  };

  return {
    pnlInstances,
    showPnL,
    removePnL,
  };
}
