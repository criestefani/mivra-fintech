import { useState, useEffect, useCallback } from 'react'
import { botAPI } from '@/shared/services/api/client'
import { toast } from 'sonner'

interface BotStatus {
  isConnected: boolean
  isRunning: boolean
  accountType?: 'demo' | 'real'
  balance?: number
  userId?: string
  config?: any
}

interface UseBotStatusResult {
  botStatus: BotStatus | null
  isConnected: boolean
  isRunning: boolean
  loading: boolean
  startBotRuntime: (userId: string, config?: any) => Promise<void>
  stopBotRuntime: (userId: string) => Promise<void>
  refreshStatus: () => Promise<void>
}

export const useBotStatus = (userId?: string): UseBotStatusResult => {
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null)
  const [loading, setLoading] = useState(false)

  // Fetch bot status from backend
  const fetchStatus = useCallback(async () => {
    if (!userId) {
      setBotStatus(null)
      return
    }

    try {
      // Fetch both general status and runtime status
      const [statusResponse, runtimeResponse] = await Promise.all([
        botAPI.getStatus(userId),
        botAPI.getRuntimeStatus(userId)
      ])

      const status: BotStatus = {
        isConnected: statusResponse.data?.isConnected || false,
        isRunning: runtimeResponse.data?.isRunning || false,
        accountType: statusResponse.data?.accountType,
        balance: statusResponse.data?.balance,
        userId: userId,
        config: runtimeResponse.data?.config
      }

      setBotStatus(status)
      console.log('[useBotStatus] Status updated:', status)
    } catch (error: any) {
      console.error('[useBotStatus] Failed to fetch status:', error)
      // Set default status on error
      setBotStatus({
        isConnected: false,
        isRunning: false,
        userId: userId
      })
    }
  }, [userId])

  // Refresh status manually
  const refreshStatus = useCallback(async () => {
    setLoading(true)
    try {
      await fetchStatus()
    } finally {
      setLoading(false)
    }
  }, [fetchStatus])

  // Start bot runtime
  const startBotRuntime = useCallback(async (userId: string, config?: any) => {
    setLoading(true)
    try {
      console.log('[useBotStatus] Starting bot runtime...', { userId, config })

      const response = await botAPI.startRuntime(userId, config)

      if (response.data?.success) {
        toast.success('Bot iniciado com sucesso!')
        console.log('[useBotStatus] Bot started successfully')

        // Refresh status after starting
        await fetchStatus()
      } else {
        throw new Error(response.data?.error || 'Failed to start bot')
      }
    } catch (error: any) {
      console.error('[useBotStatus] Failed to start bot:', error)
      toast.error(error.message || 'Erro ao iniciar bot')
      throw error
    } finally {
      setLoading(false)
    }
  }, [fetchStatus])

  // Stop bot runtime
  const stopBotRuntime = useCallback(async (userId: string) => {
    setLoading(true)
    try {
      console.log('[useBotStatus] Stopping bot runtime...', { userId })

      const response = await botAPI.stopRuntime(userId)

      if (response.data?.success) {
        toast.success('Bot parado com sucesso!')
        console.log('[useBotStatus] Bot stopped successfully')

        // Refresh status after stopping
        await fetchStatus()
      } else {
        throw new Error(response.data?.error || 'Failed to stop bot')
      }
    } catch (error: any) {
      console.error('[useBotStatus] Failed to stop bot:', error)
      toast.error(error.message || 'Erro ao parar bot')
      throw error
    } finally {
      setLoading(false)
    }
  }, [fetchStatus])

  // Initial fetch and polling
  useEffect(() => {
    if (!userId) return

    // Initial fetch
    fetchStatus()

    // Poll for status updates every 5 seconds when user is authenticated
    const interval = setInterval(() => {
      fetchStatus()
    }, 5000)

    return () => {
      clearInterval(interval)
    }
  }, [userId, fetchStatus])

  return {
    botStatus,
    isConnected: botStatus?.isConnected || false,
    isRunning: botStatus?.isRunning || false,
    loading,
    startBotRuntime,
    stopBotRuntime,
    refreshStatus
  }
}
