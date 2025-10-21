/**
 * CommandCenter Component
 * Top glass panel for Auto Mode
 * Shows bot avatar, real-time status, and session timer
 */

import { motion } from 'framer-motion';
import { GlassCard } from '../ui/gamification/GlassCard';

interface CommandCenterProps {
  botStatus: 'SCANNING' | 'TRADING' | 'WAITING' | 'STOPPED';
  currentAsset?: string;
  sessionTime: number; // seconds
  userLevel?: number;
  className?: string;
}

export function CommandCenter({
  botStatus,
  currentAsset,
  sessionTime,
  userLevel = 1,
  className = ''
}: CommandCenterProps) {
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const statusConfig = {
    SCANNING: {
      icon: '🔍',
      text: 'SCANNING MARKETS...',
      color: 'text-electric-blue',
      animate: true,
    },
    TRADING: {
      icon: '⚡',
      text: 'EXECUTING TRADE',
      color: 'text-golden-amber',
      animate: true,
    },
    WAITING: {
      icon: '⏳',
      text: 'WAITING FOR SIGNAL',
      color: 'text-gray-400',
      animate: false,
    },
    STOPPED: {
      icon: '🛑',
      text: 'BOT STOPPED',
      color: 'text-loss-red',
      animate: false,
    },
  }[botStatus];

  return (
    <GlassCard
      variant="blue"
      blurIntensity="xl"
      withGlow
      className={`p-6 ${className}`}
    >
      <div className="flex items-center justify-between">
        {/* Left: Bot Avatar + Status */}
        <div className="flex items-center gap-4">
          {/* Bot Avatar with breathing animation */}
          <motion.div
            animate={
              botStatus !== 'STOPPED'
                ? {
                    scale: [1, 1.05, 1],
                    boxShadow: [
                      '0 0 20px rgba(14, 165, 233, 0.5)',
                      '0 0 30px rgba(14, 165, 233, 0.8)',
                      '0 0 20px rgba(14, 165, 233, 0.5)',
                    ],
                  }
                : {}
            }
            transition={{ duration: 2, repeat: Infinity }}
            className="relative"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-electric-blue to-golden-amber flex items-center justify-center text-3xl">
              🤖
            </div>
            {/* Level badge */}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-golden-amber border-2 border-deep-space flex items-center justify-center">
              <span className="text-xs font-bold text-white">{userLevel}</span>
            </div>
          </motion.div>

          {/* Status */}
          <div>
            <motion.div
              animate={statusConfig.animate ? { opacity: [1, 0.6, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
              className={`text-lg font-bold ${statusConfig.color} font-heading-alt flex items-center gap-2`}
            >
              <motion.span
                animate={statusConfig.animate ? { rotate: 360 } : {}}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                {statusConfig.icon}
              </motion.span>
              {statusConfig.text}
            </motion.div>
            {currentAsset && (
              <div className="text-sm text-gray-400 mt-1">
                Asset: <span className="text-white font-medium">{currentAsset}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Session Timer */}
        <div className="text-right">
          <div className="text-xs text-gray-400 mb-1">TEMPO DE SESSÃO</div>
          <div className="text-3xl font-bold text-white font-heading-alt tabular-nums">
            {formatTime(sessionTime)}
          </div>
          {/* Progress ring (optional visual enhancement) */}
          <div className="mt-2">
            <svg width="60" height="8">
              <rect
                width="60"
                height="8"
                rx="4"
                fill="rgba(255,255,255,0.1)"
              />
              <motion.rect
                width="60"
                height="8"
                rx="4"
                fill="url(#gradient)"
                animate={{ width: [0, 60, 0] }}
                transition={{ duration: 5, repeat: Infinity }}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0EA5E9" />
                  <stop offset="100%" stopColor="#F59E0B" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
