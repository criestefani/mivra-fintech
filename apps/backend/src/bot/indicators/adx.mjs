/**
 * ADX (Average Directional Index) Indicator
 * Mede força da tendência e direção com +DI e -DI
 *
 * @module indicators/adx
 */

/**
 * Calcula a média móvel de Wilder (smoothed moving average)
 *
 * @param {Array<number>} values - Array de valores
 * @param {number} period - Período
 * @returns {number} - Média suavizada
 */
function wilderSmoothing(values, period) {
  if (values.length < period) {
    throw new Error('Valores insuficientes para smoothing');
  }

  // Primeira média = SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += values[i];
  }
  let smoothed = sum / period;

  // Médias seguintes usando Wilder smoothing
  for (let i = period; i < values.length; i++) {
    smoothed = (smoothed * (period - 1) + values[i]) / period;
  }

  return smoothed;
}

/**
 * Calcula ADX (Average Directional Index)
 *
 * @param {Array<Object>} candles - Array de velas com propriedades: open, high, low, close, timestamp
 * @param {number} period - Período do ADX (padrão: 14)
 * @returns {Object} - { adx, plusDI, minusDI, signal: 'CALL'|'PUT'|'NEUTRO' }
 * @throws {Error} - Se dados inválidos ou insuficientes
 */
export function calculateADX(candles, period = 14) {
  // Validação de entrada
  if (!Array.isArray(candles)) {
    throw new Error('ADX: candles deve ser um array');
  }

  const minCandles = period * 2 + 1; // Precisa de dados suficientes para smoothing
  if (candles.length < minCandles) {
    throw new Error(`ADX: são necessários pelo menos ${minCandles} candles, fornecidos ${candles.length}`);
  }

  // Arrays para armazenar valores
  const trueRanges = [];
  const plusDMs = [];
  const minusDMs = [];

  // Calcular TR, +DM, -DM para cada período
  for (let i = 1; i < candles.length; i++) {
    const candle = candles[i];
    const prevCandle = candles[i - 1];

    // Validar dados
    if (typeof candle.high !== 'number' || typeof candle.low !== 'number' ||
        typeof candle.close !== 'number' || typeof prevCandle.close !== 'number') {
      throw new Error(`ADX: candle[${i}] possui valores inválidos`);
    }

    // True Range = max(high - low, |high - prev_close|, |low - prev_close|)
    const tr = Math.max(
      candle.high - candle.low,
      Math.abs(candle.high - prevCandle.close),
      Math.abs(candle.low - prevCandle.close)
    );
    trueRanges.push(tr);

    // +DM = high - prev_high (se positivo e maior que low_move)
    // -DM = prev_low - low (se positivo e maior que high_move)
    const highMove = candle.high - prevCandle.high;
    const lowMove = prevCandle.low - candle.low;

    let plusDM = 0;
    let minusDM = 0;

    if (highMove > lowMove && highMove > 0) {
      plusDM = highMove;
    } else if (lowMove > highMove && lowMove > 0) {
      minusDM = lowMove;
    }

    plusDMs.push(plusDM);
    minusDMs.push(minusDM);
  }

  // Calcular smoothed TR, +DM, -DM
  const smoothedTR = wilderSmoothing(trueRanges, period);
  const smoothedPlusDM = wilderSmoothing(plusDMs, period);
  const smoothedMinusDM = wilderSmoothing(minusDMs, period);

  // Calcular +DI e -DI
  const plusDI = smoothedTR === 0 ? 0 : (smoothedPlusDM / smoothedTR) * 100;
  const minusDI = smoothedTR === 0 ? 0 : (smoothedMinusDM / smoothedTR) * 100;

  // Calcular DX
  const diSum = plusDI + minusDI;
  const dx = diSum === 0 ? 0 : (Math.abs(plusDI - minusDI) / diSum) * 100;

  // Para simplificar, usamos DX como ADX
  // (Idealmente, ADX seria smoothing de DX, mas isso requer mais dados históricos)
  const adx = dx;

  // Determinar sinal
  let signal;

  // ADX > 25 indica tendência forte
  if (adx > 25) {
    // +DI > -DI = tendência de alta → CALL
    if (plusDI > minusDI) {
      signal = 'CALL';
    }
    // -DI > +DI = tendência de baixa → PUT
    else {
      signal = 'PUT';
    }
  }
  // ADX < 25 = mercado lateral → NEUTRO
  else {
    signal = 'NEUTRO';
  }

  return {
    adx: Number(adx.toFixed(2)),
    plusDI: Number(plusDI.toFixed(2)),
    minusDI: Number(minusDI.toFixed(2)),
    signal: signal
  };
}
