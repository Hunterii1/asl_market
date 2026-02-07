import { z } from "zod";

// Schema برای افزودن تامین‌کننده جدید
export const addSupplierSchema = z.object({
  name: z
    .string()
    .min(3, "نام تامین‌کننده باید حداقل ۳ کاراکتر باشد")
    .max(200, "نام تامین‌کننده نمی‌تواند بیشتر از ۲۰۰ کاراکتر باشد"),
  
  companyName: z
    .string()
    .min(3, "نام شرکت باید حداقل ۳ کاراکتر باشد")
    .max(200, "نام شرکت نمی‌تواند بیشتر از ۲۰۰ کاراکتر باشد")
    .optional(),
  
  email: z
    .string()
    .email("ایمیل نامعتبر است")
    .optional()
    .or(z.literal('')),
  
  phone: z
    .string()
    .min(10, "شماره تلفن باید حداقل ۱۰ کاراکتر باشد")
    .max(20, "شماره تلفن نمی‌تواند بیشتر از ۲۰ کاراکتر باشد"),
  
  address: z
    .string()
    .min(10, "آدرس باید حداقل ۱۰ کاراکتر باشد")
    .max(500, "آدرس نمی‌تواند بیشتر از ۵۰۰ کاراکتر باشد")
    .optional(),
  
  city: z
    .string()
    .min(2, "شهر باید حداقل ۲ کاراکتر باشد")
    .max(100, "شهر نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد")
    .optional(),
  
  country: z
    .string()
    .min(2, "کشور باید حداقل ۲ کاراکتر باشد")
    .max(100, "کشور نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد")
    .optional(),
  
  postalCode: z
    .string()
    .max(20, "کد پستی نمی‌تواند بیشتر از ۲۰ کاراکتر باشد")
    .optional(),
  
  taxId: z
    .string()
    .max(50, "شناسه مالیاتی نمی‌تواند بیشتر از ۵۰ کاراکتر باشد")
    .optional(),
  
  website: z
    .string()
    .url("آدرس وب‌سایت نامعتبر است")
    .optional()
    .or(z.literal('')),
  
  contactPerson: z
    .string()
    .min(3, "نام شخص تماس باید حداقل ۳ کاراکتر باشد")
    .max(200, "نام شخص تماس نمی‌تواند بیشتر از ۲۰۰ کاراکتر باشد")
    .optional(),
  
  contactPhone: z
    .string()
    .min(10, "شماره تلفن تماس باید حداقل ۱۰ کاراکتر باشد")
    .max(20, "شماره تلفن تماس نمی‌تواند بیشتر از ۲۰ کاراکتر باشد")
    .optional(),
  
  contactEmail: z
    .string()
    .email("ایمیل تماس نامعتبر است")
    .optional()
    .or(z.literal('')),
  
  category: z.enum(["electronics", "clothing", "food", "books", "furniture", "automotive", "other"], {
    required_error: "دسته‌بندی را انتخاب کنید",
  }).optional(),
  
  status: z.enum(["active", "inactive", "suspended"], {
    required_error: "وضعیت را انتخاب کنید",
  }).default("active"),
  
  rating: z
    .number()
    .min(0, "امتیاز نمی‌تواند منفی باشد")
    .max(5, "امتیاز نمی‌تواند بیشتر از ۵ باشد")
    .optional()
    .default(0),
  
  notes: z
    .string()
    .max(2000, "یادداشت نمی‌تواند بیشتر از ۲۰۰۰ کاراکتر باشد")
    .optional(),
  
  totalOrders: z.number().int().min(0).default(0),
  totalAmount: z.number().min(0).default(0),

  // تگ‌های تأمین‌کننده
  tag_first_class: z.boolean().optional().default(false),
  tag_good_price: z.boolean().optional().default(false),
  tag_export_experience: z.boolean().optional().default(false),
  tag_export_packaging: z.boolean().optional().default(false),
  tag_supply_without_capital: z.boolean().optional().default(false),
});

export type AddSupplierFormData = z.infer<typeof addSupplierSchema>;

// Schema برای ویرایش تامین‌کننده
export const editSupplierSchema = addSupplierSchema.extend({
  id: z.string().min(1, "شناسه تامین‌کننده الزامی است"),
});

export type EditSupplierFormData = z.infer<typeof editSupplierSchema>;

