/**
 * Trade Markers Utility for Lightweight Charts
 * Based on official Lightweight Charts documentation
 * https://tradingview.github.io/lightweight-charts/tutorials/how_to/series-markers
 */

import type { ISeriesApi, SeriesMarker, Time } from 'lightweight-charts';

export interface TradeMarkerData {
  time: number; // Unix timestamp
  direction: 'CALL' | 'PUT';
  result?: 'WIN' | 'LOSS';
  expirationTime?: number; // Unix timestamp for expiration
  price?: number; // Entry price
}

/**
 * Create trade entry marker (arrow)
 * Shows CALL (up arrow) or PUT (down arrow) at trade entry
 */
export function createEntryMarker(trade: TradeMarkerData): SeriesMarker<Time> {
  const isCall = trade.direction === 'CALL';

  return {
    time: trade.time as Time,
    position: isCall ? 'belowBar' : 'aboveBar',
    color: isCall ? '#10B981' : '#EF4444', // Green for CALL, Red for PUT
    shape: isCall ? 'arrowUp' : 'arrowDown',
    text: isCall ? '▲ CALL' : '▼ PUT',
    size: 1,
  };
}

/**
 * Create trade result marker (at expiration)
 * Shows WIN ✓ or LOSS ✗ at exact expiration point
 */
export function createResultMarker(trade: TradeMarkerData): SeriesMarker<Time> | null {
  if (!trade.result || !trade.expirationTime) return null;

  const isWin = trade.result === 'WIN';

  return {
    time: trade.expirationTime as Time,
    position: isWin ? 'aboveBar' : 'belowBar',
    color: isWin ? '#10B981' : '#EF4444',
    shape: 'circle',
    text: isWin ? '✓ WIN' : '✗ LOSS',
    size: 1,
  };
}

/**
 * Create markers for a single trade (entry + result if available)
 */
export function createTradeMarkers(trade: TradeMarkerData): SeriesMarker<Time>[] {
  const markers: SeriesMarker<Time>[] = [];

  // Entry marker
  markers.push(createEntryMarker(trade));

  // Result marker (if trade is closed)
  const resultMarker = createResultMarker(trade);
  if (resultMarker) {
    markers.push(resultMarker);
  }

  return markers;
}

/**
 * Add trade markers to a Lightweight Charts series
 * Properly handles adding new markers while keeping existing ones
 *
 * @example
 * ```tsx
 * const candleSeriesRef = useRef<ISeriesApi<'Candlestick'>>(null);
 *
 * // Add markers for new trade
 * addTradeMarkers(candleSeriesRef.current, newTrade);
 * ```
 */
export function addTradeMarkers(
  series: ISeriesApi<'Candlestick'> | null,
  trade: TradeMarkerData
): void {
  if (!series) return;

  // Get existing markers
  const existingMarkers = series.markers?.() || [];

  // Create new markers for this trade
  const newMarkers = createTradeMarkers(trade);

  // Combine and set all markers
  // NOTE: setMarkers() replaces ALL markers, so we need to include existing ones
  series.setMarkers([...existingMarkers, ...newMarkers]);
}

/**
 * Update trade marker with result (when trade closes)
 * Finds the trade by time and adds result marker
 */
export function updateTradeMarkerResult(
  series: ISeriesApi<'Candlestick'> | null,
  trade: TradeMarkerData
): void {
  if (!series || !trade.result || !trade.expirationTime) return;

  // Get existing markers
  const existingMarkers = series.markers?.() || [];

  // Add result marker
  const resultMarker = createResultMarker(trade);
  if (resultMarker) {
    series.setMarkers([...existingMarkers, resultMarker]);
  }
}

/**
 * Remove all markers from series
 */
export function clearAllMarkers(series: ISeriesApi<'Candlestick'> | null): void {
  if (!series) return;
  series.setMarkers([]);
}

/**
 * Remove markers for a specific trade (by time)
 */
export function removeTradeMarkers(
  series: ISeriesApi<'Candlestick'> | null,
  tradeTime: number
): void {
  if (!series) return;

  const existingMarkers = series.markers?.() || [];
  const filteredMarkers = existingMarkers.filter((marker) => marker.time !== tradeTime);

  series.setMarkers(filteredMarkers);
}

/**
 * Batch add multiple trades' markers (more efficient)
 */
export function addMultipleTradeMarkers(
  series: ISeriesApi<'Candlestick'> | null,
  trades: TradeMarkerData[]
): void {
  if (!series) return;

  const existingMarkers = series.markers?.() || [];
  const newMarkers = trades.flatMap((trade) => createTradeMarkers(trade));

  series.setMarkers([...existingMarkers, ...newMarkers]);
}

/**
 * Create custom marker with glow effect (using text styling)
 */
export function createGlowMarker(
  time: number,
  direction: 'CALL' | 'PUT',
  withGlow = true
): SeriesMarker<Time> {
  const isCall = direction === 'CALL';

  return {
    time: time as Time,
    position: isCall ? 'belowBar' : 'aboveBar',
    color: isCall ? '#10B981' : '#EF4444',
    shape: isCall ? 'arrowUp' : 'arrowDown',
    text: withGlow ? (isCall ? '🟢 CALL' : '🔴 PUT') : (isCall ? 'CALL' : 'PUT'),
    size: withGlow ? 2 : 1,
  };
}

/**
 * Helper: Convert Date to Lightweight Charts Time format
 */
export function dateToChartTime(date: Date): Time {
  return Math.floor(date.getTime() / 1000) as Time;
}

/**
 * Helper: Convert Unix timestamp to Lightweight Charts Time format
 */
export function timestampToChartTime(timestamp: number): Time {
  return Math.floor(timestamp / 1000) as Time;
}
