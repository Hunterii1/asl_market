# SMS Setup Guide

## 📱 SMS تایید لایسنس

بعد از فعال‌سازی لایسنس، سیستم خودکار به کاربر SMS تایید می‌فرسته.

**Implementation:** مبتنی بر [Official Ippanel Go SDK](https://raw.githubusercontent.com/ippanel/go-rest-sdk/refs/heads/master/ippanel.go)

### ⚙️ Configuration

در فایل `config/config.yaml`:

```yaml
sms:
  api_key: "OWY5ZTAyMjEtMThmNi00NzRiLWFhOTItZTEwMmFhNDQzZTliZTcwM2EzODg5NzUzNWMwOWE3ZDliYWUyYTExMWZlMzY="
  originator: "50004001"
  pattern_code: "9i276pvpwvuj40w"
  password_recovery_pattern: "gvqto0pk77stx2t"
```

### 📋 Pattern Setup در پنل ippanel

**Pattern Code:** `9i276pvpwvuj40w`

**Pattern Text:**
```
%name% عزیز، لایسنس %plan% شما با موفقیت فعال شد. به اصل مارکت خوش آمدید!
```

**Variables:**
- `%name%` - نام کاربر (از FullName یا Email)
- `%plan%` - نوع لایسنس (پلاس/پرو)

### 📱 SMS بازیابی رمز عبور

بعد از درخواست بازیابی رمز عبور، سیستم خودکار کد ۶ رقمی به کاربر SMS می‌فرسته.

**Pattern Code:** `gvqto0pk77stx2t`

**Pattern Text:**
```
کد بازیابی رمز عبور شما: %code%
```

**Variables:**
- `%code%` - کد ۶ رقمی بازیابی

### 🎯 نحوه کارکرد

#### لایسنس فعال‌سازی:
1. **کاربر لایسنس کد وارد می‌کنه**
2. **سیستم لایسنس رو تایید می‌کنه**
3. **بلافاصله SMS فرستاده میشه** (background)
4. **SMS شامل نام کاربر و نوع لایسنس**

#### بازیابی رمز عبور:
1. **کاربر شماره موبایل وارد می‌کنه**
2. **سیستم کد ۶ رقمی تولید می‌کنه**
3. **کد از طریق SMS ارسال میشه** (pattern: gvqto0pk77stx2t)
4. **کاربر کد رو وارد می‌کنه و رمز جدید تنظیم می‌کنه**

### 📱 Phone Number Formats

سیستم خودکار تبدیل می‌کنه:
- `09123456789` → `989123456789`
- `9123456789` → `989123456789`
- `+989123456789` → `989123456789`

### 🔧 Testing

برای تست SMS service:

```bash
go run test_sms.go
```

**Output:**
```
SMS Credit: 1000.50
Input: 09123456789 -> Output: 989123456789
Input: 9123456789 -> Output: 989123456789
Input: +989123456789 -> Output: 989123456789
Input: 989123456789 -> Output: 989123456789
```

### ⚠️ Important Notes

1. **SMS fقط برای موفقیت‌آمیز license activation فرستاده میشه**
2. **اگر SMS نفرستاده بشه، لایسنس همچنان فعال میشه**
3. **Phone number باید در profile کاربر موجود باشه**
4. **SMS در background فرستاده میشه (non-blocking)**

### 🚀 Production Deployment

1. **Config file update کنید:**
```bash
cp config/config.example.yaml config/config.yaml
# Edit config.yaml with your settings
```

2. **Server restart کنید:**
```bash
sudo systemctl restart asl-market-backend
```

3. **Test license activation** و بررسی کنید SMS دریافت میشه

### 💡 Pattern Variables

در پنل ippanel می‌تونید pattern رو customize کنید:

**مثال‌های دیگر:**
```
سلام %name%، لایسنس %plan% شما فعال شد ✅
```

```
%name% عزیز، حساب %plan% شما آماده استفاده است 🎉
```

### 📊 Monitoring

Logs برای SMS در server logs قابل مشاهده است:

```
SMS sent successfully to 989123456789 with message ID: 12345
Failed to send license activation SMS to 989123456789: invalid phone number
```
