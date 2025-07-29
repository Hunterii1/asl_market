// Persian error message translations
const errorTranslations: Record<string, string> = {
  // Network errors
  'Failed to fetch': 'خطا در ارتباط با سرور',
  'Network error': 'خطا در شبکه',
  'Connection failed': 'اتصال برقرار نشد',
  'Request failed': 'درخواست انجام نشد',
  'Timeout': 'زمان انتظار تمام شد',
  
  // API errors
  'User not authenticated': 'کاربر وارد نشده است',
  'User not found': 'کاربر یافت نشد',
  'Invalid credentials': 'نام کاربری یا رمز عبور اشتباه است',
  'Email already exists': 'این ایمیل قبلاً ثبت شده است',
  'Chat not found': 'مکالمه یافت نشد',
  'Invalid request format': 'فرمت درخواست نامعتبر است',
  'Failed to save user message': 'ذخیره پیام کاربر انجام نشد',
  'Failed to get AI response': 'دریافت پاسخ هوش مصنوعی انجام نشد',
  'Failed to create chat': 'ایجاد مکالمه انجام نشد',
  'Failed to load chat': 'بارگذاری مکالمه انجام نشد',
  'Failed to delete chat': 'حذف مکالمه انجام نشد',
  'Failed to load chats': 'بارگذاری لیست مکالمات انجام نشد',
  
  // Validation errors
  'Email is required': 'ایمیل الزامی است',
  'Password is required': 'رمز عبور الزامی است',
  'First name is required': 'نام الزامی است',
  'Last name is required': 'نام خانوادگی الزامی است',
  'Message is required': 'پیام الزامی است',
  'Invalid email format': 'فرمت ایمیل نامعتبر است',
  'Password too short': 'رمز عبور باید حداقل ۶ کاراکتر باشد',
  
  // General errors
  'Something went wrong': 'خطایی رخ داده است',
  'Please try again': 'لطفاً دوباره تلاش کنید',
  'Server error': 'خطای سرور',
  'Access denied': 'دسترسی مجاز نیست',
  'Not found': 'یافت نشد',
  'Bad request': 'درخواست نامعتبر',
  'Unauthorized': 'غیرمجاز',
  'Forbidden': 'ممنوع',  
  'Internal server error': 'خطای داخلی سرور',
  'Service unavailable': 'سرویس در دسترس نیست',
  'Request timeout': 'زمان انتظار درخواست تمام شد',
};

// Success message translations
const successTranslations: Record<string, string> = {
  'Login successful': 'ورود موفقیت‌آمیز',
  'Registration successful': 'ثبت‌نام موفقیت‌آمیز',
  'Message sent': 'پیام ارسال شد',
  'Chat created': 'مکالمه ایجاد شد',
  'Chat deleted': 'مکالمه حذف شد',
  'Profile updated': 'پروفایل به‌روزرسانی شد',
  'Password changed': 'رمز عبور تغییر کرد',
  'Settings saved': 'تنظیمات ذخیره شد',
};

/**
 * Translates error messages to Persian
 */
export function translateError(error: string): string {
  // Clean up the error message
  const cleanError = error.trim();
  
  // Check for exact matches
  if (errorTranslations[cleanError]) {
    return errorTranslations[cleanError];
  }
  
  // Check for partial matches
  for (const [key, value] of Object.entries(errorTranslations)) {
    if (cleanError.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  
  // Return default Persian error message if no translation found
  return 'خطایی رخ داده است. لطفاً دوباره تلاش کنید.';
}

/**
 * Translates success messages to Persian
 */
export function translateSuccess(message: string): string {
  const cleanMessage = message.trim();
  
  if (successTranslations[cleanMessage]) {
    return successTranslations[cleanMessage];
  }
  
  // Check for partial matches
  for (const [key, value] of Object.entries(successTranslations)) {
    if (cleanMessage.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  
  return cleanMessage; // Return original if no translation found
}

/**
 * Gets user-friendly error message from various error types
 */
export function getErrorMessage(error: any): string {
  let message = '';
  
  if (typeof error === 'string') {
    message = error;
  } else if (error?.message) {
    message = error.message;
  } else if (error?.error) {
    message = error.error;
  } else if (error?.detail) {
    message = error.detail;
  } else {
    message = 'Something went wrong';
  }
  
  return translateError(message);
} 