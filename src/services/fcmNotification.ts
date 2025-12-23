import { messaging } from '@/config/firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { apiService } from './api';

class FCMNotificationService {
  private fcmToken: string | null = null;
  private tokenRefreshCallback: ((token: string) => void) | null = null;

  /**
   * Check if FCM is supported
   */
  isSupported(): boolean {
    return typeof window !== 'undefined' && 
           'serviceWorker' in navigator && 
           messaging !== null;
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported in this browser.');
      return 'denied';
    }
    
    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    return permission;
  }

  /**
   * Check if permission is granted
   */
  hasPermission(): boolean {
    if (!('Notification' in window)) {
      return false;
    }
    return Notification.permission === 'granted';
  }

  /**
   * Get FCM token
   */
  async getToken(): Promise<string | null> {
    if (!this.isSupported() || !messaging) {
      console.warn('FCM is not supported');
      return null;
    }

    if (this.fcmToken) {
      return this.fcmToken;
    }

    try {
      // Check permission first
      if (!this.hasPermission()) {
        const permission = await this.requestPermission();
        if (permission !== 'granted') {
          console.warn('Notification permission denied');
          return null;
        }
      }

      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey: 'BOU4y6g5J16DjSRy5ybfM3_LiFeWTsoY8kx7ESQPNvz5OhHe3r-09XaTnyyuzHFhbrOp9DINikXHCLgHNZTQQzc'
      });

      if (token) {
        this.fcmToken = token;
        console.log('FCM Token:', token);
        
        // Send token to backend
        await this.sendTokenToBackend(token);
        
        return token;
      } else {
        console.warn('No FCM token available');
        return null;
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Send FCM token to backend
   */
  private async sendTokenToBackend(token: string): Promise<void> {
    try {
      // Send FCM token directly as endpoint (backend will detect it's FCM)
      const subscription = {
        endpoint: token, // Send token directly
        keys: {
          p256dh: '', // FCM doesn't use these keys
          auth: ''
        }
      };
      
      await apiService.subscribeToPush(subscription as any);
    } catch (error) {
      console.error('Error sending FCM token to backend:', error);
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(): Promise<string | null> {
    return await this.getToken();
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    try {
      // FCM tokens are managed by Firebase
      // We just mark it as inactive in backend
      if (this.fcmToken) {
        await apiService.unsubscribeFromPush(this.fcmToken);
        this.fcmToken = null;
      }
      return true;
    } catch (error) {
      console.error('Error unsubscribing from FCM:', error);
      return false;
    }
  }

  /**
   * Check if currently subscribed
   */
  async isSubscribed(): Promise<boolean> {
    if (!this.isSupported()) {
      return false;
    }
    
    if (this.fcmToken) {
      return true;
    }
    
    const token = await this.getToken();
    return token !== null;
  }

  /**
   * Setup foreground message handler
   */
  setupForegroundHandler(callback: (payload: any) => void): void {
    if (!messaging) {
      console.warn('FCM messaging not available');
      return;
    }

    onMessage(messaging, (payload) => {
      console.log('Message received in foreground:', payload);
      callback(payload);
    });
  }

  /**
   * Send test push notification
   */
  async sendTestPush(): Promise<void> {
    try {
      await apiService.sendTestPush();
    } catch (error) {
      console.error('Error sending test push:', error);
      throw error;
    }
  }

  /**
   * Set token refresh callback
   */
  onTokenRefresh(callback: (token: string) => void): void {
    this.tokenRefreshCallback = callback;
  }
}

export const fcmNotificationService = new FCMNotificationService();

