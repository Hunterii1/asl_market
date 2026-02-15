/**
 * API Error Toast Deduplication
 * 
 * جلوگیری از نمایش تکراری خطاهای شبکه و سرور (500, Network Error)
 * در بازه زمانی مشخص (cooldown period)
 */

const ERROR_COOLDOWN_MS = 5000; // 5 ثانیه
const errorTimestamps = new Map<string, number>();

/**
 * بررسی می‌کند که آیا این خطا باید نمایش داده شود یا نه
 * @param errorMessage متن خطا
 * @returns true اگر باید نمایش داده شود، false اگر در cooldown است
 */
export function shouldShowApiErrorOnce(errorMessage: string): boolean {
  const now = Date.now();
  
  // فقط خطاهای شبکه و 500 را فیلتر می‌کنیم
  const isNetworkError = errorMessage.includes('شبکه') || 
                         errorMessage.includes('network') ||
                         errorMessage.includes('Network');
  const is500Error = errorMessage.includes('500') || 
                     errorMessage.includes('خطای سرور');
  
  if (!isNetworkError && !is500Error) {
    // خطاهای دیگر را بدون محدودیت نمایش بده
    return true;
  }
  
  // کلید یکتا برای این نوع خطا
  const errorKey = isNetworkError ? 'network_error' : 'server_500_error';
  
  const lastShown = errorTimestamps.get(errorKey);
  
  if (lastShown && (now - lastShown) < ERROR_COOLDOWN_MS) {
    // هنوز در cooldown هستیم، نمایش نده
    return false;
  }
  
  // زمان نمایش را ثبت کن
  errorTimestamps.set(errorKey, now);
  return true;
}
