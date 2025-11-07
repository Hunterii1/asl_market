import { useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

type ReminderType = 'visitor' | 'supplier';

interface ReminderOptions {
  type: ReminderType;
  shouldShow: boolean;
  onNavigate?: () => void;
}

/**
 * Custom hook برای نمایش یادآوری ثبت‌نام به عنوان ویزیتور یا تأمین‌کننده
 * این hook فقط یک بار در روز یادآوری را نمایش می‌دهد
 */
export const useRegistrationReminder = ({ type, shouldShow, onNavigate }: ReminderOptions) => {
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!shouldShow) return;

    const storageKey = `registration_reminder_${type}`;
    const lastShown = localStorage.getItem(storageKey);
    const now = Date.now();
    const oneDayInMs = 24 * 60 * 60 * 1000; // 24 ساعت

    // بررسی اینکه آیا از آخرین بار نمایش 24 ساعت گذشته است
    if (lastShown && now - parseInt(lastShown) < oneDayInMs) {
      return; // هنوز 24 ساعت نگذشته، یادآوری نشان نده
    }

    // نمایش یادآوری با تاخیر کوتاه برای UX بهتر
    const timeoutId = setTimeout(() => {
      const message = type === 'visitor' 
        ? 'یادآوری: شما هنوز به عنوان ویزیتور ثبت‌نام نکرده‌اید 🔔'
        : 'یادآوری: شما هنوز به عنوان تأمین‌کننده ثبت‌نام نکرده‌اید 🔔';

      const description = type === 'visitor'
        ? 'برای دسترسی به لیست ویزیتورها و استفاده کامل از امکانات، ثبت‌نام کنید.'
        : 'برای معرفی محصولات خود و استفاده کامل از امکانات، ثبت‌نام کنید.';

      const actionLabel = type === 'visitor'
        ? 'ثبت‌نام ویزیتور'
        : 'ثبت‌نام تأمین‌کننده';

      const actionPath = type === 'visitor'
        ? '/visitor-registration'
        : '/supplier-registration';

      toast.info(message, {
        description,
        duration: 8000,
        action: {
          label: actionLabel,
          onClick: () => {
            if (onNavigate) {
              onNavigate();
            } else {
              navigate(actionPath);
            }
          },
        },
        style: {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none',
          color: 'white',
        },
        className: 'registration-reminder-toast',
      });

      // ذخیره زمان نمایش
      localStorage.setItem(storageKey, now.toString());
    }, 1500); // تاخیر 1.5 ثانیه

    return () => clearTimeout(timeoutId);
  }, [type, shouldShow, navigate, onNavigate]);
};

/**
 * تابع کمکی برای حذف یادآوری‌های ذخیره شده
 * (در صورت نیاز برای تست یا ریست)
 */
export const clearRegistrationReminders = () => {
  localStorage.removeItem('registration_reminder_visitor');
  localStorage.removeItem('registration_reminder_supplier');
};

/**
 * تابع کمکی برای بررسی اینکه آیا یادآوری باید نمایش داده شود
 */
export const shouldShowReminder = (type: ReminderType): boolean => {
  const storageKey = `registration_reminder_${type}`;
  const lastShown = localStorage.getItem(storageKey);
  
  if (!lastShown) return true;
  
  const now = Date.now();
  const oneDayInMs = 24 * 60 * 60 * 1000;
  
  return now - parseInt(lastShown) >= oneDayInMs;
};
