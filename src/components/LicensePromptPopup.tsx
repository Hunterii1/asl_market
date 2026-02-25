import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink, Phone, GraduationCap, CreditCard, UserPlus } from 'lucide-react';

interface LicensePromptPopupProps {
  open: boolean;
  onClose: () => void;
  showLoginOption?: boolean; // True for guest users
}

export function LicensePromptPopup({ open, onClose, showLoginOption = false }: LicensePromptPopupProps) {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  const handleTrainingClick = () => {
    window.open('https://alirezaasll.com/registration/', '_blank');
    handleClose();
  };

  const handleCallClick = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleTelegramClick = () => {
    window.open('https://t.me/incoming_center', '_blank');
  };

  const handleLoginClick = () => {
    window.location.href = '/login';
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={`sm:max-w-[500px] ${isClosing ? 'animate-out' : 'animate-in'}`}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            کسب‌وکارت رو توسعه بده
          </DialogTitle>
          <DialogDescription className="text-center text-lg font-semibold mt-2">
            با یک اشتراک جهانی بشو
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Login/Register Option (Only for guests) */}
          {showLoginOption && (
            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg border-2 border-green-200 dark:border-green-800">
              <div className="flex items-start gap-3">
                <UserPlus className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2">ثبت‌نام در پلتفرم</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    برای دسترسی به امکانات اصل مارکت، ابتدا ثبت‌نام کنید
                  </p>
                  <Button
                    onClick={handleLoginClick}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <UserPlus className="w-4 h-4 ml-2" />
                    ثبت‌نام / ورود
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Free Training Option */}
          <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg border-2 border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <GraduationCap className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-2">آموزش رایگان ۴ روزه صادرات</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  شروع کن با یادگیری اصول و پایه‌های صادرات
                </p>
                <Button
                  onClick={handleTrainingClick}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <ExternalLink className="w-4 h-4 ml-2" />
                  ثبت‌نام در دوره رایگان
                </Button>
              </div>
            </div>
          </div>

          {/* Direct Purchase Option */}
          <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 rounded-lg border-2 border-orange-200 dark:border-orange-800">
            <div className="flex items-start gap-3">
              <CreditCard className="w-6 h-6 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-2">خرید مستقیم اشتراک</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  برای خرید فوری با ما تماس بگیرید
                </p>
                
                <div className="space-y-2">
                  {/* Tehran Office 1 */}
                  <Button
                    onClick={() => handleCallClick('02188922936')}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Phone className="w-4 h-4 ml-2" />
                    <span className="font-mono">021-88922936</span>
                    <span className="mr-auto text-xs text-muted-foreground">دفتر تهران</span>
                  </Button>

                  {/* Tehran Office 2 */}
                  <Button
                    onClick={() => handleCallClick('02188922939')}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Phone className="w-4 h-4 ml-2" />
                    <span className="font-mono">021-88922939</span>
                    <span className="mr-auto text-xs text-muted-foreground">دفتر تهران</span>
                  </Button>

                  {/* Telegram Support */}
                  <Button
                    onClick={handleTelegramClick}
                    variant="outline"
                    className="w-full justify-start bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900"
                  >
                    <ExternalLink className="w-4 h-4 ml-2" />
                    <span className="font-mono">0912-021-1407</span>
                    <span className="mr-auto text-xs text-muted-foreground">پشتیبانی تلگرام</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Close button */}
        <div className="mt-4">
          <Button
            onClick={handleClose}
            variant="ghost"
            className="w-full"
          >
            بستن
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
