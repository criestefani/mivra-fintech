// HeatmapGrid Component - Responsive grid layout for scanner assets
// Displays top 20 asset combinations sorted by performance

import React, { useMemo } from 'react';
import { AssetCard } from './AssetCard';
import type { ScannerAsset } from './types/scanner.types';

interface HeatmapGridProps {
  assets: ScannerAsset[];
  onAssetClick: (asset: ScannerAsset) => void;
}

export const HeatmapGrid: React.FC<HeatmapGridProps> = ({
  assets,
  onAssetClick,
}) => {
  // Sort by win rate descending (backend already filters >= 15 signals)
  const sortedAssets = useMemo(() => {
    return [...assets].sort((a, b) => (b.win_rate ?? 0) - (a.win_rate ?? 0));
  }, [assets]);

  const handleAssetClick = (asset: ScannerAsset) => {
    onAssetClick(asset);
  };

  // Show empty state
  if (sortedAssets.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="text-muted-foreground text-lg mb-2">No assets found</div>
        <div className="text-sm text-muted-foreground/60">
          Waiting for scanner data...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 animate-fade-in">
      {sortedAssets.map((asset) => (
        <AssetCard
          key={`${asset.active_id}_${asset.timeframe}`}
          asset={asset}
          onClick={() => handleAssetClick(asset)}
        />
      ))}
    </div>
  );
};
