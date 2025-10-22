/**
 * TradeExplanation Component
 * Displays detailed trade analysis using REAL data from Supabase
 */

import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, TrendingUp, TrendingDown, Target, Gauge, Zap as ZapIcon } from 'lucide-react';
import { GlassCard } from '@/components/ui/gamification';
import type { Trade } from '@/integrations/supabase/client';

export interface TradeDetails extends Trade {
  // Inherits all Trade fields including strategy_explanation, indicators_snapshot, etc.
}

interface TradeExplanationProps {
  isOpen: boolean;
  trade: TradeDetails | null;
  onClose: () => void;
}

// Format strategy name with emoji
function getStrategyName(strategyId: string | null): string {
  if (!strategyId) return 'Unknown';

  const strategies: Record<string, string> = {
    'aggressive': '🔥 Aggressive',
    'balanced': '⚖️ Balanced',
    'conservative': '🛡️ Conservative',
  };

  return strategies[strategyId] || strategyId;
}

// Calculate trade duration
function getTradeDuration(expirationSeconds: number | null): string {
  if (!expirationSeconds) return 'Unknown';

  const minutes = Math.floor(expirationSeconds / 60);
  const seconds = expirationSeconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

// Calculate ROI
function calculateROI(pnl: number, valor: number): string {
  if (valor === 0) return 'N/A';
  return ((pnl / valor) * 100).toFixed(1);
}

export function TradeExplanation({ isOpen, trade, onClose }: TradeExplanationProps) {
  if (!trade) return null;

  const isWin = trade.resultado === 'WIN';
  const strategyName = getStrategyName(trade.strategy_id);
  const duration = getTradeDuration(trade.expiration_seconds);
  const roi = calculateROI(trade.pnl || 0, trade.valor);

  // ✅ USE REAL DATA FROM SUPABASE
  const explanation = trade.strategy_explanation || 'No analysis available';
  const technicalSummary = trade.technical_summary || '';
  const confidenceScore = trade.confidence_score || 0;
  const indicators = trade.indicators_snapshot as Record<string, any> | null;
  const marketConditions = trade.market_conditions as Record<string, any> | null;

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
            <GlassCard className="border-primary/30 shadow-2xl max-h-[90vh] w-full max-w-2xl overflow-hidden flex flex-col pointer-events-auto">
              {/* Header */}
              <div className={`border-b border-slate-700/50 p-5 flex items-center justify-between flex-shrink-0 bg-gradient-to-r ${
                isWin ? 'from-positive/20 to-positive/10' : 'from-negative/20 to-negative/10'
              }`}>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-white">{trade.ativo_nome}</h2>
                  <p className={`text-xs ${isWin ? 'text-positive' : 'text-negative'}`}>
                    {trade.resultado === 'WIN' ? '✅ WIN' : trade.resultado === 'LOSS' ? '❌ LOSS' : '⏳ PENDING'}
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
              <div className="overflow-y-auto flex-1 p-5 space-y-4">
                {/* Technical Summary - Top Priority */}
                {technicalSummary && (
                  <div className="bg-primary/10 rounded-lg p-3 border border-primary/30">
                    <p className="text-xs text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-1">
                      <ZapIcon className="w-3 h-3" />
                      Technical Summary
                    </p>
                    <p className="text-sm font-medium text-primary">{technicalSummary}</p>
                  </div>
                )}

                {/* Strategy Explanation - REAL DATA FROM BACKEND */}
                <div className="bg-slate-800/20 rounded-lg p-4 border border-slate-700/30">
                  <p className="text-xs text-slate-400 mb-2 uppercase tracking-wider">Bot Analysis</p>
                  <p className="text-sm text-slate-200 leading-relaxed">
                    {explanation}
                  </p>
                </div>

                {/* P&L - Prominent */}
                <div className={`rounded-lg p-4 border-2 ${isWin ? 'bg-positive/10 border-positive/50' : 'bg-negative/10 border-negative/50'}`}>
                  <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider">Profit/Loss</p>
                  <p className={`text-2xl font-bold ${isWin ? 'text-positive' : 'text-negative'}`}>
                    {(trade.pnl || 0) >= 0 ? '+' : ''}R$ {(trade.pnl || 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    ROI: {roi}% on R$ {trade.valor.toFixed(2)} entry
                  </p>
                </div>

                {/* Confidence Score - Highlighted */}
                {confidenceScore > 0 && (
                  <div className="bg-gradient-to-r from-yellow-900/20 to-yellow-800/10 rounded-lg p-3 border border-yellow-700/30">
                    <p className="text-xs text-slate-400 mb-2 flex items-center gap-1">
                      <Gauge className="w-3 h-3" />
                      Confidence Score
                    </p>
                    <div className="flex items-center gap-3">
                      <p className="text-2xl font-bold text-yellow-400">{confidenceScore.toFixed(0)}%</p>
                      <div className="flex-1 bg-slate-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-yellow-500 to-yellow-400 h-full rounded-full"
                          style={{ width: `${Math.min(confidenceScore, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Strategy & Direction */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/30">
                    <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      Strategy
                    </p>
                    <p className="text-sm font-medium text-primary">{strategyName}</p>
                  </div>
                  <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/30">
                    <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      Direction
                    </p>
                    <p className={`text-sm font-bold ${trade.direction === 'CALL' ? 'text-positive' : 'text-negative'}`}>
                      {trade.direction === 'CALL' ? '📈 CALL' : '📉 PUT'}
                    </p>
                  </div>
                </div>

                {/* Duration & Prices */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/30">
                    <p className="text-xs text-slate-400 mb-1">Duration</p>
                    <p className="text-sm font-medium text-white">{duration}</p>
                  </div>
                  <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/30">
                    <p className="text-xs text-slate-400 mb-1">Entry Price</p>
                    <p className="text-sm font-medium text-white">{trade.entry_price ? `R$ ${trade.entry_price.toFixed(2)}` : 'N/A'}</p>
                  </div>
                  <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/30">
                    <p className="text-xs text-slate-400 mb-1">Exit Price</p>
                    <p className="text-sm font-medium text-white">{trade.exit_price ? `R$ ${trade.exit_price.toFixed(2)}` : 'N/A'}</p>
                  </div>
                </div>

                {/* Indicators - Display if available */}
                {indicators && (
                  <div className="bg-slate-800/20 rounded-lg p-3 border border-slate-700/30">
                    <p className="text-xs text-slate-400 mb-3 uppercase tracking-wider">Technical Indicators</p>
                    <div className="space-y-2 text-xs">
                      {indicators.rsi && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">RSI:</span>
                          <span className="text-slate-200">
                            {indicators.rsi.value?.toFixed(1) || 'N/A'}
                            {indicators.rsi.signal && ` (${indicators.rsi.signal})`}
                          </span>
                        </div>
                      )}
                      {indicators.macd && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">MACD:</span>
                          <span className="text-slate-200">
                            {indicators.macd.value?.toFixed(2) || 'N/A'}
                            {indicators.macd.trend && ` - ${indicators.macd.trend}`}
                          </span>
                        </div>
                      )}
                      {indicators.bollinger_bands && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">BB Signal:</span>
                          <span className="text-slate-200">{indicators.bollinger_bands.signal || 'N/A'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Market Conditions */}
                {marketConditions && (
                  <div className="bg-slate-800/20 rounded-lg p-3 border border-slate-700/30">
                    <p className="text-xs text-slate-400 mb-2 uppercase tracking-wider">Market Conditions</p>
                    <div className="space-y-1 text-xs">
                      {marketConditions.price && (
                        <p className="text-slate-300">Price: <span className="text-slate-100">R$ {marketConditions.price.toFixed(2)}</span></p>
                      )}
                      {marketConditions.volatility && (
                        <p className="text-slate-300">Volatility: <span className="text-slate-100">{marketConditions.volatility}</span></p>
                      )}
                      {marketConditions.volume_trend && (
                        <p className="text-slate-300">Volume: <span className="text-slate-100">{marketConditions.volume_trend}</span></p>
                      )}
                      {marketConditions.market_session && (
                        <p className="text-slate-300">Session: <span className="text-slate-100">{marketConditions.market_session}</span></p>
                      )}
                    </div>
                  </div>
                )}

                {/* Timestamp */}
                <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/30">
                  <p className="text-xs text-slate-400 mb-1">Opened at</p>
                  <p className="text-sm text-white">
                    {new Date(trade.data_abertura).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
