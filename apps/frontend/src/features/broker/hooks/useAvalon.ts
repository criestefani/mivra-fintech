import { useState, useCallback } from 'react'
import { botAPI } from '@/shared/services/api/client'
import { toast } from 'sonner'

interface UseAvalonResult {
  isConnected: boolean
  isLoading: boolean
  connect: (userId: string | null | undefined) => Promise<void>
  disconnect: (userId: string | null | undefined) => Promise<void>
}

export const useAvalon = (): UseAvalonResult => {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const connect = useCallback(async (userId: string | null | undefined) => {
    if (!userId) {
      toast.error('Usuário não identificado. Faça login novamente.');
      console.error('[useAvalon] Missing userId for connect call');
      return;
    }

    setIsLoading(true)
    try {
      console.log('[useAvalon] Connecting to broker...')
      const response = await botAPI.connect(userId)

      if (response.data?.success) {
        setIsConnected(true)
        toast.success('Connected to broker successfully')
        console.log('[useAvalon] Connected successfully')
      } else {
        throw new Error(response.data?.error || 'Failed to connect')
      }
    } catch (error: any) {
      console.error('[useAvalon] Connection failed:', error)
      toast.error(error.message || 'Failed to connect to broker')
      setIsConnected(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const disconnect = useCallback(async (userId: string | null | undefined) => {
    if (!userId) {
      toast.error('Usuário não identificado. Faça login novamente.');
      console.error('[useAvalon] Missing userId for disconnect call');
      return;
    }

    setIsLoading(true)
    try {
      console.log('[useAvalon] Disconnecting from broker...')
      await botAPI.disconnect(userId)
      setIsConnected(false)
      toast.success('Disconnected from broker')
      console.log('[useAvalon] Disconnected successfully')
    } catch (error: any) {
      console.error('[useAvalon] Disconnect failed:', error)
      toast.error(error.message || 'Failed to disconnect')
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    isConnected,
    isLoading,
    connect,
    disconnect,
  }
}
