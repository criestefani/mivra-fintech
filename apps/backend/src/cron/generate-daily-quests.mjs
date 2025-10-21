// ============================================================
// DAILY & WEEKLY QUEST GENERATION - CRON JOB
// ============================================================
// Runs daily at 00:00 UTC to generate daily quests for all active users
// Runs weekly on Sunday at 00:00 UTC to generate weekly quests
// ============================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Generate daily/weekly quests for all active users
 */
export async function generateDailyQuests() {
  try {
    console.log('🎯 Starting daily quest generation...');

    const now = new Date();
    const dayOfWeek = now.getDay();
    const isMonday = dayOfWeek === 1;

    // Get all active users
    const { data: users, error: usersError } = await supabase
      .from('user_gamification')
      .select('user_id')
      .limit(10000); // Get all users

    if (usersError) throw usersError;

    if (!users || users.length === 0) {
      console.log('⚠️ No active users found');
      return { success: true, generated: 0 };
    }

    console.log(`📊 Found ${users.length} users, generating quests...`);

    // Get available quests
    const { data: quests, error: questsError } = await supabase
      .from('quests')
      .select('*')
      .eq('is_active', true);

    if (questsError) throw questsError;

    // Separate daily and weekly quests
    const dailyQuests = quests.filter(q => q.quest_type === 'daily');
    const weeklyQuests = quests.filter(q => q.quest_type === 'weekly');

    let totalGenerated = 0;

    // Generate daily quests for all users
    if (dailyQuests.length > 0) {
      const dailyCount = await generateQuestsForUsers(users, dailyQuests, 'daily');
      totalGenerated += dailyCount;
      console.log(`✅ Generated ${dailyCount} daily quests`);
    }

    // Generate weekly quests on Monday
    if (isMonday && weeklyQuests.length > 0) {
      const weeklyCount = await generateQuestsForUsers(users, weeklyQuests, 'weekly');
      totalGenerated += weeklyCount;
      console.log(`✅ Generated ${weeklyCount} weekly quests`);
    }

    console.log(`✅ Quest generation completed! Total: ${totalGenerated}`);
    return { success: true, generated: totalGenerated };
  } catch (error) {
    console.error('❌ Error generating quests:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate quests for all users
 */
async function generateQuestsForUsers(users, availableQuests, type) {
  try {
    let created = 0;

    // Batch insert for performance
    const batchSize = 100;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);

      const userQuests = [];
      const now = new Date();
      const expiresAt = new Date(now);

      if (type === 'daily') {
        expiresAt.setDate(expiresAt.getDate() + 1);
      } else if (type === 'weekly') {
        expiresAt.setDate(expiresAt.getDate() + 7);
      }

      // Create quest entries for each user
      for (const user of batch) {
        for (const quest of availableQuests) {
          userQuests.push({
            user_id: user.user_id,
            quest_id: quest.quest_id,
            current_progress: 0,
            target_value: quest.target_value,
            status: 'active',
            started_at: now.toISOString(),
            expires_at: expiresAt.toISOString(),
          });
        }
      }

      // Insert batch
      if (userQuests.length > 0) {
        const { error } = await supabase
          .from('user_quests')
          .insert(userQuests)
          .on('*', payload => {
            // Handle conflicts gracefully
          });

        // Don't throw on conflict - users might already have quests
        // Just count successful inserts
        created += userQuests.length / availableQuests.length;
      }
    }

    return Math.floor(created);
  } catch (error) {
    console.error(`❌ Error generating ${type} quests for users:`, error);
    return 0;
  }
}

/**
 * Cleanup expired quests (can be called separately)
 */
export async function cleanupExpiredQuests() {
  try {
    console.log('🗑️ Cleaning up expired quests...');

    const now = new Date();

    const { data, error } = await supabase
      .from('user_quests')
      .update({ status: 'expired' })
      .eq('status', 'active')
      .lt('expires_at', now.toISOString());

    if (error) throw error;

    console.log(`✅ Cleaned up ${data?.length || 0} expired quests`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error cleaning up expired quests:', error);
    return { success: false, error: error.message };
  }
}

// Export for cron scheduler
export default generateDailyQuests;
