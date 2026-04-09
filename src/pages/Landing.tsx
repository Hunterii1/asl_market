import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Check,
  Copy,
  CheckCircle2,
  MessageCircle,
  Users,
  Brain,
  Link2,
  ShieldCheck,
  ChevronDown,
  ExternalLink,
  Sparkles,
  Crown,
  LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

type PlanId = "plus" | "pro";

const CARD_NUMBER = "6104338771167877";
const CARD_HOLDER = "علیرضا اصل";
const BALE_LINK = "https://web.bale.ai/@ASLLMARKET";
const BALE_ID = "@ASLLMARKET";
const AVATAR_SRC = "/alireza-asl.png";

const plans = [
  {
    id: "plus" as PlanId,
    name: "پلاس",
    price: 6_000_000,
    originalPrice: 9_000_000,
    period: "یک‌ساله",
    monthlyNote: "حدود ۵۰۰ هزار تومان برای هر ماه",
    badge: "توصیه‌شده",
    badgeBg: "bg-emerald-500",
    recommended: true,
    features: [
      "دسترسی به تمام ابزارهای اصل مارکت (آموزش، تأمین کننده، ویزیتور، مچینگ و …)",
      "شرکت در شبکه مچینگ تأمین‌کننده و ویزیتور",
      "پشتیبانی اولویت‌دار",
      "آپدیت‌های یک‌ساله رایگان",
      "استفاده از امکانات هوش مصنوعی و ابزارهای محصولات تحقیقی",
    ],
  },
  {
    id: "pro" as PlanId,
    name: "پرو",
    price: 10_000_000,
    originalPrice: 12_900_000,
    period: "دائمی",
    monthlyNote: "یک‌بار پرداخت، همیشه دسترسی",
    badge: "دائمی",
    badgeBg: "bg-blue-500",
    recommended: false,
    features: [
      "همه امکانات اشتراک پلاس",
      "دسترسی دائمی به پلتفرم بدون نیاز به تمدید سالانه",
      "آپدیت‌های بدون محدودیت برای امکانات جدید",
      "مشاوره اختصاصی ۱‌به‌۱ برای راه‌اندازی و استفاده حرفه‌ای",
      "اولویت در پشتیبانی و معرفی امکانات ویژه آینده",
    ],
  },
];

