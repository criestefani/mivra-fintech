// OperationsHeader Component - Main header for Operations page
// Shows bot mode toggle and start/stop controls

import React from 'react'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Play, Square, Loader2, Bot, Gamepad2 } from 'lucide-react'
import { GlassCard } from '@/components/ui/gamification'

interface OperationsHeaderProps {
  botMode: 'auto' | 'manual'
  onBotModeChange: (mode: 'auto' | 'manual') => void
  isRunning: boolean
  isConnected: boolean
  isLoading: boolean
  onStart: () => void
  onStop: () => void
}

export const OperationsHeader: React.FC<OperationsHeaderProps> = ({
  botMode,
  onBotModeChange,
  isRunning,
  isConnected,
  isLoading,
  onStart,
  onStop
}) => {
  return (
    <GlassCard className="border-primary/30 shadow-[0_0_20px_rgba(255,140,26,0.15)]">
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Left: Mode Toggle */}
          <div className="space-y-2">
            <h2 className="text-lg md:text-xl font-bold text-primary">Trading Bot</h2>
            <div className="flex items-center gap-2">
              <Button
                variant={botMode === 'auto' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onBotModeChange('auto')}
                disabled={isRunning}
                className={`gap-2 ${botMode === 'auto' ? 'bg-primary hover:bg-primary/90 text-white' : 'hover:bg-primary/10'}`}
              >
                <Bot className="w-4 h-4" />
                Auto Mode
              </Button>
              <Button
                variant={botMode === 'manual' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onBotModeChange('manual')}
                disabled={isRunning}
                className={`gap-2 ${botMode === 'manual' ? 'bg-warning hover:bg-warning/90 text-white' : 'hover:bg-warning/10'}`}
              >
                <Gamepad2 className="w-4 h-4" />
                Manual Mode
              </Button>
            </div>
          </div>

          {/* Right: Control Buttons */}
          <div className="flex items-center gap-3">
            {/* Connection Status */}
            <div className="hidden md:flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-positive animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-negative'}`} />
              <span className="text-sm text-muted-foreground">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {/* Start/Stop Button */}
            {isRunning ? (
              <Button
                variant="destructive"
                onClick={onStop}
                disabled={isLoading}
                className="gap-2 min-w-[120px] bg-negative hover:bg-negative/90 text-white"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                Stop Bot
              </Button>
            ) : (
              <Button
                variant="default"
                onClick={onStart}
                disabled={!isConnected || isLoading}
                className="gap-2 min-w-[120px] bg-positive text-white hover:bg-positive/90 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                Start Bot
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Connection Status */}
        <div className="md:hidden flex items-center gap-2 mt-4 pt-4 border-t border-white/10">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-positive animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-negative'}`} />
          <span className="text-sm text-muted-foreground">
            {isConnected ? 'Connected to broker' : 'Not connected to broker'}
          </span>
        </div>
      </CardContent>
    </GlassCard>
  )
}
