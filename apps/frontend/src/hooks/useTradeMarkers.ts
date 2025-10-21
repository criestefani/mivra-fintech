/**
 * useTradeMarkers Hook
 * React hook for managing trade markers on Lightweight Charts
 * Integrates with trade history and bot events
 */

import { useRef, useCallback, useEffect } from 'react';
import type { ISeriesApi } from 'lightweight-charts';
import {
  addTradeMarkers,
  updateTradeMarkerResult,
  clearAllMarkers,
  type TradeMarkerData,
} from '../utils/tradeMarkers';

interface UseTradeMarkersOptions {
  autoUpdate?: boolean; // Auto-update when trades change
  maxMarkers?: number; // Limit number of markers to prevent performance issues
}

/**
 * Hook to manage trade markers on a Lightweight Charts candlestick series
 *
 * @example
 * ```tsx
 * const candleSeriesRef = useRef<ISeriesApi<'Candlestick'>>(null);
 * const { addTrade, updateTrade, clearMarkers } = useTradeMarkers(candleSeriesRef);
 *
 * // Add new trade
 * addTrade({
 *   time: Date.now(),
 *   direction: 'CALL',
 *   price: 1.0850,
 * });
 *
 * // Update when trade closes
 * updateTrade({
 *   time: entryTime,
 *   direction: 'CALL',
 *   result: 'WIN',
 *   expirationTime: Date.now(),
 * });
 * ```
 */
export function useTradeMarkers(
  seriesRef: React.RefObject<ISeriesApi<'Candlestick'> | null>,
  options: UseTradeMarkersOptions = {}
) {
  const { autoUpdate = true, maxMarkers = 50 } = options;
  const tradesRef = useRef<TradeMarkerData[]>([]);

  /**
   * Add a new trade marker
   */
  const addTrade = useCallback(
    (trade: TradeMarkerData) => {
      if (!seriesRef.current) return;

      // Add to trades list
      tradesRef.current = [...tradesRef.current, trade];

      // Limit markers if needed
      if (tradesRef.current.length > maxMarkers) {
        tradesRef.current = tradesRef.current.slice(-maxMarkers);
      }

      // Add marker to chart
      addTradeMarkers(seriesRef.current, trade);
    },
    [seriesRef, maxMarkers]
  );

  /**
   * Update trade with result (when it closes)
   */
  const updateTrade = useCallback(
    (trade: TradeMarkerData) => {
      if (!seriesRef.current) return;

      // Update in trades list
      const index = tradesRef.current.findIndex((t) => t.time === trade.time);
      if (index !== -1) {
        tradesRef.current[index] = trade;
      }

      // Update marker on chart
      updateTradeMarkerResult(seriesRef.current, trade);
    },
    [seriesRef]
  );

  /**
   * Clear all markers
   */
  const clearMarkers = useCallback(() => {
    if (!seriesRef.current) return;

    tradesRef.current = [];
    clearAllMarkers(seriesRef.current);
  }, [seriesRef]);

  /**
   * Get current trades
   */
  const getTrades = useCallback(() => {
    return tradesRef.current;
  }, []);

  /**
   * Remove markers older than X seconds
   */
  const removeOldMarkers = useCallback(
    (olderThanSeconds: number) => {
      if (!seriesRef.current) return;

      const cutoffTime = Date.now() - olderThanSeconds * 1000;
      tradesRef.current = tradesRef.current.filter((t) => t.time >= cutoffTime);

      // Re-apply all remaining markers
      clearAllMarkers(seriesRef.current);
      tradesRef.current.forEach((trade) => {
        addTradeMarkers(seriesRef.current!, trade);
      });
    },
    [seriesRef]
  );

  return {
    addTrade,
    updateTrade,
    clearMarkers,
    getTrades,
    removeOldMarkers,
  };
}

/**
 * Hook that auto-syncs with trade history from backend
 * Automatically adds/updates markers when trades change
 */
export function useTradeMarkersFromHistory(
  seriesRef: React.RefObject<ISeriesApi<'Candlestick'> | null>,
  tradeHistory: Array<{
    id: string;
    data_abertura: string;
    data_expiracao?: string;
    direction: string;
    resultado?: string;
  }>
) {
  const { addTrade, clearMarkers } = useTradeMarkers(seriesRef);

  useEffect(() => {
    if (!seriesRef.current || !tradeHistory) return;

    // Clear existing markers
    clearMarkers();

    // Add all trades from history
    tradeHistory.forEach((trade) => {
      const markerData: TradeMarkerData = {
        time: new Date(trade.data_abertura).getTime(),
        direction: trade.direction.toUpperCase() as 'CALL' | 'PUT',
        result: trade.resultado as 'WIN' | 'LOSS' | undefined,
        expirationTime: trade.data_expiracao
          ? new Date(trade.data_expiracao).getTime()
          : undefined,
      };

      addTrade(markerData);
    });
  }, [tradeHistory, seriesRef, addTrade, clearMarkers]);
}

/**
 * Hook that listens to WebSocket trade events and auto-updates markers
 */
export function useTradeMarkersWithWebSocket(
  seriesRef: React.RefObject<ISeriesApi<'Candlestick'> | null>,
  socketEvents: {
    onTradeOpened?: (trade: any) => void;
    onTradeClosed?: (trade: any) => void;
  }
) {
  const { addTrade, updateTrade } = useTradeMarkers(seriesRef);

  useEffect(() => {
    // Register WebSocket event handlers
    socketEvents.onTradeOpened?.((trade) => {
      addTrade({
        time: new Date(trade.data_abertura).getTime(),
        direction: trade.direction.toUpperCase() as 'CALL' | 'PUT',
      });
    });

    socketEvents.onTradeClosed?.((trade) => {
      updateTrade({
        time: new Date(trade.data_abertura).getTime(),
        direction: trade.direction.toUpperCase() as 'CALL' | 'PUT',
        result: trade.resultado as 'WIN' | 'LOSS',
        expirationTime: new Date(trade.data_expiracao).getTime(),
      });
    });
  }, [socketEvents, addTrade, updateTrade]);
}
