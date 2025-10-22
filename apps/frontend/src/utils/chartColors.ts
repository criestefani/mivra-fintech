/**
 * Chart Colors Configuration
 * Centralized color palette for consistent theming across all charts
 * Validates and exports colors used in trading charts
 */

export const CHART_COLORS = {
  // Primary colors
  POSITIVE: '#21C06C',     // Green - for wins, bullish signals, profits
  NEGATIVE: '#EF4444',     // Red - for losses, bearish signals, losses
  WARNING: '#FF9C43',      // Orange/Yellow - for warnings, alerts, status
  PRIMARY: '#FF8C1A',      // Orange - primary accent color

  // Candlestick colors
  CANDLE_UP: '#21C06C',    // Green for up candles
  CANDLE_DOWN: '#EF4444',  // Red for down candles
  CANDLE_BORDER_UP: '#21C06C',
  CANDLE_BORDER_DOWN: '#EF4444',
  CANDLE_WICK_UP: '#21C06C',
  CANDLE_WICK_DOWN: '#EF4444',

  // Marker colors
  CALL_MARKER: '#10B981',  // Bright green for CALL
  PUT_MARKER: '#EF4444',   // Red for PUT
  WIN_MARKER: '#10B981',   // Green for WIN
  LOSS_MARKER: '#EF4444',  // Red for LOSS

  // Chart elements
  GRID_LINE: 'rgba(42, 46, 57, 0.3)',
  TEXT: '#888888',
  ZERO_LINE: '#888888',
  BACKGROUND: 'transparent',

  // Shadows/Glows
  POSITIVE_GLOW: 'rgba(16, 185, 129, 0.2)',
  NEGATIVE_GLOW: 'rgba(235, 47, 47, 0.2)',
  POSITIVE_SHADOW: 'rgba(16, 185, 129, 0.6)',
  NEGATIVE_SHADOW: 'rgba(235, 47, 47, 0.6)',

  // Borders
  POSITIVE_BORDER: 'rgba(16, 185, 129, 0.5)',
  NEGATIVE_BORDER: 'rgba(235, 47, 47, 0.5)',
} as const;

/**
 * Validate that all required colors are defined
 * @returns {boolean} true if all colors are valid hex codes
 */
export function validateChartColors(): boolean {
  const hexRegex = /^#([A-F0-9]{6}|[A-F0-9]{8}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8}|rgba\(.+\))$/i;

  for (const [key, value] of Object.entries(CHART_COLORS)) {
    if (typeof value !== 'string') {
      console.warn(`[Chart Colors] Invalid type for ${key}: ${typeof value}`);
      return false;
    }

    // Allow both hex and rgba formats
    if (!value.startsWith('#') && !value.startsWith('rgba')) {
      console.warn(`[Chart Colors] Invalid format for ${key}: ${value}`);
      return false;
    }
  }

  console.log('[Chart Colors] ✅ All colors validated successfully');
  return true;
}

/**
 * Get P&L color based on value
 * @param value - P&L value
 * @returns {string} color code
 */
export function getPnlColor(value: number): string {
  return value >= 0 ? CHART_COLORS.POSITIVE : CHART_COLORS.NEGATIVE;
}

/**
 * Get P&L glow color based on value
 * @param value - P&L value
 * @returns {string} color code with transparency
 */
export function getPnlGlowColor(value: number): string {
  return value >= 0 ? CHART_COLORS.POSITIVE_GLOW : CHART_COLORS.NEGATIVE_GLOW;
}

/**
 * Get P&L shadow color based on value
 * @param value - P&L value
 * @returns {string} color code with transparency
 */
export function getPnlShadowColor(value: number): string {
  return value >= 0 ? CHART_COLORS.POSITIVE_SHADOW : CHART_COLORS.NEGATIVE_SHADOW;
}

/**
 * Get P&L border color based on value
 * @param value - P&L value
 * @returns {string} color code with transparency
 */
export function getPnlBorderColor(value: number): string {
  return value >= 0 ? CHART_COLORS.POSITIVE_BORDER : CHART_COLORS.NEGATIVE_BORDER;
}

/**
 * Get marker color based on direction
 * @param direction - 'CALL' or 'PUT'
 * @returns {string} color code
 */
export function getDirectionColor(direction: 'CALL' | 'PUT'): string {
  return direction === 'CALL' ? CHART_COLORS.CALL_MARKER : CHART_COLORS.PUT_MARKER;
}

/**
 * Get marker color based on result
 * @param result - 'WIN' or 'LOSS'
 * @returns {string} color code
 */
export function getResultColor(result: 'WIN' | 'LOSS'): string {
  return result === 'WIN' ? CHART_COLORS.WIN_MARKER : CHART_COLORS.LOSS_MARKER;
}

// Validate colors on module load
if (typeof window !== 'undefined') {
  validateChartColors();
}
