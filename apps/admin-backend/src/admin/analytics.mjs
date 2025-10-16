/**
 * Analytics service for dashboard metrics and charts
 *
 * IMPORTANTE: Todas as métricas focam em conta REAL
 * Métricas DEMO são secundárias (apenas para análise de conversão)
 *
 * @module admin/services/analytics
 */

import { supabase } from '../../config/supabase.mjs';

/**
 * Get complete dashboard metrics
 * Priority: REAL account metrics
 */
export async function getDashboardMetrics() {
  // ===== USER METRICS =====

  // Total users and account type breakdown
  const { data: userMetrics } = await supabase.rpc('exec_sql', {
    query: `
      SELECT
        COUNT(DISTINCT u.id) as total_users,
        COUNT(DISTINCT CASE WHEN bs.account_type = 'real' THEN bs.user_id END) as total_users_real,
        COUNT(DISTINCT CASE
          WHEN bs.account_type = 'demo'
          AND NOT EXISTS (
            SELECT 1 FROM bot_status bs2
            WHERE bs2.user_id = bs.user_id AND bs2.account_type = 'real'
          )
          THEN bs.user_id
        END) as total_users_demo_only,
        COUNT(DISTINCT CASE
          WHEN u.last_sign_in_at >= NOW() - INTERVAL '24 hours'
          AND EXISTS (SELECT 1 FROM bot_status WHERE user_id = u.id AND account_type = 'real')
          THEN u.id
        END) as active_users_today_real,
        COUNT(DISTINCT CASE
          WHEN u.created_at >= NOW() - INTERVAL '7 days'
          AND EXISTS (SELECT 1 FROM bot_status WHERE user_id = u.id AND account_type = 'real')
          THEN u.id
        END) as new_users_week_real,
        COUNT(DISTINCT CASE
          WHEN u.last_sign_in_at >= NOW() - INTERVAL '30 days'
          THEN u.id
        END) as mau
      FROM auth.users u
      LEFT JOIN bot_status bs ON u.id = bs.user_id
    `
  }).single();

  const total_users = userMetrics?.total_users || 0;
  const total_users_real = userMetrics?.total_users_real || 0;
  const total_users_demo_only = userMetrics?.total_users_demo_only || 0;
  const active_users_today_real = userMetrics?.active_users_today_real || 0;
  const new_users_week_real = userMetrics?.new_users_week_real || 0;
  const mau = userMetrics?.mau || 0;

  // Churn rate (last 30 days)
  const churn_rate_percentage = total_users > 0
    ? ((total_users - mau) / total_users) * 100
    : 0;

  // ===== TRADING METRICS (REAL ACCOUNT) =====

  const { data: tradingMetrics } = await supabase.rpc('exec_sql', {
    query: `
      SELECT
        COUNT(*) as trades_today_real,
        SUM(pnl) as pnl_today_real,
        SUM(valor) as volume_today_real,
        ROUND(
          SUM(CASE WHEN resultado = 'WIN' THEN 1 ELSE 0 END)::numeric /
          NULLIF(COUNT(*), 0) * 100,
          2
        ) as win_rate_today_real
      FROM trade_history
      WHERE account_type = 'real'
        AND DATE(data_abertura) = CURRENT_DATE
    `
  }).single();

  const trades_today_real = tradingMetrics?.trades_today_real || 0;
  const pnl_today_real = tradingMetrics?.pnl_today_real || 0;
  const volume_today_real = tradingMetrics?.volume_today_real || 0;
  const win_rate_today_real = tradingMetrics?.win_rate_today_real || 0;

  // Platform-wide win rate (REAL)
  const { data: platformWinRate } = await supabase.rpc('exec_sql', {
    query: `
      SELECT
        ROUND(
          SUM(CASE WHEN resultado = 'WIN' THEN 1 ELSE 0 END)::numeric /
          NULLIF(COUNT(*), 0) * 100,
          2
        ) as platform_win_rate_real
      FROM trade_history
      WHERE account_type = 'real'
        AND resultado IS NOT NULL
    `
  }).single();

  const platform_win_rate_real = platformWinRate?.platform_win_rate_real || 0;

  // Active bots (REAL)
  const { count: active_bots_real } = await supabase
    .from('bot_status')
    .select('*', { count: 'exact', head: true })
    .eq('account_type', 'real')
    .eq('bot_running', true)
    .eq('is_connected', true);

  // ===== FINANCIAL METRICS =====
  // Note: Using trade data as proxy for deposits/withdrawals

  const deposits_today_real = volume_today_real;
  const withdrawals_today_real = pnl_today_real > 0 ? pnl_today_real : 0;
  const net_revenue_today_real = deposits_today_real - withdrawals_today_real;

  const { data: avgDeposit } = await supabase.rpc('exec_sql', {
    query: `
      SELECT ROUND(AVG(valor), 2) as avg_deposit_size
      FROM trade_history
      WHERE account_type = 'real'
    `
  }).single();

  const avg_deposit_size = avgDeposit?.avg_deposit_size || 0;

  // ===== ENGAGEMENT METRICS =====

  // Engagement score (based on recent activity)
  const { data: engagementData } = await supabase.rpc('exec_sql', {
    query: `
      SELECT
        AVG(
          CASE
            WHEN last_sign_in_at >= NOW() - INTERVAL '7 days' THEN 90
            WHEN last_sign_in_at >= NOW() - INTERVAL '14 days' THEN 70
            WHEN last_sign_in_at >= NOW() - INTERVAL '30 days' THEN 50
            ELSE 20
          END
        ) as avg_engagement_score
      FROM auth.users
    `
  }).single();

  const avg_engagement_score = engagementData?.avg_engagement_score || 0;

  // Session duration (mock - would need user_sessions data)
  const avg_session_duration_minutes = 15; // TODO: Calculate from user_sessions

  // ===== CONVERSION METRICS (DEMO → REAL) =====

  const { data: conversionData } = await supabase.rpc('exec_sql', {
    query: `
      SELECT
        COUNT(DISTINCT CASE WHEN account_type = 'demo' THEN user_id END) as demo_users,
        COUNT(DISTINCT CASE WHEN account_type = 'real' THEN user_id END) as real_users,
        ROUND(
          COUNT(DISTINCT CASE WHEN account_type = 'real' THEN user_id END)::numeric /
          NULLIF(COUNT(DISTINCT user_id), 0) * 100,
          2
        ) as conversion_rate_percent
      FROM bot_status
    `
  }).single();

  const demo_users = conversionData?.demo_users || 0;
  const conversion_rate_percent = conversionData?.conversion_rate_percent || 0;

  // Average days to convert (demo → real)
  const { data: conversionTimeData } = await supabase.rpc('exec_sql', {
    query: `
      WITH first_trades AS (
        SELECT
          user_id,
          MIN(data_abertura) FILTER (WHERE account_type = 'demo') as first_demo,
          MIN(data_abertura) FILTER (WHERE account_type = 'real') as first_real
        FROM trade_history
        GROUP BY user_id
      )
      SELECT
        ROUND(AVG(EXTRACT(EPOCH FROM (first_real - first_demo)) / 86400), 1) as avg_days_to_convert
      FROM first_trades
      WHERE first_demo IS NOT NULL
        AND first_real IS NOT NULL
        AND first_real > first_demo
    `
  }).single();

  const avg_days_to_convert = conversionTimeData?.avg_days_to_convert || 0;

  return {
    // User Metrics
    total_users,
    total_users_real,
    total_users_demo_only,
    active_users_today_real,
    new_users_week_real,
    churn_rate_percentage,

    // Financial Metrics
    deposits_today_real,
    withdrawals_today_real,
    net_revenue_today_real,
    avg_deposit_size,

    // Trading Metrics
    trades_today_real,
    platform_win_rate_real,
    volume_today_real,
    active_bots_real: active_bots_real || 0,

    // Engagement Metrics
    avg_engagement_score,
    avg_session_duration_minutes,
    dau_real: active_users_today_real,
    mau_real: mau,

    // Conversion Metrics (Demo → Real)
    demo_users,
    conversion_rate_percent,
    avg_days_to_convert,
  };
}

