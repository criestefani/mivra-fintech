import { calculateRSI } from '../indicators/rsi.mjs';

export function analyzeAggressive(candles) {
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

    if (lastRsi < 35) {
      return { consensus: 'CALL', strength: 70 };
    }

    if (lastRsi > 65) {
      return { consensus: 'PUT', strength: 70 };
    }
  } catch (err) {
    return null;
  }

  return null;
}
