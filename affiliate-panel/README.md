# پنل افیلیت | ASLL Market

اپ جداگانه پنل افیلیت با **base path** برابر `/affiliate/` تا روی آدرس **https://asllmarket.com/affiliate** بالا بیاید.

## اجرای لوکال

```bash
cd affiliate-panel
npm install
npm run dev
```

سپس در مرورگر بروید به: **http://localhost:5175/affiliate/**  
(پورت ۵۱۷۵ تا با اپ اصلی تداخل نداشته باشد.)

## بیلد برای پروداکشن

```bash
cd affiliate-panel
npm install
npm run build
```

خروجی داخل پوشه `dist/` است. همه فایل‌ها با پیشوند `/affiliate/` هستند.

## دیپلوی روی سرور

**روش ۱ – اسکریپت فقط پنل افیلیت (از ریشه پروژه):**
```bash
# ابتدا SERVER_HOST (و در صورت نیاز SERVER_USER) را تنظیم کنید؛ سپس:
./deploy-affiliate.sh
```

**روش ۲ – دیپلوی کامل (فرانت + بکند + پنل افیلیت):**
```bash
# در deploy.sh متغیرهای SERVER_USER و SERVER_HOST را تنظیم کنید؛ سپس:
./deploy.sh
```

**روش ۳ – دستی:** بعد از `npm run build`، محتویات **affiliate-panel/dist** را در مسیر **/var/www/asl_market/affiliate/** روی سرور کپی کنید، مثلاً:
```bash
rsync -avz affiliate-panel/dist/ user@server:/var/www/asl_market/affiliate/
```

در nginx برای دامنه اصلی (asllmarket.com) دو بلاک زیر باید باشند (در `nginx/aslmarket.conf`):
- `location = /affiliate { return 301 /affiliate/; }`
- `location /affiliate/ { alias /var/www/asl_market/affiliate/; try_files ... }`

تست و ریلود nginx روی سرور: `sudo nginx -t && sudo systemctl reload nginx`

بعد از دیپلوی، **https://asllmarket.com/affiliate** و **https://asllmarket.com/affiliate/dashboard** باید صفحه پنل افیلیت را با HTTP 200 برگردانند.
