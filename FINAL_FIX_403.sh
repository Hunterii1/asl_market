#!/bin/bash

# اسکریپت نهایی رفع خطای 403

echo "🔧 رفع نهایی خطای 403..."
echo "================================"

ADMIN_PANEL_PATH="/var/www/asl_market/admin-panel/dist"

# 1. بررسی مجوزهای پوشه‌های والد
echo ""
echo "1️⃣ بررسی مجوزهای پوشه‌های والد..."
echo "   /var/www/asl_market/admin-panel:"
ls -ld /var/www/asl_market/admin-panel
sudo chown nginx:nginx /var/www/asl_market/admin-panel
sudo chmod 755 /var/www/asl_market/admin-panel

echo "   /var/www/asl_market:"
ls -ld /var/www/asl_market
sudo chown root:root /var/www/asl_market
sudo chmod 755 /var/www/asl_market

echo "   /var/www:"
ls -ld /var/www
sudo chmod 755 /var/www

# 2. تنظیم مجوزهای کامل
echo ""
echo "2️⃣ تنظیم مجوزهای کامل..."
sudo chown -R nginx:nginx /var/www/asl_market/admin-panel
sudo find /var/www/asl_market/admin-panel -type d -exec chmod 755 {} \;
sudo find /var/www/asl_market/admin-panel -type f -exec chmod 644 {} \;

# 3. بررسی مسیر root در nginx
echo ""
echo "3️⃣ بررسی مسیر root در nginx..."
NGINX_CONF_FILES=(
    "/etc/nginx/conf.d/admin.asllmarket.com.conf"
    "/etc/nginx/sites-available/admin.asllmarket.com.conf"
    "/etc/nginx/sites-enabled/admin.asllmarket.com.conf"
)

for conf_file in "${NGINX_CONF_FILES[@]}"; do
    if [ -f "$conf_file" ]; then
        echo "   بررسی: $conf_file"
        NGINX_ROOT=$(grep -A 10 "server_name admin.asllmarket.com" "$conf_file" 2>/dev/null | grep "root" | head -1 | awk '{print $2}' | tr -d ';')
        if [ -n "$NGINX_ROOT" ]; then
            echo "   مسیر root: $NGINX_ROOT"
            if [ "$NGINX_ROOT" != "$ADMIN_PANEL_PATH" ]; then
                echo "   ⚠️  مسیر root اشتباه است! باید: $ADMIN_PANEL_PATH"
                echo "   در حال تصحیح..."
                sudo sed -i "s|root.*admin-panel.*|root $ADMIN_PANEL_PATH;|g" "$conf_file"
                echo "   ✅ تصحیح شد"
            else
                echo "   ✅ مسیر root درست است"
            fi
        fi
    fi
done

# 4. تست دسترسی nginx
echo ""
echo "4️⃣ تست دسترسی nginx..."
sudo -u nginx test -r "$ADMIN_PANEL_PATH/index.html"
if [ $? -eq 0 ]; then
    echo "   ✅ nginx می‌تواند فایل را بخواند"
else
    echo "   ❌ nginx نمی‌تواند فایل را بخواند!"
    echo "   در حال تنظیم مجدد..."
    sudo chown -R nginx:nginx /var/www/asl_market/admin-panel
    sudo chmod -R 755 /var/www/asl_market/admin-panel
    sudo find /var/www/asl_market/admin-panel -type f -exec chmod 644 {} \;
fi

# 5. بررسی SELinux
echo ""
echo "5️⃣ بررسی SELinux..."
if command -v getenforce &> /dev/null; then
    SELINUX_STATUS=$(getenforce 2>/dev/null)
    echo "   وضعیت: $SELINUX_STATUS"
    if [ "$SELINUX_STATUS" = "Enforcing" ]; then
        echo "   تنظیم SELinux context..."
        sudo chcon -R -t httpd_sys_content_t /var/www/asl_market/admin-panel 2>/dev/null
        if [ $? -eq 0 ]; then
            echo "   ✅ SELinux context تنظیم شد"
        else
            echo "   ⚠️  خطا در تنظیم SELinux. ممکن است نیاز به policy باشد"
            echo "   در حال غیرفعال کردن SELinux برای این مسیر..."
            sudo setsebool -P httpd_read_user_content 1 2>/dev/null
        fi
    fi
fi

# 6. بررسی لاگ nginx
echo ""
echo "6️⃣ بررسی لاگ nginx..."
if [ -f "/var/log/nginx/admin.asllmarket.com.error.log" ]; then
    echo "   آخرین خطاها:"
    sudo tail -10 /var/log/nginx/admin.asllmarket.com.error.log
else
    echo "   لاگ یافت نشد"
fi

# 7. تست syntax و reload
echo ""
echo "7️⃣ تست و reload nginx..."
sudo nginx -t
if [ $? -eq 0 ]; then
    sudo systemctl reload nginx
    echo "   ✅ Nginx reload شد"
    
    # 8. تست نهایی
    echo ""
    echo "8️⃣ تست نهایی..."
    sleep 2
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://admin.asllmarket.com)
    echo "   HTTP Code: $HTTP_CODE"
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo ""
        echo "🎉 موفق! Admin Panel در دسترس است"
    else
        echo ""
        echo "⚠️  HTTP Code: $HTTP_CODE"
        echo ""
        echo "📋 بررسی بیشتر:"
        echo "   1. بررسی لاگ: sudo tail -f /var/log/nginx/admin.asllmarket.com.error.log"
        echo "   2. بررسی مسیر root: grep 'root' /etc/nginx/conf.d/admin.asllmarket.com.conf"
        echo "   3. تست دسترسی: sudo -u nginx ls -la $ADMIN_PANEL_PATH"
    fi
else
    echo "   ❌ خطا در syntax nginx"
    exit 1
fi

