// ============================================================
// CRON JOB SCHEDULER
// ============================================================
// Initializes and manages all scheduled cron jobs
// Runs automatically when server starts
// ============================================================

import cron from 'node-cron';
import calculateLeaderboards from './calculate-leaderboards.mjs';
import generateDailyQuests, { cleanupExpiredQuests } from './generate-daily-quests.mjs';
import { checkAndNotifyExpiringStreaks } from '../notifications/notification-service.mjs';

/**
 * Initialize all cron jobs
 */
export function initializeCronJobs() {
  console.log('⏰ Initializing cron jobs...');

  try {
    // ===== DAILY JOBS (at 00:00 UTC) =====
    // Runs every day at midnight
    const dailyJob = cron.schedule('0 0 * * *', async () => {
      console.log('\n🌅 Daily cron jobs starting...');

      // 1. Generate daily quests
      await generateDailyQuests();

      // 2. Calculate daily leaderboards
      await calculateLeaderboards();

      // 3. Check for expiring streaks
      await checkAndNotifyExpiringStreaks();

      // 4. Cleanup expired quests
      await cleanupExpiredQuests();

      console.log('✅ Daily cron jobs completed\n');
    });

    console.log('✅ Daily job scheduled (00:00 UTC)');

    // ===== WEEKLY JOB (Monday at 00:00 UTC) =====
    // Runs every Monday at midnight
    // This will be handled by generateDailyQuests (checks day of week)
    console.log('✅ Weekly job scheduled (Monday 00:00 UTC)');

    // ===== STREAK WARNING JOB (every 6 hours) =====
    // Checks for streaks expiring soon
    const streakWarningJob = cron.schedule('0 */6 * * *', async () => {
      console.log('🔔 Running streak expiration check...');
      await checkAndNotifyExpiringStreaks();
    });

    console.log('✅ Streak warning job scheduled (every 6 hours)');

    // ===== HEALTH CHECK (every hour) =====
    // Ensures cron is still running
    const healthCheckJob = cron.schedule('0 * * * *', () => {
      console.log('💓 Cron scheduler health check: OK');
    });

    console.log('✅ Health check job scheduled (hourly)');

    return {
      dailyJob,
      streakWarningJob,
      healthCheckJob,
      status: 'initialized',
    };
  } catch (error) {
    console.error('❌ Error initializing cron jobs:', error);
    return { status: 'failed', error: error.message };
  }
}

/**
 * Manually trigger a cron job (for testing)
 */
export async function manualTrigger(jobName) {
  console.log(`⚡ Manually triggering: ${jobName}`);

  try {
    switch (jobName) {
      case 'leaderboards':
        await calculateLeaderboards();
        break;

      case 'quests':
        await generateDailyQuests();
        break;

      case 'streak-warning':
        await checkAndNotifyExpiringStreaks();
        break;

      case 'cleanup-quests':
        await cleanupExpiredQuests();
        break;

      default:
        return { success: false, error: `Unknown job: ${jobName}` };
    }

    return { success: true, message: `${jobName} completed` };
  } catch (error) {
    console.error(`❌ Error triggering ${jobName}:`, error);
    return { success: false, error: error.message };
  }
}

// Export scheduler
export default {
  initializeCronJobs,
  manualTrigger,
};
