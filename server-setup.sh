#!/bin/bash

# اصل مارکت - Server Setup Script
# ==================================

set -e

# رنگ‌ها
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 راه‌اندازی سرور اصل مارکت${NC}"
echo -e "${BLUE}============================${NC}"

# بروزرسانی سیستم
echo -e "${YELLOW}📦 بروزرسانی سیستم...${NC}"
sudo apt update && sudo apt upgrade -y

# نصب نرم‌افزارهای مورد نیاز
echo -e "${YELLOW}⚙️ نصب نرم‌افزارهای مورد نیاز...${NC}"
sudo apt install -y nginx supervisor mysql-server ufw certbot python3-certbot-nginx rsync

# ایجاد دایرکتوری‌ها
echo -e "${YELLOW}📁 ایجاد دایرکتوری‌ها...${NC}"
sudo mkdir -p /var/www/aslmarket/{frontend,backend,backend/config,backend/logs}
sudo chown -R www-data:www-data /var/www/aslmarket
sudo chmod -R 755 /var/www/aslmarket

# تنظیم فایروال
echo -e "${YELLOW}🔒 تنظیم فایروال...${NC}"
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw deny 8080  # Backend فقط از طریق nginx
sudo ufw --force enable

# تنظیم MySQL
echo -e "${YELLOW}🗄️ تنظیم MySQL...${NC}"
sudo mysql -e "CREATE DATABASE IF NOT EXISTS asl_market;"
sudo mysql -e "CREATE USER IF NOT EXISTS 'asl_user'@'localhost' IDENTIFIED BY 'asl_password_2024';"
sudo mysql -e "GRANT ALL PRIVILEGES ON asl_market.* TO 'asl_user'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

# کپی فایل‌های کانفیگ
echo -e "${YELLOW}📝 کپی فایل‌های کانفیگ...${NC}"

# Nginx config
sudo cp nginx/aslmarket.conf /etc/nginx/sites-available/
sudo ln -sf /etc/nginx/sites-available/aslmarket.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Supervisor config
sudo cp supervisor/aslmarket-backend.conf /etc/supervisor/conf.d/

# تست تنظیمات
echo -e "${YELLOW}🧪 تست تنظیمات...${NC}"
sudo nginx -t
sudo supervisorctl reread

# راه‌اندازی SSL
echo -e "${YELLOW}🔐 راه‌اندازی SSL...${NC}"
echo -e "${RED}⚠️ قبل از ادامه، DNS records را تنظیم کنید:${NC}"
echo -e "  - asllmarket.com -> IP سرور"
echo -e "  - www.asllmarket.com -> IP سرور"
echo -e "  - api.asllmarket.com -> IP سرور"
echo ""
read -p "DNS تنظیم شده است؟ (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    sudo certbot --nginx -d asllmarket.com -d www.asllmarket.com -d api.asllmarket.com
    
    # تست SSL renewal
    sudo certbot renew --dry-run
fi

# ری‌استارت سرویس‌ها
echo -e "${YELLOW}🔄 ری‌استارت سرویس‌ها...${NC}"
sudo systemctl restart nginx
sudo systemctl enable nginx
sudo supervisorctl update
sudo systemctl enable supervisor

echo -e "${GREEN}✅ راه‌اندازی سرور کامل شد!${NC}"
echo -e "${BLUE}📝 مراحل بعدی:${NC}"
echo -e "  1. اسکریپت deploy.sh را اجرا کنید"
echo -e "  2. سایت را تست کنید: https://asllmarket.com"
echo -e "  3. API را تست کنید: https://api.asllmarket.com/health" 