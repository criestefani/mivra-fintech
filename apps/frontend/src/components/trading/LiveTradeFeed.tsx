/**
 * LiveTradeFeed Component
 * Floating button that opens a modal popup with recent trades
 */

import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useEffect, useState } from 'react';
import { X, TrendingUp, ChevronRight } from 'lucide-react';
import { GlassCard } from '@/components/ui/gamification';
import { TradeExplanation, type TradeDetails } from './TradeExplanation';

export interface Trade {
  id: string;
  asset: string;
  direction: 'CALL' | 'PUT';
  result: 'WIN' | 'LOSS' | 'PENDING';
  pnl: number;
  timestamp: string | number;
  strategy?: string;
  strategy_explanation?: string;
  indicators_snapshot?: Record<string, any>;
  confidence_score?: number;
  market_conditions?: Record<string, any>;
  technical_summary?: string;
  entry_price?: number;
  exit_price?: number;
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
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
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
                <div className="border-b border-slate-700/50 p-4 flex items-center justify-between flex-shrink-0">
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

                {/* Trades List - Compact Lines */}
                <div className="overflow-y-auto flex-1">
                  <AnimatePresence mode="popLayout">
                    {recentTrades.length > 0 ? (
                      recentTrades.map((trade, index) => (
                        <motion.button
                          key={trade.id}
                          onClick={() => setSelectedTrade(trade)}
                          className="w-full px-4 py-2.5 border-b border-slate-700/30 hover:bg-slate-800/40 transition-colors flex items-center justify-between group text-left"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className={`text-sm font-bold flex-shrink-0 ${trade.result === 'WIN' ? 'text-positive' : 'text-negative'}`}>
                              {trade.result === 'WIN' ? '✓' : '✗'}
                            </span>
                            <span className="text-sm font-medium text-white truncate">{trade.asset}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${trade.direction === 'CALL' ? 'bg-positive/20 text-positive' : 'bg-negative/20 text-negative'}`}>
                              {trade.direction}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                            <span className={`text-sm font-bold ${trade.pnl >= 0 ? 'text-positive' : 'text-negative'}`}>
                              {trade.pnl >= 0 ? '+' : ''}R$ {trade.pnl.toFixed(0)}
                            </span>
                            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                          </div>
                        </motion.button>
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

      {/* ✅ Trade Explanation Modal - Pass ALL data unfiltered */}
      <TradeExplanation
        isOpen={selectedTrade !== null}
        trade={selectedTrade as any}
        onClose={() => setSelectedTrade(null)}
      />
    </>
  );
}
