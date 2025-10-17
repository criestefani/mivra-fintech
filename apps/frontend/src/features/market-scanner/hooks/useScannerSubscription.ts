import { useState, useEffect, useCallback, useRef } from 'react'
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

  // ✅ Debounce timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch scanner data from API
const fetchAssets = useCallback(async () => {
  try {
    console.log('[useScannerSubscription] Fetching scanner data...')

    const { data, error } = await supabase
      .from('scanner_performance')
      .select(
        'active_id, ativo_nome, timeframe, win_rate, total_signals, total_wins, total_losses, last_updated'
      )
      .gte('total_signals', 15)              // ✅ FILTRAR PRIMEIRO (>=15 sinais)
      .order('win_rate', { ascending: false }) // ✅ ORDENAR POR WIN_RATE
      .limit(20)                              // ✅ PEGAR OS TOP 20

    if (error) {
      throw error
    }

    const scannerAssets: ScannerAsset[] = (data ?? []).map((asset) => ({
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


  // ✅ Debounced fetch (waits 2 seconds of silence before fetching)
  const debouncedFetchAssets = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      console.log('[useScannerSubscription] Debounced fetch triggered')
      fetchAssets()
    }, 2000) // Wait 2 seconds of silence
  }, [fetchAssets])

  // Refresh handler (can be called manually)
  const refresh = useCallback(async () => {
    await fetchAssets()
  }, [fetchAssets])

  // ✅ Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

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

          // ✅ Use debounced fetch instead of immediate fetch
          // This prevents 150+ fetches when aggregator updates
          debouncedFetchAssets()
        }
      )
      .subscribe((status) => {
        console.log('[useScannerSubscription] Subscription status:', status)
      })

    return () => {
      console.log('[useScannerSubscription] Cleaning up real-time subscription')
      supabase.removeChannel(channel)
    }
  }, [debouncedFetchAssets])

  return {
    assets,
    loading,
    error,
    lastUpdate,
    refresh
  }
}
