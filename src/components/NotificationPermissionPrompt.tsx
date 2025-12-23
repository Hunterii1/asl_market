import { useState, useEffect } from 'react';
import { X, Bell, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { fcmNotificationService } from '@/services/fcmNotification';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export function NotificationPermissionPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [isRequesting, setIsRequesting] = useState(false);
  const { subscribe, hasPermission } = usePushNotifications();

  useEffect(() => {
    // Check permission status
    if ('Notification' in window) {
      const currentPermission = Notification.permission;
      setPermissionStatus(currentPermission);
      
      // Don't show if already dismissed in this session
      if (sessionStorage.getItem('notification-prompt-dismissed') === 'true') {
        return;
      }
      
      // Show prompt if permission is default (not asked yet) or denied
      if (currentPermission === 'default') {
        // Wait a bit before showing prompt (after user has seen the page)
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 3000);
        return () => clearTimeout(timer);
      } else if (currentPermission === 'denied') {
        // Show info about how to enable if denied (after a longer delay)
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      const result = await subscribe();
      if (result) {
        setPermissionStatus('granted');
        setShowPrompt(false);
      } else {
        setPermissionStatus(Notification.permission);
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      setPermissionStatus(Notification.permission);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem('notification-prompt-dismissed', 'true');
  };

  // Don't show if permission is granted
  if (permissionStatus === 'granted' || hasPermission) {
    return null;
  }

  // Detect platform
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  const isWindows = /Windows/.test(navigator.userAgent);
  const isMac = /Macintosh/.test(navigator.userAgent);
  const isChrome = /Chrome/.test(navigator.userAgent);
  const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
  const isFirefox = /Firefox/.test(navigator.userAgent);
  const isEdge = /Edg/.test(navigator.userAgent);

  const getInstructions = () => {
    if (permissionStatus === 'denied') {
      if (isIOS && isSafari) {
        return {
          title: 'فعال‌سازی نوتیفیکیشن در iOS Safari',
          steps: [
            'روی دکمه "تنظیمات" در پایین صفحه کلیک کنید',
            'گزینه "Allow" را انتخاب کنید',
            'یا به Settings > Safari > Notifications بروید',
            'سایت asllmarket.com را پیدا کرده و Allow را انتخاب کنید'
          ]
        };
      } else if (isAndroid && isChrome) {
        return {
          title: 'فعال‌سازی نوتیفیکیشن در Android Chrome',
          steps: [
            'روی آیکون قفل یا اطلاعات در نوار آدرس کلیک کنید',
            'گزینه "Notifications" را پیدا کنید',
            'آن را به "Allow" تغییر دهید',
            'صفحه را رفرش کنید'
          ]
        };
      } else if (isWindows || isMac) {
        if (isChrome || isEdge) {
          return {
            title: 'فعال‌سازی نوتیفیکیشن در Chrome/Edge',
            steps: [
              'روی آیکون قفل یا اطلاعات در سمت چپ نوار آدرس کلیک کنید',
              'گزینه "Notifications" را پیدا کنید',
              'آن را به "Allow" تغییر دهید',
              'صفحه را رفرش کنید'
            ]
          };
        } else if (isFirefox) {
          return {
            title: 'فعال‌سازی نوتیفیکیشن در Firefox',
            steps: [
              'روی آیکون قفل یا اطلاعات در سمت چپ نوار آدرس کلیک کنید',
              'گزینه "Notifications" را پیدا کنید',
              'آن را به "Allow" تغییر دهید',
              'صفحه را رفرش کنید'
            ]
          };
        } else if (isSafari) {
          return {
            title: 'فعال‌سازی نوتیفیکیشن در Safari',
            steps: [
              'به Safari > Settings > Websites > Notifications بروید',
              'سایت asllmarket.com را پیدا کنید',
              'گزینه "Allow" را انتخاب کنید',
              'صفحه را رفرش کنید'
            ]
          };
        }
      }
    }
    return null;
  };

  const instructions = getInstructions();

  if (permissionStatus === 'denied' && instructions) {
    return (
      <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              فعال‌سازی نوتیفیکیشن‌ها
            </DialogTitle>
            <DialogDescription>
              برای دریافت نوتیفیکیشن‌ها، لطفاً دسترسی را در تنظیمات مرورگر فعال کنید
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{instructions.title}</AlertTitle>
              <AlertDescription>
                <ol className="list-decimal list-inside space-y-2 mt-2 text-sm">
                  {instructions.steps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleDismiss}
                className="flex-1"
              >
                بعداً
              </Button>
              <Button
                onClick={() => {
                  setShowPrompt(false);
                  // Try to open browser settings if possible
                  if (isChrome || isEdge) {
                    window.open('chrome://settings/content/notifications', '_blank');
                  } else if (isFirefox) {
                    window.open('about:preferences#privacy', '_blank');
                  }
                }}
                className="flex-1"
              >
                باز کردن تنظیمات
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (permissionStatus === 'default') {
    return (
      <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-500" />
              فعال‌سازی نوتیفیکیشن‌ها
            </DialogTitle>
            <DialogDescription>
              برای دریافت نوتیفیکیشن‌های مهم، لطفاً دسترسی را فعال کنید
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">چرا نوتیفیکیشن؟</p>
                  <ul className="text-sm text-muted-foreground mt-1 space-y-1 list-disc list-inside">
                    <li>دریافت فوری درخواست‌های Matching</li>
                    <li>اطلاع از پیام‌های جدید</li>
                    <li>آگاهی از وضعیت درخواست‌ها</li>
                    <li>نوتیفیکیشن‌های مهم از ادمین</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleDismiss}
                disabled={isRequesting}
                className="flex-1"
              >
                نه، ممنون
              </Button>
              <Button
                onClick={handleRequestPermission}
                disabled={isRequesting}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {isRequesting ? 'در حال فعال‌سازی...' : 'فعال‌سازی'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}

