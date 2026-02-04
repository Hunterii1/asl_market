import { useState, useCallback, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Package,
  UserCheck,
  MessageCircle,
  Star,
  CheckCircle,
  Rocket,
  ChevronRight,
  ChevronLeft,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const ASL_MATCH_ONBOARDING_SEEN_KEY = "asl_market_match_onboarding_seen";

export function hasSeenOnboarding(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ASL_MATCH_ONBOARDING_SEEN_KEY) === "1";
}

export function markOnboardingSeen(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ASL_MATCH_ONBOARDING_SEEN_KEY, "1");
}

const STEPS: Array<{
  id: string;
  icon: typeof Package;
  title: string;
  subtitle: string;
  description: string;
  bullets?: string[];
  gradient: string;
}> = [
  {
    id: "welcome",
    icon: Sparkles,
    title: "به ASL Match خوش آمدید",
    subtitle: "سیستم هوشمند اتصال تأمین‌کنندگان و ویزیتورها",
    description: "با چند قدم کوتاه با قابلیت‌های اصلی آشنا می‌شوید.",
    gradient: "from-orange-500 via-amber-500 to-orange-600",
  },
  {
    id: "suppliers",
    icon: Package,
    title: "برای تأمین‌کنندگان",
    subtitle: "محصول دارید؟ بفروشید",
    description: "درخواست Matching بسازید: نام محصول، مقدار، کشورهای مقصد، قیمت و زمان انقضا. سیستم ویزیتورهای مناسب را پیدا کرده و به آن‌ها نوتیفیکیشن می‌فرستد.",
    bullets: [
      "ایجاد درخواست از منوی «ایجاد درخواست»",
      "وضعیت‌ها: در انتظار → فعال → پذیرفته شده",
      "تمدید، ویرایش یا لغو درخواست",
    ],
    gradient: "from-orange-600 to-red-600",
  },
  {
    id: "visitors",
    icon: UserCheck,
    title: "برای ویزیتورها",
    subtitle: "درخواست‌های مناسب شما",
    description: "از منو «درخواست‌های موجود» درخواست‌هایی که با کشور و مهارت‌های شما هماهنگ است را ببینید.",
    bullets: [
      "پذیرش: درخواست برای شما رزرو و چت فعال می‌شود",
      "رد: درخواست به ویزیتورهای دیگر ارسال می‌شود",
      "سوال: سوال بپرسید؛ تأمین‌کننده پاسخ می‌دهد",
    ],
    gradient: "from-red-600 to-orange-500",
  },
  {
    id: "chat",
    icon: MessageCircle,
    title: "چت و ارتباط",
    subtitle: "بعد از پذیرش درخواست",
    description: "چت فقط برای درخواست‌های «پذیرفته شده» فعال است. از منو «مکالمات» همه گفتگوها را ببینید.",
    bullets: [
      "پیام فوری و به‌روزرسانی تقریباً Real-time",
      "نشان خوانده شده (✓✓)",
    ],
    gradient: "from-orange-500 via-red-500 to-orange-600",
  },
  {
    id: "ratings",
    icon: Star,
    title: "امتیاز و نوتیفیکیشن",
    subtitle: "بعد از تکمیل معامله",
    description: "امتیاز ۱ تا ۵ ستاره و در صورت تمایل نظر بگذارید. نوتیفیکیشن‌ها (Push و In-App) برای پذیرش درخواست، پیام جدید و امتیاز جدید ارسال می‌شوند.",
    gradient: "from-amber-500 to-orange-600",
  },
  {
    id: "tips",
    icon: CheckCircle,
    title: "نکات مهم",
    subtitle: "موفق‌تر عمل کنید",
    description: "اطلاعات کامل و دقیق، قیمت منصفانه و پاسخ به سوالات. از اطلاعات ناقص و نادیده گرفتن پیام‌ها پرهیز کنید.",
    gradient: "from-green-600 to-emerald-600",
  },
  {
    id: "done",
    icon: Rocket,
    title: "همه چیز آماده است",
    subtitle: "شروع کنید",
    description: "می‌توانید از منوی همین صفحه درخواست بسازید، درخواست‌های موجود را ببینید یا به مکالمات بروید. هر زمان از دکمه (?) کنار عنوان ASL Match می‌توانید این راهنما را دوباره ببینید.",
    gradient: "from-orange-500 via-red-500 to-orange-600",
  },
];

