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

class ErrorHandler {
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
  handleApiError(error: any, fallbackMessage: string = 'خطای غیرمنتظره‌ای رخ داد') {
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
        } else if (statusCode >= 400) {
          errorType = 'validation';
          errorTitle = 'خطای اعتبارسنجی';
        }
      }
      // اگر خطا از fetch API آمده باشد
      else if (error?.message) {
        if (error.message.includes('fetch')) {
          errorType = 'network';
          errorTitle = 'خطای شبکه';
          errorMessage = 'اتصال به سرور برقرار نشد. لطفا اتصال اینترنت خود را بررسی کنید.';
          duration = 8000;
        } else if (error.message.includes('NetworkError')) {
          errorType = 'network';
          errorTitle = 'خطای شبکه';
          errorMessage = 'مشکل در شبکه. لطفا دوباره تلاش کنید.';
        } else if (error.message.includes('timeout')) {
          errorType = 'network';
          errorTitle = 'خطای زمان';
          errorMessage = 'درخواست زمان زیادی طول کشید. لطفا دوباره تلاش کنید.';
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

    // نمایش toast
    toast({
      variant: "destructive",
      title: errorTitle,
      description: errorMessage,
      duration: duration,
    });

    // Dispatch error event for ErrorDisplay
    this.dispatchErrorEvent(errorType, errorMessage, statusCode);

    return errorMessage;
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