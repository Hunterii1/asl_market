# نمایش لیست ثبت‌نامی در پنل افیلیت

برای اینکه **لیست کاربران آپلودشده توسط ادمین** در پنل افیلیت (صفحه «کاربران») دیده شود، هر دو مورد زیر باید روی سرور آپدیت باشند.

## ۱. بک‌اند (الزامی)

بک‌اند باید نسخه‌ای باشد که:
- روت `GET /api/v1/affiliate/registered-users` را دارد،
- و هنگام import از CSV از `CreateInBatches` استفاده می‌کند (نه فقط ۱۰۰ تا ذخیره شود).

**روی سرور:**
```bash
cd /var/www/asl_market/backend
go build -o backend .
sudo supervisorctl restart aslmarket-backend
```

(اگر مسیر یا نام سرویس شما فرق دارد، مطابق تنظیمات خودتان اجرا کنید.)

## ۲. فرانت پنل افیلیت (الزامی)

پنل افیلیت باید از API بالا لیست را بگیرد و نمایش دهد.

**روی سرور:**
```bash
cd /var/www/asl_market/affiliate-panel
npm ci
npm run build
mkdir -p /var/www/asl_market/affiliate
cp -r dist/* /var/www/asl_market/affiliate/
```

## تست

1. در پنل مدیریت، برای یک افیلیت از طریق مودال ویرایش یک فایل CSV ثبت‌نامی آپلود کنید.
2. با همان افیلیت در پنل افیلیت لاگین کنید و بروید به **کاربران** (یا **لیست ثبت‌نامی**).
3. باید همان لیست را ببینید. اگر خطا دیدید، دکمه «تلاش مجدد» را بزنید یا در لاگ بک‌اند خطی شبیه `[Affiliate] GetRegisteredUsers affiliate_id=X ... total=Y` را چک کنید.

## اگر هنوز لیست نمی‌آید

- در مرورگر با F12 تب Network را باز کنید؛ ببینید درخواست به `.../affiliate/registered-users` می‌رود یا نه و وضعیت (۲۰۰ / ۴۰۴ / ۴۰۱) چیست.
- روی سرور لاگ بک‌اند را ببینید: `journalctl -u ... -f` یا لاگ supervisor؛ بعد از باز کردن صفحه کاربران باید خط `GetRegisteredUsers affiliate_id=... total=...` بیاید.
