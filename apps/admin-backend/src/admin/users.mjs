/**
 * Admin Users Service
 *
 * Provides user management functionality for admin dashboard.
 * Focuses on REAL account data with DEMO as secondary.
 *
 * @module admin/services/users
 */

import { supabase } from '../../config/supabase.mjs';

// ============================================================================
// TYPES
// ============================================================================






// ============================================================================
// FUNCTIONS
// ============================================================================

/**
 * Get paginated list of users with filters
 */
export async function getAllUsers(filters = {}) {
  const {
    accountType = 'real',
    search = '',
    isActive,
    sortBy = 'created_at',
    sortOrder = 'desc',
    limit = 50,
    offset = 0,
  } = filters;

  // Build WHERE clause
  let whereClause = '';

  if (accountType === 'real') {
    whereClause = "AND EXISTS (SELECT 1 FROM bot_status WHERE user_id = u.id AND account_type = 'real')";
  } else if (accountType === 'demo') {
    whereClause = `AND EXISTS (SELECT 1 FROM bot_status WHERE user_id = u.id AND account_type = 'demo')
                   AND NOT EXISTS (SELECT 1 FROM bot_status WHERE user_id = u.id AND account_type = 'real')`;
  }

  if (search) {
    const searchEscaped = search.replace(/'/g, "''");
    whereClause += ` AND (u.email ILIKE '%${searchEscaped}%' OR p.phone ILIKE '%${searchEscaped}%')`;
  }

  if (isActive !== undefined) {
    const activeCondition = isActive
      ? "u.last_sign_in_at >= NOW() - INTERVAL '7 days'"
      : "u.last_sign_in_at < NOW() - INTERVAL '7 days' OR u.last_sign_in_at IS NULL";
    whereClause += ` AND ${activeCondition}`;
  }

  // Build ORDER BY clause
  const orderByMap = {
    email: 'u.email',
    created_at: 'u.created_at',
    total_pnl: 'total_pnl',
    total_trades: 'total_trades',
    win_rate: 'win_rate',
  };
  const orderColumn = orderByMap[sortBy] || 'u.created_at';

  const query = `
    WITH user_stats AS (
      SELECT
        user_id,
        COUNT(*) FILTER (WHERE account_type = 'real') as trades_real,
        COUNT(*) FILTER (WHERE account_type = 'demo') as trades_demo,
        SUM(pnl) FILTER (WHERE account_type = 'real') as pnl_real,
        SUM(pnl) FILTER (WHERE account_type = 'demo') as pnl_demo,
        ROUND(
          SUM(CASE WHEN resultado = 'WIN' AND account_type = 'real' THEN 1 ELSE 0 END)::numeric /
          NULLIF(COUNT(*) FILTER (WHERE account_type = 'real'), 0) * 100,
          2
        ) as win_rate_real
      FROM trade_history
      GROUP BY user_id
    )
    SELECT
      u.id as user_id,
      u.email,
      p.phone,
      u.created_at,
      u.last_sign_in_at,
      CASE
        WHEN EXISTS (SELECT 1 FROM bot_status WHERE user_id = u.id AND account_type = 'real')
         AND EXISTS (SELECT 1 FROM bot_status WHERE user_id = u.id AND account_type = 'demo')
        THEN 'both'
        WHEN EXISTS (SELECT 1 FROM bot_status WHERE user_id = u.id AND account_type = 'real')
        THEN 'real'
        ELSE 'demo'
      END as account_type,
      COALESCE(us.trades_real, 0) as total_trades,
      COALESCE(us.pnl_real, 0) as total_pnl,
      COALESCE(us.win_rate_real, 0) as win_rate,
      CASE WHEN u.last_sign_in_at >= NOW() - INTERVAL '7 days' THEN true ELSE false END as is_active,
      COALESCE(bs.is_running, false) as bot_running
    FROM auth.users u
    LEFT JOIN profiles p ON u.id = p.user_id
    LEFT JOIN user_stats us ON u.id = us.user_id
    LEFT JOIN bot_status bs ON u.id = bs.user_id AND bs.account_type = 'real'
    WHERE 1=1 ${whereClause}
    ORDER BY ${orderColumn} ${sortOrder.toUpperCase()}
    LIMIT ${limit}
    OFFSET ${offset}
  `;

  const { data, error } = await supabase.rpc('exec_sql', { query });

  if (error) {
    console.error('[Users] Error getting user list:', error);
    return [];
  }

  return (data || []).map((row) => ({
    user_id: row.user_id,
    email: row.email,
    phone: row.phone,
    created_at: row.created_at,
    last_sign_in_at: row.last_sign_in_at,
    account_type: row.account_type,
    total_trades: Number(row.total_trades),
    total_pnl: Number(row.total_pnl),
    win_rate: Number(row.win_rate),
    is_active: row.is_active,
    bot_running: row.bot_running,
  }));
}

/**
 * Get complete user details with 360° view
 */
export async function getUserDetails(userId) {
  // Get basic user info + bot status
  const { data: userInfo, error: userError } = await supabase.rpc('exec_sql', {
    query: `
      SELECT
        u.id as user_id,
        u.email,
        p.phone,
        u.created_at,
        u.last_sign_in_at,
        CASE
          WHEN EXISTS (SELECT 1 FROM bot_status WHERE user_id = u.id AND account_type = 'real')
           AND EXISTS (SELECT 1 FROM bot_status WHERE user_id = u.id AND account_type = 'demo')
          THEN 'both'
          WHEN EXISTS (SELECT 1 FROM bot_status WHERE user_id = u.id AND account_type = 'real')
          THEN 'real'
          ELSE 'demo'
        END as account_type,
        CASE WHEN u.last_sign_in_at >= NOW() - INTERVAL '7 days' THEN true ELSE false END as is_active,
        -- Bot Status REAL
        bs_real.is_running as bot_running_real,
        bs_real.mode as bot_mode_real,
        bs_real.balance as balance_real,
        -- Bot Status DEMO
        bs_demo.is_running as bot_running_demo,
        bs_demo.mode as bot_mode_demo,
        bs_demo.balance as balance_demo
      FROM auth.users u
      LEFT JOIN profiles p ON u.id = p.user_id
      LEFT JOIN bot_status bs_real ON u.id = bs_real.user_id AND bs_real.account_type = 'real'
      LEFT JOIN bot_status bs_demo ON u.id = bs_demo.user_id AND bs_demo.account_type = 'demo'
      WHERE u.id = '${userId}'
    `
  });

  if (userError || !userInfo || userInfo.length === 0) {
    console.error('[Users] Error getting user info:', userError);
    return null;
  }

  // Get trading stats
  const { data: tradingStats, error: statsError } = await supabase.rpc('exec_sql', {
    query: `
      SELECT
        COUNT(*) FILTER (WHERE account_type = 'real') as total_trades_real,
        SUM(pnl) FILTER (WHERE account_type = 'real') as total_pnl_real,
        ROUND(
          SUM(CASE WHEN resultado = 'WIN' AND account_type = 'real' THEN 1 ELSE 0 END)::numeric /
          NULLIF(COUNT(*) FILTER (WHERE account_type = 'real'), 0) * 100,
          2
        ) as win_rate_real,
        SUM(valor) FILTER (WHERE account_type = 'real') as total_volume_real,
        COUNT(*) FILTER (WHERE account_type = 'demo') as total_trades_demo,
        SUM(pnl) FILTER (WHERE account_type = 'demo') as total_pnl_demo,
        ROUND(
          SUM(CASE WHEN resultado = 'WIN' AND account_type = 'demo' THEN 1 ELSE 0 END)::numeric /
          NULLIF(COUNT(*) FILTER (WHERE account_type = 'demo'), 0) * 100,
          2
        ) as win_rate_demo,
        MIN(data_abertura) FILTER (WHERE account_type = 'demo') as first_trade_demo,
        MIN(data_abertura) FILTER (WHERE account_type = 'real') as first_trade_real,
        MAX(data_abertura) as last_trade_at
      FROM trade_history
      WHERE user_id = '${userId}'
    `
  });

  if (statsError) {
    console.error('[Users] Error getting trading stats:', statsError);
  }

  // Get session stats
  const { data: sessionStats, error: sessionError } = await supabase.rpc('exec_sql', {
    query: `
      SELECT
        COUNT(*) as session_count,
        MAX(created_at) as last_session_at
      FROM user_sessions
      WHERE user_id = '${userId}'
    `
  });

  if (sessionError) {
    console.error('[Users] Error getting session stats:', sessionError);
  }

  const user = userInfo[0];
  const stats = tradingStats?.[0] || {};
  const sessions = sessionStats?.[0] || {};

  // Calculate conversion time
  let daysToConvert = null;
  if (stats.first_trade_demo && stats.first_trade_real) {
    const demo = new Date(stats.first_trade_demo);
    const real = new Date(stats.first_trade_real);
    if (real > demo) {
      daysToConvert = Math.round((real.getTime() - demo.getTime()) / (1000 * 60 * 60 * 24));
    }
  }

  return {
    // Basic Info
    user_id: user.user_id,
    email: user.email,
    phone: user.phone,
    created_at: user.created_at,
    last_sign_in_at: user.last_sign_in_at,

    // Account Status
    account_type: user.account_type,
    is_active: user.is_active,

    // Bot Status (REAL)
    bot_running_real: user.bot_running_real || false,
    bot_mode_real: user.bot_mode_real,
    balance_real: Number(user.balance_real) || 0,

    // Bot Status (DEMO)
    bot_running_demo: user.bot_running_demo || false,
    bot_mode_demo: user.bot_mode_demo,
    balance_demo: Number(user.balance_demo) || 0,

    // Trading Stats (REAL)
    total_trades_real: Number(stats.total_trades_real) || 0,
    total_pnl_real: Number(stats.total_pnl_real) || 0,
    win_rate_real: Number(stats.win_rate_real) || 0,
    total_volume_real: Number(stats.total_volume_real) || 0,

    // Trading Stats (DEMO)
    total_trades_demo: Number(stats.total_trades_demo) || 0,
    total_pnl_demo: Number(stats.total_pnl_demo) || 0,
    win_rate_demo: Number(stats.win_rate_demo) || 0,

    // Conversion
    first_trade_demo: stats.first_trade_demo,
    first_trade_real: stats.first_trade_real,
    days_to_convert: daysToConvert,

    // Activity
    last_trade_at: stats.last_trade_at,
    session_count: Number(sessions.session_count) || 0,
    last_session_at: sessions.last_session_at,
  };
}

/**
 * Get user's trade history with pagination
 */
export async function getUserTrades(
  userId,
  accountType = 'real',
  limit = 100,
  offset = 0
) {
  let accountFilter = '';
  if (accountType !== 'both') {
    accountFilter = `AND account_type = '${accountType}'`;
  }

  const query = `
    SELECT
      id as trade_id,
      account_type,
      ativo,
      valor,
      pnl,
      resultado,
      direcao,
      data_abertura,
      data_fechamento,
      EXTRACT(EPOCH FROM (data_fechamento - data_abertura))::integer as duracao_segundos
    FROM trade_history
    WHERE user_id = '${userId}'
    ${accountFilter}
    ORDER BY data_abertura DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;

  const { data, error } = await supabase.rpc('exec_sql', { query });

  if (error) {
    console.error('[Users] Error getting user trades:', error);
    return [];
  }

  return (data || []).map((row) => ({
    trade_id: row.trade_id,
    account_type: row.account_type,
    ativo: row.ativo,
    valor: Number(row.valor),
    pnl: Number(row.pnl),
    resultado: row.resultado,
    direcao: row.direcao,
    data_abertura: row.data_abertura,
    data_fechamento: row.data_fechamento,
    duracao_segundos: Number(row.duracao_segundos),
  }));
}

/**
 * Get user's session history
 */
export async function getUserSessions(
  userId,
  limit = 50,
  offset = 0
) {
  const query = `
    WITH session_trades AS (
      SELECT
        us.id as session_id,
        us.created_at,
        us.last_activity,
        EXTRACT(EPOCH FROM (us.last_activity - us.created_at))::integer / 60 as duration_minutes,
        COUNT(th.id) as trades_in_session,
        COALESCE(SUM(th.pnl), 0) as pnl_in_session
      FROM user_sessions us
      LEFT JOIN trade_history th ON th.user_id = us.user_id
        AND th.data_abertura >= us.created_at
        AND th.data_abertura <= us.last_activity
      WHERE us.user_id = '${userId}'
      GROUP BY us.id, us.created_at, us.last_activity
    )
    SELECT *
    FROM session_trades
    ORDER BY created_at DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;

  const { data, error } = await supabase.rpc('exec_sql', { query });

  if (error) {
    console.error('[Users] Error getting user sessions:', error);
    return [];
  }

  return (data || []).map((row) => ({
    session_id: row.session_id,
    created_at: row.created_at,
    last_activity: row.last_activity,
    duration_minutes: Number(row.duration_minutes),
    trades_in_session: Number(row.trades_in_session),
    pnl_in_session: Number(row.pnl_in_session),
  }));
}
