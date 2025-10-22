// TradingChart Component - Real-time candlestick chart for manual mode
// Displays live price action with trade markers

import React, { useEffect, useRef, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card'
import { Label } from '@/shared/components/ui/label'
import { Badge } from '@/shared/components/ui/badge'
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time, SeriesMarker } from 'lightweight-charts'
import { useRealtimeCandles } from '@/shared/hooks/useRealtimeCandles'
import { Loader2, TrendingUp, Wifi, WifiOff } from 'lucide-react'
import axios from 'axios'
import { GlassCard } from '@/components/ui/gamification'
import { CHART_COLORS } from '@/utils/chartColors'

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
  tradeMarkers,
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
        background: { color: CHART_COLORS.BACKGROUND },
        textColor: CHART_COLORS.TEXT
      },
      grid: {
        vertLines: { color: CHART_COLORS.GRID_LINE },
        horzLines: { color: CHART_COLORS.GRID_LINE }
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false
      }
    })

    const candleSeries = chart.addCandlestickSeries({
      upColor: CHART_COLORS.CANDLE_UP,
      downColor: CHART_COLORS.CANDLE_DOWN,
      borderUpColor: CHART_COLORS.CANDLE_BORDER_UP,
      borderDownColor: CHART_COLORS.CANDLE_BORDER_DOWN,
      wickUpColor: CHART_COLORS.CANDLE_WICK_UP,
      wickDownColor: CHART_COLORS.CANDLE_WICK_DOWN
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

  // Update trade markers on chart (based on lightweight-charts official docs)
  useEffect(() => {
    if (!candleSeriesRef.current) return
    if (!tradeMarkers || tradeMarkers.length === 0) {
      console.log('[TradingChart] No markers, clearing chart markers')
      candleSeriesRef.current.setMarkers([])
      return
    }

    console.log(`[TradingChart] 📍 Adding ${tradeMarkers.length} markers to chart`)

    try {
      const markers: SeriesMarker<Time>[] = []

      tradeMarkers.forEach((trade) => {
        console.log('[TradingChart] Trade marker:', {
          time: trade.time,
          direction: trade.direction,
          result: trade.result,
        })

        // Entry marker - direction indicator (CALL/PUT)
        markers.push({
          time: trade.time as Time,
          position: trade.direction === 'CALL' ? 'belowBar' : 'aboveBar',
          color: trade.direction === 'CALL' ? CHART_COLORS.POSITIVE : CHART_COLORS.NEGATIVE,
          shape: trade.direction === 'CALL' ? 'arrowUp' : 'arrowDown',
          text: trade.direction === 'CALL'
            ? `▲ CALL${trade.pnl !== undefined ? ` (R$ ${trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)})` : ''}`
            : `▼ PUT${trade.pnl !== undefined ? ` (R$ ${trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)})` : ''}`,
          size: 2,
        })

        // Result marker - WIN/LOSS indicator (only if result exists)
        if (trade.result) {
          markers.push({
            time: trade.time as Time,
            position: trade.result === 'WIN' ? 'aboveBar' : 'belowBar',
            color: trade.result === 'WIN' ? CHART_COLORS.POSITIVE : CHART_COLORS.NEGATIVE,
            shape: 'circle',
            text: trade.result === 'WIN' ? '✓ WIN' : '✗ LOSS',
            size: 1,
          })
        }
      })

      console.log(`[TradingChart] ✅ Setting ${markers.length} total markers`)
      candleSeriesRef.current.setMarkers(markers)
    } catch (error) {
      console.error('[TradingChart] ❌ Error setting markers:', error)
    }
  }, [tradeMarkers])

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
    <GlassCard className="border-primary/30 shadow-[0_0_20px_rgba(255,140,26,0.15)]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg md:text-xl flex items-center gap-2 text-primary">
            <TrendingUp className="w-5 h-5" />
            Manual Trading Chart
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* WebSocket connection status */}
            <Badge variant={isConnected ? 'default' : 'secondary'} className={`gap-1.5 ${isConnected ? 'bg-positive text-white' : 'bg-negative text-white'}`}>
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
              <Badge variant="outline" className="gap-2 bg-warning/10 text-warning border-warning/40">
                <div className="w-2 h-2 bg-warning rounded-full animate-pulse" />
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
    </GlassCard>
  )
}
