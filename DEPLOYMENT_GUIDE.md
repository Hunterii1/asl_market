# 🚀 راهنمای کامل Production Deployment - اصل مارکت

## 🎯 **معماری Production**

```
📦 Internet
    ↓
🌐 Nginx (Port 80/443)
    ├─ asllmarket.com → Frontend (Static Files)
    └─ api.asllmarket.com → Backend Proxy
                               ↓
                           🏃 Go Backend (Port 8080)
                               ↓ 
                           🗄️ MySQL Database
```

## 📋 **Prerequisites**

### 🖥️ **سرور:**
- Ubuntu 20.04+ یا Debian 11+
- RAM: حداقل 2GB (توصیه 4GB)
- Storage: حداقل 20GB
- دامنه‌های تنظیم شده:
  - `asllmarket.com`
  - `www.asllmarket.com` 
  - `api.asllmarket.com`

### 💻 **محلی:**
- Node.js 18+
- Go 1.21+
- Git

## 🔧 **مرحله 1: آماده‌سازی محلی**

### 1.1 ویرایش تنظیمات Deploy

```bash
# ویرایش اسکریپت deploy
nano deploy.sh

# تغییر IP سرور
SERVER_HOST="YOUR_SERVER_IP"
```

### 1.2 تست Build محلی

```bash
# تست Frontend build
npm run build
ls dist/  # باید فایل‌ها را ببینید

# تست Backend build  
cd backend
go build -o backend main.go
./backend  # تست اجرا
cd ..
```

## 🖥️ **مرحله 2: راه‌اندازی سرور**

### 2.1 اتصال به سرور

```bash
ssh root@YOUR_SERVER_IP
```

### 2.2 کپی فایل‌های کانفیگ

```bash
# در سرور local
scp -r nginx supervisor server-setup.sh root@YOUR_SERVER_IP:/root/
```

### 2.3 اجرای اسکریپت راه‌اندازی

```bash
# در سرور
chmod +x server-setup.sh
./server-setup.sh
```

این اسکریپت:
- ✅ نرم‌افزارهای مورد نیاز را نصب می‌کند
- ✅ MySQL را راه‌اندازی می‌کند  
- ✅ Nginx و Supervisor را تنظیم می‌کند
- ✅ فایروال را پیکربندی می‌کند
- ✅ SSL certificate دریافت می‌کند

## 🔐 **مرحله 3: تنظیم DNS**

در پنل دامنه خود:

```
A Record: asllmarket.com → YOUR_SERVER_IP
A Record: www.asllmarket.com → YOUR_SERVER_IP  
A Record: api.asllmarket.com → YOUR_SERVER_IP
```

## 🚀 **مرحله 4: Deploy اول**

### 4.1 ویرایش تنظیمات Production

```bash
# ویرایش کانفیگ backend
nano backend/config/production.yaml

# تغییر موارد زیر:
# - JWT secret
# - Database password
# - OpenAI API key
```

### 4.2 اجرای Deploy

```bash
# اجازه اجرا
chmod +x deploy.sh

# Deploy
./deploy.sh
```

## ✅ **مرحله 5: تست و بررسی**

### 5.1 تست Frontend

```bash
curl -I https://asllmarket.com
# انتظار: 200 OK
```

### 5.2 تست Backend API

```bash
curl https://api.asllmarket.com/health
# انتظار: {"status": "ok"}
```

### 5.3 بررسی Logs

```bash
# در سرور
sudo supervisorctl status aslmarket-backend
sudo supervisorctl tail -f aslmarket-backend

# Nginx logs
sudo tail -f /var/log/nginx/api.asllmarket.com.access.log
sudo tail -f /var/log/nginx/api.asllmarket.com.error.log
```

## 🔧 **کامندهای مدیریت**

### 🔄 **ری‌استارت سرویس‌ها**

```bash
# Backend
sudo supervisorctl restart aslmarket-backend

# Nginx  
sudo systemctl reload nginx

# MySQL
sudo systemctl restart mysql
```

### 📊 **مانیتورینگ**

```bash
# وضعیت سرویس‌ها
sudo supervisorctl status
sudo systemctl status nginx
sudo systemctl status mysql

# منابع سیستم
htop
df -h
free -h

# لاگ‌های real-time
sudo journalctl -f -u nginx
sudo supervisorctl tail -f aslmarket-backend
```

### 🔐 **SSL Management**

```bash
# تمدید SSL
sudo certbot renew

# تست تمدید
sudo certbot renew --dry-run

# بررسی وضعیت SSL
sudo certbot certificates
```

## 🐛 **عیب‌یابی مشکلات متداول**

### ❌ **Backend در دسترس نیست**

```bash
# بررسی وضعیت
sudo supervisorctl status aslmarket-backend

# بررسی لاگ
sudo supervisorctl tail aslmarket-backend

# ری‌استارت
sudo supervisorctl restart aslmarket-backend

# بررسی port
sudo netstat -tlnp | grep :8080
```

### ❌ **مشکل CORS**

```bash
# بررسی Nginx config
sudo nginx -t

# بررسی لاگ Nginx
sudo tail -f /var/log/nginx/error.log
```

### ❌ **مشکل SSL**

```bash
# بررسی certificate
sudo certbot certificates

# تست SSL
curl -I https://api.asllmarket.com
```

### ❌ **مشکل Database**

```bash
# اتصال به MySQL
mysql -u asl_user -p asl_market

# بررسی جداول
SHOW TABLES;

# بررسی لاگ
sudo tail -f /var/log/mysql/error.log
```

## 🔄 **Deploy‌های بعدی**

برای deploy‌های بعدی فقط کافیست:

```bash
# در local
./deploy.sh
```

این کار:
1. 📦 Frontend را build می‌کند
2. ⚙️ Backend را build می‌کند  
3. 📤 فایل‌ها را آپلود می‌کند
4. 🔄 سرویس‌ها را ری‌استارت می‌کند

## 📈 **بهینه‌سازی Production**

### 🚄 **Performance**

```bash
# Nginx gzip compression ✅
# Static file caching ✅  
# Database indexing ✅
# Go binary optimization ✅
```

### 🔒 **Security**

```bash
# SSL/TLS ✅
# Rate limiting ✅
# Firewall ✅
# Security headers ✅
# CORS configuration ✅
```

### 📊 **Monitoring**

```bash
# Log rotation ✅
# Error tracking ✅
# Performance monitoring ✅
# Uptime monitoring (توصیه: UptimeRobot)
```

## 🆘 **پشتیبانی**

در صورت بروز مشکل:

1. 📋 لاگ‌ها را بررسی کنید
2. 🔄 سرویس‌ها را ری‌استارت کنید
3. 🧪 تنظیمات را تست کنید
4. 📞 با تیم فنی تماس بگیرید

---

## 🎉 **تبریک!**

سایت اصل مارکت حالا در production آماده است:

- 🌐 **Frontend**: https://asllmarket.com
- 🔗 **API**: https://api.asllmarket.com
- 📱 **PWA**: قابل نصب روی موبایل
- 🤖 **AI Chat**: با ChatGPT integration
- 🔐 **Secure**: SSL، Authentication، CORS

**موفق باشید! 🚀** 