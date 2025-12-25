# بررسی مشکل 404 در API

## مشکل
خطای 404 برای `/api/v1/admin/dashboard/stats` و `/api/v1/admin/users`

## بررسی‌ها

### 1. Backend در حال اجرا است ✅
```bash
curl http://localhost:8080/health
# {"status":"OK","message":"ASL Market Backend is running"}
```

### 2. Route وجود دارد ✅
```bash
curl http://localhost:8080/api/v1/admin/dashboard/stats
# {"error":"Authorization header is required"}
# این نشان می‌دهد که route وجود دارد و کار می‌کند
```

### 3. مشکل احتمالی: Nginx Proxy

مشکل احتمالاً این است که:
- فایل nginx در سرور با فایل در پروژه متفاوت است
- یا location /api/ به درستی تنظیم نشده است

## راه‌حل

### بررسی فایل nginx در سرور:

```bash
# پیدا کردن فایل nginx
sudo find /etc/nginx -name "*admin.asllmarket.com*" -type f

# بررسی location /api/
sudo grep -A 10 "location /api/" /etc/nginx/conf.d/admin.asllmarket.com.conf
# یا
sudo grep -A 10 "location /api/" /etc/nginx/sites-available/admin.asllmarket.com.conf
```

### اگر location /api/ وجود ندارد یا اشتباه است:

فایل nginx را با نسخه صحیح از `nginx/admin.asllmarket.com.conf.CORRECT` جایگزین کنید:

```bash
# کپی فایل صحیح
sudo cp /path/to/asl_market/nginx/admin.asllmarket.com.conf.CORRECT /etc/nginx/conf.d/admin.asllmarket.com.conf

# یا اگر در sites-available است:
sudo cp /path/to/asl_market/nginx/admin.asllmarket.com.conf.CORRECT /etc/nginx/sites-available/admin.asllmarket.com.conf

# تست
sudo nginx -t

# Reload
sudo systemctl reload nginx
```

### تست نهایی:

```bash
# تست از طریق nginx
curl -I https://admin.asllmarket.com/api/v1/health

# باید 200 OK بدهد (نه 404)
```

## نکته مهم

مطمئن شوید که:
1. فایل nginx در سرور با فایل در پروژه یکسان است
2. `location /api/` قبل از `location /` قرار دارد
3. `proxy_pass http://127.0.0.1:8080;` (بدون trailing slash) است

