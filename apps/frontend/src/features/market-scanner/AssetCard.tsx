// AssetCard Component - Individual asset performance cell in heatmap
// Displays asset performance with color-coded heatmap based on win rate

import React from 'react';
import { Card } from '@/shared/components/ui/card';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import type { ScannerAsset } from './types/scanner.types';

interface AssetCardProps {
  asset: ScannerAsset;
  onClick: () => void;
}

// Memoize for performance optimization
export const AssetCard = React.memo<AssetCardProps>(({ asset, onClick }) => {
  // Calculate heatmap color based on win_rate
  const getHeatmapColor = (winRate: number | null): string => {
    if (winRate === null || winRate === 0) {
      return 'bg-muted/10 border-muted/50';
    }

    if (winRate >= 80) return 'bg-positive/20 border-positive hover:bg-positive/25';
    if (winRate >= 65) return 'bg-positive/10 border-positive/70 hover:bg-positive/20';
    if (winRate >= 50) return 'bg-warning/10 border-warning/70 hover:bg-warning/20';
    if (winRate >= 35) return 'bg-primary/10 border-primary/70 hover:bg-primary/20';
    return 'bg-negative/10 border-negative/70 hover:bg-negative/20';
  };

  const winRate = asset.win_rate ?? 0;
  const totalSignals = asset.total_signals ?? 0;
  const totalWins = asset.total_wins ?? 0;
  const totalLosses = asset.total_losses ?? 0;
  const isProfitable = winRate >= 50;

  // Format timeframe using known scanner values from Supabase view
  const timeframeLabels: Record<number, string> = {
    10: '10s',
    30: '30s',
    60: '1m',
    300: '5m'
  };

  const formatTimeframe = (tf?: number | null): string => {
    if (!tf) return 'N/A';
    return timeframeLabels[tf] ?? `${tf}s`;
  };

  return (
    <Card
      className={`px-4 py-3 cursor-pointer hover:bg-slate-800/50 transition-all duration-200 ${getHeatmapColor(winRate)} border-l-4 border-r border-y shadow-sm active:opacity-80 flex items-center justify-between gap-4`}
      onClick={onClick}
    >
      {/* Left: Asset name and timeframe */}
      <div className="flex flex-col min-w-0 flex-1">
        <div className="font-bold text-sm md:text-base truncate" title={asset.ativo_nome}>
          {asset.ativo_nome}
        </div>
        <div className="text-xs text-muted-foreground font-semibold">
          {formatTimeframe(asset.timeframe)}
        </div>
      </div>

      {/* Middle: Win rate with icon */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {isProfitable ? (
          <TrendingUp className="w-4 h-4 text-positive" />
        ) : (
          <TrendingDown className="w-4 h-4 text-negative" />
        )}
        <span className={`text-base md:text-lg font-bold font-mono min-w-fit ${
          isProfitable ? 'text-positive' : 'text-negative'
        }`}>
          {winRate.toFixed(1)}%
        </span>
      </div>

      {/* Center-Right: Win/Loss record */}
      <div className="flex items-center gap-2 text-xs flex-shrink-0">
        <Activity className="w-3 h-3 text-muted-foreground" />
        <span className="text-muted-foreground font-mono whitespace-nowrap">
          {totalWins}W / {totalLosses}L
        </span>
      </div>

      {/* Right: Total signals */}
      <div className="text-xs text-muted-foreground flex-shrink-0 whitespace-nowrap hidden sm:block">
        {totalSignals} {totalSignals === 1 ? 'signal' : 'signals'}
      </div>

      {/* Far right: Last update indicator (optional, subtle) */}
      {asset.last_updated && (
        <div className="text-[10px] text-muted-foreground/60 flex-shrink-0 whitespace-nowrap hidden lg:block">
          {new Date(asset.last_updated).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      )}
    </Card>
  );
});

AssetCard.displayName = 'AssetCard';
