import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  UserCheck,
  Package,
  MessageCircle,
  Star,
  Bell,
  CheckCircle,
  XCircle,
  HelpCircle,
} from "lucide-react";

interface AslMatchHelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AslMatchHelpDialog({ open, onOpenChange }: AslMatchHelpDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0 border-2 border-orange-200 dark:border-orange-800 bg-gradient-to-b from-background to-orange-50/30 dark:to-orange-950/20">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-xl sm:text-2xl text-orange-700 dark:text-orange-400">
            <BookOpen className="w-6 h-6" />
            راهنمای کامل ASL Match
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            آموزش استفاده از سیستم همسان‌سازی تأمین‌کنندگان و ویزیتورها
          </p>
        </DialogHeader>
        <ScrollArea className="flex-1 px-6 py-4 max-h-[calc(90vh-8rem)]">
          <div className="space-y-6 pr-2 text-right" dir="rtl">
            {/* مقدمه */}
            <section>
              <h2 className="flex items-center gap-2 text-lg font-bold text-foreground mb-2">
                <HelpCircle className="w-5 h-5 text-orange-500" />
                مقدمه
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                سیستم Matching به شما کمک می‌کند تا به راحتی با تأمین‌کنندگان یا ویزیتورها ارتباط برقرار کنید و معاملات خود را انجام دهید. این راهنما برای دو گروه است: <strong>تأمین‌کنندگان</strong> (کسانی که محصول دارند و می‌خواهند بفروشند) و <strong>ویزیتورها</strong> (کسانی که می‌خواهند محصولات را در کشورهای عربی بفروشند).
              </p>
            </section>

            {/* پیش‌نیازها */}
            <section>
              <h2 className="text-lg font-bold text-foreground mb-2">شروع کار و پیش‌نیازها</h2>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>حساب کاربری و ثبت‌نام در سیستم</li>
                <li>لایسنس فعال (در صورت نیاز به بخش‌های خاص)</li>
                <li>تأیید هویت: تأمین‌کنندگان و ویزیتورها باید تأیید شده باشند</li>
                <li>فعال‌سازی Push Notifications (اختیاری اما توصیه می‌شود) برای دریافت نوتیفیکیشن فوری</li>
              </ul>
            </section>

            {/* تأمین‌کنندگان */}
            <section>
              <h2 className="flex items-center gap-2 text-lg font-bold text-foreground mb-3">
                <Package className="w-5 h-5 text-orange-500" />
                برای تأمین‌کنندگان
              </h2>
              <h3 className="text-base font-semibold text-foreground mb-2">ایجاد درخواست Matching</h3>
              <p className="text-sm text-muted-foreground mb-2">از منو «ایجاد درخواست» را بزنید و فرم را پر کنید:</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground mb-3">
                <li><strong>نام محصول، مقدار، واحد</strong> — کشورهای مقصد، قیمت و ارز</li>
                <li><strong>شرایط پرداخت و زمان تحویل</strong> — زمان انقضای درخواست (۷، ۱۴ یا ۳۰ روز)</li>
              </ul>
              <p className="text-sm text-muted-foreground mb-2">بعد از ارسال، سیستم ویزیتورهای مناسب را پیدا می‌کند و به آن‌ها نوتیفیکیشن می‌فرستد.</p>
              <h3 className="text-base font-semibold text-foreground mb-2">وضعیت‌های درخواست</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>🟡 در انتظار — 🔵 فعال — 🟢 پذیرفته شده — ⚫ منقضی شده — 🔴 لغو شده</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-2">می‌توانید درخواست را <strong>تمدید، ویرایش یا لغو</strong> کنید. بعد از پذیرش توسط ویزیتور، چت با او از صفحه جزئیات درخواست فعال می‌شود.</p>
            </section>

            {/* ویزیتورها */}
            <section>
              <h2 className="flex items-center gap-2 text-lg font-bold text-foreground mb-3">
                <UserCheck className="w-5 h-5 text-orange-500" />
                برای ویزیتورها
              </h2>
              <p className="text-sm text-muted-foreground mb-2">از منو «درخواست‌های موجود» را بزنید. درخواست‌ها بر اساس کشورهای مقصد، محصولات مورد علاقه و مهارت‌های شما فیلتر می‌شوند.</p>
              <h3 className="text-base font-semibold text-foreground mb-2">پاسخ به درخواست</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li><strong>✅ پذیرش:</strong> درخواست برای شما رزرو می‌شود و چت با تأمین‌کننده فعال می‌شود.</li>
                <li><strong>❌ رد:</strong> درخواست به ویزیتورهای دیگر ارسال می‌شود.</li>
                <li><strong>❓ سوال:</strong> سوال خود را بفرستید؛ تأمین‌کننده می‌تواند پاسخ دهد.</li>
              </ul>
            </section>

            {/* چت */}
            <section>
              <h2 className="flex items-center gap-2 text-lg font-bold text-foreground mb-2">
                <MessageCircle className="w-5 h-5 text-orange-500" />
                چت و ارتباط
              </h2>
              <p className="text-sm text-muted-foreground mb-2">چت فقط برای درخواست‌های <strong>پذیرفته شده</strong> فعال است. از منو «مکالمات» می‌توانید همه مکالمات را ببینید. پیام فوری، زمان ارسال، نشان خوانده شده (✓✓) و به‌روزرسانی تقریباً Real-time پشتیبانی می‌شود.</p>
            </section>

            {/* امتیازدهی */}
            <section>
              <h2 className="flex items-center gap-2 text-lg font-bold text-foreground mb-2">
                <Star className="w-5 h-5 text-orange-500" />
                امتیازدهی
              </h2>
              <p className="text-sm text-muted-foreground">بعد از تکمیل معامله، در صفحه جزئیات درخواست بخش «امتیازدهی» را پیدا کنید، امتیاز (۱ تا ۵ ستاره) و در صورت تمایل نظر بگذارید. فقط یک بار امتیاز قابل ثبت است و در پروفایل طرف مقابل نمایش داده می‌شود.</p>
            </section>

            {/* نوتیفیکیشن */}
            <section>
              <h2 className="flex items-center gap-2 text-lg font-bold text-foreground mb-2">
                <Bell className="w-5 h-5 text-orange-500" />
                نوتیفیکیشن‌ها
              </h2>
              <p className="text-sm text-muted-foreground mb-2">انواع: Push (فوری روی دستگاه)، In-App (داخل برنامه)، و در صورت تنظیم، SMS برای ویزیتورهای تأیید شده. برای تأمین‌کنندگان: پذیرش درخواست، پیام جدید، امتیاز جدید. برای ویزیتورها: درخواست جدید مناسب، پاسخ به سوال، پیام جدید، امتیاز جدید.</p>
            </section>

            {/* نکات مهم */}
            <section>
              <h2 className="text-lg font-bold text-foreground mb-2">نکات مهم</h2>
              <div className="space-y-2 text-sm">
                <p className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">اطلاعات کامل و دقیق، قیمت منصفانه، پاسخ به سوالات و چت فعال.</span>
                </p>
                <p className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">از اطلاعات ناقص، قیمت غیرمنصفانه و نادیده گرفتن پیام‌ها پرهیز کنید.</span>
                </p>
              </div>
            </section>

            {/* سوالات متداول */}
            <section>
              <h2 className="text-lg font-bold text-foreground mb-2">سوالات متداول</h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><strong>چرا درخواست پذیرفته نشد؟</strong> ممکن است ویزیتور مناسب پیدا نشده یا زمان انقضا گذشته باشد؛ می‌توانید زمان را تمدید کنید.</li>
                <li><strong>چت کار نمی‌کند؟</strong> چت فقط برای درخواست‌های «پذیرفته شده» فعال است.</li>
                <li><strong>چند درخواست همزمان؟</strong> بله، هر درخواست مستقل است.</li>
              </ul>
            </section>

            <p className="text-xs text-muted-foreground pt-4 border-t border-border">
              آخرین به‌روزرسانی: ۱۴۰۴ — موفق باشید! 🚀
            </p>
          </div>
        </ScrollArea>
        <div className="px-6 py-4 border-t border-border flex justify-end">
          <Button onClick={() => onOpenChange(false)} variant="default" className="bg-orange-600 hover:bg-orange-700">
            فهمیدم
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
