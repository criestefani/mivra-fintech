/**
 * Aggressive Strategy - Dynamic Hybrid with 4 Advisors
 * ALWAYS OPERATES - Never waits for perfect signals
 * Combines 4 specialized advisors with weighted voting system
 */

/**
 * Advisor 1: Pattern Counter (40% influence)
 * Analyzes last 3 candles and expects reversal
 * Logic: If had too much of one thing, next will be the other
 */
function patternCounterAdvisor(candles) {
  if (candles.length < 3) return null;

  const last3 = candles.slice(-3);
  let bullish = 0;
  let bearish = 0;

  for (const candle of last3) {
    if (candle.close > candle.open) bullish++;
    else if (candle.close < candle.open) bearish++;
  }

  // If 2+ bullish candles, expect bearish reversal
  if (bullish >= 2) {
    const confidence = bullish === 3 ? 80 : 70;
    return { direction: 'PUT', confidence, weight: 0.40 };
  }

  // If 2+ bearish candles, expect bullish reversal
  if (bearish >= 2) {
    const confidence = bearish === 3 ? 80 : 70;
    return { direction: 'CALL', confidence, weight: 0.40 };
  }

  // Mixed pattern - slight bearish bias (market naturally trends down more)
  return { direction: 'PUT', confidence: 55, weight: 0.40 };
}

/**
 * Advisor 2: Moving Average Specialist (30% influence)
 * Compares current price with SMA20 - Mean reversion strategy
 * Logic: Prices always return to the mean
 */
function movingAverageAdvisor(candles) {
  if (candles.length < 20) return null;

  const closes = candles.map(c => c.close);
  const sma20 = closes.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const currentPrice = closes[closes.length - 1];

  const deviation = ((currentPrice - sma20) / sma20) * 100;

  // Price above mean → expect drop
  if (deviation > 0) {
    const confidence = Math.min(50 + Math.abs(deviation) * 10, 85);
    return { direction: 'PUT', confidence, weight: 0.30 };
  }

  // Price below mean → expect rise
  if (deviation < 0) {
    const confidence = Math.min(50 + Math.abs(deviation) * 10, 85);
    return { direction: 'CALL', confidence, weight: 0.30 };
  }

  // Exactly at mean - slight bullish bias
  return { direction: 'CALL', confidence: 52, weight: 0.30 };
}

/**
 * Advisor 3: Gap Hunter (20% influence)
 * Looks for gaps between consecutive candles
 * Logic: Gaps always fill
 */
function gapHunterAdvisor(candles) {
  if (candles.length < 2) return null;

  const lastCandle = candles[candles.length - 1];
  const prevCandle = candles[candles.length - 2];

  const gapUp = lastCandle.open > prevCandle.close;
  const gapDown = lastCandle.open < prevCandle.close;

  const gapSize = Math.abs(lastCandle.open - prevCandle.close);
  const avgPrice = (lastCandle.close + prevCandle.close) / 2;
  const gapPercent = (gapSize / avgPrice) * 100;

  // Gap up → expect fill (price drops)
  if (gapUp) {
    const confidence = Math.min(60 + gapPercent * 20, 90);
    return { direction: 'PUT', confidence, weight: 0.20 };
  }

  // Gap down → expect fill (price rises)
  if (gapDown) {
    const confidence = Math.min(60 + gapPercent * 20, 90);
    return { direction: 'CALL', confidence, weight: 0.20 };
  }

  // No gap - check momentum from last candle
  const lastMomentum = lastCandle.close > lastCandle.open ? 'CALL' : 'PUT';
  return { direction: lastMomentum, confidence: 50, weight: 0.20 };
}

/**
 * Advisor 4: Level Analyst (10% influence)
 * Identifies dynamic support and resistance
 * Uses recent highs and lows to find levels
 */
function levelAnalystAdvisor(candles) {
  if (candles.length < 10) return null;

  const recent = candles.slice(-10);
  const highs = recent.map(c => c.high || c.max || c.close);
  const lows = recent.map(c => c.low || c.min || c.close);

  const resistance = Math.max(...highs);
  const support = Math.min(...lows);
  const currentPrice = recent[recent.length - 1].close;

  const range = resistance - support;
  const distanceToResistance = resistance - currentPrice;
  const distanceToSupport = currentPrice - support;

  // Near resistance → expect drop
  if (distanceToResistance < range * 0.2) {
    const confidence = 60 + (1 - distanceToResistance / (range * 0.2)) * 20;
    return { direction: 'PUT', confidence, weight: 0.10 };
  }

  // Near support → expect rise
  if (distanceToSupport < range * 0.2) {
    const confidence = 60 + (1 - distanceToSupport / (range * 0.2)) * 20;
    return { direction: 'CALL', confidence, weight: 0.10 };
  }

  // In the middle - use recent momentum
  const lastCandle = recent[recent.length - 1];
  const momentum = lastCandle.close > lastCandle.open ? 'CALL' : 'PUT';
  return { direction: momentum, confidence: 55, weight: 0.10 };
}

/**
 * Main Aggressive Strategy - Combines all 4 advisors
 * ALWAYS returns a signal (never null)
 */
export function analyzeAggressive(candles) {
  if (candles.length < 20) {
    // Not enough data - return neutral with slight bias
    return { consensus: 'CALL', confidence: 50, strength: 50, advisors: [] };
  }

  // Normalize candles
  candles = candles.map(c => ({
    ...c,
    high: c.high || c.max || c.close,
    low: c.low || c.min || c.close,
    open: c.open || c.close
  }));

  try {
    // Get opinions from all 4 advisors
    const advisor1 = patternCounterAdvisor(candles);
    const advisor2 = movingAverageAdvisor(candles);
    const advisor3 = gapHunterAdvisor(candles);
    const advisor4 = levelAnalystAdvisor(candles);

    const advisors = [advisor1, advisor2, advisor3, advisor4].filter(a => a !== null);

    if (advisors.length === 0) {
      return { consensus: 'CALL', confidence: 50, strength: 50, advisors: [] };
    }

    // Calculate weighted votes
    let callScore = 0;
    let putScore = 0;

    for (const advisor of advisors) {
      const weightedConfidence = advisor.confidence * advisor.weight;

      if (advisor.direction === 'CALL') {
        callScore += weightedConfidence;
      } else {
        putScore += weightedConfidence;
      }
    }

    // Determine final direction
    const consensus = callScore > putScore ? 'CALL' : 'PUT';
    const confidence = Math.round(Math.max(callScore, putScore));
    const strength = confidence;

    return {
      consensus,
      confidence,
      strength,
      advisors: advisors.map(a => ({
        direction: a.direction,
        confidence: a.confidence,
        weight: a.weight * 100
      })),
      scores: {
        call: Math.round(callScore),
        put: Math.round(putScore)
      }
    };
  } catch (err) {
    // Even on error, return a signal (never stop operating)
    console.error('Error in aggressive strategy:', err);
    return { consensus: 'CALL', confidence: 50, strength: 50, advisors: [] };
  }
}
