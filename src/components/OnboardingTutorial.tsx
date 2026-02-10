import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Users,
  MessageCircle,
  Star,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  User,
  Building,
  Globe,
  Heart,
} from "lucide-react";

interface TutorialStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

interface OnboardingTutorialProps {
  section: "welcome" | "match" | "supplier" | "visitor" | "profile" | "chat";
}

const TUTORIAL_STEPS = {
  welcome: [
    {
      title: "به ASL Market خوش آمدید! 🎉",
      description: "پلتفرم جامع اتصال تأمین‌کنندگان و ویزیتورها برای تجارت محصولات ایرانی",
      icon: <Sparkles className="w-12 h-12" />,
      color: "from-orange-500 to-red-500",
    },
    {
      title: "سیستم مچینگ دوطرفه 🤝",
      description: "تأمین‌کنندگان درخواست می‌دهند، ویزیتورها پیشنهاد می‌دهند و بالعکس!",
      icon: <TrendingUp className="w-12 h-12" />,
      color: "from-blue-500 to-purple-500",
    },
    {
      title: "چت و ارتباط مستقیم 💬",
      description: "بعد از مچینگ، مستقیماً با یکدیگر چت کنید و جزئیات را هماهنگ کنید",
      icon: <MessageCircle className="w-12 h-12" />,
      color: "from-green-500 to-emerald-500",
    },
    {
      title: "پروفایل حرفه‌ای 👤",
      description: "پروفایل خود را با عکس و بیوگرافی کامل کنید، دیگران شما را بهتر بشناسند",
      icon: <User className="w-12 h-12" />,
      color: "from-purple-500 to-pink-500",
    },
    {
      title: "امتیازدهی و اعتماد ⭐",
      description: "به یکدیگر امتیاز دهید و اعتماد بسازید، امتیاز بالا = فرصت‌های بیشتر",
      icon: <Star className="w-12 h-12" />,
      color: "from-yellow-500 to-orange-500",
    },
  ],
  match: [
    {
      title: "ASL Match چیست؟",
      description: "سیستم مچینگ هوشمند برای اتصال تأمین‌کنندگان و خریداران",
      icon: <TrendingUp className="w-12 h-12" />,
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "دو نوع مچینگ 🔄",
      description: "۱) درخواست‌های تأمین‌کننده (نیاز به خریدار)\n۲) پروژه‌های ویزیتوری (نیاز به محصول)",
      icon: <Package className="w-12 h-12" />,
      color: "from-purple-500 to-pink-500",
    },
    {
      title: "چطور کار می‌کند؟",
      description: "۱. ثبت درخواست/پروژه\n۲. دریافت پیشنهادها\n۳. انتخاب بهترین پیشنهاد\n۴. چت و هماهنگی\n۵. امتیازدهی",
      icon: <CheckCircle className="w-12 h-12" />,
      color: "from-green-500 to-emerald-500",
    },
    {
      title: "مختوم کردن معامله ✅",
      description: "بعد از اتمام کار، درخواست یا پروژه را مختوم کنید تا در لیست فعال نباشد",
      icon: <Heart className="w-12 h-12" />,
      color: "from-red-500 to-pink-500",
    },
  ],
  supplier: [
    {
      title: "تأمین‌کنندگان برتر 🏆",
      description: "لیست تأمین‌کنندگان تأیید شده با محصولات باکیفیت ایرانی",
      icon: <Building className="w-12 h-12" />,
      color: "from-orange-500 to-amber-500",
    },
    {
      title: "فیلترهای هوشمند 🔍",
      description: "جستجو بر اساس محصول، شهر، تگ‌های ویژه (دسته اول، خوش قیمت، سابقه صادرات)",
      icon: <Package className="w-12 h-12" />,
      color: "from-blue-500 to-indigo-500",
    },
    {
      title: "مشاهده پروفایل 👤",
      description: "روی نام تأمین‌کننده کلیک کنید تا پروفایل کامل، محصولات و امتیاز را ببینید",
      icon: <User className="w-12 h-12" />,
      color: "from-purple-500 to-violet-500",
    },
    {
      title: "اطلاعات تماس 📞",
      description: "با لایسنس فعال می‌توانید شماره تماس، ایمیل و آدرس را ببینید",
      icon: <MessageCircle className="w-12 h-12" />,
      color: "from-green-500 to-teal-500",
    },
  ],
  visitor: [
    {
      title: "ویزیتورهای حرفه‌ای 🌍",
      description: "لیست ویزیتورهای تأیید شده با تجربه بازاریابی بین‌المللی",
      icon: <Globe className="w-12 h-12" />,
      color: "from-purple-500 to-fuchsia-500",
    },
    {
      title: "جستجو و فیلتر 🔎",
      description: "پیدا کردن ویزیتور مناسب بر اساس شهر، کشور مقصد، و تخصص",
      icon: <Users className="w-12 h-12" />,
      color: "from-blue-500 to-sky-500",
    },
    {
      title: "مشاهده پروفایل کامل 📋",
      description: "روی نام کلیک کنید: سابقه کاری، پروژه‌ها، امتیاز و اطلاعات تماس",
      icon: <User className="w-12 h-12" />,
      color: "from-indigo-500 to-purple-500",
    },
    {
      title: "همکاری مستقیم 🤝",
      description: "با لایسنس می‌توانید مستقیماً با ویزیتورها ارتباط برقرار کنید",
      icon: <Heart className="w-12 h-12" />,
      color: "from-pink-500 to-rose-500",
    },
  ],
  profile: [
    {
      title: "پروفایل عمومی شما 🎭",
      description: "مثل فیسبوک! عکس پروفایل، عکس پس‌زمینه، بیوگرافی و اطلاعات شما",
      icon: <User className="w-12 h-12" />,
      color: "from-purple-500 to-pink-500",
    },
    {
      title: "آپلود عکس‌ها 📸",
      description: "روی آیکون دوربین کلیک کنید و عکس پروفایل و پس‌زمینه خود را آپلود کنید",
      icon: <Sparkles className="w-12 h-12" />,
      color: "from-orange-500 to-red-500",
    },
    {
      title: "نمایش فعالیت‌ها 📊",
      description: "محصولات، درخواست‌ها، پروژه‌ها، چت‌ها و امتیاز شما به نمایش گذاشته می‌شود",
      icon: <TrendingUp className="w-12 h-12" />,
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "لینک به پروفایل 🔗",
      description: "از همه‌جا می‌توانید پروفایل دیگران را ببینید، فقط روی اسم کلیک کنید",
      icon: <MessageCircle className="w-12 h-12" />,
      color: "from-green-500 to-emerald-500",
    },
  ],
  chat: [
    {
      title: "سیستم چت پیشرفته 💬",
      description: "بعد از مچینگ، با طرف مقابل چت کنید و جزئیات را هماهنگ کنید",
      icon: <MessageCircle className="w-12 h-12" />,
      color: "from-blue-500 to-purple-500",
    },
    {
      title: "ارسال پیام و عکس 📤",
      description: "متن بنویسید، عکس محصول بفرستید، همه چیز در یک مکان",
      icon: <Package className="w-12 h-12" />,
      color: "from-green-500 to-teal-500",
    },
    {
      title: "به‌روزرسانی خودکار ⚡",
      description: "پیام‌های جدید هر 5 ثانیه به‌روز می‌شوند، نیازی به رفرش نیست",
      icon: <Sparkles className="w-12 h-12" />,
      color: "from-yellow-500 to-orange-500",
    },
    {
      title: "مدیریت چت‌ها 📋",
      description: "همه چت‌های شما در یک لیست، مرتب شده بر اساس آخرین پیام",
      icon: <CheckCircle className="w-12 h-12" />,
      color: "from-indigo-500 to-purple-500",
    },
  ],
};

