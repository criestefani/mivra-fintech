/**
 * Quests Store
 * Manages daily/weekly quests and challenges
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ============================================================
// TYPES
// ============================================================

export interface Quest {
  id: string;
  quest_id: string;
  quest_type: 'daily' | 'weekly' | 'special';
  quest_name: string;
  quest_description: string;
  quest_icon: string;
  target_value: number;
  requirement_type: string;
  xp_reward: number;
  is_active: boolean;
  created_at: string;
}

export interface UserQuest {
  id: string;
  user_id: string;
  quest_id: string;
  current_progress: number;
  target_value: number;
  status: 'active' | 'completed' | 'expired';
  started_at: string;
  completed_at: string | null;
  expires_at: string;
  quests: Quest; // Joined data
}

export interface QuestCompletedData {
  quest_id: string;
  quest_name: string;
  xp_reward: number;
}

// ============================================================
// STORE STATE
// ============================================================

interface QuestsState {
  // Quests
  dailyQuests: UserQuest[];
  weeklyQuests: UserQuest[];
  specialQuests: UserQuest[];

  // UI State
  isLoading: boolean;
  error: string | null;

  // Recent Events
  recentQuestCompleted: QuestCompletedData | null;

  // Actions
  setQuests: (quests: UserQuest[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Event triggers
  triggerQuestCompleted: (questData: QuestCompletedData) => void;
  clearQuestEvents: () => void;

  // API Actions
  fetchQuests: (userId: string) => Promise<void>;
  claimQuest: (userId: string, questId: string) => Promise<void>;

  // Reset
  reset: () => void;
}

// ============================================================
// INITIAL STATE
// ============================================================

const initialState = {
  dailyQuests: [],
  weeklyQuests: [],
  specialQuests: [],
  isLoading: false,
  error: null,
  recentQuestCompleted: null,
};

// ============================================================
// STORE
// ============================================================

export const useQuestsStore = create<QuestsState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Setters
      setQuests: (quests) => {
        const daily = quests.filter((q) => q.quests.quest_type === 'daily');
        const weekly = quests.filter((q) => q.quests.quest_type === 'weekly');
        const special = quests.filter((q) => q.quests.quest_type === 'special');

        set({
          dailyQuests: daily,
          weeklyQuests: weekly,
          specialQuests: special,
        });
      },

      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      // Event triggers
      triggerQuestCompleted: (questData) => {
        set({ recentQuestCompleted: questData });
        setTimeout(() => set({ recentQuestCompleted: null }), 5000);
      },

      clearQuestEvents: () => {
        set({ recentQuestCompleted: null });
      },

      // API Actions
      fetchQuests: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`/api/gamification/quests/${userId}`);
          if (!response.ok) {
            throw new Error('Failed to fetch quests');
          }
          const data = await response.json();
          get().setQuests(data);
          set({ isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Unknown error',
            isLoading: false,
          });
        }
      },

      claimQuest: async (userId: string, questId: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/gamification/claim-quest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, questId }),
          });

          if (!response.ok) {
            throw new Error('Failed to claim quest');
          }

          const data = await response.json();

          // Trigger quest completed event
          if (data.success) {
            get().triggerQuestCompleted({
              quest_id: questId,
              quest_name: data.quest_name,
              xp_reward: data.xp_awarded,
            });

            // Refresh quests
            await get().fetchQuests(userId);
          }

          set({ isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Unknown error',
            isLoading: false,
          });
        }
      },

      // Reset
      reset: () => set(initialState),
    }),
    { name: 'QuestsStore' }
  )
);

// ============================================================
// SELECTORS
// ============================================================

export const selectDailyQuests = (state: QuestsState) => state.dailyQuests;
export const selectWeeklyQuests = (state: QuestsState) => state.weeklyQuests;
export const selectSpecialQuests = (state: QuestsState) => state.specialQuests;
export const selectIsLoading = (state: QuestsState) => state.isLoading;
export const selectError = (state: QuestsState) => state.error;

// Computed selectors
export const selectCompletedQuests = (state: QuestsState) => {
  const allQuests = [
    ...state.dailyQuests,
    ...state.weeklyQuests,
    ...state.specialQuests,
  ];
  return allQuests.filter((q) => q.current_progress >= q.target_value);
};

export const selectActiveQuests = (state: QuestsState) => {
  const allQuests = [
    ...state.dailyQuests,
    ...state.weeklyQuests,
    ...state.specialQuests,
  ];
  return allQuests.filter((q) => q.status === 'active');
};

export const selectQuestProgress = (questId: string) => (state: QuestsState) => {
  const allQuests = [
    ...state.dailyQuests,
    ...state.weeklyQuests,
    ...state.specialQuests,
  ];
  const quest = allQuests.find((q) => q.quest_id === questId);
  if (!quest) return 0;
  return Math.round((quest.current_progress / quest.target_value) * 100);
};

export const selectTotalXPFromQuests = (state: QuestsState) => {
  const completed = selectCompletedQuests(state);
  return completed.reduce((sum, q) => sum + q.quests.xp_reward, 0);
};
