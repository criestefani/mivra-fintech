// src/bot/strategies/strategy-conservative.mjs
import { calculateRSI } from '../indicators/rsi.mjs';
import { calculateMACD } from '../indicators/macd.mjs';

export function analyzeConservative(candles) {
  if (candles.length < 35) return null; // ✅ Era 50, agora 35

  // ✅ NORMALIZA high/low
  candles = candles.map(c => ({
    ...c,
    high: c.high || c.max,
    low: c.low || c.min
  }));

  try {
    const candlesForIndicators = candles.map(c => ({ close: c.close }));
    const rsiResult = calculateRSI(candlesForIndicators, 14);
    const macdResult = calculateMACD(candlesForIndicators);

    if (!rsiResult || !macdResult || macdResult.length < 2) return null; // ✅ Era 3, agora 2

    const lastRsi = rsiResult.value;
    const lastMacd = macdResult[macdResult.length - 1];
    const prevMacd = macdResult[macdResult.length - 2];

    // ✅ SIMPLIFICADO: Apenas 2 condições (não 3)
    const macdTrend = lastMacd.histogram > prevMacd.histogram;
    const macdFall = lastMacd.histogram < prevMacd.histogram;

    // ✅ THRESHOLDS MAIS PERMISSIVOS
    // CALL: RSI < 55 (era 50) + MACD positivo + tendência
    if (lastRsi < 55 && lastMacd.histogram > 0 && macdTrend) {
      return { consensus: 'CALL', strength: 70 };
    }

    // PUT: RSI > 45 (era 50) + MACD negativo + queda
    if (lastRsi > 45 && lastMacd.histogram < 0 && macdFall) {
      return { consensus: 'PUT', strength: 70 };
    }

  } catch (err) {
    return null;
  }

  return null;
}
