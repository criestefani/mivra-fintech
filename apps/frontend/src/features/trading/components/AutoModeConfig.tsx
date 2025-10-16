// AutoModeConfig Component - Configuration form for auto mode
// Allows user to configure strategy, entry value, leverage, safety stop, and daily goal

import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Badge } from '@/shared/components/ui/badge'
import { cn } from '@/shared/utils/cn'
import { Shield, Zap, Target, TrendingUp } from 'lucide-react'

interface AutoModeConfigProps {
  selectedStrategy: string
  onStrategyChange: (strategy: string) => void
  entryValue: number
  onEntryValueChange: (value: number) => void
  leverageEnabled: boolean
  onLeverageEnabledChange: (enabled: boolean) => void
  leverage: number
  onLeverageChange: (value: number) => void
  safetyStopEnabled: boolean
  onSafetyStopEnabledChange: (enabled: boolean) => void
  safetyStop: number
  onSafetyStopChange: (value: number) => void
  dailyGoalEnabled: boolean
  onDailyGoalEnabledChange: (enabled: boolean) => void
  dailyGoal: number
  onDailyGoalChange: (value: number) => void
}

const strategies = [
  {
    id: 'conservative',
    name: 'Conservative',
    description: 'Lower risk, higher win rate',
    icon: Shield,
    color: 'text-info'
  },
  {
    id: 'aggressive',
    name: 'Aggressive',
    description: 'Higher risk, higher reward',
    icon: Zap,
    color: 'text-warning'
  },
  {
    id: 'balanced',
    name: 'Balanced',
    description: 'Balanced risk/reward',
    icon: Target,
    color: 'text-positive'
  }
]

export const AutoModeConfig: React.FC<AutoModeConfigProps> = ({
  selectedStrategy,
  onStrategyChange,
  entryValue,
  onEntryValueChange,
  leverageEnabled,
  onLeverageEnabledChange,
  leverage,
  onLeverageChange,
  safetyStopEnabled,
  onSafetyStopEnabledChange,
  safetyStop,
  onSafetyStopChange,
  dailyGoalEnabled,
  onDailyGoalEnabledChange,
  dailyGoal,
  onDailyGoalChange
}) => {
  return (
    <div className="space-y-4">
      {/* Strategy Selection */}
      <Card className="glass border-border">
        <CardHeader>
          <CardTitle className="text-lg">Strategy Selection</CardTitle>
          <CardDescription>Choose the trading strategy for auto mode</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {strategies.map((strategy) => {
              const Icon = strategy.icon
              const isSelected = selectedStrategy === strategy.id

              return (
                <button
                  key={strategy.id}
                  onClick={() => onStrategyChange(strategy.id)}
                  className={cn(
                    'p-4 rounded-lg border-2 transition-all text-left hover:scale-105',
                    isSelected
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={cn('w-5 h-5 mt-0.5', strategy.color)} />
                    <div className="flex-1">
                      <div className="font-semibold text-foreground">{strategy.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {strategy.description}
                      </div>
                    </div>
                    {isSelected && (
                      <Badge variant="default" className="ml-auto">
                        Selected
                      </Badge>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Entry Value */}
      <Card className="glass border-border">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="entry-value" className="text-base font-semibold">
                Entry Value
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Amount to invest per trade
              </p>
            </div>

            {/* Preset Buttons */}
            <div className="grid grid-cols-4 gap-2">
              {[10, 20, 50, 100].map((value) => (
                <Button
                  key={value}
                  variant={entryValue === value ? 'default' : 'outline'}
                  onClick={() => onEntryValueChange(value)}
                  className={cn(
                    'transition-all',
                    entryValue === value && 'bg-accent hover:bg-accent/90'
                  )}
                >
                  R$ {value}
                </Button>
              ))}
            </div>

            {/* Custom Input */}
            <div className="space-y-2">
              <Label htmlFor="entry-value">Custom amount (R$)</Label>
              <Input
                id="entry-value"
                type="number"
                min="1"
                max="1000"
                step="0.01"
                value={entryValue}
                onChange={(e) => onEntryValueChange(Number(e.target.value))}
                placeholder="e.g., 10.00"
                className="bg-card text-center font-mono text-lg"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Options */}
      <Card className="glass border-border">
        <CardHeader>
          <CardTitle className="text-lg">Advanced Options</CardTitle>
          <CardDescription>Optional risk management settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Leverage (Martingale) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-semibold">Leverage (Martingale)</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Multiply entry after loss
                </p>
              </div>
              <Button
                variant={leverageEnabled ? 'default' : 'outline'}
                size="sm"
                onClick={() => onLeverageEnabledChange(!leverageEnabled)}
              >
                {leverageEnabled ? 'ON' : 'OFF'}
              </Button>
            </div>
            {leverageEnabled && (
              <Input
                type="number"
                min="1.5"
                max="5"
                step="0.5"
                value={leverage}
                onChange={(e) => onLeverageChange(Number(e.target.value))}
                className="bg-card"
              />
            )}
          </div>

          {/* Safety Stop */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-semibold">Safety Stop</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Stop after consecutive losses
                </p>
              </div>
              <Button
                variant={safetyStopEnabled ? 'default' : 'outline'}
                size="sm"
                onClick={() => onSafetyStopEnabledChange(!safetyStopEnabled)}
              >
                {safetyStopEnabled ? 'ON' : 'OFF'}
              </Button>
            </div>
            {safetyStopEnabled && (
              <Input
                type="number"
                min="1"
                max="10"
                step="1"
                value={safetyStop}
                onChange={(e) => onSafetyStopChange(Number(e.target.value))}
                className="bg-card"
              />
            )}
          </div>

          {/* Daily Goal */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-positive" />
                  Daily Goal
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Stop when profit reaches target
                </p>
              </div>
              <Button
                variant={dailyGoalEnabled ? 'default' : 'outline'}
                size="sm"
                onClick={() => onDailyGoalEnabledChange(!dailyGoalEnabled)}
              >
                {dailyGoalEnabled ? 'ON' : 'OFF'}
              </Button>
            </div>
            {dailyGoalEnabled && (
              <Input
                type="number"
                min="10"
                max="10000"
                step="10"
                value={dailyGoal}
                onChange={(e) => onDailyGoalChange(Number(e.target.value))}
                placeholder="e.g., 100"
                className="bg-card"
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
