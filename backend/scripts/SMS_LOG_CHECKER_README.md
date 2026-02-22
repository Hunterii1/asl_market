# 📱 راهنمای بررسی لاگ‌های SMS

## 🎯 استفاده سریع

### 1. بررسی کلی لاگ‌های SMS
```bash
cd /path/to/asl_market/backend
./scripts/check_sms_logs.sh
```

### 2. جستجوی SMS برای شماره خاص
```bash
./scripts/check_sms_logs.sh 09123456789
```

### 3. مشاهده لاگ‌های زنده
```bash
# اگر فایل لاگ دارید:
tail -f /var/log/asl-market/backend.log | grep SMS

# اگر از systemd استفاده می‌کنید:
sudo journalctl -u asl-market-backend -f | grep SMS
```

---

## 📊 خروجی اسکریپت

اسکریپت اطلاعات زیر را نمایش می‌دهد:

### ✅ آمار کلی:
- تعداد SMS های ارسال شده موفق
- تعداد خطاهای ارسال
- تعداد SMS های بازیابی رمز عبور
- تعداد SMS های ثبت‌نام افیلیت

### 📅 SMS های امروز:
- لیست تمام SMS های ارسال شده امروز

### 💰 اعتبار SMS:
- آخرین اطلاعات اعتبار باقیمانده

### 🔍 جستجو بر اساس شماره:
- تمام SMS های ارسال شده به یک شماره خاص

---

## 📝 فرمت لاگ‌های SMS

### SMS موفق:
```
2024/02/21 13:45:23 SMS sent successfully to 09123456789 with message ID: 12345
2024/02/21 14:30:15 Password recovery SMS sent successfully to 09123456789 with message ID: 12346
2024/02/21 15:20:45 Affiliate registration SMS sent successfully to 09123456789 with message ID: 12347
```

### خطای ارسال:
```
2024/02/21 16:10:30 Error sending SMS to 09123456789: connection timeout
2024/02/21 16:15:22 Error sending password recovery SMS to 09123456789: invalid phone number
```

### اطلاعات اعتبار:
```
2024/02/21 17:00:00 SMS credit: 5000 messages remaining
```

---

## 🔧 دستورات دستی مفید

### 1. تعداد کل SMS های موفق:
```bash
grep -c "SMS sent successfully" /var/log/asl-market/backend.log
```

### 2. تعداد خطاهای ارسال:
```bash
grep -c "Error sending.*SMS" /var/log/asl-market/backend.log
```

### 3. آخرین 10 SMS ارسال شده:
```bash
grep "SMS sent successfully" /var/log/asl-market/backend.log | tail -10
```

### 4. جستجوی SMS برای شماره خاص:
```bash
grep "09123456789" /var/log/asl-market/backend.log | grep SMS
```

### 5. SMS های امروز:
```bash
grep "$(date +%Y/%m/%d)" /var/log/asl-market/backend.log | grep SMS
```

### 6. فقط خطاهای SMS:
```bash
grep "Error sending.*SMS" /var/log/asl-market/backend.log
```

### 7. آمار SMS به تفکیک نوع:
```bash
echo "بازیابی رمز عبور: $(grep -c 'Password recovery SMS sent successfully' /var/log/asl-market/backend.log)"
echo "ثبت‌نام افیلیت: $(grep -c 'Affiliate registration SMS sent successfully' /var/log/asl-market/backend.log)"
echo "عمومی: $(grep -c 'SMS sent successfully' /var/log/asl-market/backend.log)"
```

---

## 🗂️ مسیرهای احتمالی فایل لاگ

اسکریپت به ترتیب این مسیرها را چک می‌کند:

1. `/var/log/asl-market/backend.log`
2. `/var/log/asl-market-backend.log`
3. `./logs/backend.log`
4. `./backend.log`
5. `/tmp/asl-market-backend.log`
6. `nohup.out`

اگر هیچکدام پیدا نشد، از `journalctl` استفاده می‌کند.

---

## ⚙️ تنظیم Logging

### روش 1: هدایت به فایل با systemd

فایل سرویس: `/etc/systemd/system/asl-market-backend.service`

