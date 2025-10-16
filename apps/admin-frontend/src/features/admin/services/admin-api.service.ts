/**
 * Admin API Service
 *
 * HTTP client for admin dashboard API endpoints.
 * All requests go to /api/admin/*
 */

import type {
  DashboardMetrics,
  UserListItem,
  UserDetails,
  UserTrade,
  UserSession,
  UserFilters,
  TradeListItem,
  TradeDetails,
  TradeFilters,
  AssetStats,
  TradeStats,
  DailyVolume,
  RevenueData,
  UserGrowthData,
  TopUser,
  AssetPerformance,
  ApiResponse,
} from '../types/admin.types';

// Base URL - ajustar se necessário
const API_BASE_URL = 'http://localhost:4001/api/admin';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function fetchApi<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result: ApiResponse<T> = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'API request failed');
  }

  return result.data as T;
}

function buildQueryString(params: Record<string, any>): string {
  const filtered = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');

  return filtered ? `?${filtered}` : '';
}

// ============================================================================
// ANALYTICS ENDPOINTS
// ============================================================================

export const analyticsApi = {
  /**
   * Get complete dashboard metrics
   */
  getDashboardMetrics: async (): Promise<DashboardMetrics> => {
    return fetchApi<DashboardMetrics>('/analytics/dashboard');
  },

  /**
   * Get revenue data for charts
   */
  getRevenueData: async (days: number = 30): Promise<RevenueData[]> => {
    return fetchApi<RevenueData[]>(`/analytics/revenue?days=${days}`);
  },

  /**
   * Get user growth data
   */
  getUserGrowthData: async (days: number = 30): Promise<UserGrowthData[]> => {
    return fetchApi<UserGrowthData[]>(`/analytics/user-growth?days=${days}`);
  },

  /**
   * Get top users by PnL
   */
  getTopUsersByPnL: async (limit: number = 10, accountType: 'real' | 'demo' = 'real'): Promise<TopUser[]> => {
    return fetchApi<TopUser[]>(`/analytics/top-users-pnl?limit=${limit}&accountType=${accountType}`);
  },

  /**
   * Get top users by volume
   */
  getTopUsersByVolume: async (limit: number = 10, accountType: 'real' | 'demo' = 'real'): Promise<TopUser[]> => {
    return fetchApi<TopUser[]>(`/analytics/top-users-volume?limit=${limit}&accountType=${accountType}`);
  },

  /**
   * Get asset performance stats
   */
  getAssetPerformance: async (limit: number = 20, accountType: 'real' | 'demo' = 'real'): Promise<AssetPerformance[]> => {
    return fetchApi<AssetPerformance[]>(`/analytics/asset-performance?limit=${limit}&accountType=${accountType}`);
  },
};

// ============================================================================
// USERS ENDPOINTS
// ============================================================================

export const usersApi = {
  /**
   * Get paginated list of users with filters
   */
  getAllUsers: async (filters: UserFilters = {}): Promise<UserListItem[]> => {
    const query = buildQueryString(filters);
    return fetchApi<UserListItem[]>(`/users${query}`);
  },

  /**
   * Get complete user details
   */
  getUserDetails: async (userId: string): Promise<UserDetails> => {
    return fetchApi<UserDetails>(`/users/${userId}`);
  },

  /**
   * Get user's trade history
   */
  getUserTrades: async (
    userId: string,
    accountType: 'real' | 'demo' | 'both' = 'real',
    limit: number = 100,
    offset: number = 0
  ): Promise<UserTrade[]> => {
    const query = buildQueryString({ accountType, limit, offset });
    return fetchApi<UserTrade[]>(`/users/${userId}/trades${query}`);
  },

  /**
   * Get user's session history
   */
  getUserSessions: async (
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<UserSession[]> => {
    const query = buildQueryString({ limit, offset });
    return fetchApi<UserSession[]>(`/users/${userId}/sessions${query}`);
  },
};

// ============================================================================
// TRADES ENDPOINTS
// ============================================================================

export const tradesApi = {
  /**
   * Get paginated list of trades with filters
   */
  getAllTrades: async (filters: TradeFilters = {}): Promise<TradeListItem[]> => {
    const query = buildQueryString(filters);
    return fetchApi<TradeListItem[]>(`/trades${query}`);
  },

  /**
   * Get trade details by ID
   */
  getTradeById: async (tradeId: string): Promise<TradeDetails> => {
    return fetchApi<TradeDetails>(`/trades/${tradeId}`);
  },

  /**
   * Get trade statistics
   */
  getTradeStats: async (
    accountType: 'real' | 'demo' | 'both' = 'real',
    dateFrom?: string,
    dateTo?: string
  ): Promise<TradeStats> => {
    const query = buildQueryString({ accountType, dateFrom, dateTo });
    return fetchApi<TradeStats>(`/trades/stats${query}`);
  },

  /**
   * Get asset performance stats
   */
  getAssetStats: async (
    accountType: 'real' | 'demo' | 'both' = 'real',
    limit: number = 50
  ): Promise<AssetStats[]> => {
    const query = buildQueryString({ accountType, limit });
    return fetchApi<AssetStats[]>(`/trades/asset-stats${query}`);
  },

  /**
   * Get daily trade volume for charts
   */
  getDailyVolume: async (
    accountType: 'real' | 'demo' = 'real',
    days: number = 30
  ): Promise<DailyVolume[]> => {
    const query = buildQueryString({ accountType, days });
    return fetchApi<DailyVolume[]>(`/trades/daily-volume${query}`);
  },
};

// ============================================================================
// HEALTH CHECK
// ============================================================================

export const healthApi = {
  /**
   * Check API health
   */
  checkHealth: async (): Promise<{ status: string; timestamp: string; version: string }> => {
    return fetchApi('/health');
  },
};
