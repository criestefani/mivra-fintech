// Alerts Module - Alert management system
const alerts = {
  create: (message, severity = 'info') => {
    console.log(`[ALERT] [${severity.toUpperCase()}] ${message}`);
    return { id: Date.now(), message, severity, timestamp: new Date().toISOString() };
  },
  getAll: () => [],
  clear: () => console.log('[ALERTS] Cleared')
};

export default alerts;
