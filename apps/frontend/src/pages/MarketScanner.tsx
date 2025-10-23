// MarketScanner Component - Main scanner page with real-time heatmap
// Displays market performance across assets and strategies with live updates

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { DashboardHeader, Sidebar } from '@/features/dashboard';
import { useScannerSubscription, HeatmapGrid } from '@/features/market-scanner';
import type { ScannerAsset, ScannerConfig } from '@/features/market-scanner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Loader2, RefreshCw, Activity, Zap } from 'lucide-react';
import { DiagonalSection } from '@/components/ui/gamification';
import axios from 'axios';
import { getApiUrl } from '@/shared/utils/getApiUrl';

const API_URL = getApiUrl();

type AssetLookupEntry = {
  key: string;
  name: string;
};

type AssetLookup = {
  byId: Record<number, AssetLookupEntry>;
  byName: Record<string, AssetLookupEntry>;
};

export const MarketScanner: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const { assets, loading, error, lastUpdate, refresh } = useScannerSubscription();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [assetLookup, setAssetLookup] = useState<AssetLookup>({ byId: {}, byName: {} });

  // Auth check
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate('/auth');
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
      if (!session) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Fetch asset metadata (id -> key) from backend
  useEffect(() => {
    const fetchAssetMetadata = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/assets`);
        const assetsData = response.data?.assets;
        if (!assetsData) return;

        const byId: Record<number, AssetLookupEntry> = {};
        const byName: Record<string, AssetLookupEntry> = {};

        Object.values(assetsData).forEach((categoryAssets: any) => {
          if (!Array.isArray(categoryAssets)) return;
          categoryAssets.forEach((asset: any) => {
            if (!asset?.key) return;

            const entry: AssetLookupEntry = {
              key: asset.key,
              name: asset.name
            };

            if (asset.id !== undefined && asset.id !== null) {
              byId[Number(asset.id)] = entry;
            }

            if (asset.name) {
              byName[String(asset.name).toUpperCase()] = entry;
            }
          });
        });

        setAssetLookup({ byId, byName });
      } catch (err) {
        console.error('[MarketScanner] Error loading asset metadata:', err);
      }
    };

    fetchAssetMetadata();
  }, []);

  const resolveTimeframeLabel = useMemo(() => {
    const map = new Map<number, string>([
      [10, '10s'],
      [30, '30s'],
      [60, '1m'],
      [300, '5m']
    ]);

    return (value: number) => map.get(value) ?? `${value}s`;
  }, []);

  const buildPresetConfig = (asset: ScannerAsset): ScannerConfig => {
    const assetId = Number(asset.active_id);
    const lookupById = Number.isFinite(assetId) ? assetLookup.byId[assetId] : undefined;
    const lookupByName = assetLookup.byName[asset.ativo_nome?.toUpperCase() || ''];

    const resolvedEntry = lookupById ?? lookupByName;

    const fallbackKey = (() => {
      const name = asset.ativo_nome || '';
      const hasOtc = /OTC$/i.test(name);
      const cleaned = name
        .replace(/OTC/i, '')
        .replace(/\//g, '')
        .replace(/\s+/g, '')
        .replace(/[^A-Za-z0-9]/g, '')
        .toUpperCase();
      return hasOtc ? `${cleaned}-OTC` : cleaned;
    })();

    return {
      assetKey: resolvedEntry?.key ?? fallbackKey,
      assetName: resolvedEntry?.name ?? asset.ativo_nome,
      assetId: String(asset.active_id),
      timeframe: asset.timeframe
    };
  };

  const handleAssetClick = (asset: ScannerAsset) => {
    const presetConfig = buildPresetConfig(asset);

    navigate('/', {
      state: {
        presetConfig: {
          ...presetConfig,
          timeframeLabel: resolveTimeframeLabel(presetConfig.timeframe)
        }
      }
    });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Auth loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Initial loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden pt-16">
        <DashboardHeader user={user} />
        <Sidebar />
        <div className="lg:ml-64 container mx-auto px-4 pt-8 pb-32 relative z-20">
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="text-muted-foreground text-lg">Loading Market Scanner...</p>
            <p className="text-sm text-muted-foreground/60">
              Establishing real-time connection
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden pt-16">
        <DashboardHeader user={user} />
        <Sidebar />
        <div className="lg:ml-64 container mx-auto px-4 pt-8 pb-32 relative z-20">
          <Card className="glass border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Error Loading Scanner
              </CardTitle>
              <CardDescription className="text-destructive/80">{error}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleRefresh} variant="outline" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <DashboardHeader user={user} />
      <Sidebar />
      <div className="lg:ml-64 container mx-auto px-4 pt-8 pb-32 space-y-6 relative z-20">
        {/* Diagonal Section Header */}
        <DiagonalSection
          direction="top-left"
          gradientFrom="from-primary/40"
          className="h-40 lg:h-48 relative z-20 -mx-4 lg:-ml-4"
        >
          <div className="relative z-30">
            <h1 className="text-3xl lg:text-4xl font-bold text-white flex items-center gap-2">
              <Zap className="w-8 h-8 text-primary" />
              Market Scanner
            </h1>
            <p className="text-muted-foreground mt-1 text-sm lg:text-base">Real-time performance heatmap with hybrid strategy analysis</p>
          </div>
        </DiagonalSection>

        {/* Last Update and Refresh Info */}
        <div className="flex items-center justify-between gap-4">
          {lastUpdate && (
            <div className="text-sm text-muted-foreground">
              Last update: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
          <div className="flex items-center gap-2">
            {/* Refresh button */}
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Refresh</span>
            </Button>

            {/* Asset count */}
            <div className="px-3 py-2 bg-primary/10 text-primary rounded-lg text-sm font-semibold">
              {assets.length} {assets.length === 1 ? 'Asset' : 'Assets'}
            </div>
          </div>
        </div>

        {/* Help text */}
        <Card className="glass backdrop-blur-xl bg-slate-800/20 border-slate-700/30">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Tip:</strong> Click on any asset card to
              navigate to Operations page with pre-configured settings for that asset and
              timeframe.
            </p>
          </CardContent>
        </Card>

        {/* Heatmap Grid */}
        {assets.length > 0 ? (
          <HeatmapGrid assets={assets} onAssetClick={handleAssetClick} />
        ) : (
          <Card className="glass backdrop-blur-xl bg-slate-900/50 border-slate-700/50">
            <CardContent className="py-12 text-center space-y-3">
              <p className="text-lg font-semibold text-foreground">
                No high-confidence signals right now
              </p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                The scanner displays the 20 assets with the best win rate that also have at
                least 15 signals. We will refresh automatically as soon as new signals arrive.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MarketScanner;
