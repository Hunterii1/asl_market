import { useState, useEffect, useCallback } from 'react';
import { fcmNotificationService } from '@/services/fcmNotification';
import { useToast } from './use-toast';
import { useAuth } from './useAuth';

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    setIsSupported(fcmNotificationService.isSupported());
    checkSubscription();
    
    // Setup foreground message handler
    if (fcmNotificationService.isSupported()) {
      fcmNotificationService.setupForegroundHandler((payload) => {
        // Show notification when app is in foreground
        if (payload.notification) {
          new Notification(payload.notification.title || 'ASL Market', {
            body: payload.notification.body,
            icon: payload.notification.icon || '/pwa.png',
            badge: '/pwa.png',
            tag: payload.data?.tag || 'notification',
            data: payload.data || {},
          });
        }
      });
    }
  }, []);

  const checkSubscription = async () => {
    if (!fcmNotificationService.isSupported()) return;
    const subscribed = await fcmNotificationService.isSubscribed();
    setIsSubscribed(subscribed);
  };

  const subscribe = useCallback(async () => {
    if (!fcmNotificationService.isSupported()) {
      toast({
        variant: 'destructive',
        title: 'خطا',
        description: 'مرورگر شما از Push Notifications پشتیبانی نمی‌کند',
      });
      return false;
    }

    setIsLoading(true);
    try {
      const token = await fcmNotificationService.subscribe();
      if (token) {
        setIsSubscribed(true);
        toast({
          title: 'موفقیت',
          description: 'Push Notifications با موفقیت فعال شد',
        });
        return true;
      } else {
        toast({
          variant: 'destructive',
          title: 'خطا',
          description: 'خطا در فعال‌سازی Push Notifications',
        });
        return false;
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'خطا',
        description: error.message || 'خطا در فعال‌سازی Push Notifications',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const unsubscribe = useCallback(async () => {
    setIsLoading(true);
    try {
      const success = await fcmNotificationService.unsubscribe();
      if (success) {
        setIsSubscribed(false);
        toast({
          title: 'موفقیت',
          description: 'Push Notifications غیرفعال شد',
        });
        return true;
      }
      return false;
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'خطا',
        description: error.message || 'خطا در غیرفعال‌سازی Push Notifications',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const sendTest = useCallback(async () => {
    try {
      await fcmNotificationService.sendTestPush();
      toast({
        title: 'موفقیت',
        description: 'پیام تست ارسال شد',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'خطا',
        description: error.message || 'خطا در ارسال پیام تست',
      });
    }
  }, [toast]);

  // Auto-subscribe when user logs in (only if permission is granted)
  useEffect(() => {
    if (user && isSupported && !isSubscribed && hasPermission) {
      // Auto-subscribe after a short delay
      const timer = setTimeout(() => {
        subscribe();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user, isSupported, isSubscribed, hasPermission, subscribe]);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    sendTest,
    hasPermission: fcmNotificationService.hasPermission(),
  };
}

