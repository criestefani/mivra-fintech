// TradingChart Component - Real-time candlestick chart for manual mode
// Displays live price action with trade markers

import React, { useEffect, useRef, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card'
import { Label } from '@/shared/components/ui/label'
import { Badge } from '@/shared/components/ui/badge'
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time } from 'lightweight-charts'
import { useRealtimeCandles } from '@/shared/hooks/useRealtimeCandles'
import { Loader2, TrendingUp, Wifi, WifiOff } from 'lucide-react'
import axios from 'axios'
import { GlassCard } from '@/components/ui/gamification'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001'

interface TradeMarker {
  time: number
  direction: 'CALL' | 'PUT'
  result?: 'WIN' | 'LOSS'
  pnl?: number
}

interface TradingChartProps {
  category: string
  asset: string
  timeframe: string
  onCategoryChange: (category: string) => void
  onAssetChange: (asset: string) => void
  onTimeframeChange: (timeframe: string) => void
  tradeMarkers: TradeMarker[]
  currentStatus: string | null
}

const categories = [
  { id: 'forex', name: 'Forex' },
  { id: 'crypto', name: 'Crypto' },
  { id: 'stocks', name: 'Stocks' },
  { id: 'indices', name: 'Indices' },
  { id: 'commodities', name: 'Commodities' },
  { id: 'pairs', name: 'Pairs' }
]

const timeframes = [
  { value: '10', label: '10s' },
  { value: '30', label: '30s' },
  { value: '60', label: '1m' },
  { value: '300', label: '5m' }
]

