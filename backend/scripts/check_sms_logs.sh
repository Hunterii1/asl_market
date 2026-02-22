#!/bin/bash

# Script to check SMS logs
# این اسکریپت لاگ‌های ارسال SMS را چک می‌کند

echo "📱 بررسی لاگ‌های SMS..."
echo "================================"

# رنگ‌ها برای خروجی
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# تابع برای نمایش آمار
show_stats() {
    local log_file=$1
    local title=$2
    
    if [ ! -f "$log_file" ]; then
        echo -e "${RED}❌ فایل لاگ یافت نشد: $log_file${NC}"
        return
    fi
    
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}📊 $title${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # تعداد کل SMS های ارسال شده موفق
    local success_count=$(grep -c "SMS sent successfully" "$log_file" 2>/dev/null || echo "0")
    echo -e "${GREEN}✅ SMS های موفق: $success_count${NC}"
    
    # تعداد خطاهای ارسال SMS
    local error_count=$(grep -c "Error sending.*SMS" "$log_file" 2>/dev/null || echo "0")
    echo -e "${RED}❌ خطاهای ارسال: $error_count${NC}"
    
    # تعداد SMS های بازیابی رمز عبور
    local password_recovery=$(grep -c "Password recovery SMS sent successfully" "$log_file" 2>/dev/null || echo "0")
    echo -e "${BLUE}🔑 بازیابی رمز عبور: $password_recovery${NC}"
    
    # تعداد SMS های ثبت‌نام افیلیت
    local affiliate_sms=$(grep -c "Affiliate registration SMS sent successfully" "$log_file" 2>/dev/null || echo "0")
    echo -e "${BLUE}👥 ثبت‌نام افیلیت: $affiliate_sms${NC}"
    
    # آخرین SMS ارسال شده
    echo ""
    echo -e "${YELLOW}📤 آخرین SMS های ارسال شده:${NC}"
    grep "SMS sent successfully\|Password recovery SMS sent successfully\|Affiliate registration SMS sent successfully" "$log_file" | tail -5 | while read line; do
        echo -e "${GREEN}  ➜ $line${NC}"
    done
    
    # آخرین خطاها
    if [ "$error_count" -gt 0 ]; then
        echo ""
        echo -e "${YELLOW}⚠️  آخرین خطاها:${NC}"
        grep "Error sending.*SMS" "$log_file" | tail -5 | while read line; do
            echo -e "${RED}  ➜ $line${NC}"
        done
    fi
}

# تابع برای نمایش جزئیات SMS های امروز
show_today_sms() {
    local log_file=$1
    local today=$(date +"%Y/%m/%d")
    
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}📅 SMS های امروز ($today)${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    if [ -f "$log_file" ]; then
        grep "$today.*SMS sent successfully\|$today.*Password recovery SMS\|$today.*Affiliate registration SMS" "$log_file" | while read line; do
            echo -e "${GREEN}  $line${NC}"
        done
    else
        echo -e "${RED}❌ فایل لاگ یافت نشد${NC}"
    fi
}

# تابع برای جستجوی SMS به شماره خاص
search_by_phone() {
    local log_file=$1
    local phone=$2
    
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}🔍 جستجوی SMS برای شماره: $phone${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    if [ -f "$log_file" ]; then
        local results=$(grep "$phone" "$log_file")
        if [ -z "$results" ]; then
            echo -e "${YELLOW}⚠️  هیچ SMS ای برای این شماره یافت نشد${NC}"
        else
            echo "$results" | while read line; do
                if echo "$line" | grep -q "successfully"; then
                    echo -e "${GREEN}  ✅ $line${NC}"
                elif echo "$line" | grep -q "Error"; then
                    echo -e "${RED}  ❌ $line${NC}"
                else
                    echo -e "  ➜ $line"
                fi
            done
        fi
    else
        echo -e "${RED}❌ فایل لاگ یافت نشد${NC}"
    fi
}

