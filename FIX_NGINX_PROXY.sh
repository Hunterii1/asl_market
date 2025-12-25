#!/bin/bash

# اسکریپت تصحیح proxy nginx

echo "🔧 تصحیح proxy nginx..."
echo "================================"

NGINX_CONF_FILES=(
    "/etc/nginx/conf.d/admin.asllmarket.com.conf"
    "/etc/nginx/sites-available/admin.asllmarket.com.conf"
    "/etc/nginx/sites-enabled/admin.asllmarket.com.conf"
)

for conf_file in "${NGINX_CONF_FILES[@]}"; do
    if [ -f "$conf_file" ]; then
        echo ""
        echo "📝 بررسی: $conf_file"
        
        # بررسی proxy_pass
        if grep -q "proxy_pass http://127.0.0.1:8080" "$conf_file"; then
            echo "   ✅ proxy_pass درست است"
        else
            echo "   ❌ proxy_pass یافت نشد یا اشتباه است"
        fi
        
        # بررسی location /api/
        if grep -q "location /api/" "$conf_file"; then
            echo "   ✅ location /api/ وجود دارد"
            
            # بررسی اینکه آیا proxy_pass درست است
            PROXY_PASS_LINE=$(grep -A 10 "location /api/" "$conf_file" | grep "proxy_pass" | head -1)
            if echo "$PROXY_PASS_LINE" | grep -q "http://127.0.0.1:8080"; then
                echo "   ✅ proxy_pass به درستی تنظیم شده"
            else
                echo "   ⚠️  proxy_pass ممکن است اشتباه باشد:"
                echo "      $PROXY_PASS_LINE"
            fi
        else
            echo "   ❌ location /api/ یافت نشد!"
        fi
    fi
done

# بررسی syntax
echo ""
echo "🧪 تست syntax nginx..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "   ✅ Syntax درست است"
    echo ""
    echo "🔄 Reload کردن nginx..."
    sudo systemctl reload nginx
    
    if [ $? -eq 0 ]; then
        echo "   ✅ Nginx reload شد"
        echo ""
        echo "🧪 تست API از طریق nginx..."
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://admin.asllmarket.com/api/v1/health)
        echo "   GET /api/v1/health: HTTP $HTTP_CODE"
        
        if [ "$HTTP_CODE" = "200" ]; then
            echo "   ✅ Proxy کار می‌کند"
        else
            echo "   ⚠️  Proxy ممکن است مشکل داشته باشد"
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

