import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { ExternalLink, Phone, GraduationCap, Sparkles, UserPlus, ArrowLeft } from 'lucide-react';

interface LicensePromptPopupProps {
  open: boolean;
  onClose: () => void;
  showLoginOption?: boolean;
}

export function LicensePromptPopup({ open, onClose, showLoginOption = false }: LicensePromptPopupProps) {
  const handleTrainingClick = () => {
    window.open('https://alirezaasll.com/registration/', '_blank');
    onClose();
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

  const cardBase =
    'group relative w-full flex items-center gap-4 rounded-2xl p-4 text-right transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background overflow-hidden';

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="p-0 gap-0 overflow-hidden border-0 max-h-[90vh] w-[calc(100vw-1.5rem)] sm:max-w-[400px] rounded-3xl bg-transparent shadow-none"
        aria-describedby={undefined}
      >
        {/* Container with inner shadow + soft border */}
        <div className="rounded-3xl overflow-hidden bg-background/95 dark:bg-background/90 backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_25px 50px_-12px_rgba(0,0,0,0.4),0_0_100px_-20px_rgba(120,0,255,0.15)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_25px 50px_-12px_rgba(0,0,0,0.6),0_0 80px -15px rgba(139,92,246,0.12)]">
          {/* Hero — deep gradient + mesh feel */}
          <div className="relative px-6 pt-10 pb-8 text-center overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,#1e1b4b_0%,#312e81_25%,#4c1d95_50%,#5b21b6_75%,#7c3aed_100%)] dark:bg-[linear-gradient(135deg,#0f0d1e_0%,#1e1b4b_40%,#312e81_70%,#4c1d95_100%)]" />
            <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_100%_80%_at_50%_0%,#a78bfa,transparent_50%)]" />
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_60%_50%_at_80%_80%,#f472b6,transparent_50%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(0,0,0,0.15)_100%)]" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md border border-white/20 px-4 py-2 text-xs font-semibold text-white/95 mb-5 tracking-wide">
                <Sparkles className="w-4 h-4 text-amber-300" />
                اصل مارکت
              </div>
              <h2 className="text-2xl sm:text-[1.75rem] font-extrabold text-white tracking-tight leading-tight drop-shadow-lg [text-shadow:0_2px_20px_rgba(0,0,0,0.3)]">
                کسب‌وکارت رو توسعه بده
              </h2>
              <p className="mt-3 text-white/90 text-[1.05rem] font-medium tracking-wide">
                با یک اشتراک جهانی بشو
              </p>
            </div>
          </div>

          {/* Body — glass cards */}
          <div className="px-4 pb-4 pt-2 max-h-[52vh] overflow-y-auto overscroll-contain">
            <div className="space-y-3">
              {showLoginOption && (
                <button
                  type="button"
                  onClick={handleLoginClick}
                  className={`${cardBase} bg-gradient-to-br from-emerald-500/15 to-teal-500/15 dark:from-emerald-500/20 dark:to-teal-500/20 border border-emerald-400/25 hover:border-emerald-400/45 hover:from-emerald-500/25 hover:to-teal-500/25 hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.35)] active:scale-[0.99] focus-visible:ring-emerald-500/50`}
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/25 dark:bg-emerald-500/30 text-emerald-400 shadow-inner">
                    <UserPlus className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block font-bold text-foreground text-[1.02rem]">ثبت‌نام در پلتفرم</span>
                    <span className="block text-sm text-muted-foreground mt-0.5">دسترسی به امکانات اصل مارکت</span>
                  </div>
                  <ArrowLeft className="h-5 w-5 text-emerald-500 dark:text-emerald-400 shrink-0 group-hover:-translate-x-1 transition-transform duration-300" />
                </button>
              )}

              <button
                type="button"
                onClick={handleTrainingClick}
                className={`${cardBase} bg-gradient-to-br from-blue-500/15 to-indigo-500/15 dark:from-blue-500/20 dark:to-indigo-500/20 border border-blue-400/25 hover:border-blue-400/45 hover:from-blue-500/25 hover:to-indigo-500/25 hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.35)] active:scale-[0.99] focus-visible:ring-blue-500/50`}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/25 dark:bg-blue-500/30 text-blue-400 shadow-inner">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block font-bold text-foreground text-[1.02rem]">آموزش رایگان ۴ روزه صادرات</span>
                  <span className="block text-sm text-muted-foreground mt-0.5">اصول و پایه‌های صادرات</span>
                </div>
                <ExternalLink className="h-5 w-5 text-blue-500 dark:text-blue-400 shrink-0 group-hover:scale-110 group-hover:-translate-x-0.5 transition-all duration-300" />
              </button>

              <div className="rounded-2xl bg-gradient-to-br from-amber-500/12 to-orange-500/12 dark:from-amber-500/18 dark:to-orange-500/18 border border-amber-400/25 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/25 dark:bg-amber-500/30 text-amber-400 shadow-inner">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div className="text-right">
                    <span className="block font-bold text-foreground text-[1.02rem]">خرید مستقیم اشتراک</span>
                    <span className="block text-xs text-muted-foreground mt-0.5">تماس با پشتیبانی</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleCallClick('02188922936')}
                    className="inline-flex items-center gap-2 h-10 px-4 rounded-xl font-mono text-sm bg-muted/90 hover:bg-muted border border-border/80 hover:border-amber-500/30 hover:shadow-[0_0_20px_-5px_rgba(245,158,11,0.2)] transition-all duration-200 active:scale-[0.98]"
                  >
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    021-88922936
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCallClick('02188922939')}
                    className="inline-flex items-center gap-2 h-10 px-4 rounded-xl font-mono text-sm bg-muted/90 hover:bg-muted border border-border/80 hover:border-amber-500/30 hover:shadow-[0_0_20px_-5px_rgba(245,158,11,0.2)] transition-all duration-200 active:scale-[0.98]"
                  >
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    021-88922939
                  </button>
                  <button
                    type="button"
                    onClick={handleTelegramClick}
                    className="inline-flex items-center gap-2 h-10 px-4 rounded-xl font-mono text-sm bg-[#0088cc]/15 hover:bg-[#0088cc]/25 dark:bg-[#0088cc]/20 dark:hover:bg-[#0088cc]/30 border border-[#0088cc]/30 text-[#0088cc] dark:text-[#54a9eb] hover:shadow-[0_0_20px_-5px_rgba(0,136,204,0.35)] transition-all duration-200 active:scale-[0.98]"
                  >
                    <ExternalLink className="h-4 w-4" />
                    0912-021-1407
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 pb-5 pt-3 border-t border-border/50 bg-muted/20 dark:bg-muted/10">
            <button
              type="button"
              className="w-full py-3 text-sm font-medium text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted/50 transition-colors duration-200"
              onClick={onClose}
            >
              بستن
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
