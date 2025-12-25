import { z } from "zod";

// Schema برای افزودن محتوای آموزشی جدید
export const addEducationSchema = z.object({
  title: z
    .string()
    .min(5, "عنوان باید حداقل ۵ کاراکتر باشد")
    .max(200, "عنوان نمی‌تواند بیشتر از ۲۰۰ کاراکتر باشد"),
  
  description: z
    .string()
    .min(10, "توضیحات باید حداقل ۱۰ کاراکتر باشد")
    .max(5000, "توضیحات نمی‌تواند بیشتر از ۵۰۰۰ کاراکتر باشد"),
  
  category: z.enum(["video", "article", "course", "tutorial", "documentation", "other"], {
    required_error: "دسته‌بندی محتوا را انتخاب کنید",
  }),
  
  level: z.enum(["beginner", "intermediate", "advanced"], {
    required_error: "سطح محتوا را انتخاب کنید",
  }).default("beginner"),
  
  duration: z
    .number()
    .int()
    .min(0, "مدت زمان نمی‌تواند منفی باشد")
    .max(1000, "مدت زمان نمی‌تواند بیشتر از ۱۰۰۰ دقیقه باشد")
    .optional(),
  
  videoUrl: z.string().url("آدرس ویدیو نامعتبر است").optional().or(z.literal('')),
  thumbnailUrl: z.string().url("آدرس تصویر نامعتبر است").optional().or(z.literal('')),
  
  content: z
    .string()
    .min(50, "محتوا باید حداقل ۵۰ کاراکتر باشد")
    .max(50000, "محتوا نمی‌تواند بیشتر از ۵۰۰۰۰ کاراکتر باشد")
    .optional(),
  
  tags: z.array(z.string()).optional().default([]),
  
  status: z.enum(["draft", "published", "archived"], {
    required_error: "وضعیت محتوا را انتخاب کنید",
  }).default("draft"),
  
  isFree: z.boolean().default(false),
  price: z.number().min(0, "قیمت نمی‌تواند منفی باشد").optional(),
  
  views: z.number().int().min(0).default(0),
  likes: z.number().int().min(0).default(0),
});

export type AddEducationFormData = z.infer<typeof addEducationSchema>;

// Schema برای ویرایش محتوای آموزشی
export const editEducationSchema = addEducationSchema.extend({
  id: z.string().min(1, "شناسه محتوا الزامی است"),
});

export type EditEducationFormData = z.infer<typeof editEducationSchema>;

