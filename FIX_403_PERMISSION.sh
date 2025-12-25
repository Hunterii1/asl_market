#!/bin/bash

# اسکریپت رفع خطای 403 Forbidden

echo "🔧 رفع خطای 403 Forbidden..."
echo "================================"

# مسیر فایل‌های Admin Panel
ADMIN_PANEL_PATH="/var/www/asl_market/admin-panel/dist"

# بررسی وجود فایل‌ها
echo ""
echo "🔍 بررسی فایل‌ها..."
if [ ! -f "$ADMIN_PANEL_PATH/index.html" ]; then
    echo "❌ فایل index.html یافت نشد در: $ADMIN_PANEL_PATH"
    echo "   لطفاً مطمئن شوید که فایل‌های build شده در این مسیر هستند"
    exit 1
fi

echo "✅ فایل index.html یافت شد"

# بررسی مجوزهای فایل‌ها
echo ""
echo "📋 بررسی مجوزهای فعلی..."
ls -la "$ADMIN_PANEL_PATH" | head -5

# تنظیم مجوزها
echo ""
echo "🔐 تنظیم مجوزها..."

# تنظیم owner به www-data (کاربر nginx)
echo "   تنظیم owner به www-data..."
sudo chown -R www-data:www-data /var/www/asl_market/admin-panel

# تنظیم مجوزهای پوشه‌ها (755 = rwxr-xr-x)
echo "   تنظیم مجوزهای پوشه‌ها..."
sudo find /var/www/asl_market/admin-panel -type d -exec chmod 755 {} \;

# تنظیم مجوزهای فایل‌ها (644 = rw-r--r--)
echo "   تنظیم مجوزهای فایل‌ها..."
sudo find /var/www/asl_market/admin-panel -type f -exec chmod 644 {} \;

# بررسی مجوزهای جدید
echo ""
echo "✅ مجوزها تنظیم شد"
echo ""
echo "📋 مجوزهای جدید:"
ls -la "$ADMIN_PANEL_PATH" | head -5

# بررسی SELinux (اگر فعال است)
if command -v getenforce &> /dev/null; then
    SELINUX_STATUS=$(getenforce)
    if [ "$SELINUX_STATUS" != "Disabled" ]; then
        echo ""
        echo "⚠️  SELinux فعال است. تنظیم context..."
        sudo chcon -R -t httpd_sys_content_t /var/www/asl_market/admin-panel
        echo "✅ SELinux context تنظیم شد"
    fi
fi

# بررسی nginx
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
        curl -I https://admin.asllmarket.com 2>&1 | head -10
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

