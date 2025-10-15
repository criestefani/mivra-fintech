// Market Scanner Type Definitions
// Defines the data structures for scanner assets, configs, and filters

export interface ScannerAsset {
  active_id: string
  ativo_nome: string
  timeframe: number
  strategy_id: number
  strategy_name: string
  win_rate: number | null
  total_signals: number | null
  total_wins: number | null
  total_losses: number | null
  last_updated?: string
}

export interface ScannerConfig {
  asset: string
  assetId: string
  strategy: string
  strategyId: number
  timeframe: number
}

export interface ScannerFilters {
  timeframe?: number
  strategy?: string
  minWinRate?: number
  minSignals?: number
}
