import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Smartphone, Download, CheckCircle } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if already installed via localStorage
    const installed = localStorage.getItem('pwa-installed');
    if (installed === 'true') {
      setIsInstalled(true);
      return;
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Show prompt after a delay if not shown yet
    const timer = setTimeout(() => {
      if (!deferredPrompt && !isInstalled) {
        setShowPrompt(true);
      }
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, [deferredPrompt, isInstalled]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Show manual instructions
      setShowPrompt(true);
      return;
    }

    try {
      // Show the install prompt
      await deferredPrompt.prompt();
      
      // Wait for user response
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        localStorage.setItem('pwa-installed', 'true');
        setIsInstalled(true);
        setShowPrompt(false);
      }
      
      // Clear the deferred prompt
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Error showing install prompt:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  // Don't show if dismissed in this session or already installed
  if (isInstalled || !showPrompt || sessionStorage.getItem('pwa-prompt-dismissed') === 'true') {
    return null;
  }

  return (
    <Card className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800 shadow-lg">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h3 className="text-lg font-bold text-foreground mb-1">
                  📱 نصب اپلیکیشن اصل مارکت
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  برای دسترسی سریع‌تر و راحت‌تر، اپلیکیشن را به صفحه اصلی گوشی خود اضافه کنید
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 flex-shrink-0"
                onClick={handleDismiss}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 mb-4 border border-green-200/50 dark:border-green-700/50">
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <p className="text-foreground">دسترسی سریع بدون نیاز به مرورگر</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <p className="text-foreground">کارکرد بهتر و سریع‌تر</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <p className="text-foreground">استفاده آفلاین از برخی امکانات</p>
                </div>
              </div>
            </div>

            {deferredPrompt ? (
              <Button
                onClick={handleInstallClick}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Download className="w-4 h-4 ml-2" />
                نصب اپلیکیشن
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-200 dark:border-blue-700">
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    راهنمای نصب دستی:
                  </p>
                  <div className="space-y-2 text-xs text-blue-800 dark:text-blue-200">
                    <div className="flex items-start gap-2">
                      <span className="font-bold">📱 Android:</span>
                      <p>روی منوی مرورگر (⋮) کلیک کنید → "Add to Home screen" یا "نصب اپ" را انتخاب کنید</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold">🍎 iOS:</span>
                      <p>روی دکمه Share (□↑) کلیک کنید → "Add to Home Screen" را انتخاب کنید</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold">💻 Desktop:</span>
                      <p>روی آیکون نصب در نوار آدرس مرورگر کلیک کنید</p>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleDismiss}
                  variant="outline"
                  className="w-full rounded-xl"
                >
                  متوجه شدم
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

