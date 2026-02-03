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

1. بعد از `npm run build`، محتویات پوشه **affiliate-panel/dist** را روی سرور در مسیر **/var/www/asl_market/affiliate/** کپی کنید.
   - مثلاً:  
     `rsync -avz affiliate-panel/dist/ user@server:/var/www/asl_market/affiliate/`

2. در nginx برای دامنه اصلی (asllmarket.com) دو بلاک زیر را داشته باشید (در کانفیگ پروژه در `nginx/aslmarket.conf` هست):
   - `location = /affiliate { return 301 /affiliate/; }`
   - `location /affiliate/ { alias /var/www/asl_market/affiliate/; try_files $uri $uri/ /affiliate/index.html; ... }`

3. تست nginx و ریلود:
   ```bash
   sudo nginx -t && sudo systemctl reload nginx
   ```

بعد از این مراحل آدرس **https://asllmarket.com/affiliate** باید صفحه لاگین پنل افیلیت را نشان دهد و بعد از ورود، داشبورد و بقیه صفحات در دسترس باشند.
