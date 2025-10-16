import { useEffect, useState, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

export interface Candle {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

interface UseRealtimeCandlesOptions {
  asset: string
  timeframe: number
  strategy?: string
  autoConnect?: boolean
}

interface UseRealtimeCandlesReturn {
  candles: Candle[]
  isLoading: boolean
  isConnected: boolean
  error: string | null
  subscribe: () => void
  unsubscribe: () => void
  refetch: () => void
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001'

export const useRealtimeCandles = ({
  asset,
  timeframe,
  strategy = 'hybrid',
  autoConnect = true
}: UseRealtimeCandlesOptions): UseRealtimeCandlesReturn => {
  const [candles, setCandles] = useState<Candle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const socketRef = useRef<Socket | null>(null)
  const subscribedRef = useRef(false)

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!autoConnect) return

    console.log('[useRealtimeCandles] Connecting to Socket.IO:', API_URL)

    const socket = io(API_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('[useRealtimeCandles] ✅ Connected to Socket.IO')
      setIsConnected(true)
      setError(null)
    })

    socket.on('disconnect', (reason) => {
      console.log('[useRealtimeCandles] ❌ Disconnected:', reason)
      setIsConnected(false)
      subscribedRef.current = false
    })

    socket.on('connect_error', (err) => {
      console.error('[useRealtimeCandles] ❌ Connection error:', err.message)
      setError(`Connection failed: ${err.message}`)
      setIsLoading(false)
    })

    // Listen for historical candles (initial load)
    socket.on('historical-candles', (historicalCandles: Candle[]) => {
      console.log(`[useRealtimeCandles] 📥 Received ${historicalCandles.length} historical candles`)
      setCandles(historicalCandles)
      setIsLoading(false)
      setError(null)
    })

    // Listen for real-time candle updates
    socket.on('candle-update', (candle: Candle) => {
      console.log('[useRealtimeCandles] 📊 Candle update:', candle)
      setCandles((prev) => {
        // Update if last candle has same time, otherwise append
        const lastCandle = prev[prev.length - 1]
        if (lastCandle && lastCandle.time === candle.time) {
          // Update existing candle
          return [...prev.slice(0, -1), candle]
        } else {
          // Append new candle
          return [...prev, candle]
        }
      })
    })

    // Listen for subscription confirmation
    socket.on('subscribed', ({ asset: subAsset, timeframe: subTf }) => {
      console.log(`[useRealtimeCandles] ✅ Subscribed to ${subAsset} ${subTf}s`)
      subscribedRef.current = true
    })

    // Listen for subscription errors
    socket.on('subscription-error', ({ message }) => {
      console.error('[useRealtimeCandles] ❌ Subscription error:', message)
      setError(message)
      setIsLoading(false)
      subscribedRef.current = false
    })

    // Cleanup on unmount
    return () => {
      console.log('[useRealtimeCandles] 🧹 Cleaning up Socket.IO')
      if (subscribedRef.current) {
        socket.emit('unsubscribe-candles')
      }
      socket.disconnect()
    }
  }, [autoConnect])

  // Subscribe to candles when asset/timeframe changes
  const subscribe = useCallback(() => {
    if (!socketRef.current || !socketRef.current.connected) {
      console.warn('[useRealtimeCandles] Socket not connected, cannot subscribe')
      setError('Not connected to server')
      return
    }

    if (!asset || !timeframe) {
      console.warn('[useRealtimeCandles] Asset or timeframe missing')
      return
    }

    console.log(`[useRealtimeCandles] 📡 Subscribing to ${asset} ${timeframe}s`)
    setIsLoading(true)
    setError(null)
    setCandles([])

    socketRef.current.emit('subscribe-candles', {
      asset,
      timeframe,
      strategy
    })
  }, [asset, timeframe, strategy])

  // Unsubscribe from current candles
  const unsubscribe = useCallback(() => {
    if (socketRef.current && subscribedRef.current) {
      console.log('[useRealtimeCandles] 🛑 Unsubscribing')
      socketRef.current.emit('unsubscribe-candles')
      subscribedRef.current = false
    }
  }, [])

  // Auto-subscribe when connected and params change
  useEffect(() => {
    if (isConnected && asset && timeframe) {
      // Unsubscribe from previous subscription
      if (subscribedRef.current) {
        unsubscribe()
      }

      // Small delay to ensure unsubscribe completes
      const timer = setTimeout(() => {
        subscribe()
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [isConnected, asset, timeframe, subscribe, unsubscribe])

  // Refetch = re-subscribe
  const refetch = useCallback(() => {
    unsubscribe()
    setTimeout(() => subscribe(), 200)
  }, [subscribe, unsubscribe])

  return {
    candles,
    isLoading,
    isConnected,
    error,
    subscribe,
    unsubscribe,
    refetch
  }
}
