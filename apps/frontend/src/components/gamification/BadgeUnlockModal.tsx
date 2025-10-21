/**
 * BadgeUnlockModal Component
 * Full-screen celebration when user unlocks a badge
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useGamificationStore } from '../../stores/gamificationStore';
import { GlassCard } from '../ui/gamification/GlassCard';

export function BadgeUnlockModal() {
  const { recentBadgeUnlock, clearRecentEvents } = useGamificationStore();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (recentBadgeUnlock) {
      setIsVisible(true);

      // Trigger confetti
      const duration = 3000;
      const end = Date.now() + duration;

      const colors = ['hsl(35, 96%, 52%)', 'hsl(26, 100%, 55%)', 'hsl(152, 71%, 45%)'];

      (function frame() {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();

      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [recentBadgeUnlock]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      clearRecentEvents();
    }, 300);
  };

  if (!recentBadgeUnlock) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-deep-space/90 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 100 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: -100 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="pointer-events-auto"
            >
              <GlassCard variant="amber" blurIntensity="xl" withGlow className="max-w-md p-8 text-center">
                {/* Badge Icon with animation */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="mb-6"
                >
                  <div className="text-8xl mb-4">
                    {recentBadgeUnlock.badge_icon}
                  </div>
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-3xl font-bold text-warning mb-2 font-heading-alt uppercase"
                >
                  Badge Desbloqueado!
                </motion.h2>

                {/* Badge Name */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-2xl font-bold text-white mb-4"
                >
                  {recentBadgeUnlock.badge_name}
                </motion.p>

                {/* XP Reward */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-warning/20 border border-warning/50"
                >
                  <span className="text-2xl">✨</span>
                  <span className="text-xl font-bold text-warning">
                    +{recentBadgeUnlock.xp_reward} XP
                  </span>
                </motion.div>

                {/* Close button */}
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  onClick={handleClose}
                  className="mt-8 px-6 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white font-medium"
                >
                  Continuar
                </motion.button>
              </GlassCard>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
