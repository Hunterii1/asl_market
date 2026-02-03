#!/bin/bash
# Build پنل افیلیت برای دیپلوی در مسیر /affiliate/
set -e
echo "🔨 Building Affiliate Panel (base: /affiliate/)..."
npm run build
echo "✅ Build done. Output: dist/"
echo ""
echo "📦 برای دیپلوی روی سرور:"
echo "   1. محتویات پوشه affiliate-panel/dist را در مسیر /var/www/asl_market/affiliate/ کپی کنید"
echo "   2. مطمئن شوید nginx طبق nginx/aslmarket.conf برای /affiliate/ تنظیم شده است"
echo "   مثال: rsync -avz affiliate-panel/dist/ user@server:/var/www/asl_market/affiliate/"
