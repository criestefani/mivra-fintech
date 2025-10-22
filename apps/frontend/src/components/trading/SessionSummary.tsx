/**
 * SessionSummary Component
 * Displays end-of-session report with metrics, configuration, and trades
 */

import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { LiveTradeFeed, type Trade } from './LiveTradeFeed';

interface SessionConfig {
  mode: 'auto' | 'manual';
  strategy?: string;
  asset?: string;
  timeframe?: number;
  amount: number;
  leverageEnabled?: boolean;
  leverage?: number;
  safetyStopEnabled?: boolean;
  safetyStop?: number;
  dailyGoalEnabled?: boolean;
  dailyGoal?: number;
}

interface SessionSummaryProps {
  isOpen: boolean;
  sessionTrades: Trade[];
  totalPnL: number;
  config: SessionConfig | null;
  onClose: () => void;
}

export function SessionSummary({
  isOpen,
  sessionTrades,
  totalPnL,
  config,
  onClose
}: SessionSummaryProps) {
  const wins = sessionTrades.filter(t => t.resultado === 'WIN').length;
  const losses = sessionTrades.filter(t => t.resultado === 'LOSS').length;
  const ties = sessionTrades.filter(t => t.resultado === 'TIE').length;
  const totalTrades = sessionTrades.length;
  const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : '0.0';
  const isProfitable = totalPnL > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-50 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
          >
            <div className="bg-slate-900 border border-primary/50 shadow-2xl max-h-[95vh] w-full max-w-3xl overflow-hidden flex flex-col pointer-events-auto rounded-lg">
              {/* Header */}
              <div className={`border-b border-slate-700/50 p-5 flex items-center justify-between flex-shrink-0 bg-gradient-to-r ${
                isProfitable ? 'from-positive/20 to-positive/10' : 'from-negative/20 to-negative/10'
              }`}>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white">🎯 Session Summary</h2>
                  <p className={`text-sm mt-1 ${isProfitable ? 'text-positive' : 'text-negative'}`}>
                    {isProfitable ? '✅ PROFITABLE SESSION' : '❌ LOSING SESSION'}
                  </p>
                </div>
                <motion.button
                  onClick={onClose}
                  whileHover={{ rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-1.5 hover:bg-slate-800/50 rounded-lg transition-colors flex-shrink-0"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </motion.button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto flex-1 p-6 space-y-6">
                {/* Congratulations Message - Only for profitable */}
                {isProfitable && (
                  <div className="bg-positive/10 border border-positive/50 rounded-lg p-4">
                    <p className="text-positive font-semibold text-lg">
                      🎉 Parabéns! Você teve uma sessão lucrativa!
                    </p>
                    <p className="text-slate-300 text-sm mt-2">
                      Continue com essa estratégia vencedora e gerencie bem seus riscos.
                    </p>
                  </div>
                )}

                {/* Session Metrics */}
                <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/30">
                  <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">Session Metrics</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-800/50 rounded p-3">
                      <p className="text-xs text-slate-400">Total Trades</p>
                      <p className="text-2xl font-bold text-white mt-1">{totalTrades}</p>
                    </div>
                    <div className="bg-positive/10 rounded p-3 border border-positive/30">
                      <p className="text-xs text-slate-400">Wins</p>
                      <p className="text-2xl font-bold text-positive mt-1">{wins}</p>
                    </div>
                    <div className="bg-negative/10 rounded p-3 border border-negative/30">
                      <p className="text-xs text-slate-400">Losses</p>
                      <p className="text-2xl font-bold text-negative mt-1">{losses}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded p-3">
                      <p className="text-xs text-slate-400">Ties</p>
                      <p className="text-2xl font-bold text-slate-300 mt-1">{ties}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded p-3">
                      <p className="text-xs text-slate-400">Win Rate</p>
                      <p className="text-2xl font-bold text-white mt-1">{winRate}%</p>
                    </div>
                    <div className={`rounded p-3 border-2 ${isProfitable ? 'bg-positive/10 border-positive/50' : 'bg-negative/10 border-negative/50'}`}>
                      <p className="text-xs text-slate-400">Total P&L</p>
                      <p className={`text-2xl font-bold mt-1 ${isProfitable ? 'text-positive' : 'text-negative'}`}>
                        {isProfitable ? '+' : ''}R$ {totalPnL.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Configuration Used */}
                {config && (
                  <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/30">
                    <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Configuration Used
                    </h3>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Mode</p>
                          <p className="text-sm font-semibold text-white">
                            {config.mode === 'auto' ? '🤖 Auto' : '🎮 Manual'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Entry Amount</p>
                          <p className="text-sm font-semibold text-white">R$ {config.amount.toFixed(2)}</p>
                        </div>

                        {config.mode === 'manual' ? (
                          <>
                            <div>
                              <p className="text-xs text-slate-500 mb-1">Asset</p>
                              <p className="text-sm font-semibold text-white">{config.asset}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 mb-1">Timeframe</p>
                              <p className="text-sm font-semibold text-white">{config.timeframe}s</p>
                            </div>
                          </>
                        ) : (
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Strategy</p>
                            <p className="text-sm font-semibold text-white capitalize">{config.strategy}</p>
                          </div>
                        )}
                      </div>

                      {/* Advanced Settings */}
                      <div className="border-t border-slate-700/30 pt-3">
                        <div className="space-y-2 text-xs">
                          {config.leverageEnabled && (
                            <div className="flex justify-between text-slate-300">
                              <span>Leverage</span>
                              <span className="text-slate-100">x{config.leverage}</span>
                            </div>
                          )}
                          {config.safetyStopEnabled && (
                            <div className="flex justify-between text-slate-300">
                              <span>Safety Stop</span>
                              <span className="text-slate-100">{config.safetyStop} losses</span>
                            </div>
                          )}
                          {config.dailyGoalEnabled && (
                            <div className="flex justify-between text-slate-300">
                              <span>Daily Goal</span>
                              <span className="text-slate-100">R$ {config.dailyGoal?.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Session Trades List */}
                {sessionTrades.length > 0 && (
                  <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/30">
                    <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">Session Trades</h3>
                    <div className="space-y-2">
                      {sessionTrades.map((trade, idx) => (
                        <div key={`${trade.id}-${idx}`} className="flex items-center justify-between bg-slate-800/50 p-2 rounded border border-slate-700/30">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className={`text-sm font-bold flex-shrink-0 ${trade.resultado === 'WIN' ? 'text-positive' : 'text-negative'}`}>
                              {trade.resultado === 'WIN' ? '✓' : '✗'}
                            </span>
                            <span className="text-sm font-medium text-white truncate">{(trade as any).ativo_nome || trade.asset}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${trade.direction === 'CALL' ? 'bg-positive/20 text-positive' : 'bg-negative/20 text-negative'}`}>
                              {trade.direction}
                            </span>
                          </div>
                          <span className={`text-sm font-bold flex-shrink-0 ml-2 ${trade.pnl >= 0 ? 'text-positive' : 'text-negative'}`}>
                            {trade.pnl >= 0 ? '+' : ''}R$ {trade.pnl.toFixed(0)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer - Close Button */}
              <div className="border-t border-slate-700/50 p-4 bg-slate-800/20">
                <button
                  onClick={onClose}
                  className="w-full bg-primary hover:bg-primary/80 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Close & Reset Session
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
