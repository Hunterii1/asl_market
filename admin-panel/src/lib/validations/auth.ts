import { z } from "zod";

// Schema برای ورود
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "ایمیل یا نام کاربری الزامی است")
    .email("فرمت ایمیل نامعتبر است")
    .or(z.string().min(3, "نام کاربری باید حداقل ۳ کاراکتر باشد")),
  
  password: z
    .string()
    .min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد")
    .max(100, "رمز عبور نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد"),
  
  rememberMe: z.boolean().default(false),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Schema برای فراموشی رمز عبور
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "ایمیل الزامی است")
    .email("فرمت ایمیل نامعتبر است"),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// Schema برای تغییر رمز عبور
export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, "رمز عبور فعلی الزامی است"),
  
  newPassword: z
    .string()
    .min(8, "رمز عبور جدید باید حداقل ۸ کاراکتر باشد")
    .max(100, "رمز عبور جدید نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد")
    .regex(/[A-Z]/, "رمز عبور باید حداقل یک حرف بزرگ داشته باشد")
    .regex(/[a-z]/, "رمز عبور باید حداقل یک حرف کوچک داشته باشد")
    .regex(/[0-9]/, "رمز عبور باید حداقل یک عدد داشته باشد"),
  
  confirmPassword: z
    .string()
    .min(1, "تکرار رمز عبور الزامی است"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "رمز عبور جدید و تکرار آن باید یکسان باشند",
  path: ["confirmPassword"],
});

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

