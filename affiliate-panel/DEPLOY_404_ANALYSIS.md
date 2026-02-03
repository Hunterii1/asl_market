# تحلیل علت ۴۰۴ پنل افیلیت

بدون تغییر در کد، فقط بررسی علت‌های محتمل:

---

## ۱. کانفیگ Nginx روی سرور به‌روز نیست

فایل `nginx/aslmarket.conf` داخل **پروژه** است. روی **سرور** ممکن است فایل کانفیگ واقعی مسیر دیگری داشته باشد، مثلاً:
- `/etc/nginx/sites-available/aslmarket`
- `/etc/nginx/conf.d/asllmarket.com.conf`

اگر این فایل را از روی ریپو کپی نکرده باشید یا بلاک‌های affiliate را دستی اضافه نکرده باشید، درخواست `https://asllmarket.com/affiliate` به همان `location /` می‌خورد و یا **۴۰۴ Nginx** می‌گیرید یا **همان اپ اصلی** لود می‌شود و اپ اصلی برای مسیر `/affiliate` صفحه ۴۰۴ خودش را نشان می‌دهد.

**چک:** روی سرور ببینید فایل کانفیگ دامنه asllmarket.com کجاست و آیا داخلش دقیقاً این دو بلاک هست یا نه:
- `location = /affiliate { return 301 /affiliate/; }`
- `location /affiliate/ { ... }`

---

## ۲. فایل‌های پنل افیلیت روی سرور نیست

Nginx برای `/affiliate/` از **alias** استفاده می‌کند:

```nginx
alias /var/www/asl_market/affiliate/;
```

یعنی روی سرور باید این مسیر وجود داشته باشد و داخلش حتماً **index.html** و پوشه **assets** (حاوی js/css) باشد. اگر:
- پوشه `/var/www/asl_market/affiliate/` اصلاً ساخته نشده، یا
- فقط خالی است، یا
- بعد از build، خروجی `affiliate-panel/dist/` آنجا کپی نشده،

Nginx وقتی برای مسیرهایی مثل `/affiliate/` یا `/affiliate/dashboard` به `index.html` fallback می‌کند، فایل را پیدا نمی‌کند و **۴۰۴** برمی‌گرداند.

**چک روی سرور:**
```bash
ls -la /var/www/asl_market/affiliate/
# باید index.html و پوشه assets را ببینید
cat /var/www/asl_market/affiliate/index.html
# باید تگ script با مسیر /affiliate/assets/... باشد
```

---

## ۳. باگ شناخته‌شده Nginx: `alias` + `try_files`

در Nginx ترکیب **alias** با **try_files** رفتار عجیب دارد و در بعضی نسخه‌ها مسیر fallback درست resolve نمی‌شود و به ۴۰۴ می‌رسد.

الان در کانفیگ داریم:

```nginx
location /affiliate/ {
    alias /var/www/asl_market/affiliate/;
    try_files $uri $uri/ /affiliate/index.html;
    ...
}
```

ممکن است در سرور شما این fallback به `/affiliate/index.html` درست کار نکند و به‌جای سرو کردن فایل، ۴۰۴ برگردد.

**راه‌حل‌های متداول:** یا استفاده از **root** به‌جای alias (با قرار دادن فایل‌ها در مسیر مناسب)، یا استفاده از **rewrite** برای fallback به‌جای `try_files` در همین location.

---

## ۴. مسیر پروژه روی سرور: `asl_market` vs `aslmarket`

در پروژه دو نوع مسیر دیده می‌شود:
- در **nginx/aslmarket.conf**: `root /var/www/asl_market/dist/` و `alias /var/www/asl_market/affiliate/` (با **underscore**: asl_market)
- در **deploy.sh**: `SERVER_PATH="/var/www/aslmarket"` و آپلود به `frontend/` (بدون underscore: aslmarket)

اگر روی سرور واقعاً پروژه را زیر `/var/www/aslmarket/` گذاشته‌اید ولی در nginx هنوز `/var/www/asl_market/` نوشته شده، مسیر affiliate غلط است و Nginx فایل را پیدا نمی‌کند → ۴۰۴.

**چک:** روی سرور ببینید مسیر واقعی پروژه چیست:
```bash
ls -la /var/www/ | grep asl
```

اگر فقط `aslmarket` دارید و `asl_market` ندارید، یا باید در nginx مسیرها را به همان `aslmarket` تغییر دهید یا پوشه affiliate را زیر همان مسیری بگذارید که در nginx نوشته‌اید.

---

## ۵. نوع ۴۰۴: Nginx یا اپ اصلی؟

- **۴۰۴ Nginx:** معمولاً صفحه ساده «۴۰۴ Not Found» (متن پیش‌فرض Nginx)، بدون دکمه «Return to Home» و بدون استایل اپ.
- **۴۰۴ اپ اصلی (React):** همان صفحه تیره با «۴۰۴»، «Oops! Page not found» و لینک «Return to Home».

اگر دومی را می‌بینید یعنی:
- درخواست به **همان اپ اصلی** (فرانت اصلی سایت) رسیده و index.html اصلی لود شده،
- و Nginx یا اصلاً بلاک `/affiliate` را ندارد، یا قبل از رسیدن به آن، یک `location` دیگر (مثلاً `location /`) درخواست را گرفته و همان SPA اصلی را سرو کرده است.

در این حالت مشکل یا از **نبود/غلط بودن بلاک affiliate در کانفیگ واقعی روی سرور** است، یا از **ترتیب/اولویت location**ها (مثلاً یک `location /` که زودتر match می‌کند).

---

## جمع‌بندی محتمل‌ترین علت‌ها

| احتمال | علت |
|--------|------|
| بالا | کانفیگ واقعی Nginx روی سرور بلاک‌های affiliate را ندارد یا از فایل قدیمی است. |
| بالا | پوشه `/var/www/asl_market/affiliate/` روی سرور وجود ندارد یا خالی است (build کپی نشده). |
| متوسط | مسیر روی سرور با کانفیگ فرق دارد (مثلاً aslmarket vs asl_market). |
| متوسط | باگ alias + try_files در Nginx باعث fallback اشتباه و ۴۰۴ می‌شود. |

---

## پیشنهاد چک مرحله‌به‌مرحله روی سرور

1. **فایل کانفیگ دامنه asllmarket.com را پیدا کنید:**
   ```bash
   grep -r "asllmarket.com" /etc/nginx/ --include="*.conf" -l
   ```

2. **داخل همان فایل ببینید آیا این دو بلاک هست یا نه:**
   ```bash
   grep -A2 "location.*affiliate" /etc/nginx/...   # مسیر فایل از مرحله ۱
   ```

3. **مسیر affiliate روی دیسک را چک کنید:**
   ```bash
   ls -la /var/www/asl_market/affiliate/
   # در صورت خطای "No such file or directory" یا خالی بودن، علت ۴۰۴ همین است.
   ```

4. **اگر پوشه و فایل‌ها هست، تست مستقیم از روی سرور:**
   ```bash
   curl -I https://asllmarket.com/affiliate/
   # اگر ۲۰۰ است ولی در مرورگر ۴۰۴ می‌بینید، ممکن است کش مرورگر یا CDN باشد.
   ```

با این چهار مرحله می‌توان دقیقاً فهمید مشکل از کانفیگ است، از نبود فایل، از مسیر، یا از Nginx (مثلاً alias+try_files).
