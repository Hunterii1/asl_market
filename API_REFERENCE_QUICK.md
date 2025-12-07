# 📡 مرجع سریع API های ASL Market

## 🔐 احراز هویت

```
POST   /api/v1/auth/register          - ثبت‌نام
POST   /api/v1/auth/login             - ورود
POST   /api/v1/auth/forgot-password   - بازیابی رمز
POST   /api/v1/auth/reset-password    - تغییر رمز
GET    /api/v1/me                     - اطلاعات کاربر فعلی
PUT    /api/v1/profile                - ویرایش پروفایل
```

---

## 🔑 لایسنس

```
POST   /api/v1/license/verify        - فعال‌سازی لایسنس
GET    /api/v1/license/status         - بررسی وضعیت لایسنس
GET    /api/v1/license/info           - اطلاعات لایسنس
POST   /api/v1/license/refresh        - به‌روزرسانی لایسنس
```

---

## 📊 داشبورد

```
GET    /api/v1/dashboard              - داشبورد کاربر
GET    /api/v1/dashboard/stats         - آمار عمومی
GET    /api/v1/progress                - پیشرفت کاربر
POST   /api/v1/progress/update         - به‌روزرسانی پیشرفت
```

---

## 🏪 تأمین‌کنندگان

```
POST   /api/v1/supplier/register      - ثبت‌نام تأمین‌کننده
PUT    /api/v1/supplier/update         - ویرایش تأمین‌کننده
DELETE /api/v1/supplier/delete         - حذف تأمین‌کننده
GET    /api/v1/supplier/status         - وضعیت ثبت‌نام
GET    /api/v1/suppliers               - لیست تأمین‌کنندگان تأیید شده
GET    /api/v1/daily-limits/supplier-permission - بررسی مجوز مشاهده
POST   /api/v1/contact/view            - مشاهده اطلاعات تماس
```

---

## 🚶 ویزیتورها

```
POST   /api/v1/visitor/register        - ثبت‌نام ویزیتور
PUT    /api/v1/visitor/update          - ویرایش ویزیتور
DELETE /api/v1/visitor/delete           - حذف ویزیتور
GET    /api/v1/visitor/status           - وضعیت ثبت‌نام
GET    /api/v1/visitors                 - لیست ویزیتورهای تأیید شده
GET    /api/v1/daily-limits/visitor-permission - بررسی مجوز مشاهده
```

---

## 🔬 محصولات تحقیقی

```
GET    /api/v1/research-products       - لیست محصولات
GET    /api/v1/research-products/active - محصولات فعال
GET    /api/v1/research-products/categories - دسته‌بندی‌ها
GET    /api/v1/research-products/:id   - جزئیات محصول
```

---

## 📦 کالاهای موجود

```
GET    /api/v1/available-products      - لیست کالاها
GET    /api/v1/available-products/categories - دسته‌بندی‌ها
GET    /api/v1/available-products/featured - کالاهای برگزیده
GET    /api/v1/available-products/hot-deals - پیشنهادهای ویژه
GET    /api/v1/available-products/:id  - جزئیات کالا
GET    /api/v1/my-products             - کالاهای کاربر
GET    /api/v1/my-products/:id         - جزئیات کالای کاربر
PUT    /api/v1/my-products/:id         - ویرایش کالا
DELETE /api/v1/my-products/:id         - حذف کالا
POST   /api/v1/submit-product           - ثبت کالا
```

---

## 🎓 آموزش

```
GET    /api/v1/training/categories     - دسته‌بندی‌ها
GET    /api/v1/training/videos          - لیست ویدیوها
GET    /api/v1/training/category/:id/videos - ویدیوهای یک دسته
GET    /api/v1/training/video/:id       - جزئیات ویدیو
GET    /api/v1/training/videos/search   - جستجوی ویدیو
GET    /api/v1/training/stats           - آمار آموزش
POST   /api/v1/training/video/:id/watch - ثبت تماشا
GET    /api/v1/training/watched-videos  - ویدیوهای تماشا شده
GET    /api/v1/training/watch-stats    - آمار تماشا
GET    /api/v1/training/video/:id/stream - استریم ویدیو
```

---

## 🤖 هوش مصنوعی

```
POST   /api/v1/ai/chat                 - ارسال پیام
GET    /api/v1/ai/chats                 - لیست چت‌ها
GET    /api/v1/ai/chats/:id            - جزئیات چت
DELETE /api/v1/ai/chats/:id             - حذف چت
GET    /api/v1/ai/usage                - آمار استفاده
```

