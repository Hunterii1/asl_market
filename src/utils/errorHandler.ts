// Error Handler Utility
// برای مدیریت و نمایش خطاهای backend و frontend

import { toast } from '@/hooks/use-toast';

export interface ApiError {
  error?: string;
  message?: string;
  details?: string;
  license_status?: {
    needs_license: boolean;
    has_license: boolean;
    is_approved: boolean;
  };
  needs_auth?: boolean;
}

export interface ErrorResponse {
  error: string;
  details?: string;
  code?: string;
  statusCode?: number;
}

/** پیام یکدست برای اختلال موقت سرویس AI (بدون نمایش خطای فنی به کاربر) */
const AI_CHAT_SOFT_TITLE = 'اختلال موقت سرویس هوش مصنوعی';
const AI_CHAT_SOFT_DESCRIPTION =
  'به‌دلیل ملی بودن بستر اینترنت و محدودیت‌های اتصال به سرویس‌های هوش مصنوعی، گاهی ساخت گفت‌وگوی جدید یا دریافت پاسخ با تأخیر یا اختلال همراه است. بابت این موضوع پوزش می‌خواهیم؛ تیم در حال بهبود است و به‌زودی وضعیت پایدارتر می‌شود. لطفاً کمی بعد دوباره تلاش کنید.';

class ErrorHandler {
  /** فقط برای endpoint چت AI؛ خطاهای فنی را به پیام «اختلال موقت» تبدیل می‌کند */
  private shouldUseAiChatSoftMessage(
    errorSource: string | undefined,
    rawMessage: string,
    statusCode: number | undefined,
    isNetworkFailure: boolean
  ): boolean {
    // فقط endpoint ارسال پیام (POST .../ai/chat) — نه بارگذاری لیست/تک چت (.../ai/chats/...)
    if (
      !errorSource ||
      errorSource.includes('/ai/chats') ||
      !errorSource.includes('/ai/chat')
    ) {
      return false;
    }
    if (statusCode === 401 || statusCode === 403 || statusCode === 429) return false;

    if (isNetworkFailure) return true;

    const m = rawMessage.toLowerCase();
    if (statusCode !== undefined && statusCode >= 500) return true;

    return (
      m.includes('failed to create chat') ||
      m.includes('failed to get ai') ||
      m.includes('failed to save user message') ||
      rawMessage.includes('ایجاد مکالمه') ||
      m.includes('internal server error') ||
      m.includes('service unavailable') ||
      m.includes('bad gateway') ||
      m.includes('gateway timeout')
    );
  }

  // Dispatch error event for ErrorDisplay component
  private dispatchErrorEvent(type: string, message: string, statusCode?: number) {
    const errorEvent = new CustomEvent('asl-error', {
      detail: {
        type,
        message,
        timestamp: Date.now(),
        statusCode,
      },
    });
    window.dispatchEvent(errorEvent);
  }

