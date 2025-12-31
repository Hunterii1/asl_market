import { z } from "zod";

// Schema برای افزودن پاپ‌آپ جدید - هماهنگ با backend MarketingPopupRequest
export const addPopupSchema = z.object({
  title: z
    .string()
    .min(3, "عنوان باید حداقل ۳ کاراکتر باشد")
    .max(255, "عنوان نمی‌تواند بیشتر از ۲۵۵ کاراکتر باشد"),
  
  message: z
    .string()
    .min(10, "محتوا باید حداقل ۱۰ کاراکتر باشد")
    .max(5000, "محتوا نمی‌تواند بیشتر از ۵۰۰۰ کاراکتر باشد"),
  
  discount_url: z
    .string()
    .url("آدرس URL نامعتبر است")
    .optional()
    .or(z.literal('')),
  
  button_text: z
    .string()
    .max(100, "متن دکمه نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد")
    .optional()
    .or(z.literal('')),
  
  is_active: z.boolean().default(true),
  
  start_date: z
    .string()
    .optional()
    .or(z.literal('')),
  
  end_date: z
    .string()
    .optional()
    .or(z.literal('')),
  
  priority: z
    .number()
    .int("اولویت باید عدد صحیح باشد")
    .min(1, "اولویت نمی‌تواند کمتر از ۱ باشد")
    .default(1),
});

export type AddPopupFormData = z.infer<typeof addPopupSchema>;

// Schema برای ویرایش پاپ‌آپ
export const editPopupSchema = addPopupSchema.extend({
  id: z.number().int("شناسه پاپ‌آپ باید عدد صحیح باشد"),
});

export type EditPopupFormData = z.infer<typeof editPopupSchema>;
