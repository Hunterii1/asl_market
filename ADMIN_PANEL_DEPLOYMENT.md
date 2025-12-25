# راهنمای Deploy کردن Admin Panel

این راهنما مراحل کامل build و deploy کردن Admin Panel را توضیح می‌دهد.

## 📋 پیش‌نیازها

1. Node.js و npm نصب شده باشد
2. Nginx نصب و در حال اجرا باشد
3. SSL Certificate برای `admin.asllmarket.com` تنظیم شده باشد
4. Backend Go در حال اجرا باشد (پورت 8080)

## 🔨 مرحله 1: Build کردن Admin Panel

### در Windows:
```bash
cd admin-panel
build.bat
```

### در Linux/Mac:
```bash
cd admin-panel
chmod +x build.sh
./build.sh
```

یا به صورت دستی:
```bash
cd admin-panel
npm install
npm run build
```

خروجی build در پوشه `admin-panel/dist` قرار می‌گیرد.

## 📁 مرحله 2: کپی کردن فایل‌های Build شده

فایل‌های build شده را به سرور کپی کنید:

```bash
# ایجاد پوشه مقصد
sudo mkdir -p /var/www/admin.asllmarket.com

# کپی فایل‌ها
sudo cp -r admin-panel/dist/* /var/www/admin.asllmarket.com/

# تنظیم مجوزها
sudo chown -R www-data:www-data /var/www/admin.asllmarket.com
sudo chmod -R 755 /var/www/admin.asllmarket.com
```

## ⚙️ مرحله 3: تنظیم Nginx

### 3.1. کپی کردن فایل تنظیمات Nginx

```bash
sudo cp nginx/admin.asllmarket.com.conf /etc/nginx/sites-available/admin.asllmarket.com.conf
```

### 3.2. ایجاد Symbolic Link

```bash
sudo ln -s /etc/nginx/sites-available/admin.asllmarket.com.conf /etc/nginx/sites-enabled/admin.asllmarket.com.conf
```

### 3.3. تست تنظیمات Nginx

```bash
sudo nginx -t
```

اگر خطایی وجود نداشت، ادامه دهید.

### 3.4. Restart کردن Nginx

```bash
sudo systemctl restart nginx
```

## 🔐 مرحله 4: ایجاد یوزر ادمین

برای ایجاد یوزر ادمین با مشخصات زیر:
- **Email:** `alireza`
- **Password:** `qwertyuiop!!1234`

```bash
cd backend
go run scripts/create_admin_user.go
```

یا اگر فایل کامپایل شده دارید:
```bash
cd backend/scripts
go build -o create_admin_user create_admin_user.go
./create_admin_user
```

## ✅ مرحله 5: تست

1. باز کردن مرورگر و رفتن به: `https://admin.asllmarket.com`
2. ورود با:
   - **Email:** `alireza`
   - **Password:** `qwertyuiop!!1234`

## 🔧 Troubleshooting

### مشکل: صفحه سفید نمایش داده می‌شود
- بررسی کنید که فایل‌های build شده در `/var/www/admin.asllmarket.com` موجود باشند
- بررسی لاگ‌های Nginx: `sudo tail -f /var/log/nginx/admin.asllmarket.com.error.log`

### مشکل: API calls کار نمی‌کنند
- بررسی کنید که Backend در حال اجرا باشد: `curl http://localhost:8080/health`
- بررسی کنید که Nginx به درستی به Backend proxy می‌کند
- بررسی CORS headers در تنظیمات Nginx

### مشکل: SSL Certificate
- اگر SSL Certificate ندارید، می‌توانید از Let's Encrypt استفاده کنید:
```bash
sudo certbot --nginx -d admin.asllmarket.com
```

### مشکل: Permission Denied
- بررسی مجوزهای فایل‌ها:
```bash
sudo chown -R www-data:www-data /var/www/admin.asllmarket.com
sudo chmod -R 755 /var/www/admin.asllmarket.com
```

## 📝 نکات مهم

1. **API Base URL:** Admin Panel به صورت خودکار API Base URL را بر اساس hostname تنظیم می‌کند:
   - `admin.asllmarket.com` → `https://admin.asllmarket.com/api/v1`
   - `localhost` → `/api/v1` (proxy)

2. **Authentication:** Token در `localStorage` با کلید `auth_token` ذخیره می‌شود.

3. **CORS:** تنظیمات CORS در Nginx برای `admin.asllmarket.com` تنظیم شده است.

4. **Rate Limiting:** Rate limiting برای API و Login در Nginx تنظیم شده است.

## 🔄 به‌روزرسانی

برای به‌روزرسانی Admin Panel:

1. Build جدید بگیرید:
```bash
cd admin-panel
npm run build
```

2. فایل‌های جدید را کپی کنید:
```bash
sudo cp -r admin-panel/dist/* /var/www/admin.asllmarket.com/
```

3. Restart Nginx (معمولاً نیاز نیست، اما برای اطمینان):
```bash
sudo systemctl reload nginx
```

## 📞 پشتیبانی

در صورت بروز مشکل، لاگ‌های زیر را بررسی کنید:

- Nginx Access Log: `/var/log/nginx/admin.asllmarket.com.access.log`
- Nginx Error Log: `/var/log/nginx/admin.asllmarket.com.error.log`
- Backend Logs: (بسته به تنظیمات شما)

