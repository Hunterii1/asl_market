import { useState, useCallback, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  BarChart3,
  BookOpen,
  Target,
  Users,
  UserCheck,
  CreditCard,
  Truck,
  Bot,
  Package,
  Key,
  Headphones,
  Radio,
  Rocket,
  ChevronRight,
  ChevronLeft,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const SITE_ONBOARDING_SEEN_KEY = "asl_market_site_onboarding_seen";

export function hasSeenSiteOnboarding(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SITE_ONBOARDING_SEEN_KEY) === "1";
}

export function markSiteOnboardingSeen(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SITE_ONBOARDING_SEEN_KEY, "1");
}

const STEPS: Array<{
  id: string;
  icon: typeof BarChart3;
  title: string;
  subtitle: string;
  description: string;
  bullets?: string[];
  gradient: string;
}> = [
  {
    id: "welcome",
    icon: Sparkles,
    title: "به ASL Market خوش آمدید",
    subtitle: "پلتفرم تجارت و بازاریابی محصولات ایرانی",
    description: "با چند قدم کوتاه با بخش‌های اصلی سایت آشنا می‌شوید.",
    gradient: "from-orange-500 via-amber-500 to-orange-600",
  },
  {
    id: "dashboard",
    icon: BarChart3,
    title: "داشبورد",
    subtitle: "آمار و پیشرفت شما",
    description: "آمار کلی، پیشرفت استفاده از پلتفرم، نمودار برداشت‌ها و درخواست‌های اخیر.",
    bullets: ["پیشرفت در آموزش، تأمین‌کننده، ویزیتور، AI، محصولات", "درخواست‌های برداشت و آمار مالی"],
    gradient: "from-blue-500 to-indigo-600",
  },
  {
    id: "asllearn",
    icon: BookOpen,
    title: "آموزش (ASL Learn)",
    subtitle: "ویدیوهای آموزشی",
    description: "دسته‌بندی‌های آموزشی، ویدیوها و پخش با ردیابی پیشرفت تماشا.",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    id: "products",
    icon: Target,
    title: "محصولات تحقیقی",
    subtitle: "مطالعه و جستجو",
    description: "لیست محصولات تحقیقی، فیلتر بر اساس دسته و HS Code، جزئیات صادرات و کشورهای مقصد.",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    id: "supplier",
    icon: Users,
    title: "تأمین‌کنندگان (ASL Supplier)",
    subtitle: "ثبت‌نام و معرفی محصول",
    description: "ثبت‌نام به عنوان تأمین‌کننده، معرفی محصولات و مشاهده تأمین‌کنندگان تأیید شده با محدودیت تماس روزانه.",
    gradient: "from-orange-600 to-red-600",
  },
  {
    id: "visitor",
    icon: UserCheck,
    title: "ویزیتورها (ASL Visit)",
    subtitle: "فعالیت در کشورهای عربی",
    description: "ثبت‌نام به عنوان ویزیتور، مشخص کردن کشورها و مهارت‌ها و مشاهده ویزیتورهای تأیید شده.",
    gradient: "from-red-600 to-orange-500",
  },
  {
    id: "available",
    icon: Package,
    title: "کالاهای موجود (ASL Available)",
    subtitle: "خرید و فروش کالا",
    description: "لیست کالاهای موجود، برگزیده‌ها و پیشنهادهای ویژه؛ جزئیات قیمت، موجودی و تماس.",
    gradient: "from-amber-500 to-orange-600",
  },
  {
    id: "ai",
    icon: Bot,
    title: "هوش مصنوعی (ASL AI)",
    subtitle: "چت با AI",
    description: "چت با هوش مصنوعی برای پاسخ به سوالات؛ با محدودیت تعداد پیام روزانه.",
    gradient: "from-cyan-500 to-blue-600",
  },
  {
    id: "pay",
    icon: CreditCard,
    title: "برداشت پول (ASL Pay)",
    subtitle: "درخواست برداشت",
    description: "ثبت درخواست برداشت، آپلود رسید و مشاهده وضعیت و آمار برداشت‌ها.",
    gradient: "from-green-600 to-emerald-600",
  },
  {
    id: "license-support",
    icon: Key,
    title: "لایسنس و پشتیبانی",
    subtitle: "دسترسی و کمک",
    description: "برای بخش‌های اصلی به لایسنس فعال نیاز دارید (Plus، Plus4، Pro). پشتیبانی و تیکت از منو در دسترس است.",
    bullets: ["لایسنس: فعال‌سازی با کد", "پشتیبانی: ثبت تیکت و پیگیری"],
    gradient: "from-slate-600 to-slate-700",
  },
  {
    id: "asl-match",
    icon: Radio,
    title: "ASL Match",
    subtitle: "بخش ویژه اتصال تأمین‌کننده و ویزیتور",
    description: "یک بخش جداگانه برای همسان‌سازی: تأمین‌کننده درخواست می‌سازد، ویزیتور پاسخ می‌دهد و چت و امتیازدهی انجام می‌شود. از منو یا دکمه ASL Match می‌توانید بروید.",
    bullets: ["درخواست Matching و پاسخ ویزیتورها", "چت و امتیازدهی بعد از پذیرش"],
    gradient: "from-orange-500 via-red-500 to-orange-600",
  },
  {
    id: "done",
    icon: Rocket,
    title: "همه چیز آماده است",
    subtitle: "شروع کنید",
    description: "از منوی همین صفحه هر بخش را انتخاب کنید. برای ASL Match از دکمه ASL Match یا منو بروید و در آنجا راهنمای کامل همان بخش را ببینید.",
    gradient: "from-orange-500 via-red-500 to-orange-600",
  },
];