```ini
[Unit]
Description=ASL Market Backend
After=network.target mysql.service

[Service]
Type=simple
User=asl
WorkingDirectory=/path/to/asl_market
ExecStart=/path/to/asl_market/asl-market-backend
Restart=always
RestartSec=10

# Logging
StandardOutput=append:/var/log/asl-market/backend.log
StandardError=append:/var/log/asl-market/backend.log

[Install]
WantedBy=multi-user.target
```

ایجاد دایرکتوری لاگ:
```bash
sudo mkdir -p /var/log/asl-market
sudo chown asl:asl /var/log/asl-market
```

### روش 2: استفاده از nohup

```bash
nohup ./asl-market-backend > backend.log 2>&1 &
```

### روش 3: استفاده از logrotate

فایل: `/etc/logrotate.d/asl-market`

```
/var/log/asl-market/backend.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 asl asl
    postrotate
        systemctl reload asl-market-backend > /dev/null 2>&1 || true
    endscript
}
```

---

## 🐛 عیب‌یابی

### مشکل: فایل لاگ یافت نشد

**راه‌حل:**
```bash
# چک کنید backend در حال اجرا است یا نه
ps aux | grep asl-market-backend

# چک کنید از systemd استفاده می‌کنید یا نه
sudo systemctl status asl-market-backend

# مشاهده لاگ‌ها از journalctl
sudo journalctl -u asl-market-backend -n 100 --no-pager | grep SMS
```

### مشکل: SMS ارسال نمی‌شود

**بررسی:**
```bash
# 1. چک کنید SMS service فعال است
grep "SMS service initialized" /var/log/asl-market/backend.log

# 2. چک کنید API key تنظیم شده
grep "SMS service not configured" /var/log/asl-market/backend.log

# 3. چک کنید خطاهای اتصال
grep "Error sending.*SMS" /var/log/asl-market/backend.log | tail -10

# 4. چک کنید اعتبار کافی دارید
grep "SMS credit" /var/log/asl-market/backend.log | tail -1
```

### مشکل: خطای "connection timeout"

**راه‌حل:**
- بررسی اتصال اینترنت سرور
- بررسی فایروال (پورت 443 باید باز باشه)
- بررسی DNS

```bash
# تست اتصال به سرویس SMS
curl -I https://api.ippanel.com

# بررسی DNS
nslookup api.ippanel.com
```

---

## 📈 نمونه خروجی اسکریپت

```
📱 بررسی لاگ‌های SMS...
================================
✅ فایل لاگ یافت شد: /var/log/asl-market/backend.log

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 آمار کلی SMS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ SMS های موفق: 145
❌ خطاهای ارسال: 3
🔑 بازیابی رمز عبور: 12
👥 ثبت‌نام افیلیت: 8

📤 آخرین SMS های ارسال شده:
  ➜ 2024/02/21 13:45:23 SMS sent successfully to 09123456789 with message ID: 12345
  ➜ 2024/02/21 14:30:15 Password recovery SMS sent successfully to 09123456789 with message ID: 12346
  ➜ 2024/02/21 15:20:45 Affiliate registration SMS sent successfully to 09123456789 with message ID: 12347

⚠️  آخرین خطاها:
  ➜ 2024/02/21 16:10:30 Error sending SMS to 09123456789: connection timeout

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 SMS های امروز (2024/02/21)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  2024/02/21 13:45:23 SMS sent successfully to 09123456789 with message ID: 12345
  2024/02/21 14:30:15 Password recovery SMS sent successfully to 09123456789 with message ID: 12346

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 اعتبار SMS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  2024/02/21 17:00:00 SMS credit: 4855 messages remaining

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ بررسی لاگ‌های SMS تمام شد
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 نکات:
  • برای جستجوی شماره خاص: ./check_sms_logs.sh 09123456789
  • برای مشاهده لاگ‌های زنده: tail -f /var/log/asl-market/backend.log | grep SMS
  • برای مشاهده فقط خطاها: grep 'Error sending.*SMS' /var/log/asl-market/backend.log
```

---

## 🔗 لینک‌های مفید

- [مستندات IPPanel SMS](https://docs.ippanel.com/)
- [راهنمای systemd](https://www.freedesktop.org/software/systemd/man/systemd.service.html)
- [راهنمای logrotate](https://linux.die.net/man/8/logrotate)

---

**✨ حالا می‌تونی راحت لاگ‌های SMS رو چک کنی!** 🎉
