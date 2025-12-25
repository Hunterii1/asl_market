#!/bin/bash

# اسکریپت دیباگ خطای 404 در API

echo "🔍 دیباگ خطای 404 در API..."
echo "================================"

# 1. بررسی Backend
echo ""
echo "1️⃣ بررسی Backend..."
if curl -s http://localhost:8080/health > /dev/null 2>&1; then
    echo "✅ Backend در حال اجرا است"
    curl -s http://localhost:8080/health
else
    echo "❌ Backend در حال اجرا نیست!"
    echo ""
    echo "📋 راه‌حل:"
    echo "   1. بررسی کنید که Backend در حال اجرا است:"
    echo "      ps aux | grep 'go run main.go'"
    echo "   2. یا Backend را شروع کنید:"
    echo "      cd /path/to/backend"
    echo "      go run main.go"
    echo ""
    exit 1
fi

# 2. تست API از طریق localhost (بدون authentication)
echo ""
echo "2️⃣ تست API از طریق localhost..."
echo "   GET /api/v1/admin/dashboard/stats"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/v1/admin/dashboard/stats)
echo "   HTTP Code: $HTTP_CODE"

if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
    echo "   ✅ Route وجود دارد (نیاز به authentication)"
elif [ "$HTTP_CODE" = "404" ]; then
    echo "   ❌ Route یافت نشد!"
    echo ""
    echo "📋 بررسی route ها در backend..."
    echo "   grep -n 'admin/dashboard/stats' backend/routes/routes.go"
else
    echo "   ⚠️  HTTP Code: $HTTP_CODE"
fi

# 3. بررسی nginx proxy
echo ""
echo "3️⃣ بررسی nginx proxy..."
NGINX_CONF_FILES=(
    "/etc/nginx/conf.d/admin.asllmarket.com.conf"
    "/etc/nginx/sites-available/admin.asllmarket.com.conf"
    "/etc/nginx/sites-enabled/admin.asllmarket.com.conf"
)

for conf_file in "${NGINX_CONF_FILES[@]}"; do
    if [ -f "$conf_file" ]; then
        echo "   بررسی: $conf_file"
        if grep -q "location /api/" "$conf_file"; then
            echo "   ✅ location /api/ یافت شد"
            grep -A 3 "location /api/" "$conf_file" | head -5
        else
            echo "   ❌ location /api/ یافت نشد!"
        fi
    fi
done

# 4. تست از طریق nginx
echo ""
echo "4️⃣ تست از طریق nginx..."
echo "   GET https://admin.asllmarket.com/api/v1/admin/dashboard/stats"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://admin.asllmarket.com/api/v1/admin/dashboard/stats)
echo "   HTTP Code: $HTTP_CODE"

if [ "$HTTP_CODE" = "404" ]; then
    echo "   ❌ خطای 404"
    echo ""
    echo "📋 بررسی لاگ nginx:"
    sudo tail -20 /var/log/nginx/admin.asllmarket.com.error.log 2>/dev/null | grep -i "404\|not found" || echo "   خطای خاصی در لاگ نیست"
fi

# 5. بررسی route ها در backend
echo ""
echo "5️⃣ بررسی route ها در backend..."
if [ -f "backend/routes/routes.go" ]; then
    if grep -q "admin/dashboard/stats" backend/routes/routes.go; then
        echo "   ✅ Route admin/dashboard/stats در routes.go وجود دارد"
        grep -n "admin/dashboard/stats" backend/routes/routes.go
    else
        echo "   ❌ Route admin/dashboard/stats در routes.go یافت نشد!"
    fi
else
    echo "   ⚠️  فایل routes.go یافت نشد"
fi

echo ""
echo "✅ تست کامل شد"

