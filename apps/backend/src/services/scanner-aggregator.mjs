// Scanner Aggregator Service
// Aggregates data from strategy_trades and populates scanner_performance table
// Used by Market Scanner UI to display high-confidence asset/timeframe combinations

import { supabase } from '../../config/supabase.mjs';

export const scannerAggregator = {
  /**
   * Aggregates strategy_trades data into scanner_performance table
   * Groups by: active_id, ativo_nome, timeframe
   * Calculates: win_rate, total_signals, total_wins, total_losses, last_updated
   */
  async aggregatePerformance() {
    try {
      console.log('🔧 [ScannerAggregator] Starting aggregation of strategy_trades...');

      // Step 1: Fetch all completed trades (WIN/LOSS) from strategy_trades
      const { data: trades, error: fetchError } = await supabase
        .from('strategy_trades')
        .select('*')
        .in('result', ['WIN', 'LOSS']) // Only completed trades
        .order('signal_timestamp', { ascending: false });

      if (fetchError) {
        throw new Error(`Failed to fetch trades: ${fetchError.message}`);
      }

      if (!trades || trades.length === 0) {
        console.log('⚠️  [ScannerAggregator] No completed trades found');
        return { aggregated: 0, upserted: 0 };
      }

      console.log(`📊 [ScannerAggregator] Found ${trades.length} completed trades`);

      // Step 2: Group trades by active_id, ativo_nome, timeframe
      const grouped = {};
      const key = (trade) => `${trade.active_id}|${trade.ativo_nome}|${trade.timeframe}`;

      trades.forEach((trade) => {
        const groupKey = key(trade);
        if (!grouped[groupKey]) {
          grouped[groupKey] = {
            active_id: trade.active_id,
            ativo_nome: trade.ativo_nome,
            timeframe: trade.timeframe,
            wins: 0,
            losses: 0,
            total: 0,
            last_updated: trade.signal_timestamp || new Date().toISOString()
          };
        }

        if (trade.result === 'WIN') {
          grouped[groupKey].wins++;
        } else if (trade.result === 'LOSS') {
          grouped[groupKey].losses++;
        }
        grouped[groupKey].total++;

        // Update last_updated to most recent trade
        if (trade.signal_timestamp > grouped[groupKey].last_updated) {
          grouped[groupKey].last_updated = trade.signal_timestamp;
        }
      });

      console.log(`📈 [ScannerAggregator] Grouped into ${Object.keys(grouped).length} combinations`);

      // Step 3: Transform to scanner_performance format
      const performanceData = Object.values(grouped).map((group) => ({
        active_id: group.active_id,
        ativo_nome: group.ativo_nome,
        timeframe: group.timeframe,
        total_signals: group.total,
        total_wins: group.wins,
        total_losses: group.losses,
        win_rate: group.total > 0 ? Math.round((group.wins / group.total) * 100) : 0,
        last_updated: new Date().toISOString()
      }));

      console.log(`✅ [ScannerAggregator] Prepared ${performanceData.length} performance records`);

      // Step 4: Upsert into scanner_performance table
      // First, delete old records to avoid duplicates
      const { error: deleteError } = await supabase
        .from('scanner_performance')
        .delete()
        .gt('last_updated', '1900-01-01'); // Delete all (safe way)

      if (deleteError) {
        console.warn(`⚠️  [ScannerAggregator] Could not clear old data: ${deleteError.message}`);
      }

      // Then insert new aggregated data
      const { data: upserted, error: upsertError } = await supabase
        .from('scanner_performance')
        .insert(performanceData)
        .select();

      if (upsertError) {
        throw new Error(`Failed to upsert performance data: ${upsertError.message}`);
      }

      console.log(`🎯 [ScannerAggregator] Upserted ${upserted?.length || 0} records into scanner_performance`);

      return {
        aggregated: Object.keys(grouped).length,
        upserted: upserted?.length || 0,
        success: true
      };
    } catch (error) {
      console.error(`❌ [ScannerAggregator] Error during aggregation: ${error.message}`);
      throw error;
    }
  },

  /**
   * Get aggregated performance stats
   * Returns top assets by win rate with 15+ signals
   */
  async getTopPerformance(limit = 20) {
    try {
      const { data, error } = await supabase
        .from('scanner_performance')
        .select('*')
        .gte('total_signals', 15) // Only assets with 15+ signals
        .order('win_rate', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error(`❌ [ScannerAggregator] Error fetching top performance: ${error.message}`);
      throw error;
    }
  }
};

export default scannerAggregator;
