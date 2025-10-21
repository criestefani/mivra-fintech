// AutoModeRunning Component - Display auto mode bot status
// Shows PnL chart and current bot activity when running

import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Activity, TrendingUp, TrendingDown } from 'lucide-react'
import { GlassCard } from '@/components/ui/gamification'

interface PnlDataPoint {
  time: string
  value: number
}

interface AutoModeRunningProps {
  pnlData: PnlDataPoint[]
  currentStatus: string | null
  currentAsset?: string
  currentAmount?: number
}

export const AutoModeRunning: React.FC<AutoModeRunningProps> = ({
  pnlData,
  currentStatus,
  currentAsset
}) => {
  const currentPnl = pnlData.length > 0 ? pnlData[pnlData.length - 1].value : 0
  const isProfitable = currentPnl >= 0

  return (
    <div className="space-y-4">
      {/* Current Status Card */}
      <GlassCard className="border-electric-blue/30 shadow-[0_0_20px_rgba(0,150,255,0.15)]">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-profit-green rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
              <div>
                <p className="text-sm text-muted-foreground">Bot Status</p>
                <p className="font-semibold text-electric-blue">
                  {currentStatus || 'Running...'}
                </p>
              </div>
            </div>

            {currentAsset && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Current Asset</p>
                <p className="font-semibold text-golden-amber">{currentAsset}</p>
              </div>
            )}
          </div>
        </CardContent>
      </GlassCard>

      {/* PnL Chart */}
      <GlassCard className={`border-2 ${
        isProfitable
          ? 'border-profit-green/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
          : 'border-loss-red/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
      }`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2 text-electric-blue">
              <Activity className="w-5 h-5" />
              P&L Evolution
            </CardTitle>
            <div className="flex items-center gap-2">
              {isProfitable ? (
                <TrendingUp className="w-5 h-5 text-profit-green" />
              ) : (
                <TrendingDown className="w-5 h-5 text-loss-red" />
              )}
              <span
                className={`text-xl font-bold font-mono ${
                  isProfitable ? 'text-profit-green' : 'text-loss-red'
                }`}
              >
                {isProfitable ? '+' : ''}R$ {currentPnl.toFixed(2)}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="w-full h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pnlData}>
                <XAxis
                  dataKey="time"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
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
                <ReferenceLine y={0} stroke="#888888" strokeDasharray="3 3" />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={isProfitable ? '#10B981' : '#EF4444'}
                  strokeWidth={2}
                  dot={false}
                  animationDuration={300}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {pnlData.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-muted-foreground text-sm">Waiting for trades...</p>
            </div>
          )}
        </CardContent>
      </GlassCard>
    </div>
  )
}
