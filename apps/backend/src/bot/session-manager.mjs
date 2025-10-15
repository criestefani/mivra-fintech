// Session Manager - Multi-user bot session management (FASE 3)

class SessionManager {
  constructor() {
    this.sessions = new Map(); // userId -> { status, config, startTime, stats }
  }

  /**
   * Start a bot session for a specific user
   */
  async startUserSession(userId, config = {}) {
    try {
      console.log(`🚀 [SessionManager] Starting session for user ${userId}`);

      // Check if session already exists
      if (this.sessions.has(userId)) {
        console.warn(`⚠️ [SessionManager] Session already exists for ${userId}`);
        return {
          success: false,
          error: 'Session already running for this user'
        };
      }

      // Create new session
      const session = {
        userId,
        status: 'running',
        config,
        startTime: new Date().toISOString(),
        stats: {
          trades: 0,
          wins: 0,
          losses: 0,
          profit: 0
        }
      };

      this.sessions.set(userId, session);

      console.log(`✅ [SessionManager] Session started for ${userId}`);

      return {
        success: true,
        message: 'Bot session started successfully',
        session: {
          userId: session.userId,
          status: session.status,
          startTime: session.startTime
        }
      };
    } catch (error) {
      console.error(`❌ [SessionManager] Error starting session:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Stop a user's bot session
   */
  async stopUserSession(userId) {
    try {
      console.log(`🛑 [SessionManager] Stopping session for user ${userId}`);

      if (!this.sessions.has(userId)) {
        return {
          success: false,
          error: 'No active session found for this user'
        };
      }

      const session = this.sessions.get(userId);
      this.sessions.delete(userId);

      console.log(`✅ [SessionManager] Session stopped for ${userId}`);

      return {
        success: true,
        message: 'Bot session stopped successfully',
        stats: session.stats
      };
    } catch (error) {
      console.error(`❌ [SessionManager] Error stopping session:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get session status for a user
   */
  getUserSessionStatus(userId) {
    const session = this.sessions.get(userId);

    if (!session) {
      return {
        active: false,
        message: 'No active session'
      };
    }

    const uptime = Date.now() - new Date(session.startTime).getTime();

    return {
      active: true,
      status: session.status,
      startTime: session.startTime,
      uptimeMs: uptime,
      uptimeMinutes: (uptime / (60 * 1000)).toFixed(2),
      stats: session.stats
    };
  }

  /**
   * Pause a user's session
   */
  async pauseUserSession(userId) {
    try {
      const session = this.sessions.get(userId);

      if (!session) {
        return {
          success: false,
          error: 'No active session found'
        };
      }

      session.status = 'paused';
      session.pausedAt = new Date().toISOString();

      console.log(`⏸️ [SessionManager] Session paused for ${userId}`);

      return {
        success: true,
        message: 'Session paused successfully'
      };
    } catch (error) {
      console.error(`❌ [SessionManager] Error pausing session:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Resume a paused session
   */
  async resumeUserSession(userId) {
    try {
      const session = this.sessions.get(userId);

      if (!session) {
        return {
          success: false,
          error: 'No session found'
        };
      }

      if (session.status !== 'paused') {
        return {
          success: false,
          error: 'Session is not paused'
        };
      }

      session.status = 'running';
      session.resumedAt = new Date().toISOString();

      console.log(`▶️ [SessionManager] Session resumed for ${userId}`);

      return {
        success: true,
        message: 'Session resumed successfully'
      };
    } catch (error) {
      console.error(`❌ [SessionManager] Error resuming session:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get all active sessions
   */
  getActiveSessions() {
    const sessions = [];
    for (const [userId, session] of this.sessions.entries()) {
      sessions.push({
        userId,
        status: session.status,
        startTime: session.startTime,
        stats: session.stats
      });
    }
    return sessions;
  }

  /**
   * Get global statistics
   */
  getGlobalStats() {
    let totalTrades = 0;
    let totalWins = 0;
    let totalLosses = 0;
    let totalProfit = 0;

    for (const session of this.sessions.values()) {
      totalTrades += session.stats.trades;
      totalWins += session.stats.wins;
      totalLosses += session.stats.losses;
      totalProfit += session.stats.profit;
    }

    return {
      activeSessions: this.sessions.size,
      totalTrades,
      totalWins,
      totalLosses,
      totalProfit,
      winRate: totalTrades > 0 ? ((totalWins / totalTrades) * 100).toFixed(2) : '0.00'
    };
  }

  /**
   * Stop all sessions (admin only)
   */
  async stopAllSessions() {
    try {
      const count = this.sessions.size;
      this.sessions.clear();

      console.log(`🛑 [SessionManager] All sessions stopped (${count} sessions)`);

      return {
        success: true,
        message: `Stopped ${count} sessions`,
        count
      };
    } catch (error) {
      console.error(`❌ [SessionManager] Error stopping all sessions:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Cleanup inactive sessions
   */
  async cleanup() {
    try {
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      let cleaned = 0;

      for (const [userId, session] of this.sessions.entries()) {
        const age = now - new Date(session.startTime).getTime();
        if (age > maxAge) {
          this.sessions.delete(userId);
          cleaned++;
        }
      }

      console.log(`🧹 [SessionManager] Cleanup complete: ${cleaned} sessions removed`);

      return {
        cleaned,
        remaining: this.sessions.size
      };
    } catch (error) {
      console.error(`❌ [SessionManager] Cleanup error:`, error.message);
      return {
        cleaned: 0,
        error: error.message
      };
    }
  }
}

const sessionManager = new SessionManager();

console.log('✅ Session Manager initialized');

export default sessionManager;
