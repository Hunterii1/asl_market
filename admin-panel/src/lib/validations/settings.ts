import { z } from "zod";

// Schema برای تنظیمات عمومی
export const generalSettingsSchema = z.object({
  siteName: z
    .string()
    .min(2, "نام سایت باید حداقل ۲ کاراکتر باشد")
    .max(200, "نام سایت نمی‌تواند بیشتر از ۲۰۰ کاراکتر باشد"),
  
  siteDescription: z
    .string()
    .max(500, "توضیحات نمی‌تواند بیشتر از ۵۰۰ کاراکتر باشد")
    .optional(),
  
  siteUrl: z
    .string()
    .url("آدرس سایت نامعتبر است")
    .optional()
    .or(z.literal('')),
  
  siteLogo: z
    .string()
    .url("آدرس لوگو نامعتبر است")
    .optional()
    .or(z.literal('')),
  
  siteFavicon: z
    .string()
    .url("آدرس Favicon نامعتبر است")
    .optional()
    .or(z.literal('')),
  
  contactEmail: z
    .string()
    .email("ایمیل نامعتبر است")
    .optional()
    .or(z.literal('')),
  
  contactPhone: z
    .string()
    .max(50, "شماره تلفن نمی‌تواند بیشتر از ۵۰ کاراکتر باشد")
    .optional(),
  
  timezone: z
    .string()
    .optional()
    .default('Asia/Tehran'),
  
  language: z
    .string()
    .optional()
    .default('fa'),
  
  currency: z
    .string()
    .optional()
    .default('IRR'),
  
  currencySymbol: z
    .string()
    .optional()
    .default('تومان'),
});

export type GeneralSettingsFormData = z.infer<typeof generalSettingsSchema>;

// Schema برای تنظیمات ایمیل
export const emailSettingsSchema = z.object({
  smtpHost: z
    .string()
    .min(1, "آدرس SMTP الزامی است")
    .max(200, "آدرس SMTP نمی‌تواند بیشتر از ۲۰۰ کاراکتر باشد"),
  
  smtpPort: z
    .number()
    .int("پورت باید عدد صحیح باشد")
    .min(1, "پورت باید بیشتر از ۰ باشد")
    .max(65535, "پورت نمی‌تواند بیشتر از ۶۵۵۳۵ باشد"),
  
  smtpUsername: z
    .string()
    .min(1, "نام کاربری SMTP الزامی است")
    .max(200, "نام کاربری نمی‌تواند بیشتر از ۲۰۰ کاراکتر باشد"),
  
  smtpPassword: z
    .string()
    .min(1, "رمز عبور SMTP الزامی است")
    .max(500, "رمز عبور نمی‌تواند بیشتر از ۵۰۰ کاراکتر باشد"),
  
  smtpEncryption: z.enum(["none", "ssl", "tls"], {
    required_error: "نوع رمزنگاری را انتخاب کنید",
  }).default("tls"),
  
  fromEmail: z
    .string()
    .email("ایمیل فرستنده نامعتبر است")
    .optional(),
  
  fromName: z
    .string()
    .max(200, "نام فرستنده نمی‌تواند بیشتر از ۲۰۰ کاراکتر باشد")
    .optional(),
  
  enabled: z.boolean().default(true),
});

export type EmailSettingsFormData = z.infer<typeof emailSettingsSchema>;

// Schema برای تنظیمات پیامک
export const smsSettingsSchema = z.object({
  provider: z.enum(["kavenegar", "melipayamak", "smsir", "custom"], {
    required_error: "ارائه‌دهنده را انتخاب کنید",
  }).default("kavenegar"),
  
  apiKey: z
    .string()
    .min(1, "کلید API الزامی است")
    .max(500, "کلید API نمی‌تواند بیشتر از ۵۰۰ کاراکتر باشد"),
  
  senderNumber: z
    .string()
    .max(50, "شماره فرستنده نمی‌تواند بیشتر از ۵۰ کاراکتر باشد")
    .optional(),
  
  templateId: z
    .string()
    .max(100, "شناسه قالب نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد")
    .optional(),
  
  enabled: z.boolean().default(true),
});

export type SmsSettingsFormData = z.infer<typeof smsSettingsSchema>;

// Schema برای تنظیمات تلگرام
export const telegramSettingsSchema = z.object({
  botToken: z
    .string()
    .min(1, "توکن ربات الزامی است")
    .max(500, "توکن ربات نمی‌تواند بیشتر از ۵۰۰ کاراکتر باشد"),
  
  chatId: z
    .string()
    .max(100, "شناسه چت نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد")
    .optional(),
  
  enabled: z.boolean().default(true),
});

export type TelegramSettingsFormData = z.infer<typeof telegramSettingsSchema>;

