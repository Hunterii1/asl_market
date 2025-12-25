#!/bin/bash

# اسکریپت تصحیح مسیر nginx و reload

echo "🔧 تصحیح مسیر Nginx برای Admin Panel..."
echo "================================"

# بررسی وجود فایل‌ها
if [ ! -f "/var/www/asl_market/admin-panel/dist/index.html" ]; then
    echo "❌ فایل index.html در مسیر /var/www/asl_market/admin-panel/dist یافت نشد"
    echo "   لطفاً مطمئن شوید که فایل‌های build شده در این مسیر هستند"
    exit 1
fi

echo "✅ فایل‌ها در مسیر درست هستند"

# بررسی فایل nginx
NGINX_CONF="/etc/nginx/sites-available/admin.asllmarket.com.conf"

if [ ! -f "$NGINX_CONF" ]; then
    echo "❌ فایل nginx یافت نشد: $NGINX_CONF"
    echo "   در حال کپی کردن فایل..."
    sudo cp nginx/admin.asllmarket.com.conf "$NGINX_CONF"
fi

# تصحیح مسیر در فایل nginx
echo ""
echo "📝 تصحیح مسیر در فایل nginx..."
sudo sed -i 's|root /var/www/admin-panel/dist;|root /var/www/asl_market/admin-panel/dist;|g' "$NGINX_CONF"

# بررسی syntax
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
        echo "🧪 تست..."
        curl -I https://admin.asllmarket.com 2>&1 | head -5
        echo ""
        echo "🎉 تمام! حالا باید https://admin.asllmarket.com کار کند"
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

