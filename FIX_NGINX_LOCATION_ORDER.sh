#!/bin/bash

# اسکریپت تصحیح ترتیب location blocks در nginx

echo "🔧 تصحیح ترتیب location blocks در nginx..."
echo "================================"

NGINX_CONF="/etc/nginx/conf.d/admin.asllmarket.com.conf"

if [ ! -f "$NGINX_CONF" ]; then
    echo "❌ فایل nginx یافت نشد: $NGINX_CONF"
    exit 1
fi

echo "📝 فایل nginx: $NGINX_CONF"

# بررسی ترتیب location blocks
echo ""
echo "🔍 بررسی ترتیب location blocks..."
LOCATION_API_LINE=$(grep -n "location /api/" "$NGINX_CONF" | head -1 | cut -d: -f1)
LOCATION_ROOT_LINE=$(grep -n "location / {" "$NGINX_CONF" | head -1 | cut -d: -f1)

if [ -n "$LOCATION_API_LINE" ] && [ -n "$LOCATION_ROOT_LINE" ]; then
    echo "   location /api/ در خط: $LOCATION_API_LINE"
    echo "   location / در خط: $LOCATION_ROOT_LINE"
    
    if [ "$LOCATION_API_LINE" -lt "$LOCATION_ROOT_LINE" ]; then
        echo "   ✅ ترتیب درست است (location /api/ قبل از location /)"
    else
        echo "   ❌ ترتیب اشتباه است! location / قبل از location /api/ است"
        echo "   این باعث می‌شود که همه درخواست‌ها به location / بروند"
        echo ""
        echo "   ⚠️  باید location /api/ را قبل از location / قرار دهید"
    fi
fi

# بررسی اینکه آیا location /api/ به درستی proxy می‌کند
echo ""
echo "🔍 بررسی proxy_pass..."
if grep -A 5 "location /api/" "$NGINX_CONF" | grep -q "proxy_pass http://127.0.0.1:8080"; then
    echo "   ✅ proxy_pass درست است"
else
    echo "   ❌ proxy_pass یافت نشد یا اشتباه است"
fi

# نمایش بخش location /api/
echo ""
echo "📋 بخش location /api/:"
grep -A 30 "location /api/" "$NGINX_CONF" | head -35

# نمایش بخش location /
echo ""
echo "📋 بخش location /:"
grep -A 15 "location / {" "$NGINX_CONF" | head -20

echo ""
echo "✅ بررسی کامل شد"

