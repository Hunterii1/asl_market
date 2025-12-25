import { z } from "zod";

// Schema برای افزودن کاربر جدید
export const addUserSchema = z.object({
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
  
  telegramId: z
    .string()
    .min(1, "آیدی تلگرام الزامی است")
    .regex(/^@?[a-zA-Z0-9_]+$/, "فرمت آیدی تلگرام معتبر نیست (مثال: @username یا username)"),
  
  balance: z
    .number()
    .min(0, "موجودی نمی‌تواند منفی باشد")
    .max(1000000000, "موجودی نمی‌تواند بیشتر از ۱,۰۰۰,۰۰۰,۰۰۰ تومان باشد")
    .default(0),
  
  status: z.enum(["active", "inactive", "banned"], {
    required_error: "وضعیت کاربر را انتخاب کنید",
  }),
});

export type AddUserFormData = z.infer<typeof addUserSchema>;

// Schema برای ویرایش کاربر (همان schema اما با id)
export const editUserSchema = addUserSchema.extend({
  id: z.string().min(1, "شناسه کاربر الزامی است"),
});

export type EditUserFormData = z.infer<typeof editUserSchema>;
