// ============================================
// Bot Control Listener - Real-Time Events
// Replaces polling with Supabase subscriptions
// ============================================

/**
 * Listens for real-time bot control changes
 * Instead of polling every 5 seconds, listens for INSERT/UPDATE/DELETE events
 */
export class BotControlListener {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
    this.subscription = null;
    this.listeners = [];
    this.retryAttempt = 0;
    this.maxRetries = 5;
  }

  /**
   * Register callback for bot control events
   * Callbacks receive: { type: 'START_BOT'|'STOP_BOT', command?, userId?, timestamp }
   */
  onBotCommand(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
    }
  }

  /**
   * Start listening for real-time bot control changes
   * ✅ INSTANT: Events arrive <100ms vs 5s polling delay
   */
  async start() {
    console.log('🔔 Starting real-time bot control listener...');

    try {
      this.subscription = this.supabase
        .channel('bot_control_realtime')
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'bot_control',
            filter: 'status=eq.ACTIVE'
          },
          (payload) => this.handleChange(payload)
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Real-time subscription ACTIVE');
            this.retryAttempt = 0; // Reset retry counter on successful connection
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            console.warn(`⚠️ Subscription ${status}, will retry...`);
            this.retry();
          }
        });
    } catch (error) {
      console.error('❌ Failed to start subscription:', error.message);
      this.retry();
    }
  }

  /**
   * Handle incoming real-time changes
   * ✅ INSTANT callback when status changes to ACTIVE
   */
  async handleChange(payload) {
    try {
      const eventType = payload.eventType;
      console.log(`📡 Bot control event: ${eventType}`);

      // ✅ INSERT or UPDATE → Bot START command
      if (eventType === 'INSERT' || eventType === 'UPDATE') {
        const cmdData = payload.new;

        console.log(`🟢 START command detected for user: ${cmdData.user_id}`);

        // Notify all listeners
        for (const listener of this.listeners) {
          try {
            await listener({
              type: 'START_BOT',
              command: cmdData, // Full command object with config
              timestamp: new Date().toISOString()
            });
          } catch (err) {
            console.error('❌ Listener error:', err.message);
          }
        }
      }

      // ✅ DELETE → Bot STOP command
      if (eventType === 'DELETE') {
        const oldData = payload.old;

        console.log(`🛑 STOP command detected for user: ${oldData.user_id}`);

        // Notify all listeners
        for (const listener of this.listeners) {
          try {
            await listener({
              type: 'STOP_BOT',
              userId: oldData.user_id,
              timestamp: new Date().toISOString()
            });
          } catch (err) {
            console.error('❌ Listener error:', err.message);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error handling change:', error.message);
    }
  }

  /**
   * Retry subscription with exponential backoff
   * Prevents overwhelming database if connection is failing
   */
  async retry(attempt = this.retryAttempt) {
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s...
    const delay = Math.min(1000 * Math.pow(2, attempt), 30000);

    if (attempt >= this.maxRetries) {
      console.error('❌ Max retries reached, giving up');
      return;
    }

    this.retryAttempt = attempt + 1;
    console.log(`⏳ Retrying subscription in ${delay}ms (attempt ${this.retryAttempt}/${this.maxRetries})...`);

    setTimeout(() => this.start(), delay);
  }

  /**
   * Fetch initial ACTIVE commands from database
   * ✅ Safeguard: Gets commands that may have been created before subscription connected
   */
  async getActiveCommands() {
    try {
      console.log('🔍 Fetching initial ACTIVE commands from database...');

      const { data, error } = await this.supabase
        .from('bot_control')
        .select('*')
        .eq('status', 'ACTIVE')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('❌ Failed to fetch active commands:', error.message);
        return [];
      }

      console.log(`✅ Found ${data?.length || 0} ACTIVE commands`);
      return data || [];
    } catch (error) {
      console.error('❌ Unexpected error fetching commands:', error.message);
      return [];
    }
  }

  /**
   * Stop listening to real-time events
   */
  async stop() {
    try {
      if (this.subscription) {
        await this.subscription.unsubscribe();
        console.log('✅ Real-time subscription stopped');
      }
    } catch (error) {
      console.error('⚠️ Error stopping subscription:', error.message);
    }
  }

  /**
   * Check if subscription is currently active
   */
  isActive() {
    return this.subscription !== null;
  }
}
