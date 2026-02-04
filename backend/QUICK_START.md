# 🚀 راه‌اندازی سریع ASL Market

## پیش‌نیازها
- ✅ MySQL 8.0+
- ✅ Go 1.21+
- ✅ Node.js 18+

## راه‌اندازی در 3 مرحله

### 1️⃣ راه‌اندازی دیتابیس

**روش A: اسکریپت خودکار (پیشنهادی)**
```bash
# Windows
cd backend\scripts
setup_database.bat

# Linux/macOS  
cd backend/scripts
chmod +x setup_database.sh
./setup_database.sh
```

**روش B: دستی**
```sql
mysql -u root -p
CREATE DATABASE asl_market CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'asl_user'@'localhost' IDENTIFIED BY 'asl_password_2024';
GRANT ALL PRIVILEGES ON asl_market.* TO 'asl_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 2️⃣ اجرای بک‌اند
```bash
cd backend
go mod tidy
go run main.go
```

✅ بک‌اند در `http://localhost:8080` اجرا می‌شود

### 3️⃣ اجرای فرانت‌اند
```bash
# در terminal جدید
npm install
npm run dev
```

✅ فرانت‌اند در `http://localhost:5173` اجرا می‌شود

## 🧪 تست کردن

### حساب تست آماده
- **ایمیل:** `test@asllmarket.com`
- **رمز:** `password123`

### ساخت حساب جدید
1. برو به `http://localhost:5173/signup`
2. فرم ثبت‌نام را پر کن
3. بعد از ثبت‌نام خودکار وارد می‌شوی

## 📍 URLهای مهم

| سرویس | URL | توضیح |
|--------|-----|-------|
| فرانت‌اند | http://localhost:5173 | رابط کاربری اصلی |
| بک‌اند | http://localhost:8080 | API سرور |
| Health Check | http://localhost:8080/health | وضعیت سرور |
| API Docs | [README.md](README.md) | مستندات API |

## 🔧 عیب‌یابی

### خطای اتصال دیتابیس
```bash
# بررسی وضعیت MySQL
# Windows
net start mysql

# Linux/macOS
sudo systemctl status mysql
# یا
brew services list | grep mysql
```

### خطای Go modules
```bash
cd backend
go clean -modcache
go mod tidy
go mod download
```

### خطای پورت در حال استفاده
```bash
# پیدا کردن process روی پورت 8080
# Windows
netstat -ano | findstr :8080

# Linux/macOS
lsof -i :8080
```

## 🔐 امنیت

### تغییر رمز دیتابیس (Production)
```sql
ALTER USER 'asl_user'@'localhost' IDENTIFIED BY 'your_secure_password';
```

### تغییر JWT Secret
```yaml
# backend/config/config.yaml
jwt:
  secret: "your_super_secure_jwt_secret_key"
```

## 📂 ساختار پروژه

```
asl_market/
├── backend/                 # Go Backend
│   ├── main.go             # Entry point
│   ├── config/             # Configuration
│   ├── models/             # Database models
│   ├── controllers/        # API controllers
│   ├── middleware/         # Middleware
│   ├── routes/             # API routes
│   ├── utils/              # Utilities
│   └── scripts/            # Setup scripts
├── src/                    # React Frontend
│   ├── components/         # UI Components
│   ├── pages/              # Pages
│   ├── hooks/              # Custom hooks
│   └── services/           # API services
└── README.md
```

## 🆘 کمک

اگر مشکلی داشتید:
1. مطالعه [README.md](README.md) کامل
2. بررسی لاگ‌های سرور
3. اطمینان از اجرای MySQL
4. کانفیگ صحیح در `config/config.yaml`

---

## ✨ ویژگی‌های آماده

- [x] احراز هویت با JWT
- [x] ثبت‌نام و ورود
- [x] محافظت از صفحات
- [x] مدیریت کاربران
- [x] CORS برای ارتباط فرانت/بک
- [x] راه‌اندازی خودکار دیتابیس
- [x] اسکریپت‌های نصب

🎉 **حالا آماده‌اید! پروژه‌تان را شروع کنید!** 