  // نمایش خطاهای API
  handleApiError(error: any, fallbackMessage: string = 'خطای غیرمنتظره‌ای رخ داد', errorSource?: string) {
    console.error('API Error:', error);

    let errorMessage = fallbackMessage;
    let errorTitle = 'خطا';
    let duration = 5000;
    let errorType = 'unknown';
    let statusCode: number | undefined;

    try {
      // اگر خطا از backend آمده باشد
      if (error?.response?.data) {
        const data = error.response.data;
        errorMessage = this.extractErrorMessage(data);
        statusCode = error.response.status;

        // 🔇 فیلتر کردن خطاهای ثبت‌نام که باید سرکوب شوند
        // Pass errorSource to shouldSuppressError
        const url = errorSource || error?.config?.url || error?.request?.url || '';
        if (this.shouldSuppressError(errorMessage, statusCode, url)) {
          console.log('⏭️ Suppressing registration reminder error:', errorMessage);
          return errorMessage; // فقط return می‌کنیم، toast نمایش نمی‌دهیم
        }
        
        // تشخیص نوع خطا
        if (data.needs_auth || statusCode === 401) {
          errorType = 'auth';
          errorTitle = 'خطا در ورود';
          // Use the specific error message from backend instead of generic message
          errorMessage = this.extractErrorMessage(data);
        } else if (data.license_status) {
          errorType = 'license';
          errorTitle = 'مشکل لایسنس';
          if (data.license_status.needs_license) {
            errorMessage = 'برای دسترسی به این بخش نیاز به لایسنس معتبر دارید';
          }
        } else if (statusCode >= 500) {
          errorType = 'server';
          errorTitle = 'خطای سرور';
          // برای خطاهای 500، پیغام دقیق‌تری نمایش می‌دهیم
          if (errorMessage === 'خطا در دریافت پاسخ از سرور' || errorMessage === 'Internal server error') {
            errorMessage = 'مشکلی در پردازش درخواست شما پیش آمد. لطفاً دوباره تلاش کنید یا با پشتیبانی تماس بگیرید.';
          }
        } else if (statusCode >= 400) {
          errorType = 'validation';
          errorTitle = 'خطای اعتبارسنجی';
        }
      }
      // اگر خطا از fetch API آمده باشد
      else if (error?.message) {
        // خطاهای شبکه را به صورت silent مدیریت می‌کنیم
        if (error.message.includes('fetch') || 
            error.message.includes('NetworkError') || 
            error.message.includes('timeout') ||
            error.message.includes('Failed to fetch') ||
            error.message.includes('Network request failed')) {
          errorType = 'network';
          errorTitle = 'خطای اتصال';
          const urlNet = errorSource || '';
          if (this.shouldUseAiChatSoftMessage(urlNet, '', undefined, true)) {
            toast({
              variant: 'default',
              title: AI_CHAT_SOFT_TITLE,
              description: AI_CHAT_SOFT_DESCRIPTION,
              duration: 9000,
            });
            this.dispatchErrorEvent('network', AI_CHAT_SOFT_DESCRIPTION, 0);
            return AI_CHAT_SOFT_DESCRIPTION;
          }
          // فقط event dispatch می‌کنیم برای indicator، toast نمایش نمی‌دهیم
          this.dispatchErrorEvent(errorType, 'خطای شبکه', 0);
          return 'خطای شبکه'; // بدون نمایش toast
        } else {
          errorMessage = this.translateErrorMessage(error.message) || fallbackMessage;
        }
      }
      // اگر خطا string ساده باشد
      else if (typeof error === 'string') {
        errorMessage = this.translateErrorMessage(error) || fallbackMessage;
      }
    } catch (parseError) {
      console.error('Error parsing API error:', parseError);
      errorMessage = fallbackMessage;
    }

    const url = errorSource || error?.config?.url || error?.request?.url || '';
    const useAiSoft =
      this.shouldUseAiChatSoftMessage(url, errorMessage, statusCode, false);
    if (useAiSoft) {
      errorTitle = AI_CHAT_SOFT_TITLE;
      errorMessage = AI_CHAT_SOFT_DESCRIPTION;
    }

    // نمایش toast فقط برای خطاهای غیر شبکه
    if (errorType !== 'network') {
      toast({
        variant: useAiSoft ? 'default' : 'destructive',
        title: errorTitle,
        description: errorMessage,
        duration: useAiSoft ? 9000 : duration,
      });
    }

    // Dispatch error event for ErrorDisplay
    this.dispatchErrorEvent(errorType, errorMessage, statusCode);

    return errorMessage;
  }

