import { useEffect, useState, useRef } from "react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/components/ui/dialog";
import { cn } from "@/shared/utils/cn";
import { ChevronDown, TrendingUp, Play, Square, Loader2, Settings, HelpCircle, X } from "lucide-react";

// ✅ Gamification Components
import {
  LiveTradeFeed,
  StreakOverlay,
  MetricsGrid,
  QuestTracker,
  SessionSummary,
  TradeExplanation,
  type Trade as TradeFeedTrade,
} from "@/components/trading";
import { StreakBadge, FloatingXP, FloatingPnL, DiagonalSection } from "@/components/ui/gamification";
import { BadgeUnlockModal, LevelUpModal } from "@/components/gamification";

// ✅ Gamification Hooks
import { useGamification, useStreaks, useQuests } from "@/hooks/useGamification";
import { useFloatingXP } from "@/hooks/useFloatingXP";
import { useFloatingPnL } from "@/components/ui/gamification";
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
  const [showStrategyHelp, setShowStrategyHelp] = useState(false);
  const [showStrategyMenu, setShowStrategyMenu] = useState(false);
  const strategyMenuRef = useRef<HTMLDivElement>(null);
  const [editingEntryValue, setEditingEntryValue] = useState(false);
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
  const { pnlInstances, showPnL, showLoss } = useFloatingPnL();
  const sounds = useSoundEffects({ volume: 0.5, enabled: true });

  // ✅ Track last processed trade to avoid infinite loops
  const lastProcessedTradeRef = useRef<string | null>(null);

  // ✅ Track session summary display to play winner sound once
  const lastSessionPnLRef = useRef<number | null>(null);

  // ✅ Track last streak sound played
  const lastStreakSoundRef = useRef<number | null>(null);

  // ✅ Session Timer
  const [sessionTime, setSessionTime] = useState(0);

  // ✅ Session Tracking
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [sessionConfig, setSessionConfig] = useState<any>(null);
  const [showSessionSummary, setShowSessionSummary] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

  // ✅ Advanced Settings Help Popups
  const [showHelp, setShowHelp] = useState<'leverage' | 'safetystop' | 'dailygoal' | null>(null);
  const [showAutoAdvanced, setShowAutoAdvanced] = useState(false);

  // ✅ Calculate session trades (trades after START BOT was clicked)
  const sessionTrades = sessionStartTime
    ? trades.filter(t => new Date((t as any).data_abertura).getTime() >= sessionStartTime)
    : [];

  // ✅ Calculate session P&L (only from session trades)
  const sessionPnL = sessionTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);

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

        // ✅ TRANSFORM: Map Supabase 'resultado' field to Trade 'result' field
        const formattedTrades = data.map((rawTrade: any) => ({
          id: rawTrade.id,
          timestamp: rawTrade.data_abertura || rawTrade.timestamp,
          asset: rawTrade.ativo_nome || `ID-${rawTrade.active_id}`,
          direction: (rawTrade.direction || '').toUpperCase() as "CALL" | "PUT",
          expiration: rawTrade.expiration_seconds || 0,
          result: (rawTrade.resultado || "PENDING") as "WIN" | "LOSS" | "PENDING",
          pnl: rawTrade.pnl || 0,
          // ✅ Keep all original fields for TradeExplanation component
          ...rawTrade
        }));

        console.log('✅ [Operations] Formatted trades:', formattedTrades.slice(0, 2));
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

  // ✅ RESET PNL DATA BASED ON BOT STATE
  useEffect(() => {
    if (isRunning && sessionStartTime) {
      console.log('🚀 [isRunning Effect] Bot started - resetting PnL data for new session');
      // Initialize to zero for the new session
      setPnlData([{ time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), value: 0 }]);
    } else if (!isRunning && !sessionStartTime) {
      console.log('🛑 [isRunning Effect] Bot stopped - clearing PnL graph');
      // When bot is stopped and no session active, show empty graph (zero)
      setPnlData([{ time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), value: 0 }]);
    }
  }, [isRunning, sessionStartTime]);

  // ✅ RECALCULATE PNL DATA BASED ON SESSION TRADES ONLY (when session is active)
  useEffect(() => {
    if (isRunning && sessionStartTime && sessionTrades.length > 0) {
      console.log('📊 [SessionTrades Effect] Updating PnL with', sessionTrades.length, 'session trades');
      let cumulativePnl = 0;
      const pnlDataPoints: PnlDataPoint[] = [...sessionTrades]
        .reverse() // ✅ Oldest first
        .map(trade => {
          cumulativePnl += (trade.pnl || 0);
          return {
            time: new Date((trade as any).timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            value: cumulativePnl
          };
        });
      setPnlData(pnlDataPoints);
    }
  }, [sessionTrades, sessionStartTime, isRunning]);

  // ✅ Play winner session sound when positive session ends
  useEffect(() => {
    if (showSessionSummary && sessionPnL > 0) {
      // Only play once per session (check if we haven't played for this PnL value)
      if (lastSessionPnLRef.current !== sessionPnL) {
        console.log('🏆 [Session Summary] Positive session - playing winner sound');
        sounds.playWinnerSession();
        lastSessionPnLRef.current = sessionPnL;
      }
    } else if (!showSessionSummary) {
      // Reset when modal closes
      lastSessionPnLRef.current = null;
    }
  }, [showSessionSummary, sessionPnL]);

  // ✅ Play streak sound when win streak reaches 3+
  useEffect(() => {
    if (currentWinStreak >= 3 && currentWinStreak !== lastStreakSoundRef.current) {
      console.log('🔥 [Streak] 3+ win streak - playing streak sound');
      sounds.playStreak();
      lastStreakSoundRef.current = currentWinStreak;
    }
  }, [currentWinStreak]);

  // ✅ Play sounds and show XP when trade result changes (avoid infinite loop)
  useEffect(() => {
    if (trades.length === 0) {
      console.log('🎵 [Trade Result Effect] No trades yet');
      return;
    }

    const latestTrade = trades[0];
    const tradeId = latestTrade.id?.toString();

    console.log('🎵 [Trade Result Effect] Processing trade - ID:', tradeId, 'Result:', latestTrade.result, 'LastProcessed:', lastProcessedTradeRef.current);

    // Only process if this is a new trade we haven't processed yet
    if (tradeId === lastProcessedTradeRef.current) {
      console.log('🎵 [Trade Result Effect] Trade already processed, skipping');
      return;
    }

    // Skip trades with undefined results
    if (!latestTrade.result || latestTrade.result === "PENDING") {
      console.log('🎵 [Trade Result Effect] Trade result is', latestTrade.result, '- skipping for now');
      return;
    }

    console.log('🎵 [Trade Result Effect] New trade ID:', tradeId, 'Result:', latestTrade.result);

    // Mark this trade as processed
    lastProcessedTradeRef.current = tradeId || null;

    if (latestTrade.result === "WIN") {
      console.log('✅ [Trade Result Effect] WIN detected - playing sound and showing XP and PnL');
      sounds.playWin();
      console.log('✅ [Trade Result Effect] Called playWin()');

      // Show floating animations
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;

      // Show XP animation
      showXP(20, centerX - 40, centerY); // Show +20 XP (slightly left)
      console.log('✅ [Trade Result Effect] Called showXP()');

      // Show PnL animation (only on wins) - 2 second duration
      if (latestTrade.pnl && latestTrade.pnl > 0) {
        showPnL(latestTrade.pnl, centerX + 40, centerY - 30, 'win'); // Show profit (slightly right and above)
        console.log('✅ [Trade Result Effect] Called showPnL() with amount:', latestTrade.pnl);
      }
    } else if (latestTrade.result === "LOSS") {
      console.log('❌ [Trade Result Effect] LOSS detected - showing loss animation (no sound)');

      // Show floating loss animation (1.5 second duration, no sound)
      if (latestTrade.pnl && latestTrade.pnl < 0) {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        showLoss(Math.abs(latestTrade.pnl), centerX + 40, centerY - 30); // Show loss amount
        console.log('❌ [Trade Result Effect] Called showLoss() with amount:', latestTrade.pnl);
      }
    }
  }, [trades]);

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

      // ✅ SAVE SESSION START TIME AND CONFIG
      setSessionStartTime(Date.now());
      setSessionConfig(userConfig);

      // ✅ RESET TRADES AND METRICS FOR NEW SESSION
      setTrades([]);
      setMetrics({
        winRate: 0,
        totalTrades: 0,
        totalWins: 0,
        totalLosses: 0,
        pnl: 0
      });

      // ✅ RESET REF TRACKING FOR NEW SESSION
      lastProcessedTradeRef.current = null;
      lastSessionPnLRef.current = null;
      lastStreakSoundRef.current = null;

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

      // ✅ SHOW SESSION SUMMARY MODAL
      setShowSessionSummary(true);

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

  // ✅ RESET SESSION HANDLER
  const handleResetSession = () => {
    setShowSessionSummary(false);
    setSelectedTrade(null);
    setSessionStartTime(null);
    setSessionConfig(null);
    setTrades([]);
    setPnlData([]);
    setTradeMarkers([]);
    setMetrics({
      winRate: 0,
      totalTrades: 0,
      totalWins: 0,
      totalLosses: 0,
      pnl: 0
    });
    setSessionTime(0);
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
    sounds.playSwitchPages(); // ✅ Play switch pages sound
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
    <div className="min-h-screen bg-black relative overflow-hidden pt-16">
      {/* Organic Background Animation */}
      {/* <OrganicBackground
        blobCount={3}
        colors={['#0EA5E9', '#F59E0B', '#10B981']}
        speed={0.8}
      /> */}

      <DashboardHeader user={user} />
      <Sidebar />

      {/* Mobile-First Layout */}
      <main className="lg:ml-64 container mx-auto px-4 pt-8 pb-32 space-y-6 animate-fade-in relative z-20">

        {/* ✅ DIAGONAL SECTION HEADER */}
        <DiagonalSection
          direction="top-right"
          gradientFrom="from-primary/40"
          className="h-28 md:h-32 lg:h-40 relative z-20 -mx-4 md:-mx-4 lg:-ml-4"
        >
          <div className="relative z-30">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">Trading Operations</h1>
            <p className="text-muted-foreground mt-1 text-xs md:text-sm lg:text-base">Auto & Manual Trading Control</p>
          </div>
        </DiagonalSection>

        {/* ✅ MODE TOGGLE HEADER */}
        <OperationsHeader
          botMode={botMode}
          onBotModeChange={handleModeChange}
          isRunning={isRunning}
        />

        {/* ✅ MODE-SPECIFIC CONTENT */}
        {botMode === "auto" ? (
          // AUTO MODE
          <>
            {/* ✅ Strategy Selection Dropdown + Help Icon */}
            <div className="flex items-center gap-2 md:gap-3">
              {/* Strategy Selection Dropdown */}
              <div className="flex-1 relative" ref={strategyMenuRef}>
                <label className="text-xs md:text-sm font-medium text-white mb-2 block">Strategy</label>
                <button
                  onClick={() => setShowStrategyMenu(!showStrategyMenu)}
                  disabled={isRunning}
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-900/50 border border-slate-700/50 text-white hover:border-slate-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 text-left flex items-center justify-between"
                >
                  <span className="capitalize">{selectedStrategy}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showStrategyMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {showStrategyMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowStrategyMenu(false)} />
                    <div className="absolute top-full left-0 right-0 mt-1 bg-slate-950/95 border border-slate-700/50 rounded-lg shadow-xl z-50 max-h-96 backdrop-blur-sm overflow-y-auto">
                      {['aggressive', 'balanced', 'conservative'].map((strategy) => (
                        <button
                          key={strategy}
                          onClick={() => {
                            setSelectedStrategy(strategy);
                            setShowStrategyMenu(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 transition-all ${
                            selectedStrategy === strategy
                              ? 'bg-primary/20 text-primary border-l-2 border-primary'
                              : 'hover:bg-slate-800/50 text-slate-200'
                          }`}
                        >
                          <span className="capitalize font-medium">{strategy}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Help Icon Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowStrategyHelp(true)}
                className="gap-2 border-slate-700/50 hover:bg-slate-800/50 mt-6 md:mt-6"
                title="Strategy Information"
              >
                <HelpCircle className="w-4 h-4" />
              </Button>
            </div>

            {/* ✅ Strategy Help Dialog */}
            <Dialog open={showStrategyHelp} onOpenChange={setShowStrategyHelp}>
              <DialogContent className="w-full max-w-sm sm:max-w-md md:max-w-xl lg:max-w-2xl max-h-[90vh] overflow-y-auto mx-4 md:mx-0">
                <DialogHeader>
                  <DialogTitle className="text-xl md:text-2xl">Trading Strategies</DialogTitle>
                  <DialogDescription className="text-xs md:text-sm">Learn about each trading strategy</DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  {/* Aggressive Strategy */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      <span className="text-xl">🚀</span>
                      Aggressive Strategy
                    </h3>
                    <p className="text-sm text-slate-300">
                      <strong>Always operates</strong> - never waits for perfect signals. Combines 4 specialized advisors with weighted voting:
                    </p>
                    <ul className="text-sm text-slate-400 space-y-1 ml-4">
                      <li>• <strong>Pattern Counter (40%)</strong> - Detects reversals from last 3 candles</li>
                      <li>• <strong>Moving Average (30%)</strong> - Mean reversion strategy using SMA20</li>
                      <li>• <strong>Gap Hunter (20%)</strong> - Identifies and trades gap fills</li>
                      <li>• <strong>Level Analyst (10%)</strong> - Analyzes support/resistance levels</li>
                    </ul>
                    <p className="text-sm text-slate-300 mt-2">Best for traders who want high-frequency trading with consistent entries.</p>
                  </div>

                  {/* Balanced Strategy */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      <span className="text-xl">⚖️</span>
                      Balanced Strategy
                    </h3>
                    <p className="text-sm text-slate-300">
                      Uses <strong>RSI (Relative Strength Index)</strong> with a 50% confirmation threshold. Enters when:
                    </p>
                    <ul className="text-sm text-slate-400 space-y-1 ml-4">
                      <li>• <strong>CALL</strong> when RSI &lt; 35 (oversold condition)</li>
                      <li>• <strong>PUT</strong> when RSI &gt; 65 (overbought condition)</li>
                    </ul>
                    <p className="text-sm text-slate-300 mt-2">More selective than Aggressive. Waits for moderate confirmation signals, providing balanced risk/reward.</p>
                  </div>

                  {/* Conservative Strategy */}
                  <div className="space-y-3 p-4 rounded-lg bg-slate-900/50 border border-slate-700/50">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      <span className="text-xl">🛡️</span>
                      Conservative Strategy
                    </h3>
                    <p className="text-sm text-slate-300">
                      Uses <strong>3 indicators combined</strong> with 60% confirmation threshold. Requires strong confirmation from ALL:
                    </p>
                    <ul className="text-sm text-slate-400 space-y-1 ml-4">
                      <li>• <strong>RSI</strong> - RSI &lt; 40 (CALL) or RSI &gt; 60 (PUT)</li>
                      <li>• <strong>MACD</strong> - Must align with direction (positive for CALL, negative for PUT)</li>
                      <li>• <strong>Bollinger Bands</strong> - Price near upper/lower bands for confirmation</li>
                    </ul>

                    {/* Warning Box */}
                    <div className="mt-3 p-3 rounded-lg bg-amber-900/20 border border-amber-700/50 flex gap-3">
                      <span className="text-xl flex-shrink-0">⚠️</span>
                      <div className="text-sm text-amber-300/90">
                        <p className="font-semibold mb-1">Note:</p>
                        <p>The bot may be idle for extended periods. This is normal - it's waiting for strong multi-indicator confirmation to ensure high-probability trades only.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => setShowStrategyHelp(false)}
                  className="w-full mt-4 bg-primary hover:bg-primary/90"
                >
                  Close
                </Button>
              </DialogContent>
            </Dialog>

            {/* ✅ Entry Value with Slider - Compact Design */}
            <div className="space-y-2 px-3 md:px-4 py-2 rounded-lg bg-slate-900/20">
              <div className="flex items-center justify-between">
                <label className="text-xs md:text-sm font-medium text-white">Entry Value</label>
                {editingEntryValue ? (
                  <input
                    autoFocus
                    type="number"
                    min="2"
                    step="0.01"
                    value={entryValue}
                    onChange={(e) => setEntryValue(Number(e.target.value))}
                    onBlur={() => setEditingEntryValue(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setEditingEntryValue(false);
                    }}
                    className="w-24 px-2 py-1 rounded text-right text-sm font-semibold bg-slate-800 border border-primary text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                ) : (
                  <span
                    onClick={() => setEditingEntryValue(true)}
                    className="text-sm font-semibold text-primary cursor-pointer hover:opacity-80 transition-opacity px-2 py-1 rounded hover:bg-slate-800/50"
                  >
                    R$ {entryValue.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Slider */}
              <input
                type="range"
                min="5"
                max="500"
                step="5"
                value={Math.min(entryValue, 500)}
                onChange={(e) => setEntryValue(Number(e.target.value))}
                disabled={isRunning}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed accent-primary"
                style={{
                  background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(59, 130, 246) ${Math.min((entryValue / 500) * 100, 100)}%, rgb(30, 41, 59) ${Math.min((entryValue / 500) * 100, 100)}%, rgb(30, 41, 59) 100%)`
                }}
              />

              {/* Range Labels */}
              <div className="flex justify-between text-xs text-slate-500">
                <span>R$ 5</span>
                <span>R$ 500</span>
              </div>
            </div>

            {/* ✅ P&L Chart: Always visible (bot running or not) */}
            <AutoModeRunning
              pnlData={pnlData}
              currentStatus={currentStatus}
              currentAsset={isRunning ? (sessionTrades[0]?.asset || (sessionTrades[0] as any)?.ativo_nome) : (trades[0]?.asset || (trades[0] as any)?.ativo_nome)}
              currentAmount={isRunning ? (sessionTrades[0]?.pnl ? Math.abs(sessionTrades[0].pnl) : undefined) : (trades[0]?.pnl ? Math.abs(trades[0].pnl) : undefined)}
              isRunning={isRunning}
              trades={isRunning ? sessionTrades.slice(0, 8) as any : trades.slice(0, 8) as any}
            />

            {/* ✅ Start/Stop Bot Button + Advanced Settings Icon */}
            <div className="flex items-center justify-center gap-1 md:gap-2">
              {/* Advanced Settings Icon Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAutoAdvanced(true)}
                className="gap-2 bg-slate-800/60 border-slate-600 hover:bg-slate-700 hover:border-slate-500 text-slate-200 hover:text-slate-100 px-2 md:px-3 flex-shrink-0 transition-all shadow-md"
                title="Advanced Settings"
              >
                <Settings className="w-4 md:w-5 h-4 md:h-5" />
              </Button>

              {/* Start/Stop Bot Button */}
              {isRunning ? (
                <Button
                  onClick={handleStopBot}
                  disabled={botLoading}
                  size="sm"
                  className="gap-1 md:gap-2 bg-negative hover:bg-negative/90 text-white shadow-lg shadow-negative/30 flex-1 text-xs md:text-sm px-2 md:px-4"
                >
                  {botLoading ? (
                    <Loader2 className="w-4 md:w-5 h-4 md:h-5 animate-spin flex-shrink-0" />
                  ) : (
                    <Square className="w-4 md:w-5 h-4 md:h-5 flex-shrink-0" />
                  )}
                  <span className="hidden md:inline">Stop Bot</span>
                  <span className="md:hidden">Stop</span>
                </Button>
              ) : (
                <Button
                  onClick={handleStartBot}
                  disabled={!isConnected || botLoading}
                  size="sm"
                  className="gap-1 md:gap-2 bg-positive text-white hover:bg-positive/90 shadow-lg shadow-positive/30 flex-1 text-xs md:text-sm px-2 md:px-4"
                >
                  {botLoading ? (
                    <Loader2 className="w-4 md:w-5 h-4 md:h-5 animate-spin flex-shrink-0" />
                  ) : (
                    <Play className="w-4 md:w-5 h-4 md:h-5 flex-shrink-0" />
                  )}
                  <span className="hidden md:inline">Start Bot</span>
                  <span className="md:hidden">Start</span>
                </Button>
              )}
            </div>

            {/* ✅ Auto Mode Advanced Settings Modal */}
            {showAutoAdvanced && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-4">
                <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-700/50 rounded-lg bg-slate-900">
                  {/* Header */}
                  <div className="px-4 md:px-6 py-3 md:py-4 border-b border-slate-700/30">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <h2 className="text-lg md:text-2xl font-bold text-slate-100 truncate">Advanced Settings</h2>
                        <p className="text-xs md:text-sm text-slate-400 mt-1">Optional risk management options</p>
                      </div>
                      <button
                        onClick={() => setShowAutoAdvanced(false)}
                        className="p-2 hover:bg-slate-700/30 rounded-lg transition-colors flex-shrink-0"
                      >
                        <X className="w-4 md:w-5 h-4 md:h-5 text-slate-400" />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto px-3 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6">
                    {/* Leverage */}
                    <div className="space-y-3 p-3 md:p-4 bg-slate-900/30 rounded-lg border border-slate-700/30">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Label className="text-sm md:text-base font-semibold text-slate-100">Leverage</Label>
                            <button
                              onClick={() => setShowHelp(showHelp === 'leverage' ? null : 'leverage')}
                              className="text-slate-400 hover:text-primary transition-colors"
                            >
                              <HelpCircle className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-xs md:text-sm text-slate-400 mt-2">
                            Multiply your entry value after each loss to recover losses faster
                          </p>
                        </div>
                        <Button
                          variant={leverageEnabled ? "default" : "outline"}
                          size="sm"
                          onClick={() => setLeverageEnabled((prev) => !prev)}
                          className="flex-shrink-0"
                        >
                          {leverageEnabled ? "ON" : "OFF"}
                        </Button>
                      </div>
                      {showHelp === 'leverage' && (
                        <div className="mt-3 p-3 bg-slate-950/50 rounded border border-slate-700/50 text-xs text-slate-300">
                          <p className="font-semibold text-primary mb-2">How Leverage Works:</p>
                          <ul className="space-y-1 list-disc list-inside">
                            <li>Each loss multiplies your next entry by the leverage factor</li>
                            <li>Win resets the counter and multiplier back to 1x</li>
                            <li>Example: 2x leverage on $20 = $40 after first loss</li>
                            <li>Increases risk - use cautiously</li>
                          </ul>
                        </div>
                      )}
                      {leverageEnabled && (
                        <Input
                          type="number"
                          min="1.5"
                          max="5"
                          step="0.5"
                          value={leverage}
                          onChange={(e) => setLeverage(Number(e.target.value))}
                          className="bg-slate-950/50 border-slate-700/50"
                          placeholder="Multiplier (1.5 - 5)"
                        />
                      )}
                    </div>

                    {/* Safety Stop */}
                    <div className="space-y-3 p-3 md:p-4 bg-slate-900/30 rounded-lg border border-slate-700/30">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Label className="text-sm md:text-base font-semibold text-slate-100">Safety Stop</Label>
                            <button
                              onClick={() => setShowHelp(showHelp === 'safetystop' ? null : 'safetystop')}
                              className="text-slate-400 hover:text-primary transition-colors"
                            >
                              <HelpCircle className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-xs md:text-sm text-slate-400 mt-2">
                            Automatically stop the bot after reaching consecutive losses
                          </p>
                        </div>
                        <Button
                          variant={safetyStopEnabled ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSafetyStopEnabled((prev) => !prev)}
                          className="flex-shrink-0"
                        >
                          {safetyStopEnabled ? "ON" : "OFF"}
                        </Button>
                      </div>
                      {showHelp === 'safetystop' && (
                        <div className="mt-3 p-3 bg-slate-950/50 rounded border border-slate-700/50 text-xs text-slate-300">
                          <p className="font-semibold text-primary mb-2">How Safety Stop Works:</p>
                          <ul className="space-y-1 list-disc list-inside">
                            <li>Counts consecutive losses in a row</li>
                            <li>A win resets the counter to 0</li>
                            <li>Stops trading when limit is reached</li>
                            <li>Example: Set to 5 = stops after 5 consecutive losses</li>
                          </ul>
                        </div>
                      )}
                      {safetyStopEnabled && (
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          step="1"
                          value={safetyStop}
                          onChange={(e) => setSafetyStop(Number(e.target.value))}
                          className="bg-slate-950/50 border-slate-700/50"
                          placeholder="Number of consecutive losses"
                        />
                      )}
                    </div>

                    {/* Daily Goal */}
                    <div className="space-y-3 p-3 md:p-4 bg-slate-900/30 rounded-lg border border-slate-700/30">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Label className="text-sm md:text-base font-semibold text-slate-100">Daily Goal</Label>
                            <button
                              onClick={() => setShowHelp(showHelp === 'dailygoal' ? null : 'dailygoal')}
                              className="text-slate-400 hover:text-primary transition-colors"
                            >
                              <HelpCircle className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-xs md:text-sm text-slate-400 mt-2">
                            Stop trading once you reach your target profit for the day
                          </p>
                        </div>
                        <Button
                          variant={dailyGoalEnabled ? "default" : "outline"}
                          size="sm"
                          onClick={() => setDailyGoalEnabled((prev) => !prev)}
                          className="flex-shrink-0"
                        >
                          {dailyGoalEnabled ? "ON" : "OFF"}
                        </Button>
                      </div>
                      {showHelp === 'dailygoal' && (
                        <div className="mt-3 p-3 bg-slate-950/50 rounded border border-slate-700/50 text-xs text-slate-300">
                          <p className="font-semibold text-primary mb-2">How Daily Goal Works:</p>
                          <ul className="space-y-1 list-disc list-inside">
                            <li>Tracks cumulative P&L during the session</li>
                            <li>Bot stops when your profit reaches the goal</li>
                            <li>Example: Set to R$ 100 = stops after earning R$ 100</li>
                            <li>Helps you lock in profits and manage risk</li>
                          </ul>
                        </div>
                      )}
                      {dailyGoalEnabled && (
                        <Input
                          type="number"
                          min="1"
                          max="10000"
                          step="10"
                          value={dailyGoal}
                          onChange={(e) => setDailyGoal(Number(e.target.value))}
                          className="bg-slate-950/50 border-slate-700/50"
                          placeholder="Target profit amount"
                        />
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-4 md:px-6 py-3 md:py-4 border-t border-slate-700/30 bg-slate-900/20">
                    <Button
                      onClick={() => setShowAutoAdvanced(false)}
                      className="w-full bg-primary hover:bg-primary/90 text-white font-semibold text-sm md:text-base"
                    >
                      Apply Settings
                    </Button>
                  </div>
                </div>
              </div>
            )}

          </>
        ) : (
          // MANUAL MODE
          <>
            {/* ✅ Entry Value with Slider - Compact Design */}
            <div className="space-y-2 px-3 md:px-4 py-2 rounded-lg bg-slate-900/20">
              <div className="flex items-center justify-between">
                <label className="text-xs md:text-sm font-medium text-white">Entry Value</label>
                {editingEntryValue ? (
                  <input
                    autoFocus
                    type="number"
                    min="2"
                    step="0.01"
                    value={entryValue}
                    onChange={(e) => setEntryValue(Number(e.target.value))}
                    onBlur={() => setEditingEntryValue(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setEditingEntryValue(false);
                    }}
                    className="w-24 px-2 py-1 rounded text-right text-sm font-semibold bg-slate-800 border border-primary text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                ) : (
                  <span
                    onClick={() => setEditingEntryValue(true)}
                    className="text-sm font-semibold text-primary cursor-pointer hover:opacity-80 transition-opacity px-2 py-1 rounded hover:bg-slate-800/50"
                  >
                    R$ {entryValue.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Slider */}
              <input
                type="range"
                min="5"
                max="500"
                step="5"
                value={Math.min(entryValue, 500)}
                onChange={(e) => setEntryValue(Number(e.target.value))}
                disabled={isRunning}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed accent-primary"
                style={{
                  background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(59, 130, 246) ${Math.min((entryValue / 500) * 100, 100)}%, rgb(30, 41, 59) ${Math.min((entryValue / 500) * 100, 100)}%, rgb(30, 41, 59) 100%)`
                }}
              />

              {/* Range Labels */}
              <div className="flex justify-between text-xs text-slate-500">
                <span>R$ 5</span>
                <span>R$ 500</span>
              </div>
            </div>

            <TradingChart
              category={category}
              asset={asset}
              timeframe={timeframe}
              onCategoryChange={setCategory}
              onAssetChange={setAsset}
              onTimeframeChange={setTimeframe}
              tradeMarkers={tradeMarkers}
              currentStatus={currentStatus}
              currentAsset={asset}
              isRunning={isRunning}
              currentPnL={metrics.pnl}
              trades={trades.slice(0, 8) as any}
            />

            {/* ✅ Start/Stop Bot Button + Advanced Settings Icon */}
            <div className="flex items-center justify-center gap-1 md:gap-2">
              {/* Advanced Settings Icon Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowManualAdvanced(true)}
                className="gap-2 bg-slate-800/60 border-slate-600 hover:bg-slate-700 hover:border-slate-500 text-slate-200 hover:text-slate-100 px-2 md:px-3 flex-shrink-0 transition-all shadow-md"
                title="Advanced Settings"
              >
                <Settings className="w-4 md:w-5 h-4 md:h-5" />
              </Button>

              {/* Start/Stop Bot Button */}
              {isRunning ? (
                <Button
                  onClick={handleStopBot}
                  disabled={botLoading}
                  size="sm"
                  className="gap-1 md:gap-2 bg-negative hover:bg-negative/90 text-white shadow-lg shadow-negative/30 flex-1 text-xs md:text-sm px-2 md:px-4"
                >
                  {botLoading ? (
                    <Loader2 className="w-4 md:w-5 h-4 md:h-5 animate-spin flex-shrink-0" />
                  ) : (
                    <Square className="w-4 md:w-5 h-4 md:h-5 flex-shrink-0" />
                  )}
                  <span className="hidden md:inline">Stop Bot</span>
                  <span className="md:hidden">Stop</span>
                </Button>
              ) : (
                <Button
                  onClick={handleStartBot}
                  disabled={!isConnected || botLoading}
                  size="sm"
                  className="gap-1 md:gap-2 bg-positive text-white hover:bg-positive/90 shadow-lg shadow-positive/30 flex-1 text-xs md:text-sm px-2 md:px-4"
                >
                  {botLoading ? (
                    <Loader2 className="w-4 md:w-5 h-4 md:h-5 animate-spin flex-shrink-0" />
                  ) : (
                    <Play className="w-4 md:w-5 h-4 md:h-5 flex-shrink-0" />
                  )}
                  <span className="hidden md:inline">Start Bot</span>
                  <span className="md:hidden">Start</span>
                </Button>
              )}
            </div>

            {/* ✅ Manual Mode Advanced Settings Modal */}
            {showManualAdvanced && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-4">
                <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-700/50 rounded-lg bg-slate-900">
                  {/* Header */}
                  <div className="px-4 md:px-6 py-3 md:py-4 border-b border-slate-700/30">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <h2 className="text-lg md:text-2xl font-bold text-slate-100 truncate">Advanced Settings</h2>
                        <p className="text-xs md:text-sm text-slate-400 mt-1">Optional risk management options</p>
                      </div>
                      <button
                        onClick={() => setShowManualAdvanced(false)}
                        className="p-2 hover:bg-slate-700/30 rounded-lg transition-colors flex-shrink-0"
                      >
                        <X className="w-4 md:w-5 h-4 md:h-5 text-slate-400" />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto px-3 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6">
                    {/* Leverage */}
                    <div className="space-y-3 p-3 md:p-4 bg-slate-900/30 rounded-lg border border-slate-700/30">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Label className="text-sm md:text-base font-semibold text-slate-100">Leverage</Label>
                            <button
                              onClick={() => setShowHelp(showHelp === 'leverage' ? null : 'leverage')}
                              className="text-slate-400 hover:text-primary transition-colors"
                            >
                              <HelpCircle className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-xs md:text-sm text-slate-400 mt-2">
                            Multiply your entry value after each loss to recover losses faster
                          </p>
                        </div>
                        <Button
                          variant={leverageEnabled ? "default" : "outline"}
                          size="sm"
                          onClick={() => setLeverageEnabled((prev) => !prev)}
                          className="flex-shrink-0"
                        >
                          {leverageEnabled ? "ON" : "OFF"}
                        </Button>
                      </div>
                      {showHelp === 'leverage' && (
                        <div className="mt-3 p-3 bg-slate-950/50 rounded border border-slate-700/50 text-xs text-slate-300">
                          <p className="font-semibold text-primary mb-2">How Leverage Works:</p>
                          <ul className="space-y-1 list-disc list-inside">
                            <li>Each loss multiplies your next entry by the leverage factor</li>
                            <li>Win resets the counter and multiplier back to 1x</li>
                            <li>Example: 2x leverage on $20 = $40 after first loss</li>
                            <li>Increases risk - use cautiously</li>
                          </ul>
                        </div>
                      )}
                      {leverageEnabled && (
                        <Input
                          type="number"
                          min="1.5"
                          max="5"
                          step="0.5"
                          value={leverage}
                          onChange={(e) => setLeverage(Number(e.target.value))}
                          className="bg-slate-950/50 border-slate-700/50"
                          placeholder="Multiplier (1.5 - 5)"
                        />
                      )}
                    </div>

                    {/* Safety Stop */}
                    <div className="space-y-3 p-3 md:p-4 bg-slate-900/30 rounded-lg border border-slate-700/30">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Label className="text-sm md:text-base font-semibold text-slate-100">Safety Stop</Label>
                            <button
                              onClick={() => setShowHelp(showHelp === 'safetystop' ? null : 'safetystop')}
                              className="text-slate-400 hover:text-primary transition-colors"
                            >
                              <HelpCircle className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-xs md:text-sm text-slate-400 mt-2">
                            Automatically stop the bot after reaching consecutive losses
                          </p>
                        </div>
                        <Button
                          variant={safetyStopEnabled ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSafetyStopEnabled((prev) => !prev)}
                          className="flex-shrink-0"
                        >
                          {safetyStopEnabled ? "ON" : "OFF"}
                        </Button>
                      </div>
                      {showHelp === 'safetystop' && (
                        <div className="mt-3 p-3 bg-slate-950/50 rounded border border-slate-700/50 text-xs text-slate-300">
                          <p className="font-semibold text-primary mb-2">How Safety Stop Works:</p>
                          <ul className="space-y-1 list-disc list-inside">
                            <li>Counts consecutive losses in a row</li>
                            <li>A win resets the counter to 0</li>
                            <li>Stops trading when limit is reached</li>
                            <li>Example: Set to 5 = stops after 5 consecutive losses</li>
                          </ul>
                        </div>
                      )}
                      {safetyStopEnabled && (
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          step="1"
                          value={safetyStop}
                          onChange={(e) => setSafetyStop(Number(e.target.value))}
                          className="bg-slate-950/50 border-slate-700/50"
                          placeholder="Number of consecutive losses"
                        />
                      )}
                    </div>

                    {/* Daily Goal */}
                    <div className="space-y-3 p-3 md:p-4 bg-slate-900/30 rounded-lg border border-slate-700/30">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Label className="text-sm md:text-base font-semibold text-slate-100">Daily Goal</Label>
                            <button
                              onClick={() => setShowHelp(showHelp === 'dailygoal' ? null : 'dailygoal')}
                              className="text-slate-400 hover:text-primary transition-colors"
                            >
                              <HelpCircle className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-xs md:text-sm text-slate-400 mt-2">
                            Stop trading once you reach your target profit for the day
                          </p>
                        </div>
                        <Button
                          variant={dailyGoalEnabled ? "default" : "outline"}
                          size="sm"
                          onClick={() => setDailyGoalEnabled((prev) => !prev)}
                          className="flex-shrink-0"
                        >
                          {dailyGoalEnabled ? "ON" : "OFF"}
                        </Button>
                      </div>
                      {showHelp === 'dailygoal' && (
                        <div className="mt-3 p-3 bg-slate-950/50 rounded border border-slate-700/50 text-xs text-slate-300">
                          <p className="font-semibold text-primary mb-2">How Daily Goal Works:</p>
                          <ul className="space-y-1 list-disc list-inside">
                            <li>Tracks cumulative P&L during the session</li>
                            <li>Bot stops when your profit reaches the goal</li>
                            <li>Example: Set to R$ 100 = stops after earning R$ 100</li>
                            <li>Helps you lock in profits and manage risk</li>
                          </ul>
                        </div>
                      )}
                      {dailyGoalEnabled && (
                        <Input
                          type="number"
                          min="1"
                          max="10000"
                          step="10"
                          value={dailyGoal}
                          onChange={(e) => setDailyGoal(Number(e.target.value))}
                          className="bg-slate-950/50 border-slate-700/50"
                          placeholder="Target profit amount"
                        />
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-4 md:px-6 py-3 md:py-4 border-t border-slate-700/30 bg-slate-900/20">
                    <Button
                      onClick={() => setShowManualAdvanced(false)}
                      className="w-full bg-primary hover:bg-primary/90 text-white font-semibold text-sm md:text-base"
                    >
                      Apply Settings
                    </Button>
                  </div>
                </div>
              </div>
            )}

          </>
        )}

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
      {xpInstances.length > 0 && console.log('🎆 [Render] XP Instances:', xpInstances.length)}
      {xpInstances.map((instance) => (
        <FloatingXP
          key={instance.id}
          amount={instance.amount}
          x={instance.x}
          y={instance.y}
          onComplete={() => {}}
        />
      ))}

      {/* Floating PnL Instances - Animated profit/loss amounts (wins: 2s green, losses: 1.5s red) */}
      {pnlInstances.length > 0 && console.log('💰 [Render] PnL Instances:', pnlInstances.length)}
      {pnlInstances.map((instance) => (
        <FloatingPnL
          key={instance.id}
          amount={instance.amount}
          x={instance.x}
          y={instance.y}
          variant={instance.variant}
          duration={instance.duration}
          onComplete={() => {}}
        />
      ))}

      {/* Badge Unlock Modal - Celebration for new badges */}
      <BadgeUnlockModal />

      {/* Level Up Modal - Celebration for level ups */}
      <LevelUpModal />

      {/* ✅ SESSION SUMMARY MODAL - Shows when STOP BOT is clicked */}
      <SessionSummary
        isOpen={showSessionSummary}
        sessionTrades={sessionTrades as any}
        totalPnL={sessionPnL}
        config={sessionConfig}
        onClose={handleResetSession}
        onTradeClick={(trade) => setSelectedTrade(trade as any)}
      />

      {/* ✅ TRADE EXPLANATION MODAL - Shows when a trade is clicked from SessionSummary */}
      <TradeExplanation
        isOpen={selectedTrade !== null}
        trade={selectedTrade as any}
        onClose={() => setSelectedTrade(null)}
      />

    </div>
  );
};

export default Operations;
