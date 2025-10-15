/**
 * Admin Data Hooks
 *
 * React Query hooks for fetching admin dashboard data.
 * Provides caching, refetching, and loading states.
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { analyticsApi, usersApi, tradesApi } from '../services/admin-api.service';
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
} from '../types/admin.types';

// ============================================================================
// DASHBOARD HOOKS
// ============================================================================

/**
 * Fetch complete dashboard metrics
 */
export function useAdminDashboard(): UseQueryResult<DashboardMetrics, Error> {
  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => analyticsApi.getDashboardMetrics(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 5, // Auto-refetch every 5 minutes
  });
}

/**
 * Fetch revenue data for charts
 */
export function useRevenueData(days: number = 30): UseQueryResult<RevenueData[], Error> {
  return useQuery({
    queryKey: ['admin', 'revenue', days],
    queryFn: () => analyticsApi.getRevenueData(days),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Fetch user growth data
 */
export function useUserGrowthData(days: number = 30): UseQueryResult<UserGrowthData[], Error> {
  return useQuery({
    queryKey: ['admin', 'user-growth', days],
    queryFn: () => analyticsApi.getUserGrowthData(days),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Fetch top users by PnL
 */
export function useTopUsersByPnL(
  limit: number = 10,
  accountType: 'real' | 'demo' = 'real'
): UseQueryResult<TopUser[], Error> {
  return useQuery({
    queryKey: ['admin', 'top-users-pnl', limit, accountType],
    queryFn: () => analyticsApi.getTopUsersByPnL(limit, accountType),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Fetch top users by volume
 */
export function useTopUsersByVolume(
  limit: number = 10,
  accountType: 'real' | 'demo' = 'real'
): UseQueryResult<TopUser[], Error> {
  return useQuery({
    queryKey: ['admin', 'top-users-volume', limit, accountType],
    queryFn: () => analyticsApi.getTopUsersByVolume(limit, accountType),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Fetch asset performance stats
 */
export function useAssetPerformance(
  limit: number = 20,
  accountType: 'real' | 'demo' = 'real'
): UseQueryResult<AssetPerformance[], Error> {
  return useQuery({
    queryKey: ['admin', 'asset-performance', limit, accountType],
    queryFn: () => analyticsApi.getAssetPerformance(limit, accountType),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ============================================================================
// USERS HOOKS
// ============================================================================

/**
 * Fetch paginated list of users with filters
 */
export function useAdminUsers(filters: UserFilters = {}): UseQueryResult<UserListItem[], Error> {
  return useQuery({
    queryKey: ['admin', 'users', filters],
    queryFn: () => usersApi.getAllUsers(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Fetch complete user details
 */
export function useUserDetails(userId: string | undefined): UseQueryResult<UserDetails, Error> {
  return useQuery({
    queryKey: ['admin', 'user', userId],
    queryFn: () => usersApi.getUserDetails(userId!),
    enabled: !!userId, // Only fetch if userId is provided
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Fetch user's trade history
 */
export function useUserTrades(
  userId: string | undefined,
  accountType: 'real' | 'demo' | 'both' = 'real',
  limit: number = 100,
  offset: number = 0
): UseQueryResult<UserTrade[], Error> {
  return useQuery({
    queryKey: ['admin', 'user-trades', userId, accountType, limit, offset],
    queryFn: () => usersApi.getUserTrades(userId!, accountType, limit, offset),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Fetch user's session history
 */
export function useUserSessions(
  userId: string | undefined,
  limit: number = 50,
  offset: number = 0
): UseQueryResult<UserSession[], Error> {
  return useQuery({
    queryKey: ['admin', 'user-sessions', userId, limit, offset],
    queryFn: () => usersApi.getUserSessions(userId!, limit, offset),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ============================================================================
// TRADES HOOKS
// ============================================================================

/**
 * Fetch paginated list of trades with filters
 */
export function useAdminTrades(filters: TradeFilters = {}): UseQueryResult<TradeListItem[], Error> {
  return useQuery({
    queryKey: ['admin', 'trades', filters],
    queryFn: () => tradesApi.getAllTrades(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Fetch trade details by ID
 */
export function useTradeDetails(tradeId: string | undefined): UseQueryResult<TradeDetails, Error> {
  return useQuery({
    queryKey: ['admin', 'trade', tradeId],
    queryFn: () => tradesApi.getTradeById(tradeId!),
    enabled: !!tradeId,
    staleTime: 1000 * 60 * 10, // 10 minutes (trades don't change)
  });
}

/**
 * Fetch trade statistics
 */
export function useTradeStats(
  accountType: 'real' | 'demo' | 'both' = 'real',
  dateFrom?: string,
  dateTo?: string
): UseQueryResult<TradeStats, Error> {
  return useQuery({
    queryKey: ['admin', 'trade-stats', accountType, dateFrom, dateTo],
    queryFn: () => tradesApi.getTradeStats(accountType, dateFrom, dateTo),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Fetch asset performance stats
 */
export function useAssetStats(
  accountType: 'real' | 'demo' | 'both' = 'real',
  limit: number = 50
): UseQueryResult<AssetStats[], Error> {
  return useQuery({
    queryKey: ['admin', 'asset-stats', accountType, limit],
    queryFn: () => tradesApi.getAssetStats(accountType, limit),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Fetch daily trade volume for charts
 */
export function useDailyVolume(
  accountType: 'real' | 'demo' = 'real',
  days: number = 30
): UseQueryResult<DailyVolume[], Error> {
  return useQuery({
    queryKey: ['admin', 'daily-volume', accountType, days],
    queryFn: () => tradesApi.getDailyVolume(accountType, days),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