  // بررسی اینکه آیا خطا باید سرکوب شود (برای یادآوری‌های ثبت‌نام)
  private shouldSuppressError(errorMessage: string, statusCode?: number, errorSource?: string): boolean {
    const messageLower = errorMessage.toLowerCase();
    const sourceLower = (errorSource || '').toLowerCase();
    
    // ⚠️ فقط خطاهای خاص ثبت‌نام و SpotPlayer را سرکوب می‌کنیم
    // بقیه خطاها باید به درستی نمایش داده شوند
    
    // 0️⃣ خطاهای SpotPlayer - همیشه suppress می‌شوند (فقط برای بخش آموزش است)
    if (sourceLower.includes('/spotplayer/license') || sourceLower.includes('spotplayer/license')) {
      console.log('🔇 Suppressing SpotPlayer license error (404 is normal - user may not have SpotPlayer license yet)');
      return true;
    }
    
    // 1️⃣ خطاهای دقیق ثبت‌نام (فارسی)
    const registrationPatternsFA = [
      'شما هنوز به عنوان ویزیتور ثبت‌نام نکرده',
      'شما هنوز به عنوان تأمین‌کننده ثبت‌نام نکرده',
      'شما هنوز به عنوان تامین کننده ثبت نام نکرده',
      'هنوز به عنوان ویزیتور ثبت‌نام نکرده‌اید',
      'هنوز به عنوان تأمین‌کننده ثبت‌نام نکرده‌اید',
    ];
    
    for (const pattern of registrationPatternsFA) {
      if (messageLower.includes(pattern.toLowerCase())) {
        console.log('🔇 Suppressing FA registration error:', errorMessage);
        return true;
      }
    }
    
    // 2️⃣ خطاهای 404 برای visitor/status و supplier/status - همیشه suppress می‌شوند
    if (statusCode === 404) {
      // Suppress 404 errors for registration status endpoints
      const registrationEndpoints = [
        '/visitor/status',
        '/supplier/status',
        'visitor/status',
        'supplier/status',
      ];
      
      // Check if error is from registration status endpoint
      if (errorSource && registrationEndpoints.some(endpoint => errorSource.includes(endpoint))) {
        console.log('🔇 Suppressing 404 registration status error');
        return true;
      }
      
      // Also check error message patterns
      const registrationPatternsEN = [
        'visitor not found',
        'supplier not found',
        'no visitor registration found',
        'no supplier registration found',
        'visitor registration not found',
        'supplier registration not found',
      ];
      
      for (const pattern of registrationPatternsEN) {
        if (messageLower === pattern.toLowerCase() || 
            messageLower.includes(pattern.toLowerCase() + '.') ||
            messageLower.includes(pattern.toLowerCase() + '!')) {
          console.log('🔇 Suppressing EN registration error (404):', errorMessage);
          return true;
        }
      }
    }
    
    // 3️⃣ خطاهای Token - وقتی کاربر به صفحه محافظت شده می‌رود
    const authHeaderPatterns = [
      'authorization token is required',
      'authorization header is required',
      'missing authorization header',
      'missing authorization',
      'no authorization header',
      'auth header required',
      'authentication header is required',
    ];
    
    // سرکوب خطاهای Authorization header (چون کاربر هنوز redirect می‌شود)
    for (const pattern of authHeaderPatterns) {
      if (messageLower.includes(pattern.toLowerCase())) {
        console.log('🔇 Suppressing auth header error (user will be redirected):', errorMessage);
        return true;
      }
    }
    
    // اگر token فقط expired است (نه missing) و کاربر لاگین بوده، نمایش بده
    const expiredTokenPatterns = [
      'token expired',
      'token invalid',
      'invalid token',
      'توکن منقضی',
    ];
    
    for (const pattern of expiredTokenPatterns) {
      if (messageLower.includes(pattern.toLowerCase())) {
        // این یکی را نمایش می‌دهیم (return false)
        return false;
      }
    }
    
    // 4️⃣ بقیه خطاها را نمایش بده (return false)
    return false;
  }

  // استخراج پیام خطا از response
  private extractErrorMessage(data: any): string {
    // اولویت پیام‌ها
    if (data.error && typeof data.error === 'string') {
      return data.error;
    }
    if (data.message && typeof data.message === 'string') {
      return data.message;
    }
    if (data.details && typeof data.details === 'string') {
      return data.details;
    }
    
    // اگر error object باشد
    if (data.error && typeof data.error === 'object') {
      if (data.error.message) {
        return data.error.message;
      }
      if (data.error.details) {
        return data.error.details;
      }
    }

    return 'خطای نامشخص از سرور';
  }

