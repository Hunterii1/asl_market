import { z } from "zod";

// Schema برای افزودن اعلان جدید
export const addNotificationSchema = z.object({
  title: z
    .string()
    .min(3, "عنوان باید حداقل ۳ کاراکتر باشد")
    .max(255, "عنوان نمی‌تواند بیشتر از ۲۵۵ کاراکتر باشد"),

  message: z
    .string()
    .min(10, "محتوا باید حداقل ۱۰ کاراکتر باشد")
    .max(5000, "محتوا نمی‌تواند بیشتر از ۵۰۰۰ کاراکتر باشد"),

  type: z.enum(["info", "warning", "success", "error"], {
    required_error: "نوع اعلان را انتخاب کنید",
  }).default("info"),

  priority: z.enum(["low", "normal", "high", "urgent"], {
    required_error: "اولویت را انتخاب کنید",
  }).default("normal"),

  user_id: z
    .number()
    .int("شناسه کاربر باید عدد صحیح باشد")
    .positive("شناسه کاربر باید مثبت باشد")
    .optional()
    .nullable(),

  expires_at: z
    .string()
    .optional()
    .nullable(),

  action_url: z
    .string()
    .url("آدرس نامعتبر است")
    .optional()
    .or(z.literal('')),

  action_text: z
    .string()
    .max(100, "متن دکمه نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد")
    .optional(),

  is_active: z.boolean().default(true),
});

export type AddNotificationFormData = z.infer<typeof addNotificationSchema>;

// Schema برای ویرایش اعلان
export const editNotificationSchema = z.object({
  id: z.number().int("شناسه اعلان باید عدد صحیح باشد").min(1, "شناسه اعلان الزامی است"),

  title: z
    .string()
    .min(3, "عنوان باید حداقل ۳ کاراکتر باشد")
    .max(255, "عنوان نمی‌تواند بیشتر از ۲۵۵ کاراکتر باشد")
    .optional(),

  message: z
    .string()
    .min(10, "محتوا باید حداقل ۱۰ کاراکتر باشد")
    .max(5000, "محتوا نمی‌تواند بیشتر از ۵۰۰۰ کاراکتر باشد")
    .optional(),

  type: z.enum(["info", "warning", "success", "error"]).optional(),

  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),

  user_id: z
    .number()
    .int("شناسه کاربر باید عدد صحیح باشد")
    .positive("شناسه کاربر باید مثبت باشد")
    .optional()
    .nullable(),

  expires_at: z
    .string()
    .optional()
    .nullable(),

  action_url: z
    .string()
    .url("آدرس نامعتبر است")
    .optional()
    .or(z.literal('')),

  action_text: z
    .string()
    .max(100, "متن دکمه نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد")
    .optional(),

  is_active: z.boolean().optional(),
});

export type EditNotificationFormData = z.infer<typeof editNotificationSchema>;
