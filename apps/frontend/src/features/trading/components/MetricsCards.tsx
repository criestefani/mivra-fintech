// MetricsCards Component - Display trading performance metrics
// Shows win rate, total trades, wins/losses, and PnL in card format

import React from 'react'
import { Card, CardContent } from '@/shared/components/ui/card'
import { TrendingUp, TrendingDown, Activity, DollarSign } from 'lucide-react'

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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {/* Win Rate Card */}
      <Card className="glass border-border">
        <CardContent className="p-4 md:p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs md:text-sm text-muted-foreground">Win Rate</span>
              <Activity className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className={`text-2xl md:text-3xl font-bold font-mono ${
              winRate >= 50 ? 'text-green-500' : 'text-red-500'
            }`}>
              {winRate.toFixed(1)}%
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Trades Card */}
      <Card className="glass border-border">
        <CardContent className="p-4 md:p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs md:text-sm text-muted-foreground">Total Trades</span>
              <Activity className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-2xl md:text-3xl font-bold font-mono text-foreground">
              {totalTrades}
            </div>
            <div className="text-xs text-muted-foreground">
              {totalWins}W / {totalLosses}L
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wins Card */}
      <Card className="glass border-border">
        <CardContent className="p-4 md:p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs md:text-sm text-muted-foreground">Wins</span>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-2xl md:text-3xl font-bold font-mono text-green-500">
              {totalWins}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PnL Card */}
      <Card className={`glass border-2 ${isProfitable ? 'border-green-500/50 bg-green-500/5' : 'border-red-500/50 bg-red-500/5'}`}>
        <CardContent className="p-4 md:p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs md:text-sm text-muted-foreground">P&L</span>
              {isProfitable ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
            </div>
            <div className={`text-2xl md:text-3xl font-bold font-mono ${
              isProfitable ? 'text-green-500' : 'text-red-500'
            }`}>
              {isProfitable ? '+' : ''}R$ {pnl.toFixed(2)}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
