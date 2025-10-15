export function analyzeWithSupportResistance(candles) {
  if (candles.length < 20) return null;

  // ✅ NORMALIZA high/low
  candles = candles.map(c => ({
    ...c,
    high: c.high || c.max,
    low: c.low || c.min
  }));

  try {
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);

    const resistance = Math.max(...highs.slice(-10));
    const support = Math.min(...lows.slice(-10));

    const lastPrice = candles[candles.length - 1].close;
    const prevPrice = candles[candles.length - 2].close;

    if (prevPrice <= support && lastPrice > support) {
      return { consensus: 'CALL', strength: 75 };
    }

    if (prevPrice >= resistance && lastPrice < resistance) {
      return { consensus: 'PUT', strength: 75 };
    }
  } catch (err) {
    return null;
  }

  return null;
}