const features = [
  {
    icon: <LayoutGrid className="w-5 h-5" />,
    title: "یک پلتفرم، چند ابزار",
    desc: "داشبورد، آموزش، پرداخت، اکسپرس، محصولات تحقیقی و سایر سرویس‌های اصل مارکت در یک اکوسیستم",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
  },
  {
    icon: <Brain className="w-5 h-5" />,
    title: "هوش مصنوعی و اتوماسیون",
    desc: "دستیار هوشمند و ابزارهای کمکی برای سرعت بخشیدن به کار روزمره در پلتفرم",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  {
    icon: <Link2 className="w-5 h-5" />,
    title: "مچینگ تأمین‌کننده و ویزیتور",
    desc: "امکان معرفی و ارتباط هدفمند بین تأمین‌کننده و ویزیتور؛ نه صرفاً لیست تماس",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  {
    icon: <ShieldCheck className="w-5 h-5" />,
    title: "پشتیبانی و امنیت",
    desc: "تیم پشتیبانی برای راهنمایی در مسیر استفاده و حفظ امنیت حساب کاربری شما",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
  },
];

const faqs = [
  {
    q: "اشتراک پلاس چه امکاناتی دارد؟",
    a: "با اشتراک پلاس به ابزارهای اصلی پلتفرم (آموزش، تأمین کننده، ویزیتور، مچینگ، هوش مصنوعی، محصولات تحقیقی و …) دسترسی دارید و می‌توانید در شبکه مچینگ تأمین‌کننده و ویزیتور فعال شوید. این اشتراک برای یک سال فعال است.",
  },
  {
    q: "تفاوت اشتراک پرو با پلاس چیست؟",
    a: "اشتراک پرو علاوه بر تمام امکانات پلاس، دسترسی دائمی و مادام‌العمر، مشاوره اختصاصی ۱‌به‌۱ و اولویت در تمام خدمات جدید را شامل می‌شود. یک‌بار پرداخت و همیشه دسترسی.",
  },
  {
    q: "پس از خرید چطور اشتراک فعال می‌شود؟",
    a: "بعد از پرداخت، رسید را از طریق بله به آی‌دی ASLLMARKET ارسال کنید. اشتراک شما حداکثر ظرف ۲۴ ساعت فعال خواهد شد.",
  },
  {
    q: "آیا امکان تمدید اشتراک وجود دارد؟",
    a: "بله، قبل از اتمام اشتراک پلاس می‌توانید تمدید کنید. همچنین در صورت ارتقا به پرو، دیگر نیازی به تمدید نخواهید داشت.",
  },
];

function formatPrice(price: number) {
  return price.toLocaleString("fa-IR");
}

function formatCardNumber(num: string) {
  return num.match(/.{1,4}/g)?.join("  ") ?? num;
}

export default function Landing() {
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("plus");
  const [showPayment, setShowPayment] = useState(false);
  const [copied, setCopied] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const currentPlan = plans.find((p) => p.id === selectedPlan)!;

  const handleCopy = () => {
    navigator.clipboard.writeText(CARD_NUMBER);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      {/* Ambient background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-orange-500/6 blur-3xl animate-blob" />
        <div
          className="absolute top-1/2 -left-48 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-3xl animate-blob animation-delay-2000"
        />
        <div
          className="absolute bottom-0 right-1/2 w-[300px] h-[300px] rounded-full bg-orange-500/4 blur-3xl animate-blob animation-delay-4000"
        />
      </div>

      <div className="relative max-w-lg mx-auto px-4 pb-36 pt-10">
        {/* ─── Profile Hero ─── */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="relative inline-block mb-4">
            <div className="relative h-24 w-24 overflow-hidden rounded-full ring-4 ring-orange-500/20 shadow-2xl shadow-orange-500/30">
              <img
                src={AVATAR_SRC}
                alt="علیرضا اصل"
                className="h-full w-full object-cover object-[center_18%]"
                loading="eager"
                decoding="async"
              />
            </div>
            <div className="absolute -bottom-1 -left-1 w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg ring-2 ring-background">
              <span className="text-white text-[10px] font-bold">A</span>
            </div>
          </div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">
            علیرضا اصل
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            بنیان‌گذار و مدیر اصل مارکت
          </p>
        </div>

        {/* ─── Page Heading ─── */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground leading-snug mb-2">
            خرید اشتراک{" "}
            <span className="gradient-text">اصل مارکت</span>
          </h1>
          <p className="text-muted-foreground text-sm flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4 text-orange-500 flex-shrink-0" />
            اکوسیستم تجارت B2B؛ تأمین‌کننده، ویزیتور و مچینگ هوشمند
          </p>
        </div>

        {/* ─── Plan Cards ─── */}
        <div className="space-y-3 mb-3">
          {plans.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            return (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={cn(
                  "w-full text-right rounded-2xl border-2 p-4 transition-all duration-200 group",
                  isSelected
                    ? "border-orange-500 bg-orange-500/5 shadow-lg shadow-orange-500/10"
                    : "border-border bg-card hover:border-orange-500/40 hover:shadow-md"
                )}
              >
                {/* ردیف جدا برای بج — بدون هم‌پوشانی با قیمت */}
                <div className="mb-3 flex justify-end">
                  <span
                    className={cn(
                      "text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full",
                      plan.badgeBg
                    )}
                  >
                    {plan.badge}
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  {/* Radio dot */}
                  <div
                    className={cn(
                      "mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200",
                      isSelected
                        ? "border-orange-500 bg-orange-500"
                        : "border-muted-foreground/40 group-hover:border-orange-400/60"
                    )}
                  >
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 text-right">
                    <div className="mb-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="font-bold text-foreground text-[15px]">
                        اشتراک {plan.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({plan.period})
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {plan.monthlyNote}
                    </p>
                  </div>

                  {/* Price — ستون جدا از بج */}
                  <div className="flex flex-shrink-0 flex-col items-end gap-0.5 text-left">
                    <p className="font-bold text-foreground text-[15px] whitespace-nowrap">
                      {formatPrice(plan.price)}{" "}
                      <span className="text-[13px] font-semibold">تومان</span>
                    </p>
                    {plan.originalPrice != null && (
                      <p className="whitespace-nowrap text-xs text-red-400 line-through">
                        {formatPrice(plan.originalPrice)} تومان
                      </p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Terms */}
        <p className="text-[11px] text-muted-foreground text-center mb-7">
          خرید اشتراک به معنای آگاهی و پذیرش{" "}
          <Link
            to="/privacy"
            className="text-orange-500 underline underline-offset-2 hover:text-orange-400"
          >
            سیاست حفظ حریم خصوصی و امنیت
          </Link>{" "}
          و قوانین استفاده از خدمات است.
        </p>

        {/* ─── Social Proof ─── */}
        <div className="flex items-center justify-center gap-2.5 bg-secondary/60 backdrop-blur-sm rounded-2xl px-5 py-3.5 mb-10 border border-border/50">
          <Users className="w-5 h-5 text-orange-500 flex-shrink-0" />
          <p className="text-foreground text-sm">
            همراه{" "}
            <span className="text-orange-500 font-bold text-base">
              {formatPrice(33_187)} کاربر
            </span>{" "}
            در اصل مارکت
          </p>
        </div>

        {/* ─── Why ASL Market ─── */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-center mb-6">
            چرا{" "}
            <span className="gradient-text">اصل مارکت</span>؟
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {features.map((f, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-start gap-3 bg-card rounded-2xl p-4 border transition-all duration-200 hover:shadow-md",
                  f.border
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                    f.bg,
                    f.color
                  )}
                >
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm mb-1">
                    {f.title}
                  </h3>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Selected Plan Features ─── */}
        <section className="mb-10 bg-card rounded-2xl border border-border/50 overflow-hidden">
          <div className="px-5 py-4 border-b border-border/50 flex items-center gap-2">
            <Crown className="w-4 h-4 text-orange-500" />
            <h3 className="font-bold text-foreground text-sm">
              امکانات اشتراک {currentPlan.name}
            </h3>
          </div>
          <div className="px-5 py-4 space-y-3">
            {currentPlan.features.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <span className="text-sm text-foreground">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-center mb-6">
            سؤالات متداول
          </h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-card rounded-2xl border border-border/50 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-4 text-right hover:bg-secondary/30 transition-colors"
                >
                  <span className="font-medium text-sm text-foreground leading-relaxed">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform duration-200",
                      openFaq === i && "rotate-180"
                    )}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ─── Consultation CTA ─── */}
        <a
          href={BALE_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-secondary hover:bg-secondary/80 text-foreground font-medium rounded-2xl py-3.5 px-4 transition-all duration-200 border border-border/50 hover:border-orange-500/30 hover:shadow-md"
        >
          <MessageCircle className="w-4 h-4 text-orange-500" />
          درخواست مشاوره خرید
          <ExternalLink className="w-3 h-3 text-muted-foreground mr-auto" />
        </a>
      </div>

      {/* ─── Sticky Bottom Bar ─── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-t border-border/60">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-4 px-4 py-3">
          <div>
            <p className="text-[11px] text-muted-foreground mb-0.5">
              مبلغ قابل پرداخت
            </p>
            <p className="font-bold text-foreground text-lg leading-none">
              {formatPrice(currentPlan.price)}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                تومان
              </span>
            </p>
            {currentPlan.originalPrice && (
              <p className="text-red-400 line-through text-[11px]">
                {formatPrice(currentPlan.originalPrice)} تومان
              </p>
            )}
          </div>
          <Button
            onClick={() => setShowPayment(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-3 rounded-xl shadow-lg shadow-orange-500/20 text-[15px] h-auto transition-all duration-200 hover:shadow-orange-500/30 hover:-translate-y-0.5 active:translate-y-0"
          >
            خرید اشتراک
          </Button>
        </div>
      </div>

      {/* ─── Payment Dialog ─── */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent
          className="max-w-sm w-[calc(100%-2rem)] mx-auto rounded-2xl p-0 overflow-hidden"
          dir="rtl"
        >
          {/* Header gradient */}
          <div className="bg-gradient-to-l from-orange-500/20 to-orange-600/10 px-5 pt-6 pb-4 border-b border-border/50">
            <DialogHeader>
              <DialogTitle className="text-center text-lg font-bold text-foreground">
                اطلاعات پرداخت
              </DialogTitle>
            </DialogHeader>
            {/* Plan summary */}
            <div className="mt-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">
                اشتراک {currentPlan.name} — {currentPlan.period}
              </p>
              <p className="text-2xl font-extrabold text-orange-500">
                {formatPrice(currentPlan.price)}{" "}
                <span className="text-base font-bold">تومان</span>
              </p>
              {currentPlan.originalPrice && (
                <p className="text-red-400 line-through text-xs mt-0.5">
                  {formatPrice(currentPlan.originalPrice)} تومان
                </p>
              )}
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Card number */}
            <div className="overflow-hidden rounded-xl border border-border bg-secondary/30">
              <p className="px-3 pt-3 pb-2 text-center text-[11px] text-muted-foreground">
                مبلغ را به شماره کارت زیر واریز کنید
              </p>
              <div className="mx-3 mb-3 rounded-xl border border-border bg-background px-3 pb-3 pt-2">
                <div className="mb-3 flex justify-start">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-all duration-200",
                      copied
                        ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
                        : "border-border bg-secondary/80 text-foreground hover:border-orange-500/40 hover:bg-secondary"
                    )}
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        کپی شد
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        کپی
                      </>
                    )}
                  </button>
                </div>
                <p
                  dir="ltr"
                  className="selectable font-mono text-[13px] font-bold leading-none tracking-[0.14em] text-foreground sm:text-[15px] whitespace-nowrap overflow-x-auto text-center [scrollbar-width:thin]"
                >
                  {formatCardNumber(CARD_NUMBER)}
                </p>
                <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/50 pt-3">
                  <span className="text-xs text-muted-foreground">
                    به نام:{" "}
                    <span className="font-semibold text-foreground">
                      {CARD_HOLDER}
                    </span>
                  </span>
                  <span className="text-[10px] text-muted-foreground/60">
                    بانک ملت
                  </span>
                </div>
              </div>
            </div>

            {/* Bale contact */}
            <div className="rounded-xl border border-border bg-secondary/30 p-4">
              <p className="text-xs text-muted-foreground text-center mb-3">
                پس از واریز، رسید را در بله ارسال کنید
              </p>
              <a
                href={BALE_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/25 hover:border-orange-500/40 rounded-xl py-3 px-4 transition-all duration-200 w-full group"
              >
                <MessageCircle className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-semibold text-foreground">
                  {BALE_ID}
                </span>
                <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-orange-400 transition-colors mr-auto" />
              </a>
            </div>

            <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
              اشتراک پس از تأیید واریز، حداکثر ظرف ۲۴ ساعت فعال می‌شود.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
