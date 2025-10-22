-- ============================================================
-- PATCH: Fix Missing Foreign Key in user_quests Table
-- ============================================================
-- This patch adds the missing foreign key relationship between
-- user_quests.quest_id and quests.quest_id
--
-- The Supabase client cannot use .select('*, quests(*)') syntax
-- without a proper foreign key constraint defined in the schema.
--
-- Apply this patch by copying and running in Supabase SQL Editor:
-- https://app.supabase.com/project/[YOUR_PROJECT]/sql/new
-- ============================================================

DO $$
BEGIN
  -- Try to drop existing constraint first (in case of re-runs)
  ALTER TABLE user_quests DROP CONSTRAINT IF EXISTS fk_user_quests_quest_id;

  -- Add the foreign key constraint
  ALTER TABLE user_quests
  ADD CONSTRAINT fk_user_quests_quest_id
  FOREIGN KEY (quest_id) REFERENCES quests(quest_id) ON DELETE RESTRICT;

  RAISE NOTICE '✅ Foreign key constraint added successfully!';
  RAISE NOTICE '📝 Now user_quests is properly linked to quests table';
  RAISE NOTICE '🎮 Quests endpoint should work without PGRST200 errors';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '⚠️ Error applying patch: %', SQLERRM;
  RAISE NOTICE '💡 The constraint may already exist or there is a schema issue';
  RAISE NOTICE '👉 Check Supabase documentation: https://supabase.com/docs/guides/database/foreign-keys';
END $$;

-- Verify the constraint was added
SELECT
  constraint_name,
  table_name,
  column_name
FROM information_schema.key_column_usage
WHERE table_name = 'user_quests' AND column_name = 'quest_id'
LIMIT 1;
