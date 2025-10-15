import { calculateRSI } from '../indicators/rsi.mjs';
import { calculateMACD } from '../indicators/macd.mjs';
import { calculateBollinger } from '../indicators/bollinger.mjs';

/**
 * Conservative Strategy (formerly Balanced)
 * Threshold: 60% - Waits for strong confirmation from multiple indicators
 * Uses RSI, MACD and Bollinger Bands for conservative entry points
 */
export function analyzeConservative(candles) {
  if (candles.length < 26) return null;

  // ✅ NORMALIZA high/low
  candles = candles.map(c => ({
    ...c,
    high: c.high || c.max,
    low: c.low || c.min
  }));

  try {
    const candlesForIndicators = candles.map(c => ({ close: c.close }));
    const rsiResult = calculateRSI(candlesForIndicators, 14);
    const macd = calculateMACD(candlesForIndicators);
    const bb = calculateBollinger(candlesForIndicators, 20, 2);

    if (!rsiResult || !macd || !bb || bb.length === 0) return null;

    const lastRsi = rsiResult.value;
    const lastMacd = macd[macd.length - 1];
    const lastBB = bb[bb.length - 1];
    const lastPrice = candles[candles.length - 1].close;

    if (!lastBB || typeof lastBB.lower === 'undefined') return null;

    // Conservative CALL signal - Strong oversold + bullish momentum
    if ((lastRsi < 40 || lastPrice < lastBB.lower * 1.005) && lastMacd?.histogram > 0) {
      return { consensus: 'CALL', strength: 60, confidence: 60 };
    }

    // Conservative PUT signal - Strong overbought + bearish momentum
    if ((lastRsi > 60 || lastPrice > lastBB.upper * 0.995) && lastMacd?.histogram < 0) {
      return { consensus: 'PUT', strength: 60, confidence: 60 };
    }
  } catch (err) {
    return null;
  }

  return null;
}
