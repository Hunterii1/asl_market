# 🚀 مایگریشن سریع

## دستورات SQL برای اجرا در دیتابیس:

```sql
-- اضافه کردن فیلدهای برگزیده به جدول suppliers
ALTER TABLE suppliers 
ADD COLUMN is_featured BOOLEAN DEFAULT FALSE,
ADD COLUMN featured_at TIMESTAMP NULL,
ADD COLUMN featured_by INT UNSIGNED NULL;

-- اضافه کردن فیلدهای برگزیده به جدول visitors
ALTER TABLE visitors
ADD COLUMN is_featured BOOLEAN DEFAULT FALSE,
ADD COLUMN featured_at TIMESTAMP NULL,
ADD COLUMN featured_by INT UNSIGNED NULL;

-- اضافه کردن ایندکس‌ها برای بهبود عملکرد
CREATE INDEX idx_suppliers_featured ON suppliers(is_featured, featured_at);
CREATE INDEX idx_visitors_featured ON visitors(is_featured, featured_at);
```

## ✅ پس از اجرای مایگریشن:

1. **Backend را restart کنید**
2. **Frontend را refresh کنید**
3. **تست کنید:** فقط تأمین‌کنندگان برگزیده شده باید ستاره داشته باشند

## 🎯 تست سیستم:

1. **تلگرام بات:** `/feature{ID}` برای برگزیده کردن
2. **سایت:** بررسی نمایش ستاره فقط برای برگزیده‌ها
3. **مرتب‌سازی:** برگزیده‌ها باید اول باشند
