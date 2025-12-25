import { z } from "zod";

// Schema برای افزودن/ویرایش موجودی انبار
export const addInventorySchema = z.object({
  productId: z
    .string()
    .min(1, "شناسه محصول الزامی است"),
  
  productName: z
    .string()
    .min(2, "نام محصول باید حداقل ۲ کاراکتر باشد")
    .max(200, "نام محصول نمی‌تواند بیشتر از ۲۰۰ کاراکتر باشد"),
  
  sku: z
    .string()
    .min(1, "کد محصول (SKU) الزامی است")
    .max(50, "کد محصول نمی‌تواند بیشتر از ۵۰ کاراکتر باشد")
    .optional(),
  
  quantity: z
    .number()
    .int("تعداد باید عدد صحیح باشد")
    .min(0, "تعداد نمی‌تواند منفی باشد"),
  
  reservedQuantity: z
    .number()
    .int("تعداد رزرو شده باید عدد صحیح باشد")
    .min(0, "تعداد رزرو شده نمی‌تواند منفی باشد")
    .optional()
    .default(0),
  
  availableQuantity: z
    .number()
    .int("تعداد موجود باید عدد صحیح باشد")
    .min(0, "تعداد موجود نمی‌تواند منفی باشد")
    .optional(),
  
  minStock: z
    .number()
    .int("حداقل موجودی باید عدد صحیح باشد")
    .min(0, "حداقل موجودی نمی‌تواند منفی باشد")
    .optional()
    .default(0),
  
  maxStock: z
    .number()
    .int("حداکثر موجودی باید عدد صحیح باشد")
    .min(0, "حداکثر موجودی نمی‌تواند منفی باشد")
    .optional(),
  
  location: z
    .string()
    .max(200, "مکان نمی‌تواند بیشتر از ۲۰۰ کاراکتر باشد")
    .optional(),
  
  warehouse: z
    .string()
    .max(200, "نام انبار نمی‌تواند بیشتر از ۲۰۰ کاراکتر باشد")
    .optional(),
  
  status: z.enum(["in_stock", "low_stock", "out_of_stock", "reserved"], {
    required_error: "وضعیت موجودی را انتخاب کنید",
  }).default("in_stock"),
  
  cost: z
    .number()
    .min(0, "هزینه نمی‌تواند منفی باشد")
    .optional(),
  
  notes: z
    .string()
    .max(2000, "یادداشت نمی‌تواند بیشتر از ۲۰۰۰ کاراکتر باشد")
    .optional(),
});

export type AddInventoryFormData = z.infer<typeof addInventorySchema>;

// Schema برای ویرایش موجودی
export const editInventorySchema = addInventorySchema.extend({
  id: z.string().min(1, "شناسه موجودی الزامی است"),
});

export type EditInventoryFormData = z.infer<typeof editInventorySchema>;

// Schema برای تغییر موجودی (افزودن/کاهش)
export const adjustInventorySchema = z.object({
  inventoryId: z.string().min(1, "شناسه موجودی الزامی است"),
  quantity: z
    .number()
    .int("تعداد باید عدد صحیح باشد"),
  type: z.enum(["add", "subtract"], {
    required_error: "نوع تغییر را انتخاب کنید",
  }),
  reason: z
    .string()
    .min(1, "دلیل تغییر الزامی است")
    .max(500, "دلیل نمی‌تواند بیشتر از ۵۰۰ کاراکتر باشد"),
  notes: z
    .string()
    .max(2000, "یادداشت نمی‌تواند بیشتر از ۲۰۰۰ کاراکتر باشد")
    .optional(),
});

export type AdjustInventoryFormData = z.infer<typeof adjustInventorySchema>;

