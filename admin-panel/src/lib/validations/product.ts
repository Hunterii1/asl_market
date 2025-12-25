import { z } from "zod";

// Schema برای افزودن محصول جدید
export const addProductSchema = z.object({
  name: z
    .string()
    .min(2, "نام محصول باید حداقل ۲ کاراکتر باشد")
    .max(100, "نام محصول نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد"),
  
  description: z
    .string()
    .min(10, "توضیحات باید حداقل ۱۰ کاراکتر باشد")
    .max(2000, "توضیحات نمی‌تواند بیشتر از ۲۰۰۰ کاراکتر باشد")
    .optional()
    .or(z.literal("")),
  
  price: z
    .number()
    .min(0, "قیمت نمی‌تواند منفی باشد")
    .max(1000000000, "قیمت نمی‌تواند بیشتر از ۱,۰۰۰,۰۰۰,۰۰۰ تومان باشد"),
  
  category: z
    .string()
    .min(1, "دسته‌بندی الزامی است"),
  
  stock: z
    .number()
    .int("موجودی باید عدد صحیح باشد")
    .min(0, "موجودی نمی‌تواند منفی باشد")
    .default(0),
  
  status: z.enum(["active", "inactive", "out_of_stock"], {
    required_error: "وضعیت محصول را انتخاب کنید",
  }),
  
  tags: z
    .array(z.string())
    .optional()
    .default([]),
  
  imageUrl: z
    .string()
    .url("آدرس تصویر معتبر نیست")
    .optional()
    .or(z.literal("")),
  
  discount: z
    .number()
    .min(0, "تخفیف نمی‌تواند منفی باشد")
    .max(100, "تخفیف نمی‌تواند بیشتر از ۱۰۰ درصد باشد")
    .optional()
    .default(0),
  
  sku: z
    .string()
    .min(1, "کد محصول (SKU) الزامی است")
    .max(50, "کد محصول نمی‌تواند بیشتر از ۵۰ کاراکتر باشد")
    .optional()
    .or(z.literal("")),
});

export type AddProductFormData = z.infer<typeof addProductSchema>;

// Schema برای ویرایش محصول
export const editProductSchema = addProductSchema.extend({
  id: z.string().min(1, "شناسه محصول الزامی است"),
});

export type EditProductFormData = z.infer<typeof editProductSchema>;

// دسته‌بندی‌های پیش‌فرض
export const productCategories = [
  { value: 'education', label: 'آموزشی' },
  { value: 'software', label: 'نرم‌افزار' },
  { value: 'service', label: 'خدمات' },
  { value: 'subscription', label: 'اشتراک' },
  { value: 'license', label: 'لایسنس' },
  { value: 'course', label: 'دوره' },
  { value: 'package', label: 'پکیج' },
  { value: 'other', label: 'سایر' },
];
