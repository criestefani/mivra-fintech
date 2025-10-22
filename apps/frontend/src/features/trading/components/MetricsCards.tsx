// MetricsCards Component - Display trading performance metrics
// Shows win rate, total trades, wins/losses, and PnL in card format

import React from 'react'
import { Card, CardContent } from '@/shared/components/ui/card'
import { TrendingUp, TrendingDown, Activity } from 'lucide-react'
import { GlassCard } from '@/components/ui/gamification'

interface MetricsCardsProps {
  winRate: number
  totalTrades: number
  totalWins: number
  totalLosses: number
  pnl: number
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({
  winRate,
  totalTrades,
  totalWins,
  totalLosses,
  pnl
}) => {
  const isProfitable = pnl >= 0

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
      {/* Win Rate Card */}
      <GlassCard className={`border-2 ${
        winRate >= 50
          ? 'border-positive/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
          : 'border-primary/30 shadow-[0_0_20px_rgba(255,140,26,0.10)]'
      }`}>
        <CardContent className="p-4 md:p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs md:text-sm text-muted-foreground">Win Rate</span>
              <Activity className="w-4 h-4 text-warning" />
            </div>
            <div
              className={`text-2xl md:text-3xl font-bold font-mono ${
                winRate >= 50 ? 'text-positive' : 'text-negative'
              }`}
            >
              {winRate.toFixed(1)}%
            </div>
          </div>
        </CardContent>
      </GlassCard>

      {/* Total Trades Card */}
      <GlassCard className="border-primary/30 shadow-[0_0_20px_rgba(255,140,26,0.15)]">
        <CardContent className="p-4 md:p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs md:text-sm text-muted-foreground">Total Trades</span>
              <Activity className="w-4 h-4 text-warning" />
            </div>
            <div className="text-2xl md:text-3xl font-bold font-mono text-primary">
              {totalTrades}
            </div>
            <div className="text-xs text-muted-foreground">
              <span className="text-positive">{totalWins}W</span> / <span className="text-negative">{totalLosses}L</span>
            </div>
          </div>
        </CardContent>
      </GlassCard>

      {/* PnL Card */}
      <GlassCard
        className={`border-2 ${
          isProfitable
            ? 'border-positive/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
            : 'border-primary/30 shadow-[0_0_20px_rgba(255,140,26,0.10)]'
        }`}
      >
        <CardContent className="p-4 md:p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs md:text-sm text-muted-foreground">P&L</span>
              {isProfitable ? (
                <TrendingUp className="w-4 h-4 text-positive" />
              ) : (
                <TrendingDown className="w-4 h-4 text-negative" />
              )}
            </div>
            <div
              className={`text-2xl md:text-3xl font-bold font-mono ${
                isProfitable ? 'text-positive' : 'text-negative'
              }`}
            >
              {isProfitable ? '+' : ''}R$ {pnl.toFixed(2)}
            </div>
          </div>
        </CardContent>
      </GlassCard>
    </div>
  )
}
