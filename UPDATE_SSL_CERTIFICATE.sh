#!/bin/bash

# اسکریپت به‌روزرسانی SSL Certificate برای اضافه کردن admin.asllmarket.com

echo "🔐 به‌روزرسانی SSL Certificate..."
echo "================================"

# بررسی اینکه آیا nginx در حال اجرا است
if ! systemctl is-active --quiet nginx; then
    echo "❌ Nginx در حال اجرا نیست. لطفاً ابتدا nginx را شروع کنید:"
    echo "   sudo systemctl start nginx"
    exit 1
fi

echo "✅ Nginx در حال اجرا است"

# بررسی DNS
echo ""
echo "🔍 بررسی DNS..."
if ! nslookup admin.asllmarket.com > /dev/null 2>&1; then
    echo "⚠️  هشدار: DNS برای admin.asllmarket.com ممکن است تنظیم نشده باشد"
    echo "   لطفاً مطمئن شوید که DNS تنظیم شده است"
    read -p "ادامه بدهید؟ (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# به‌روزرسانی Certificate با اضافه کردن admin.asllmarket.com
echo ""
echo "📝 به‌روزرسانی Certificate..."
echo "   دامنه‌های موجود: asllmarket.com, api.asllmarket.com, www.asllmarket.com"
echo "   دامنه جدید: admin.asllmarket.com"

sudo certbot --nginx -d asllmarket.com -d www.asllmarket.com -d api.asllmarket.com -d admin.asllmarket.com --expand

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Certificate با موفقیت به‌روزرسانی شد!"
    echo ""
    echo "🧪 تست تنظیمات..."
    sudo nginx -t
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ تنظیمات Nginx معتبر است"
        echo ""
        echo "🔄 Reload کردن Nginx..."
        sudo systemctl reload nginx
        echo ""
        echo "🎉 تمام! حالا می‌توانید به https://admin.asllmarket.com دسترسی داشته باشید"
    else
        echo ""
        echo "❌ خطا در تنظیمات Nginx. لطفاً خطاها را بررسی کنید"
        exit 1
    fi
else
    echo ""
    echo "❌ خطا در به‌روزرسانی Certificate"
    exit 1
fi

