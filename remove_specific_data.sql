-- اسکریپت حذف اطلاعات خاص از دیتابیس ASL Market
-- این اسکریپت اطلاعات زیر را حذف می‌کند:
-- - توران قلمزن (تامین کننده صنایع دستی چوبی)
-- - شماره موبایل: ۰۹۱۵۷۰۹۵۱۵۸
-- - شماره موبایل: ۰۹۰۲۰۳۰۴۱۱۷  
-- - شماره موبایل: ۰۹۱۲۳۴۵۶۷۸۹

-- ⚠️ هشدار: قبل از اجرا حتماً از دیتابیس بکاپ تهیه کنید!

-- شروع تراکنش برای اطمینان از یکپارچگی داده‌ها
START TRANSACTION;

-- 1. حذف از جدول users بر اساس شماره موبایل
DELETE FROM users 
WHERE phone IN ('09157095158', '09020304117', '09123456789');

-- 2. حذف از جدول suppliers بر اساس شماره موبایل
DELETE FROM suppliers 
WHERE mobile IN ('09157095158', '09020304117', '09123456789');

-- 3. حذف از جدول visitors بر اساس شماره موبایل
DELETE FROM visitors 
WHERE mobile IN ('09157095158', '09020304117', '09123456789');

-- 4. حذف از جدول spotplayer_licenses بر اساس شماره موبایل
DELETE FROM spotplayer_licenses 
WHERE phone_number IN ('09157095158', '09020304117', '09123456789');

-- 5. حذف از جدول contact_view_limits (اگر کاربری این شماره‌ها را دیده باشد)
-- ابتدا user_id های مربوطه را پیدا می‌کنیم
DELETE cvl FROM contact_view_limits cvl
INNER JOIN users u ON cvl.user_id = u.id
WHERE u.phone IN ('09157095158', '09020304117', '09123456789');

-- 6. حذف از جدول daily_contact_view_limits
DELETE dvl FROM daily_contact_view_limits dvl
INNER JOIN users u ON dvl.user_id = u.id
WHERE u.phone IN ('09157095158', '09020304117', '09123456789');

-- 7. حذف از جدول support_tickets (تیکت‌های پشتیبانی)
DELETE st FROM support_tickets st
INNER JOIN users u ON st.user_id = u.id
WHERE u.phone IN ('09157095158', '09020304117', '09123456789');

-- 8. حذف از جدول support_ticket_messages (پیام‌های تیکت‌ها)
DELETE stm FROM support_ticket_messages stm
INNER JOIN support_tickets st ON stm.ticket_id = st.id
INNER JOIN users u ON st.user_id = u.id
WHERE u.phone IN ('09157095158', '09020304117', '09123456789');

-- 9. حذف از جدول withdrawal_requests (درخواست‌های برداشت)
DELETE wr FROM withdrawal_requests wr
INNER JOIN users u ON wr.user_id = u.id
WHERE u.phone IN ('09157095158', '09020304117', '09123456789');

-- 10. حذف از جدول ai_usage (استفاده از هوش مصنوعی)
DELETE au FROM ai_usage au
INNER JOIN users u ON au.user_id = u.id
WHERE u.phone IN ('09157095158', '09020304117', '09123456789');

-- 11. حذف از جدول user_progress (پیشرفت کاربران)
DELETE up FROM user_progress up
INNER JOIN users u ON up.user_id = u.id
WHERE u.phone IN ('09157095158', '09020304117', '09123456789');

-- 12. حذف از جدول video_watches (تماشای ویدیوها)
DELETE vw FROM video_watches vw
INNER JOIN users u ON vw.user_id = u.id
WHERE u.phone IN ('09157095158', '09020304117', '09123456789');

-- 13. حذف از جدول upgrade_requests (درخواست‌های ارتقا)
DELETE ur FROM upgrade_requests ur
INNER JOIN users u ON ur.user_id = u.id
WHERE u.phone IN ('09157095158', '09020304117', '09123456789');

-- 14. حذف از جدول notifications (نوتیفیکیشن‌ها)
DELETE n FROM notifications n
INNER JOIN users u ON n.user_id = u.id
WHERE u.phone IN ('09157095158', '09020304117', '09123456789');

