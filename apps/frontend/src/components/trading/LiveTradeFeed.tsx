/**
 * LiveTradeFeed Component
 * Sidebar showing recent trades in real-time with animations
 */

import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';

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
  position?: 'right' | 'left';
  className?: string;
}

export function LiveTradeFeed({
  trades,
  maxTrades = 5,
  position = 'right',
  className = ''
}: LiveTradeFeedProps) {
  const recentTrades = trades.slice(0, maxTrades);

  return (
    <div
      className={`fixed top-20 ${
        position === 'right' ? 'right-4' : 'left-4'
      } w-64 z-30 ${className}`}
    >
      <div className="bg-deep-space/90 backdrop-blur-lg rounded-2xl border border-white/10 p-4 shadow-xl">
        <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wide">
          Trades Recentes
        </h3>

        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {recentTrades.map((trade, index) => (
              <TradeCard key={trade.id} trade={trade} index={index} />
            ))}
          </AnimatePresence>

          {recentTrades.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm">
              Nenhum trade ainda
            </div>
          )}
        </div>
      </div>
    </div>
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
        origin: { x: 0.9, y: 0.2 },
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
      initial={{ opacity: 0, x: position === 'right' ? 50 : -50, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
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
