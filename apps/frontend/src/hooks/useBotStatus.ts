import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BotStatus {
  id: string;
  user_id: string;
  current_balance: number;
  account_type: "demo" | "real";
  is_connected: boolean;
  last_trade_at: string | null;
  updated_at: string;
}

export const useBotStatus = (userId?: string) => {
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchBotStatus = async () => {
      try {
        const { data, error } = await supabase
          .from("bot_status")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (error && error.code !== "PGRST116") throw error;

        if (!data) {
          // Create initial bot_status record
          const { data: newData, error: insertError } = await supabase
            .from("bot_status")
            .insert({ 
              user_id: userId, 
              current_balance: 10000,
              account_type: "demo",
              is_connected: false
            })
            .select()
            .single();

          if (insertError) throw insertError;
          setBotStatus(newData as BotStatus);
        } else {
          setBotStatus(data as BotStatus);
        }
      } catch (error) {
        console.error("Error fetching bot status:", error);
        toast.error("Failed to load bot status");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBotStatus();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("bot-status-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bot_status",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new) {
            setBotStatus(payload.new as BotStatus);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const updateAccountType = async (accountType: "demo" | "real") => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from("bot_status")
        .update({ account_type: accountType })
        .eq("user_id", userId);

      if (error) throw error;
      toast.success(`Switched to ${accountType} account`);
    } catch (error) {
      console.error("Error updating account type:", error);
      toast.error("Failed to switch account type");
    }
  };

  return { botStatus, isLoading, updateAccountType };
};
