import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Trade {
  id: number;
  external_id: number;
  active_id: number;
  type: string;
  direction: string;
  valor: number;
  profit_esperado: number | null;
  data_abertura: string;
  data_expiracao: string;
  status: string | null;
  resultado: string | null;
  pnl: number | null;
  created_at: string;
}

export const useTrades = (limit?: number) => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        setIsLoading(true);
        let query = supabase
          .from("trade_history")
          .select("*")
          .order("created_at", { ascending: false });

        if (limit) {
          query = query.limit(limit);
        }

        const { data, error } = await query;

        if (error) throw error;
        setTrades(data || []);
      } catch (error) {
        console.error("Error fetching trades:", error);
        toast.error("Erro ao carregar histórico de trades");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrades();
  }, [limit]);

  return { trades, isLoading };
};

export const useRecentTrades = (limit: number = 10) => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecentTrades = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("trade_history")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(limit);

        if (error) throw error;
        setTrades(data || []);
      } catch (error) {
        console.error("Error fetching recent trades:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentTrades();
  }, [limit]);

  return { trades, isLoading };
};

export const useRealtimeTradeUpdates = () => {
  const [lastTrade, setLastTrade] = useState<Trade | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel("trades-updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "trade_history",
        },
        (payload) => {
          setLastTrade(payload.new as Trade);
          toast.success("Novo trade registrado!");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return lastTrade;
};
