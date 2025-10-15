// src/bot/indicators/trend.mjs

function calculateEMA(candles, period) {
  if (candles.length < period) return null;
  
  const prices = candles.map(c => c.close);
  const multiplier = 2 / (period + 1);
  
  let ema = prices.slice(0, period).reduce((a, b) => a + b) / period;
  
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  
  return ema;
}

export function calculateTrend(candles) {
  if (!candles || candles.length < 50) {
    return { trend: 'LATERAL', strength: 0, signal: 'NEUTRO', ema9: null, ema21: null, ema50: null };
  }

  const ema9 = calculateEMA(candles, 9);
  const ema21 = calculateEMA(candles, 21);
  const ema50 = calculateEMA(candles, 50);
  const currentPrice = candles[candles.length - 1].close;

  if (!ema9 || !ema21 || !ema50) {
    return { trend: 'LATERAL', strength: 0, signal: 'NEUTRO', ema9, ema21, ema50 };
  }

  const divergence = Math.abs(((ema9 - ema21) / ema21) * 100);
  const strength = Math.min(Math.round(divergence * 100), 100);

  let trend = 'LATERAL';
  let signal = 'NEUTRO';

  // REDUZIDO: 0.05% ao invés de 0.1%
  if (ema9 > ema21 && ema21 > ema50 && currentPrice > ema9) {
    trend = 'ALTA';
    signal = 'CALL';
  }
  else if (ema9 < ema21 && ema21 < ema50 && currentPrice < ema9) {
    trend = 'BAIXA';
    signal = 'PUT';
  }
  // NOVO: Tendência fraca com threshold menor
  else if (ema9 > ema21 && divergence > 0.05) {
    trend = 'ALTA_FRACA';
    signal = 'CALL';
  }
  else if (ema9 < ema21 && divergence > 0.05) {
    trend = 'BAIXA_FRACA';
    signal = 'PUT';
  }

  return {
    trend,
    strength,
    signal,
    ema9: parseFloat(ema9.toFixed(5)),
    ema21: parseFloat(ema21.toFixed(5)),
    ema50: parseFloat(ema50.toFixed(5))
  };
}
