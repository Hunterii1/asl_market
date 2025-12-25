import { z } from "zod";

// Schema برای افزودن بازدیدکننده جدید (معمولاً بازدیدکنندگان به صورت خودکار ثبت می‌شوند)
export const addVisitorSchema = z.object({
  ip: z
    .string()
    .min(7, "آدرس IP نامعتبر است")
    .max(45, "آدرس IP نامعتبر است"),
  
  userAgent: z
    .string()
    .min(1, "User Agent الزامی است")
    .max(500, "User Agent نمی‌تواند بیشتر از ۵۰۰ کاراکتر باشد")
    .optional(),
  
  browser: z
    .string()
    .min(1, "نام مرورگر الزامی است")
    .max(100, "نام مرورگر نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد")
    .optional(),
  
  os: z
    .string()
    .min(1, "سیستم عامل الزامی است")
    .max(100, "سیستم عامل نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد")
    .optional(),
  
  device: z.enum(["desktop", "mobile", "tablet", "other"], {
    required_error: "نوع دستگاه را انتخاب کنید",
  }).optional(),
  
  country: z
    .string()
    .max(100, "نام کشور نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد")
    .optional(),
  
  city: z
    .string()
    .max(100, "نام شهر نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد")
    .optional(),
  
  page: z
    .string()
    .min(1, "صفحه بازدید شده الزامی است")
    .max(500, "آدرس صفحه نمی‌تواند بیشتر از ۵۰۰ کاراکتر باشد"),
  
  referrer: z
    .string()
    .max(500, "آدرس مرجع نمی‌تواند بیشتر از ۵۰۰ کاراکتر باشد")
    .optional()
    .or(z.literal('')),
  
  sessionId: z
    .string()
    .max(200, "شناسه نشست نمی‌تواند بیشتر از ۲۰۰ کاراکتر باشد")
    .optional(),
  
  duration: z
    .number()
    .int()
    .min(0, "مدت زمان نمی‌تواند منفی باشد")
    .optional()
    .default(0),
  
  isBot: z.boolean().default(false),
  
  language: z
    .string()
    .max(10, "زبان نمی‌تواند بیشتر از ۱۰ کاراکتر باشد")
    .optional(),
});

export type AddVisitorFormData = z.infer<typeof addVisitorSchema>;

// Schema برای ویرایش بازدیدکننده
export const editVisitorSchema = addVisitorSchema.extend({
  id: z.string().min(1, "شناسه بازدیدکننده الزامی است"),
});

export type EditVisitorFormData = z.infer<typeof editVisitorSchema>;

