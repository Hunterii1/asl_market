# تصحیح دستی فایل nginx

## مشکل
بعد از حذف `location ~ ^/api/` با sed، syntax error ایجاد شده است.

## راه‌حل

### روش 1: بازگردانی از backup و تصحیح دستی

```bash
# 1. بازگردانی از backup
sudo cp /etc/nginx/conf.d/admin.asllmarket.com.conf.backupF /etc/nginx/conf.d/admin.asllmarket.com.conf

# 2. باز کردن فایل
sudo nano /etc/nginx/conf.d/admin.asllmarket.com.conf

# 3. پیدا کردن بخش location ~ ^/api/ (حدود خط 114)
# و آن را به صورت کامل حذف کنید:
#    location ~ ^/api/ {
#        if ($request_method = 'OPTIONS') {
#            add_header Access-Control-Allow-Origin "https://admin.asllmarket.com";
#            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
#            add_header Access-Control-Allow-Headers "Origin, Content-Type, Accept, Authorization, X-Requested-With";
#            add_header Access-Control-Allow-Credentials "true";
#            add_header Access-Control-Max-Age 86400;
#            add_header Content-Length 0;
#            add_header Content-Type "text/plain charset=UTF-8";
#            return 204;
#        }
#    }
```

### روش 2: استفاده از فایل صحیح

```bash
# کپی فایل صحیح از پروژه
sudo cp /var/www/asl_market/nginx/admin.asllmarket.com.conf.CORRECT /etc/nginx/conf.d/admin.asllmarket.com.conf

# تست
sudo nginx -t

# Reload
sudo systemctl reload nginx
```

### روش 3: تصحیح با sed (دقیق‌تر)

```bash
# ابتدا backup بگیرید
sudo cp /etc/nginx/conf.d/admin.asllmarket.com.conf /etc/nginx/conf.d/admin.asllmarket.com.conf.backup2

# پیدا کردن خطوط location ~ ^/api/
grep -n "location ~ \^/api/" /etc/nginx/conf.d/admin.asllmarket.com.conf

# پیدا کردن خط بسته شدن
# سپس با sed دقیق‌تر حذف کنید
# یا به صورت دستی با nano باز کنید و حذف کنید
```

## فایل صحیح

فایل `nginx/admin.asllmarket.com.conf.CORRECT` در پروژه شما فایل صحیح است که باید استفاده کنید.

