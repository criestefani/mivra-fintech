// Admin WebSocket Module - Real-time admin dashboard updates

export function setupAdminWebSocket(io, supabase, getMetricsContext) {
  const adminNamespace = io.of('/admin');

  adminNamespace.on('connection', (socket) => {
    console.log('🔌 Admin connected:', socket.id);

    // Send initial metrics
    socket.emit('connected', {
      message: 'Connected to admin dashboard',
      timestamp: new Date().toISOString()
    });

    // Handle admin requests
    socket.on('request:metrics', async () => {
      const context = getMetricsContext();
      const health = {
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      };
      socket.emit('metrics:update', health);
    });

    socket.on('disconnect', () => {
      console.log('❌ Admin disconnected:', socket.id);
    });
  });

  // Periodic metrics broadcast
  setInterval(async () => {
    const context = getMetricsContext();
    adminNamespace.emit('metrics:update', {
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  }, 5000);

  console.log('✅ Admin WebSocket namespace initialized');
  return adminNamespace;
}
