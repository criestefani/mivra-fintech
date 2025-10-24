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
    <div className="w-full px-4 py-6">
      <motion.div
        layout
        className="relative w-full p-1 rounded-2xl backdrop-blur-xl bg-gradient-to-b from-slate-800/60 to-slate-900/40 border border-slate-700/50 shadow-2xl overflow-hidden"
      >
        {/* Background animated glow */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute top-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -top-16 -left-16" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-warning/10 rounded-full blur-3xl -bottom-16 -right-16" />
        </div>

        {/* Animated background slide */}
        {botMode && (
          <motion.div
            layoutId="mode-background"
            className={cn(
              'absolute top-1 bottom-1 left-1 right-1 rounded-xl',
              botMode === 'auto'
                ? 'bg-gradient-to-r from-primary/20 via-primary/10 to-transparent'
                : 'bg-gradient-to-r from-warning/20 via-warning/10 to-transparent'
            )}
            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            style={{
              width: 'calc(50% - 0.5rem)',
              left: botMode === 'auto' ? '0.5rem' : '50%'
            }}
          />
        )}

        {/* Content container */}
        <div className="relative flex gap-2">
          {/* Auto Mode Button */}
          <motion.button
            whileHover={!isRunning ? { y: -2 } : {}}
            whileTap={!isRunning ? { y: 0 } : {}}
            onClick={() => !isRunning && onBotModeChange('auto')}
            disabled={isRunning}
            className={cn(
              'flex-1 flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 relative z-10',
              botMode === 'auto'
                ? 'text-white drop-shadow-lg'
                : 'text-slate-400 hover:text-slate-300'
            )}
          >
            <Bot className="w-5 h-5" />
            <span>Auto</span>
          </motion.button>

          {/* Manual Mode Button */}
          <motion.button
            whileHover={!isRunning ? { y: -2 } : {}}
            whileTap={!isRunning ? { y: 0 } : {}}
            onClick={() => !isRunning && onBotModeChange('manual')}
            disabled={isRunning}
            className={cn(
              'flex-1 flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 relative z-10',
              botMode === 'manual'
                ? 'text-white drop-shadow-lg'
                : 'text-slate-400 hover:text-slate-300'
            )}
          >
            <Gamepad2 className="w-5 h-5" />
            <span>Manual</span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}
