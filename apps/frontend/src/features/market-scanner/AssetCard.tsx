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
      className={`p-3 md:p-4 cursor-pointer hover:scale-105 transition-all duration-200 ${getHeatmapColor(winRate)} border-2 shadow-md active:scale-95`}
      onClick={onClick}
    >
      <div className="space-y-2">
        {/* Asset name */}
        <div className="font-bold text-base md:text-lg truncate" title={asset.ativo_nome}>
          {asset.ativo_nome}
        </div>

        {/* Timeframe */}
        <div className="text-xs text-muted-foreground">
          <span className="font-semibold">{formatTimeframe(asset.timeframe)}</span>
        </div>

        {/* Win rate with icon */}
        <div className="flex items-center gap-2">
          {isProfitable ? (
            <TrendingUp className="w-4 h-4 text-positive" />
          ) : (
            <TrendingDown className="w-4 h-4 text-negative" />
          )}
          <span className={`text-lg md:text-xl font-bold font-mono ${
            isProfitable ? 'text-positive' : 'text-negative'
          }`}>
            {winRate.toFixed(1)}%
          </span>
        </div>

        {/* Win/Loss record */}
        <div className="flex items-center gap-2 text-xs">
          <Activity className="w-3 h-3 text-muted-foreground" />
          <span className="text-muted-foreground font-mono">
            {totalWins}W / {totalLosses}L
          </span>
        </div>

        {/* Total signals */}
        <div className="text-xs text-muted-foreground">
          {totalSignals} {totalSignals === 1 ? 'signal' : 'signals'}
        </div>

        {/* Last update indicator (optional, subtle) */}
        {asset.last_updated && (
          <div className="text-[10px] text-muted-foreground/60">
            {new Date(asset.last_updated).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        )}
      </div>
    </Card>
  );
});

AssetCard.displayName = 'AssetCard';
