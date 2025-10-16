import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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

        // Fetch from Supabase (AvalonService.getAssets() method doesn't exist)
        let query = supabase
          .from("available_assets")
          .select("*")
          .eq("is_active", true)
          .order("asset_name");

        if (category) {
          query = query.eq("category", category);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Cache the results
        if (data) {
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            data,
            timestamp: Date.now()
          }));
        }

        setAssets((data || []) as Asset[]);
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