/**
 * Get revenue data for last N days
 * Separates REAL and DEMO data
 */
export async function getRevenueData(days = 30) {
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT
        DATE(data_abertura) as date,
        SUM(valor) FILTER (WHERE account_type = 'real') as deposits_real,
        SUM(pnl) FILTER (WHERE account_type = 'real' AND resultado = 'WIN') as withdrawals_real,
        SUM(pnl) FILTER (WHERE account_type = 'real') as net_revenue_real
      FROM trade_history
      WHERE data_abertura >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE(data_abertura)
      ORDER BY date DESC
    `
  });

  if (error) {
    console.error('[Analytics] Error fetching revenue data:', error);
    return [];
  }

  return (data || []).map((row) => ({
    date: row.date,
    deposits_real: row.deposits_real || 0,
    withdrawals_real: row.withdrawals_real || 0,
    net_revenue_real: row.net_revenue_real || 0,
  }));
}

/**
 * Get user growth data for last N days
 * Includes conversion metrics
 */
export async function getUserGrowthData(days = 30) {
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT
        DATE(created_at) as date,
        COUNT(*) as new_users,
        COUNT(*) FILTER (
          WHERE id IN (
            SELECT user_id FROM bot_status WHERE account_type = 'real'
          )
        ) as new_users_real
      FROM auth.users
      WHERE created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `
  });

  if (error) {
    console.error('[Analytics] Error fetching user growth data:', error);
    return [];
  }

  return (data || []).map((row) => ({
    date: row.date,
    new_users: row.new_users || 0,
    new_users_real: row.new_users_real || 0,
  }));
}

