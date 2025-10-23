// TradingChart Component - Real-time candlestick chart for manual mode
// Displays live price action with trade markers

import React, { useEffect, useRef, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card'
import { Label } from '@/shared/components/ui/label'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time, SeriesMarker } from 'lightweight-charts'
import { useRealtimeCandles } from '@/shared/hooks/useRealtimeCandles'
import { Loader2, TrendingUp, Wifi, WifiOff, ChevronDown } from 'lucide-react'
import axios from 'axios'
import { GlassCard } from '@/components/ui/gamification'
import { CHART_COLORS } from '@/utils/chartColors'
import { cn } from '@/shared/utils/cn'
import { getApiUrl } from '@/shared/utils/getApiUrl'
import { LiveTradeFeed, Trade } from '@/components/trading'

const API_URL = getApiUrl()

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
  currentAsset?: string
  isRunning?: boolean
  currentPnL?: number
  trades?: Trade[]
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
  currentStatus,
  currentAsset,
  isRunning,
  currentPnL,
  trades
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
  const [assetMenuOpen, setAssetMenuOpen] = useState(false)
  const [selectedCategoryInMenu, setSelectedCategoryInMenu] = useState<string | null>(null)
  const [timeframeMenuOpen, setTimeframeMenuOpen] = useState(false)
  const assetMenuRef = useRef<HTMLDivElement>(null)
  const timeframeMenuRef = useRef<HTMLDivElement>(null)

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

      // ✅ IMPORTANT: lightweight-charts requires markers to be sorted in ASCENDING order by time
      const sortedMarkers = [...tradeMarkers].sort((a, b) => a.time - b.time)

      sortedMarkers.forEach((trade) => {
        // ✅ Ensure time is in seconds (lightweight-charts requirement)
        // If time is still in milliseconds (> 1000000), divide by 1000
        const timeInSeconds = trade.time > 1000000
          ? Math.floor(trade.time / 1000)
          : trade.time

        console.log('[TradingChart] Trade marker:', {
          time: trade.time,
          timeInSeconds,
          direction: trade.direction,
          result: trade.result,
        })

        // Entry marker - direction indicator (CALL/PUT)
        markers.push({
          time: timeInSeconds as Time,
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
            time: timeInSeconds as Time,
            position: trade.result === 'WIN' ? 'aboveBar' : 'belowBar',
            color: trade.result === 'WIN' ? CHART_COLORS.POSITIVE : CHART_COLORS.NEGATIVE,
            shape: 'circle',
            text: trade.result === 'WIN' ? '✓ WIN' : '✗ LOSS',
            size: 1,
          })
        }
      })

      console.log(`[TradingChart] ✅ Setting ${markers.length} total markers (sorted ascending by time)`)
      candleSeriesRef.current.setMarkers(markers)
    } catch (error) {
      console.error('[TradingChart] ❌ Error setting markers:', error)
    }
  }, [tradeMarkers, candles.length])

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

  // Close menu when clicking outside (improved for mobile)
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (assetMenuRef.current && !assetMenuRef.current.contains(event.target as Node)) {
        setAssetMenuOpen(false)
        setTimeframeMenuOpen(false)
      }
    }

    if (assetMenuOpen || timeframeMenuOpen) {
      // Use both mousedown and touchstart for better mobile support
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('touchstart', handleClickOutside)
      }
    }
  }, [assetMenuOpen, timeframeMenuOpen])

  return (
    <GlassCard className="border-primary/30 shadow-[0_0_20px_rgba(255,140,26,0.15)]">
      {/* ✅ Status Bar - Same as AutoModeRunning */}
      <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full animate-pulse ${
            isRunning ? 'bg-positive shadow-[0_0_10px_rgba(16,185,129,0.6)]' : 'bg-slate-600'
          }`} />
          <p className="font-semibold text-sm text-white">
            {isRunning ? (currentStatus || 'Running') : 'Stopped'}
          </p>
        </div>

        {currentAsset && (
          <div className="text-right">
            <p className="font-semibold text-sm text-warning">{currentAsset}</p>
          </div>
        )}
      </div>

      <CardContent className="space-y-3 pt-6">
        {/* Controls Title */}
        <Label className="text-sm font-medium text-white">Choose the asset and timeframe</Label>

        {/* Controls - Horizontal Layout */}
        <div className="grid grid-cols-2 gap-3">
          {/* Asset Selection with Category Submenu */}
          <div className="relative" ref={assetMenuRef}>
            <button
              onClick={() => {
                if (!assetMenuOpen) {
                  setSelectedCategoryInMenu(null)
                }
                setAssetMenuOpen(!assetMenuOpen)
              }}
              disabled={loadingAssets}
              className={cn(
                'w-full h-8 px-3 rounded-lg border transition-all text-sm text-left font-medium',
                'bg-slate-900/50 border-slate-700/50 text-slate-200',
                'hover:border-primary/50 hover:bg-slate-900/70',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'flex items-center justify-between group'
              )}
            >
              <span className="truncate">
                {loadingAssets
                  ? 'Loading...'
                  : assetsByCategory[category]?.find((a) => a.key === asset)?.name?.split('/')[0] || 'Asset'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-1" />
            </button>

            {/* Dropdown Menu - Submenu Structure */}
            {assetMenuOpen && !loadingAssets && (
              <div className="fixed inset-0 z-40" onClick={() => setAssetMenuOpen(false)} />
            )}
            {assetMenuOpen && !loadingAssets && (
              <div ref={assetMenuRef} onClick={(e) => e.stopPropagation()} className="absolute top-full left-0 right-0 mt-1 bg-slate-950/95 border border-slate-700/50 rounded-lg shadow-xl z-50 max-h-96 backdrop-blur-sm overflow-y-auto flex flex-col">
                {selectedCategoryInMenu === null ? (
                  // Show Categories (Level 1)
                  <div className="overflow-y-auto flex-1 p-1">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedCategoryInMenu(cat.id)
                          handleCategoryChange(cat.id)
                        }}
                        className={cn(
                          'w-full text-left px-3 py-2 rounded-md text-sm transition-all font-medium',
                          'hover:bg-primary/20 hover:text-primary text-slate-200',
                          category === cat.id && 'bg-primary/20 text-primary'
                        )}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  // Show Assets (Level 2)
                  <div className="flex flex-col h-full">
                    <div className="sticky top-0 bg-slate-950/95 border-b border-slate-700/30 p-1 z-10 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedCategoryInMenu(null)
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-slate-800/50 rounded-md text-xs transition-colors flex items-center gap-2 text-primary font-semibold"
                      >
                        ← {categories.find((c) => c.id === selectedCategoryInMenu)?.name}
                      </button>
                    </div>
                    <div className="overflow-y-auto flex-1 p-1">
                      {assetsByCategory[selectedCategoryInMenu]?.map((assetOption) => (
                        <button
                          key={assetOption.key}
                          onClick={(e) => {
                            e.stopPropagation()
                            onAssetChange(assetOption.key)
                            setAssetMenuOpen(false)
                            setSelectedCategoryInMenu(null)
                          }}
                          className={cn(
                            'w-full text-left px-3 py-2 rounded-md text-sm transition-all font-medium',
                            asset === assetOption.key
                              ? 'bg-primary/30 text-primary border-l-2 border-primary'
                              : 'hover:bg-slate-800/50 text-slate-200'
                          )}
                        >
                          {assetOption.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Timeframe Selection - Custom Dropdown */}
          <div className="relative" ref={timeframeMenuRef}>
            <button
              onClick={() => setTimeframeMenuOpen(!timeframeMenuOpen)}
              className={cn(
                'w-full h-8 px-3 rounded-lg border transition-all text-sm text-left font-medium',
                'bg-slate-900/50 border-slate-700/50 text-slate-200',
                'hover:border-primary/50 hover:bg-slate-900/70',
                'flex items-center justify-between group'
              )}
            >
              <span>
                {timeframes.find((tf) => tf.value === timeframe)?.label || 'Timeframe'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-1" />
            </button>

            {/* Timeframe Dropdown Menu - Mobile Safe */}
            {timeframeMenuOpen && (
              <div className="fixed inset-0 z-40" onClick={() => setTimeframeMenuOpen(false)} />
            )}
            {timeframeMenuOpen && (
              <div onClick={(e) => e.stopPropagation()} className="absolute top-full left-0 right-0 mt-1 bg-slate-950/95 border border-slate-700/50 rounded-lg shadow-xl z-50 max-h-96 backdrop-blur-sm overflow-hidden flex flex-col">
                <div className="overflow-y-auto flex-1 p-1">
                  {timeframes.map((tf) => (
                    <button
                      key={tf.value}
                      onClick={(e) => {
                        e.stopPropagation()
                        onTimeframeChange(tf.value)
                        setTimeframeMenuOpen(false)
                      }}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-md text-sm transition-all font-medium',
                        timeframe === tf.value
                          ? 'bg-primary/30 text-primary border-l-2 border-primary'
                          : 'hover:bg-slate-800/50 text-slate-200'
                      )}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chart */}
        <div className="relative">
          {/* Live Badge - Overlay inside chart */}
          <div className="absolute top-3 right-3 z-20">
            <Badge variant={isConnected ? 'default' : 'secondary'} className={`gap-1.5 backdrop-blur-sm bg-opacity-80 ${isConnected ? 'bg-positive text-white' : 'bg-negative text-white'}`}>
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
          </div>

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

          <div className="relative w-full h-[400px] rounded-lg overflow-hidden">
            <div ref={chartContainerRef} className="w-full h-full" />

            {/* ✅ PnL Overlay - Top Left */}
            {currentPnL !== undefined && (
              <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-sm px-3 py-1 rounded-lg border border-slate-700/50 flex items-center h-7">
                <span className={`text-sm font-semibold ${currentPnL >= 0 ? 'text-positive' : 'text-negative'}`}>
                  {currentPnL >= 0 ? '+' : ''}R$ {currentPnL.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* ✅ Floating Button for Recent Trades */}
          {trades && trades.length > 0 && (
            <LiveTradeFeed trades={trades} maxTrades={8} />
          )}
        </div>
      </CardContent>
    </GlassCard>
  )
}
