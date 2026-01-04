# خلاصه اصلاح مسیرهای عکس و فایل‌های اپلود شده

## 📁 پوشه‌های اپلود موجود
بر اساس بررسی سرور، پوشه‌های زیر در `backend/uploads/` وجود دارند:
- `assets/` - عکس‌های قدیمی (باید به sliders منتقل شوند)
- `chat/` - عکس‌های چت Matching
- `products/` - عکس‌های محصولات
- `receipts/` - فیش‌های withdrawal
- `sliders/` - عکس‌های اسلایدر
- `suppliers/` - عکس‌های supplier
- `videos/` - ویدیوهای آموزشی

## ✅ تغییرات انجام شده

### 1. Backend

#### 1.1. اصلاح Slider Controller
- **فایل**: `backend/controllers/slider_controller.go`
- **تغییر**: مسیر اپلود از `"assets"` به `"sliders"` تغییر کرد
- **نتیجه**: عکس‌های اسلایدر در `/uploads/sliders/` ذخیره می‌شوند

#### 1.2. اصلاح Withdrawal Controller
- **فایل**: `backend/controllers/withdrawal_controller.go`
- **تغییر**: مسیر receipt از `receipts/...` به `/uploads/receipts/...` تغییر کرد
- **نتیجه**: مسیر receipt در دیتابیس به فرمت صحیح `/uploads/receipts/...` ذخیره می‌شود

#### 1.3. اصلاح Telegram Service
- **فایل**: `backend/services/telegram_withdrawal.go`
- **تغییر**: اصلاح مسیر فایل receipt برای ارسال در تلگرام
- **نتیجه**: فایل‌های receipt به درستی از مسیر `/uploads/receipts/` خوانده می‌شوند

### 2. Frontend

#### 2.1. ایجاد Helper Function
- **فایل**: `src/utils/imageUrl.ts`
- **توابع**:
  - `getImageUrl(imagePath)`: ساخت URL صحیح برای عکس‌ها
  - `getFirstImageUrl(imageUrls)`: استخراج اولین عکس از لیست

#### 2.2. اصلاح نمایش عکس‌ها
- **Slider.tsx**: استفاده از `getImageUrl`
- **AslSupplier.tsx**: اصلاح نمایش عکس supplier
- **AslAvailable.tsx**: اصلاح نمایش عکس محصولات
- **ImageUpload.tsx**: اصلاح نمایش preview
- **MatchingChat.tsx**: اصلاح نمایش عکس در چت
- **AslPay.tsx**: اضافه کردن قابلیت دانلود receipt

### 3. Admin Panel

#### 3.1. ایجاد Helper Function
- **فایل**: `admin-panel/src/lib/utils/imageUrl.ts`
- **تابع**: `getImageUrl(imagePath)` برای admin panel

#### 3.2. اصلاح نمایش عکس‌ها
- **Sliders.tsx**: اصلاح نمایش عکس‌های اسلایدر

### 4. اسکریپت آپدیت دیتابیس

#### 4.1. اسکریپت جامع آپدیت مسیرها
- **فایل**: `backend/scripts/fix_all_image_urls.go`
- **عملکرد**: آپدیت تمام مسیرهای قدیمی در دیتابیس به فرمت جدید `/uploads/...`
- **بخش‌های آپدیت شده**:
  1. Slider image URLs → `/uploads/sliders/...`
  2. Supplier image URLs → `/uploads/suppliers/...`
  3. AvailableProduct image URLs → `/uploads/products/...`
  4. MatchingMessage image URLs → `/uploads/chat/...`
  5. WithdrawalRequest receipt paths → `/uploads/receipts/...`

## 🚀 نحوه استفاده

### اجرای اسکریپت آپدیت دیتابیس

```bash
cd backend
go run scripts/fix_all_image_urls.go
```

این اسکریپت:
- تمام مسیرهای قدیمی را پیدا می‌کند
- آن‌ها را به فرمت `/uploads/{type}/...` تبدیل می‌کند
- در دیتابیس آپدیت می‌کند

### فرمت‌های پشتیبانی شده

اسکریپت این فرمت‌های قدیمی را پشتیبانی می‌کند:
- `assets/image.jpg` → `/uploads/sliders/image.jpg`
- `/assets/image.jpg` → `/uploads/sliders/image.jpg`
- `suppliers/image.jpg` → `/uploads/suppliers/image.jpg`
- `uploads/suppliers/image.jpg` → `/uploads/suppliers/image.jpg`
- `receipts/file.pdf` → `/uploads/receipts/file.pdf`

## 📋 چک‌لیست نهایی

- [x] اصلاح مسیر اپلود اسلایدر
- [x] اصلاح مسیر اپلود receipt
- [x] ایجاد helper function برای frontend
- [x] ایجاد helper function برای admin panel
- [x] اصلاح نمایش عکس در تمام بخش‌های frontend
- [x] اصلاح نمایش عکس در admin panel
- [x] ایجاد اسکریپت آپدیت دیتابیس
- [x] اصلاح telegram service برای receipt

## 🔍 بررسی نهایی

پس از اجرای اسکریپت، بررسی کنید که:
1. همه عکس‌ها از `/uploads/...` سرو می‌شوند
2. در production از `https://asllmarket.com/uploads/...` استفاده می‌شود
3. Nginx می‌تواند همه فایل‌ها را از `/var/www/asl_market/backend/uploads/` بخواند
4. SELinux context برای همه پوشه‌ها تنظیم شده است

## 📝 نکات مهم

1. **SELinux**: در AlmaLinux 9، حتماً context را برای همه پوشه‌های uploads تنظیم کنید:
   ```bash
   sudo semanage fcontext -a -t httpd_sys_content_t "/var/www/asl_market/backend/uploads(/.*)?"
   sudo restorecon -R -v /var/www/asl_market/backend/uploads
   ```

2. **Permissions**: مطمئن شوید که Nginx می‌تواند فایل‌ها را بخواند:
   ```bash
   sudo chown -R nginx:nginx /var/www/asl_market/backend/uploads
   sudo chmod -R 755 /var/www/asl_market/backend/uploads
   ```

3. **Nginx Config**: مطمئن شوید که `location ^~ /uploads` در nginx config وجود دارد و از `root` استفاده می‌کند.
