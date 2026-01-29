import { useState, useEffect } from 'react';
import { Bell, AlertCircle, CheckCircle, Sparkles, Zap, MessageSquare, Package } from 'lucide-react';
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
    const checkPermission = () => {
      if ('Notification' in window) {
        const currentPermission = Notification.permission;
        setPermissionStatus(currentPermission);
        
        // Don't show if already dismissed in this session
        if (sessionStorage.getItem('notification-prompt-dismissed') === 'true') {
          return;
        }
        
        // Don't show if permission is granted
        if (currentPermission === 'granted' || hasPermission) {
          setShowPrompt(false);
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
    };
    
    checkPermission();
    
    // Listen for permission changes
    const interval = setInterval(() => {
      if ('Notification' in window && Notification.permission !== permissionStatus) {
        checkPermission();
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [permissionStatus, hasPermission]);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      // For iOS Safari, ensure service worker is ready first
      if (isIOS && 'serviceWorker' in navigator) {
        try {
          await navigator.serviceWorker.ready;
        } catch (e) {
          console.warn('Service worker not ready:', e);
        }
      }

      // First request native browser permission (this shows the native system prompt)
      if ('Notification' in window && Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        setPermissionStatus(permission);
        
        if (permission === 'granted') {
          // Now subscribe to FCM
          const result = await subscribe();
          if (result) {
            setShowPrompt(false);
            return;
          }
        } else if (permission === 'denied') {
          // Show instructions for enabling
          setShowPrompt(true);
          return;
        }
      } else {
        // Permission already asked, just try to subscribe
        const result = await subscribe();
        if (result) {
          setPermissionStatus('granted');
          setShowPrompt(false);
        } else {
          setPermissionStatus(Notification.permission);
        }
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
            'سایت asllmarket.ir را پیدا کرده و Allow را انتخاب کنید'
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
              'سایت asllmarket.ir را پیدا کنید',
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

  // Denied permission - show instructions
  if (permissionStatus === 'denied' && instructions) {
    return (
      <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
        <DialogContent className="max-w-[90vw] sm:max-w-[550px] max-h-[90vh] overflow-y-auto p-0 gap-0 overflow-hidden rounded-2xl">
          {/* Header with gradient */}
          <div className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 p-4 sm:p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full -mr-12 -mt-12 sm:-mr-16 sm:-mt-16"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 sm:w-24 sm:h-24 bg-white/10 rounded-full -ml-8 -mb-8 sm:-ml-12 sm:-mb-12"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-xl sm:rounded-2xl mb-3 sm:mb-4 mx-auto backdrop-blur-sm">
                <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <DialogTitle className="text-lg sm:text-2xl font-bold text-center mb-1 sm:mb-2">
                فعال‌سازی دسترسی
              </DialogTitle>
              <DialogDescription className="text-orange-100 text-center text-xs sm:text-sm">
                برای دریافت نوتیفیکیشن‌ها، لطفاً دسترسی را در تنظیمات فعال کنید
              </DialogDescription>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
            <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800">
              <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <AlertTitle className="text-orange-800 dark:text-orange-200 text-sm sm:text-base">{instructions.title}</AlertTitle>
              <AlertDescription className="text-orange-700 dark:text-orange-300 mt-2">
                <ol className="list-decimal list-inside space-y-1.5 sm:space-y-2 text-xs sm:text-sm rtl:text-right">
                  {instructions.steps.map((step, index) => (
                    <li key={index} className="mb-0.5 sm:mb-1">{step}</li>
                  ))}
                </ol>
              </AlertDescription>
            </Alert>

            {/* Visual Guide */}
            <div className="bg-muted/50 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-border">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-xs sm:text-sm">نکته مهم</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    {isIOS 
                      ? 'در iOS، باید از طریق تنظیمات Safari دسترسی را فعال کنید'
                      : isAndroid
                      ? 'در Android، از طریق تنظیمات Chrome یا مرورگر خود دسترسی را فعال کنید'
                      : 'در مرورگر خود، به تنظیمات سایت بروید و Notifications را Allow کنید'}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 sm:gap-3 pt-2">
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
                    try {
                      window.open('chrome://settings/content/notifications', '_blank');
                    } catch (e) {
                      // Fallback: show instructions
                      alert('لطفاً به Chrome Settings > Privacy and security > Site settings > Notifications بروید و asllmarket.ir را Allow کنید');
                    }
                  } else if (isFirefox) {
                    try {
                      window.open('about:preferences#privacy', '_blank');
                    } catch (e) {
                      alert('لطفاً به Firefox Settings > Privacy & Security > Permissions > Notifications بروید');
                    }
                  } else if (isSafari && isMac) {
                    alert('لطفاً به Safari > Settings > Websites > Notifications بروید و asllmarket.ir را Allow کنید');
                  } else if (isIOS) {
                    alert('لطفاً به Settings > Safari > Notifications بروید و asllmarket.ir را Allow کنید');
                  } else {
                    alert('لطفاً به تنظیمات مرورگر خود بروید و Notifications را برای این سایت Allow کنید');
                  }
                }}
                className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg text-xs sm:text-sm py-2 sm:py-2.5"
              >
                <Bell className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                باز کردن تنظیمات
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Default permission - show request prompt
  if (permissionStatus === 'default') {
    return (
      <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
        <DialogContent className="max-w-[90vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto p-0 gap-0 overflow-hidden rounded-2xl">
          {/* Header with gradient */}
          <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-4 sm:p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full -mr-12 -mt-12 sm:-mr-16 sm:-mt-16"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 sm:w-24 sm:h-24 bg-white/10 rounded-full -ml-8 -mb-8 sm:-ml-12 sm:-mb-12"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-xl sm:rounded-2xl mb-3 sm:mb-4 mx-auto backdrop-blur-sm">
                <Bell className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <DialogTitle className="text-lg sm:text-2xl font-bold text-center mb-1 sm:mb-2">
                فعال‌سازی نوتیفیکیشن‌ها
              </DialogTitle>
              <DialogDescription className="text-blue-100 text-center text-xs sm:text-sm">
                برای دریافت اطلاع‌رسانی‌های فوری و مهم
              </DialogDescription>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
            {/* Benefits Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <div className="flex items-start gap-2 p-2.5 sm:p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg sm:rounded-xl border border-blue-200 dark:border-blue-800">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-xs sm:text-sm">درخواست‌های Matching</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">اطلاع فوری</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-2.5 sm:p-3 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg sm:rounded-xl border border-indigo-200 dark:border-indigo-800">
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-xs sm:text-sm">پیام‌های جدید</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">همیشه در جریان</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-2.5 sm:p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg sm:rounded-xl border border-purple-200 dark:border-purple-800">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-xs sm:text-sm">وضعیت درخواست‌ها</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">به‌روزرسانی لحظه‌ای</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-2.5 sm:p-3 bg-pink-50 dark:bg-pink-950/20 rounded-lg sm:rounded-xl border border-pink-200 dark:border-pink-800">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-xs sm:text-sm">نوتیفیکیشن ادمین</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">اطلاعات مهم</p>
                </div>
              </div>
            </div>

            {/* Info Alert */}
            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
              <Bell className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-xs sm:text-sm text-blue-800 dark:text-blue-200">
                با کلیک روی "فعال‌سازی"، پنجره مرورگر برای تأیید دسترسی باز می‌شود. لطفاً <strong>"Allow"</strong> یا <strong>"اجازه"</strong> را انتخاب کنید.
              </AlertDescription>
            </Alert>

            {/* Actions */}
            <div className="flex gap-2 sm:gap-3 pt-2">
              <Button
                variant="outline"
                onClick={handleDismiss}
                disabled={isRequesting}
                className="flex-1 text-xs sm:text-sm py-2 sm:py-2.5"
              >
                بعداً
              </Button>
              <Button
                onClick={handleRequestPermission}
                disabled={isRequesting}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg text-xs sm:text-sm py-2 sm:py-2.5"
              >
                {isRequesting ? (
                  <>
                    <span className="animate-spin mr-1.5 sm:mr-2 text-xs sm:text-sm">⏳</span>
                    <span className="text-xs sm:text-sm">در حال فعال‌سازی...</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                    فعال‌سازی
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}
