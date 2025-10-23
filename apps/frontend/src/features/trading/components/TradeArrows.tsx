import React, { useEffect, useRef, useState } from 'react'
import { IChartApi, ISeriesApi } from 'lightweight-charts'

interface TradeMarker {
  time: number
  direction: 'CALL' | 'PUT'
  result?: 'WIN' | 'LOSS'
  pnl?: number
}

interface TradeArrowPosition {
  markerId: string
  x: number
  y: number
  direction: 'CALL' | 'PUT'
  pnl?: number
  result?: 'WIN' | 'LOSS'
}

interface TradeArrowsProps {
  tradeMarkers: TradeMarker[]
  chart: IChartApi | null
  candleSeries: ISeriesApi<'Candlestick'> | null
  chartContainerRect: DOMRect | null
}

const generateMarkerId = (marker: TradeMarker, index: number) => {
  return `arrow-${marker.time}-${index}`
}

export const TradeArrows: React.FC<TradeArrowsProps> = ({
  tradeMarkers,
  chart,
  candleSeries,
  chartContainerRect
}) => {
  const [arrowPositions, setArrowPositions] = useState<Map<string, TradeArrowPosition>>(new Map())
  const containerRef = useRef<HTMLDivElement>(null)

  // Log render to confirm component is mounted
  console.log('[TradeArrows] 🎯 Component rendered - markers:', tradeMarkers?.length || 0)

  useEffect(() => {
    console.log('[TradeArrows] Effect triggered - chart:', !!chart, 'candleSeries:', !!candleSeries, 'chartContainerRect:', !!chartContainerRect, 'markers:', tradeMarkers.length)

    if (!chart || !candleSeries || !chartContainerRect || tradeMarkers.length === 0) {
      if (tradeMarkers.length > 0) {
        console.log('[TradeArrows] ⚠️ Missing dependencies - chart:', !!chart, 'candleSeries:', !!candleSeries, 'rect:', !!chartContainerRect)
      }
      return
    }

    const newPositions = new Map<string, TradeArrowPosition>()
    console.log('[TradeArrows] Processing', tradeMarkers.length, 'markers')

    tradeMarkers.forEach((marker, index) => {
      try {
        const markerId = generateMarkerId(marker, index)
        console.log(`[TradeArrows] Processing marker ${index}:`, { time: marker.time, direction: marker.direction })

        // Get time coordinate (X position)
        const timeScale = chart.timeScale()
        const xCoord = timeScale.timeToCoordinate(marker.time as any)
        console.log(`[TradeArrows] X coordinate for marker ${index}:`, xCoord)

        if (xCoord === null || xCoord === undefined) {
          console.log(`[TradeArrows] ⚠️ No X coordinate for marker ${index}`)
          return
        }

        // Get the last candle price for Y positioning
        // For entry markers, position above/below the price at that time
        const seriesData = candleSeries.data()
        console.log(`[TradeArrows] Series data length:`, seriesData.length, 'looking for time:', marker.time)

        // Use the most recent candle as reference if exact time not found
        let relevantCandle = seriesData.find((candle: any) => {
          const candleTime = typeof candle.time === 'number' ? candle.time : (candle.time as any)
          return candleTime === marker.time
        })

        if (!relevantCandle && seriesData.length > 0) {
          // Fallback: use the last candle
          relevantCandle = seriesData[seriesData.length - 1]
          console.log(`[TradeArrows] Using last candle as fallback for marker ${index}`)
        }

        if (!relevantCandle) {
          console.log(`[TradeArrows] ⚠️ No candle found for marker ${index}`)
          return
        }

        // Use close price as reference
        const price = relevantCandle.close
        const yCoord = candleSeries.priceToCoordinate(price)
        console.log(`[TradeArrows] Y coordinate for marker ${index}:`, { price, yCoord })

        if (yCoord === null || yCoord === undefined) {
          console.log(`[TradeArrows] ⚠️ No Y coordinate for marker ${index}`)
          return
        }

        const finalPosition = {
          markerId,
          x: xCoord,
          y: marker.direction === 'CALL' ? yCoord + 25 : yCoord - 25,
          direction: marker.direction,
          pnl: marker.pnl,
          result: marker.result
        }
        console.log(`[TradeArrows] ✅ Arrow ${index} positioned at:`, { x: finalPosition.x, y: finalPosition.y })
        newPositions.set(markerId, finalPosition)
      } catch (error) {
        console.error(`[TradeArrows] Error calculating position for marker ${index}:`, error)
      }
    })

    console.log(`[TradeArrows] Setting ${newPositions.size} arrows`)
    setArrowPositions(newPositions)
  }, [tradeMarkers, chart, candleSeries, chartContainerRect])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ width: chartContainerRect?.width, height: chartContainerRect?.height }}
    >
      {Array.from(arrowPositions.values()).map((arrow) => {
        const isCall = arrow.direction === 'CALL'
        const arrowColor = isCall ? '#10B981' : '#EF4444'
        const arrowEmoji = isCall ? '▲' : '▼'

        return (
          <div
            key={arrow.markerId}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 animate-bounce"
            style={{
              left: `${arrow.x}px`,
              top: `${arrow.y}px`,
              color: arrowColor,
              fontSize: '24px',
              fontWeight: 'bold',
              textShadow: `0 0 8px ${arrowColor}`,
              filter: `drop-shadow(0 0 4px ${arrowColor})`,
              zIndex: 10
            }}
          >
            <div className="flex flex-col items-center gap-1">
              <div>{arrowEmoji}</div>
              {arrow.pnl !== undefined && (
                <div
                  className="text-xs font-semibold px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: `${arrowColor}20`,
                    color: arrowColor,
                    border: `1px solid ${arrowColor}`
                  }}
                >
                  {arrow.pnl >= 0 ? '+' : ''}{arrow.pnl.toFixed(2)}
                </div>
              )}
              {arrow.result && (
                <div
                  className="text-xs font-semibold px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: arrow.result === 'WIN' ? '#10B98120' : '#EF444420',
                    color: arrow.result === 'WIN' ? '#10B981' : '#EF4444',
                    border: `1px solid ${arrow.result === 'WIN' ? '#10B981' : '#EF4444'}`
                  }}
                >
                  {arrow.result === 'WIN' ? '✓ WIN' : '✗ LOSS'}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
