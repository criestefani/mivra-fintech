// Bot WebSocket Module - Real-time trading events

export function setupBotWebSocket(io) {
  const botNamespace = io.of('/bot');

  botNamespace.on('connection', (socket) => {
    console.log('🤖 Bot client connected:', socket.id);

    socket.emit('connected', {
      message: 'Connected to bot WebSocket',
      timestamp: new Date().toISOString()
    });

    // Handle bot events
    socket.on('bot:trade', (tradeData) => {
      console.log('📊 Trade event received:', tradeData);
      botNamespace.emit('trade:new', tradeData);
    });

    socket.on('bot:signal', (signalData) => {
      console.log('📡 Signal event received:', signalData);
      botNamespace.emit('signal:new', signalData);
    });

    socket.on('disconnect', () => {
      console.log('❌ Bot client disconnected:', socket.id);
    });
  });

  console.log('✅ Bot WebSocket namespace initialized');
  return botNamespace;
}
