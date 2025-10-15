import { calculateRSI } from '../indicators/rsi.mjs';

/**
 * Balanced Strategy (formerly Aggressive)
 * Threshold: 50% - Balanced risk/reward approach using RSI
 * Enters positions with moderate confirmation
 */
export function analyzeBalanced(candles) {
  if (candles.length < 14) return null;

  // ✅ NORMALIZA high/low
  candles = candles.map(c => ({
    ...c,
    high: c.high || c.max,
    low: c.low || c.min
  }));

  try {
    const candlesForIndicators = candles.map(c => ({ close: c.close }));
    const rsiResult = calculateRSI(candlesForIndicators, 14);

    if (!rsiResult) return null;

    const lastRsi = rsiResult.value;

    // Balanced CALL signal - Moderate oversold
    if (lastRsi < 35) {
      return { consensus: 'CALL', strength: 50, confidence: 50 };
    }

    // Balanced PUT signal - Moderate overbought
    if (lastRsi > 65) {
      return { consensus: 'PUT', strength: 50, confidence: 50 };
    }
  } catch (err) {
    return null;
  }

  return null;
}
