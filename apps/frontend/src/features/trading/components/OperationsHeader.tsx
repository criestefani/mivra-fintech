// OperationsHeader Component - Mode toggle for Operations page
// Shows elegantly centered bot mode toggle

import React from 'react'
import { motion } from 'framer-motion'
import { Bot, Gamepad2 } from 'lucide-react'
import { cn } from '@/shared/utils/cn'

interface OperationsHeaderProps {
  botMode: 'auto' | 'manual'
  onBotModeChange: (mode: 'auto' | 'manual') => void
  isRunning: boolean
}

export const OperationsHeader: React.FC<OperationsHeaderProps> = ({
  botMode,
  onBotModeChange,
  isRunning,
}) => {
  return (
    <div className="flex items-center justify-center py-4">
      <motion.div
        layout
        className="inline-flex items-center gap-0 p-1 rounded-xl backdrop-blur-xl bg-slate-900/50 border border-slate-700/50 shadow-lg"
      >
        {/* Auto Mode Button */}
        <motion.button
          whileHover={!isRunning ? { scale: 1.05 } : {}}
          whileTap={!isRunning ? { scale: 0.95 } : {}}
          onClick={() => !isRunning && onBotModeChange('auto')}
          disabled={isRunning}
          className={cn(
            'flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300',
            botMode === 'auto'
              ? 'bg-gradient-to-r from-primary/80 to-primary text-white shadow-lg shadow-primary/40'
              : 'text-slate-400 hover:text-slate-200'
          )}
        >
          <Bot className="w-4 h-4" />
          Auto
        </motion.button>

        {/* Divider Toggle */}
        <div className="w-0.5 h-8 bg-gradient-to-b from-slate-700/0 via-slate-600/50 to-slate-700/0 mx-2" />

        {/* Manual Mode Button */}
        <motion.button
          whileHover={!isRunning ? { scale: 1.05 } : {}}
          whileTap={!isRunning ? { scale: 0.95 } : {}}
          onClick={() => !isRunning && onBotModeChange('manual')}
          disabled={isRunning}
          className={cn(
            'flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300',
            botMode === 'manual'
              ? 'bg-gradient-to-r from-warning/80 to-warning text-white shadow-lg shadow-warning/40'
              : 'text-slate-400 hover:text-slate-200'
          )}
        >
          <Gamepad2 className="w-4 h-4" />
          Manual
        </motion.button>
      </motion.div>
    </div>
  )
}
