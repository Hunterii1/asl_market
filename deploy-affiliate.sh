#!/bin/bash
# دیپلوی فقط پنل افیلیت به /var/www/asl_market/affiliate/
# از ریشه پروژه اجرا کنید: ./deploy-affiliate.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SERVER_USER="${SERVER_USER:-root}"
SERVER_HOST="${SERVER_HOST:-your-server-ip}"
AFFILIATE_PATH="/var/www/asl_market/affiliate"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_ROOT"

echo -e "${BLUE}🚀 دیپلوی پنل افیلیت${NC}"
echo -e "${BLUE}======================================${NC}"

# Build
echo -e "${YELLOW}📦 Build پنل افیلیت (base: /affiliate/)...${NC}"
(cd affiliate-panel && npm run build)
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ خطا در build پنل افیلیت${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Build موفق${NC}"

# Ensure directory on server and upload
echo -e "${YELLOW}📤 آپلود به ${AFFILIATE_PATH}...${NC}"
ssh ${SERVER_USER}@${SERVER_HOST} "mkdir -p ${AFFILIATE_PATH}"
rsync -avz --delete affiliate-panel/dist/ ${SERVER_USER}@${SERVER_HOST}:${AFFILIATE_PATH}/
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ خطا در آپلود${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 پنل افیلیت دیپلوی شد.${NC}"
echo -e "${BLUE}🔗 https://asllmarket.com/affiliate/${NC}"
echo ""
echo "در صورت تغییر nginx، روی سرور: sudo nginx -t && sudo systemctl reload nginx"
