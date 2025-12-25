#!/bin/bash

# اسکریپت نهایی‌سازی تنظیمات SSL

echo "🔧 نهایی‌سازی تنظیمات SSL..."
echo "================================"

# بررسی Certificate
echo ""
echo "📋 بررسی Certificate..."
sudo certbot certificates | grep -A 5 "asllmarket.com"

# بررسی فایل‌های nginx
echo ""
echo "🔍 بررسی فایل‌های Nginx..."

# بررسی اینکه آیا فایل admin.asllmarket.com.conf در sites-enabled است
if [ -L /etc/nginx/sites-enabled/admin.asllmarket.com.conf ]; then
    echo "✅ فایل admin.asllmarket.com.conf فعال است"
else
    echo "⚠️  فایل admin.asllmarket.com.conf فعال نیست"
    echo "   در حال فعال‌سازی..."
    sudo ln -s /etc/nginx/sites-available/admin.asllmarket.com.conf /etc/nginx/sites-enabled/admin.asllmarket.com.conf 2>/dev/null
fi

# بررسی syntax nginx
echo ""
echo "🧪 تست تنظیمات Nginx..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ تنظیمات Nginx معتبر است"
    echo ""
    echo "🔄 Reload کردن Nginx..."
    sudo systemctl reload nginx
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Nginx با موفقیت reload شد"
        echo ""
        echo "🧪 تست SSL..."
        echo ""
        echo "تست admin.asllmarket.com:"
        curl -I https://admin.asllmarket.com 2>&1 | head -5
        echo ""
        echo "🎉 تمام! حالا می‌توانید به https://admin.asllmarket.com دسترسی داشته باشید"
    else
        echo ""
        echo "❌ خطا در reload کردن Nginx"
        exit 1
    fi
else
    echo ""
    echo "❌ خطا در تنظیمات Nginx"
    exit 1
fi

