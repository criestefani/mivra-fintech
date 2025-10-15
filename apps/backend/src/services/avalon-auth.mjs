// Avalon Auth Service - SSID generation and session management

class AvalonAuthService {
  constructor() {
    this.sessions = new Map(); // userId -> { ssid, avalonUserId, balance, sessionId, timestamp }
  }

  /**
   * Generate and validate SSID for a user
   */
  async generateSSIDForUser(userId, avalonCredentials) {
    try {
      const { ssid, avalonUserId } = avalonCredentials;

      console.log(`🔐 [AvalonAuth] Generating SSID for user ${userId}`);
      console.log(`📋 [AvalonAuth] Avalon User ID: ${avalonUserId}`);

      // Store session
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const session = {
        ssid,
        avalonUserId,
        balance: 0,
        currency: 'USD',
        sessionId,
        timestamp: new Date().toISOString()
      };

      this.sessions.set(userId, session);

      console.log(`✅ [AvalonAuth] SSID generated successfully for ${userId}`);

      return {
        success: true,
        ssid,
        avalonUserId,
        balance: session.balance,
        currency: session.currency,
        sessionId
      };
    } catch (error) {
      console.error(`❌ [AvalonAuth] Error generating SSID:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate an existing SSID
   */
  async validateSSID(userId, ssid) {
    try {
      const session = this.sessions.get(userId);

      if (!session) {
        return {
          valid: false,
          error: 'Session not found'
        };
      }

      if (session.ssid !== ssid) {
        return {
          valid: false,
          error: 'SSID mismatch'
        };
      }

      // Check if session is expired (24 hours)
      const sessionAge = Date.now() - new Date(session.timestamp).getTime();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      if (sessionAge > maxAge) {
        this.sessions.delete(userId);
        return {
          valid: false,
          error: 'SSID expired'
        };
      }

      return {
        valid: true,
        session
      };
    } catch (error) {
      console.error(`❌ [AvalonAuth] Error validating SSID:`, error.message);
      return {
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Get session statistics for a user
   */
  async getSessionStats(userId) {
    const session = this.sessions.get(userId);

    if (!session) {
      return null;
    }

    const sessionAge = Date.now() - new Date(session.timestamp).getTime();

    return {
      userId,
      ssid: session.ssid,
      avalonUserId: session.avalonUserId,
      balance: session.balance,
      currency: session.currency,
      sessionId: session.sessionId,
      createdAt: session.timestamp,
      ageMs: sessionAge,
      ageHours: (sessionAge / (60 * 60 * 1000)).toFixed(2)
    };
  }

  /**
   * Close a user's session
   */
  async closeSession(userId) {
    try {
      const deleted = this.sessions.delete(userId);

      if (deleted) {
        console.log(`✅ [AvalonAuth] Session closed for ${userId}`);
        return {
          success: true,
          message: 'Session closed successfully'
        };
      } else {
        return {
          success: false,
          error: 'Session not found'
        };
      }
    } catch (error) {
      console.error(`❌ [AvalonAuth] Error closing session:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get all active sessions (for admin monitoring)
   */
  getAllSessions() {
    const sessions = [];
    for (const [userId, session] of this.sessions.entries()) {
      sessions.push({
        userId,
        ...session
      });
    }
    return sessions;
  }
}

const avalonAuthService = new AvalonAuthService();

console.log('✅ Avalon Auth Service initialized');

export default avalonAuthService;
