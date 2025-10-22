import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { DashboardHeader, Sidebar } from "@/features/dashboard";
import { useBotStatus } from "@/features/bot-control";
import { useToast } from "@/shared/hooks/use-toast";
import type { ScannerConfig } from "@/features/market-scanner";

// ✅ Trading Components
import {
  OperationsHeader,
  AutoModeConfig,
  AutoModeRunning,
  MetricsCards,
  TradeHistory,
  TradingChart,
  type Trade
} from "@/features/trading";

// ✅ UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { cn } from "@/shared/utils/cn";
import { ChevronDown, TrendingUp } from "lucide-react";

// ✅ Gamification Components
import {
  BotStatusBar,
  LiveTradeFeed,
  StreakOverlay,
  NextTradePreview,
  CommandCenter,
  MetricsGrid,
  QuestTracker,
  type Trade as TradeFeedTrade,
} from "@/components/trading";
import { XPBar, StreakBadge, FloatingXP, OrganicBackground, DiagonalSection } from "@/components/ui/gamification";
import { BadgeUnlockModal, LevelUpModal } from "@/components/gamification";

// ✅ Gamification Hooks
import { useGamification, useStreaks, useQuests } from "@/hooks/useGamification";
import { useFloatingXP } from "@/hooks/useFloatingXP";
import { useSoundEffects } from "@/hooks/useSoundEffects";

// ✅ New Hook
import { useBotSocket } from "@/shared/hooks/useBotSocket";

// ✅ Phase 3 Gamification Components
import { QuestTracker as QuestTrackerWidget } from "@/features/gamification/components/QuestTracker";

interface TradeMarker {
  time: number;
  direction: "CALL" | "PUT";
  result?: "WIN" | "LOSS";
  pnl?: number;
}

interface PnlDataPoint {
  time: string;
  value: number;
}

