import { useState, useEffect, useCallback } from 'react';
import { pushNotificationService } from '@/services/pushNotification';
import { useToast } from './use-toast';
import { useAuth } from './useAuth';

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    setIsSupported(pushNotificationService.isSupported());
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    if (!pushNotificationService.isSupported()) return;
    const subscribed = await pushNotificationService.isSubscribed();
    setIsSubscribed(subscribed);
  };

  const subscribe = useCallback(async () => {
    if (!pushNotificationService.isSupported()) {
      toast({
        variant: 'destructive',
        title: 'خطا',
        description: 'مرورگر شما از Push Notifications پشتیبانی نمی‌کند',
      });
      return false;
    }

    setIsLoading(true);
    try {
      const subscription = await pushNotificationService.subscribe();
      if (subscription) {
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
      const success = await pushNotificationService.unsubscribe();
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
      await pushNotificationService.sendTestPush();
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

  // Auto-subscribe when user logs in
  useEffect(() => {
    if (user && isSupported && !isSubscribed) {
      // Auto-subscribe after a short delay
      const timer = setTimeout(() => {
        subscribe();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user, isSupported, isSubscribed, subscribe]);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    sendTest,
    hasPermission: pushNotificationService.hasPermission(),
  };
}

