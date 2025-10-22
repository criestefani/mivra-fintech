import axios from 'axios'
import { getApiUrl } from '@/shared/utils/getApiUrl'

const API_BASE_URL = getApiUrl()

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('sb-access-token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      localStorage.removeItem('sb-access-token')
      window.location.href = '/auth'
    }
    return Promise.reject(error)
  }
)

// Bot API
export const botAPI = {
  connect: (userId: string) => apiClient.post('/api/bot/connect', { userId }),
  disconnect: (userId: string) => apiClient.post('/api/bot/disconnect', { userId }),
  getBalance: (accountType: 'demo' | 'real') =>
    apiClient.get(`/api/bot/balance?accountType=${accountType}`),
  switchAccountType: (accountType: 'demo' | 'real') =>
    apiClient.post('/api/bot/account-type', { accountType }),
  startRuntime: (userId: string, config?: any) =>
    apiClient.post('/api/bot/start-runtime', { userId, config }),
  stopRuntime: (userId: string) =>
    apiClient.post('/api/bot/stop-runtime', { userId }),
  getRuntimeStatus: (userId: string) =>
    apiClient.get(`/api/bot/runtime-status?userId=${userId}`),
  getStatus: (userId: string) =>
    apiClient.get(`/api/bot/status?userId=${userId}`),
}

// Admin API
export const adminAPI = {
  health: () => apiClient.get('/api/admin/health'),
  getMetrics: () => apiClient.get('/api/admin/metrics/realtime'),
  getUsers: (params?: { page?: number; limit?: number; search?: string; accountType?: string }) =>
    apiClient.get('/api/admin/users', { params }),
  getUserDetails: (userId: string) => apiClient.get(`/api/admin/users/${userId}`),
  getDailyAnalytics: (days: number = 30) =>
    apiClient.get(`/api/admin/analytics/daily?days=${days}`),
  getTrades: (params?: any) => apiClient.get('/api/admin/trades', { params }),
  exportAnalytics: (type: string, format: string) =>
    apiClient.get(`/api/admin/analytics/export?type=${type}&format=${format}`, {
      responseType: 'blob',
    }),
}

// Market Scanner API
export const scannerAPI = {
  getTop20: () => apiClient.get('/api/scanner/top20'),
  getAssetPerformance: (activeId: string) =>
    apiClient.get(`/api/scanner/asset/${activeId}`),
}

// Candles API
export const candlesAPI = {
  getCandles: (asset: string, timeframe: number, limit: number = 100) =>
    apiClient.get(`/api/candles`, {
      params: { asset, timeframe, limit },
    }),
}

export default apiClient
