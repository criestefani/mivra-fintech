/**
 * NextTradePreview Component
 * Shows countdown and preview for next trade
 * Creates anticipation and suspense
 */

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface NextTradePreviewProps {
  secondsUntilNext: number;
  nextAsset?: string;
  isAnalyzing?: boolean;
  className?: string;
}

export function NextTradePreview({
  secondsUntilNext,
  nextAsset,
  isAnalyzing = false,
  className = ''
}: NextTradePreviewProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (secondsUntilNext > 0) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prev) => Math.min(prev + (100 / secondsUntilNext), 100));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [secondsUntilNext]);

  if (secondsUntilNext <= 0 && !isAnalyzing) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-30 ${className}`}
    >
      <div className="bg-deep-space/95 backdrop-blur-xl rounded-2xl border border-primary/30 px-6 py-4 shadow-[0_0_30px_rgba(255,140,26,0.3)] min-w-[300px]">
        {isAnalyzing ? (
          // Analyzing state
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="text-2xl"
            >
              🔍
            </motion.div>
            <div>
              <div className="text-sm font-medium text-primary">
                Analisando mercado...
              </div>
              <div className="text-xs text-gray-400">
                Buscando próxima oportunidade
              </div>
            </div>
          </div>
        ) : (
          // Countdown state
          <>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">⏳</span>
                <span className="text-sm font-medium text-gray-300">
                  Próximo trade em
                </span>
              </div>
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-2xl font-bold text-primary font-heading"
              >
                {secondsUntilNext}s
              </motion.div>
            </div>

            {nextAsset && (
              <div className="text-xs text-gray-400 mb-2">
                Asset: <span className="text-white font-medium">{nextAsset}</span>
              </div>
            )}

            {/* Progress bar */}
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-primary to-warning rounded-full"
              >
                {/* Shine effect */}
                <motion.div
                  animate={{
                    x: ['-100%', '200%'],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    repeatDelay: 0.5,
                  }}
                  className="h-full w-1/2 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                />
              </motion.div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
