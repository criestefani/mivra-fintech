/**
 * LiveTradeFeed Component
 * Floating button that opens a drawer with recent trades
 */

import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useEffect, useState } from 'react';
import { X, TrendingUp } from 'lucide-react';

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
  maxTrades = 5,
  className = ''
}: LiveTradeFeedProps) {
  const [isOpen, setIsOpen] = useState(false);
  const recentTrades = trades.slice(0, maxTrades);
  const winCount = recentTrades.filter(t => t.result === 'WIN').length;

  return (
    <>
      {/* ✅ Floating Button (Small) */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-8 right-8 w-14 h-14 rounded-full bg-gradient-to-r from-electric-blue to-neon-cyan shadow-2xl flex items-center justify-center z-40 hover:scale-110 transition-transform ${className}`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <TrendingUp className="w-6 h-6 text-white" />
        {winCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -right-2 bg-profit-green text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center"
          >
            {winCount}
          </motion.div>
        )}
      </motion.button>

      {/* ✅ Drawer Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            />

            {/* Drawer from right */}
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-96 bg-deep-space border-l border-white/10 shadow-2xl z-50 overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-deep-space/95 backdrop-blur-lg border-b border-white/10 p-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-electric-blue" />
                  Trades Recentes
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Trades List */}
              <div className="p-4 space-y-3">
                <AnimatePresence mode="popLayout">
                  {recentTrades.length > 0 ? (
                    recentTrades.map((trade, index) => (
                      <TradeCard key={trade.id} trade={trade} index={index} />
                    ))
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhum trade ainda</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
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
        colors: ['#10B981', '#F59E0B'],
      });
    }
  }, [isWin, index]);

  const resultConfig = {
    WIN: {
      icon: '✅',
      bgColor: 'bg-profit-green/10',
      borderColor: 'border-profit-green/30',
      textColor: 'text-profit-green',
    },
    LOSS: {
      icon: '❌',
      bgColor: 'bg-loss-red/10',
      borderColor: 'border-loss-red/30',
      textColor: 'text-loss-red',
    },
    PENDING: {
      icon: '⏳',
      bgColor: 'bg-electric-blue/10',
      borderColor: 'border-electric-blue/30',
      textColor: 'text-electric-blue',
    },
  }[trade.result];

  const directionIcon = trade.direction === 'CALL' ? '▲' : '▼';
  const directionColor = trade.direction === 'CALL' ? 'text-profit-green' : 'text-loss-red';

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
