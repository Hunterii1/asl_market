#!/bin/bash

# اسکریپت دیباگ نهایی nginx

echo "🔍 دیباگ نهایی nginx..."
echo "================================"

NGINX_CONF="/etc/nginx/conf.d/admin.asllmarket.com.conf"

# 1. بررسی تمام location blocks
echo ""
echo "1️⃣ تمام location blocks:"
grep -n "location" "$NGINX_CONF" | grep -v "^#"

# 2. بررسی دقیق location /api/
echo ""
echo "2️⃣ بخش کامل location /api/:"
sed -n '/location \/api\/ {/,/^[[:space:]]*}/p' "$NGINX_CONF"

# 3. بررسی proxy_pass
echo ""
echo "3️⃣ بررسی proxy_pass:"
PROXY_PASS=$(grep -A 5 "location /api/" "$NGINX_CONF" | grep "proxy_pass")
echo "   $PROXY_PASS"

# بررسی trailing slash
if echo "$PROXY_PASS" | grep -q "http://127.0.0.1:8080/$"; then
    echo "   ❌ مشکل: proxy_pass با trailing slash است!"
    echo "   این باعث می‌شود که /api/ از URL حذف شود"
    echo "   در حال تصحیح..."
    sudo sed -i 's|proxy_pass http://127.0.0.1:8080/;|proxy_pass http://127.0.0.1:8080;|g' "$NGINX_CONF"
    echo "   ✅ تصحیح شد"
elif echo "$PROXY_PASS" | grep -q "http://127.0.0.1:8080;"; then
    echo "   ✅ proxy_pass درست است (بدون trailing slash)"
else
    echo "   ⚠️  proxy_pass متفاوت است"
fi

# 4. بررسی location های دیگر که ممکن است match شوند
echo ""
echo "4️⃣ بررسی location های دیگر که ممکن است match شوند:"
grep -n "location" "$NGINX_CONF" | grep -v "^#" | grep -v "location /api/" | grep -v "location / {"

# 5. تست syntax
echo ""
echo "5️⃣ تست syntax..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "   ✅ Syntax درست است"
    
    # 6. Reload
    echo ""
    echo "6️⃣ Reload کردن nginx..."
    sudo systemctl reload nginx
    
    if [ $? -eq 0 ]; then
        echo "   ✅ Nginx reload شد"
        
        # 7. تست
        echo ""
        echo "7️⃣ تست API..."
        sleep 1
        
        # تست health
        echo "   تست /api/v1/health:"
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://admin.asllmarket.com/api/v1/health)
        echo "   HTTP Code: $HTTP_CODE"
        
        if [ "$HTTP_CODE" = "200" ]; then
            echo "   ✅ Proxy کار می‌کند!"
        elif [ "$HTTP_CODE" = "404" ]; then
            echo "   ❌ هنوز 404"
            echo ""
            echo "📋 بررسی لاگ nginx:"
            sudo tail -10 /var/log/nginx/admin.asllmarket.com.error.log 2>/dev/null
            echo ""
            echo "📋 بررسی access log:"
            sudo tail -5 /var/log/nginx/admin.asllmarket.com.access.log 2>/dev/null | grep "/api/"
        else
            echo "   ⚠️  HTTP Code: $HTTP_CODE"
        fi
    else
        echo "   ❌ خطا در reload کردن nginx"
        exit 1
    fi
else
    echo "   ❌ خطا در syntax nginx"
    exit 1
fi

echo ""
echo "✅ تست کامل شد"

