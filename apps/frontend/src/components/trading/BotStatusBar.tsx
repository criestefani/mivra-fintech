/**
 * BotStatusBar Component
 * Top bar showing bot status, session timer, and live PnL
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { GlassCard } from '../ui/gamification/GlassCard';

interface BotStatusBarProps {
  status: 'RUNNING' | 'STOPPED' | 'PAUSED' | 'ERROR';
  sessionDuration: number; // in seconds
  pnlToday: number;
  xpGained?: number;
  className?: string;
}

export function BotStatusBar({
  status,
  sessionDuration,
  pnlToday,
  xpGained = 0,
  className = ''
}: BotStatusBarProps) {
  const [showXPPulse, setShowXPPulse] = useState(false);

  // Format duration as HH:MM:SS
  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Pulse animation when XP changes
  useEffect(() => {
    if (xpGained > 0) {
      setShowXPPulse(true);
      const timer = setTimeout(() => setShowXPPulse(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [xpGained]);

  const statusConfig = {
    RUNNING: {
      icon: '🤖',
      text: 'Bot Ativo',
      color: 'text-positive',
      glow: 'shadow-[0_0_20px_rgba(16,185,129,0.5)]',
      pulse: true,
    },
    STOPPED: {
      icon: '⏸️',
      text: 'Bot Parado',
      color: 'text-gray-400',
      glow: '',
      pulse: false,
    },
    PAUSED: {
      icon: '⏸️',
      text: 'Bot Pausado',
      color: 'text-warning',
      glow: 'shadow-[0_0_20px_rgba(245,166,35,0.5)]',
      pulse: false,
    },
    ERROR: {
      icon: '⚠️',
      text: 'Erro',
      color: 'text-negative',
      glow: 'shadow-[0_0_20px_rgba(235,47,47,0.5)]',
      pulse: true,
    },
  }[status];

  const isProfitable = pnlToday >= 0;

  return (
    <GlassCard
      variant={status === 'RUNNING' ? 'green' : 'default'}
      blurIntensity="lg"
      className={`px-6 py-3 ${className}`}
    >
      <div className="flex items-center justify-between gap-6">
        {/* Status */}
        <div className="flex items-center gap-3">
          <motion.span
            className="text-2xl"
            animate={statusConfig.pulse ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
          >
            {statusConfig.icon}
          </motion.span>
          <div>
            <div className={`text-sm font-medium ${statusConfig.color} ${statusConfig.glow}`}>
              {statusConfig.text}
            </div>
            <div className="text-xs text-gray-400">
              {formatDuration(sessionDuration)}
            </div>
          </div>
        </div>

        {/* PnL Today */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Hoje:</span>
          <motion.div
            animate={isProfitable ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 0.5 }}
            className={`text-lg font-bold ${
              isProfitable ? 'text-positive' : 'text-negative'
            }`}
          >
            {isProfitable ? '+' : ''}R$ {pnlToday.toFixed(2)}
          </motion.div>
        </div>

        {/* XP Gained (with pulse animation) */}
        {xpGained > 0 && (
          <AnimatePresence>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: showXPPulse ? [0, 1.2, 1] : 1,
                opacity: 1
              }}
              exit={{ scale: 0, opacity: 0 }}
              className="flex items-center gap-2 px-3 py-1 rounded-full bg-warning/20 border border-warning/50"
            >
              <span className="text-sm">✨</span>
              <span className="text-sm font-bold text-warning">
                +{xpGained} XP
              </span>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </GlassCard>
  );
}
