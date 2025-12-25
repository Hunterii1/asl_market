import { z } from "zod";

// Schema برای افزودن اعلان جدید
export const addNotificationSchema = z.object({
  title: z
    .string()
    .min(3, "عنوان باید حداقل ۳ کاراکتر باشد")
    .max(200, "عنوان نمی‌تواند بیشتر از ۲۰۰ کاراکتر باشد"),
  
  content: z
    .string()
    .min(10, "محتوا باید حداقل ۱۰ کاراکتر باشد")
    .max(5000, "محتوا نمی‌تواند بیشتر از ۵۰۰۰ کاراکتر باشد"),
  
  type: z.enum(["system", "email", "sms", "telegram", "push"], {
    required_error: "نوع اعلان را انتخاب کنید",
  }),
  
  status: z.enum(["sent", "pending", "failed", "draft"], {
    required_error: "وضعیت اعلان را انتخاب کنید",
  }).default("draft"),
  
  priority: z.enum(["low", "medium", "high", "urgent"], {
    required_error: "اولویت را انتخاب کنید",
  }).default("medium"),
  
  recipientType: z.enum(["all", "specific", "group"], {
    required_error: "نوع گیرنده را انتخاب کنید",
  }).default("all"),
  
  recipientIds: z
    .array(z.string())
    .optional()
    .default([]),
  
  scheduledAt: z
    .string()
    .optional(),
  
  actionUrl: z
    .string()
    .url("آدرس نامعتبر است")
    .optional()
    .or(z.literal('')),
  
  actionText: z
    .string()
    .max(100, "متن دکمه نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد")
    .optional(),
  
  icon: z
    .string()
    .max(100, "نام آیکون نامعتبر است")
    .optional(),
  
  imageUrl: z
    .string()
    .url("آدرس تصویر نامعتبر است")
    .optional()
    .or(z.literal('')),
  
  sound: z.boolean().default(false),
  
  vibrate: z.boolean().default(false),
  
  silent: z.boolean().default(false),
  
  expiresAt: z
    .string()
    .optional(),
  
  metadata: z
    .record(z.any())
    .optional(),
});

export type AddNotificationFormData = z.infer<typeof addNotificationSchema>;

// Schema برای ویرایش اعلان
export const editNotificationSchema = addNotificationSchema.extend({
  id: z.string().min(1, "شناسه اعلان الزامی است"),
});

export type EditNotificationFormData = z.infer<typeof editNotificationSchema>;

