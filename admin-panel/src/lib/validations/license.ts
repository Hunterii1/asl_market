import { z } from "zod";

// Schema برای افزودن لایسنس جدید
export const addLicenseSchema = z.object({
  licenseKey: z
    .string()
    .min(10, "کد لایسنس باید حداقل ۱۰ کاراکتر باشد")
    .max(100, "کد لایسنس نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد")
    .regex(/^[A-Z0-9\-]+$/, "کد لایسنس فقط می‌تواند شامل حروف بزرگ انگلیسی، اعداد و خط تیره باشد"),
  
  userId: z.string().min(1, "شناسه کاربر الزامی است"),
  userName: z.string().min(2, "نام کاربر باید حداقل ۲ کاراکتر باشد"),
  
  productId: z.string().min(1, "شناسه محصول الزامی است"),
  productName: z.string().min(2, "نام محصول باید حداقل ۲ کاراکتر باشد"),
  
  licenseType: z.enum(["trial", "monthly", "yearly", "lifetime"], {
    required_error: "نوع لایسنس را انتخاب کنید",
  }),
  
  activatedAt: z.string().optional(),
  expiresAt: z.string().optional(),
  
  status: z.enum(["active", "expired", "suspended", "revoked"], {
    required_error: "وضعیت لایسنس را انتخاب کنید",
  }).default("active"),
  
  maxActivations: z.number().int().min(1, "حداقل تعداد فعال‌سازی ۱ است").max(100, "حداکثر تعداد فعال‌سازی ۱۰۰ است").default(1),
  currentActivations: z.number().int().min(0).default(0),
  
  notes: z.string().max(500, "یادداشت حداکثر ۵۰۰ کاراکتر باشد").optional(),
});

export type AddLicenseFormData = z.infer<typeof addLicenseSchema>;

// Schema برای ویرایش لایسنس
export const editLicenseSchema = addLicenseSchema.extend({
  id: z.string().min(1, "شناسه لایسنس الزامی است"),
});

export type EditLicenseFormData = z.infer<typeof editLicenseSchema>;

