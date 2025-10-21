/**
 * NotificationProvider Component
 * Provides gamification notifications to the entire app
 * Wraps useGameificationNotifications hook and renders NotificationToast
 */

import { ReactNode, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useGameificationNotifications, disconnectGameificationNotifications } from '../../../hooks/useGameificationNotifications';
import { NotificationToast } from '../components/NotificationToast';

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { userId } = useAuth();

  // Initialize notifications hook
  useGameificationNotifications(userId || null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectGameificationNotifications();
    };
  }, []);

  return (
    <>
      {children}
      <NotificationToast />
    </>
  );
}

export default NotificationProvider;
