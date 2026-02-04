# رفع خطای CORS روی Affiliate Panel

## خطای مرورگر

```
Access to fetch at 'https://admin.asllmarket.com/api/v1/affiliate/dashboard' from origin 'https://asllmarket.com' 
has been blocked by CORS policy: The 'Access-Control-Allow-Origin' header contains multiple values 
'*, https://admin.asllmarket.com', but only one is allowed.
```

## علت (Root cause)

دو لایه هر دو هدر CORS را ست می‌کردند:

1. **Nginx** (برای `admin.asllmarket.com`): در `location /api/` با `add_header Access-Control-Allow-Origin "https://admin.asllmarket.com"` یک مقدار به پاسخ اضافه می‌کرد.
2. **بک‌اند (Go)**: هم middlewareی `gin-contrib/cors` با `AllowAllOrigins = true` (که در برخی مسیرها مقدار `*` برمی‌گرداند) و هم یک middlewareی دستی دیگر دوباره همان هدرها را ست می‌کردند.

نتیجه: در پاسخ نهایی هدر `Access-Control-Allow-Origin` دو بار با دو مقدار مختلف (`*` و `https://admin.asllmarket.com`) می‌آمد و مرورگر فقط یک مقدار را قبول می‌کند.

## راه‌حل اعمال‌شده

- **فقط یک لایه CORS داریم: بک‌اند (Go).**
- در **nginx** برای `admin.asllmarket.com` تمام `add_header`های مربوط به CORS از `location /api/` حذف شد تا nginx دیگر این هدرها را به پاسخ اضافه نکند.
- در **بک‌اند**:
  - middlewareی دستی تکراری که دوباره CORS را ست می‌کرد حذف شد.
  - به‌جای `AllowAllOrigins = true` از لیست صریح `AllowOrigins` استفاده شد (شامل `https://asllmarket.com` و `https://admin.asllmarket.com` و دامنه‌های لازم دیگر) تا فقط یک بار و با یک مقدار صحیح هدر ست شود.

با این کار فقط یک بار `Access-Control-Allow-Origin` در پاسخ قرار می‌گیرد و خطای «multiple values» برطرف می‌شود.

---

## دستورات تست (روی سرور یا لوکال)

### ۱) Preflight (OPTIONS)

```bash
curl -i -X OPTIONS 'https://admin.asllmarket.com/api/v1/affiliate/dashboard' \
  -H 'Origin: https://asllmarket.com' \
  -H 'Access-Control-Request-Method: GET' \
  -H 'Access-Control-Request-Headers: Content-Type, Authorization'
```

در خروجی باید **دقیقاً یک بار** هدر زیر دیده شود:

```
Access-Control-Allow-Origin: https://asllmarket.com
```

(و نباید دو مقدار مثل `*, https://admin.asllmarket.com` باشد.)

### ۲) درخواست واقعی (GET)

```bash
curl -i 'https://admin.asllmarket.com/api/v1/affiliate/dashboard' \
  -H 'Origin: https://asllmarket.com'
```

باز هم باید فقط یک بار `Access-Control-Allow-Origin: https://asllmarket.com` در پاسخ باشد.

### ۳) بعد از اعمال تغییرات

```bash
sudo nginx -t && sudo systemctl reload nginx
# در صورت تغییر بک‌اند:
# sudo supervisorctl restart aslmarket-backend
```

سپس دوباره همان دو دستور `curl` بالا را اجرا کنید و در مرورگر صفحه Affiliate Panel را با رفرش کامل (Ctrl+Shift+R) تست کنید.

---

## فایل‌های تغییر یافته

- `nginx/admin.asllmarket.com.conf`: حذف تمام `add_header`های CORS از `location /api/` و حذف بلاک جداگانهٔ OPTIONS با هدرهای CORS.
- `backend/main.go`: حذف middlewareی دستی CORS و تنظیم `cors.AllowOrigins` به‌جای `AllowAllOrigins`.
