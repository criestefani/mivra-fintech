// Shared constants for bot runtime
// Mirrors the expected structure from the former @mivratec/shared package

export const STRATEGIES = [
  {
    id: 'conservative',
    name: 'Conservative',
    description: 'Lower risk, higher win rate'
  },
  {
    id: 'balanced',
    name: 'Balanced',
    description: 'Balanced risk / reward profile'
  },
  {
    id: 'aggressive',
    name: 'Aggressive',
    description: 'Higher risk, higher reward'
  },
  {
    id: 'support_resistance',
    name: 'Support/Resistance',
    description: 'Breakout strategy using support / resistance zones'
  }
]

export const TIMEFRAMES = [
  { value: 5, label: '5s' },
  { value: 10, label: '10s' },
  { value: 30, label: '30s' },
  { value: 60, label: '1m' },
  { value: 120, label: '2m' },
  { value: 300, label: '5m' }
]
