/**
 * نمایش یک‌بار خطاهای API (شبکه / ۵۰۰) تا کاربر با نوتیف تکراری بمبباران نشود.
 */

const COOLDOWN_MS = 35_000; // ۳۵ ثانیه
const lastShown: Record<string, number> = {};

function getErrorKey(message: string, statusCode?: number): string {
  const s = String(message || "").trim();
  let code = statusCode ?? 0;
  if (code === 0 && /\(50\d\)|\(503\)/.test(s)) code = 500; // از متن استخراج
  // خطای شبکه / نت ملی (بدون کد یا fetch failed یا نت ملی)
  if (code === 0 || /network|fetch|اتصال|شبکه|نت\s*ملی/i.test(s)) return "network";
  // خطای سرور ۵xx
  if (code >= 500) return "5xx";
  return `err_${code}_${s.slice(0, 60)}`;
}

/**
 * فقط در صورت خطای شبکه یا ۵xx نمایش می‌دهد و با cooldown از تکرار جلوگیری می‌کند.
 * اگر قبلاً همان خطا در بازهٔ cooldown نشان داده شده باشد، چیزی نشان نمی‌دهد.
 * @returns true اگر toast نشان داده شد، وگرنه false
 */
export function shouldShowApiErrorOnce(message: string, statusCode?: number): boolean {
  const key = getErrorKey(message, statusCode);
  const code = statusCode ?? 0;
  const isServerOrNetwork = code >= 500 || code === 0 || /network|fetch|اتصال|شبکه|نت\s*ملی/i.test(String(message));
  if (!isServerOrNetwork) return true; // برای ۴xx همیشه نشان بده

  const now = Date.now();
  if (lastShown[key] != null && now - lastShown[key] < COOLDOWN_MS) return false;
  lastShown[key] = now;
  return true;
}

/** فقط برای تست: پاک کردن کش cooldown تا تست‌ها مستقل باشند */
export function resetApiErrorToastCooldownForTests(): void {
  Object.keys(lastShown).forEach((k) => delete lastShown[k]);
}