# تابع برای نمایش اعتبار SMS
show_sms_credit() {
    local log_file=$1
    
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}💰 اعتبار SMS${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    if [ -f "$log_file" ]; then
        local last_credit=$(grep "SMS credit" "$log_file" | tail -1)
        if [ -z "$last_credit" ]; then
            echo -e "${YELLOW}⚠️  اطلاعات اعتبار در لاگ یافت نشد${NC}"
        else
            echo -e "${GREEN}  $last_credit${NC}"
        fi
    else
        echo -e "${RED}❌ فایل لاگ یافت نشد${NC}"
    fi
}

# مسیرهای احتمالی فایل لاگ
LOG_LOCATIONS=(
    "/var/log/asl-market/backend.log"
    "/var/log/asl-market-backend.log"
    "./logs/backend.log"
    "./backend.log"
    "/tmp/asl-market-backend.log"
    "nohup.out"
)

# پیدا کردن فایل لاگ
LOG_FILE=""
for location in "${LOG_LOCATIONS[@]}"; do
    if [ -f "$location" ]; then
        LOG_FILE="$location"
        echo -e "${GREEN}✅ فایل لاگ یافت شد: $LOG_FILE${NC}"
        break
    fi
done

# اگر فایل لاگ پیدا نشد، از journalctl استفاده کن
if [ -z "$LOG_FILE" ]; then
    echo -e "${YELLOW}⚠️  فایل لاگ مستقیم یافت نشد. بررسی journalctl...${NC}"
    
    if command -v journalctl &> /dev/null; then
        echo ""
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${YELLOW}📊 لاگ‌های SMS از journalctl${NC}"
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        
        # SMS های موفق
        echo -e "${GREEN}✅ SMS های موفق:${NC}"
        sudo journalctl -u asl-market-backend -n 1000 --no-pager | grep "SMS sent successfully" | tail -10
        
        # خطاهای SMS
        echo ""
        echo -e "${RED}❌ خطاهای SMS:${NC}"
        sudo journalctl -u asl-market-backend -n 1000 --no-pager | grep "Error sending.*SMS" | tail -10
        
        # آمار
        echo ""
        local success=$(sudo journalctl -u asl-market-backend --no-pager | grep -c "SMS sent successfully")
        local errors=$(sudo journalctl -u asl-market-backend --no-pager | grep -c "Error sending.*SMS")
        echo -e "${BLUE}📊 آمار کل:${NC}"
        echo -e "${GREEN}  ✅ موفق: $success${NC}"
        echo -e "${RED}  ❌ خطا: $errors${NC}"
    else
        echo -e "${RED}❌ journalctl در دسترس نیست و فایل لاگ یافت نشد${NC}"
        echo ""
        echo -e "${YELLOW}💡 راهنما:${NC}"
        echo "  1. لاگ‌ها را به یکی از مسیرهای زیر هدایت کنید:"
        for loc in "${LOG_LOCATIONS[@]}"; do
            echo "     - $loc"
        done
        echo ""
        echo "  2. یا از systemd برای مدیریت سرویس استفاده کنید"
        echo "  3. یا backend را با nohup اجرا کنید:"
        echo "     nohup ./asl-market-backend > backend.log 2>&1 &"
        exit 1
    fi
else
    # نمایش آمار از فایل لاگ
    show_stats "$LOG_FILE" "آمار کلی SMS"
    show_today_sms "$LOG_FILE"
    show_sms_credit "$LOG_FILE"
    
    # اگر آرگومان شماره تلفن داده شده، جستجو کن
    if [ ! -z "$1" ]; then
        search_by_phone "$LOG_FILE" "$1"
    fi
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✨ بررسی لاگ‌های SMS تمام شد${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}💡 نکات:${NC}"
echo "  • برای جستجوی شماره خاص: ./check_sms_logs.sh 09123456789"
echo "  • برای مشاهده لاگ‌های زنده: tail -f $LOG_FILE | grep SMS"
echo "  • برای مشاهده فقط خطاها: grep 'Error sending.*SMS' $LOG_FILE"
echo ""