interface AslMatchOnboardingStoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** اگر true باشد، با بستن/اتمام، مقدار دیده‌شدن در localStorage ذخیره می‌شود (اولین بازدید). */
  markAsSeenOnClose?: boolean;
}

export function AslMatchOnboardingStory({
  open,
  onOpenChange,
  markAsSeenOnClose = false,
}: AslMatchOnboardingStoryProps) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const totalSteps = STEPS.length;

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);
  const current = STEPS[step];
  const isFirst = step === 0;
  const isLast = step === totalSteps - 1;
  const Icon = current.icon;

  const goNext = useCallback(() => {
    if (isLast) {
      if (markAsSeenOnClose) markOnboardingSeen();
      onOpenChange(false);
      setStep(0);
      return;
    }
    setDirection("next");
    setStep((s) => Math.min(s + 1, totalSteps - 1));
  }, [isLast, markAsSeenOnClose, onOpenChange, totalSteps]);

  const goPrev = useCallback(() => {
    if (isFirst) return;
    setDirection("prev");
    setStep((s) => Math.max(s - 1, 0));
  }, [isFirst]);

  const handleClose = useCallback(() => {
    if (markAsSeenOnClose) markOnboardingSeen();
    onOpenChange(false);
    setStep(0);
  }, [markAsSeenOnClose, onOpenChange]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) handleClose();
      onOpenChange(next);
    },
    [handleClose, onOpenChange]
  );

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl border-2 border-orange-200 dark:border-orange-800 bg-gradient-to-b from-background to-orange-50/50 dark:to-orange-950/30 shadow-2xl outline-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "duration-300"
          )}
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={handleClose}
        >
          {/* Progress bar */}
          <div className="h-1.5 w-full rounded-b-full overflow-hidden bg-muted/50">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500 ease-out rounded-full"
              style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
            />
          </div>

          {/* Step dots */}
          <div className="flex justify-center gap-1.5 pt-3 pb-1">
            {STEPS.map((_, i) => {
              const isActive = i === step;
              const isPast = i < step;
              const dotClass = isActive ? "w-6 bg-orange-500" : isPast ? "w-2 bg-orange-400/80" : "w-2 bg-muted-foreground/30";
              return (
                <button
                  key={i}
                  type="button"
                  aria-label={`برگه ${i + 1}`}
                  onClick={() => {
                    setDirection(i > step ? "next" : "prev");
                    setStep(i);
                  }}
                  className={cn("h-2 rounded-full transition-all duration-300", dotClass)}
                />
              );
            })}
          </div>

          {/* Close button */}
          <Dialog.Close
            onClick={handleClose}
            className="absolute left-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="بستن"
          >
            <X className="h-5 w-5" />
          </Dialog.Close>

          {/* Slide content */}
          <div className="px-6 sm:px-8 pt-2 pb-6 min-h-[320px] flex flex-col items-center text-center" dir="rtl">
            <div
              key={step}
              className={cn(
                "flex flex-col flex-1 w-full animate-in duration-300",
                direction === "next"
                  ? "fade-in-0 slide-in-from-left-4"
                  : "fade-in-0 slide-in-from-right-4"
              )}
            >
              <div
                className={cn(
                  "mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg",
                  current.gradient
                )}
              >
                <Icon className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1">
                {current.title}
              </h2>
              <p className="text-sm text-orange-600 dark:text-orange-400 font-medium mb-3">
                {current.subtitle}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto mb-4">
                {current.description}
              </p>
              {current.bullets && current.bullets.length > 0 && (
                <ul className="text-sm text-muted-foreground text-right space-y-2 w-full max-w-sm mx-auto mb-4">
                  {current.bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-between w-full gap-4 mt-auto pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={goPrev}
                disabled={isFirst}
                className="rounded-xl gap-1 border-2"
              >
                <ChevronRight className="h-4 w-4" />
                قبلی
              </Button>
              <Button
                type="button"
                onClick={goNext}
                className={cn(
                  "rounded-xl gap-1 bg-gradient-to-r shadow-lg",
                  current.gradient,
                  "hover:opacity-90"
                )}
              >
                {isLast ? (
                  <>
                    شروع کنید
                    <Rocket className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    بعدی
                    <ChevronLeft className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
