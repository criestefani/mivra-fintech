/**
 * Admin Trades Service
 *
 * Provides trade management and analytics functionality for admin dashboard.
 * Focuses on REAL account data with DEMO as secondary.
 *
 * @module admin/services/trades
 */

import { supabase } from '../../config/supabase.mjs';

// ============================================================================
// TYPES
// ============================================================================





// ============================================================================
// FUNCTIONS
// ============================================================================

/**
 * Get paginated list of trades with filters
 */
export async function getAllTrades(filters = {}) {
  const {
    accountType = 'real',
    userId,
    asset,
    resultado,
    dateFrom,
    dateTo,
    sortBy = 'data_abertura',
    sortOrder = 'desc',
    limit = 100,
    offset = 0,
  } = filters;

  // Build WHERE clause
  const conditions = [];

  // Account type filter
  if (accountType !== 'both') {
    conditions.push(`th.account_type = '${accountType}'`);
  }

  // User filter
  if (userId) {
    conditions.push(`th.user_id = '${userId}'`);
  }

  // Asset filter
  if (asset) {
    const assetEscaped = asset.replace(/'/g, "''");
    conditions.push(`th.ativo = '${assetEscaped}'`);
  }

  // Result filter
  if (resultado) {
    conditions.push(`th.resultado = '${resultado}'`);
  }

  // Date range filter
  if (dateFrom) {
    conditions.push(`th.data_abertura >= '${dateFrom}'`);
  }
  if (dateTo) {
    conditions.push(`th.data_abertura <= '${dateTo}'`);
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  // Build ORDER BY clause
  const orderByMap = {
    data_abertura: 'th.data_abertura',
    pnl: 'th.pnl',
    valor: 'th.valor',
  };
  const orderColumn = orderByMap[sortBy] || 'th.data_abertura';

  const query = `
    SELECT
      th.id as trade_id,
      th.user_id,
      u.email as user_email,
      th.account_type,
      th.ativo,
      th.valor,
      th.pnl,
      th.resultado,
      th.direcao,
      th.data_abertura,
      th.data_fechamento,
      EXTRACT(EPOCH FROM (th.data_fechamento - th.data_abertura))::integer as duracao_segundos
    FROM trade_history th
    LEFT JOIN auth.users u ON th.user_id = u.id
    ${whereClause}
    ORDER BY ${orderColumn} ${sortOrder.toUpperCase()}
    LIMIT ${limit}
    OFFSET ${offset}
  `;

  const { data, error } = await supabase.rpc('exec_sql', { query });

  if (error) {
    console.error('[Trades] Error getting trade list:', error);
    return [];
  }

  return (data || []).map((row) => ({
    trade_id: row.trade_id,
    user_id: row.user_id,
    user_email: row.user_email,
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
 * Get trade details by ID
 */
export async function getTradeById(tradeId) {
  const query = `
    SELECT
      th.id as trade_id,
      th.user_id,
      u.email as user_email,
      th.account_type,
      th.ativo,
      th.valor,
      th.pnl,
      th.resultado,
      th.direcao,
      th.data_abertura,
      th.data_fechamento,
      EXTRACT(EPOCH FROM (th.data_fechamento - th.data_abertura))::integer as duracao_segundos,
      bs.mode as bot_mode,
      NULL as balance_before,
      NULL as balance_after
    FROM trade_history th
    LEFT JOIN auth.users u ON th.user_id = u.id
    LEFT JOIN bot_status bs ON th.user_id = bs.user_id AND th.account_type = bs.account_type
    WHERE th.id = '${tradeId}'
  `;

  const { data, error } = await supabase.rpc('exec_sql', { query });

  if (error || !data || data.length === 0) {
    console.error('[Trades] Error getting trade details:', error);
    return null;
  }

  const row = data[0];

  return {
    trade_id: row.trade_id,
    user_id: row.user_id,
    user_email: row.user_email,
    account_type: row.account_type,
    ativo: row.ativo,
    valor: Number(row.valor),
    pnl: Number(row.pnl),
    resultado: row.resultado,
    direcao: row.direcao,
    data_abertura: row.data_abertura,
    data_fechamento: row.data_fechamento,
    duracao_segundos: Number(row.duracao_segundos),
    bot_mode: row.bot_mode,
    balance_before: row.balance_before ? Number(row.balance_before) : null,
    balance_after: row.balance_after ? Number(row.balance_after) : null,
  };
}

/**
 * Get trades by user ID with pagination
 */
export async function getTradesByUser(
  userId,
  accountType = 'real',
  limit = 100,
  offset = 0
) {
  let accountFilter = '';
  if (accountType !== 'both') {
    accountFilter = `AND th.account_type = '${accountType}'`;
  }

  const query = `
    SELECT
      th.id as trade_id,
      th.user_id,
      u.email as user_email,
      th.account_type,
      th.ativo,
      th.valor,
      th.pnl,
      th.resultado,
      th.direcao,
      th.data_abertura,
      th.data_fechamento,
      EXTRACT(EPOCH FROM (th.data_fechamento - th.data_abertura))::integer as duracao_segundos
    FROM trade_history th
    LEFT JOIN auth.users u ON th.user_id = u.id
    WHERE th.user_id = '${userId}'
    ${accountFilter}
    ORDER BY th.data_abertura DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;

  const { data, error } = await supabase.rpc('exec_sql', { query });

  if (error) {
    console.error('[Trades] Error getting trades by user:', error);
    return [];
  }

  return (data || []).map((row) => ({
    trade_id: row.trade_id,
    user_id: row.user_id,
    user_email: row.user_email,
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
 * Get trades by date range
 */
export async function getTradesByDateRange(
  startDate,
  endDate,
  accountType = 'real',
  limit = 1000,
  offset = 0
) {
  let accountFilter = '';
  if (accountType !== 'both') {
    accountFilter = `AND th.account_type = '${accountType}'`;
  }

  const query = `
    SELECT
      th.id as trade_id,
      th.user_id,
      u.email as user_email,
      th.account_type,
      th.ativo,
      th.valor,
      th.pnl,
      th.resultado,
      th.direcao,
      th.data_abertura,
      th.data_fechamento,
      EXTRACT(EPOCH FROM (th.data_fechamento - th.data_abertura))::integer as duracao_segundos
    FROM trade_history th
    LEFT JOIN auth.users u ON th.user_id = u.id
    WHERE th.data_abertura >= '${startDate}'
      AND th.data_abertura <= '${endDate}'
      ${accountFilter}
    ORDER BY th.data_abertura DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;

  const { data, error } = await supabase.rpc('exec_sql', { query });

  if (error) {
    console.error('[Trades] Error getting trades by date range:', error);
    return [];
  }

  return (data || []).map((row) => ({
    trade_id: row.trade_id,
    user_id: row.user_id,
    user_email: row.user_email,
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
 * Get asset performance stats
 */
export async function getAssetStats(
  accountType = 'real',
  limit = 50
) {
  let accountFilter = '';
  if (accountType !== 'both') {
    accountFilter = `WHERE account_type = '${accountType}'`;
  }

  const query = `
    SELECT
      ativo,
      COUNT(*) as total_trades,
      SUM(CASE WHEN resultado = 'WIN' THEN 1 ELSE 0 END) as win_count,
      SUM(CASE WHEN resultado = 'LOSS' THEN 1 ELSE 0 END) as loss_count,
      SUM(CASE WHEN resultado = 'TIE' THEN 1 ELSE 0 END) as tie_count,
      ROUND(
        SUM(CASE WHEN resultado = 'WIN' THEN 1 ELSE 0 END)::numeric /
        NULLIF(COUNT(*), 0) * 100,
        2
      ) as win_rate,
      SUM(pnl) as total_pnl,
      SUM(valor) as total_volume,
      ROUND(AVG(valor), 2) as avg_trade_value
    FROM trade_history
    ${accountFilter}
    GROUP BY ativo
    ORDER BY total_trades DESC
    LIMIT ${limit}
  `;

  const { data, error } = await supabase.rpc('exec_sql', { query });

  if (error) {
    console.error('[Trades] Error getting asset stats:', error);
    return [];
  }

  return (data || []).map((row) => ({
    ativo: row.ativo,
    total_trades: Number(row.total_trades),
    win_count: Number(row.win_count),
    loss_count: Number(row.loss_count),
    tie_count: Number(row.tie_count),
    win_rate: Number(row.win_rate),
    total_pnl: Number(row.total_pnl),
    total_volume: Number(row.total_volume),
    avg_trade_value: Number(row.avg_trade_value),
  }));
}

/**
 * Get trade count by resultado
 */
export async function getTradeCountByResult(
  accountType = 'real',
  dateFrom,
  dateTo
) {
  const conditions = [];

  if (accountType !== 'both') {
    conditions.push(`account_type = '${accountType}'`);
  }

  if (dateFrom) {
    conditions.push(`data_abertura >= '${dateFrom}'`);
  }

  if (dateTo) {
    conditions.push(`data_abertura <= '${dateTo}'`);
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  const query = `
    SELECT
      SUM(CASE WHEN resultado = 'WIN' THEN 1 ELSE 0 END) as win,
      SUM(CASE WHEN resultado = 'LOSS' THEN 1 ELSE 0 END) as loss,
      SUM(CASE WHEN resultado = 'TIE' THEN 1 ELSE 0 END) as tie
    FROM trade_history
    ${whereClause}
  `;

  const { data, error } = await supabase.rpc('exec_sql', { query });

  if (error || !data || data.length === 0) {
    console.error('[Trades] Error getting trade count by result:', error);
    return { win: 0, loss: 0, tie: 0 };
  }

  const row = data[0];

  return {
    win: Number(row.win) || 0,
    loss: Number(row.loss) || 0,
    tie: Number(row.tie) || 0,
  };
}

/**
 * Get daily trade volume (for charts)
 */
export async function getDailyTradeVolume(
  accountType = 'real',
  days = 30
) {
  const query = `
    SELECT
      DATE(data_abertura) as date,
      SUM(valor) as volume,
      SUM(pnl) as pnl,
      COUNT(*) as trades
    FROM trade_history
    WHERE account_type = '${accountType}'
      AND data_abertura >= CURRENT_DATE - INTERVAL '${days} days'
    GROUP BY DATE(data_abertura)
    ORDER BY date ASC
  `;

  const { data, error } = await supabase.rpc('exec_sql', { query });

  if (error) {
    console.error('[Trades] Error getting daily trade volume:', error);
    return [];
  }

  return (data || []).map((row) => ({
    date: row.date,
    volume: Number(row.volume),
    pnl: Number(row.pnl),
    trades: Number(row.trades),
  }));
}
