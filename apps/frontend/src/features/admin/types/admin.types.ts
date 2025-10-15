/**
 * Admin Types
 *
 * TypeScript interfaces for admin dashboard data.
 * Mirrors backend service return types.
 */

// ============================================================================
// DASHBOARD METRICS
// ============================================================================

export interface DashboardMetrics {
  // User Metrics
  total_users: number;
  total_users_real: number;
  total_users_demo_only: number;
  active_users_today_real: number;
  new_users_week_real: number;
  churn_rate_percentage: number;

  // Financial Metrics
  deposits_today_real: number;
  withdrawals_today_real: number;
  net_revenue_today_real: number;
  avg_deposit_size: number;

  // Trading Metrics
  trades_today_real: number;
  platform_win_rate_real: number;
  volume_today_real: number;
  active_bots_real: number;

  // Engagement Metrics
  avg_engagement_score: number;
  avg_session_duration_minutes: number;
  dau_real: number;
  mau_real: number;

  // Conversion Metrics (Demo → Real)
  demo_users: number;
  conversion_rate_percent: number;
  avg_days_to_convert: number;
}

// ============================================================================
// USERS
// ============================================================================

export interface UserListItem {
  user_id: string;
  email: string;
  phone: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  account_type: 'real' | 'demo' | 'both';
  total_trades: number;
  total_pnl: number;
  win_rate: number;
  is_active: boolean;
  bot_running: boolean;
}

export interface UserDetails {
  // Basic Info
  user_id: string;
  email: string;
  phone: string | null;
  created_at: string;
  last_sign_in_at: string | null;

  // Account Status
  account_type: 'real' | 'demo' | 'both';
  is_active: boolean;

  // Bot Status (REAL)
  bot_running_real: boolean;
  bot_mode_real: string | null;
  balance_real: number;

  // Bot Status (DEMO)
  bot_running_demo: boolean;
  bot_mode_demo: string | null;
  balance_demo: number;

  // Trading Stats (REAL)
  total_trades_real: number;
  total_pnl_real: number;
  win_rate_real: number;
  total_volume_real: number;

  // Trading Stats (DEMO)
  total_trades_demo: number;
  total_pnl_demo: number;
  win_rate_demo: number;

  // Conversion
  first_trade_demo: string | null;
  first_trade_real: string | null;
  days_to_convert: number | null;

  // Activity
  last_trade_at: string | null;
  session_count: number;
  last_session_at: string | null;
}

export interface UserTrade {
  trade_id: string;
  account_type: 'real' | 'demo';
  ativo: string;
  valor: number;
  pnl: number;
  resultado: 'WIN' | 'LOSS' | 'TIE';
  direcao: 'CALL' | 'PUT';
  data_abertura: string;
  data_fechamento: string;
  duracao_segundos: number;
}

export interface UserSession {
  session_id: string;
  created_at: string;
  last_activity: string;
  duration_minutes: number;
  trades_in_session: number;
  pnl_in_session: number;
}

export interface UserFilters {
  accountType?: 'real' | 'demo' | 'both';
  search?: string;
  isActive?: boolean;
  sortBy?: 'email' | 'created_at' | 'total_pnl' | 'total_trades' | 'win_rate';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// ============================================================================
// TRADES
// ============================================================================

export interface TradeListItem {
  trade_id: string;
  user_id: string;
  user_email: string;
  account_type: 'real' | 'demo';
  ativo: string;
  valor: number;
  pnl: number;
  resultado: 'WIN' | 'LOSS' | 'TIE';
  direcao: 'CALL' | 'PUT';
  data_abertura: string;
  data_fechamento: string;
  duracao_segundos: number;
}

export interface TradeDetails extends TradeListItem {
  bot_mode: string | null;
  balance_before: number | null;
  balance_after: number | null;
}

export interface TradeFilters {
  accountType?: 'real' | 'demo' | 'both';
  userId?: string;
  asset?: string;
  resultado?: 'WIN' | 'LOSS' | 'TIE';
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'data_abertura' | 'pnl' | 'valor';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface AssetStats {
  ativo: string;
  total_trades: number;
  win_count: number;
  loss_count: number;
  tie_count: number;
  win_rate: number;
  total_pnl: number;
  total_volume: number;
  avg_trade_value: number;
}

export interface TradeStats {
  win: number;
  loss: number;
  tie: number;
}

export interface DailyVolume {
  date: string;
  volume: number;
  pnl: number;
  trades: number;
}

// ============================================================================
// ANALYTICS
// ============================================================================

export interface RevenueData {
  date: string;
  deposits_real: number;
  withdrawals_real: number;
  net_revenue_real: number;
}

export interface UserGrowthData {
  date: string;
  new_users: number;
  new_users_real: number;
}

export interface TopUser {
  user_id: string;
  email: string;
  full_name: string;
  total_trades: number;
  lifetime_pnl: number;
  total_volume_traded: number;
  win_rate_percentage: number;
}

export interface AssetPerformance {
  asset: string;
  total_trades: number;
  win_rate: number;
  total_volume: number;
  total_profit: number;
  avg_profit: number;
}

// ============================================================================
// API RESPONSE WRAPPER
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  filters?: any;
}
