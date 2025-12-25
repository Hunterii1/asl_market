import { z } from "zod";

// Schema برای افزودن مدیر جدید
export const addAdminSchema = z.object({
  name: z
    .string()
    .min(2, "نام باید حداقل ۲ کاراکتر باشد")
    .max(50, "نام نمی‌تواند بیشتر از ۵۰ کاراکتر باشد")
    .regex(/^[\u0600-\u06FF\s]+$/, "نام باید به فارسی باشد"),
  
  email: z
    .string()
    .min(1, "ایمیل الزامی است")
    .email("فرمت ایمیل معتبر نیست"),
  
  phone: z
    .string()
    .min(1, "شماره تلفن الزامی است")
    .regex(/^[۰-۹0-9\s\-\(\)]+$/, "فرمت شماره تلفن معتبر نیست")
    .refine((val) => {
      const digits = val.replace(/[^۰-۹0-9]/g, "");
      return digits.length >= 10 && digits.length <= 11;
    }, "شماره تلفن باید ۱۰ یا ۱۱ رقم باشد"),
  
  username: z
    .string()
    .min(3, "نام کاربری باید حداقل ۳ کاراکتر باشد")
    .max(30, "نام کاربری نمی‌تواند بیشتر از ۳۰ کاراکتر باشد")
    .regex(/^[a-zA-Z0-9_]+$/, "نام کاربری فقط می‌تواند شامل حروف انگلیسی، اعداد و _ باشد"),
  
  password: z
    .string()
    .min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد")
    .max(100, "رمز عبور نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "رمز عبور باید شامل حروف بزرگ، کوچک و عدد باشد"),
  
  role: z.enum(["super_admin", "admin", "moderator"], {
    required_error: "نقش مدیر را انتخاب کنید",
  }),
  
  permissions: z.array(z.string()).optional().default([]),
  
  status: z.enum(["active", "inactive", "suspended"], {
    required_error: "وضعیت مدیر را انتخاب کنید",
  }).default("active"),
});

export type AddAdminFormData = z.infer<typeof addAdminSchema>;

// Schema برای ویرایش مدیر (بدون رمز عبور اجباری)
export const editAdminSchema = addAdminSchema.extend({
  id: z.string().min(1, "شناسه مدیر الزامی است"),
}).omit({ password: true }).extend({
  password: z.string().optional(),
  changePassword: z.boolean().default(false),
});

export type EditAdminFormData = z.infer<typeof editAdminSchema>;

