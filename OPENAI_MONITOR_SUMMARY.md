# 🤖 سیستم هشدار OpenAI - خلاصه پیاده‌سازی

## ✅ کارهای انجام شده

### 1. سرویس مانیتورینگ OpenAI
- **فایل**: `backend/services/openai_monitor.go`
- **ویژگی‌ها**:
  - مانیتورینگ خودکار هر 6 ساعت
  - هشدار در $2.50
  - ارسال پیام به ادمین‌ها در تلگرام
  - محاسبه تقریبی هزینه بر اساس tokens

### 2. کنترلر API
- **فایل**: `backend/controllers/openai_monitor_controller.go`
- **API Endpoints**:
  - `GET /api/v1/admin/openai/usage` - آمار استفاده
  - `POST /api/v1/admin/openai/check` - بررسی دستی
  - `POST /api/v1/admin/openai/test-alert` - تست هشدار

### 3. تنظیمات Routes
- **فایل**: `backend/routes/routes.go`
- **تغییرات**: اضافه شدن routes جدید برای مانیتورینگ

### 4. اسکریپت‌های تست
- **فایل**: `backend/scripts/test_openai_alert.go`
- **فایل**: `test_openai_alert.bat`
- **فایل**: `test_complete_system.bat`

### 5. اسکریپت نصب
- **فایل**: `install_openai_monitor.bat`
- **فایل**: `backend/scripts/setup_openai_monitor.sh`

### 6. مستندات
- **فایل**: `backend/OPENAI_MONITOR_README.md`
- **فایل**: `backend/config/monitor_config.yaml`

## 🚀 نحوه استفاده

### 1. راه‌اندازی
```bash
# نصب و تست سیستم
./install_openai_monitor.bat

# تست کامل سیستم
./test_complete_system.bat
```

### 2. API Endpoints
```bash
# دریافت آمار استفاده
curl -X GET "http://localhost:8080/api/v1/admin/openai/usage"

# بررسی دستی
curl -X POST "http://localhost:8080/api/v1/admin/openai/check"

# تست هشدار
curl -X POST "http://localhost:8080/api/v1/admin/openai/test-alert"
```

### 3. تنظیمات Environment
```bash
# متغیرهای مورد نیاز
OPENAI_API_KEY=your_openai_api_key
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
ADMIN_IDS=76599340,276043481,110435852
```

## 🔧 ویژگی‌های سیستم

### مانیتورینگ خودکار
- ✅ بررسی هر 6 ساعت
- ✅ هشدار در $2.50
- ✅ جلوگیری از spam (هر 24 ساعت یکبار)
- ✅ Reset در $2.00

### هشدارهای تلگرام
- ✅ پیام فارسی
- ✅ اطلاعات کامل (مبلغ، زمان، لینک)
- ✅ ارسال به همه ادمین‌ها
- ✅ پیام تست

### API Management
- ✅ آمار real-time
- ✅ کنترل دستی
- ✅ تست سیستم
- ✅ فقط برای ادمین‌ها

## 📊 نمونه پیام هشدار

```
🚨 **هشدار شارژ OpenAI**

💰 **شارژ فعلی**: $2.4567
⚠️ **وضعیت**: نزدیک به $3.00
🕐 **زمان**: 2024-01-15 14:30:00

📝 **توصیه**: لطفاً حساب OpenAI را شارژ کنید تا سرویس هوش مصنوعی قطع نشود.

🔗 **لینک مدیریت**: https://platform.openai.com/account/billing
```

## ⚠️ نکات مهم

1. **API Key**: باید OpenAI API key معتبر باشد
2. **Telegram Bot**: باید bot token و admin IDs صحیح باشند
3. **Database**: باید اتصال به دیتابیس برقرار باشد
4. **Permissions**: فقط ادمین‌ها می‌توانند از API استفاده کنند

## 🎯 وضعیت فعلی

- ✅ **Backend**: پیاده‌سازی شده
- ✅ **API**: آماده استفاده
- ✅ **Monitoring**: فعال
- ✅ **Alerts**: پیکربندی شده
- ✅ **Testing**: اسکریپت‌های تست آماده
- ✅ **Documentation**: کامل

## 🔄 مراحل بعدی

1. **تنظیم Environment Variables**
2. **تست سیستم در محیط production**
3. **مانیتورینگ عملکرد**
4. **تنظیم fine-tuning در صورت نیاز**

---

**تاریخ پیاده‌سازی**: 2024-01-15  
**وضعیت**: ✅ آماده استفاده  
**نسخه**: 1.0.0
