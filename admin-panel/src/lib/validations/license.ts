import { z } from "zod";

// Schema for generating licenses (same as backend / Telegram: count + type)
export const generateLicenseSchema = z.object({
  count: z
    .number()
    .int("تعداد باید عدد صحیح باشد")
    .min(1, "حداقل ۱ لایسنس")
    .max(100, "حداکثر ۱۰۰ لایسنس"),
  type: z.enum(["pro", "plus", "plus4"], {
    required_error: "نوع لایسنس را انتخاب کنید",
  }),
});

export type GenerateLicenseFormData = z.infer<typeof generateLicenseSchema>;

// Alias for Add dialog (which is now Generate)
export const addLicenseSchema = generateLicenseSchema;
export type AddLicenseFormData = GenerateLicenseFormData;

// Schema for edit license dialog (legacy form; backend does not support editing license fields)
export const editLicenseSchema = z.object({
  id: z.string().min(1, "شناسه لایسنس الزامی است"),
  licenseKey: z.string().min(1).optional(),
  userId: z.string().optional(),
  userName: z.string().optional(),
  productId: z.string().optional(),
  productName: z.string().optional(),
  licenseType: z.enum(["trial", "monthly", "yearly", "lifetime"]).optional(),
  activatedAt: z.string().optional(),
  expiresAt: z.string().optional(),
  status: z.enum(["active", "expired", "suspended", "revoked"]).optional(),
  maxActivations: z.number().optional(),
  currentActivations: z.number().optional(),
  notes: z.string().optional(),
});

export type EditLicenseFormData = z.infer<typeof editLicenseSchema>;
