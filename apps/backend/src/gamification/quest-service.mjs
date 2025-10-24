// ============================================================
// QUEST SERVICE - CORE QUEST LOGIC
// ============================================================
// Handles quest invitations, acceptance, progress tracking,
// completion, and reward claiming
// ============================================================

import { getQuestById, getAllQuests } from './quest-catalog.mjs';
import { awardXP } from './gamification-service.mjs';

/**
 * Invite quests to user
 * Status: 'invited' (pending user acceptance)
 */
export async function inviteQuestsToUser(supabase, userId, questIds = null) {
  try {
    console.log(`🎁 Inviting quests to user ${userId}`);

    // Get specific quests or all quests
    const quests = questIds
      ? getAllQuests().filter(q => questIds.includes(q.quest_id))
      : getAllQuests().filter(q => q.requires_acceptance);

    if (!quests || quests.length === 0) {
      return { success: true, invited: 0 };
    }

    const now = new Date();
    const userQuests = [];

    for (const quest of quests) {
      // Calculate expiration based on quest type
      const expiresAt = new Date(now);
      if (quest.quest_type === 'daily') {
        expiresAt.setDate(expiresAt.getDate() + 1);
      } else if (quest.quest_type === 'weekly') {
        expiresAt.setDate(expiresAt.getDate() + 7);
      } else if (quest.time_limit_minutes) {
        expiresAt.setMinutes(expiresAt.getMinutes() + quest.time_limit_minutes);
      } else {
        expiresAt.setDate(expiresAt.getDate() + 30); // Default 30 days
      }

      userQuests.push({
        user_id: userId,
        quest_id: quest.quest_id,
        current_progress: 0,
        target_value: quest.target_value,
        status: 'invited', // INVITATION STATUS
        started_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      });
    }

    // Insert quests (ignore conflicts for repeat quests)
    const { data, error } = await supabase
      .from('user_quests')
      .insert(userQuests)
      .select();

    if (error && error.code !== 'PGRST103') {
      // PGRST103 = unique constraint violation (expected for repeats)
      throw error;
    }

    console.log(`✅ Invited ${userQuests.length} quests to ${userId}`);
    return { success: true, invited: userQuests.length };
  } catch (error) {
    console.error('❌ Error inviting quests:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Accept a quest invitation
 * Status: 'invited' → 'active'
 */
export async function acceptQuest(supabase, userId, questId) {
  try {
    console.log(`✅ User ${userId} accepting quest ${questId}`);

    const now = new Date();

    const { data, error } = await supabase
      .from('user_quests')
      .update({
        status: 'active',
        accepted_at: now.toISOString(),
      })
      .eq('user_id', userId)
      .eq('quest_id', questId)
      .eq('status', 'invited')
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return { success: false, error: 'Quest not found or already accepted' };
    }

    console.log(`✅ Quest ${questId} accepted and now active`);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error accepting quest:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Reject a quest invitation
 * Status: 'invited' → 'rejected'
 */
export async function rejectQuest(supabase, userId, questId) {
  try {
    console.log(`❌ User ${userId} rejecting quest ${questId}`);

    const now = new Date();

    const { data, error } = await supabase
      .from('user_quests')
      .update({
        status: 'rejected',
        rejected_at: now.toISOString(),
      })
      .eq('user_id', userId)
      .eq('quest_id', questId)
      .eq('status', 'invited')
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ Quest ${questId} rejected`);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error rejecting quest:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update quest progress
 * Tracks requirement fulfillment for a quest
 */
export async function updateQuestProgress(supabase, userId, requirementType, value = 1) {
  try {
    console.log(`📊 Updating progress for ${userId}: ${requirementType} +${value}`);

    // Get all active quests for this user that match the requirement
    const { data: userQuests, error: questError } = await supabase
      .from('user_quests')
      .select('*, quests(*)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString());

    if (questError) throw questError;

    if (!userQuests || userQuests.length === 0) {
      return { success: true, updated: 0 };
    }

    let updated = 0;
    const now = new Date();

    // Filter quests matching this requirement type
    const matchingQuests = userQuests.filter(
      uq => uq.quests?.requirement_type === requirementType
    );

    for (const userQuest of matchingQuests) {
      // Update progress
      let newProgress = userQuest.current_progress + value;

      // Cap at target value
      if (newProgress > userQuest.target_value) {
        newProgress = userQuest.target_value;
      }

      // Update in database
      const { error: updateError } = await supabase
        .from('user_quests')
        .update({
          current_progress: newProgress,
          updated_at: now.toISOString(),
        })
        .eq('id', userQuest.id);

      if (updateError) {
        console.error(`⚠️ Error updating quest ${userQuest.quest_id}:`, updateError);
      } else {
        updated++;

        // Log progress event
        await logQuestEvent(supabase, userId, userQuest.quest_id, 'progress', {
          current_progress: newProgress,
          target_value: userQuest.target_value,
          requirement_type: requirementType,
        });

        // Check if completed
        if (newProgress >= userQuest.target_value) {
          console.log(`🎉 Quest ${userQuest.quest_id} COMPLETED for ${userId}`);
          await completeQuest(supabase, userId, userQuest.quest_id);
        }
      }
    }

    console.log(`✅ Updated ${updated} quests`);
    return { success: true, updated };
  } catch (error) {
    console.error('❌ Error updating quest progress:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Mark quest as completed
 * Status: 'active' → 'completed'
 */
export async function completeQuest(supabase, userId, questId) {
  try {
    const now = new Date();

    const { data, error } = await supabase
      .from('user_quests')
      .update({
        status: 'completed',
        completed_at: now.toISOString(),
      })
      .eq('user_id', userId)
      .eq('quest_id', questId)
      .eq('status', 'active')
      .select()
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (data) {
      console.log(`✅ Quest ${questId} marked as completed`);
      await logQuestEvent(supabase, userId, questId, 'completed', {});
    }

    return { success: true, data };
  } catch (error) {
    console.error('❌ Error completing quest:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Claim quest reward
 * Status: 'completed' → 'claimed'
 * Awards XP and temporary rewards
 */
export async function claimQuestReward(supabase, userId, questId) {
  try {
    console.log(`🏆 Claiming reward for quest ${questId} for user ${userId}`);

    // Get quest details
    const { data: userQuest, error: questError } = await supabase
      .from('user_quests')
      .select('*, quests(*)')
      .eq('user_id', userId)
      .eq('quest_id', questId)
      .eq('status', 'completed')
      .single();

    if (questError || !userQuest) {
      return { success: false, error: 'Quest not found or not completed' };
    }

    const questData = userQuest.quests;
    const now = new Date();

    // Award XP
    const xpResult = await awardXP(supabase, userId, questData.xp_reward, 'quest_completion', {
      quest_id: questId,
      quest_name: questData.quest_name,
    });

    if (!xpResult.success) {
      throw new Error(`Failed to award XP: ${xpResult.error}`);
    }

    // Grant temporary reward if applicable
    let temporaryReward = null;
    if (questData.reward_type !== 'xp' && questData.reward_type !== 'early_access') {
      temporaryReward = await activateTemporaryReward(
        supabase,
        userId,
        questId,
        questData.reward_type,
        questData.reward_value,
        questData.reward_duration_hours
      );
    }

    // Mark quest as claimed
    await supabase
      .from('user_quests')
      .update({
        status: 'claimed',
        reward_claimed_at: now.toISOString(),
      })
      .eq('id', userQuest.id);

    console.log(`✅ Reward claimed for quest ${questId}: +${questData.xp_reward} XP`);
    await logQuestEvent(supabase, userId, questId, 'claimed', {
      xp_awarded: questData.xp_reward,
      reward_type: questData.reward_type,
    });

    return {
      success: true,
      xp_awarded: questData.xp_reward,
      quest_name: questData.quest_name,
      level_up: xpResult.data?.leveled_up || false,
      temporary_reward: temporaryReward,
    };
  } catch (error) {
    console.error('❌ Error claiming quest reward:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Activate temporary reward (scanner unlock, XP boost, etc)
 */
export async function activateTemporaryReward(
  supabase,
  userId,
  questId,
  rewardType,
  rewardValue,
  durationHours
) {
  try {
    const grantedAt = new Date();
    const expiresAt = new Date(grantedAt);
    expiresAt.setHours(expiresAt.getHours() + durationHours);

    const { data, error } = await supabase
      .from('quest_rewards_granted')
      .insert({
        user_id: userId,
        quest_id: questId,
        reward_type: rewardType,
        reward_value: rewardValue,
        granted_at: grantedAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        is_active: true,
      })
      .select()
      .single();

    if (error && error.code !== 'PGRST103') {
      // Unique constraint violation means reward already granted
      throw error;
    }

    console.log(`✅ Temporary reward activated: ${rewardType} = ${rewardValue} (${durationHours}h)`);
    return {
      reward_type: rewardType,
      reward_value: rewardValue,
      expires_at: expiresAt.toISOString(),
    };
  } catch (error) {
    console.error('⚠️ Error activating temporary reward:', error);
    return null;
  }
}

/**
 * Get user's active quests
 */
export async function getUserActiveQuests(supabase, userId) {
  try {
    const { data, error } = await supabase
      .from('user_quests')
      .select('*, quests(*)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, quests: data || [] };
  } catch (error) {
    console.error('❌ Error getting active quests:', error);
    return { success: false, error: error.message, quests: [] };
  }
}

/**
 * Get user's invited quests (pending acceptance)
 */
export async function getUserInvitedQuests(supabase, userId) {
  try {
    const { data, error } = await supabase
      .from('user_quests')
      .select('*, quests(*)')
      .eq('user_id', userId)
      .eq('status', 'invited')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, quests: data || [] };
  } catch (error) {
    console.error('❌ Error getting invited quests:', error);
    return { success: false, error: error.message, quests: [] };
  }
}

/**
 * Get user's completed quests (ready to claim)
 */
export async function getUserCompletedQuests(supabase, userId) {
  try {
    const { data, error } = await supabase
      .from('user_quests')
      .select('*, quests(*)')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false });

    if (error) throw error;

    return { success: true, quests: data || [] };
  } catch (error) {
    console.error('❌ Error getting completed quests:', error);
    return { success: false, error: error.message, quests: [] };
  }
}

/**
 * Get user's active temporary rewards
 */
export async function getUserActiveRewards(supabase, userId) {
  try {
    const { data, error } = await supabase
      .from('quest_rewards_granted')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString());

    if (error) throw error;

    return { success: true, rewards: data || [] };
  } catch (error) {
    console.error('❌ Error getting active rewards:', error);
    return { success: false, error: error.message, rewards: [] };
  }
}

/**
 * Log quest event for analytics
 */
async function logQuestEvent(supabase, userId, questId, eventType, metadata) {
  try {
    await supabase.from('quest_events').insert({
      user_id: userId,
      quest_id: questId,
      event_type: eventType,
      metadata,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('⚠️ Error logging quest event:', error);
  }
}

/**
 * Clean up expired quests
 */
export async function cleanupExpiredQuests(supabase) {
  try {
    const now = new Date();

    const { error } = await supabase
      .from('user_quests')
      .update({ status: 'expired' })
      .eq('status', 'active')
      .lt('expires_at', now.toISOString());

    if (error) throw error;

    console.log('✅ Cleaned up expired quests');
    return { success: true };
  } catch (error) {
    console.error('❌ Error cleaning up expired quests:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Clean up expired temporary rewards
 */
export async function cleanupExpiredRewards(supabase) {
  try {
    const now = new Date();

    const { error } = await supabase
      .from('quest_rewards_granted')
      .update({ is_active: false })
      .eq('is_active', true)
      .lt('expires_at', now.toISOString());

    if (error) throw error;

    console.log('✅ Cleaned up expired rewards');
    return { success: true };
  } catch (error) {
    console.error('❌ Error cleaning up expired rewards:', error);
    return { success: false, error: error.message };
  }
}
