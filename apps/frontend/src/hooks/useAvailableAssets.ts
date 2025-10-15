import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AvalonService } from "@/services/avalon";

export interface Asset {
  id: string;
  asset_id: string;
  asset_name: string;
  category: "crypto" | "forex" | "commodities" | "indices";
  ticker: string;
  is_active: boolean;
}

const CACHE_KEY = "avalon_assets_cache";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useAvailableAssets = (category?: string) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setIsLoading(true);

        // Try to get cached assets
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION) {
            const filtered = category 
              ? data.filter((a: Asset) => a.category === category)
              : data;
            setAssets(filtered);
            setIsLoading(false);
            return;
          }
        }

        // Fetch from Avalon API via Edge Function
        const avalonAssets = await AvalonService.getAssets();

        // Fetch metadata from Supabase
        const { data: dbAssets, error } = await supabase
          .from("available_assets")
          .select("*")
          .eq("is_active", true);

        if (error) throw error;

        // Combine Avalon data with Supabase metadata
        const combined = avalonAssets.map(avalonAsset => {
          const dbAsset = (dbAssets || []).find(
            db => db.asset_id === avalonAsset.id.toString()
          );

          return {
            id: avalonAsset.id.toString(),
            asset_id: avalonAsset.id.toString(),
            asset_name: avalonAsset.name,
            category: (dbAsset?.category || "crypto") as "crypto" | "forex" | "commodities" | "indices",
            ticker: dbAsset?.ticker || avalonAsset.name,
            is_active: avalonAsset.is_enabled && !avalonAsset.is_suspended,
          };
        });

        // Cache the results
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          data: combined,
          timestamp: Date.now()
        }));

        const filtered = category 
          ? combined.filter(a => a.category === category)
          : combined;

        setAssets(filtered);
      } catch (error) {
        console.error("Error fetching assets:", error);
        
        // Fallback to Supabase only
        let query = supabase
          .from("available_assets")
          .select("*")
          .eq("is_active", true)
          .order("asset_name");

        if (category) {
          query = query.eq("category", category);
        }

        const { data, error: fallbackError } = await query;
        if (!fallbackError) {
          setAssets((data || []) as Asset[]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssets();
  }, [category]);

  const groupedAssets = assets.reduce((acc, asset) => {
    if (!acc[asset.category]) {
      acc[asset.category] = [];
    }
    acc[asset.category].push(asset);
    return acc;
  }, {} as Record<string, Asset[]>);

  return { assets, groupedAssets, isLoading };
};
