// Market Scanner Type Definitions
// Defines the data structures for scanner assets, configs, and filters

export interface ScannerAsset {
  active_id: string
  ativo_nome: string
  timeframe: number
  win_rate: number | null
  total_signals: number | null
  total_wins: number | null
  total_losses: number | null
  last_updated?: string
}

export interface ScannerConfig {
  assetKey: string
  assetName: string
  assetId: string
  timeframe: number
  timeframeLabel?: string
}

export interface ScannerFilters {
  timeframe?: number
  minWinRate?: number
  minSignals?: number
}