  // ترجمه پیام‌های خطای انگلیسی به فارسی
  private translateErrorMessage(message: string): string | null {
    const errorTranslations: { [key: string]: string } = {
      // Network errors
      'Failed to fetch': 'اتصال به سرور برقرار نشد',
      'Network error': 'خطای شبکه',
      'Connection failed': 'اتصال ناموفق',
      'Timeout': 'زمان انتظار تمام شد',
      'Request timeout': 'درخواست زمان زیادی طول کشید',
      
      // Authentication errors
      'Unauthorized': 'دسترسی غیرمجاز',
      'Invalid token': 'توکن نامعتبر',
      'Token expired': 'توکن منقضی شده',
      'Authentication required': 'نیاز به احراز هویت',
      'Access denied': 'دسترسی رد شد',
      
      // License errors
      'License required': 'نیاز به لایسنس',
      'Invalid license': 'لایسنس نامعتبر',
      'License expired': 'لایسنس منقضی شده',
      'License already used': 'لایسنس قبلاً استفاده شده',
      
      // Validation errors
      'Validation failed': 'اعتبارسنجی ناموفق',
      'Invalid input': 'ورودی نامعتبر',
      'Required field missing': 'فیلد الزامی وارد نشده',
      'Invalid email format': 'فرمت ایمیل نامعتبر',
      'Password too short': 'رمز عبور خیلی کوتاه است',
      
      // Server errors
      'Internal server error': 'خطای داخلی سرور',
      'Service unavailable': 'سرویس در دسترس نیست',
      'Bad gateway': 'دروازه نامعتبر',
      'Server timeout': 'زمان انتظار سرور تمام شد',
      
      // Database errors
      'Database error': 'خطای پایگاه داده',
      'Connection to database failed': 'اتصال به پایگاه داده ناموفق',
      'Record not found': 'رکورد یافت نشد',
      'Duplicate entry': 'ورودی تکراری',
      
      // Generic errors
      'Something went wrong': 'مشکلی پیش آمد',
      'Unknown error': 'خطای نامشخص',
      'Operation failed': 'عملیات ناموفق',
    };

    // جستجوی دقیق
    if (errorTranslations[message]) {
      return errorTranslations[message];
    }

    // جستجوی تقریبی
    for (const [englishError, persianError] of Object.entries(errorTranslations)) {
      if (message.toLowerCase().includes(englishError.toLowerCase())) {
        return persianError;
      }
    }

    return null;
  }

  // نمایش خطاهای موفقیت‌آمیز
  showSuccess(message: string, title: string = 'موفقیت‌آمیز') {
    toast({
      title: title,
      description: message,
      duration: 3000,
    });
  }

  // نمایش اطلاعات
  showInfo(message: string, title: string = 'اطلاعات') {
    toast({
      title: title,
      description: message,
      duration: 4000,
    });
  }

  // نمایش هشدار
  showWarning(message: string, title: string = 'هشدار') {
    toast({
      variant: "destructive",
      title: title,
      description: message,
      duration: 6000,
    });
  }

  // مدیریت خطاهای مربوط به لایسنس
  handleLicenseError(error: any) {
    if (error?.response?.data?.license_status) {
      const status = error.response.data.license_status;
      
      if (status.needs_license) {
        this.showWarning(
          'برای دسترسی به این بخش نیاز به لایسنس معتبر دارید. لطفا ابتدا لایسنس خود را فعال کنید.',
          'نیاز به لایسنس'
        );
        return true;
      }
      
      if (!status.is_approved) {
        this.showWarning(
          'لایسنس شما هنوز تأیید نشده است. لطفا منتظر تأیید ادمین باشید.',
          'لایسنس در انتظار تأیید'
        );
        return true;
      }
    }
    
    return false;
  }

  // مدیریت خطاهای مربوط به احراز هویت
  handleAuthError(error: any) {
    if (error?.response?.data?.needs_auth || 
        error?.response?.status === 401) {
      // Use the specific error message from backend
      const errorMessage = this.extractErrorMessage(error?.response?.data || error);
      this.showWarning(
        errorMessage,
        'خطا در ورود'
      );
      
      // می‌توان redirect به صفحه login اضافه کرد
      // window.location.href = '/login';
      
      return true;
    }
    
    return false;
  }

  // گرفتن اطلاعات خطا برای logging
  getErrorInfo(error: any): ErrorResponse {
    return {
      error: this.extractErrorMessage(error?.response?.data || error) || 'Unknown error',
      details: error?.response?.data?.details || error?.stack || undefined,
      code: error?.code || error?.response?.data?.code || undefined,
      statusCode: error?.response?.status || undefined,
    };
  }
}

export const errorHandler = new ErrorHandler();