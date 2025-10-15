/**
 * RSI (Relative Strength Index) Indicator
 * Método de Wilder com suavização EMA
 *
 * @module indicators/rsi
 */

/**
 * Calcula o RSI (Relative Strength Index) usando o método de Wilder
 *
 * @param {Array<Object>} candles - Array de velas com propriedades: open, high, low, close, timestamp
 * @param {number} period - Período do RSI (padrão: 14)
 * @returns {Object} - { value: número RSI (0-100), signal: 'CALL' | 'PUT' | 'NEUTRO' }
 * @throws {Error} - Se dados inválidos ou insuficientes
 */
export function calculateRSI(candles, period = 14) {
  // Validação de entrada
  if (!Array.isArray(candles)) {
    throw new Error('RSI: candles deve ser um array');
  }

  if (candles.length < period + 1) {
    throw new Error(`RSI: são necessários pelo menos ${period + 1} candles, fornecidos ${candles.length}`);
  }

  if (period < 2) {
    throw new Error('RSI: período deve ser >= 2');
  }

  // Validar estrutura dos candles
  for (let i = 0; i < candles.length; i++) {
    if (typeof candles[i].close !== 'number' || isNaN(candles[i].close)) {
      throw new Error(`RSI: candle[${i}] possui valor 'close' inválido`);
    }
  }

  // Calcular mudanças de preço (gains e losses)
  const changes = [];
  for (let i = 1; i < candles.length; i++) {
    const change = candles[i].close - candles[i - 1].close;
    changes.push(change);
  }

  // Separar gains e losses
  const gains = changes.map(change => change > 0 ? change : 0);
  const losses = changes.map(change => change < 0 ? Math.abs(change) : 0);

  // Calcular primeira média usando SMA (Simple Moving Average)
  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 0; i < period; i++) {
    avgGain += gains[i];
    avgLoss += losses[i];
  }

  avgGain = avgGain / period;
  avgLoss = avgLoss / period;

  // Calcular RSI para os períodos seguintes usando smoothing de Wilder (EMA)
  for (let i = period; i < changes.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
  }

  // Calcular RSI final
  let rsiValue;

  if (avgLoss === 0) {
    // Se não há perdas, RSI = 100
    rsiValue = 100;
  } else {
    const rs = avgGain / avgLoss;
    rsiValue = 100 - (100 / (1 + rs));
  }

  // Garantir que RSI está entre 0 e 100
  rsiValue = Math.max(0, Math.min(100, rsiValue));

  // Determinar sinal de trading
  let signal;
  if (rsiValue < 30) {
    signal = 'CALL'; // Oversold - sinal de compra
  } else if (rsiValue > 70) {
    signal = 'PUT'; // Overbought - sinal de venda
  } else {
    signal = 'NEUTRO'; // Zona neutra
  }

  return {
    value: Number(rsiValue.toFixed(2)),
    signal: signal
  };
}
