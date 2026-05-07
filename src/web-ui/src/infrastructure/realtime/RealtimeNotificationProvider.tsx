import React, { useEffect, useRef, useCallback, createContext, useContext, useState } from 'react';
import { RealtimeClient, isLoggedIn } from '@/infrastructure/api/service-api/AuthAPI';
import { notificationService } from '@/shared/notification-system/services/NotificationService';
import { createLogger } from '@/shared/utils/logger';

const log = createLogger('RealtimeNotificationProvider');

interface RealtimeContextValue {
  connected: boolean;
  unreadCount: number;
}

const RealtimeContext = createContext<RealtimeContextValue>({
  connected: false,
  unreadCount: 0,
});

export const useRealtime = () => useContext(RealtimeContext);

interface RealtimeNotificationProviderProps {
  children: React.ReactNode;
}

export const RealtimeNotificationProvider: React.FC<RealtimeNotificationProviderProps> = ({ children }) => {
  const clientRef = useRef<RealtimeClient | null>(null);
  const [connected, setConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleNotification = useCallback((data: any) => {
    log.info('Received notification', data);
    
    const variant = data.variant || 'info';
    const message = data.message || '';
    const title = data.title || '新消息';
    const duration = data.duration || 5000;

    switch (variant) {
      case 'success':
        notificationService.success(message, { title, duration });
        break;
      case 'error':
        notificationService.error(message, { title, duration: duration || 0 });
        break;
      case 'warning':
        notificationService.warning(message, { title, duration });
        break;
      default:
        notificationService.info(message, { title, duration });
    }

    setUnreadCount(prev => prev + 1);
  }, []);

  const handleBroadcast = useCallback((data: any) => {
    log.info('Received broadcast', data);
    
    const variant = data.variant || 'info';
    const message = data.message || '';
    const title = data.title || '系统公告';
    const duration = data.duration || 8000;

    switch (variant) {
      case 'success':
        notificationService.success(message, { title, duration });
        break;
      case 'error':
        notificationService.error(message, { title, duration: duration || 0 });
        break;
      case 'warning':
        notificationService.warning(message, { title, duration });
        break;
      default:
        notificationService.info(message, { title, duration });
    }

    setUnreadCount(prev => prev + 1);
  }, []);

  const handleConnected = useCallback(() => {
    log.info('Realtime connected');
    setConnected(true);
  }, []);

  const handleDisconnected = useCallback(() => {
    log.info('Realtime disconnected');
    setConnected(false);
  }, []);

  const handleError = useCallback((error: any) => {
    log.error('Realtime error', error);
    setConnected(false);
  }, []);

  useEffect(() => {
    if (!isLoggedIn()) {
      return;
    }

    const client = new RealtimeClient();
    clientRef.current = client;

    client.on('connected', handleConnected);
    client.on('disconnected', handleDisconnected);
    client.on('error', handleError);
    client.on('notification', handleNotification);
    client.on('broadcast', handleBroadcast);

    client.connect();

    return () => {
      client.disconnect();
      clientRef.current = null;
    };
  }, [handleConnected, handleDisconnected, handleError, handleNotification, handleBroadcast]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'kongling_auth_tokens') {
        if (!e.newValue && clientRef.current) {
          clientRef.current.disconnect();
          setConnected(false);
        } else if (e.newValue && !clientRef.current) {
          const client = new RealtimeClient();
          clientRef.current = client;

          client.on('connected', handleConnected);
          client.on('disconnected', handleDisconnected);
          client.on('error', handleError);
          client.on('notification', handleNotification);
          client.on('broadcast', handleBroadcast);

          client.connect();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [handleConnected, handleDisconnected, handleError, handleNotification, handleBroadcast]);

  return (
    <RealtimeContext.Provider value={{ connected, unreadCount }}>
      {children}
    </RealtimeContext.Provider>
  );
};

export default RealtimeNotificationProvider;
