# 🚨 راهنمای سیستم مدیریت خطا

سیستم جامع مدیریت و نمایش خطاهای backend و frontend

## 🎯 **امکانات:**

### ✅ **نمایش خطاهای Backend**
- تشخیص خودکار نوع خطا (شبکه، احراز هویت، لایسنس، سرور)
- ترجمه پیام‌های انگلیسی به فارسی
- نمایش کد وضعیت HTTP
- مدیریت خطاهای خاص (401، 403، 500، ...)

### ✅ **نمایش خطاهای Frontend**
- ErrorBoundary برای خطاهای React
- مدیریت خطاهای شبکه
- نمایش وضعیت اتصال اینترنت
- بازیابی خودکار در صورت امکان

### ✅ **رابط کاربری یکپارچه**
- Toast notifications برای خطاهای فوری
- ErrorDisplay برای نمایش مداوم خطاها
- دکمه‌های retry و refresh
- آیکون‌های متناسب با نوع خطا

## 🛠️ **نحوه استفاده:**

### 1️⃣ **استفاده از Error Handler:**

```typescript
import { errorHandler } from '@/utils/errorHandler';

// مدیریت خطاهای API
try {
  const data = await apiService.getData();
} catch (error) {
  errorHandler.handleApiError(error, 'خطا در دریافت اطلاعات');
}

// نمایش پیام‌های مختلف
errorHandler.showSuccess('عملیات موفق!');
errorHandler.showWarning('هشدار!');
errorHandler.showInfo('اطلاعات');
```

### 2️⃣ **استفاده از Hook:**

```typescript
import { useErrorHandler } from '@/components/ErrorBoundary';

const { handleError, handleSuccess } = useErrorHandler();

const handleSubmit = async () => {
  try {
    await apiCall();
    handleSuccess('موفقیت‌آمیز!');
  } catch (error) {
    handleError(error, 'خطا در عملیات');
  }
};
```

### 3️⃣ **اضافه کردن ErrorDisplay:**

```typescript
import { ErrorDisplay } from '@/components/ErrorDisplay';

const MyComponent = () => (
  <div>
    <ErrorDisplay onRetry={retryFunction} />
    {/* محتوای کامپوننت */}
  </div>
);
```

## 📊 **انواع خطاها:**

| نوع | آیکون | رنگ | کاربرد |
|-----|--------|-----|--------|
| `network` | 📶 | قرمز | خطاهای شبکه و اتصال |
| `auth` | 👤 | نارنجی | مشکلات احراز هویت |
| `license` | 🛡️ | آبی | مسائل مربوط به لایسنس |
| `server` | 🖥️ | بنفش | خطاهای سرور (5xx) |
| `validation` | ⚠️ | زرد | خطاهای اعتبارسنجی (4xx) |
| `unknown` | ❗ | خاکستری | خطاهای نامشخص |

## 🔧 **تنظیمات:**

### **ترجمه خطاها:**
فایل `errorHandler.ts` حاوی دیکشنری ترجمه‌هاست:

```typescript
const errorTranslations = {
  'Failed to fetch': 'اتصال به سرور برقرار نشد',
  'Unauthorized': 'دسترسی غیرمجاز',
  // ...
};
```

### **ErrorBoundary:**
خطاهای React را مدیریت می‌کند و UI مناسب نمایش می‌دهد:

```typescript
<ErrorBoundary fallback={<CustomErrorUI />}>
  <App />
</ErrorBoundary>
```

### **ErrorDisplay:**
کامپوننت قابل استفاده در صفحات:

```typescript
<ErrorDisplay 
  onRetry={refetchData}
  showConnectionStatus={true}
  className="mb-4"
/>
```

## 🧪 **تست در Development:**

1. **ErrorTestPanel** در محیط development فعال است
2. دکمه "Error Test" در پایین راست صفحه
3. امکان تست انواع مختلف خطا
4. نمایش جزئیات خطا در console

## 🎨 **سفارشی‌سازی:**

### **اضافه کردن نوع خطای جدید:**

```typescript
// در errorHandler.ts
private dispatchErrorEvent(type: 'custom', message: string) {
  // ...
}

// در ErrorDisplay.tsx
const getErrorIcon = (type: string) => {
  switch (type) {
    case 'custom':
      return <CustomIcon className="h-4 w-4" />;
    // ...
  }
};
```

### **تغییر استایل:**

```typescript
// استفاده از className برای سفارشی‌سازی
<ErrorDisplay className="custom-error-style" />
```

## 🔄 **Best Practices:**

1. **همیشه از errorHandler استفاده کنید** به جای console.error
2. **پیام‌های فارسی** برای کاربران ایرانی
3. **Fallback messages** برای حالت‌هایی که ترجمه وجود ندارد
4. **Retry mechanisms** برای خطاهای موقت
5. **Graceful degradation** در صورت خطا

## 📱 **مثال کامل:**

```typescript
import { useState } from 'react';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { useErrorHandler } from '@/components/ErrorBoundary';

const DataComponent = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const { handleError, handleSuccess } = useErrorHandler();

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await apiService.getData();
      setData(result);
      handleSuccess('اطلاعات با موفقیت دریافت شد');
    } catch (error) {
      handleError(error, 'خطا در دریافت اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <ErrorDisplay onRetry={fetchData} />
      {/* UI اصلی */}
    </div>
  );
};
```

---

**نکته:** سیستم به صورت خودکار خطاهای API را مدیریت می‌کند، اما می‌توانید رفتار آن را سفارشی کنید.