import { useEffect, useState } from 'react'
import { candlesAPI } from '@/shared/services/api/client'

export interface Candle {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

interface UseBackendCandlesResult {
  candles: Candle[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export const useBackendCandles = (
  asset: string,
  timeframe: number,
  limit: number = 100
): UseBackendCandlesResult => {
  const [candles, setCandles] = useState<Candle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCandles = async () => {
    if (!asset) return

    try {
      setIsLoading(true)
      setError(null)

      console.log(`[useBackendCandles] Fetching candles: ${asset}, ${timeframe}s`)

      const response = await candlesAPI.getCandles(asset, timeframe, limit)

      if (response.data && Array.isArray(response.data.candles)) {
        setCandles(response.data.candles)
        console.log(`[useBackendCandles] ✅ Loaded ${response.data.candles.length} candles`)
      } else {
        throw new Error('Invalid candles data format')
      }
    } catch (err: any) {
      console.error('[useBackendCandles] Error fetching candles:', err)
      setError(err.message || 'Failed to fetch candles')
      setCandles([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCandles()
  }, [asset, timeframe, limit])

  return {
    candles,
    isLoading,
    error,
    refetch: fetchCandles,
  }
}
