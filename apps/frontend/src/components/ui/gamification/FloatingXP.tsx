import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';

export interface FloatingXPProps {
  /** Amount of XP gained */
  amount: number;
  /** Position where the animation should appear */
  x?: number;
  y?: number;
  /** Callback when animation completes */
  onComplete?: () => void;
}

/**
 * FloatingXP - Animated XP gain notification
 *
 * Shows floating "+XX XP" text that rises and fades out
 * Triggers on every trade win or XP event
 *
 * @example
 * ```tsx
 * {showXP && (
 *   <FloatingXP
 *     amount={60}
 *     x={400}
 *     y={300}
 *     onComplete={() => setShowXP(false)}
 *   />
 * )}
 * ```
 */
export function FloatingXP({ amount, x = 0, y = 0, onComplete }: FloatingXPProps) {
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
            'text-golden-amber',
            'drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]'
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
                '0 0 8px rgba(245, 158, 11, 0.8)',
                '0 0 20px rgba(245, 158, 11, 1)',
                '0 0 8px rgba(245, 158, 11, 0.8)',
              ],
            }}
            transition={{ duration: 0.5, repeat: 2 }}
          >
            +{amount} XP
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Hook to manage multiple floating XP instances
 */
export function useFloatingXP() {
  const [xpInstances, setXPInstances] = useState<Array<{ id: string; amount: number; x: number; y: number }>>([]);

  const showXP = (amount: number, x: number, y: number) => {
    const id = `${Date.now()}-${Math.random()}`;
    setXPInstances((prev) => [...prev, { id, amount, x, y }]);
  };

  const removeXP = (id: string) => {
    setXPInstances((prev) => prev.filter((xp) => xp.id !== id));
  };

  return {
    xpInstances,
    showXP,
    removeXP,
  };
}
