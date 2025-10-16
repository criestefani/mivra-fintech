// Health Check Module - System health monitoring

export async function performHealthCheck(context) {
  const { supabase, sdkInstance, botProcess, botStatus } = context;

  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'unknown',
      avalon: 'unknown',
      bot: 'unknown'
    },
    uptime: process.uptime(),
    memory: process.memoryUsage()
  };

  // Check Supabase connection
  try {
    const { error } = await supabase.from('profiles').select('id').limit(1);
    health.services.database = error ? 'unhealthy' : 'healthy';
  } catch (err) {
    health.services.database = 'unhealthy';
  }

  // Check Avalon SDK connection
  health.services.avalon = sdkInstance ? 'healthy' : 'disconnected';

  // Check Bot process
  health.services.bot = (botProcess && !botProcess.killed) ? 'running' : 'stopped';

  // Determine overall status
  if (health.services.database === 'unhealthy') {
    health.status = 'unhealthy';
  } else if (health.services.avalon === 'disconnected') {
    health.status = 'degraded';
  } else {
    health.status = 'healthy';
  }

  return health;
}
