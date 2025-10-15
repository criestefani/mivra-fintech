import { useState, useEffect, useCallback } from 'react'
import { scannerAPI } from '@/shared/services/api/client'
import { supabase } from '@/shared/services/supabase/client'
import type { ScannerAsset } from '../types/scanner.types'

interface UseScannerSubscriptionResult {
  assets: ScannerAsset[]
  loading: boolean
  error: string | null
  lastUpdate: Date | null
  refresh: () => Promise<void>
}

export const useScannerSubscription = (): UseScannerSubscriptionResult => {
  const [assets, setAssets] = useState<ScannerAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Fetch scanner data from API
  const fetchAssets = useCallback(async () => {
    try {
      console.log('[useScannerSubscription] Fetching scanner data...')
      const response = await scannerAPI.getTop20()

      if (response.data?.success && response.data?.data) {
        const scannerAssets: ScannerAsset[] = response.data.data.map((asset: any) => ({
          active_id: asset.active_id,
          ativo_nome: asset.ativo_nome,
          timeframe: asset.timeframe,
          strategy_id: asset.strategy_id,
          strategy_name: asset.strategy_name,
          win_rate: asset.win_rate,
          total_signals: asset.total_signals,
          total_wins: asset.total_wins,
          total_losses: asset.total_losses,
          last_updated: asset.last_updated
        }))

        setAssets(scannerAssets)
        setLastUpdate(new Date())
        setError(null)
        console.log(`[useScannerSubscription] Loaded ${scannerAssets.length} assets`)
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err: any) {
      console.error('[useScannerSubscription] Error fetching scanner data:', err)
      setError(err.message || 'Failed to load scanner data')
    } finally {
      setLoading(false)
    }
  }, [])

  // Refresh handler (can be called manually)
  const refresh = useCallback(async () => {
    await fetchAssets()
  }, [fetchAssets])

  // Initial load
  useEffect(() => {
    fetchAssets()
  }, [fetchAssets])

  // Set up real-time subscription for scanner_performance table
  useEffect(() => {
    console.log('[useScannerSubscription] Setting up real-time subscription...')

    const channel = supabase
      .channel('scanner-realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'scanner_performance'
        },
        (payload) => {
          console.log('[useScannerSubscription] Real-time update received:', payload)

          // Refresh data when scanner performance is updated
          fetchAssets()
        }
      )
      .subscribe((status) => {
        console.log('[useScannerSubscription] Subscription status:', status)
      })

    return () => {
      console.log('[useScannerSubscription] Cleaning up real-time subscription')
      supabase.removeChannel(channel)
    }
  }, [fetchAssets])

  return {
    assets,
    loading,
    error,
    lastUpdate,
    refresh
  }
}
