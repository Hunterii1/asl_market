-- Migration: Add 5 supplier tags (پیرامون تگ برای تأمین‌کنندگان)
-- 1. تأمین‌کننده دسته اول  2. تأمین‌کننده خوش قیمت  3. تأمین‌کننده سابقه صادرات
-- 4. تأمین‌کننده دارایی بسته‌بندی صادراتی  5. تأمین بدون سرمایه

-- Run once. If columns exist, run each ADD separately and ignore errors for existing ones.
ALTER TABLE suppliers ADD COLUMN tag_first_class BOOLEAN DEFAULT FALSE;
ALTER TABLE suppliers ADD COLUMN tag_good_price BOOLEAN DEFAULT FALSE;
ALTER TABLE suppliers ADD COLUMN tag_export_experience BOOLEAN DEFAULT FALSE;
ALTER TABLE suppliers ADD COLUMN tag_export_packaging BOOLEAN DEFAULT FALSE;
ALTER TABLE suppliers ADD COLUMN tag_supply_without_capital BOOLEAN DEFAULT FALSE;