export const TradingChart: React.FC<TradingChartProps> = ({
  category,
  asset,
  timeframe,
  onCategoryChange,
  onAssetChange,
  onTimeframeChange,
  currentStatus
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const [assetsByCategory, setAssetsByCategory] = useState<Record<string, Array<{ key: string; name: string }>>>({
    forex: [],
    crypto: [],
    stocks: [],
    indices: [],
    commodities: [],
    pairs: []
  })
  const [loadingAssets, setLoadingAssets] = useState(true)

  // Use WebSocket hook for real-time candles
  const {
    candles,
    isLoading: candlesLoading,
    isConnected,
    error: candlesError
  } = useRealtimeCandles({
    asset,
    timeframe: parseInt(timeframe),
    strategy: 'hybrid',
    autoConnect: true
  })

  // Fetch all assets from backend (141 assets)
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/assets`)

        if (response.data?.success && response.data?.assets) {
          // Store both key (for WebSocket) and name (for display)
          const assetsMap: Record<string, Array<{ key: string; name: string }>> = {}

          Object.entries(response.data.assets).forEach(([categoryKey, assets]: [string, any]) => {
            const categoryId = categoryKey.toLowerCase()
            assetsMap[categoryId] = (assets as any[]).map((a: any) => ({
              key: a.key,   // ← For WebSocket (e.g., "EURUSD-OTC", "INDU")
              name: a.name  // ← For display (e.g., "EUR/USD OTC", "Dow Jones")
            }))
          })

          setAssetsByCategory(assetsMap)
          console.log(`[TradingChart] Loaded ${response.data.total} assets from backend`)
        }
      } catch (err) {
        console.error('[TradingChart] Error loading assets:', err)
      } finally {
        setLoadingAssets(false)
      }
    }

    fetchAssets()
  }, [])

  // Initialize chart once
  useEffect(() => {
    if (!chartContainerRef.current || chartRef.current) return

    console.log('[TradingChart] Initializing chart...')

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: {
        background: { color: 'transparent' },
        textColor: '#888888'
      },
      grid: {
        vertLines: { color: 'rgba(42, 46, 57, 0.3)' },
        horzLines: { color: 'rgba(42, 46, 57, 0.3)' }
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false
      }
    })

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#10B981',
      downColor: '#EF4444',
      borderUpColor: '#10B981',
      borderDownColor: '#EF4444',
      wickUpColor: '#10B981',
      wickDownColor: '#EF4444'
    })

    chartRef.current = chart
    candleSeriesRef.current = candleSeries

    // Cleanup on unmount
    return () => {
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
        candleSeriesRef.current = null
      }
    }
  }, [])

  // Update chart with real-time candles
  useEffect(() => {
    if (!candleSeriesRef.current || candles.length === 0) return

    console.log(`[TradingChart] Updating chart with ${candles.length} candles`)

    const formattedCandles: CandlestickData[] = candles.map((c) => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close
    }))

    candleSeriesRef.current.setData(formattedCandles)
  }, [candles])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth
        })
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleCategoryChange = (newCategory: string) => {
    onCategoryChange(newCategory)
    // Set first asset key of new category
    const firstAsset = assetsByCategory[newCategory]?.[0]?.key || ''
    onAssetChange(firstAsset)
  }

  return (
    <GlassCard className="border-electric-blue/30 shadow-[0_0_20px_rgba(0,150,255,0.15)]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg md:text-xl flex items-center gap-2 text-electric-blue">
            <TrendingUp className="w-5 h-5" />
            Manual Trading Chart
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* WebSocket connection status */}
            <Badge variant={isConnected ? 'default' : 'secondary'} className={`gap-1.5 ${isConnected ? 'bg-profit-green text-white' : 'bg-loss-red text-white'}`}>
              {isConnected ? (
                <>
                  <Wifi className="w-3 h-3" />
                  Live
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3" />
                  Disconnected
                </>
              )}
            </Badge>
            {currentStatus && (
              <Badge variant="outline" className="gap-2 bg-golden-amber/10 text-golden-amber border-golden-amber/40">
                <div className="w-2 h-2 bg-golden-amber rounded-full animate-pulse" />
                {currentStatus}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Category Selection */}
          <div className="space-y-2">
            <Label htmlFor="category-select" className="text-xs">
              Category
            </Label>
            <select
              id="category-select"
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full h-9 px-3 rounded-md border border-border bg-card text-foreground text-sm"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Asset Selection */}
          <div className="space-y-2">
            <Label htmlFor="asset-select" className="text-xs">
              Asset {!loadingAssets && assetsByCategory[category] && (
                <span className="text-muted-foreground">({assetsByCategory[category].length} available)</span>
              )}
            </Label>
            <select
              id="asset-select"
              value={asset}
              onChange={(e) => onAssetChange(e.target.value)}
              disabled={loadingAssets}
              className="w-full h-9 px-3 rounded-md border border-border bg-card text-foreground text-sm disabled:opacity-50"
            >
              {loadingAssets ? (
                <option>Loading assets...</option>
              ) : (
                assetsByCategory[category]?.map((assetOption) => (
                  <option key={assetOption.key} value={assetOption.key}>
                    {assetOption.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Timeframe Selection */}
          <div className="space-y-2">
            <Label htmlFor="timeframe-select" className="text-xs">
              Timeframe
            </Label>
            <select
              id="timeframe-select"
              value={timeframe}
              onChange={(e) => onTimeframeChange(e.target.value)}
              className="w-full h-9 px-3 rounded-md border border-border bg-card text-foreground text-sm"
            >
              {timeframes.map((tf) => (
                <option key={tf.value} value={tf.value}>
                  {tf.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Chart */}
        <div className="relative">
          {candlesLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 rounded-lg">
              <div className="text-center space-y-2">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">Loading real-time data...</p>
              </div>
            </div>
          )}

          {candlesError && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 rounded-lg">
              <div className="text-center space-y-2">
                <p className="text-sm text-destructive">{candlesError}</p>
                <p className="text-xs text-muted-foreground">Check WebSocket connection</p>
              </div>
            </div>
          )}

          <div ref={chartContainerRef} className="w-full h-[400px] rounded-lg overflow-hidden" />
        </div>
      </CardContent>
    </Card>
  )
}
