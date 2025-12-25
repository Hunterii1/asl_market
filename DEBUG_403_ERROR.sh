#!/bin/bash

# اسکریپت دیباگ خطای 403

echo "🔍 دیباگ خطای 403 Forbidden..."
echo "================================"

ADMIN_PANEL_PATH="/var/www/asl_market/admin-panel/dist"
NGINX_USER="nginx"

# 1. بررسی وجود فایل‌ها
echo ""
echo "1️⃣ بررسی فایل‌ها..."
if [ -f "$ADMIN_PANEL_PATH/index.html" ]; then
    echo "✅ فایل index.html وجود دارد"
    ls -la "$ADMIN_PANEL_PATH/index.html"
else
    echo "❌ فایل index.html یافت نشد!"
    echo "   مسیر: $ADMIN_PANEL_PATH"
    exit 1
fi

# 2. بررسی مجوزهای فایل
echo ""
echo "2️⃣ بررسی مجوزهای فایل..."
FILE_PERM=$(stat -c "%a" "$ADMIN_PANEL_PATH/index.html")
FILE_OWNER=$(stat -c "%U:%G" "$ADMIN_PANEL_PATH/index.html")
echo "   مجوزها: $FILE_PERM (باید 644 باشد)"
echo "   Owner: $FILE_OWNER (باید nginx:nginx باشد)"

if [ "$FILE_PERM" != "644" ]; then
    echo "   ⚠️  مجوزها اشتباه است. در حال تصحیح..."
    sudo chmod 644 "$ADMIN_PANEL_PATH/index.html"
fi

if [ "$FILE_OWNER" != "nginx:nginx" ]; then
    echo "   ⚠️  Owner اشتباه است. در حال تصحیح..."
    sudo chown nginx:nginx "$ADMIN_PANEL_PATH/index.html"
fi

# 3. بررسی مجوزهای پوشه
echo ""
echo "3️⃣ بررسی مجوزهای پوشه..."
DIR_PERM=$(stat -c "%a" "$ADMIN_PANEL_PATH")
DIR_OWNER=$(stat -c "%U:%G" "$ADMIN_PANEL_PATH")
echo "   مجوزها: $DIR_PERM (باید 755 باشد)"
echo "   Owner: $DIR_OWNER (باید nginx:nginx باشد)"

if [ "$DIR_PERM" != "755" ]; then
    echo "   ⚠️  مجوزها اشتباه است. در حال تصحیح..."
    sudo chmod 755 "$ADMIN_PANEL_PATH"
fi

if [ "$DIR_OWNER" != "nginx:nginx" ]; then
    echo "   ⚠️  Owner اشتباه است. در حال تصحیح..."
    sudo chown nginx:nginx "$ADMIN_PANEL_PATH"
fi

# 4. بررسی مسیر root در nginx
echo ""
echo "4️⃣ بررسی مسیر root در nginx..."
NGINX_ROOT=$(grep -A 5 "server_name admin.asllmarket.com" /etc/nginx/conf.d/admin.asllmarket.com.conf 2>/dev/null | grep "root" | awk '{print $2}' | tr -d ';')
if [ -z "$NGINX_ROOT" ]; then
    NGINX_ROOT=$(grep -A 5 "server_name admin.asllmarket.com" /etc/nginx/sites-available/admin.asllmarket.com.conf 2>/dev/null | grep "root" | awk '{print $2}' | tr -d ';')
fi

if [ -n "$NGINX_ROOT" ]; then
    echo "   مسیر root در nginx: $NGINX_ROOT"
    if [ "$NGINX_ROOT" != "$ADMIN_PANEL_PATH" ]; then
        echo "   ⚠️  مسیر root در nginx با مسیر واقعی متفاوت است!"
        echo "   nginx: $NGINX_ROOT"
        echo "   واقعی: $ADMIN_PANEL_PATH"
    fi
else
    echo "   ⚠️  مسیر root در nginx یافت نشد!"
fi

# 5. تست دسترسی nginx به فایل
echo ""
echo "5️⃣ تست دسترسی nginx به فایل..."
sudo -u nginx test -r "$ADMIN_PANEL_PATH/index.html"
if [ $? -eq 0 ]; then
    echo "✅ nginx می‌تواند فایل را بخواند"
else
    echo "❌ nginx نمی‌تواند فایل را بخواند!"
    echo "   در حال تنظیم مجدد مجوزها..."
    sudo chown -R nginx:nginx /var/www/asl_market/admin-panel
    sudo find /var/www/asl_market/admin-panel -type d -exec chmod 755 {} \;
    sudo find /var/www/asl_market/admin-panel -type f -exec chmod 644 {} \;
fi

# 6. بررسی SELinux
echo ""
echo "6️⃣ بررسی SELinux..."
if command -v getenforce &> /dev/null; then
    SELINUX_STATUS=$(getenforce 2>/dev/null)
    echo "   وضعیت: $SELINUX_STATUS"
    if [ "$SELINUX_STATUS" = "Enforcing" ]; then
        echo "   ⚠️  SELinux فعال است. تنظیم context..."
        sudo chcon -R -t httpd_sys_content_t /var/www/asl_market/admin-panel 2>/dev/null
        if [ $? -eq 0 ]; then
            echo "   ✅ SELinux context تنظیم شد"
        else
            echo "   ⚠️  خطا در تنظیم SELinux context"
        fi
    fi
else
    echo "   SELinux نصب نشده است"
fi

# 7. بررسی لاگ nginx
echo ""
echo "7️⃣ بررسی لاگ nginx (آخرین خطاها)..."
sudo tail -5 /var/log/nginx/admin.asllmarket.com.error.log 2>/dev/null || echo "   لاگ یافت نشد"

# 8. Reload nginx
echo ""
echo "8️⃣ Reload کردن Nginx..."
sudo nginx -t
if [ $? -eq 0 ]; then
    sudo systemctl reload nginx
    echo "✅ Nginx reload شد"
else
    echo "❌ خطا در syntax nginx"
    exit 1
fi

# 9. تست نهایی
echo ""
echo "9️⃣ تست نهایی..."
sleep 2
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://admin.asllmarket.com)
echo "   HTTP Code: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
    echo ""
    echo "🎉 موفق! Admin Panel در دسترس است"
elif [ "$HTTP_CODE" = "403" ]; then
    echo ""
    echo "❌ هنوز خطای 403 وجود دارد"
    echo ""
    echo "📋 مراحل بعدی:"
    echo "   1. بررسی لاگ nginx: sudo tail -f /var/log/nginx/admin.asllmarket.com.error.log"
    echo "   2. بررسی مجوزهای کامل: ls -laR /var/www/asl_market/admin-panel/dist/ | head -20"
    echo "   3. بررسی مسیر root در nginx: grep -A 2 'server_name admin' /etc/nginx/conf.d/admin.asllmarket.com.conf"
else
    echo ""
    echo "⚠️  HTTP Code: $HTTP_CODE"
fi

