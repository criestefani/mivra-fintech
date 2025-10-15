// SSID Manager - Automatic SSID generation and renewal for Avalon Broker

class SSIDManager {
  constructor() {
    this.ssidCache = new Map(); // userId -> { ssid, expiresAt, renewalTimer }
    this.systemSSID = null;
    this.systemRenewalTimer = null;

    // Configuration from environment variables
    this.AVALON_SESSION_URL = process.env.AVALON_SESSION_URL || 'http://api-qc.avalonbots.com:3000/session';
    this.AVALON_API_TOKEN = process.env.AVALON_API_TOKEN || 'dfc29735b5450651d5c03f4fb6508ed9';
    this.AVALON_SYSTEM_USER_ID = process.env.AVALON_SYSTEM_USER_ID || '183588600';
    this.RENEWAL_INTERVAL = 23 * 60 * 60 * 1000; // 23 hours in milliseconds

    console.log('✅ SSID Manager initialized');
    console.log(`📋 System User ID: ${this.AVALON_SYSTEM_USER_ID}`);
    console.log(`⏰ SSID renewal interval: 23 hours`);
  }

  /**
   * Generate SSID for a user by making POST request to Avalon session endpoint
   */
  async generateSSID(userId) {
    try {
      console.log(`🔐 [SSIDManager] Generating SSID for user: ${userId}`);

      const sessionUrl = `${this.AVALON_SESSION_URL}/${userId}`;

      const response = await fetch(sessionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.AVALON_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [SSIDManager] Failed to generate SSID for ${userId}:`, response.status, errorText);
        throw new Error(`Failed to generate SSID: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const ssid = data.ssid || data.session_id || data.token;

      if (!ssid) {
        console.error(`❌ [SSIDManager] No SSID in response:`, data);
        throw new Error('No SSID returned from Avalon API');
      }

      console.log(`✅ [SSIDManager] SSID generated for user ${userId}: ${ssid.substring(0, 10)}...`);

      return ssid;
    } catch (error) {
      console.error(`❌ [SSIDManager] Error generating SSID for ${userId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get or generate SSID for a user with automatic renewal
   */
  async getSSID(userId) {
    // Check if we have a valid cached SSID
    const cached = this.ssidCache.get(userId);

    if (cached && cached.expiresAt > Date.now()) {
      console.log(`♻️ [SSIDManager] Using cached SSID for user ${userId}`);
      return cached.ssid;
    }

    // Generate new SSID
    const ssid = await this.generateSSID(userId);

    // Cache it with expiration time
    const expiresAt = Date.now() + this.RENEWAL_INTERVAL;

    // Clear old renewal timer if exists
    if (cached?.renewalTimer) {
      clearTimeout(cached.renewalTimer);
    }

    // Setup automatic renewal
    const renewalTimer = setTimeout(() => {
      this.renewSSID(userId);
    }, this.RENEWAL_INTERVAL);

    this.ssidCache.set(userId, {
      ssid,
      expiresAt,
      renewalTimer
    });

    console.log(`💾 [SSIDManager] SSID cached for user ${userId}, expires in 23 hours`);

    return ssid;
  }

  /**
   * Renew SSID for a user (called automatically every 23 hours)
   */
  async renewSSID(userId) {
    try {
      console.log(`🔄 [SSIDManager] Renewing SSID for user ${userId}...`);

      const newSSID = await this.generateSSID(userId);

      const expiresAt = Date.now() + this.RENEWAL_INTERVAL;

      // Setup next renewal
      const renewalTimer = setTimeout(() => {
        this.renewSSID(userId);
      }, this.RENEWAL_INTERVAL);

      this.ssidCache.set(userId, {
        ssid: newSSID,
        expiresAt,
        renewalTimer
      });

      console.log(`✅ [SSIDManager] SSID renewed successfully for user ${userId}`);

      return newSSID;
    } catch (error) {
      console.error(`❌ [SSIDManager] Failed to renew SSID for user ${userId}:`, error.message);

      // Retry renewal in 5 minutes on failure
      setTimeout(() => {
        console.log(`🔁 [SSIDManager] Retrying SSID renewal for user ${userId}...`);
        this.renewSSID(userId);
      }, 5 * 60 * 1000);

      throw error;
    }
  }

  /**
   * Initialize system SSID (used for bot startup and system operations)
   */
  async initializeSystemSSID() {
    try {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`🚀 [SSIDManager] Initializing System SSID`);
      console.log(`📋 System User ID: ${this.AVALON_SYSTEM_USER_ID}`);
      console.log(`${'='.repeat(80)}\n`);

      this.systemSSID = await this.getSSID(this.AVALON_SYSTEM_USER_ID);

      console.log(`✅ [SSIDManager] System SSID initialized successfully`);
      console.log(`🔑 System SSID: ${this.systemSSID.substring(0, 15)}...`);
      console.log(`⏰ Next renewal in 23 hours\n`);

      return this.systemSSID;
    } catch (error) {
      console.error(`❌ [SSIDManager] Failed to initialize system SSID:`, error.message);
      console.error(`⚠️ [SSIDManager] Server will start but Avalon features will be unavailable`);
      console.error(`🔁 [SSIDManager] Will retry SSID generation in 5 minutes...\n`);

      // Retry initialization in 5 minutes
      setTimeout(() => {
        this.initializeSystemSSID();
      }, 5 * 60 * 1000);

      return null;
    }
  }

  /**
   * Get the system SSID (for bot operations)
   */
  getSystemSSID() {
    return this.systemSSID;
  }

  /**
   * Get SSID info for a user (for monitoring/debugging)
   */
  getSSIDInfo(userId) {
    const cached = this.ssidCache.get(userId);

    if (!cached) {
      return {
        exists: false,
        message: 'No SSID cached for this user'
      };
    }

    const now = Date.now();
    const timeUntilExpiry = cached.expiresAt - now;
    const hoursUntilExpiry = (timeUntilExpiry / (60 * 60 * 1000)).toFixed(2);

    return {
      exists: true,
      ssid: cached.ssid.substring(0, 15) + '...',
      expiresAt: new Date(cached.expiresAt).toISOString(),
      hoursUntilExpiry: hoursUntilExpiry,
      isExpired: timeUntilExpiry <= 0
    };
  }

  /**
   * Clear SSID for a user (when user logs out or session ends)
   */
  clearSSID(userId) {
    const cached = this.ssidCache.get(userId);

    if (cached?.renewalTimer) {
      clearTimeout(cached.renewalTimer);
    }

    this.ssidCache.delete(userId);
    console.log(`🗑️ [SSIDManager] SSID cleared for user ${userId}`);
  }

  /**
   * Get stats about cached SSIDs (for monitoring)
   */
  getStats() {
    const activeSSIDs = [];
    const expiredSSIDs = [];
    const now = Date.now();

    for (const [userId, data] of this.ssidCache.entries()) {
      const timeUntilExpiry = data.expiresAt - now;

      if (timeUntilExpiry > 0) {
        activeSSIDs.push({
          userId,
          hoursUntilExpiry: (timeUntilExpiry / (60 * 60 * 1000)).toFixed(2)
        });
      } else {
        expiredSSIDs.push(userId);
      }
    }

    return {
      totalCached: this.ssidCache.size,
      active: activeSSIDs.length,
      expired: expiredSSIDs.length,
      systemSSID: this.systemSSID ? 'active' : 'not initialized',
      activeSSIDs,
      expiredSSIDs
    };
  }

  /**
   * Cleanup expired SSIDs (called periodically)
   */
  cleanupExpiredSSIDs() {
    const now = Date.now();
    let cleaned = 0;

    for (const [userId, data] of this.ssidCache.entries()) {
      if (data.expiresAt < now) {
        this.clearSSID(userId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 [SSIDManager] Cleaned up ${cleaned} expired SSIDs`);
    }

    return cleaned;
  }

  /**
   * Shutdown - clear all timers
   */
  shutdown() {
    console.log('🛑 [SSIDManager] Shutting down...');

    if (this.systemRenewalTimer) {
      clearTimeout(this.systemRenewalTimer);
    }

    for (const [userId, data] of this.ssidCache.entries()) {
      if (data.renewalTimer) {
        clearTimeout(data.renewalTimer);
      }
    }

    this.ssidCache.clear();
    this.systemSSID = null;

    console.log('✅ [SSIDManager] Shutdown complete');
  }
}

// Create singleton instance
const ssidManager = new SSIDManager();

// Setup periodic cleanup (every hour)
setInterval(() => {
  ssidManager.cleanupExpiredSSIDs();
}, 60 * 60 * 1000);

export default ssidManager;