export function OnboardingTutorial({ section }: OnboardingTutorialProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const steps = TUTORIAL_STEPS[section];

  useEffect(() => {
    // Check if user has seen this tutorial before
    const hasSeenKey = `tutorial_seen_${section}`;
    const hasSeen = localStorage.getItem(hasSeenKey);

    if (!hasSeen) {
      // Show tutorial after a short delay
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [section]);

  const handleClose = () => {
    setIsOpen(false);
    // Mark as seen
    localStorage.setItem(`tutorial_seen_${section}`, "true");
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border-slate-700">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="text-2xl font-bold text-foreground">راهنمای استفاده</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="py-8">
          {/* Progress Indicator */}
          <div className="flex justify-center gap-2 mb-8">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep
                    ? "w-8 bg-gradient-to-r from-orange-500 to-purple-500"
                    : index < currentStep
                    ? "w-2 bg-green-500"
                    : "w-2 bg-slate-700"
                }`}
              />
            ))}
          </div>

          {/* Step Content */}
          <div className="text-center space-y-6">
            {/* Icon */}
            <div className="flex justify-center">
              <div
                className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${currentStepData.color} p-6 shadow-2xl`}
              >
                <div className="text-white">{currentStepData.icon}</div>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-3xl font-bold text-foreground">
              {currentStepData.title}
            </h2>

            {/* Description */}
            <p className="text-lg text-muted-foreground whitespace-pre-line max-w-xl mx-auto leading-relaxed">
              {currentStepData.description}
            </p>

            {/* Step Badge */}
            <Badge variant="outline" className="text-sm">
              مرحله {currentStep + 1} از {steps.length}
            </Badge>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-700">
          <Button
            variant="ghost"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="rounded-2xl"
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            قبلی
          </Button>

          <Button
            variant="ghost"
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground"
          >
            رد کردن
          </Button>

          <Button
            onClick={handleNext}
            className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 rounded-2xl"
          >
            {currentStep === steps.length - 1 ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                شروع کنید!
              </>
            ) : (
              <>
                بعدی
                <ArrowLeft className="w-4 h-4 mr-2" />
              </>
            )}
          </Button>
        </div>

        {/* Reset Tutorial Link */}
        <div className="text-center pt-4">
          <button
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            بازنشانی همه راهنماها
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to reset tutorial for specific section
export function useResetTutorial() {
  return (section: string) => {
    localStorage.removeItem(`tutorial_seen_${section}`);
  };
}
