/**
 * Bollinger Bands Indicator
 * Indicador de volatilidade baseado em SMA e desvio padrão
 *
 * @module indicators/bollinger
 */

/**
 * Calcula a SMA (Simple Moving Average)
 *
 * @param {Array<number>} values - Array de valores
 * @param {number} period - Período da SMA
 * @returns {number} - Valor da SMA
 */
function calculateSMA(values, period) {
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += values[i];
  }
  return sum / period;
}

/**
 * Calcula o desvio padrão
 *
 * @param {Array<number>} values - Array de valores
 * @param {number} period - Período
 * @param {number} sma - Valor da SMA
 * @returns {number} - Desvio padrão
 */
function calculateStdDeviation(values, period, sma) {
  let squaredDifferences = 0;
  for (let i = 0; i < period; i++) {
    const difference = values[i] - sma;
    squaredDifferences += difference * difference;
  }
  const variance = squaredDifferences / period;
  return Math.sqrt(variance);
}

/**
 * Calcula as Bollinger Bands
 *
 * @param {Array<Object>} candles - Array de velas com propriedades: open, high, low, close, timestamp
 * @param {number} period - Período da SMA (padrão: 20)
 * @param {number} stdDev - Multiplicador do desvio padrão (padrão: 2)
 * @returns {Object} - { upper, middle, lower, bandwidth, signal }
 * @throws {Error} - Se dados inválidos ou insuficientes
 */
function calculateBollinger(candles, period = 20, stdDev = 2) {
  // Validação de entrada
  if (!Array.isArray(candles)) {
    throw new Error('Bollinger: candles deve ser um array');
  }

  if (candles.length < period) {
    throw new Error(`Bollinger: são necessários pelo menos ${period} candles, fornecidos ${candles.length}`);
  }

  if (period < 2) {
    throw new Error('Bollinger: período deve ser >= 2');
  }

  if (stdDev <= 0) {
    throw new Error('Bollinger: stdDev deve ser > 0');
  }

  // Validar estrutura dos candles e extrair closes mais recentes
  const closes = [];
  for (let i = candles.length - period; i < candles.length; i++) {
    if (typeof candles[i].close !== 'number' || isNaN(candles[i].close)) {
      throw new Error(`Bollinger: candle[${i}] possui valor 'close' inválido`);
    }
    closes.push(candles[i].close);
  }

  // Obter último preço de fechamento
  const lastClose = candles[candles.length - 1].close;

  // Calcular SMA dos últimos 'period' closes
  const sma = calculateSMA(closes, period);

  // Calcular desvio padrão
  const standardDeviation = calculateStdDeviation(closes, period, sma);

  // Calcular bandas
  const upperBand = sma + (stdDev * standardDeviation);
  const middleBand = sma;
  const lowerBand = sma - (stdDev * standardDeviation);

  // Calcular bandwidth (indicador de squeeze)
  const bandwidth = (upperBand - lowerBand) / middleBand;

  // Detectar sinal com tolerância de 0.5% para "toque" nas bandas
  const tolerance = 0.005;
  let signal;

  // Verificar squeeze (consolidação - preparar para breakout)
  if (bandwidth < 0.02) {
    signal = 'SQUEEZE';
  }
  // Verificar toque na banda inferior (breakout baixa - reversão para cima)
  else if (lastClose <= lowerBand * (1 + tolerance)) {
    signal = 'CALL';
  }
  // Verificar toque na banda superior (breakout alta - reversão para baixo)
  else if (lastClose >= upperBand * (1 - tolerance)) {
    signal = 'PUT';
  }
  // Preço entre bandas
  else {
    signal = 'NEUTRO';
  }

  return {
    upper: Number(upperBand.toFixed(4)),
    middle: Number(middleBand.toFixed(4)),
    lower: Number(lowerBand.toFixed(4)),
    bandwidth: Number(bandwidth.toFixed(4)),
    signal: signal
  };
}

module.exports = { calculateBollinger };
