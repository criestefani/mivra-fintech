// TradingChart Component - Real-time candlestick chart for manual mode
// Displays live price action with trade markers

import React, { useEffect, useRef, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Label } from '@/shared/components/ui/label'
import { Badge } from '@/shared/components/ui/badge'
import { createChart, IChartApi, ISeriesApi, CandlestickData } from 'lightweight-charts'
import { candlesAPI } from '@/shared/services/api/client'
import { Loader2, TrendingUp } from 'lucide-react'

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
  { id: 'commodities', name: 'Commodities' }
]

const assetsByCategory: Record<string, string[]> = {
  forex: ['EURUSD-OTC', 'GBPUSD-OTC', 'USDJPY-OTC', 'AUDUSD-OTC', 'USDCAD-OTC'],
  crypto: ['BTCUSD', 'ETHUSD', 'BNBUSD', 'ADAUSD', 'XRPUSD'],
  stocks: ['AAPL', 'TSLA', 'GOOGL', 'MSFT', 'AMZN'],
  indices: ['US500', 'US100', 'GER40', 'UK100', 'JPN225'],
  commodities: ['XAUUSD', 'XAGUSD', 'USOIL', 'UKOIL', 'NATGAS']
}

const timeframes = [
  { value: '5', label: 'M5' },
  { value: '15', label: 'M15' },
  { value: '60', label: 'H1' }
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch and display candles
  useEffect(() => {
    if (!chartContainerRef.current || !asset || !timeframe) return

    const fetchCandles = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await candlesAPI.getCandles(asset, parseInt(timeframe), 100)

        if (response.data?.success && response.data?.candles) {
          const candles: CandlestickData[] = response.data.candles.map((c: any) => ({
            time: c.time,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close
          }))

          // Initialize chart if not exists
          if (!chartRef.current) {
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
          }

          // Update candles
          if (candleSeriesRef.current) {
            candleSeriesRef.current.setData(candles)
          }

          setLoading(false)
        } else {
          throw new Error('Invalid candle data')
        }
      } catch (err: any) {
        console.error('[TradingChart] Error fetching candles:', err)
        setError(err.message || 'Failed to load chart data')
        setLoading(false)
      }
    }

    fetchCandles()

    // Cleanup on unmount
    return () => {
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
        candleSeriesRef.current = null
      }
    }
  }, [asset, timeframe])

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
    // Set first asset of new category
    const firstAsset = assetsByCategory[newCategory]?.[0] || ''
    onAssetChange(firstAsset)
  }

  return (
    <Card className="glass border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg md:text-xl flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Manual Trading Chart
          </CardTitle>
          {currentStatus && (
            <Badge variant="outline" className="gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              {currentStatus}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Category Selection */}
          <div className="space-y-2">
            <Label className="text-xs">Category</Label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={category === cat.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleCategoryChange(cat.id)}
                  className="text-xs"
                >
                  {cat.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Asset Selection */}
          <div className="space-y-2">
            <Label htmlFor="asset-select" className="text-xs">Asset</Label>
            <select
              id="asset-select"
              value={asset}
              onChange={(e) => onAssetChange(e.target.value)}
              className="w-full h-9 px-3 rounded-md border border-border bg-card text-foreground text-sm"
            >
              {assetsByCategory[category]?.map((assetOption) => (
                <option key={assetOption} value={assetOption}>
                  {assetOption}
                </option>
              ))}
            </select>
          </div>

          {/* Timeframe Selection */}
          <div className="space-y-2">
            <Label className="text-xs">Timeframe</Label>
            <div className="flex gap-2">
              {timeframes.map((tf) => (
                <Button
                  key={tf.value}
                  variant={timeframe === tf.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onTimeframeChange(tf.value)}
                  className="flex-1 text-xs"
                >
                  {tf.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 rounded-lg">
              <div className="text-center space-y-2">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">Loading chart...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 rounded-lg">
              <div className="text-center space-y-2">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            </div>
          )}

          <div ref={chartContainerRef} className="w-full h-[400px] rounded-lg overflow-hidden" />
        </div>
      </CardContent>
    </Card>
  )
}
