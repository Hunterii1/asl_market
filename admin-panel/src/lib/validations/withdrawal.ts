import { z } from "zod";

// Schema برای افزودن برداشت جدید
export const addWithdrawalSchema = z.object({
  userId: z.string().min(1, "شناسه کاربر الزامی است"),
  userName: z.string().min(2, "نام کاربر باید حداقل ۲ کاراکتر باشد"),
  amount: z
    .number()
    .min(10000, "حداقل مبلغ برداشت ۱۰,۰۰۰ تومان است")
    .max(100000000, "حداکثر مبلغ برداشت ۱۰۰,۰۰۰,۰۰۰ تومان است"),
  
  method: z.enum(["bank_transfer", "card", "wallet", "crypto"], {
    required_error: "روش برداشت را انتخاب کنید",
  }),
  
  accountInfo: z.string().min(1, "اطلاعات حساب الزامی است"),
  
  status: z.enum(["pending", "processing", "completed", "rejected", "cancelled"], {
    required_error: "وضعیت برداشت را انتخاب کنید",
  }).default("pending"),
  
  description: z.string().max(500, "توضیحات حداکثر ۵۰۰ کاراکتر باشد").optional(),
  
  requestedAt: z.string().optional(),
});

export type AddWithdrawalFormData = z.infer<typeof addWithdrawalSchema>;

// Schema برای ویرایش برداشت
export const editWithdrawalSchema = addWithdrawalSchema.extend({
  id: z.string().min(1, "شناسه برداشت الزامی است"),
  processedAt: z.string().optional(),
  processedBy: z.string().optional(),
});

export type EditWithdrawalFormData = z.infer<typeof editWithdrawalSchema>;

