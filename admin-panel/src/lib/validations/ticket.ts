import { z } from "zod";

// Schema برای افزودن تیکت جدید
export const addTicketSchema = z.object({
  userId: z.string().min(1, "شناسه کاربر الزامی است"),
  userName: z.string().min(2, "نام کاربر باید حداقل ۲ کاراکتر باشد"),
  
  subject: z
    .string()
    .min(5, "موضوع باید حداقل ۵ کاراکتر باشد")
    .max(200, "موضوع نمی‌تواند بیشتر از ۲۰۰ کاراکتر باشد"),
  
  category: z.enum(["technical", "billing", "general", "license", "bug", "feature", "other"], {
    required_error: "دسته‌بندی تیکت را انتخاب کنید",
  }),
  
  priority: z.enum(["low", "medium", "high", "urgent"], {
    required_error: "اولویت تیکت را انتخاب کنید",
  }).default("medium"),
  
  message: z
    .string()
    .min(10, "پیام باید حداقل ۱۰ کاراکتر باشد")
    .max(5000, "پیام نمی‌تواند بیشتر از ۵۰۰۰ کاراکتر باشد"),
  
  status: z.enum(["open", "in_progress", "resolved", "closed"], {
    required_error: "وضعیت تیکت را انتخاب کنید",
  }).default("open"),
  
  attachments: z.array(z.string()).optional().default([]),
});

export type AddTicketFormData = z.infer<typeof addTicketSchema>;

// Schema برای پاسخ به تیکت
export const replyTicketSchema = z.object({
  ticketId: z.string().min(1, "شناسه تیکت الزامی است"),
  message: z
    .string()
    .min(10, "پیام باید حداقل ۱۰ کاراکتر باشد")
    .max(5000, "پیام نمی‌تواند بیشتر از ۵۰۰۰ کاراکتر باشد"),
  isInternal: z.boolean().default(false),
  attachments: z.array(z.string()).optional().default([]),
});

export type ReplyTicketFormData = z.infer<typeof replyTicketSchema>;

// Schema برای ویرایش تیکت
export const editTicketSchema = z.object({
  id: z.string().min(1, "شناسه تیکت الزامی است"),
  subject: z
    .string()
    .min(5, "موضوع باید حداقل ۵ کاراکتر باشد")
    .max(200, "موضوع نمی‌تواند بیشتر از ۲۰۰ کاراکتر باشد"),
  category: z.enum(["technical", "billing", "general", "license", "bug", "feature", "other"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  status: z.enum(["open", "in_progress", "resolved", "closed"]),
  assignedTo: z.string().optional(),
});

export type EditTicketFormData = z.infer<typeof editTicketSchema>;

