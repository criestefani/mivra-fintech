// AutoModeRunning Component - Display auto mode bot status
// Shows PnL chart and current bot activity when running

import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Activity, TrendingUp, TrendingDown } from 'lucide-react'
import { GlassCard } from '@/components/ui/gamification'
import { CHART_COLORS } from '@/utils/chartColors'
import { LiveTradeFeed, Trade } from '@/components/trading'

interface PnlDataPoint {
  time: string
  value: number
}

interface AutoModeRunningProps {
  pnlData: PnlDataPoint[]
  currentStatus: string | null
  currentAsset?: string
  currentAmount?: number
  isRunning?: boolean
  trades?: Trade[]
}

export const AutoModeRunning: React.FC<AutoModeRunningProps> = ({
  pnlData,
  currentStatus,
  currentAsset,
  isRunning = false,
  trades
}) => {
  const currentPnl = pnlData.length > 0 ? pnlData[pnlData.length - 1].value : 0
  const isProfitable = currentPnl >= 0

  return (
    <GlassCard className={`border-2 ${
      isProfitable
        ? 'border-positive/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
        : 'border-primary/30 shadow-[0_0_20px_rgba(255,140,26,0.10)]'
    }`}>
      {/* Status Bar - Acoplado ao gráfico */}
      <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full animate-pulse ${
            isRunning ? 'bg-positive shadow-[0_0_10px_rgba(16,185,129,0.6)]' : 'bg-slate-600'
          }`} />
          <p className="font-semibold text-sm text-white">
            {isRunning ? (currentStatus || 'Running') : 'Stopped'}
          </p>
        </div>

        {currentAsset && (
          <div className="text-right">
            <p className="font-semibold text-sm text-warning">{currentAsset}</p>
          </div>
        )}
      </div>

      {/* PnL Chart */}
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 text-primary">
            <Activity className="w-5 h-5" />
            P&L Evolution
          </CardTitle>
          <div className="flex items-center gap-2">
            {isProfitable ? (
              <TrendingUp className="w-5 h-5 text-positive" />
            ) : (
              <TrendingDown className="w-5 h-5 text-negative" />
            )}
            <span
              className={`text-xl font-bold font-mono ${
                isProfitable ? 'text-positive' : 'text-negative'
              }`}
            >
              {isProfitable ? '+' : ''}R$ {currentPnl.toFixed(2)}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
          <div className="relative w-full h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pnlData} margin={{ left: -20, right: 10, top: 10, bottom: 10 }}>
                <XAxis
                  dataKey="time"
                  stroke={CHART_COLORS.TEXT}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tick={false}
                />
                <YAxis
                  stroke={CHART_COLORS.TEXT}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `R$ ${value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'P&L']}
                />
                <ReferenceLine y={0} stroke={CHART_COLORS.ZERO_LINE} strokeDasharray="3 3" />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={isProfitable ? CHART_COLORS.POSITIVE : CHART_COLORS.NEGATIVE}
                  strokeWidth={2}
                  dot={false}
                  animationDuration={300}
                  animationEasing="ease-in-out"
                  isAnimationActive={true}
                  connectNulls={true}
                />
              </LineChart>
            </ResponsiveContainer>

            {pnlData.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-muted-foreground text-sm">Waiting for trades...</p>
              </div>
            )}

            {/* ✅ Floating Button for Recent Trades */}
            {trades && trades.length > 0 && (
              <LiveTradeFeed trades={trades} maxTrades={8} />
            )}
          </div>
        </CardContent>
      </GlassCard>
  )
}
