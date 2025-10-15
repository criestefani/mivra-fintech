import { calculateRSI } from '../indicators/rsi.mjs';
import { calculateMACD } from '../indicators/macd.mjs';
import { calculateBollinger } from '../indicators/bollinger.mjs';

export function analyzeBalanced(candles) {
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

    if ((lastRsi < 40 || lastPrice < lastBB.lower * 1.005) && lastMacd?.histogram > 0) {
      return { consensus: 'CALL', strength: 50 };
    }

    if ((lastRsi > 60 || lastPrice > lastBB.upper * 0.995) && lastMacd?.histogram < 0) {
      return { consensus: 'PUT', strength: 50 };
    }
  } catch (err) {
    return null;
  }

  return null;
}
