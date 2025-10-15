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
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("trade_history")
          .select("*");

        if (error) throw error;

        const trades = data || [];
        const totalTrades = trades.length;
        const wins = trades.filter((t) => t.resultado === "WIN").length;
        const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
        const totalProfit = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
        const activeTrades = trades.filter((t) => !t.resultado).length;

        setStats({
          totalTrades,
          winRate,
          totalProfit,
          activeTrades,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();

    // Auto-refresh every 3 seconds
    const interval = setInterval(fetchStats, 3000);
    return () => clearInterval(interval);
  }, [userId]);

  return { ...stats, isLoading };
};
