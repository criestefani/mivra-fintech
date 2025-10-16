import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
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

      const { data, error } = await supabase
        .from('scanner_performance')
        .select(
          'active_id, ativo_nome, timeframe, win_rate, total_signals, total_wins, total_losses, last_updated'
        )
        .order('win_rate', { ascending: false })
        .limit(100)

      if (error) {
        throw error
      }

      const filtered = (data ?? [])
        .filter((asset) => (asset.total_signals ?? 0) >= 15)
        .slice(0, 20)

      const scannerAssets: ScannerAsset[] = filtered.map((asset) => ({
        active_id: asset.active_id,
        ativo_nome: asset.ativo_nome,
        timeframe: asset.timeframe,
        win_rate: asset.win_rate,
        total_signals: asset.total_signals,
        total_wins: asset.total_wins,
        total_losses: asset.total_losses,
        last_updated: asset.last_updated,
      }))

      setAssets(scannerAssets)
      setLastUpdate(new Date())
      setError(null)
      console.log(`[useScannerSubscription] Loaded ${scannerAssets.length} assets (>=15 signals)`)
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
