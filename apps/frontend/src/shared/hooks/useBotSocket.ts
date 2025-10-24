import { useEffect, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { getApiUrl } from '@/shared/utils/getApiUrl'

const SOCKET_URL = getApiUrl()

interface BotSocketData {
  currentStatus: string | null
  isConnected: boolean
  onTradeCompleted: (callback: (trade: any) => void) => void
  onPnlUpdate: (callback: (pnl: any) => void) => void
  onPositionClosed: (callback: (position: any) => void) => void
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

      // ✅ Authenticate with server and associate userId with socket
      if (userId) {
        socketInstance.emit('user:auth', { userId })
        console.log(`[useBotSocket] 🔐 Authenticated with userId: ${userId}`)
      }
    })

    socketInstance.on('disconnect', () => {
      console.log('[useBotSocket] ❌ Disconnected from Socket.IO')
      setIsConnected(false)
    })

    // ✅ Listen to bot status updates from API server
    socketInstance.on('bot:status-update', (data: any) => {
      console.log('[useBotSocket] 📊 Bot Status Update:', data)
      setCurrentStatus(data.status)
    })

    // Backward compatibility with old bot_status event
    socketInstance.on('bot_status', (data: any) => {
      console.log('[useBotSocket] Bot Status (legacy):', data)
      setCurrentStatus(data.status)
    })

    socketInstance.on('trade_completed', (data: any) => {
      console.log('[useBotSocket] Trade Completed:', data)
    })

    socketInstance.on('pnl_update', (data: any) => {
      console.log('[useBotSocket] PnL Update:', data)
    })

    // ✅ Listen for position closed events (triggers auto-refresh)
    socketInstance.on('position:closed', (data: any) => {
      console.log('[useBotSocket] 🔔 Position Closed:', data)
      // This event can be used to trigger data refresh in components
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

  const onPositionClosed = useCallback(
    (callback: (position: any) => void) => {
      if (socket) {
        socket.on('position:closed', callback)
      }
    },
    [socket]
  )

  return {
    currentStatus,
    isConnected,
    onTradeCompleted,
    onPnlUpdate,
    onPositionClosed,
  }
}
