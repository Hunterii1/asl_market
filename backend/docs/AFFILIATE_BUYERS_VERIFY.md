# بررسی دادهٔ خریداران افیلیت (نمودار و درآمد)

همهٔ داده‌های **نمودار پرداخت**، **درآمد واقعی/کل** و **لیست «کاربرانی که خرید کرده‌اند»** از یک جدول می‌آیند: `affiliate_buyers`.

## جریان داده

1. **ثبت خریداران:** ادمین در پنل مدیریت از «تطبیق فروش» خریداران را تأیید می‌کند → `ConfirmAffiliateBuyers` در `web_api_admin_panel.go` با `CreateAffiliateBuyerBatch` ردیف در جدول `affiliate_buyers` با `affiliate_id` همان افیلیت ذخیره می‌کند.

2. **پنل افیلیت:**
   - **داشبورد:** `GetDashboard` با `GetAffiliateBuyers(db, affID, 50, 0)` همان خریداران را می‌خواند و از روی آن‌ها `real_income` و `total_income` را حساب می‌کند.
   - **صفحه پرداخت‌ها:** `GetPayments` همان `GetAffiliateBuyers(ac.DB, affID, 100, 0)` را صدا می‌زند و هم `payments_chart` (از همان جدول یا از همان لیست) و هم `confirmed_buyers` را برمی‌گرداند.

3. **affiliate_id:** از توکن JWT افیلیت (بعد از لاگین) در `AffiliateAuthMiddleware` خوانده می‌شود و در context قرار می‌گیرد؛ پس داشبورد و پرداخت‌ها هر دو با همان `affiliate_id` از دیتابیس می‌خوانند.

## چک کردن مستقیم در دیتابیس

با اتصال به همان دیتابیسی که بک‌اند استفاده می‌کند این کوئری‌ها را بزن:

```sql
-- لیست همهٔ خریداران به تفکیک affiliate_id
SELECT affiliate_id, COUNT(*) AS cnt, SUM(COALESCE(NULLIF(amount_toman, 0), 6000000)) AS total_toman
FROM affiliate_buyers
WHERE deleted_at IS NULL
GROUP BY affiliate_id;

-- ردیف‌های یک افیلیت خاص (به‌جای ۱ شناسهٔ افیلیت خود را بگذار)
SELECT id, affiliate_id, name, phone, purchased_at, amount_toman, created_at
FROM affiliate_buyers
WHERE deleted_at IS NULL AND affiliate_id = 1
ORDER BY created_at DESC;
```

اگر اینجا ردیف می‌بینید ولی در پنل افیلیت نمودار/درآمد خالی است:

- مطمئن شوید بک‌اند **همین کد به‌روز** را اجرا می‌کند (build و deploy دوباره).
- لاگ سرور را بعد از باز کردن داشبورد و صفحهٔ پرداخت‌ها ببینید؛ باید خطوطی شبیه این ببینید:
  - `[Affiliate] GetDashboard affID=... confirmedBuyers=... realIncome=... totalIncome=...`
  - `[Affiliate] GetPayments affID=... confirmedBuyers=... paymentsChartRows=...`
- اگر در لاگ `confirmedBuyers=0` است در حالی که در SQL برای همان `affiliate_id` ردیف دارید، یا توکن مربوط به افیلیت دیگری است یا دیتابیس/اتصال دیگری استفاده می‌شود.

## جدول

- نام جدول: `affiliate_buyers` (طبق مدل GORM، مگر TableName سفارشی تعریف شده باشد).
- داشبورد، پرداخت‌ها و لیست خریداران همگی از همین جدول و با همان `affiliate_id` (از JWT) خوانده می‌شوند.
