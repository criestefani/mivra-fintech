// Lightweight validation helpers mirroring the previous @mivratec/shared schemas

const buildError = (message, path) => ({
  message,
  path: Array.isArray(path) ? path : [path]
})

export function validateSignal(signal) {
  const errors = []

  if (!signal || typeof signal !== 'object') {
    errors.push(buildError('Signal payload must be an object', 'signal'))
  } else {
    if (!signal.asset || typeof signal.asset !== 'string') {
      errors.push(buildError('asset is required', 'asset'))
    }

    if (!signal.direction || !['CALL', 'PUT'].includes(String(signal.direction).toUpperCase())) {
      errors.push(buildError('direction must be CALL or PUT', 'direction'))
    }

    if (typeof signal.confidence !== 'number' || Number.isNaN(signal.confidence)) {
      errors.push(buildError('confidence must be a number', 'confidence'))
    }

    if (!signal.timestamp || Number.isNaN(Number(signal.timestamp))) {
      errors.push(buildError('timestamp must be a valid number/date', 'timestamp'))
    }
  }

  if (errors.length > 0) {
    const error = new Error('Invalid signal payload')
    error.errors = errors
    throw error
  }

  return true
}

export function validatePerformance(performance) {
  const errors = []

  if (!performance || typeof performance !== 'object') {
    errors.push(buildError('Performance payload must be an object', 'performance'))
  } else {
    if (typeof performance.totalTrades !== 'number') {
      errors.push(buildError('totalTrades must be a number', 'totalTrades'))
    }

    if (typeof performance.totalWins !== 'number') {
      errors.push(buildError('totalWins must be a number', 'totalWins'))
    }

    if (typeof performance.totalLosses !== 'number') {
      errors.push(buildError('totalLosses must be a number', 'totalLosses'))
    }

    if (typeof performance.pnl !== 'number') {
      errors.push(buildError('pnl must be a number', 'pnl'))
    }
  }

  if (errors.length > 0) {
    const error = new Error('Invalid performance payload')
    error.errors = errors
    throw error
  }

  return true
}
