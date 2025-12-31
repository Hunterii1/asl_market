import { z } from "zod";

// Schema برای افزودن محصول تحقیقی جدید
export const addResearchProductSchema = z.object({
  name: z
    .string()
    .min(2, "نام محصول باید حداقل ۲ کاراکتر باشد")
    .max(255, "نام محصول نمی‌تواند بیشتر از ۲۵۵ کاراکتر باشد"),
  
  hs_code: z
    .string()
    .optional()
    .or(z.literal("")),
  
  category: z
    .string()
    .min(2, "دسته‌بندی باید حداقل ۲ کاراکتر باشد")
    .max(100, "دسته‌بندی نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد"),
  
  description: z
    .string()
    .optional()
    .or(z.literal("")),
  
  export_value: z
    .string()
    .optional()
    .or(z.literal("")),
  
  import_value: z
    .string()
    .optional()
    .or(z.literal("")),
  
  market_demand: z
    .enum(["high", "medium", "low"])
    .optional(),
  
  profit_potential: z
    .enum(["high", "medium", "low"])
    .optional(),
  
  competition_level: z
    .enum(["high", "medium", "low"])
    .optional(),
  
  target_country: z
    .string()
    .optional()
    .or(z.literal("")),
  
  iran_purchase_price: z
    .string()
    .optional()
    .or(z.literal("")),
  
  target_country_price: z
    .string()
    .optional()
    .or(z.literal("")),
  
  price_currency: z
    .string()
    .optional()
    .default("USD"),
  
  target_countries: z
    .string()
    .optional()
    .or(z.literal("")),
  
  seasonal_factors: z
    .string()
    .optional()
    .or(z.literal("")),
  
  required_licenses: z
    .string()
    .optional()
    .or(z.literal("")),
  
  quality_standards: z
    .string()
    .optional()
    .or(z.literal("")),
  
  priority: z
    .number()
    .int("اولویت باید عدد صحیح باشد")
    .min(0, "اولویت نمی‌تواند منفی باشد")
    .default(0),
});

export type AddResearchProductFormData = z.infer<typeof addResearchProductSchema>;

// Schema برای ویرایش محصول تحقیقی
export const editResearchProductSchema = addResearchProductSchema.extend({
  id: z.string().min(1, "شناسه محصول الزامی است"),
});

export type EditResearchProductFormData = z.infer<typeof editResearchProductSchema>;
