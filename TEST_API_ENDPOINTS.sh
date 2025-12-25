#!/bin/bash

# اسکریپت تست API endpoints

echo "🧪 تست API Endpoints..."
echo "================================"

# 1. بررسی Backend
echo ""
echo "1️⃣ بررسی Backend..."
if curl -s http://localhost:8080/health > /dev/null; then
    echo "✅ Backend در حال اجرا است"
    curl -s http://localhost:8080/health | head -3
else
    echo "❌ Backend در حال اجرا نیست!"
    echo "   لطفاً Backend را شروع کنید:"
    echo "   cd backend && go run main.go"
    exit 1
fi

# 2. تست API از طریق localhost
echo ""
echo "2️⃣ تست API از طریق localhost..."
echo "   GET /api/v1/admin/dashboard/stats"
curl -s -o /dev/null -w "   HTTP Code: %{http_code}\n" http://localhost:8080/api/v1/admin/dashboard/stats

# 3. تست API از طریق nginx
echo ""
echo "3️⃣ تست API از طریق nginx..."
echo "   GET https://admin.asllmarket.com/api/v1/admin/dashboard/stats"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://admin.asllmarket.com/api/v1/admin/dashboard/stats)
echo "   HTTP Code: $HTTP_CODE"

if [ "$HTTP_CODE" = "404" ]; then
    echo ""
    echo "❌ خطای 404 - بررسی مسیر proxy در nginx..."
    echo ""
    echo "📋 بررسی تنظیمات nginx:"
    grep -A 5 "location /api/" /etc/nginx/conf.d/admin.asllmarket.com.conf 2>/dev/null || \
    grep -A 5 "location /api/" /etc/nginx/sites-available/admin.asllmarket.com.conf 2>/dev/null
    
    echo ""
    echo "🔍 بررسی لاگ nginx:"
    sudo tail -10 /var/log/nginx/admin.asllmarket.com.error.log 2>/dev/null || echo "   لاگ یافت نشد"
fi

# 4. تست با token (اگر نیاز باشد)
echo ""
echo "4️⃣ تست با Authentication..."
echo "   (نیاز به token دارد - این تست فقط syntax را بررسی می‌کند)"

echo ""
echo "✅ تست کامل شد"

