package main

import (
	"fmt"
	"log"

	"asl-market-backend/models"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func main() {
	// اتصال به دیتابیس
	dsn := "asl_user:asl_password_2024@tcp(localhost:3306)/asl_market?charset=utf8mb4&parseTime=True&loc=Local"
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("خطا در اتصال به دیتابیس:", err)
	}

	// شماره‌های موبایل مورد نظر برای حذف
	targetPhones := []string{
		"09157095158", // توران قلمزن
		"09020304117",
		"09123456789",
	}

	fmt.Println("🔍 شروع جستجو برای یافتن کاربران با شماره‌های مشخص...")

	// پیدا کردن کاربران با این شماره‌ها
	var users []models.User
	result := db.Where("phone IN ?", targetPhones).Find(&users)
	if result.Error != nil {
		log.Fatal("خطا در جستجوی کاربران:", result.Error)
	}

	if len(users) == 0 {
		fmt.Println("✅ هیچ کاربری با این شماره‌ها یافت نشد.")
		return
	}

	fmt.Printf("📱 %d کاربر با شماره‌های مشخص یافت شد:\n", len(users))
	for _, user := range users {
		fmt.Printf("   - %s %s (%s)\n", user.FirstName, user.LastName, user.Phone)
	}

	// شروع تراکنش
	tx := db.Begin()
	if tx.Error != nil {
		log.Fatal("خطا در شروع تراکنش:", tx.Error)
	}

	// حذف از جداول مرتبط
	fmt.Println("\n🗑️ شروع حذف اطلاعات...")

	// 1. حذف از جدول support_ticket_messages
	fmt.Println("   حذف پیام‌های تیکت‌های پشتیبانی...")
	tx.Exec(`
		DELETE stm FROM support_ticket_messages stm
		INNER JOIN support_tickets st ON stm.ticket_id = st.id
		INNER JOIN users u ON st.user_id = u.id
		WHERE u.phone IN ?
	`, targetPhones)

	// 2. حذف از جدول support_tickets
	fmt.Println("   حذف تیکت‌های پشتیبانی...")
	tx.Exec(`
		DELETE st FROM support_tickets st
		INNER JOIN users u ON st.user_id = u.id
		WHERE u.phone IN ?
	`, targetPhones)

	// 3. حذف از جدول supplier_products
	fmt.Println("   حذف محصولات تأمین‌کنندگان...")
	tx.Exec(`
		DELETE sp FROM supplier_products sp
		INNER JOIN suppliers s ON sp.supplier_id = s.id
		INNER JOIN users u ON s.user_id = u.id
		WHERE u.phone IN ?
	`, targetPhones)

	// 4. حذف از جدول suppliers
	fmt.Println("   حذف تأمین‌کنندگان...")
	tx.Exec(`
		DELETE s FROM suppliers s
		INNER JOIN users u ON s.user_id = u.id
		WHERE u.phone IN ?
	`, targetPhones)

	// 5. حذف از جدول visitors
	fmt.Println("   حذف ویزیتورها...")
	tx.Exec(`
		DELETE v FROM visitors v
		INNER JOIN users u ON v.user_id = u.id
		WHERE u.phone IN ?
	`, targetPhones)

	// 6. حذف از جدول spotplayer_licenses
	fmt.Println("   حذف لایسنس‌های SpotPlayer...")
	tx.Exec(`
		DELETE spl FROM spotplayer_licenses spl
		INNER JOIN users u ON spl.user_id = u.id
		WHERE u.phone IN ?
	`, targetPhones)

	// 7. حذف از جدول contact_view_limits
	fmt.Println("   حذف محدودیت‌های مشاهده تماس...")
	tx.Exec(`
		DELETE cvl FROM contact_view_limits cvl
		INNER JOIN users u ON cvl.user_id = u.id
		WHERE u.phone IN ?
	`, targetPhones)

	// 8. حذف از جدول daily_contact_view_limits
	fmt.Println("   حذف محدودیت‌های روزانه مشاهده تماس...")
	tx.Exec(`
		DELETE dvl FROM daily_contact_view_limits dvl
		INNER JOIN users u ON dvl.user_id = u.id
		WHERE u.phone IN ?
	`, targetPhones)

	// 9. حذف از جدول withdrawal_requests
	fmt.Println("   حذف درخواست‌های برداشت...")
	tx.Exec(`
		DELETE wr FROM withdrawal_requests wr
		INNER JOIN users u ON wr.user_id = u.id
		WHERE u.phone IN ?
	`, targetPhones)

	// 10. حذف از جدول ai_usage
	fmt.Println("   حذف استفاده از هوش مصنوعی...")
	tx.Exec(`
		DELETE au FROM ai_usage au
		INNER JOIN users u ON au.user_id = u.id
		WHERE u.phone IN ?
	`, targetPhones)

	// 11. حذف از جدول user_progress
	fmt.Println("   حذف پیشرفت کاربران...")
	tx.Exec(`
		DELETE up FROM user_progress up
		INNER JOIN users u ON up.user_id = u.id
		WHERE u.phone IN ?
	`, targetPhones)

	// 12. حذف از جدول video_watches
	fmt.Println("   حذف تماشای ویدیوها...")
	tx.Exec(`
		DELETE vw FROM video_watches vw
		INNER JOIN users u ON vw.user_id = u.id
		WHERE u.phone IN ?
	`, targetPhones)

	// 13. حذف از جدول upgrade_requests
	fmt.Println("   حذف درخواست‌های ارتقا...")
	tx.Exec(`
		DELETE ur FROM upgrade_requests ur
		INNER JOIN users u ON ur.user_id = u.id
		WHERE u.phone IN ?
	`, targetPhones)

	// 14. حذف از جدول notifications
	fmt.Println("   حذف نوتیفیکیشن‌ها...")
	tx.Exec(`
		DELETE n FROM notifications n
		INNER JOIN users u ON n.user_id = u.id
		WHERE u.phone IN ?
	`, targetPhones)

	// 15. حذف از جدول daily_view_limits
	fmt.Println("   حذف محدودیت‌های روزانه...")
	tx.Exec(`
		DELETE dvl FROM daily_view_limits dvl
		INNER JOIN users u ON dvl.user_id = u.id
		WHERE u.phone IN ?
	`, targetPhones)

	// 16. حذف از جدول available_products
	fmt.Println("   حذف محصولات موجود...")
	tx.Exec(`
		DELETE ap FROM available_products ap
		INNER JOIN users u ON ap.added_by_id = u.id
		WHERE u.phone IN ?
	`, targetPhones)

	// 17. حذف از جدول research_products
	fmt.Println("   حذف محصولات تحقیقی...")
	tx.Exec(`
		DELETE rp FROM research_products rp
		INNER JOIN users u ON rp.added_by_id = u.id
		WHERE u.phone IN ?
	`, targetPhones)

	// 18. حذف از جدول messages
	fmt.Println("   حذف پیام‌های چت...")
	tx.Exec(`
		DELETE m FROM messages m
		INNER JOIN chats c ON m.chat_id = c.id
		INNER JOIN users u ON c.user_id = u.id
		WHERE u.phone IN ?
	`, targetPhones)

	// 19. حذف از جدول chats
	fmt.Println("   حذف چت‌ها...")
	tx.Exec(`
		DELETE c FROM chats c
		INNER JOIN users u ON c.user_id = u.id
		WHERE u.phone IN ?
	`, targetPhones)

	// 20. حذف از جدول licenses
	fmt.Println("   حذف لایسنس‌ها...")
	tx.Exec(`
		DELETE l FROM licenses l
		INNER JOIN users u ON l.user_id = u.id
		WHERE u.phone IN ?
	`, targetPhones)

	// 21. حذف از جدول training_videos
	fmt.Println("   حذف ویدیوهای آموزشی...")
	tx.Exec(`
		DELETE tv FROM training_videos tv
		INNER JOIN users u ON tv.added_by_id = u.id
		WHERE u.phone IN ?
	`, targetPhones)

	// 22. حذف از جدول training_categories
	fmt.Println("   حذف دسته‌بندی‌های آموزشی...")
	tx.Exec(`
		DELETE tc FROM training_categories tc
		INNER JOIN users u ON tc.added_by_id = u.id
		WHERE u.phone IN ?
	`, targetPhones)

	// 23. حذف از جدول marketing_popups
	fmt.Println("   حذف پاپ‌آپ‌های بازاریابی...")
	tx.Exec(`
		DELETE mp FROM marketing_popups mp
		INNER JOIN users u ON mp.clicked_by_id = u.id
		WHERE u.phone IN ?
	`, targetPhones)

	// 24. در نهایت حذف از جدول users
	fmt.Println("   حذف کاربران...")
	result = tx.Where("phone IN ?", targetPhones).Delete(&models.User{})
	if result.Error != nil {
		tx.Rollback()
		log.Fatal("خطا در حذف کاربران:", result.Error)
	}

	// تأیید تراکنش
	if err := tx.Commit().Error; err != nil {
		log.Fatal("خطا در تأیید تراکنش:", err)
	}

	fmt.Printf("\n✅ عملیات حذف با موفقیت تکمیل شد!\n")
	fmt.Printf("📊 تعداد کاربران حذف شده: %d\n", result.RowsAffected)
	fmt.Println("🎯 تمام اطلاعات مرتبط با این شماره‌ها حذف شدند:")
	for _, phone := range targetPhones {
		fmt.Printf("   - %s\n", phone)
	}
}
