#!/bin/bash

# اسکریپت تصحیح خطای syntax در nginx

echo "🔧 تصحیح خطای Syntax در Nginx..."
echo "================================"

# مسیر فایل nginx در سرور
NGINX_CONF="/etc/nginx/conf.d/admin.asllmarket.com.conf"
NGINX_SITES_AVAILABLE="/etc/nginx/sites-available/admin.asllmarket.com.conf"
NGINX_SITES_ENABLED="/etc/nginx/sites-enabled/admin.asllmarket.com.conf"

# بررسی اینکه فایل در کدام مسیر است
if [ -f "$NGINX_CONF" ]; then
    echo "📝 فایل در /etc/nginx/conf.d/ یافت شد"
    TARGET_FILE="$NGINX_CONF"
elif [ -f "$NGINX_SITES_AVAILABLE" ]; then
    echo "📝 فایل در /etc/nginx/sites-available/ یافت شد"
    TARGET_FILE="$NGINX_SITES_AVAILABLE"
else
    echo "⚠️  فایل nginx یافت نشد. در حال ایجاد..."
    TARGET_FILE="$NGINX_CONF"
fi

# کپی فایل صحیح
echo ""
echo "📋 کپی فایل صحیح..."

# اگر فایل در پروژه وجود دارد، از آن استفاده کن
if [ -f "nginx/admin.asllmarket.com.conf" ]; then
    sudo cp nginx/admin.asllmarket.com.conf "$TARGET_FILE"
    echo "✅ فایل از پروژه کپی شد"
else
    # در غیر این صورت، فایل را از صفر می‌سازیم
    echo "⚠️  فایل در پروژه یافت نشد. در حال ایجاد فایل جدید..."
    
    sudo tee "$TARGET_FILE" > /dev/null << 'EOF'
# Admin Panel - Nginx Configuration
# ===================================
# Admin Panel برای admin.asllmarket.com

# Rate limiting
limit_req_zone $binary_remote_addr zone=admin_api:10m rate=30r/m;
limit_req_zone $binary_remote_addr zone=admin_login:10m rate=5r/m;

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name admin.asllmarket.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name admin.asllmarket.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/asllmarket.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/asllmarket.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: ws: wss: data: blob: 'unsafe-inline' 'unsafe-eval'" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Admin Panel Static Files
    root /var/www/asl_market/admin-panel/dist;
    index index.html;
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/json
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    
    # Static Assets Cache (طولانی مدت)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # API Proxy - Proxy all /api requests to backend
    location /api/ {
        # Rate limiting for API
        limit_req zone=admin_api burst=10 nodelay;
        
        # Proxy to Go Backend
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $server_name;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
        
        # CORS headers
        add_header Access-Control-Allow-Origin "https://admin.asllmarket.com" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Origin, Content-Type, Accept, Authorization, X-Requested-With" always;
        add_header Access-Control-Allow-Credentials "true" always;
    }
    
    # Rate limiting برای login
    location ~ ^/api/v1/auth/(login|register) {
        limit_req zone=admin_login burst=3 nodelay;
        
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Handle preflight requests
    location ~ ^/api/ {
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "https://admin.asllmarket.com";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Origin, Content-Type, Accept, Authorization, X-Requested-With";
            add_header Access-Control-Allow-Credentials "true";
            add_header Access-Control-Max-Age 86400;
            add_header Content-Length 0;
            add_header Content-Type "text/plain charset=UTF-8";
            return 204;
        }
    }
    
    # Admin Panel Frontend - SPA routing
    location / {
        try_files $uri $uri/ /index.html;
        
        # Security headers for HTML
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        
        # Cache control for index.html (no cache)
        location = /index.html {
            add_header Cache-Control "no-cache, no-store, must-revalidate";
            add_header Pragma "no-cache";
            add_header Expires "0";
        }
    }
    
    # Health Check (بدون rate limit)
    location /health {
        access_log off;
        proxy_pass http://127.0.0.1:8080/health;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Logs
    access_log /var/log/nginx/admin.asllmarket.com.access.log;
    error_log /var/log/nginx/admin.asllmarket.com.error.log;
}
EOF
    echo "✅ فایل جدید ایجاد شد"
fi

# بررسی syntax
echo ""
echo "🧪 تست تنظیمات Nginx..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ تنظیمات Nginx معتبر است"
    echo ""
    echo "🔄 Reload کردن Nginx..."
    sudo systemctl reload nginx
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Nginx با موفقیت reload شد"
        echo ""
        echo "🧪 تست..."
        curl -I https://admin.asllmarket.com 2>&1 | head -5
        echo ""
        echo "🎉 تمام! حالا باید https://admin.asllmarket.com کار کند"
    else
        echo ""
        echo "❌ خطا در reload کردن Nginx"
        echo "   بررسی لاگ: sudo journalctl -xeu nginx.service"
        exit 1
    fi
else
    echo ""
    echo "❌ خطا در تنظیمات Nginx"
    echo "   لطفاً خطاهای بالا را بررسی کنید"
    exit 1
fi

