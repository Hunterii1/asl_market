#!/bin/bash

# Build script for Admin Panel
# این اسکریپت admin-panel را build می‌کند

echo "🚀 Building Admin Panel..."
echo "================================"

# Navigate to admin-panel directory
cd "$(dirname "$0")"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build for production
echo "🔨 Building for production..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo "📁 Build output: ./dist"
    echo ""
    echo "📋 Next steps:"
    echo "1. Copy ./dist to /var/www/admin.asllmarket.com/"
    echo "2. Configure nginx (see nginx/admin.asllmarket.com.conf)"
    echo "3. Restart nginx: sudo systemctl restart nginx"
else
    echo "❌ Build failed!"
    exit 1
fi