interface SiteOnboardingStoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  markAsSeenOnClose?: boolean;
}

export function SiteOnboardingStory({
  open,
  onOpenChange,
  markAsSeenOnClose = false,
}: SiteOnboardingStoryProps) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const totalSteps = STEPS.length;
  const current = STEPS[step];
  const isFirst = step === 0;
  const isLast = step === totalSteps - 1;
  const Icon = current.icon;

  const goNext = useCallback(() => {
    if (isLast) {
      if (markAsSeenOnClose) markSiteOnboardingSeen();
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
    if (markAsSeenOnClose) markSiteOnboardingSeen();
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

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

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
          <div className="h-1.5 w-full rounded-b-full overflow-hidden bg-muted/50">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500 ease-out rounded-full"
              style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
            />
          </div>

          <div className="flex justify-center gap-1 pt-2 pb-1 overflow-x-auto px-2">
            {STEPS.map((_, i) => {
              const isActive = i === step;
              const isPast = i < step;
              const dotClass = isActive ? "w-4 bg-orange-500" : isPast ? "w-1.5 bg-orange-400/80" : "w-1.5 bg-muted-foreground/30";
              return (
                <button
                  key={i}
                  type="button"
                  aria-label={`برگه ${i + 1}`}
                  onClick={() => {
                    setDirection(i > step ? "next" : "prev");
                    setStep(i);
                  }}
                  className={cn("h-1.5 rounded-full transition-all duration-300 shrink-0", dotClass)}
                />
              );
            })}
          </div>

          <Dialog.Close
            onClick={handleClose}
            className="absolute left-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="بستن"
          >
            <X className="h-5 w-5" />
          </Dialog.Close>

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
                  "mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg",
                  current.gradient
                )}
              >
                <Icon className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-foreground mb-1">
                {current.title}
              </h2>
              <p className="text-xs sm:text-sm text-orange-600 dark:text-orange-400 font-medium mb-2">
                {current.subtitle}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto mb-3">
                {current.description}
              </p>
              {current.bullets && current.bullets.length > 0 && (
                <ul className="text-xs sm:text-sm text-muted-foreground text-right space-y-1.5 w-full max-w-sm mx-auto mb-3">
                  {current.bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-orange-500 shrink-0 mt-0.5">•</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

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
