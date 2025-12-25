#!/bin/bash

# اسکریپت رفع خطای 403 Forbidden (با تشخیص خودکار کاربر nginx)

echo "🔧 رفع خطای 403 Forbidden..."
echo "================================"

# تشخیص کاربر nginx
echo ""
echo "🔍 تشخیص کاربر nginx..."

# بررسی کاربر nginx
if id "nginx" &>/dev/null; then
    NGINX_USER="nginx"
    NGINX_GROUP="nginx"
    echo "✅ کاربر nginx یافت شد"
elif id "www-data" &>/dev/null; then
    NGINX_USER="www-data"
    NGINX_GROUP="www-data"
    echo "✅ کاربر www-data یافت شد"
elif id "httpd" &>/dev/null; then
    NGINX_USER="httpd"
    NGINX_GROUP="httpd"
    echo "✅ کاربر httpd یافت شد"
else
    # بررسی از طریق process nginx
    NGINX_PROCESS_USER=$(ps aux | grep '[n]ginx: worker' | head -1 | awk '{print $1}')
    if [ -n "$NGINX_PROCESS_USER" ]; then
        NGINX_USER="$NGINX_PROCESS_USER"
        NGINX_GROUP="$NGINX_PROCESS_USER"
        echo "✅ کاربر nginx از process: $NGINX_USER"
    else
        echo "❌ کاربر nginx یافت نشد"
        echo "   لطفاً به صورت دستی کاربر nginx را مشخص کنید"
        exit 1
    fi
fi

echo "   کاربر: $NGINX_USER"
echo "   گروه: $NGINX_GROUP"

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
echo "📋 مجوزهای فعلی:"
ls -la "$ADMIN_PANEL_PATH" | head -5

# تنظیم مجوزها
echo ""
echo "🔐 تنظیم مجوزها..."

# تنظیم owner
echo "   تنظیم owner به $NGINX_USER:$NGINX_GROUP..."
sudo chown -R "$NGINX_USER:$NGINX_GROUP" /var/www/asl_market/admin-panel

# تنظیم مجوزهای پوشه‌ها (755 = rwxr-xr-x)
echo "   تنظیم مجوزهای پوشه‌ها (755)..."
sudo find /var/www/asl_market/admin-panel -type d -exec chmod 755 {} \;

# تنظیم مجوزهای فایل‌ها (644 = rw-r--r--)
echo "   تنظیم مجوزهای فایل‌ها (644)..."
sudo find /var/www/asl_market/admin-panel -type f -exec chmod 644 {} \;

# بررسی مجوزهای جدید
echo ""
echo "✅ مجوزها تنظیم شد"
echo ""
echo "📋 مجوزهای جدید:"
ls -la "$ADMIN_PANEL_PATH" | head -5

# بررسی SELinux (اگر فعال است)
if command -v getenforce &> /dev/null; then
    SELINUX_STATUS=$(getenforce 2>/dev/null)
    if [ "$SELINUX_STATUS" = "Enforcing" ]; then
        echo ""
        echo "⚠️  SELinux فعال است. تنظیم context..."
        sudo chcon -R -t httpd_sys_content_t /var/www/asl_market/admin-panel 2>/dev/null || echo "   (SELinux context تنظیم نشد - ممکن است نیاز به policy باشد)"
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