/**
 * Get top users by P&L (REAL accounts only)
 */
export async function getTopUsersByPnL(limit = 10, accountType = 'real') {
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT
        u.id as user_id,
        u.email,
        p.full_name,
        COUNT(th.id) as total_trades,
        SUM(th.pnl) as lifetime_pnl,
        SUM(th.valor) as total_volume_traded,
        ROUND(
          SUM(CASE WHEN th.resultado = 'WIN' THEN 1 ELSE 0 END)::numeric /
          NULLIF(COUNT(th.id), 0) * 100,
          2
        ) as win_rate_percentage
      FROM auth.users u
      LEFT JOIN profiles p ON u.id = p.user_id
      LEFT JOIN trade_history th ON u.id = th.user_id AND th.account_type = '${accountType}'
      WHERE EXISTS (SELECT 1 FROM bot_status WHERE user_id = u.id AND account_type = '${accountType}')
      GROUP BY u.id, u.email, p.full_name
      HAVING COUNT(th.id) > 0
      ORDER BY lifetime_pnl DESC
      LIMIT ${limit}
    `
  });

  if (error) {
    console.error('[Analytics] Error fetching top users by PnL:', error);
    return [];
  }

  return (data || []).map((row) => ({
    user_id: row.user_id,
    email: row.email,
    full_name: row.full_name || 'Unknown',
    total_trades: row.total_trades || 0,
    lifetime_pnl: row.lifetime_pnl || 0,
    total_volume_traded: row.total_volume_traded || 0,
    win_rate_percentage: row.win_rate_percentage || 0,
  }));
}

/**
 * Get top users by volume (REAL accounts only)
 */
export async function getTopUsersByVolume(limit = 10, accountType = 'real') {
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT
        u.id as user_id,
        u.email,
        p.full_name,
        COUNT(th.id) as total_trades,
        SUM(th.valor) as total_volume_traded,
        SUM(th.pnl) as lifetime_pnl,
        ROUND(
          SUM(CASE WHEN th.resultado = 'WIN' THEN 1 ELSE 0 END)::numeric /
          NULLIF(COUNT(th.id), 0) * 100,
          2
        ) as win_rate_percentage
      FROM auth.users u
      LEFT JOIN profiles p ON u.id = p.user_id
      LEFT JOIN trade_history th ON u.id = th.user_id AND th.account_type = '${accountType}'
      WHERE EXISTS (SELECT 1 FROM bot_status WHERE user_id = u.id AND account_type = '${accountType}')
      GROUP BY u.id, u.email, p.full_name
      HAVING COUNT(th.id) > 0
      ORDER BY total_volume_traded DESC
      LIMIT ${limit}
    `
  });

  if (error) {
    console.error('[Analytics] Error fetching top users by volume:', error);
    return [];
  }

  return (data || []).map((row) => ({
    user_id: row.user_id,
    email: row.email,
    full_name: row.full_name || 'Unknown',
    total_trades: row.total_trades || 0,
    total_volume_traded: row.total_volume_traded || 0,
    lifetime_pnl: row.lifetime_pnl || 0,
    win_rate_percentage: row.win_rate_percentage || 0,
  }));
}

/**
 * Get asset performance data (REAL accounts only)
 */
export async function getAssetPerformance(limit = 20, accountType = 'real') {
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT
        ativo as asset,
        COUNT(*) as total_trades,
        ROUND(
          SUM(CASE WHEN resultado = 'WIN' THEN 1 ELSE 0 END)::numeric /
          NULLIF(COUNT(*), 0) * 100,
          2
        ) as win_rate,
        SUM(valor) as total_volume,
        SUM(pnl) as total_profit,
        ROUND(AVG(pnl), 2) as avg_profit
      FROM trade_history
      WHERE account_type = '${accountType}'
        AND resultado IS NOT NULL
      GROUP BY ativo
      ORDER BY total_volume DESC
      LIMIT ${limit}
    `
  });

  if (error) {
    console.error('[Analytics] Error fetching asset performance:', error);
    return [];
  }

  return (data || []).map((row) => ({
    asset: row.asset,
    total_trades: row.total_trades || 0,
    win_rate: row.win_rate || 0,
    total_volume: row.total_volume || 0,
    total_profit: row.total_profit || 0,
    avg_profit: row.avg_profit || 0,
  }));
}
