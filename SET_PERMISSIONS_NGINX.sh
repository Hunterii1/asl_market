#!/bin/bash

# اسکریپت تنظیم مجوزها برای nginx

echo "🔐 تنظیم مجوزها برای Admin Panel..."
echo "================================"

# کاربر nginx
NGINX_USER="nginx"
NGINX_GROUP="nginx"

# مسیر Admin Panel
ADMIN_PANEL_PATH="/var/www/asl_market/admin-panel"

echo ""
echo "📋 تنظیمات:"
echo "   کاربر: $NGINX_USER"
echo "   گروه: $NGINX_GROUP"
echo "   مسیر: $ADMIN_PANEL_PATH"

# بررسی وجود مسیر
if [ ! -d "$ADMIN_PANEL_PATH" ]; then
    echo ""
    echo "❌ مسیر یافت نشد: $ADMIN_PANEL_PATH"
    exit 1
fi

# بررسی فایل index.html
if [ ! -f "$ADMIN_PANEL_PATH/dist/index.html" ]; then
    echo ""
    echo "❌ فایل index.html یافت نشد"
    exit 1
fi

echo ""
echo "✅ مسیر و فایل‌ها یافت شد"

# تنظیم owner
echo ""
echo "🔐 تنظیم owner..."
sudo chown -R "$NGINX_USER:$NGINX_GROUP" "$ADMIN_PANEL_PATH"

# تنظیم مجوزهای پوشه‌ها
echo "📁 تنظیم مجوزهای پوشه‌ها (755)..."
sudo find "$ADMIN_PANEL_PATH" -type d -exec chmod 755 {} \;

# تنظیم مجوزهای فایل‌ها
echo "📄 تنظیم مجوزهای فایل‌ها (644)..."
sudo find "$ADMIN_PANEL_PATH" -type f -exec chmod 644 {} \;

# نمایش نتیجه
echo ""
echo "✅ مجوزها تنظیم شد"
echo ""
echo "📋 بررسی مجوزهای نهایی:"
ls -la "$ADMIN_PANEL_PATH/dist/" | head -5

# Reload nginx
echo ""
echo "🔄 Reload کردن Nginx..."
sudo systemctl reload nginx

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Nginx reload شد"
    echo ""
    echo "🧪 تست..."
    curl -I https://admin.asllmarket.com 2>&1 | head -5
    echo ""
    echo "🎉 تمام!"
else
    echo ""
    echo "❌ خطا در reload کردن Nginx"
    exit 1
fi

