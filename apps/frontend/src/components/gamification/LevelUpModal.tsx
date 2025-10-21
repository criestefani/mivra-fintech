/**
 * LevelUpModal Component
 * Celebration modal when user levels up
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useGamificationStore } from '../../stores/gamificationStore';
import { GlassCard } from '../ui/gamification/GlassCard';

export function LevelUpModal() {
  const { recentLevelUp, clearRecentEvents } = useGamificationStore();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (recentLevelUp) {
      setIsVisible(true);

      // Trigger epic confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#0EA5E9', '#10B981', '#EF4444'],
      });

      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [recentLevelUp]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      clearRecentEvents();
    }, 300);
  };

  if (!recentLevelUp) return null;

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
              initial={{ scale: 0.5, opacity: 0, rotateY: 180 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              exit={{ scale: 0.5, opacity: 0, rotateY: -180 }}
              transition={{ type: 'spring', duration: 0.7 }}
              className="pointer-events-auto"
            >
              <GlassCard variant="blue" blurIntensity="xl" withGlow className="max-w-lg p-10 text-center">
                {/* Level Up Icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: 'spring', duration: 0.8 }}
                  className="mb-6"
                >
                  <div className="text-9xl">🎉</div>
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-4xl font-bold text-electric-blue mb-4 font-heading-alt uppercase"
                >
                  Level Up!
                </motion.h2>

                {/* Level Display */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center justify-center gap-4 mb-6"
                >
                  {/* Old Level */}
                  <div className="flex flex-col items-center">
                    <span className="text-sm text-gray-400 mb-1">Antes</span>
                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">
                        {recentLevelUp.old_level}
                      </span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="text-3xl text-electric-blue"
                  >
                    →
                  </motion.div>

                  {/* New Level */}
                  <div className="flex flex-col items-center">
                    <span className="text-sm text-gray-400 mb-1">Agora</span>
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: [0.8, 1.2, 1] }}
                      transition={{ delay: 0.8, duration: 0.5 }}
                      className="w-20 h-20 rounded-full bg-gradient-to-br from-electric-blue to-golden-amber flex items-center justify-center shadow-[0_0_30px_rgba(14,165,233,0.7)]"
                    >
                      <span className="text-3xl font-bold text-white">
                        {recentLevelUp.new_level}
                      </span>
                    </motion.div>
                  </div>
                </motion.div>

                {/* Level Title */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="text-2xl font-bold text-golden-amber mb-4 font-heading"
                >
                  {recentLevelUp.level_title}
                </motion.p>

                {/* Unlocks */}
                {recentLevelUp.level_unlocks && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                    className="px-6 py-3 rounded-lg bg-golden-amber/10 border border-golden-amber/30 mb-6"
                  >
                    <p className="text-sm text-gray-400 mb-1">🔓 Desbloqueado:</p>
                    <p className="text-white font-medium">{recentLevelUp.level_unlocks}</p>
                  </motion.div>
                )}

                {/* Close button */}
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                  onClick={handleClose}
                  className="px-8 py-3 rounded-full bg-gradient-to-r from-electric-blue to-golden-amber hover:shadow-[0_0_20px_rgba(14,165,233,0.7)] transition-all text-white font-bold"
                >
                  Incrível!
                </motion.button>
              </GlassCard>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
