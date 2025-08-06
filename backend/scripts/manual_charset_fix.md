# Manual Charset Fix for Persian Text Support

## مشکل:
Database نمی‌تواند کاراکترهای فارسی را ذخیره کند و خطای زیر می‌دهد:
```
Error 1366 (HY000): Incorrect string value: '\xD9...' for column 'title' at row 1
```

## راه حل:

### گزینه 1: اجرای Go Script
```bash
cd backend
go run scripts/fix_charset.go
```

### گزینه 2: اجرای SQL Commands دستی

MySQL console باز کنید و commands زیر را اجرا کنید:

```sql
-- Database charset
ALTER DATABASE asl_market CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Tables charset
ALTER TABLE chats CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE messages CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE users CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE suppliers CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE supplier_products CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE visitors CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE research_products CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE licenses CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Specific columns that store Persian text
ALTER TABLE chats MODIFY COLUMN title VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE messages MODIFY COLUMN content TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE research_products MODIFY COLUMN name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE research_products MODIFY COLUMN category VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE research_products MODIFY COLUMN description TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### گزینه 3: phpMyAdmin
1. Database را انتخاب کنید
2. Operations tab → Collation → `utf8mb4_unicode_ci`
3. هر table را انتخاب کنید → Operations → Table options → Collation → `utf8mb4_unicode_ci`

## چک کردن نتیجه:
```sql
SHOW CREATE TABLE chats;
SHOW CREATE TABLE messages;
```

باید `CHARACTER SET utf8mb4` و `COLLATE utf8mb4_unicode_ci` را نشان دهد.

## نکته مهم:
پس از اصلاح، backend را restart کنید:
```bash
# اگر با systemd اجرا می‌کنید
sudo systemctl restart aslmarket-backend

# یا اگر manual اجرا می‌کنید
pkill -f backend
cd backend && ./backend
```