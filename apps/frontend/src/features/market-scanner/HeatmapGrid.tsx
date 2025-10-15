// HeatmapGrid Component - Responsive grid layout for scanner assets
// Applies filters and displays assets in a responsive grid

import React, { useMemo } from 'react';
import { AssetCard } from './AssetCard';
import type { ScannerAsset, ScannerFilters, ScannerConfig } from '../types/scanner.types';

interface HeatmapGridProps {
  assets: ScannerAsset[];
  filters?: ScannerFilters;
  onAssetClick: (config: ScannerConfig) => void;
}

export const HeatmapGrid: React.FC<HeatmapGridProps> = ({
  assets,
  filters,
  onAssetClick,
}) => {
  // Apply filters and sort
  const filteredAssets = useMemo(() => {
    let filtered = [...assets];

    if (filters?.timeframe) {
      filtered = filtered.filter((a) => a.timeframe === filters.timeframe);
    }

    if (filters?.strategy) {
      filtered = filtered.filter((a) =>
        a.strategy_name.toLowerCase().includes(filters.strategy!.toLowerCase())
      );
    }

    if (filters?.minWinRate !== undefined) {
      filtered = filtered.filter((a) => (a.win_rate ?? 0) >= filters.minWinRate!);
    }

    if (filters?.minSignals !== undefined) {
      filtered = filtered.filter((a) => (a.total_signals ?? 0) >= filters.minSignals!);
    }

    // Sort by win rate descending
    return filtered.sort((a, b) => (b.win_rate ?? 0) - (a.win_rate ?? 0));
  }, [assets, filters]);

  const handleAssetClick = (asset: ScannerAsset) => {
    onAssetClick({
      asset: asset.ativo_nome,
      assetId: asset.active_id,
      strategy: asset.strategy_name,
      strategyId: asset.strategy_id,
      timeframe: asset.timeframe,
    });
  };

  // Show empty state
  if (filteredAssets.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="text-muted-foreground text-lg mb-2">No assets found</div>
        <div className="text-sm text-muted-foreground/60">
          {assets.length === 0
            ? 'Waiting for scanner data...'
            : 'Try adjusting your filters'
          }
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 animate-fade-in">
      {filteredAssets.map((asset) => (
        <AssetCard
          key={`${asset.active_id}_${asset.strategy_id}_${asset.timeframe}`}
          asset={asset}
          onClick={() => handleAssetClick(asset)}
        />
      ))}
    </div>
  );
};
