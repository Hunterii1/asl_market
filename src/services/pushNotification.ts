import { apiService } from './api';

const VAPID_PUBLIC_KEY_STORAGE = 'vapid_public_key';

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

class PushNotificationService {
  private vapidPublicKey: string | null = null;

  /**
   * Get VAPID public key from backend
   */
  async getVAPIDPublicKey(): Promise<string> {
    if (this.vapidPublicKey) {
      return this.vapidPublicKey;
    }

    // Check localStorage first
    const stored = localStorage.getItem(VAPID_PUBLIC_KEY_STORAGE);
    if (stored) {
      this.vapidPublicKey = stored;
      return stored;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch('/api/v1/push/vapid-key', {
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to get VAPID key');
      }

      const data = await response.json();
      this.vapidPublicKey = data.public_key;
      localStorage.setItem(VAPID_PUBLIC_KEY_STORAGE, this.vapidPublicKey);
      return this.vapidPublicKey;
    } catch (error) {
      console.error('Error getting VAPID key:', error);
      // Fallback to Firebase key
      this.vapidPublicKey = 'BOU4y6g5J16DjSRy5ybfM3_LiFeWTsoY8kx7ESQPNvz5OhHe3r-09XaTnyyuzHFhbrOp9DINikXHCLgHNZTQQzc';
      return this.vapidPublicKey;
    }
  }

  /**
   * Convert VAPID key to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Check if push notifications are supported
   */
  isSupported(): boolean {
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Notifications are not supported');
    }

    return await Notification.requestPermission();
  }

  /**
   * Check if user has granted permission
   */
  hasPermission(): boolean {
    return Notification.permission === 'granted';
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(): Promise<PushSubscriptionData | null> {
    if (!this.isSupported()) {
      console.warn('Push notifications are not supported');
      return null;
    }

    // Check permission
    if (!this.hasPermission()) {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.warn('Notification permission denied');
        return null;
      }
    }

    try {
      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Get VAPID public key
      const vapidPublicKey = await this.getVAPIDPublicKey();
      const applicationServerKey = this.urlBase64ToUint8Array(vapidPublicKey);

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource,
      });

      // Convert subscription to our format
      const subscriptionData: PushSubscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(
            subscription.getKey('p256dh')!
          ),
          auth: this.arrayBufferToBase64(
            subscription.getKey('auth')!
          ),
        },
      };

      // Send subscription to backend
      await apiService.subscribeToPush(subscriptionData);

      return subscriptionData;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      return null;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Get endpoint for backend
        const endpoint = subscription.endpoint;

        // Unsubscribe from browser
        await subscription.unsubscribe();

        // Unsubscribe from backend
        try {
          await apiService.unsubscribeFromPush(endpoint);
        } catch (error) {
          console.error('Error unsubscribing from backend:', error);
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      return false;
    }
  }

  /**
   * Check if user is subscribed
   */
  async isSubscribed(): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return subscription !== null;
    } catch (error) {
      console.error('Error checking subscription:', error);
      return false;
    }
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
   * Convert ArrayBuffer to base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
}

export const pushNotificationService = new PushNotificationService();

