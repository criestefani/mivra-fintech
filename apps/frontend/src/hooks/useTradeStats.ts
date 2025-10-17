import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TradeStats {
  totalTrades: number;
  winRate: number;
  totalProfit: number;
  activeTrades: number;
}

export const useTradeStats = (userId?: string): TradeStats & { isLoading: boolean } => {
  const [stats, setStats] = useState<TradeStats>({
    totalTrades: 0,
    winRate: 0,
    totalProfit: 0,
    activeTrades: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setStats({ totalTrades: 0, winRate: 0, totalProfit: 0, activeTrades: 0 });
      setIsLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        setIsLoading(true);

        // ✅ Get today's start time (optimization: only fetch today's trades)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayISO = today.toISOString();

        // ✅ CRITICAL FIX: Filter by user_id AND date (was SELECT * before!)
        const { data, error } = await supabase
          .from("trade_history")
          .select("id, resultado, pnl, status")
          .eq("user_id", userId) // ✅ Only this user's trades
          .gte("data_abertura", todayISO) // ✅ Only today's trades
          .order("data_abertura", { ascending: false });

        if (error) throw error;

        const trades = data || [];
        const totalTrades = trades.length;
        const wins = trades.filter((t) => t.resultado === "WIN").length;
        const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
        const totalProfit = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
        const activeTrades = trades.filter((t) => !t.resultado || t.status === "open").length;

        setStats({
          totalTrades,
          winRate: Math.round(winRate * 10) / 10, // Round to 1 decimal
          totalProfit: Math.round(totalProfit * 100) / 100, // Round to 2 decimals
          activeTrades,
        });
      } catch (error) {
        console.error("[useTradeStats] Error fetching stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchStats();

    // ✅ Increased from 3s to 10s to reduce database load
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [userId]);

  return { ...stats, isLoading };
};
