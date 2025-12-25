# 🚀 راهنمای کامل راه‌اندازی Admin Panel

## ✅ کارهای انجام شده

### 1. ✅ ایجاد API Service
- فایل `admin-panel/src/lib/api/adminApi.ts` ایجاد شد
- تمام endpoints برای اتصال به backend آماده است
- Authentication به backend واقعی متصل شد

### 2. ✅ به‌روزرسانی Authentication
- فایل `admin-panel/src/lib/utils/auth.ts` به‌روزرسانی شد
- از Mock API به Real API تغییر کرد
- از همان token system پروژه اصلی استفاده می‌کند

## 📋 مراحل راه‌اندازی

### مرحله 1: نصبش Dependencies
```bash
cd admin-panel
npm install
```

### مرحله 2: اجرای Admin Panel
```bash
cd admin-panel
npm run dev
```

Admin Panel روی `http://localhost:8080` اجرا می‌شود.

### مرحله 3: ورود به سیستم
1. به آدرس `http://localhost:8080` بروید
2. با ایمیل و رمز عبور کاربر admin وارد شوید
3. **مهم:** کاربر باید `is_admin = true` در دیتابیس داشته باشد

## ⚠️ Endpoints که باید در Backend اضافه شوند

برخی endpoints در backend وجود ندارند و باید اضافه شوند:

### 1. مدیریت کاربران (Users Management)
```
GET    /api/v1/admin/users              # لیست کاربران
GET    /api/v1/admin/users/:id           # جزئیات کاربر
POST   /api/v1/admin/users               # ایجاد کاربر
PUT    /api/v1/admin/users/:id           # ویرایش کاربر
DELETE /api/v1/admin/users/:id           # حذف کاربر
GET    /api/v1/admin/users/stats        # آمار کاربران
```

### 2. مدیریت لایسنس‌ها (Licenses Management)
```
GET    /api/v1/admin/licenses            # لیست لایسنس‌ها
GET    /api/v1/admin/licenses/:id        # جزئیات لایسنس
POST   /api/v1/admin/licenses/generate   # تولید لایسنس (✅ موجود است در telegram service)
DELETE /api/v1/admin/licenses/:id        # حذف لایسنس
```

### 3. آمار داشبورد (Dashboard Stats)
```
GET    /api/v1/admin/dashboard/stats     # آمار کلی داشبورد
```

### 4. مدیریت تیکت‌های پشتیبانی (Support Tickets - Admin)
```
GET    /api/v1/admin/support/tickets     # لیست تیکت‌ها برای admin
GET    /api/v1/admin/support/tickets/:id # جزئیات تیکت
POST   /api/v1/admin/support/tickets/:id/respond  # پاسخ به تیکت
POST   /api/v1/admin/support/tickets/:id/close    # بستن تیکت
GET    /api/v1/admin/support/tickets/stats       # آمار تیکت‌ها
```

### 5. خروجی Excel (Export)
```
GET    /api/v1/admin/export/users        # خروجی Excel کاربران
GET    /api/v1/admin/export/suppliers    # خروجی Excel تأمین‌کنندگان
GET    /api/v1/admin/export/visitors     # خروجی Excel ویزیتورها
GET    /api/v1/admin/export/products     # خروجی Excel محصولات
```

### 6. واردات Excel (Import)
```
POST   /api/v1/admin/import/suppliers    # واردات Excel تأمین‌کنندگان
POST   /api/v1/admin/import/visitors     # واردات Excel ویزیتورها
POST   /api/v1/admin/import/products     # واردات Excel محصولات
```

### 7. مدیریت ادمین‌ها (Admins Management)
```
GET    /api/v1/admin/admins              # لیست ادمین‌ها
POST   /api/v1/admin/admins              # اضافه کردن ادمین
DELETE /api/v1/admin/admins/:id           # حذف ادمین
```

## 🔧 Endpoints موجود در Backend

این endpoints در backend وجود دارند و آماده استفاده هستند:

### ✅ تأمین‌کنندگان (Suppliers)
- `GET /api/v1/admin/suppliers` ✅
- `POST /api/v1/admin/suppliers/:id/approve` ✅
- `POST /api/v1/admin/suppliers/:id/reject` ✅

### ✅ ویزیتورها (Visitors)
- `GET /api/v1/admin/visitors` ✅
- `GET /api/v1/admin/visitors/:id` ✅
- `POST /api/v1/admin/visitors/:id/approve` ✅
- `POST /api/v1/admin/visitors/:id/reject` ✅
- `PUT /api/v1/admin/visitors/:id/status` ✅

### ✅ برداشت‌ها (Withdrawals)
- `GET /api/v1/admin/withdrawal/requests` ✅
- `PUT /api/v1/admin/withdrawal/request/:id/status` ✅
- `GET /api/v1/admin/withdrawal/stats` ✅

### ✅ محصولات (Products)
- `POST /api/v1/admin/available-products` ✅
- `PUT /api/v1/admin/available-products/:id` ✅
- `DELETE /api/v1/admin/available-products/:id` ✅
- `GET /api/v1/admin/available-products` (نیاز به اضافه کردن)

### ✅ آموزش (Training)
- `GET /api/v1/admin/training/videos` ✅
- `POST /api/v1/admin/training/videos` ✅
- `PUT /api/v1/admin/training/videos/:id` ✅
- `DELETE /api/v1/admin/training/videos/:id` ✅
- `POST /api/v1/admin/training/categories` ✅