---

## 💰 برداشت پول

```
POST   /api/v1/withdrawal/request      - ثبت درخواست
GET    /api/v1/withdrawal/requests     - لیست درخواست‌ها
GET    /api/v1/withdrawal/request/:id   - جزئیات درخواست
POST   /api/v1/withdrawal/receipt/:id   - آپلود رسید
GET    /api/v1/withdrawal/stats         - آمار برداشت‌ها
```

---

## 🔔 نوتیفیکیشن

```
GET    /api/v1/notifications            - لیست نوتیفیکیشن‌ها
GET    /api/v1/notifications/:id        - جزئیات نوتیفیکیشن
POST   /api/v1/notifications/:id/read   - علامت‌گذاری خوانده شده
POST   /api/v1/notifications/read-all  - علامت‌گذاری همه
GET    /api/v1/notifications/unread-count - تعداد خوانده نشده
```

---

## 🎫 تیکت پشتیبانی

```
POST   /api/v1/support/tickets          - ثبت تیکت
GET    /api/v1/support/tickets          - لیست تیکت‌ها
GET    /api/v1/support/tickets/:id      - جزئیات تیکت
POST   /api/v1/support/tickets/:id/messages - افزودن پیام
POST   /api/v1/support/tickets/:id/close - بستن تیکت
```

---

## 📤 آپلود

```
POST   /api/v1/upload/supplier-image    - آپلود تصویر تأمین‌کننده
POST   /api/v1/upload/product-image    - آپلود تصویر محصول
POST   /api/v1/upload/product-images    - آپلود چند تصویر
POST   /api/v1/upload/delete-image      - حذف تصویر
```

---

## 📢 پاپ‌آپ تبلیغاتی

```
GET    /api/v1/marketing-popups/active - پاپ‌آپ فعال
POST   /api/v1/marketing-popups/:id/click - ثبت کلیک
```

---

## 🌐 ثبت‌نام عمومی

```
POST   /api/v1/public/supplier/register - ثبت‌نام تأمین‌کننده عمومی
POST   /api/v1/public/visitor/register - ثبت‌نام ویزیتور عمومی
GET    /api/v1/public/registration-status - وضعیت ثبت‌نام
```

---

## 📊 محدودیت‌های روزانه

```
GET    /api/v1/daily-limits             - وضعیت محدودیت‌ها
GET    /api/v1/daily-limits/visitor-permission - مجوز مشاهده ویزیتور
GET    /api/v1/daily-limits/supplier-permission - مجوز مشاهده تأمین‌کننده
```

---

## 📞 اطلاعات تماس

```
GET    /api/v1/contact-limits           - محدودیت‌های تماس
POST   /api/v1/contact/view             - مشاهده اطلاعات تماس
GET    /api/v1/contact/history          - تاریخچه تماس‌ها
GET    /api/v1/contact/check/:type/:id  - بررسی امکان مشاهده
```

---

## 🔄 ارتقا لایسنس

```
POST   /api/v1/upgrade/request          - درخواست ارتقا
GET    /api/v1/upgrade/requests         - لیست درخواست‌های کاربر
```

---

## 🎬 SpotPlayer

```
POST   /api/v1/spotplayer/generate-license - تولید لایسنس SpotPlayer
GET    /api/v1/spotplayer/license        - دریافت لایسنس SpotPlayer
```

---

## 📝 نکات مهم

### احراز هویت
- تمام API های محافظت شده نیاز به Header دارند:
  ```
  Authorization: Bearer {token}
  ```

### فرمت درخواست
- برای JSON: `Content-Type: application/json`
- برای FormData: `Content-Type: multipart/form-data`

### فرمت پاسخ
**موفقیت:**
```json
{
  "message": "پیام",
  "data": { ... }
}
```

**خطا:**
```json
{
  "error": "پیام خطا",
  "details": "جزئیات"
}
```

### کدهای وضعیت
- `200` - موفقیت
- `201` - ایجاد موفق
- `400` - درخواست نامعتبر
- `401` - عدم احراز هویت
- `403` - عدم دسترسی
- `404` - یافت نشد
- `500` - خطای سرور

### صفحه‌بندی
- پارامترها: `page` و `per_page`
- مثال: `?page=1&per_page=10`

---

## 🔗 Base URL

- **Development**: `http://localhost:8080/api/v1`
- **Production**: `https://asllmarket.com/backend/api/v1`

---

**موفق باشید! 🚀**

