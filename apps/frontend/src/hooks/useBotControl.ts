import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BotControl {
  id: string;
  status: "idle" | "running" | "stopped";
  command: "start" | "stop" | null;
  last_updated: string;
}

export const useBotControl = (userId?: string) => {
  const [botControl, setBotControl] = useState<BotControl | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchBotControl = async () => {
      try {
        const { data, error } = await supabase
          .from("bot_control")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (error && error.code !== "PGRST116") throw error;
        
        if (!data) {
          // Create initial bot_control record
          const { data: newData, error: insertError } = await supabase
            .from("bot_control")
            .insert({ user_id: userId, status: "idle" })
            .select()
            .single();
          
          if (insertError) throw insertError;
          setBotControl(newData as BotControl);
        } else {
          setBotControl(data as BotControl);
        }
      } catch (error) {
        console.error("Error fetching bot control:", error);
        toast.error("Failed to load bot control");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBotControl();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("bot-control-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bot_control",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new) {
            setBotControl(payload.new as BotControl);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const sendCommand = async (command: "start" | "stop") => {
    if (!userId || !botControl) return;

    try {
      const newStatus = command === "start" ? "running" : "stopped";
      const { error } = await supabase
        .from("bot_control")
        .update({ command, status: newStatus })
        .eq("user_id", userId);

      if (error) throw error;
      
      toast.success(`Bot ${command === "start" ? "started" : "stopped"} successfully`);
    } catch (error) {
      console.error("Error sending command:", error);
      toast.error("Failed to send command to bot");
    }
  };

  return { botControl, isLoading, sendCommand };
};
