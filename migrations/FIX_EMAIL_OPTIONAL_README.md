# حل مشکل ایمیل اختیاری (Fix Email Optional Issue)

## مشکل
وقتی کاربر بدون ایمیل ثبت‌نام می‌کنه، خطای سرور میگیریم. دلیلش اینه که توی دیتابیس روی ستون `email` یه constraint از نوع `UNIQUE` هست که اجازه نمیده چند کاربر با ایمیل خالی داشته باشیم.

## راه حل
باید:
1. UNIQUE constraint روی ستون `email` رو حذف کنیم
2. مطمئن بشیم که ستون `email` می‌تونه `NULL` باشه

## روش اجرا

### روش 1: اجرای خودکار (پیشنهادی)

روی سرور این دستور رو اجرا کن:

```bash
cd /path/to/asl_market
./migrations/fix_email_optional.sh
```

این اسکریپت به صورت خودکار:
- وضعیت فعلی ستون email رو چک می‌کنه
- اگر UNIQUE index وجود داشته باشه، حذفش می‌کنه
- ستون email رو nullable می‌کنه
- تغییرات رو verify می‌کنه

### روش 2: اجرای دستی

اگر ترجیح میدی دستی انجام بدی، این دستورات رو توی MySQL اجرا کن:

```sql
USE asl_market;

-- 1. چک کن ببین UNIQUE index روی email هست یا نه
SELECT INDEX_NAME
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = 'asl_market' 
AND TABLE_NAME = 'users' 
AND COLUMN_NAME = 'email'
AND NON_UNIQUE = 0;

-- 2. اگر index وجود داشت (مثلاً اسمش 'email' یا 'email_UNIQUE' بود)، حذفش کن:
ALTER TABLE users DROP INDEX email;
-- یا
-- ALTER TABLE users DROP INDEX email_UNIQUE;

-- 3. مطمئن شو که email می‌تونه NULL باشه
ALTER TABLE users 
MODIFY COLUMN email VARCHAR(255) NULL DEFAULT NULL;

-- 4. تغییرات رو چک کن
DESCRIBE users;
SHOW INDEX FROM users WHERE Column_name = 'email';
```

## تست کردن

بعد از اجرای migration، این‌کارو بکن:

1. برو توی سایت و بدون وارد کردن ایمیل ثبت‌نام کن
2. باید بدون خطا ثبت‌نام انجام بشه
3. می‌تونی چند کاربر بدون ایمیل ثبت کنی (نباید خطا بده)

## نکات مهم

- ✅ ایمیل الان کاملاً اختیاریه
- ✅ می‌تونی چند کاربر بدون ایمیل داشته باشی
- ✅ اگر ایمیل وارد بشه، هنوز چک می‌شه که تکراری نباشه (توی کد کنترلر)
- ✅ شماره موبایل همچنان یونیک و الزامیه

## اگر مشکلی پیش اومد

اگر بعد از اجرای migration هنوز مشکل داری، این اطلاعات رو بفرست:

```bash
# وضعیت ستون email
mysql -u asl_user -pasl_password_2024 asl_market -e "
SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_TYPE, COLUMN_KEY
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'asl_market' 
AND TABLE_NAME = 'users' 
AND COLUMN_NAME = 'email';
"

# لیست indexها روی users
mysql -u asl_user -pasl_password_2024 asl_market -e "SHOW INDEX FROM users;"
```
