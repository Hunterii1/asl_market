#!/bin/bash
# Build پنل افیلیت برای دیپلوی در مسیر /affiliate/
# Run from repo root: ./affiliate-panel/build.sh
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
echo "🔨 Building Affiliate Panel (base: /affiliate/)..."
npm run build
echo "✅ Build done. Output: $SCRIPT_DIR/dist/"
echo ""
echo "📦 برای دیپلوی روی سرور از ریشه پروژه:"
echo "   rsync -avz affiliate-panel/dist/ \${USER}@\${SERVER}:/var/www/asl_market/affiliate/"
echo "   یا از اسکریپت: ./deploy-affiliate.sh"