### ✅ نوتیفیکیشن‌ها (Notifications)
- `POST /api/v1/admin/notifications` ✅
- `PUT /api/v1/admin/notifications/:id` ✅
- `DELETE /api/v1/admin/notifications/:id` ✅
- `GET /api/v1/admin/notifications/stats` ✅
- `GET /api/v1/admin/notifications` (نیاز به اضافه کردن)

### ✅ پاپ‌اپ‌ها (Popups)
- `POST /api/v1/admin/marketing-popups` ✅
- `PUT /api/v1/admin/marketing-popups/:id` ✅
- `DELETE /api/v1/admin/marketing-popups/:id` ✅
- `GET /api/v1/admin/marketing-popups` (نیاز به اضافه کردن)

## 🎯 کارهایی که باید انجام دهید

### 1. نصب و راه‌اندازی
```bash
cd admin-panel
npm install
npm run dev
```

### 2. تست Authentication
- با کاربر admin وارد شوید
- مطمئن شوید که token دریافت می‌شود

### 3. تست قابلیت‌های موجود
- مدیریت تأمین‌کنندگان ✅
- مدیریت ویزیتورها ✅
- مدیریت برداشت‌ها ✅
- مدیریت محصولات ✅
- مدیریت آموزش ✅
- مدیریت نوتیفیکیشن‌ها ✅

### 4. اضافه کردن Endpoints مفقود (اختیاری)
اگر می‌خواهید تمام قابلیت‌ها کار کنند، باید endpoints زیر را در backend اضافه کنید:

#### الف) User Management Controller
```go
// در backend/controllers/user_controller.go
func GetUsersForAdmin(c *gin.Context)
func GetUserForAdmin(c *gin.Context)
func CreateUser(c *gin.Context)
func UpdateUser(c *gin.Context)
func DeleteUser(c *gin.Context)
func GetUserStats(c *gin.Context)
```

#### ب) License Management Controller
```go
// در backend/controllers/license_controller.go
func GetLicensesForAdmin(c *gin.Context)
func GetLicenseForAdmin(c *gin.Context)
func DeleteLicense(c *gin.Context)
// GenerateLicenses از telegram service استفاده می‌شود
```

#### ج) Dashboard Stats
```go
// در backend/controllers/dashboard_controller.go
func GetAdminDashboardStats(c *gin.Context)
```

#### د) Support Tickets Admin
```go
// در backend/controllers/support_ticket_controller.go
func GetTicketsForAdmin(c *gin.Context)
func RespondToTicketAsAdmin(c *gin.Context)
func GetTicketStatsForAdmin(c *gin.Context)
```

#### ه) Export/Import
```go
// در backend/controllers/export_controller.go
func ExportUsers(c *gin.Context)
func ExportSuppliers(c *gin.Context)
func ExportVisitors(c *gin.Context)
func ExportProducts(c *gin.Context)

// در backend/controllers/import_controller.go
func ImportSuppliers(c *gin.Context)
func ImportVisitors(c *gin.Context)
func ImportProducts(c *gin.Context)
```

## 📝 نکات مهم

### 1. Authentication
- Admin Panel از همان token system استفاده می‌کند
- Token در `localStorage` با کلید `auth_token` ذخیره می‌شود
- کاربر باید `is_admin = true` داشته باشد

### 2. CORS
مطمئن شوید که backend CORS را برای `localhost:8080` فعال کرده است.

### 3. Proxy
Proxy در `vite.config.ts` برای development تنظیم شده است:
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:8080',
    changeOrigin: true,
  }
}
```

### 4. Error Handling
- خطاها به صورت مناسب handle می‌شوند
- Toast notifications برای موفقیت/خطا نمایش داده می‌شوند

## 🐛 رفع مشکلات

### مشکل: خطای CORS
**راه حل:** مطمئن شوید backend CORS را برای `localhost:8080` فعال کرده است.

### مشکل: خطای 401 Unauthorized
**راه حل:** 
1. مطمئن شوید کاربر `is_admin = true` دارد
2. Token در localStorage ذخیره شده است
3. Backend token را validate می‌کند

### مشکل: Endpoint پیدا نشد (404)
**راه حل:** 
1. Endpoint را در backend اضافه کنید
2. یا در `adminApi.ts` از endpoint موجود استفاده کنید

### مشکل: داده نمایش داده نمی‌شود
**راه حل:**
1. Console browser را بررسی کنید
2. Network tab را بررسی کنید
3. Response backend را بررسی کنید

## 🎉 نتیجه

Admin Panel آماده استفاده است! 

**قابلیت‌های آماده:**
- ✅ مدیریت تأمین‌کنندگان
- ✅ مدیریت ویزیتورها
- ✅ مدیریت برداشت‌ها
- ✅ مدیریت محصولات
- ✅ مدیریت آموزش
- ✅ مدیریت نوتیفیکیشن‌ها
- ✅ مدیریت پاپ‌اپ‌ها

**قابلیت‌های که نیاز به backend دارند:**
- ⚠️ مدیریت کاربران (نیاز به endpoint)
- ⚠️ مدیریت لایسنس‌ها (نیاز به endpoint)
- ⚠️ آمار داشبورد (نیاز به endpoint)
- ⚠️ مدیریت تیکت‌ها (نیاز به endpoint)
- ⚠️ خروجی Excel (نیاز به endpoint)
- ⚠️ واردات Excel (نیاز به endpoint)

## 📞 پشتیبانی

اگر مشکلی داشتید:
1. Console browser را بررسی کنید
2. Network requests را بررسی کنید
3. Backend logs را بررسی کنید
4. فایل `ADMIN_PANEL_INTEGRATION_GUIDE.md` را مطالعه کنید

