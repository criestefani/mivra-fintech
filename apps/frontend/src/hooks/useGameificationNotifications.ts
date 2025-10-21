/**
 * useGameificationNotifications Hook
 * Real-time WebSocket notifications for gamification events
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { io, Socket } from 'socket.io-client';
import { useGamificationStore } from '../stores/gamificationStore';

interface GameificationNotification {
  id?: string;
  event_type: string;
  title: string;
  message: string;
  icon?: string;
  data?: Record<string, any>;
  timestamp: string;
  is_read?: boolean;
}

interface NotificationState {
  notifications: GameificationNotification[];
  unreadCount: number;
  lastNotification: GameificationNotification | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

let socketInstance: Socket | null = null;

/**
 * Initialize Socket.io connection (singleton)
 */
function getSocketInstance(): Socket {
  if (!socketInstance) {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    socketInstance = io(apiUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
    });

    console.log('🔌 Socket.io initialized');
  }
  return socketInstance;
}

/**
 * Hook for real-time gamification notifications
 */
export function useGameificationNotifications(userId: string | null) {
  const [notificationState, setNotificationState] = useState<NotificationState>({
    notifications: [],
    unreadCount: 0,
    lastNotification: null,
    isConnected: false,
    isLoading: false,
    error: null,
  });

  const socketRef = useRef<Socket | null>(null);
  const subscriptionRef = useRef<boolean>(false);

  // Get notification actions from store
  const { addNotification } = useGamificationStore(
    useShallow((state) => ({
      addNotification: state.addNotification,
    }))
  );

  // Subscribe to notifications
  const subscribeToNotifications = useCallback(() => {
    if (!userId || subscriptionRef.current) return;

    try {
      const socket = getSocketInstance();
      socketRef.current = socket;

      // Subscribe to notifications
      socket.emit('subscribe-notifications', { userId });
      subscriptionRef.current = true;

      console.log(`🔔 Subscribed to notifications for user: ${userId}`);

      // Listen for unread count
      socket.on('unread-notifications-count', (data: { count: number }) => {
        setNotificationState((prev) => ({
          ...prev,
          unreadCount: data.count,
        }));
      });

      // Listen for new notifications
      socket.on('new-notification', (notification: GameificationNotification) => {
        console.log('📬 New notification:', notification);

        setNotificationState((prev) => ({
          ...prev,
          notifications: [notification, ...prev.notifications],
          unreadCount: prev.unreadCount + 1,
          lastNotification: notification,
        }));

        // Update store for animations/UI reactions
        addNotification?.(notification);
      });

      // Connection events
      socket.on('connect', () => {
        console.log('✅ Socket.io connected');
        setNotificationState((prev) => ({
          ...prev,
          isConnected: true,
          error: null,
        }));
      });

      socket.on('disconnect', () => {
        console.log('❌ Socket.io disconnected');
        setNotificationState((prev) => ({
          ...prev,
          isConnected: false,
        }));
      });

      socket.on('error', (error: any) => {
        console.error('❌ Socket.io error:', error);
        setNotificationState((prev) => ({
          ...prev,
          error: error.message || 'Connection error',
        }));
      });
    } catch (error) {
      console.error('❌ Error subscribing to notifications:', error);
      setNotificationState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, [userId, addNotification]);

  // Unsubscribe from notifications
  const unsubscribeFromNotifications = useCallback(() => {
    if (!userId || !socketRef.current || !subscriptionRef.current) return;

    try {
      socketRef.current.emit('unsubscribe-notifications', { userId });
      subscriptionRef.current = false;
      console.log(`🔔 Unsubscribed from notifications for user: ${userId}`);
    } catch (error) {
      console.error('❌ Error unsubscribing from notifications:', error);
    }
  }, [userId]);

  // Mark notification as read
  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!userId) return;

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/gamification/notifications/${notificationId}/read`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
          }
        );

        if (!response.ok) throw new Error('Failed to mark notification as read');

        setNotificationState((prev) => ({
          ...prev,
          notifications: prev.notifications.map((n) =>
            n.id === notificationId ? { ...n, is_read: true } : n
          ),
          unreadCount: Math.max(0, prev.unreadCount - 1),
        }));
      } catch (error) {
        console.error('❌ Error marking notification as read:', error);
      }
    },
    [userId]
  );

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/gamification/notifications/${userId}/read-all`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.ok) throw new Error('Failed to mark all as read');

      setNotificationState((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) => ({ ...n, is_read: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error('❌ Error marking all as read:', error);
    }
  }, [userId]);

  // Setup subscription when userId changes
  useEffect(() => {
    if (userId) {
      subscribeToNotifications();
    }

    return () => {
      if (userId) {
        unsubscribeFromNotifications();
      }
    };
  }, [userId, subscribeToNotifications, unsubscribeFromNotifications]);

  return {
    // State
    notifications: notificationState.notifications,
    unreadCount: notificationState.unreadCount,
    lastNotification: notificationState.lastNotification,
    isConnected: notificationState.isConnected,
    isLoading: notificationState.isLoading,
    error: notificationState.error,

    // Actions
    markAsRead,
    markAllAsRead,
    refresh: subscribeToNotifications,
  };
}

/**
 * Cleanup Socket.io on app unmount
 */
export function disconnectGameificationNotifications() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
    console.log('🔌 Socket.io disconnected');
  }
}
