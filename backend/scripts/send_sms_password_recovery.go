// اسکریپت ارسال اس ام اس فراموشی رمز عبور
// اجرا: از پوشه backend با دستور زیر (شماره و کد ۶ رقمی را جایگزین کنید)
//
//	go run scripts/send_sms_password_recovery.go 09123456789 123456
//
// یا با متغیر محیطی:
//
//	SMS_PHONE=09123456789 SMS_CODE=123456 go run scripts/send_sms_password_recovery.go
package main

import (
	"fmt"
	"log"
	"os"

	"asl-market-backend/config"
	"asl-market-backend/services"
)

func main123() {
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
	code := os.Getenv("SMS_CODE")
	if len(os.Args) >= 3 {
		phone = os.Args[1]
		code = os.Args[2]
	}

	if phone == "" || code == "" {
		fmt.Println("📱 ارسال اس ام اس فراموشی رمز عبور")
		fmt.Println("==================================")
		fmt.Println("استفاده:")
		fmt.Println("  go run scripts/send_sms_password_recovery.go <شماره> <کد_۶_رقمی>")
		fmt.Println("  مثال: go run scripts/send_sms_password_recovery.go 09123456789 847291")
		fmt.Println("")
		fmt.Println("یا با متغیر محیطی:")
		fmt.Println("  SMS_PHONE=09123456789 SMS_CODE=847291 go run scripts/send_sms_password_recovery.go")
		os.Exit(1)
	}

	phone = services.ValidateIranianPhoneNumber(phone)
	if len(phone) < 12 {
		log.Fatalf("❌ شماره معتبر نیست: %s", phone)
	}

	if len(code) != 6 {
		log.Printf("⚠️  کد بهتر است ۶ رقم باشد (الان: %d رقم)", len(code))
	}

	fmt.Printf("📤 در حال ارسال اس ام اس فراموشی رمز به %s با کد %s ...\n", phone, code)
	err := sms.SendPasswordRecoverySMS(phone, code)
	if err != nil {
		log.Fatalf("❌ خطا در ارسال: %v", err)
	}
	fmt.Println("✅ اس ام اس با موفقیت ارسال شد.")
}
