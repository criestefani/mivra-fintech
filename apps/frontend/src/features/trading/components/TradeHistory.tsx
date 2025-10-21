// TradeHistory Component - Display list of trades with results
// Shows trade history table with real-time updates

import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { RefreshCw, Trash2, TrendingUp, TrendingDown, Clock, Wifi, WifiOff, AlertCircle } from 'lucide-react'
import { GlassCard } from '@/components/ui/gamification'

export interface Trade {
  id: number
  timestamp: string
  asset: string
  direction: 'CALL' | 'PUT'
  expiration: number
  result: 'WIN' | 'LOSS' | 'PENDING'
  pnl: number
}

interface TradeHistoryProps {
  trades: Trade[]
  onReset: () => void
  onRefresh: () => void
  realtimeStatus: 'connected' | 'connecting' | 'error'
}

export const TradeHistory: React.FC<TradeHistoryProps> = ({
  trades,
  onReset,
  onRefresh,
  realtimeStatus
}) => {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getResultBadge = (result: Trade['result']) => {
    if (result === 'PENDING') {
      return (
        <Badge variant="outline" className="gap-1 bg-warning/10 text-warning border-warning/40">
          <Clock className="w-3 h-3" />
          PENDING
        </Badge>
      )
    }

    if (result === 'WIN') {
      return (
        <Badge variant="outline" className="gap-1 bg-positive/10 text-positive border-positive/50">
          <TrendingUp className="w-3 h-3" />
          WIN
        </Badge>
      )
    }

    return (
      <Badge variant="outline" className="gap-1 bg-negative/10 text-negative border-negative/50">
        <TrendingDown className="w-3 h-3" />
        LOSS
      </Badge>
    )
  }

  const getRealtimeStatusIcon = () => {
    switch (realtimeStatus) {
      case 'connected':
        return <span title="Real-time connected"><Wifi className="w-4 h-4 text-positive" /></span>
      case 'connecting':
        return <span title="Connecting..."><Wifi className="w-4 h-4 text-warning animate-pulse" /></span>
      case 'error':
        return <span title="Connection error"><WifiOff className="w-4 h-4 text-negative" /></span>
    }
  }

  return (
    <GlassCard className="border-primary/30 shadow-[0_0_20px_rgba(255,140,26,0.15)]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg md:text-xl text-primary">Trade History</CardTitle>
            {getRealtimeStatusIcon()}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="gap-1 hover:bg-primary/10"
            >
              <RefreshCw className="w-3 h-3" />
              <span className="hidden md:inline">Refresh</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="gap-1 text-negative hover:text-negative hover:bg-negative/10"
            >
              <Trash2 className="w-3 h-3" />
              <span className="hidden md:inline">Clear</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {trades.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No trades yet</p>
            <p className="text-xs mt-1">Start the bot to see your trades here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 text-muted-foreground font-semibold">Time</th>
                  <th className="text-left py-2 px-2 text-muted-foreground font-semibold">Asset</th>
                  <th className="text-center py-2 px-2 text-muted-foreground font-semibold">Direction</th>
                  <th className="text-center py-2 px-2 text-muted-foreground font-semibold hidden md:table-cell">Expiry</th>
                  <th className="text-center py-2 px-2 text-muted-foreground font-semibold">Result</th>
                  <th className="text-right py-2 px-2 text-muted-foreground font-semibold">P&L</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((trade) => (
                  <tr key={trade.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-2 font-mono text-xs">{formatTime(trade.timestamp)}</td>
                    <td className="py-3 px-2 font-semibold">{trade.asset}</td>
                    <td className="py-3 px-2 text-center">
                      <Badge
                        variant="outline"
                        className={`${
                          trade.direction === 'CALL'
                            ? 'bg-positive/10 text-positive border-positive/50'
                            : 'bg-negative/10 text-negative border-negative/50'
                        }`}
                      >
                        {trade.direction}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-center font-mono text-xs hidden md:table-cell text-muted-foreground">
                      {trade.expiration}s
                    </td>
                    <td className="py-3 px-2 text-center">{getResultBadge(trade.result)}</td>
                    <td
                      className={`py-3 px-2 text-right font-mono font-bold ${
                        trade.result === 'PENDING'
                          ? 'text-muted-foreground'
                          : trade.pnl >= 0
                          ? 'text-positive'
                          : 'text-negative'
                      }`}
                    >
                      {trade.result === 'PENDING' ? '-' : `${trade.pnl >= 0 ? '+' : ''}R$ ${trade.pnl.toFixed(2)}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </GlassCard>
  )
}
