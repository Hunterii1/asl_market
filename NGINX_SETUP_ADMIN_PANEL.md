# راهنمای تنظیم Nginx برای Admin Panel

## ✅ آیا با وبسایت اصلی تداخل ایجاد می‌کند؟

**خیر، هیچ تداخلی ایجاد نمی‌کند!** به دلایل زیر:

1. **Server Name متفاوت:**
   - وبسایت اصلی: `asllmarket.com` و `www.asllmarket.com`
   - Admin Panel: `admin.asllmarket.com`
   - Nginx بر اساس `server_name` درخواست‌ها را مسیریابی می‌کند

2. **Root Directory متفاوت:**
   - وبسایت اصلی: `/var/www/asl_market/dist/`
   - Admin Panel: `/var/www/admin-panel/dist`

3. **Rate Limiting جداگانه:**
   - وبسایت اصلی: `zone=api` و `zone=login`
   - Admin Panel: `zone=admin_api` و `zone=admin_login`

4. **Log Files جداگانه:**
   - وبسایت اصلی: `/var/log/nginx/api.asllmarket.com.*.log`
   - Admin Panel: `/var/log/nginx/admin.asllmarket.com.*.log`

## 📋 مراحل تنظیم

### مرحله 1: کپی فایل تنظیمات به سرور

```bash
# کپی فایل تنظیمات
sudo cp nginx/admin.asllmarket.com.conf /etc/nginx/sites-available/admin.asllmarket.com.conf
```

### مرحله 2: ایجاد Symbolic Link (فعال‌سازی)

```bash
# ایجاد symbolic link برای فعال‌سازی
sudo ln -s /etc/nginx/sites-available/admin.asllmarket.com.conf /etc/nginx/sites-enabled/admin.asllmarket.com.conf
```

### مرحله 3: بررسی تنظیمات

```bash
# تست syntax nginx
sudo nginx -t
```

اگر پیام `syntax is ok` و `test is successful` را دیدید، ادامه دهید.

### مرحله 4: Reload Nginx

```bash
# Reload nginx (بدون downtime)
sudo systemctl reload nginx

# یا اگر reload کار نکرد:
sudo systemctl restart nginx
```

### مرحله 5: بررسی وضعیت

```bash
# بررسی وضعیت nginx
sudo systemctl status nginx

# بررسی لاگ‌ها
sudo tail -f /var/log/nginx/admin.asllmarket.com.error.log
```

## 🔧 تنظیمات DNS

قبل از استفاده، باید DNS را تنظیم کنید:

```bash
# در DNS Provider خود (مثل Cloudflare یا cPanel):
# یک A Record اضافه کنید:
# Name: admin
# Type: A
# Value: [IP سرور شما]
# TTL: Auto یا 3600
```

## 🔐 تنظیم SSL Certificate

اگر SSL Certificate برای `admin.asllmarket.com` ندارید:

### روش 1: استفاده از Certificate موجود (Wildcard یا Multi-domain)

اگر Certificate شما wildcard (`*.asllmarket.com`) است یا شامل `admin.asllmarket.com` می‌شود، نیازی به تغییر نیست.

### روش 2: دریافت Certificate جدید با Let's Encrypt

```bash
# دریافت SSL Certificate
sudo certbot --nginx -d admin.asllmarket.com

# یا اگر می‌خواهید برای هر دو دامنه:
sudo certbot --nginx -d asllmarket.com -d www.asllmarket.com -d admin.asllmarket.com
```

بعد از دریافت Certificate، Nginx به صورت خودکار تنظیمات را به‌روزرسانی می‌کند.

## 📁 بررسی مسیر فایل‌ها

مطمئن شوید که فایل‌های build شده در مسیر درست قرار دارند:

```bash
# بررسی وجود فایل‌ها
ls -la /var/www/admin-panel/dist/

# باید فایل index.html را ببینید
```

اگر فایل‌ها وجود ندارند:

```bash
# ایجاد پوشه
sudo mkdir -p /var/www/admin-panel/dist

# کپی فایل‌های build شده
sudo cp -r /path/to/admin-panel/dist/* /var/www/admin-panel/dist/

# تنظیم مجوزها
sudo chown -R www-data:www-data /var/www/admin-panel
sudo chmod -R 755 /var/www/admin-panel
```

## 🧪 تست

### تست 1: بررسی HTTP Redirect

```bash
curl -I http://admin.asllmarket.com
# باید 301 redirect به HTTPS بدهد
```

### تست 2: بررسی HTTPS

```bash
curl -I https://admin.asllmarket.com
# باید 200 OK بدهد
```

### تست 3: بررسی در مرورگر

1. باز کردن `https://admin.asllmarket.com`
2. باید صفحه Login Admin Panel نمایش داده شود

## 🔍 Troubleshooting

### مشکل: 502 Bad Gateway

```bash
# بررسی وضعیت Backend
curl http://localhost:8080/health

# اگر Backend در حال اجرا نیست:
cd /path/to/backend
go run main.go
```

### مشکل: 404 Not Found

```bash
# بررسی مسیر فایل‌ها
ls -la /var/www/admin-panel/dist/

# بررسی تنظیمات root در nginx
sudo nginx -T | grep "root.*admin"
```

### مشکل: SSL Certificate Error

```bash
# بررسی Certificate
sudo certbot certificates

# اگر Certificate ندارید:
sudo certbot --nginx -d admin.asllmarket.com
```

### مشکل: CORS Error

اگر در Console مرورگر CORS Error می‌بینید:

1. بررسی کنید که Backend در حال اجرا است
2. بررسی کنید که `/api/` به درستی proxy می‌شود:

```bash
curl -I https://admin.asllmarket.com/api/v1/health
```

## 📝 نکات مهم

1. **Backend باید در حال اجرا باشد:** Admin Panel به Backend در `http://127.0.0.1:8080` متصل می‌شود

2. **DNS Propagation:** بعد از تنظیم DNS، ممکن است 24-48 ساعت طول بکشد تا تغییرات اعمال شود

3. **Firewall:** مطمئن شوید که پورت 80 و 443 باز هستند:

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

4. **Log Files:** برای دیباگ، لاگ‌ها را بررسی کنید:

```bash
# Access Log
sudo tail -f /var/log/nginx/admin.asllmarket.com.access.log

# Error Log
sudo tail -f /var/log/nginx/admin.asllmarket.com.error.log
```

## ✅ چک‌لیست نهایی

- [ ] فایل تنظیمات کپی شده است
- [ ] Symbolic link ایجاد شده است
- [ ] `nginx -t` بدون خطا است
- [ ] Nginx reload شده است
- [ ] DNS تنظیم شده است
- [ ] SSL Certificate تنظیم شده است
- [ ] فایل‌های build شده در `/var/www/admin-panel/dist` هستند
- [ ] Backend در حال اجرا است
- [ ] می‌توانید به `https://admin.asllmarket.com` دسترسی داشته باشید

## 🎉 تمام!

بعد از انجام این مراحل، Admin Panel شما باید در `https://admin.asllmarket.com` در دسترس باشد.