// Schema برای تنظیمات پرداخت
export const paymentSettingsSchema = z.object({
  gateway: z.enum(["zarinpal", "idpay", "saman", "custom"], {
    required_error: "درگاه پرداخت را انتخاب کنید",
  }).default("zarinpal"),
  
  merchantId: z
    .string()
    .min(1, "شناسه مرchant الزامی است")
    .max(200, "شناسه مرchant نمی‌تواند بیشتر از ۲۰۰ کاراکتر باشد"),
  
  apiKey: z
    .string()
    .min(1, "کلید API الزامی است")
    .max(500, "کلید API نمی‌تواند بیشتر از ۵۰۰ کاراکتر باشد"),
  
  sandbox: z.boolean().default(false),
  
  enabled: z.boolean().default(true),
});

export type PaymentSettingsFormData = z.infer<typeof paymentSettingsSchema>;

// Schema برای تنظیمات امنیتی
export const securitySettingsSchema = z.object({
  twoFactorEnabled: z.boolean().default(false),
  
  sessionTimeout: z
    .number()
    .int("زمان انقضای session باید عدد صحیح باشد")
    .min(5, "زمان انقضا باید حداقل ۵ دقیقه باشد")
    .max(1440, "زمان انقضا نمی‌تواند بیشتر از ۱۴۴۰ دقیقه باشد")
    .default(60),
  
  maxLoginAttempts: z
    .number()
    .int("تعداد تلاش باید عدد صحیح باشد")
    .min(3, "تعداد تلاش باید حداقل ۳ باشد")
    .max(10, "تعداد تلاش نمی‌تواند بیشتر از ۱۰ باشد")
    .default(5),
  
  lockoutDuration: z
    .number()
    .int("مدت زمان قفل باید عدد صحیح باشد")
    .min(5, "مدت زمان قفل باید حداقل ۵ دقیقه باشد")
    .max(60, "مدت زمان قفل نمی‌تواند بیشتر از ۶۰ دقیقه باشد")
    .default(15),
  
  passwordMinLength: z
    .number()
    .int("حداقل طول رمز عبور باید عدد صحیح باشد")
    .min(6, "حداقل طول رمز عبور باید ۶ باشد")
    .max(50, "حداقل طول رمز عبور نمی‌تواند بیشتر از ۵۰ باشد")
    .default(8),
  
  requireStrongPassword: z.boolean().default(true),
  
  ipWhitelist: z
    .array(z.string())
    .optional()
    .default([]),
});

export type SecuritySettingsFormData = z.infer<typeof securitySettingsSchema>;

// Schema برای تنظیمات نمایش
export const displaySettingsSchema = z.object({
  theme: z.enum(["light", "dark", "auto"], {
    required_error: "تم را انتخاب کنید",
  }).default("auto"),
  
  itemsPerPage: z
    .number()
    .int("تعداد آیتم باید عدد صحیح باشد")
    .min(5, "تعداد آیتم باید حداقل ۵ باشد")
    .max(200, "تعداد آیتم نمی‌تواند بیشتر از ۲۰۰ باشد")
    .default(20),
  
  dateFormat: z
    .string()
    .optional()
    .default('YYYY/MM/DD'),
  
  timeFormat: z.enum(["12", "24"], {
    required_error: "فرمت زمان را انتخاب کنید",
  }).default("24"),
  
  rtl: z.boolean().default(true),
  
  showNotifications: z.boolean().default(true),
  
  showBreadcrumbs: z.boolean().default(true),
});

export type DisplaySettingsFormData = z.infer<typeof displaySettingsSchema>;

// Schema برای تنظیمات API
export const apiSettingsSchema = z.object({
  apiEnabled: z.boolean().default(true),
  
  apiKey: z
    .string()
    .max(500, "کلید API نمی‌تواند بیشتر از ۵۰۰ کاراکتر باشد")
    .optional(),
  
  rateLimit: z
    .number()
    .int("محدودیت نرخ باید عدد صحیح باشد")
    .min(10, "محدودیت نرخ باید حداقل ۱۰ باشد")
    .max(10000, "محدودیت نرخ نمی‌تواند بیشتر از ۱۰۰۰۰ باشد")
    .default(100),
  
  rateLimitWindow: z
    .number()
    .int("بازه زمانی باید عدد صحیح باشد")
    .min(1, "بازه زمانی باید حداقل ۱ دقیقه باشد")
    .max(60, "بازه زمانی نمی‌تواند بیشتر از ۶۰ دقیقه باشد")
    .default(60),
  
  allowedOrigins: z
    .array(z.string())
    .optional()
    .default([]),
});

export type ApiSettingsFormData = z.infer<typeof apiSettingsSchema>;

