/**
 * LiveTradeFeed Component
 * Floating button that opens a modal popup with recent trades
 */

import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useEffect, useState } from 'react';
import { X, TrendingUp } from 'lucide-react';
import { GlassCard } from '@/components/ui/gamification';

export interface Trade {
  id: string;
  asset: string;
  direction: 'CALL' | 'PUT';
  result: 'WIN' | 'LOSS' | 'PENDING';
  pnl: number;
  timestamp: string;
}

interface LiveTradeFeedProps {
  trades: Trade[];
  maxTrades?: number;
  className?: string;
}

export function LiveTradeFeed({
  trades,
  maxTrades = 8,
  className = ''
}: LiveTradeFeedProps) {
  const [isOpen, setIsOpen] = useState(false);
  const recentTrades = trades.slice(0, maxTrades);
  const winCount = recentTrades.filter(t => t.result === 'WIN').length;

  return (
    <>
      {/* ✅ Floating Button - Absolute positioned (relative to parent chart) */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`absolute bottom-4 right-4 w-12 h-12 rounded-full bg-gradient-to-r from-primary to-neon-cyan shadow-lg hover:shadow-xl flex items-center justify-center z-20 transition-all ${className}`}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
      >
        <TrendingUp className="w-5 h-5 text-white" />
        {winCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -right-2 bg-positive text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg"
          >
            {winCount}
          </motion.div>
        )}
      </motion.button>

      {/* ✅ Modal Popup */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 z-40 backdrop-blur-md"
            />

            {/* Centered Modal Popup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <GlassCard className="border-primary/30 shadow-2xl max-h-96 w-full max-w-md overflow-hidden flex flex-col">
                {/* Header */}
                <div className="border-b border-slate-700/50 p-5 flex items-center justify-between flex-shrink-0">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Recent Trades
                  </h2>
                  <motion.button
                    onClick={() => setIsOpen(false)}
                    whileHover={{ rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-1.5 hover:bg-slate-800/50 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </motion.button>
                </div>

                {/* Trades List */}
                <div className="overflow-y-auto flex-1 p-4 space-y-3">
                  <AnimatePresence mode="popLayout">
                    {recentTrades.length > 0 ? (
                      recentTrades.map((trade, index) => (
                        <TradeCard key={trade.id} trade={trade} index={index} />
                      ))
                    ) : (
                      <div className="text-center py-12 text-slate-400">
                        <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No trades yet</p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </GlassCard>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

interface TradeCardProps {
  trade: Trade;
  index: number;
}

function TradeCard({ trade, index }: TradeCardProps) {
  const isWin = trade.result === 'WIN';
  const isLoss = trade.result === 'LOSS';
  const isPending = trade.result === 'PENDING';

  // Trigger confetti for wins
  useEffect(() => {
    if (isWin && index === 0) {
      // Small confetti burst for wins
      confetti({
        particleCount: 30,
        spread: 60,
        origin: { x: 0.5, y: 0.5 },
        colors: ['hsl(152, 71%, 45%)', 'hsl(35, 96%, 52%)'],
      });
    }
  }, [isWin, index]);

  const resultConfig = {
    WIN: {
      icon: '✅',
      bgColor: 'bg-positive/10',
      borderColor: 'border-positive/30',
      textColor: 'text-positive',
    },
    LOSS: {
      icon: '❌',
      bgColor: 'bg-negative/10',
      borderColor: 'border-negative/30',
      textColor: 'text-negative',
    },
    PENDING: {
      icon: '⏳',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/30',
      textColor: 'text-primary',
    },
  }[trade.result];

  const directionIcon = trade.direction === 'CALL' ? '▲' : '▼';
  const directionColor = trade.direction === 'CALL' ? 'text-positive' : 'text-negative';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8, height: 0 }}
      transition={{ duration: 0.3 }}
      className={`rounded-lg border ${resultConfig.bgColor} ${resultConfig.borderColor} p-3`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-lg ${directionColor}`}>{directionIcon}</span>
          <span className="font-bold text-white text-sm">{trade.asset}</span>
        </div>
        <motion.span
          className="text-xl"
          animate={isPending ? { rotate: 360 } : {}}
          transition={{ duration: 1, repeat: isPending ? Infinity : 0 }}
        >
          {resultConfig.icon}
        </motion.span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {new Date(trade.timestamp).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
        {!isPending && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            className={`text-sm font-bold ${resultConfig.textColor}`}
          >
            {trade.pnl >= 0 ? '+' : ''}R$ {trade.pnl.toFixed(2)}
          </motion.span>
        )}
      </div>
    </motion.div>
  );
}
