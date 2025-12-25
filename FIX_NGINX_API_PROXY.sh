#!/bin/bash

# اسکریپت تصحیح proxy nginx برای API

echo "🔧 تصحیح proxy nginx برای API..."
echo "================================"

# پیدا کردن فایل nginx
NGINX_CONF=""
if [ -f "/etc/nginx/conf.d/admin.asllmarket.com.conf" ]; then
    NGINX_CONF="/etc/nginx/conf.d/admin.asllmarket.com.conf"
elif [ -f "/etc/nginx/sites-available/admin.asllmarket.com.conf" ]; then
    NGINX_CONF="/etc/nginx/sites-available/admin.asllmarket.com.conf"
elif [ -f "/etc/nginx/sites-enabled/admin.asllmarket.com.conf" ]; then
    NGINX_CONF="/etc/nginx/sites-enabled/admin.asllmarket.com.conf"
fi

if [ -z "$NGINX_CONF" ]; then
    echo "❌ فایل nginx یافت نشد!"
    exit 1
fi

echo "📝 فایل nginx: $NGINX_CONF"

# بررسی location /api/
if grep -q "location /api/" "$NGINX_CONF"; then
    echo "✅ location /api/ وجود دارد"
    
    # بررسی proxy_pass
    if grep -A 5 "location /api/" "$NGINX_CONF" | grep -q "proxy_pass http://127.0.0.1:8080"; then
        echo "✅ proxy_pass درست است"
    else
        echo "⚠️  proxy_pass ممکن است مشکل داشته باشد"
    fi
else
    echo "❌ location /api/ یافت نشد!"
    echo "   در حال اضافه کردن..."
    
    # اضافه کردن location /api/ قبل از location /
    sudo sed -i '/location \/ {/i\
    # API Proxy - Proxy all /api requests to backend\
    location /api/ {\
        # Rate limiting for API\
        limit_req zone=admin_api burst=10 nodelay;\
        \
        # Proxy to Go Backend\
        proxy_pass http://127.0.0.1:8080;\
        proxy_http_version 1.1;\
        proxy_set_header Upgrade $http_upgrade;\
        proxy_set_header Connection '\''upgrade'\'';\
        proxy_set_header Host $host;\
        proxy_set_header X-Real-IP $remote_addr;\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\
        proxy_set_header X-Forwarded-Proto $scheme;\
        proxy_set_header X-Forwarded-Host $server_name;\
        proxy_cache_bypass $http_upgrade;\
        proxy_read_timeout 86400;\
        proxy_connect_timeout 30s;\
        proxy_send_timeout 30s;\
        \
        # Buffer settings\
        proxy_buffering on;\
        proxy_buffer_size 128k;\
        proxy_buffers 4 256k;\
        proxy_busy_buffers_size 256k;\
        \
        # CORS headers\
        add_header Access-Control-Allow-Origin "https://admin.asllmarket.com" always;\
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;\
        add_header Access-Control-Allow-Headers "Origin, Content-Type, Accept, Authorization, X-Requested-With" always;\
        add_header Access-Control-Allow-Credentials "true" always;\
    }\
' "$NGINX_CONF"
    
    echo "✅ location /api/ اضافه شد"
fi

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
        echo "🧪 تست..."
        sleep 1
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://admin.asllmarket.com/api/v1/health)
        echo "   GET /api/v1/health: HTTP $HTTP_CODE"
        
        if [ "$HTTP_CODE" = "200" ]; then
            echo "   ✅ Proxy کار می‌کند!"
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
echo "✅ تمام!"

