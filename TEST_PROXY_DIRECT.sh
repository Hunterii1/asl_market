#!/bin/bash

# تست مستقیم proxy

echo "🧪 تست مستقیم proxy..."
echo "================================"

# 1. تست از طریق localhost (مستقیم به backend)
echo ""
echo "1️⃣ تست مستقیم به backend (localhost):"
echo "   GET /api/v1/admin/users"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer test" http://localhost:8080/api/v1/admin/users)
echo "   HTTP Code: $HTTP_CODE"

if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
    echo "   ✅ Route وجود دارد (نیاز به authentication معتبر)"
elif [ "$HTTP_CODE" = "404" ]; then
    echo "   ❌ Route یافت نشد!"
else
    echo "   ⚠️  HTTP Code: $HTTP_CODE"
fi

# 2. تست از طریق nginx
echo ""
echo "2️⃣ تست از طریق nginx:"
echo "   GET https://admin.asllmarket.com/api/v1/admin/users"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer test" https://admin.asllmarket.com/api/v1/admin/users)
echo "   HTTP Code: $HTTP_CODE"

if [ "$HTTP_CODE" = "404" ]; then
    echo "   ❌ خطای 404 - مشکل از proxy است"
    echo ""
    echo "📋 بررسی proxy_pass:"
    grep -A 2 "location /api/" /etc/nginx/conf.d/admin.asllmarket.com.conf | grep proxy_pass
    
    echo ""
    echo "📋 بررسی لاگ nginx:"
    sudo tail -10 /var/log/nginx/admin.asllmarket.com.error.log 2>/dev/null | grep -i "404\|not found" || echo "   خطای خاصی در لاگ نیست"
    
    echo ""
    echo "🔍 تست دقیق‌تر:"
    echo "   درخواست به nginx:"
    curl -v https://admin.asllmarket.com/api/v1/admin/users 2>&1 | grep -E "(< HTTP|> GET|404)"
else
    echo "   ✅ Proxy کار می‌کند (HTTP Code: $HTTP_CODE)"
fi

echo ""
echo "✅ تست کامل شد"

