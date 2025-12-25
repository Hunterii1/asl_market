#!/bin/bash

# اسکریپت تصحیح ترتیب location blocks و proxy

echo "🔧 تصحیح nginx configuration..."
echo "================================"

NGINX_CONF="/etc/nginx/conf.d/admin.asllmarket.com.conf"

if [ ! -f "$NGINX_CONF" ]; then
    echo "❌ فایل nginx یافت نشد: $NGINX_CONF"
    exit 1
fi

# Backup
echo "📦 ایجاد backup..."
sudo cp "$NGINX_CONF" "${NGINX_CONF}.backup.$(date +%Y%m%d_%H%M%S)"

# بررسی ترتیب
echo ""
echo "🔍 بررسی ترتیب location blocks..."
LOCATION_API_LINE=$(grep -n "^[[:space:]]*location /api/" "$NGINX_CONF" | head -1 | cut -d: -f1)
LOCATION_ROOT_LINE=$(grep -n "^[[:space:]]*location / {" "$NGINX_CONF" | head -1 | cut -d: -f1)

if [ -n "$LOCATION_API_LINE" ] && [ -n "$LOCATION_ROOT_LINE" ]; then
    echo "   location /api/ در خط: $LOCATION_API_LINE"
    echo "   location / در خط: $LOCATION_ROOT_LINE"
    
    if [ "$LOCATION_API_LINE" -lt "$LOCATION_ROOT_LINE" ]; then
        echo "   ✅ ترتیب درست است"
    else
        echo "   ❌ ترتیب اشتباه است! باید location /api/ قبل از location / باشد"
        echo "   ⚠️  این مشکل باعث می‌شود که همه درخواست‌ها به location / بروند"
    fi
fi

# بررسی proxy_pass
echo ""
echo "🔍 بررسی proxy_pass..."
PROXY_PASS=$(grep -A 5 "location /api/" "$NGINX_CONF" | grep "proxy_pass" | head -1)
echo "   $PROXY_PASS"

if echo "$PROXY_PASS" | grep -q "http://127.0.0.1:8080"; then
    if echo "$PROXY_PASS" | grep -q "http://127.0.0.1:8080/$"; then
        echo "   ⚠️  proxy_pass با trailing slash است - باید بدون trailing slash باشد"
        echo "   در حال تصحیح..."
        sudo sed -i 's|proxy_pass http://127.0.0.1:8080/;|proxy_pass http://127.0.0.1:8080;|g' "$NGINX_CONF"
        echo "   ✅ تصحیح شد"
    else
        echo "   ✅ proxy_pass درست است"
    fi
else
    echo "   ❌ proxy_pass اشتباه است"
fi

# تست syntax
echo ""
echo "🧪 تست syntax..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "   ✅ Syntax درست است"
    echo ""
    echo "🔄 Reload کردن nginx..."
    sudo systemctl reload nginx
    
    if [ $? -eq 0 ]; then
        echo "   ✅ Nginx reload شد"
        echo ""
        echo "🧪 تست..."
        sleep 1
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://admin.asllmarket.com/api/v1/health)
        echo "   GET /api/v1/health: HTTP $HTTP_CODE"
        
        if [ "$HTTP_CODE" = "200" ]; then
            echo "   ✅ Proxy کار می‌کند!"
        elif [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
            echo "   ✅ Proxy کار می‌کند (نیاز به authentication)"
        else
            echo "   ⚠️  HTTP Code: $HTTP_CODE"
            echo ""
            echo "📋 بررسی لاگ:"
            sudo tail -5 /var/log/nginx/admin.asllmarket.com.error.log 2>/dev/null
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
echo "✅ تمام!"