const Operations = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ Bot Mode (with localStorage persistence)
  const [botMode, setBotMode] = useState<"auto" | "manual">(() => {
    const saved = localStorage.getItem('botMode');
    return (saved === 'auto' || saved === 'manual') ? saved : 'auto';
  });

  // ✅ Auto Mode Config
  const [selectedStrategy, setSelectedStrategy] = useState("aggressive");
  const [entryValue, setEntryValue] = useState(20);

  // ✅ Leverage (Martingale) - OFF by default
  const [leverageEnabled, setLeverageEnabled] = useState(false);
  const [leverage, setLeverage] = useState(2);

  // ✅ Safety Stop - OFF by default
  const [safetyStopEnabled, setSafetyStopEnabled] = useState(false);
  const [safetyStop, setSafetyStop] = useState(3);

  // ✅ Daily Goal - OFF by default
  const [dailyGoalEnabled, setDailyGoalEnabled] = useState(false);
  const [dailyGoal, setDailyGoal] = useState(100);

  // ✅ Manual Mode Config (with localStorage persistence)
  const [category, setCategory] = useState<string>(() => {
    return localStorage.getItem('selectedCategory') || 'forex';
  });
  const [asset, setAsset] = useState<string>(() => {
    return localStorage.getItem('selectedAsset') || 'EURUSD-OTC'; // ✅ Fixed to match backend ticker format
  });
  const [timeframe, setTimeframe] = useState<string>(() => {
    return localStorage.getItem('selectedTimeframe') || '60';
  });
  const [showManualAdvanced, setShowManualAdvanced] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      setShowManualAdvanced(true);
    }
  }, []);
  // ✅ manualStrategy removed - manual mode always uses hybrid strategy

  // ✅ Real-time Data
  const [pnlData, setPnlData] = useState<PnlDataPoint[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [tradeMarkers, setTradeMarkers] = useState<TradeMarker[]>([]);
  const [metrics, setMetrics] = useState({
    winRate: 0,
    totalTrades: 0,
    totalWins: 0,
    totalLosses: 0,
    pnl: 0
  });

  // ✅ WebSocket Hook
  const { currentStatus, onPositionClosed } = useBotSocket(user?.id);

  // Bot control (multi-user)
  const { isConnected, isRunning, startBotRuntime, stopBotRuntime, loading: botLoading } = useBotStatus(user?.id);

  // ✅ Realtime subscription status
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'connecting' | 'error'>('connecting');

  // ✅ Gamification Hooks
  const { progress, winRate: gamifiedWinRate } = useGamification(user?.id || null);
  const { currentWinStreak, currentStreak } = useStreaks(user?.id || null);
  const { dailyQuests } = useQuests(user?.id || null);
  const { xpInstances, showXP } = useFloatingXP();
  const sounds = useSoundEffects({ volume: 0.5, enabled: true });

  // ✅ Session Timer
  const [sessionTime, setSessionTime] = useState(0);
  useEffect(() => {
    if (isRunning) {
      const interval = setInterval(() => {
        setSessionTime((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setSessionTime(0);
    }
  }, [isRunning]);

  // ✅ Persist chart selections to localStorage
  useEffect(() => {
    localStorage.setItem('selectedCategory', category);
    console.log('[Operations] Category saved to localStorage:', category);
  }, [category]);

  useEffect(() => {
    localStorage.setItem('selectedAsset', asset);
    console.log('[Operations] Asset saved to localStorage:', asset);
  }, [asset]);

  useEffect(() => {
    localStorage.setItem('selectedTimeframe', timeframe);
    console.log('[Operations] Timeframe saved to localStorage:', timeframe);
  }, [timeframe]);

  // ✅ Load today's trades from Supabase
  const loadTodayTrades = async () => {
    if (!user?.id) {
      console.warn("Cannot load trades: user not authenticated");
      return;
    }

    try {
      // Get today's start (midnight)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const { data, error } = await supabase
        .from("trade_history")
        .select("*")
        .eq("user_id", user.id)
        .gte("data_abertura", todayISO) // Only trades from today
        .order("data_abertura", { ascending: false }); // ✅ Most recent first

      if (error) {
        console.error("Error loading today's trades:", error);
        return;
      }

      if (data && data.length > 0) {
        console.log(`[Operations] Loaded ${data.length} trades from today`);

        // Convert to Trade format
        const formattedTrades: Trade[] = data.map(trade => ({
          id: trade.id,
          timestamp: trade.data_abertura,
          asset: trade.ativo_nome || `ID-${trade.active_id}`,
          direction: trade.direction.toUpperCase() as "CALL" | "PUT",
          expiration: trade.expiration_seconds,
          // ✅ Map status to result: 'open' = 'PENDING', otherwise use resultado
          result: (!trade.resultado && trade.status === 'open') ? "PENDING" : (trade.resultado as "WIN" | "LOSS" | "PENDING"),
          pnl: trade.pnl || 0
        }));

        setTrades(formattedTrades);

        // Calculate cumulative PNL data for chart (oldest to newest)
        let cumulativePnl = 0;
        const pnlDataPoints: PnlDataPoint[] = [...formattedTrades]
          .reverse() // ✅ Reverse for cumulative calc (oldest first)
          .map(trade => {
            cumulativePnl += trade.pnl;
            return {
              time: new Date(trade.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              value: cumulativePnl
            };
          });

        setPnlData(pnlDataPoints);
      } else {
        console.log('[Operations] No trades found for today');
        setTrades([]);
        setPnlData([{ time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), value: 0 }]);
      }
    } catch (err) {
      console.error("Unexpected error loading today's trades:", err);
    }
  };

  // ✅ Helper function to determine category from asset name
  const determineCategoryFromAsset = (assetName: string): string => {
    const name = assetName.toUpperCase();

    // Crypto patterns
    if (
      name.includes('BTC') || name.includes('ETH') || name.includes('COIN') ||
      name.includes('USDT') || name.includes('DOGE') || name.includes('XRP') ||
      name.includes('SOL') || name.includes('ADA') || name.includes('SHIB') ||
      name.includes('TRON') || name.includes('LINK') || name.includes('PEPE')
    ) {
      return 'crypto';
    }

    // Stocks patterns
    if (
      name.includes('APPLE') || name.includes('AAPL') || name.includes('TESLA') ||
      name.includes('MSFT') || name.includes('MICROSOFT') || name.includes('GOOGL') ||
      name.includes('GOOGLE') || name.includes('AMZN') || name.includes('AMAZON') ||
      name.includes('META') || name.includes('NVIDIA') || name.includes('INTEL') ||
      name.includes('ALIBABA') || name.includes('NIKE') || name.includes('MCDON')
    ) {
      return 'stocks';
    }

    // Indices patterns
    if (
      name.includes('INDEX') || name.includes('DOW') || name.includes('NASDAQ') ||
      name.includes('S&P') || name.includes('FTSE') || name.includes('DAX') ||
      name.includes('NIKKEI') || name.includes('CAC') || name.includes('IBEX') ||
      name.includes('HANG SENG') || name.includes('RUSSELL')
    ) {
      return 'indices';
    }

    // Commodities patterns
    if (
      name.includes('GOLD') || name.includes('XAU') || name.includes('SILVER') ||
      name.includes('XAG') || name.includes('OIL') || name.includes('USO') ||
      name.includes('UKO') || name.includes('NATURAL GAS')
    ) {
      return 'commodities';
    }

    // Default to forex if contains currency pairs
    if (
      name.includes('USD') || name.includes('EUR') || name.includes('GBP') ||
      name.includes('JPY') || name.includes('CHF') || name.includes('AUD') ||
      name.includes('CAD') || name.includes('NZD')
    ) {
      return 'forex';
    }

    // Final fallback
    return 'forex';
  };

  // Handle preset config from Market Scanner
  useEffect(() => {
    const presetConfig = location.state?.presetConfig as ScannerConfig | undefined;

    if (presetConfig) {
      console.log('✅ [Operations] Applying preset config from Market Scanner:', presetConfig);

      const assetKey = presetConfig.assetKey ?? presetConfig.assetName ?? presetConfig.assetId;
      const assetLabel = presetConfig.assetName ?? presetConfig.assetKey ?? presetConfig.assetId;

      // ✅ Determine category from asset label or key
      const determinedCategory = determineCategoryFromAsset(assetLabel || assetKey);

      // ✅ Set MANUAL mode with scanner configuration
      setBotMode('manual');
      setCategory(determinedCategory);
      if (assetKey) {
        setAsset(assetKey);
      }
      if (presetConfig.timeframe) {
        setTimeframe(presetConfig.timeframe.toString());
      }

      toast({
        title: "Configuração do Scanner Aplicada",
        description: `${assetLabel} • ${(presetConfig.timeframeLabel ?? `${presetConfig.timeframe}s`)} • Manual Mode`,
        duration: 5000,
      });

      console.log(`✅ [Operations] Manual mode configured: ${determinedCategory} → ${assetKey} (${assetLabel}) → ${presetConfig.timeframe}s`);

      // Clear location state
      window.history.replaceState({}, document.title);
    }
  }, [location.state, toast]);

  // Auth state management
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // ✅ Load trades from Supabase (same as History.tsx)
  useEffect(() => {
    if (!user?.id) return;

    loadTodayTrades();
  }, [user?.id]);

  // ✅ Sync pending positions on component mount (runs once when page loads)
  useEffect(() => {
    const syncPendingPositions = async () => {
      if (!user?.id || !isConnected) {
        console.log('[Operations] Not ready to sync pending positions');
        return;
      }

      // Get SSID from bot_status
      const { data: botStatus } = await supabase
        .from('bot_status')
        .select('ssid')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!botStatus?.ssid) {
        console.log('[Operations] No SSID found, skipping pending sync');
        return;
      }

      console.log('[Operations] 🔄 Syncing pending positions...');

      try {
        const response = await fetch('/api/sync-pending-positions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            ssid: botStatus.ssid
          })
        });

        const result = await response.json();
        if (result.success && result.updated > 0) {
          console.log(`[Operations] ✅ Synced ${result.updated} pending positions`);
          loadTodayTrades(); // Reload trades to reflect updates
        }
      } catch (error) {
        console.error('[Operations] Error syncing pending positions:', error);
      }
    };

    syncPendingPositions();
  }, [user?.id, isConnected]);

  // ✅ Real-time subscription for trades (EXACTLY like History.tsx)
  useEffect(() => {
    if (!user?.id) return;

    console.log('[Operations] Setting up real-time subscription for user:', user.id);
    setRealtimeStatus('connecting');

    const channel = supabase
      .channel('operations-trade-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trade_history',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('[Operations] ✅ NEW TRADE via real-time:', payload);
          const newTrade = payload.new as any;

          // Check if trade is from today
          const tradeDate = new Date(newTrade.data_abertura);
          const today = new Date();
          const isToday = tradeDate.toDateString() === today.toDateString();

          if (!isToday) {
            console.log('[Operations] Trade not from today, ignoring');
            return;
          }

          // Add to trades array (INSERT always means new trade with PENDING or null result)
          const formattedTrade: Trade = {
            id: newTrade.id,
            timestamp: newTrade.data_abertura,
            asset: newTrade.ativo_nome || `ID-${newTrade.active_id}`,
            direction: newTrade.direction.toUpperCase() as "CALL" | "PUT",
            expiration: newTrade.expiration_seconds,
            result: "PENDING", // ✅ INSERTs are always PENDING initially
            pnl: 0
          };

          console.log('[Operations] Adding new PENDING trade:', formattedTrade);
          setTrades(prev => [formattedTrade, ...prev]);

          // ✅ Initialize PNL data if empty (works for auto mode - that's where it's displayed)
          if (pnlData.length === 1 && pnlData[0].value === 0) {
            setPnlData([{
              time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              value: 0
            }]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'trade_history',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('[Operations] ✅ TRADE UPDATED via real-time:', payload);
          const updatedTrade = payload.new as any;

          // Update trade in list
          setTrades(prev =>
            prev.map(trade =>
              trade.id === updatedTrade.id
                ? {
                    ...trade,
                    result: (updatedTrade.resultado || "PENDING") as "WIN" | "LOSS" | "PENDING",
                    pnl: updatedTrade.pnl || 0
                  }
                : trade
            )
          );

          // ✅ Update PNL chart if trade has result (always update - displayed only in auto mode)
          if (updatedTrade.resultado && updatedTrade.pnl !== null) {
            setPnlData(prev => {
              const lastValue = prev.length > 0 ? prev[prev.length - 1].value : 0;
              const newValue = lastValue + (updatedTrade.pnl || 0);
              return [...prev, {
                time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                value: newValue
              }];
            });
          }

          // Add trade marker for manual mode chart
          if (botMode === "manual" && updatedTrade.resultado) {
            setTradeMarkers(prev => [...prev, {
              time: Math.floor(new Date(updatedTrade.data_abertura).getTime() / 1000),
              direction: updatedTrade.direction.toUpperCase() as "CALL" | "PUT",
              result: updatedTrade.resultado as "WIN" | "LOSS",
              pnl: updatedTrade.pnl || 0
            }]);
          }
        }
      )
      .subscribe((status) => {
        console.log('[Operations] Subscription status:', status);

        // ✅ Update status state based on subscription result
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('connected');
          console.log('✅ [Operations] Real-time subscription ACTIVE');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setRealtimeStatus('error');
          console.error('❌ [Operations] Real-time subscription FAILED:', status);
        }
      });

    return () => {
      console.log('[Operations] Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id]); // ✅ Remove botMode dependency to prevent subscription recreation

  // ✅ Polling backup mechanism - only when bot is running and realtime fails
  useEffect(() => {
    if (!user?.id || !isRunning || realtimeStatus === 'connected') return;

    console.log('[Operations] 🔄 Activating polling backup (realtime not connected)');

    const pollingInterval = setInterval(() => {
      console.log('[Operations] 📡 Polling for trade updates...');
      loadTodayTrades();
    }, 5000); // Poll every 5 seconds when bot is running

    return () => {
      console.log('[Operations] Stopping polling backup');
      clearInterval(pollingInterval);
    };
  }, [user?.id, isRunning, realtimeStatus]);

  // ✅ AUTO-REFRESH on position close via Socket.io
  useEffect(() => {
    if (!user?.id) return;

    onPositionClosed((position) => {
      console.log('[Operations] 🔔 Position closed detected via Socket.io, auto-refreshing data...');
      console.log('[Operations] Position:', position);

      // Refresh trades data
      loadTodayTrades();
    });
  }, [user?.id, onPositionClosed]);

  // ✅ Calculate metrics from trades (same as History.tsx)
  useEffect(() => {
    if (trades.length === 0) {
      setMetrics({
        winRate: 0,
        totalTrades: 0,
        totalWins: 0,
        totalLosses: 0,
        pnl: 0
      });
      return;
    }

    const wins = trades.filter(t => t.result === "WIN").length;
    const losses = trades.filter(t => t.result === "LOSS").length;
    const totalTrades = wins + losses;
    const totalPnl = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

    setMetrics({
      winRate: Number(winRate.toFixed(1)),
      totalTrades,
      totalWins: wins,
      totalLosses: losses,
      pnl: Number(totalPnl.toFixed(2))
    });
  }, [trades]);

  // ✅ Play sounds and show XP when trade result changes
  useEffect(() => {
    if (trades.length === 0) return;

    const latestTrade = trades[0];
    if (latestTrade.result === "WIN") {
      sounds.playWin();
      showXP(20, window.innerWidth / 2, window.innerHeight / 2); // Show +20 XP
    } else if (latestTrade.result === "LOSS") {
      sounds.playLoss();
    }
  }, [trades.length, trades[0]?.result]);

  // START BOT handler
  const handleStartBot = async () => {
    console.log('🎯 [handleStartBot] Called - isConnected:', isConnected, 'entryValue:', entryValue, 'botMode:', botMode);

    if (!isConnected) {
      console.log('❌ [handleStartBot] BLOCKED: Not connected to broker');
      toast({
        title: "Not Connected",
        description: "Please connect to broker in Settings first",
        variant: "destructive",
      });
      return;
    }

    // Validations
    if (entryValue <= 0) {
      console.log('❌ [handleStartBot] BLOCKED: Invalid entry value:', entryValue);
      toast({
        title: "Invalid Entry Value",
        description: "Entry value must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    if (botMode === "manual" && !asset) {
      toast({
        title: "No Asset Selected",
        description: "Please select an asset for manual trading",
        variant: "destructive",
      });
      return;
    }

    // ✅ Construct userConfig based on bot mode
    let userConfig;

    if (botMode === "manual") {
      // Manual Mode: User controls specific asset + timeframe (always uses aggressive strategy)
      userConfig = {
        mode: 'manual',
        asset: asset,
        timeframe: parseInt(timeframe),
        strategy: 'aggressive', // ✅ Manual mode ALWAYS uses aggressive strategy
        amount: entryValue,
        // Optional: Pass advanced settings for manual mode too
        leverageEnabled: leverageEnabled,
        leverage: leverage,
        safetyStopEnabled: safetyStopEnabled,
        safetyStop: safetyStop,
        dailyGoalEnabled: dailyGoalEnabled,
        dailyGoal: dailyGoal
      };

      console.log('🎮 [Operations] Starting MANUAL mode:', userConfig);
    } else {
      // Auto Mode: Bot chooses assets, user controls strategy
      userConfig = {
        mode: 'auto',
        strategy: selectedStrategy,
        maxTimeframe: 60, // Auto mode can use up to 60s timeframes
        amount: entryValue,
        // Optional: Pass other auto mode settings
        leverageEnabled: leverageEnabled,
        leverage: leverage,
        safetyStopEnabled: safetyStopEnabled,
        safetyStop: safetyStop,
        dailyGoalEnabled: dailyGoalEnabled,
        dailyGoal: dailyGoal
      };

      console.log('🤖 [Operations] Starting AUTO mode:', userConfig);
    }

    console.log('✅ [handleStartBot] All validations passed, calling startBotRuntime with userId:', user?.id);

    try {
      // ✅ Pass userConfig to startBotRuntime
      console.log('📡 [handleStartBot] Calling startBotRuntime...');
      await startBotRuntime(user!.id, userConfig);
      console.log('✅ [handleStartBot] startBotRuntime completed successfully');

      // Reset data when starting
      if (botMode === "auto") {
        setPnlData([{ time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), value: 0 }]);
      } else {
        setTradeMarkers([]);
      }
    } catch (error) {
      console.error("❌ [handleStartBot] Failed to start bot:", error);
      toast({
        title: "Failed to Start Bot",
        description: "An error occurred while starting the bot",
        variant: "destructive",
      });
    }

    console.log('🏁 [handleStartBot] Function completed');
  };

  // STOP BOT handler
  const handleStopBot = async () => {
    try {
      await stopBotRuntime(user!.id);
      toast({
        title: "Bot Stopped",
        description: "Trading bot has been stopped",
      });
    } catch (error) {
      console.error("Failed to stop bot:", error);
      toast({
        title: "Failed to Stop Bot",
        description: "An error occurred while stopping the bot",
        variant: "destructive",
      });
    }
  };

  // Handle mode change (with localStorage persistence)
  const handleModeChange = (mode: "auto" | "manual") => {
    if (isRunning) {
      toast({
        title: "Bot is Running",
        description: "Stop the bot before changing modes",
        variant: "destructive",
      });
      return;
    }
    setBotMode(mode);
    localStorage.setItem('botMode', mode); // ✅ Save to localStorage
    console.log(`✅ [Operations] Mode changed to ${mode.toUpperCase()} and saved to localStorage`);
  };

  // Reset history
  const handleResetHistory = async () => {
    if (!user?.id) return;

    try {
      // ✅ Delete today's trades from Supabase
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const { error } = await supabase
        .from('trade_history')
        .delete()
        .eq('user_id', user.id)
        .gte('data_abertura', todayISO);

      if (error) {
        console.error('[Operations] Error deleting trades:', error);
        toast({
          title: "Error",
          description: "Failed to clear history",
          variant: "destructive"
        });
        return;
      }

      // Clear local state
      setTrades([]);
      setPnlData([{ time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), value: 0 }]);
      setTradeMarkers([]);
      setMetrics({
        winRate: 0,
        totalTrades: 0,
        totalWins: 0,
        totalLosses: 0,
        pnl: 0
      });

      toast({
        title: "History Reset",
        description: "All trading history has been cleared",
      });
    } catch (err) {
      console.error('[Operations] Unexpected error clearing history:', err);
      toast({
        title: "Error",
        description: "Failed to clear history",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-900 relative overflow-hidden pt-16">
      {/* Organic Background Animation */}
      <OrganicBackground
        blobCount={3}
        colors={['#0EA5E9', '#F59E0B', '#10B981']}
        speed={0.8}
      />

      <DashboardHeader user={user} />
      <Sidebar />

      {/* Mobile-First Layout */}
      <main className="lg:ml-64 container mx-auto px-4 py-6 pb-20 space-y-6 animate-fade-in relative z-20">

        {/* ✅ Gamification: Bot Status Bar */}
        <BotStatusBar
          status={isRunning ? "RUNNING" : "STOPPED"}
          sessionDuration={sessionTime}
          pnlToday={metrics.pnl}
          xpGained={progress?.total_xp}
        />

        {/* ✅ Gamification: XP Bar */}
        {progress && (
          <XPBar
            level={progress.current_level}
            currentXP={progress.xp_current_level}
            nextLevelXP={progress.xp_next_level}
            levelTitle={progress.level_title}
            compact
          />
        )}

        {/* ✅ DIAGONAL SECTION HEADER */}
        <DiagonalSection
          direction="top-right"
          gradientFrom="from-primary/40"
          className="h-32 lg:h-40 relative z-20 -mx-4 lg:-ml-4"
        >
          <div className="relative z-30">
            <h1 className="text-3xl lg:text-4xl font-bold text-white">Trading Operations</h1>
            <p className="text-muted-foreground mt-1 text-sm lg:text-base">Auto & Manual Trading Control</p>
          </div>
        </DiagonalSection>

        {/* ✅ NEW HEADER */}
        <OperationsHeader
          botMode={botMode}
          onBotModeChange={handleModeChange}
          isRunning={isRunning}
          isConnected={isConnected}
          isLoading={botLoading}
          onStart={handleStartBot}
          onStop={handleStopBot}
        />

        {/* ✅ MODE-SPECIFIC CONTENT */}
        {botMode === "auto" ? (
          // AUTO MODE
          <>
            {/* ✅ Gamification: Command Center (Auto Mode HUD) */}
            <CommandCenter
              botStatus={isRunning ? "SCANNING" : "STOPPED"}
              currentAsset={trades[0]?.asset}
              sessionTime={sessionTime}
              userLevel={progress?.current_level || 1}
            />

            {/* ✅ P&L Chart: Always visible (bot running or not) */}
            <AutoModeRunning
              pnlData={pnlData}
              currentStatus={currentStatus}
              currentAsset={trades[0]?.asset}
              currentAmount={trades[0]?.pnl ? Math.abs(trades[0].pnl) : undefined}
            />

            {/* ✅ Configuration Panel: Only show when bot is NOT running */}
            {!isRunning && (
              <AutoModeConfig
                selectedStrategy={selectedStrategy}
                onStrategyChange={setSelectedStrategy}
                entryValue={entryValue}
                onEntryValueChange={setEntryValue}
                // ✅ Leverage with toggle
                leverageEnabled={leverageEnabled}
                onLeverageEnabledChange={setLeverageEnabled}
                leverage={leverage}
                onLeverageChange={setLeverage}
                // ✅ Safety Stop with toggle
                safetyStopEnabled={safetyStopEnabled}
                onSafetyStopEnabledChange={setSafetyStopEnabled}
                safetyStop={safetyStop}
                onSafetyStopChange={setSafetyStop}
                // ✅ Daily Goal with toggle
                dailyGoalEnabled={dailyGoalEnabled}
                onDailyGoalEnabledChange={setDailyGoalEnabled}
                dailyGoal={dailyGoal}
                onDailyGoalChange={setDailyGoal}
              />
            )}
          </>
        ) : (
          // MANUAL MODE
          <>
            <TradingChart
              category={category}
              asset={asset}
              timeframe={timeframe}
              onCategoryChange={setCategory}
              onAssetChange={setAsset}
              onTimeframeChange={setTimeframe}
              tradeMarkers={tradeMarkers}
              currentStatus={currentStatus}
            />

            {/* ✅ Gamification: Live Trade Feed (Manual Mode) - Floating Button */}
            <LiveTradeFeed
              trades={trades.slice(0, 5).map((t) => ({
                id: t.id,
                asset: t.asset,
                direction: t.direction as 'CALL' | 'PUT',
                result: t.result as 'WIN' | 'LOSS' | undefined,
                pnl: t.pnl,
                timestamp: new Date(t.created_at).getTime(),
              }))}
              maxTrades={5}
            />

            {/* ✅ Gamification: Next Trade Preview (Manual Mode) */}
            {isRunning && (
              <NextTradePreview
                secondsUntilNext={15}
                nextAsset={asset}
                isAnalyzing={currentStatus === 'analyzing'}
              />
            )}

            {/* ✅ MANUAL MODE: Entry Value */}
            <Card className="glass border-border">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="manual-entry-value" className="text-base font-semibold">
                      Entry Value
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Amount used for each manual trade
                    </p>
                  </div>

                  {/* Preset Buttons */}
                  <div className="grid grid-cols-4 gap-2">
                    {[10, 20, 50, 100].map((value) => (
                      <Button
                        key={value}
                        variant={entryValue === value ? "default" : "outline"}
                        onClick={() => setEntryValue(value)}
                        className={cn(
                          "transition-all",
                          entryValue === value && "bg-accent hover:bg-accent/90"
                        )}
                      >
                        R$ {value}
                      </Button>
                    ))}
                  </div>

                  {/* Custom Input */}
                  <div className="space-y-2">
                    <Label htmlFor="manual-entry-value">Custom amount (R$)</Label>
                    <Input
                      id="manual-entry-value"
                      type="number"
                      min="1"
                      max="1000"
                      step="0.01"
                      value={entryValue}
                      onChange={(e) => setEntryValue(Number(e.target.value))}
                      placeholder="e.g., 20.00"
                      className="bg-card text-center font-mono text-lg"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-border">
              <CardHeader className="p-0">
                <button
                  type="button"
                  onClick={() => setShowManualAdvanced((prev) => !prev)}
                  aria-expanded={showManualAdvanced}
                  aria-controls="manual-advanced-options"
                  className="w-full flex items-center justify-between gap-3 px-4 py-4 md:px-6 md:py-5 text-left"
                >
                  <div>
                    <CardTitle className="text-lg">Advanced Options</CardTitle>
                    <CardDescription>Optional risk management settings</CardDescription>
                  </div>
                  <ChevronDown
                    className={cn(
                      "w-5 h-5 text-muted-foreground transition-transform duration-200",
                      showManualAdvanced ? "rotate-180" : "rotate-0"
                    )}
                  />
                </button>
              </CardHeader>
              {showManualAdvanced && (
                <CardContent id="manual-advanced-options" className="space-y-6 pt-0">
                  {/* Leverage (Martingale) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-semibold">Leverage (Martingale)</Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Multiply entry after loss
                        </p>
                      </div>
                      <Button
                        variant={leverageEnabled ? "default" : "outline"}
                        size="sm"
                        onClick={() => setLeverageEnabled((prev) => !prev)}
                      >
                        {leverageEnabled ? "ON" : "OFF"}
                      </Button>
                    </div>
                    {leverageEnabled && (
                      <Input
                        type="number"
                        min="1.5"
                        max="5"
                        step="0.5"
                        value={leverage}
                        onChange={(e) => setLeverage(Number(e.target.value))}
                        className="bg-card"
                      />
                    )}
                  </div>

                  {/* Safety Stop */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-semibold">Safety Stop</Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Stop after consecutive losses
                        </p>
                      </div>
                      <Button
                        variant={safetyStopEnabled ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSafetyStopEnabled((prev) => !prev)}
                      >
                        {safetyStopEnabled ? "ON" : "OFF"}
                      </Button>
                    </div>
                    {safetyStopEnabled && (
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        step="1"
                        value={safetyStop}
                        onChange={(e) => setSafetyStop(Number(e.target.value))}
                        className="bg-card"
                      />
                    )}
                  </div>

                  {/* Daily Goal */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-semibold flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-positive" />
                          Daily Goal
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Stop when profit reaches target
                        </p>
                      </div>
                      <Button
                        variant={dailyGoalEnabled ? "default" : "outline"}
                        size="sm"
                        onClick={() => setDailyGoalEnabled((prev) => !prev)}
                      >
                        {dailyGoalEnabled ? "ON" : "OFF"}
                      </Button>
                    </div>
                    {dailyGoalEnabled && (
                      <Input
                        type="number"
                        min="10"
                        max="10000"
                        step="10"
                        value={dailyGoal}
                        onChange={(e) => setDailyGoal(Number(e.target.value))}
                        placeholder="e.g., 100"
                        className="bg-card"
                      />
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          </>
        )}

        {/* ✅ METRICS CARDS - Always visible */}
        <MetricsCards {...metrics} />

        {/* ✅ GAMIFICATION WIDGETS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quests Widget */}
          <div className="lg:col-span-1 backdrop-blur-xl bg-card/50 border border-card-border rounded-lg p-4">
            <QuestTrackerWidget userId={user?.id || null} maxQuests={4} />
          </div>

          {/* Leaderboard Widget */}
          <div className="lg:col-span-1 backdrop-blur-xl bg-card/50 border border-card-border rounded-lg p-4">
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-white">Top Rankings</h3>
              <p className="text-xs text-muted-foreground">
                View full <a href="/gamification/leaderboard" className="text-primary hover:underline">rankings →</a>
              </p>
            </div>
          </div>

          {/* Badges Widget */}
          <div className="lg:col-span-1 backdrop-blur-xl bg-card/50 border border-card-border rounded-lg p-4">
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-white">Badges</h3>
              <p className="text-xs text-muted-foreground">
                View your <a href="/gamification/badges" className="text-primary hover:underline">achievements →</a>
              </p>
            </div>
          </div>
        </div>

      </main>

      {/* ✅ GAMIFICATION: Global Floating Overlays */}

      {/* Quest Tracker - Left sidebar (both modes) */}
      <QuestTracker
        quests={dailyQuests}
        position="left"
        maxQuests={3}
      />

      {/* Streak Badge - Top-right fixed badge */}
      <StreakBadge
        streakCount={currentStreak}
        position="top-right"
        showParticles={currentStreak >= 7}
      />

      {/* Streak Overlay - Celebration for win streaks */}
      <StreakOverlay
        winStreak={currentWinStreak}
        position="top-right"
        minStreakToShow={3}
      />

      {/* Floating XP Instances - Animated XP numbers */}
      {xpInstances.map((instance) => (
        <FloatingXP
          key={instance.id}
          amount={instance.amount}
          x={instance.x}
          y={instance.y}
          onComplete={() => {}}
        />
      ))}

      {/* Badge Unlock Modal - Celebration for new badges */}
      <BadgeUnlockModal />

      {/* Level Up Modal - Celebration for level ups */}
      <LevelUpModal />

    </div>
  );
};

export default Operations;
