import { z } from "zod";

export const addAdminVisitorSchema = z.object({
  userId: z.string().min(1, "انتخاب کاربر الزامی است"),

  full_name: z
    .string()
    .min(2, "نام و نام خانوادگی باید حداقل ۲ کاراکتر باشد")
    .max(255, "نام و نام خانوادگی نمی‌تواند بیشتر از ۲۵۵ کاراکتر باشد"),

  national_id: z
    .string()
    .min(5, "کد ملی نامعتبر است")
    .max(20, "کد ملی نامعتبر است"),

  passport_number: z
    .string()
    .optional()
    .or(z.literal("")),

  birth_date: z
    .string()
    .min(4, "تاریخ تولد الزامی است"),

  mobile: z
    .string()
    .min(8, "شماره موبایل نامعتبر است")
    .max(20, "شماره موبایل نامعتبر است"),

  whatsapp_number: z
    .string()
    .optional()
    .or(z.literal("")),

  email: z
    .string()
    .email("ایمیل نامعتبر است")
    .optional()
    .or(z.literal("")),

  residence_address: z
    .string()
    .min(5, "آدرس محل سکونت الزامی است"),

  city_province: z
    .string()
    .min(2, "شهر/استان الزامی است"),

  destination_cities: z
    .string()
    .min(2, "شهرهای مقصد الزامی است"),

  has_local_contact: z.boolean().optional().default(false),

  local_contact_details: z
    .string()
    .optional()
    .or(z.literal("")),

  bank_account_iban: z
    .string()
    .min(4, "شماره شبا/حساب نامعتبر است"),

  bank_name: z
    .string()
    .min(2, "نام بانک الزامی است"),

  account_holder_name: z
    .string()
    .optional()
    .or(z.literal("")),

  has_marketing_experience: z.boolean().optional().default(false),

  marketing_experience_desc: z
    .string()
    .optional()
    .or(z.literal("")),

  language_level: z.enum(["excellent", "good", "weak", "none"], {
    required_error: "سطح زبان را انتخاب کنید",
  }),

  special_skills: z
    .string()
    .optional()
    .or(z.literal("")),

  interested_products: z
    .string()
    .optional()
    .or(z.literal("")),

  agrees_to_use_approved_products: z.literal(true, {
    errorMap: () => ({ message: "پذیرش استفاده از محصولات تایید‌شده الزامی است" }),
  }),

  agrees_to_violation_consequences: z.literal(true, {
    errorMap: () => ({ message: "پذیرش عواقب تخلف الزامی است" }),
  }),

  agrees_to_submit_reports: z.literal(true, {
    errorMap: () => ({ message: "پذیرش ارسال گزارش‌ها الزامی است" }),
  }),

  digital_signature: z
    .string()
    .min(2, "امضای دیجیتال الزامی است"),

  signature_date: z
    .string()
    .min(4, "تاریخ امضا الزامی است"),
});

export type AddAdminVisitorFormData = z.infer<typeof addAdminVisitorSchema>;

