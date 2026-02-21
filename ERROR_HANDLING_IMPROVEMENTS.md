# بهبود مدیریت خطاها (Error Handling Improvements)

## مشکلات قبلی

1. **خطاهای 500 زیاد**: کاربران مدام خطای 500 می‌دیدند که باعث نارضایتی می‌شد
2. **پیغام‌های مبهم**: پیغام‌های خطا عمومی و غیرقابل فهم بودند (مثل "خطا در ایجاد کاربر")
3. **Toast های مزاحم**: وقتی اینترنت قطع می‌شد، تند تند toast های "اختلال در اینترنت ملی" نمایش داده می‌شد

## تغییرات انجام شده

### 1. Frontend - مدیریت خطاهای شبکه (Silent Network Errors)

**فایل:** `src/utils/errorHandler.ts`

#### تغییرات:
- ✅ **خطاهای شبکه دیگر toast نمایش نمی‌دهند**
- ✅ فقط indicator قرمز پایین صفحه نشان داده می‌شود
- ✅ پیغام‌های خطای 500 بهبود یافته و دقیق‌تر شده‌اند

```typescript
// خطاهای شبکه را به صورت silent مدیریت می‌کنیم
if (error.message.includes('fetch') || 
    error.message.includes('NetworkError') || 
    error.message.includes('timeout') ||
    error.message.includes('Failed to fetch') ||
    error.message.includes('Network request failed')) {
  errorType = 'network';
  // فقط event dispatch می‌کنیم برای indicator، toast نمایش نمی‌دهیم
  this.dispatchErrorEvent(errorType, 'خطای شبکه', 0);
  return 'خطای شبکه'; // بدون نمایش toast
}
```

#### بهبود پیغام‌های 500:
```typescript
} else if (statusCode >= 500) {
  errorType = 'server';
  errorTitle = 'خطای سرور';
  // برای خطاهای 500، پیغام دقیق‌تری نمایش می‌دهیم
  if (errorMessage === 'خطا در دریافت پاسخ از سرور' || errorMessage === 'Internal server error') {
    errorMessage = 'مشکلی در پردازش درخواست شما پیش آمد. لطفاً دوباره تلاش کنید یا با پشتیبانی تماس بگیرید.';
  }
}
```

### 2. Backend - پیغام‌های خطای دقیق‌تر

**فایل جدید:** `backend/middleware/error_handler.go`

این middleware خطاهای عمومی را به پیغام‌های دقیق و کاربرپسند تبدیل می‌کند:

#### مثال‌ها:

| خطای Database | پیغام کاربرپسند |
|--------------|-----------------|
| `Duplicate entry 'email'` | "این ایمیل قبلاً ثبت شده است. لطفاً از ایمیل دیگری استفاده کنید." |
| `Duplicate entry 'phone'` | "این شماره موبایل قبلاً ثبت شده است. لطفاً از شماره دیگری استفاده کنید." |
| `Foreign key constraint` | "اطلاعات وارد شده با سایر رکوردها سازگار نیست. لطفاً اطلاعات را بررسی کنید." |
| `Connection timeout` | "مشکل در اتصال به پایگاه داده. لطفاً چند لحظه دیگر مجدداً تلاش کنید." |
| `Record not found` | "کاربر مورد نظر یافت نشد." |
| `File too large` | "حجم فایل بیش از حد مجاز است. لطفاً فایل کوچکتری انتخاب کنید." |

#### استفاده در کنترلرها:

**قبل:**
```go
if err := ac.DB.Create(&user).Error; err != nil {
    c.JSON(http.StatusInternalServerError, gin.H{
        "error": "خطا در ایجاد کاربر",
    })
    return
}
```

**بعد:**
```go
if err := ac.DB.Create(&user).Error; err != nil {
    middleware.RespondWithError(c, http.StatusInternalServerError, "خطا در ایجاد کاربر", err, "register_user")
    return
}
```

### 3. Backend - ایمیل اختیاری (Email Optional Fix)

**فایل:** `backend/controllers/auth_controller.go`

```go
// If email is empty, generate a fake email using phone number
email := req.Email
if email == "" {
    email = "user_" + req.Phone + "@aslmarket.local"
}
```

این تغییر باعث می‌شود کاربران بدون ایمیل هم بتوانند ثبت‌نام کنند.

## نتایج

### ✅ بهبودها:

1. **تجربه کاربری بهتر**:
   - دیگر toast های مزاحم برای خطاهای شبکه نمایش داده نمی‌شود
   - فقط indicator قرمز پایین صفحه نشان داده می‌شود

2. **پیغام‌های واضح‌تر**:
   - کاربر دقیقاً می‌فهمد مشکل از کجاست
   - راهنمایی برای حل مشکل ارائه می‌شود

3. **کاهش خطاهای 500**:
   - مشکل ایمیل اختیاری حل شد
   - خطاهای database به صورت دقیق‌تر مدیریت می‌شوند

4. **Logging بهتر**:
   - خطاها در سرور log می‌شوند برای debugging
   - اما به کاربر پیغام کاربرپسند نمایش داده می‌شود

## استفاده در سایر کنترلرها

برای استفاده از error handler جدید در سایر کنترلرها:

```go
import "asl-market-backend/middleware"

// بجای:
c.JSON(http.StatusInternalServerError, gin.H{"error": "خطای عمومی"})

// استفاده کنید از:
middleware.RespondWithError(c, http.StatusInternalServerError, "خطای عمومی", err, "context_name")
```

## تست کردن

### 1. تست خطای شبکه:
- اینترنت رو قطع کن
- سعی کن یه عملیات انجام بدی
- **نتیجه**: فقط indicator قرمز نمایش داده می‌شود، toast نمایش داده نمی‌شود

### 2. تست ثبت‌نام بدون ایمیل:
- برو به صفحه ثبت‌نام
- فقط نام، نام خانوادگی، شماره تلفن و رمز عبور وارد کن
- **نتیجه**: ثبت‌نام موفق می‌شود

### 3. تست خطای duplicate:
- سعی کن با یه شماره تلفن که قبلاً ثبت شده ثبت‌نام کنی
- **نتیجه**: پیغام دقیق "این شماره موبایل قبلاً ثبت شده است" نمایش داده می‌شود

## نکات مهم

- ⚠️ خطاهای شبکه silent هستند اما event dispatch می‌شوند برای indicator
- ⚠️ خطاهای 500 همچنان log می‌شوند در سرور برای debugging
- ⚠️ پیغام‌های خطا به فارسی و کاربرپسند هستند
- ⚠️ برای استفاده کامل، باید سایر کنترلرها هم آپدیت شوند

## TODO (اختیاری)

برای بهبود بیشتر، می‌توانید:

1. سایر کنترلرها را هم آپدیت کنید تا از `middleware.RespondWithError` استفاده کنند
2. یک سیستم logging متمرکز برای خطاها ایجاد کنید
3. یک dashboard برای monitoring خطاها بسازید
