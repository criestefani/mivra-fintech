/**
 * MetricsGrid Component
 * Grid of gamified metric cards (Win Rate, Profit, Trades)
 * With glow effects and animations
 */

import { motion } from 'framer-motion';
import { GlassCard } from '../ui/gamification/GlassCard';

interface Metric {
  icon: string;
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  glow?: boolean;
}

interface MetricsGridProps {
  winRate: number;
  profit: number;
  totalTrades: number;
  className?: string;
}

export function MetricsGrid({
  winRate,
  profit,
  totalTrades,
  className = ''
}: MetricsGridProps) {
  const metrics: Metric[] = [
    {
      icon: '🎯',
      label: 'Win Rate',
      value: `${winRate.toFixed(1)}%`,
      subtitle: totalTrades > 0 ? `${Math.floor(totalTrades * (winRate / 100))} wins` : 'Sem trades',
      trend: winRate >= 60 ? 'up' : winRate >= 50 ? 'neutral' : 'down',
      glow: winRate >= 60,
    },
    {
      icon: '💰',
      label: 'Lucro',
      value: `R$ ${profit.toFixed(2)}`,
      subtitle: profit >= 0 ? 'No verde!' : 'Recuperando',
      trend: profit > 0 ? 'up' : profit < 0 ? 'down' : 'neutral',
      glow: profit > 0,
    },
    {
      icon: '📊',
      label: 'Trades',
      value: totalTrades,
      subtitle: 'Executados hoje',
      trend: 'neutral',
      glow: false,
    },
  ];

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
      {metrics.map((metric, index) => (
        <MetricCard key={metric.label} metric={metric} index={index} />
      ))}
    </div>
  );
}

interface MetricCardProps {
  metric: Metric;
  index: number;
}

function MetricCard({ metric, index }: MetricCardProps) {
  const trendColors = {
    up: 'text-positive',
    down: 'text-negative',
    neutral: 'text-gray-400',
  };

  const glowColors = {
    up: 'shadow-[0_0_30px_rgba(16,185,129,0.5)]',
    down: 'shadow-[0_0_30px_rgba(235,47,47,0.5)]',
    neutral: '',
  };

  const variant = metric.trend === 'up' ? 'green' : metric.trend === 'down' ? 'red' : 'default';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <GlassCard
        variant={variant as any}
        blurIntensity="md"
        withGlow={metric.glow}
        className="p-6 hover:scale-105 transition-transform"
      >
        {/* Icon with pulse animation if has glow */}
        <motion.div
          animate={
            metric.glow
              ? {
                  scale: [1, 1.2, 1],
                }
              : {}
          }
          transition={{ duration: 2, repeat: Infinity }}
          className="text-5xl mb-3"
        >
          {metric.icon}
        </motion.div>

        {/* Label */}
        <div className="text-sm text-gray-400 mb-2 uppercase tracking-wide">
          {metric.label}
        </div>

        {/* Value */}
        <motion.div
          animate={
            metric.glow
              ? {
                  textShadow: [
                    '0 0 10px rgba(16, 185, 129, 0.5)',
                    '0 0 20px rgba(16, 185, 129, 0.8)',
                    '0 0 10px rgba(16, 185, 129, 0.5)',
                  ],
                }
              : {}
          }
          transition={{ duration: 1.5, repeat: Infinity }}
          className={`text-4xl font-bold ${trendColors[metric.trend!]} font-heading mb-2 ${
            metric.glow ? glowColors[metric.trend!] : ''
          }`}
        >
          {metric.value}
        </motion.div>

        {/* Subtitle */}
        {metric.subtitle && (
          <div className="text-xs text-gray-400">{metric.subtitle}</div>
        )}

        {/* Trend indicator */}
        {metric.trend !== 'neutral' && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`mt-3 flex items-center gap-1 text-sm ${trendColors[metric.trend]}`}
          >
            <span>{metric.trend === 'up' ? '↗' : '↘'}</span>
            <span className="font-medium">
              {metric.trend === 'up' ? 'Subindo' : 'Descendo'}
            </span>
          </motion.div>
        )}
      </GlassCard>
    </motion.div>
  );
}
