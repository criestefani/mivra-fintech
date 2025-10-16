// ScannerFilters Component - Filter controls for market scanner
// Allows users to filter assets by timeframe, strategy, win rate, and signal count

import React from 'react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import type { ScannerFilters as Filters } from '../types/scanner.types'
import { X } from 'lucide-react'

interface ScannerFiltersProps {
  filters: Filters
  onFiltersChange: (filters: Filters) => void
}

export const ScannerFilters: React.FC<ScannerFiltersProps> = ({
  filters,
  onFiltersChange
}) => {
  const handleTimeframeChange = (timeframe: number | undefined) => {
    onFiltersChange({ ...filters, timeframe })
  }


  const handleMinWinRateChange = (value: string) => {
    const minWinRate = value ? parseFloat(value) : undefined
    onFiltersChange({ ...filters, minWinRate })
  }

  const handleMinSignalsChange = (value: string) => {
    const minSignals = value ? parseInt(value) : undefined
    onFiltersChange({ ...filters, minSignals })
  }

  const handleClearFilters = () => {
    onFiltersChange({})
  }

  const hasActiveFilters = Object.keys(filters).some(
    (key) => filters[key as keyof Filters] !== undefined
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Filters</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="gap-1 h-8 text-xs"
          >
            <X className="w-3 h-3" />
            Clear All
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Timeframe Filter */}
        <div className="space-y-2">
          <Label className="text-xs">Timeframe</Label>
          <div className="flex flex-wrap gap-2">
            {[5, 15, 60].map((tf) => (
              <Button
                key={tf}
                variant={filters.timeframe === tf ? 'default' : 'outline'}
                size="sm"
                onClick={() =>
                  handleTimeframeChange(filters.timeframe === tf ? undefined : tf)
                }
                className="h-8 text-xs"
              >
                {tf < 60 ? `M${tf}` : 'H1'}
              </Button>
            ))}
          </div>
        </div>

        {/* Min Win Rate Filter */}
        <div className="space-y-2">
          <Label htmlFor="min-winrate" className="text-xs">
            Min Win Rate (%)
          </Label>
          <Input
            id="min-winrate"
            type="number"
            min="0"
            max="100"
            step="5"
            value={filters.minWinRate ?? ''}
            onChange={(e) => handleMinWinRateChange(e.target.value)}
            placeholder="e.g., 50"
            className="h-8 text-xs"
          />
        </div>

        {/* Min Signals Filter */}
        <div className="space-y-2">
          <Label htmlFor="min-signals" className="text-xs">
            Min Signals
          </Label>
          <Input
            id="min-signals"
            type="number"
            min="0"
            step="1"
            value={filters.minSignals ?? ''}
            onChange={(e) => handleMinSignalsChange(e.target.value)}
            placeholder="e.g., 10"
            className="h-8 text-xs"
          />
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
          {filters.timeframe && (
            <div className="px-2 py-1 bg-primary/10 text-primary rounded text-xs flex items-center gap-1">
              Timeframe: {filters.timeframe < 60 ? `M${filters.timeframe}` : 'H1'}
              <button
                onClick={() => handleTimeframeChange(undefined)}
                className="hover:bg-primary/20 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          {filters.minWinRate !== undefined && (
            <div className="px-2 py-1 bg-primary/10 text-primary rounded text-xs flex items-center gap-1">
              Win Rate ≥ {filters.minWinRate}%
              <button
                onClick={() => handleMinWinRateChange('')}
                className="hover:bg-primary/20 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          {filters.minSignals !== undefined && (
            <div className="px-2 py-1 bg-primary/10 text-primary rounded text-xs flex items-center gap-1">
              Signals ≥ {filters.minSignals}
              <button
                onClick={() => handleMinSignalsChange('')}
                className="hover:bg-primary/20 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
