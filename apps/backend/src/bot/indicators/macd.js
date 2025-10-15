/**
 * MACD (Moving Average Convergence Divergence) Indicator
 * Indicador de momentum baseado em EMAs
 *
 * @module indicators/macd
 */

/**
 * Calcula a EMA (Exponential Moving Average)
 *
 * @param {Array<number>} values - Array de valores (closes)
 * @param {number} period - Período da EMA
 * @returns {Array<number>} - Array de valores EMA
 */
function calculateEMA(values, period) {
  const emaValues = [];
  const multiplier = 2 / (period + 1);

  // Primeira EMA = SMA dos primeiros 'period' valores
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += values[i];
  }
  let ema = sum / period;
  emaValues.push(ema);

  // Calcular EMAs seguintes
  for (let i = period; i < values.length; i++) {
    ema = (values[i] - ema) * multiplier + ema;
    emaValues.push(ema);
  }

  return emaValues;
}

/**
 * Calcula o MACD (Moving Average Convergence Divergence)
 *
 * @param {Array<Object>} candles - Array de velas com propriedades: open, high, low, close, timestamp
 * @param {number} fastPeriod - Período da EMA rápida (padrão: 12)
 * @param {number} slowPeriod - Período da EMA lenta (padrão: 26)
 * @param {number} signalPeriod - Período da linha de sinal (padrão: 9)
 * @returns {Object} - { macd, signal, histogram, trend }
 * @throws {Error} - Se dados inválidos ou insuficientes
 */
function calculateMACD(candles, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  // Validação de entrada
  if (!Array.isArray(candles)) {
    throw new Error('MACD: candles deve ser um array');
  }

  const minCandles = slowPeriod + signalPeriod;
  if (candles.length < minCandles) {
    throw new Error(`MACD: são necessários pelo menos ${minCandles} candles, fornecidos ${candles.length}`);
  }

  if (fastPeriod >= slowPeriod) {
    throw new Error('MACD: fastPeriod deve ser menor que slowPeriod');
  }

  if (fastPeriod < 2 || slowPeriod < 2 || signalPeriod < 2) {
    throw new Error('MACD: todos os períodos devem ser >= 2');
  }

  // Validar estrutura dos candles e extrair closes
  const closes = [];
  for (let i = 0; i < candles.length; i++) {
    if (typeof candles[i].close !== 'number' || isNaN(candles[i].close)) {
      throw new Error(`MACD: candle[${i}] possui valor 'close' inválido`);
    }
    closes.push(candles[i].close);
  }

  // Calcular EMA rápida (12 períodos)
  const fastEMA = calculateEMA(closes, fastPeriod);

  // Calcular EMA lenta (26 períodos)
  // Ajustar índice para alinhar com fastEMA
  const slowCloses = closes.slice(slowPeriod - fastPeriod);
  const slowEMA = calculateEMA(closes, slowPeriod);

  // Calcular linha MACD (diferença entre EMAs)
  // Alinhar arrays - slowEMA é mais curto devido ao período maior
  const macdLine = [];
  const offset = slowPeriod - fastPeriod;

  for (let i = 0; i < slowEMA.length; i++) {
    const macdValue = fastEMA[i + offset] - slowEMA[i];
    macdLine.push(macdValue);
  }

  // Calcular linha de sinal (EMA9 do MACD)
  const signalLine = calculateEMA(macdLine, signalPeriod);

  // Obter valores mais recentes
  const currentMACD = macdLine[macdLine.length - 1];
  const currentSignal = signalLine[signalLine.length - 1];
  const currentHistogram = currentMACD - currentSignal;

  // Calcular histograma anterior para detectar tendência
  let previousHistogram = 0;
  if (signalLine.length >= 2) {
    const previousMACD = macdLine[macdLine.length - 2];
    const previousSignal = signalLine[signalLine.length - 2];
    previousHistogram = previousMACD - previousSignal;
  }

  // Determinar trend baseado em cruzamentos
  let trend;

  // CALL: histograma positivo e crescente (MACD cruza acima de Signal)
  if (currentHistogram > 0 && currentHistogram > previousHistogram) {
    trend = 'CALL';
  }
  // PUT: histograma negativo e decrescente (MACD cruza abaixo de Signal)
  else if (currentHistogram < 0 && currentHistogram < previousHistogram) {
    trend = 'PUT';
  }
  // Cruzamento bullish (de negativo para positivo)
  else if (previousHistogram < 0 && currentHistogram > 0) {
    trend = 'CALL';
  }
  // Cruzamento bearish (de positivo para negativo)
  else if (previousHistogram > 0 && currentHistogram < 0) {
    trend = 'PUT';
  }
  // Zona neutra
  else {
    trend = 'NEUTRO';
  }

  return {
    macd: Number(currentMACD.toFixed(4)),
    signal: Number(currentSignal.toFixed(4)),
    histogram: Number(currentHistogram.toFixed(4)),
    trend: trend
  };
}

module.exports = { calculateMACD };
