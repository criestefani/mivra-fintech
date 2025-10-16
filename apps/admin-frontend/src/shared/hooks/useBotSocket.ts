import { useEffect, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001'

interface BotSocketData {
  currentStatus: string | null
  isConnected: boolean
  onTradeCompleted: (callback: (trade: any) => void) => void
  onPnlUpdate: (callback: (pnl: any) => void) => void
}

export const useBotSocket = (userId?: string): BotSocketData => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [currentStatus, setCurrentStatus] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!userId) return

    console.log('[useBotSocket] Connecting to Socket.IO...', SOCKET_URL)

    const socketInstance = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socketInstance.on('connect', () => {
      console.log('[useBotSocket] ✅ Connected to Socket.IO')
      setIsConnected(true)
    })

    socketInstance.on('disconnect', () => {
      console.log('[useBotSocket] ❌ Disconnected from Socket.IO')
      setIsConnected(false)
    })

    socketInstance.on('bot_status', (data: any) => {
      console.log('[useBotSocket] Bot Status:', data)
      setCurrentStatus(data.status)
    })

    socketInstance.on('trade_completed', (data: any) => {
      console.log('[useBotSocket] Trade Completed:', data)
    })

    socketInstance.on('pnl_update', (data: any) => {
      console.log('[useBotSocket] PnL Update:', data)
    })

    socketInstance.on('error', (error: any) => {
      console.error('[useBotSocket] Socket Error:', error)
    })

    setSocket(socketInstance)

    return () => {
      console.log('[useBotSocket] Cleaning up socket connection')
      socketInstance.disconnect()
    }
  }, [userId])

  const onTradeCompleted = useCallback(
    (callback: (trade: any) => void) => {
      if (socket) {
        socket.on('trade_completed', callback)
      }
    },
    [socket]
  )

  const onPnlUpdate = useCallback(
    (callback: (pnl: any) => void) => {
      if (socket) {
        socket.on('pnl_update', callback)
      }
    },
    [socket]
  )

  return {
    currentStatus,
    isConnected,
    onTradeCompleted,
    onPnlUpdate,
  }
}