-- 15. حذف از جدول daily_view_limits (محدودیت‌های روزانه)
DELETE dvl FROM daily_view_limits dvl
INNER JOIN users u ON dvl.user_id = u.id
WHERE u.phone IN ('09157095158', '09020304117', '09123456789');

-- 16. حذف از جدول available_products (محصولات موجود) - اگر این کاربران محصول اضافه کرده باشند
DELETE ap FROM available_products ap
INNER JOIN users u ON ap.added_by_id = u.id
WHERE u.phone IN ('09157095158', '09020304117', '09123456789');

-- 17. حذف از جدول research_products (محصولات تحقیقی) - اگر این کاربران محصول اضافه کرده باشند
DELETE rp FROM research_products rp
INNER JOIN users u ON rp.added_by_id = u.id
WHERE u.phone IN ('09157095158', '09020304117', '09123456789');

-- 18. حذف از جدول marketing_popups (پاپ‌آپ‌های بازاریابی) - اگر این کاربران کلیک کرده باشند
DELETE mp FROM marketing_popups mp
INNER JOIN users u ON mp.clicked_by_id = u.id
WHERE u.phone IN ('09157095158', '09020304117', '09123456789');

-- 19. حذف از جدول training_videos (ویدیوهای آموزشی) - اگر این کاربران ویدیو اضافه کرده باشند
DELETE tv FROM training_videos tv
INNER JOIN users u ON tv.added_by_id = u.id
WHERE u.phone IN ('09157095158', '09020304117', '09123456789');

-- 20. حذف از جدول training_categories (دسته‌بندی‌های آموزشی) - اگر این کاربران دسته اضافه کرده باشند
DELETE tc FROM training_categories tc
INNER JOIN users u ON tc.added_by_id = u.id
WHERE u.phone IN ('09157095158', '09020304117', '09123456789');

-- 21. حذف از جدول licenses (لایسنس‌ها) - اگر این کاربران لایسنس داشته باشند
DELETE l FROM licenses l
INNER JOIN users u ON l.user_id = u.id
WHERE u.phone IN ('09157095158', '09020304117', '09123456789');

-- 22. حذف از جدول chats (چت‌ها) - اگر این کاربران چت داشته باشند
DELETE c FROM chats c
INNER JOIN users u ON c.user_id = u.id
WHERE u.phone IN ('09157095158', '09020304117', '09123456789');

-- 23. حذف از جدول messages (پیام‌های چت) - اگر این کاربران پیام داشته باشند
DELETE m FROM messages m
INNER JOIN chats c ON m.chat_id = c.id
INNER JOIN users u ON c.user_id = u.id
WHERE u.phone IN ('09157095158', '09020304117', '09123456789');

-- 24. حذف از جدول supplier_products (محصولات تأمین‌کنندگان) - اگر این کاربران تأمین‌کننده باشند
DELETE sp FROM supplier_products sp
INNER JOIN suppliers s ON sp.supplier_id = s.id
INNER JOIN users u ON s.user_id = u.id
WHERE u.phone IN ('09157095158', '09020304117', '09123456789');

-- بررسی تعداد رکوردهای حذف شده
SELECT 
    'users' as table_name, 
    COUNT(*) as deleted_count 
FROM users 
WHERE phone IN ('09157095158', '09020304117', '09123456789')
UNION ALL
SELECT 
    'suppliers' as table_name, 
    COUNT(*) as deleted_count 
FROM suppliers 
WHERE mobile IN ('09157095158', '09020304117', '09123456789')
UNION ALL
SELECT 
    'visitors' as table_name, 
    COUNT(*) as deleted_count 
FROM visitors 
WHERE mobile IN ('09157095158', '09020304117', '09123456789')
UNION ALL
SELECT 
    'spotplayer_licenses' as table_name, 
    COUNT(*) as deleted_count 
FROM spotplayer_licenses 
WHERE phone_number IN ('09157095158', '09020304117', '09123456789');

-- اگر همه چیز درست بود، تراکنش را تأیید کنید
-- COMMIT;

-- اگر مشکلی بود، تراکنش را برگردانید
-- ROLLBACK;

-- نمایش پیام تکمیل
SELECT 'عملیات حذف اطلاعات تکمیل شد. لطفاً قبل از COMMIT نتیجه را بررسی کنید.' as message;
