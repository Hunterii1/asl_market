import { z } from "zod";

// Schema برای افزودن پاپ‌آپ جدید
export const addPopupSchema = z.object({
  title: z
    .string()
    .min(3, "عنوان باید حداقل ۳ کاراکتر باشد")
    .max(200, "عنوان نمی‌تواند بیشتر از ۲۰۰ کاراکتر باشد"),
  
  content: z
    .string()
    .min(10, "محتوا باید حداقل ۱۰ کاراکتر باشد")
    .max(5000, "محتوا نمی‌تواند بیشتر از ۵۰۰۰ کاراکتر باشد"),
  
  type: z.enum(["modal", "banner", "toast", "slide_in"], {
    required_error: "نوع پاپ‌آپ را انتخاب کنید",
  }),
  
  position: z.enum(["top", "bottom", "center", "left", "right"], {
    required_error: "موقعیت نمایش را انتخاب کنید",
  }).optional(),
  
  status: z.enum(["active", "inactive", "scheduled"], {
    required_error: "وضعیت پاپ‌آپ را انتخاب کنید",
  }).default("inactive"),
  
  startDate: z
    .string()
    .optional(),
  
  endDate: z
    .string()
    .optional(),
  
  showOnPages: z
    .array(z.string())
    .optional()
    .default([]),
  
  showToUsers: z.enum(["all", "logged_in", "logged_out", "specific"], {
    required_error: "نوع نمایش به کاربران را انتخاب کنید",
  }).default("all"),
  
  specificUserIds: z
    .array(z.string())
    .optional()
    .default([]),
  
  buttonText: z
    .string()
    .max(100, "متن دکمه نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد")
    .optional(),
  
  buttonLink: z
    .string()
    .url("آدرس دکمه نامعتبر است")
    .optional()
    .or(z.literal('')),
  
  closeButton: z.boolean().default(true),
  
  showDelay: z
    .number()
    .int("تاخیر نمایش باید عدد صحیح باشد")
    .min(0, "تاخیر نمایش نمی‌تواند منفی باشد")
    .optional()
    .default(0),
  
  backgroundColor: z
    .string()
    .max(50, "رنگ پس‌زمینه نامعتبر است")
    .optional(),
  
  textColor: z
    .string()
    .max(50, "رنگ متن نامعتبر است")
    .optional(),
  
  width: z
    .number()
    .min(100, "عرض نمی‌تواند کمتر از ۱۰۰ پیکسل باشد")
    .max(2000, "عرض نمی‌تواند بیشتر از ۲۰۰۰ پیکسل باشد")
    .optional(),
  
  height: z
    .number()
    .min(100, "ارتفاع نمی‌تواند کمتر از ۱۰۰ پیکسل باشد")
    .max(2000, "ارتفاع نمی‌تواند بیشتر از ۲۰۰۰ پیکسل باشد")
    .optional(),
  
  displayCount: z
    .number()
    .int("تعداد نمایش باید عدد صحیح باشد")
    .min(0, "تعداد نمایش نمی‌تواند منفی باشد")
    .optional()
    .default(0),
  
  clickCount: z
    .number()
    .int("تعداد کلیک باید عدد صحیح باشد")
    .min(0, "تعداد کلیک نمی‌تواند منفی باشد")
    .optional()
    .default(0),
});

export type AddPopupFormData = z.infer<typeof addPopupSchema>;

// Schema برای ویرایش پاپ‌آپ
export const editPopupSchema = addPopupSchema.extend({
  id: z.string().min(1, "شناسه پاپ‌آپ الزامی است"),
});

export type EditPopupFormData = z.infer<typeof editPopupSchema>;

