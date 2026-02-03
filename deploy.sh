#!/bin/bash

# اصل مارکت - اسکریپت Deploy Production
# ===========================================

set -e  # توقف در صورت خطا

# رنگ‌ها برای log
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # بدون رنگ

# تنظیمات سرور
SERVER_USER="root"
SERVER_HOST="your-server-ip"
SERVER_PATH="/var/www/aslmarket"
# مسیر پنل افیلیت روی سرور (باید با nginx: alias /var/www/asl_market/affiliate/ یکی باشد)
AFFILIATE_PATH="/var/www/asl_market/affiliate"

echo -e "${BLUE}🚀 شروع فرآیند Deploy اصل مارکت${NC}"
echo -e "${BLUE}======================================${NC}"

# مرحله 1: Build Frontend
echo -e "${YELLOW}📦 Build کردن Frontend...${NC}"
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend build موفقیت‌آمیز${NC}"
else
    echo -e "${RED}❌ خطا در build frontend${NC}"
    exit 1
fi

# مرحله 2: Build Backend
echo -e "${YELLOW}⚙️ Build کردن Backend...${NC}"
cd backend
go build -o backend main.go
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend build موفقیت‌آمیز${NC}"
else
    echo -e "${RED}❌ خطا در build backend${NC}"
    exit 1
fi
cd ..

# مرحله 2b: Build پنل افیلیت (base: /affiliate/)
echo -e "${YELLOW}📦 Build کردن پنل افیلیت...${NC}"
(cd affiliate-panel && npm run build)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ پنل افیلیت build موفقیت‌آمیز${NC}"
else
    echo -e "${RED}❌ خطا در build پنل افیلیت${NC}"
    exit 1
fi

# مرحله 3: آپلود Frontend
echo -e "${YELLOW}📤 آپلود Frontend...${NC}"
rsync -avz --delete dist/ ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/frontend/
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend آپلود شد${NC}"
else
    echo -e "${RED}❌ خطا در آپلود frontend${NC}"
    exit 1
fi

# مرحله 3b: آپلود پنل افیلیت به /var/www/asl_market/affiliate/
echo -e "${YELLOW}📤 آپلود پنل افیلیت...${NC}"
ssh ${SERVER_USER}@${SERVER_HOST} "mkdir -p ${AFFILIATE_PATH}"
rsync -avz --delete affiliate-panel/dist/ ${SERVER_USER}@${SERVER_HOST}:${AFFILIATE_PATH}/
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ پنل افیلیت آپلود شد (${AFFILIATE_PATH})${NC}"
else
    echo -e "${RED}❌ خطا در آپلود پنل افیلیت${NC}"
    exit 1
fi

# مرحله 4: آپلود Backend
echo -e "${YELLOW}🔧 آپلود Backend...${NC}"
scp backend/backend ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/backend/
scp backend/config/production.yaml ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/backend/config/config.yaml

# مرحله 5: ری‌استارت سرویس‌ها
echo -e "${YELLOW}🔄 ری‌استارت سرویس‌ها...${NC}"
ssh ${SERVER_USER}@${SERVER_HOST} << 'ENDSSH'
# ری‌استارت backend
sudo supervisorctl restart aslmarket-backend

# چک کردن وضعیت
sudo supervisorctl status aslmarket-backend

# ری‌لود nginx
sudo nginx -t && sudo systemctl reload nginx

echo "🎉 Deploy کامل شد!"
ENDSSH

echo -e "${GREEN}🎉 Deploy موفقیت‌آمیز!${NC}"
echo -e "${BLUE}🌐 سایت: https://asllmarket.com${NC}"
echo -e "${BLUE}🔗 پنل افیلیت: https://asllmarket.com/affiliate/${NC}"
echo -e "${BLUE}🔗 API: https://api.asllmarket.com${NC}" 