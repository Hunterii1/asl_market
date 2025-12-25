# رفع مشکل SSL برای Admin Panel

## 🔍 مشکل

مرورگر خطای SSL می‌دهد چون Certificate فعلی شامل `admin.asllmarket.com` نیست.

## ✅ راه‌حل‌ها

### راه‌حل 1: استفاده از Certificate Wildcard (اگر دارید)

اگر Certificate شما wildcard است (`*.asllmarket.com`)، باید از مسیر wildcard استفاده کنید:

```bash
# بررسی Certificate موجود
sudo certbot certificates
```

اگر wildcard certificate دارید، فایل nginx را به این صورت تغییر دهید:

```nginx
ssl_certificate /etc/letsencrypt/live/asllmarket.com-0001/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/asllmarket.com-0001/privkey.pem;
```

### راه‌حل 2: دریافت Certificate جدید برای admin.asllmarket.com (توصیه می‌شود)

```bash
# دریافت Certificate جدید که شامل admin.asllmarket.com باشد
sudo certbot --nginx -d admin.asllmarket.com

# یا اگر می‌خواهید برای هر دو دامنه یک Certificate بگیرید:
sudo certbot --nginx -d asllmarket.com -d www.asllmarket.com -d admin.asllmarket.com
```

بعد از دریافت Certificate، Nginx به صورت خودکار تنظیمات را به‌روزرسانی می‌کند.

### راه‌حل 3: به‌روزرسانی Certificate موجود

اگر می‌خواهید Certificate موجود را به‌روزرسانی کنید تا شامل `admin.asllmarket.com` هم بشود:

```bash
# حذف Certificate قدیمی (اختیاری)
sudo certbot delete --cert-name asllmarket.com

# دریافت Certificate جدید با همه دامنه‌ها
sudo certbot --nginx -d asllmarket.com -d www.asllmarket.com -d admin.asllmarket.com
```

## 🔧 مراحل کامل

### مرحله 1: بررسی Certificate فعلی

```bash
# لیست Certificate های موجود
sudo certbot certificates
```

### مرحله 2: دریافت Certificate جدید

```bash
# دریافت Certificate برای admin.asllmarket.com
sudo certbot --nginx -d admin.asllmarket.com
```

این دستور:
- Certificate جدید می‌گیرد
- به صورت خودکار nginx را تنظیم می‌کند
- Certificate را به‌روزرسانی می‌کند

### مرحله 3: بررسی تنظیمات

بعد از اجرای certbot، فایل nginx به صورت خودکار به‌روزرسانی می‌شود. بررسی کنید:

```bash
# بررسی syntax
sudo nginx -t

# اگر OK بود، reload کنید
sudo systemctl reload nginx
```

### مرحله 4: تست

```bash
# تست SSL
curl -I https://admin.asllmarket.com

# یا در مرورگر باز کنید
# باید بدون خطا باز شود
```

## 🔄 اگر Certificate Wildcard دارید

اگر Certificate شما wildcard است (`*.asllmarket.com`)، می‌توانید از همان استفاده کنید:

```bash
# بررسی مسیر Certificate
ls -la /etc/letsencrypt/live/

# معمولاً wildcard certificate ها در مسیری مثل این هستند:
# /etc/letsencrypt/live/asllmarket.com-0001/
```

سپس فایل nginx را به این صورت تغییر دهید:

```nginx
ssl_certificate /etc/letsencrypt/live/asllmarket.com-0001/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/asllmarket.com-0001/privkey.pem;
```

## ⚠️ نکات مهم

1. **DNS باید تنظیم شده باشد:** قبل از دریافت Certificate، مطمئن شوید که `admin.asllmarket.com` به IP سرور شما اشاره می‌کند

2. **پورت 80 باید باز باشد:** Let's Encrypt برای تایید نیاز به دسترسی به پورت 80 دارد

3. **Auto-renewal:** Certificate ها به صورت خودکار هر 90 روز تمدید می‌شوند

4. **بررسی Auto-renewal:**
```bash
# تست auto-renewal
sudo certbot renew --dry-run
```

## 🐛 Troubleshooting

### مشکل: "Failed to obtain certificate"

```bash
# بررسی DNS
nslookup admin.asllmarket.com

# بررسی پورت 80
sudo netstat -tlnp | grep :80

# بررسی firewall
sudo ufw status
```

### مشکل: "Certificate exists but is not valid"

```bash
# حذف Certificate قدیمی
sudo certbot delete --cert-name admin.asllmarket.com

# دریافت مجدد
sudo certbot --nginx -d admin.asllmarket.com
```

### مشکل: "Nginx is not running"

```bash
# شروع nginx
sudo systemctl start nginx

# بررسی وضعیت
sudo systemctl status nginx
```

## ✅ بعد از رفع مشکل

بعد از دریافت Certificate:

1. بررسی کنید که nginx به درستی reload شده است
2. در مرورگر `https://admin.asllmarket.com` را باز کنید
3. باید بدون خطای SSL باز شود
4. می‌توانید با `alireza` / `qwertyuiop!!1234` وارد شوید

