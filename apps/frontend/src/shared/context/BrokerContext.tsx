import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { botAPI } from '@/shared/services/api/client'
import { toast } from 'sonner'

interface BrokerContextType {
  isConnected: boolean
  isLoading: boolean
  balance: number
  connectionType: string | null
  connect: (userId: string) => Promise<void>
  disconnect: (userId: string) => Promise<void>
  checkStatus: (userId: string) => Promise<void>
}

const BrokerContext = createContext<BrokerContextType | undefined>(undefined)

interface BrokerProviderProps {
  children: ReactNode
}

export const BrokerProvider: React.FC<BrokerProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [balance, setBalance] = useState(0)
  const [connectionType, setConnectionType] = useState<string | null>(null)

  // Check connection status from database
  const checkStatus = useCallback(async (userId: string) => {
    if (!userId) return

    try {
      console.log('[BrokerContext] Checking connection status from database...')

      // Query Supabase directly for real-time status
      const { data, error } = await supabase
        .from('bot_status')
        .select('is_connected, broker_balance, connection_type')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        console.error('[BrokerContext] Error checking status:', error)
        return
      }

      if (data) {
        setIsConnected(data.is_connected || false)
        setBalance(data.broker_balance || 0)
        setConnectionType(data.connection_type || null)
        console.log(`[BrokerContext] Status loaded: ${data.is_connected ? 'Connected' : 'Disconnected'}`)
      } else {
        setIsConnected(false)
        setBalance(0)
        setConnectionType(null)
        console.log('[BrokerContext] No status record found')
      }
    } catch (error: any) {
      console.error('[BrokerContext] Unexpected error:', error)
    }
  }, [])

  // Connect to broker
  const connect = useCallback(async (userId: string) => {
    if (!userId) {
      toast.error('Usuário não identificado')
      return
    }

    setIsLoading(true)
    try {
      console.log('[BrokerContext] Connecting to broker...')
      const response = await botAPI.connect(userId)

      if (response.data?.success) {
        setIsConnected(true)
        setBalance(response.data.balanceAmount || 0)
        setConnectionType('websocket')
        toast.success('Conectado à corretora com sucesso')
        console.log('[BrokerContext] Connected successfully')

        // Refresh status to ensure sync
        await checkStatus(userId)
      } else {
        throw new Error(response.data?.error || 'Falha ao conectar')
      }
    } catch (error: any) {
      console.error('[BrokerContext] Connection failed:', error)
      toast.error(error.message || 'Falha ao conectar à corretora')
      setIsConnected(false)
    } finally {
      setIsLoading(false)
    }
  }, [checkStatus])

  // Disconnect from broker
  const disconnect = useCallback(async (userId: string) => {
    if (!userId) {
      toast.error('Usuário não identificado')
      return
    }

    setIsLoading(true)
    try {
      console.log('[BrokerContext] Disconnecting from broker...')
      await botAPI.disconnect(userId)

      setIsConnected(false)
      setBalance(0)
      setConnectionType(null)
      toast.success('Desconectado da corretora')
      console.log('[BrokerContext] Disconnected successfully')
    } catch (error: any) {
      console.error('[BrokerContext] Disconnect failed:', error)
      toast.error(error.message || 'Falha ao desconectar')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const value: BrokerContextType = {
    isConnected,
    isLoading,
    balance,
    connectionType,
    connect,
    disconnect,
    checkStatus,
  }

  return <BrokerContext.Provider value={value}>{children}</BrokerContext.Provider>
}

// Custom hook to use broker context
export const useBrokerContext = (): BrokerContextType => {
  const context = useContext(BrokerContext)
  if (!context) {
    throw new Error('useBrokerContext must be used within a BrokerProvider')
  }
  return context
}

export default BrokerContext
