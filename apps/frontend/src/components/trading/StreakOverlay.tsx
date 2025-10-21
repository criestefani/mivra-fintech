/**
 * StreakOverlay Component
 * Shows "🔥 X WINS SEGUIDAS!" overlay when win streak >= 3
 * With fire particles effect
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface StreakOverlayProps {
  winStreak: number;
  position?: 'top-right' | 'top-center' | 'center';
  minStreakToShow?: number;
}

export function StreakOverlay({
  winStreak,
  position = 'top-right',
  minStreakToShow = 3
}: StreakOverlayProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const shouldShow = winStreak >= minStreakToShow;

  // Generate fire particles
  useEffect(() => {
    if (!shouldShow) {
      setParticles([]);
      return;
    }

    const interval = setInterval(() => {
      setParticles((prev) => {
        // Remove old particles
        const filtered = prev.filter((p) => p.id > Date.now() - 2000);
        // Add new particle
        const newParticle = {
          id: Date.now(),
          x: Math.random() * 100 - 50,
          y: Math.random() * 50,
        };
        return [...filtered, newParticle];
      });
    }, 200);

    return () => clearInterval(interval);
  }, [shouldShow]);

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  }[position];

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0, scale: 0, rotate: -180 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0, rotate: 180 }}
          transition={{ type: 'spring', duration: 0.6 }}
          className={`fixed ${positionClasses} z-40 pointer-events-none`}
        >
          {/* Main streak display */}
          <div className="relative">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                boxShadow: [
                  '0 0 20px rgba(245, 158, 11, 0.5)',
                  '0 0 40px rgba(245, 158, 11, 0.8)',
                  '0 0 20px rgba(245, 158, 11, 0.5)',
                ],
              }}
              transition={{ duration: 1, repeat: Infinity }}
              className="bg-gradient-to-br from-golden-amber via-orange-500 to-red-500 rounded-2xl px-6 py-4 border-2 border-golden-amber"
            >
              <div className="flex items-center gap-3">
                <motion.span
                  className="text-4xl"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  🔥
                </motion.span>
                <div>
                  <div className="text-2xl font-bold text-white font-heading-alt uppercase">
                    {winStreak} WINS
                  </div>
                  <div className="text-sm text-white/90 font-medium">
                    SEGUIDAS!
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Fire particles */}
            <AnimatePresence>
              {particles.map((particle) => (
                <motion.div
                  key={particle.id}
                  initial={{ opacity: 1, y: 0, x: particle.x, scale: 1 }}
                  animate={{
                    opacity: 0,
                    y: -100 - particle.y,
                    scale: 0.5,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 2, ease: 'easeOut' }}
                  className="absolute bottom-0 left-1/2 text-2xl"
                  style={{ translateX: '-50%' }}
                >
                  {Math.random() > 0.5 ? '🔥' : '✨'}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Glow effect */}
          <motion.div
            animate={{
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute inset-0 bg-gradient-to-br from-golden-amber/30 to-red-500/30 rounded-2xl blur-xl -z-10"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
