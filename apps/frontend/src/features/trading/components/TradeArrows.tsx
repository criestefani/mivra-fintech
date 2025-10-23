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

  useEffect(() => {
    if (!chart || !candleSeries || !chartContainerRect || tradeMarkers.length === 0) return

    const newPositions = new Map<string, TradeArrowPosition>()

    tradeMarkers.forEach((marker, index) => {
      try {
        const markerId = generateMarkerId(marker, index)

        // Get time coordinate (X position)
        const timeScale = chart.timeScale()
        const xCoord = timeScale.timeToCoordinate(marker.time as any)

        if (xCoord === null || xCoord === undefined) return

        // Get the last candle price for Y positioning
        // For entry markers, position above/below the price at that time
        const seriesData = candleSeries.data()
        const relevantCandle = seriesData.find((candle: any) => candle.time === marker.time)

        if (!relevantCandle) return

        // Use close price as reference
        const price = relevantCandle.close
        const yCoord = candleSeries.priceToCoordinate(price)

        if (yCoord === null || yCoord === undefined) return

        newPositions.set(markerId, {
          markerId,
          x: xCoord,
          y: marker.direction === 'CALL' ? yCoord + 25 : yCoord - 25,
          direction: marker.direction,
          pnl: marker.pnl,
          result: marker.result
        })
      } catch (error) {
        console.error('[TradeArrows] Error calculating position:', error)
      }
    })

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
