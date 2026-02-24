// اسکریپت ارسال اس ام اس ثبت‌نام موفق (همان الگوی فعال‌سازی لایسنس / خوش‌آمدگویی)
// در اپلیکیشن این اس ام اس هنگام فعال‌سازی لایسنس برای کاربر ارسال می‌شود.
//
// اجرا: از پوشه backend
//
//	go run scripts/send_sms_registration_success.go 09123456789
//
// با نام و طرح (اختیاری):
//	go run scripts/send_sms_registration_success.go 09123456789 "علی محمد" "طرح طلایی"
//
// یا با متغیر محیطی:
//	SMS_PHONE=09123456789 go run scripts/send_sms_registration_success.go
package main

import (
	"fmt"
	"log"
	"os"

	"asl-market-backend/config"
	"asl-market-backend/services"
)

func main() {
	config.LoadConfig()

	if config.AppConfig.SMS.APIKey == "" {
		log.Fatal("❌ SMS در config تنظیم نشده است (sms.api_key خالی است)")
	}

	services.InitSMSService(
		config.AppConfig.SMS.APIKey,
		config.AppConfig.SMS.Originator,
		config.AppConfig.SMS.PatternCode,
		config.AppConfig.SMS.PasswordRecoveryPattern,
		config.AppConfig.SMS.Username,
		config.AppConfig.SMS.Password,
	)

	sms := services.GetSMSService()
	if sms == nil {
		log.Fatal("❌ سرویس SMS مقداردهی نشد")
	}

	phone := os.Getenv("SMS_PHONE")
	userName := os.Getenv("SMS_USER_NAME")
	licensePlan := os.Getenv("SMS_LICENSE_PLAN")

	if len(os.Args) >= 2 {
		phone = os.Args[1]
	}
	if len(os.Args) >= 3 {
		userName = os.Args[2]
	}
	if len(os.Args) >= 4 {
		licensePlan = os.Args[3]
	}

	if userName == "" {
		userName = "کاربر"
	}
	if licensePlan == "" {
		licensePlan = "ثبت نام"
	}

	if phone == "" {
		fmt.Println("📱 ارسال اس ام اس ثبت‌نام موفق (الگوی فعال‌سازی لایسنس)")
		fmt.Println("=========================================================")
		fmt.Println("استفاده:")
		fmt.Println("  go run scripts/send_sms_registration_success.go <شماره> [نام_کاربر] [طرح]")
		fmt.Println("  مثال: go run scripts/send_sms_registration_success.go 09123456789")
		fmt.Println("  مثال: go run scripts/send_sms_registration_success.go 09123456789 \"علی محمد\" \"طرح طلایی\"")
		fmt.Println("")
		fmt.Println("یا با متغیر محیطی:")
		fmt.Println("  SMS_PHONE=09123456789 go run scripts/send_sms_registration_success.go")
		os.Exit(1)
	}

	phone = services.ValidateIranianPhoneNumber(phone)
	if len(phone) < 12 {
		log.Fatalf("❌ شماره معتبر نیست: %s", phone)
	}

	fmt.Printf("📤 در حال ارسال اس ام اس ثبت‌نام موفق به %s (نام: %s، طرح: %s) ...\n", phone, userName, licensePlan)
	err := sms.SendLicenseActivationSMS(phone, userName, licensePlan)
	if err != nil {
		log.Fatalf("❌ خطا در ارسال: %v", err)
	}
	fmt.Println("✅ اس ام اس با موفقیت ارسال شد.")
}
