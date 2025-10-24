import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { botAPI } from '@/shared/services/api/client'
import { toast } from 'sonner'

// ✅ User-specific session state
interface UserSessionState {
  isConnected: boolean
  isLoading: boolean
  balance: number
  connectionType: string | null
}

interface BrokerContextType {
  isConnected: boolean
  isLoading: boolean
  balance: number
  connectionType: string | null
  connect: (userId: string) => Promise<void>
  disconnect: (userId: string) => Promise<void>
  checkStatus: (userId: string) => Promise<void>
  currentUserId: string | null
  setActiveUser: (userId: string) => void  // ✅ Let components set active user
}

const BrokerContext = createContext<BrokerContextType | undefined>(undefined)

interface BrokerProviderProps {
  children: ReactNode
}

export const BrokerProvider: React.FC<BrokerProviderProps> = ({ children }) => {
  // ✅ Store separate session state for each user
  const [userSessions, setUserSessions] = useState<Record<string, UserSessionState>>({})
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // ✅ Get current user's state
  const getCurrentSession = (userId?: string): UserSessionState => {
    const id = userId || currentUserId
    if (!id) {
      return { isConnected: false, isLoading: false, balance: 0, connectionType: null }
    }
    return userSessions[id] || { isConnected: false, isLoading: false, balance: 0, connectionType: null }
  }

  // ✅ Update specific user's state
  const updateUserSession = (userId: string, updates: Partial<UserSessionState>) => {
    setUserSessions(prev => ({
      ...prev,
      [userId]: { ...getCurrentSession(userId), ...updates }
    }))
  }

  // ✅ Set which user is "active" in this context
  const setActiveUser = (userId: string) => {
    setCurrentUserId(userId)
  }

  // Expose current user's state
  const currentSession = getCurrentSession()

  // ✅ Check connection status for specific user
  const checkStatus = useCallback(async (userId: string) => {
    if (!userId) return

    try {
      console.log(`[BrokerContext] Checking status for user ${userId}...`)

      // Query Supabase directly for real-time status
      const { data, error } = await supabase
        .from('bot_status')
        .select('is_connected, broker_balance, connection_type')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        console.error(`[BrokerContext] Error checking status for ${userId}:`, error)
        return
      }

      if (data) {
        console.log(`[BrokerContext] User ${userId} status: ${data.is_connected ? 'Connected' : 'Disconnected'}, Balance: ${data.broker_balance}`)
        updateUserSession(userId, {
          isConnected: data.is_connected || false,
          balance: data.broker_balance || 0,
          connectionType: data.connection_type || null,
        })
      } else {
        console.log(`[BrokerContext] No status record for user ${userId}`)
        updateUserSession(userId, {
          isConnected: false,
          balance: 0,
          connectionType: null,
        })
      }
    } catch (error: any) {
      console.error(`[BrokerContext] Unexpected error for ${userId}:`, error)
    }
  }, [userSessions])

  // ✅ Connect to broker for specific user
  const connect = useCallback(async (userId: string) => {
    if (!userId) {
      toast.error('Usuário não identificado')
      return
    }

    updateUserSession(userId, { isLoading: true })
    try {
      console.log(`[BrokerContext] Connecting user ${userId} to broker...`)
      const response = await botAPI.connect(userId)

      if (response.data?.success) {
        updateUserSession(userId, {
          isConnected: true,
          balance: response.data.balanceAmount || 0,
          connectionType: 'websocket',
          isLoading: false,
        })
        toast.success('Conectado à corretora com sucesso')
        console.log(`[BrokerContext] User ${userId} connected successfully`)

        // Refresh status to ensure sync
        await checkStatus(userId)
      } else {
        throw new Error(response.data?.error || 'Falha ao conectar')
      }
    } catch (error: any) {
      console.error(`[BrokerContext] Connection failed for ${userId}:`, error)
      toast.error(error.message || 'Falha ao conectar à corretora')
      updateUserSession(userId, { isConnected: false, isLoading: false })
    }
  }, [checkStatus, userSessions])

  // ✅ Disconnect from broker for specific user
  const disconnect = useCallback(async (userId: string) => {
    if (!userId) {
      toast.error('Usuário não identificado')
      return
    }

    updateUserSession(userId, { isLoading: true })
    try {
      console.log(`[BrokerContext] Disconnecting user ${userId} from broker...`)
      await botAPI.disconnect(userId)

      updateUserSession(userId, {
        isConnected: false,
        balance: 0,
        connectionType: null,
        isLoading: false,
      })
      toast.success('Desconectado da corretora')
      console.log(`[BrokerContext] User ${userId} disconnected successfully`)
    } catch (error: any) {
      console.error(`[BrokerContext] Disconnect failed for ${userId}:`, error)
      toast.error(error.message || 'Falha ao desconectar')
      updateUserSession(userId, { isLoading: false })
    }
  }, [userSessions])

  // ✅ Expose current user's state from context
  const value: BrokerContextType = {
    isConnected: currentSession.isConnected,
    isLoading: currentSession.isLoading,
    balance: currentSession.balance,
    connectionType: currentSession.connectionType,
    connect,
    disconnect,
    checkStatus,
    currentUserId,
    setActiveUser: (userId: string) => setCurrentUserId(userId),
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
