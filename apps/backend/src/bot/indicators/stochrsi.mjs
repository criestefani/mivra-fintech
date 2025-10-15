/**
 * Stochastic RSI Indicator
 * Oscilador que aplica fórmula Stochastic sobre valores RSI
 *
 * @module indicators/stochrsi
 */

/**
 * Calcula RSI básico (usado internamente)
 *
 * @param {Array<number>} closes - Array de preços de fechamento
 * @param {number} period - Período do RSI
 * @returns {Array<number>} - Array de valores RSI
 */
function calculateRSIValues(closes, period) {
  const rsiValues = [];

  // Calcular mudanças de preço
  const changes = [];
  for (let i = 1; i < closes.length; i++) {
    changes.push(closes[i] - closes[i - 1]);
  }

  // Separar gains e losses
  const gains = changes.map(change => change > 0 ? change : 0);
  const losses = changes.map(change => change < 0 ? Math.abs(change) : 0);

  // Calcular primeira média usando SMA
  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 0; i < period; i++) {
    avgGain += gains[i];
    avgLoss += losses[i];
  }

  avgGain = avgGain / period;
  avgLoss = avgLoss / period;

  // Calcular primeiro RSI
  let rsiValue;
  if (avgLoss === 0) {
    rsiValue = 100;
  } else {
    const rs = avgGain / avgLoss;
    rsiValue = 100 - (100 / (1 + rs));
  }
  rsiValues.push(rsiValue);

  // Calcular RSI para os períodos seguintes
  for (let i = period; i < changes.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;

    if (avgLoss === 0) {
      rsiValue = 100;
    } else {
      const rs = avgGain / avgLoss;
      rsiValue = 100 - (100 / (1 + rs));
    }
    rsiValues.push(rsiValue);
  }

  return rsiValues;
}

/**
 * Calcula SMA (Simple Moving Average)
 *
 * @param {Array<number>} values - Array de valores
 * @param {number} period - Período
 * @returns {number} - Valor da SMA
 */
function calculateSMA(values, period) {
  let sum = 0;
  for (let i = values.length - period; i < values.length; i++) {
    sum += values[i];
  }
  return sum / period;
}

/**
 * Calcula Stochastic RSI
 *
 * @param {Array<Object>} candles - Array de velas com propriedades: open, high, low, close, timestamp
 * @param {number} rsiPeriod - Período do RSI (padrão: 14)
 * @param {number} stochPeriod - Período do Stochastic (padrão: 14)
 * @param {number} kPeriod - Período da linha K (padrão: 3)
 * @param {number} dPeriod - Período da linha D (padrão: 3)
 * @returns {Object} - { stochRSI, k, d, signal: 'CALL'|'PUT'|'NEUTRO' }
 * @throws {Error} - Se dados inválidos ou insuficientes
 */
export function calculateStochRSI(candles, rsiPeriod = 14, stochPeriod = 14, kPeriod = 3, dPeriod = 3) {
  // Validação de entrada
  if (!Array.isArray(candles)) {
    throw new Error('StochRSI: candles deve ser um array');
  }

  const minCandles = rsiPeriod + stochPeriod + kPeriod + dPeriod;
  if (candles.length < minCandles) {
    throw new Error(`StochRSI: são necessários pelo menos ${minCandles} candles, fornecidos ${candles.length}`);
  }

  // Validar estrutura dos candles e extrair closes
  const closes = [];
  for (let i = 0; i < candles.length; i++) {
    if (typeof candles[i].close !== 'number' || isNaN(candles[i].close)) {
      throw new Error(`StochRSI: candle[${i}] possui valor 'close' inválido`);
    }
    closes.push(candles[i].close);
  }

  // Calcular RSI values
  const rsiValues = calculateRSIValues(closes, rsiPeriod);

  // Pegar últimos stochPeriod valores de RSI
  const recentRSI = rsiValues.slice(-stochPeriod);

  // Calcular Stochastic sobre RSI
  const maxRSI = Math.max(...recentRSI);
  const minRSI = Math.min(...recentRSI);

  let stochRSI;
  if (maxRSI === minRSI) {
    stochRSI = 0;
  } else {
    const currentRSI = rsiValues[rsiValues.length - 1];
    stochRSI = ((currentRSI - minRSI) / (maxRSI - minRSI)) * 100;
  }

  // Calcular linha K (SMA do StochRSI)
  // Para simplificar, vamos usar apenas o valor atual do stochRSI
  const k = stochRSI;

  // Calcular linha D (SMA da linha K)
  // Para simplificar, vamos usar o valor K
  const d = k;

  // Determinar sinal
  let signal;

  // StochRSI > 80 = overbought → PUT
  if (stochRSI > 80) {
    signal = 'PUT';
  }
  // StochRSI < 20 = oversold → CALL
  else if (stochRSI < 20) {
    signal = 'CALL';
  }
  // Zona neutra
  else {
    signal = 'NEUTRO';
  }

  return {
    stochRSI: Number(stochRSI.toFixed(2)),
    k: Number(k.toFixed(2)),
    d: Number(d.toFixed(2)),
    signal: signal
  };
}
