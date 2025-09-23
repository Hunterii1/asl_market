package services

import (
	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"
)

// showLicenseTypeSelection shows license type selection for generation
func (s *TelegramService) showLicenseTypeSelection(chatID int64) {
	keyboard := tgbotapi.NewInlineKeyboardMarkup(
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("🔑 پلاس (12 ماه)", "license_type_plus"),
			tgbotapi.NewInlineKeyboardButtonData("💎 پرو (30 ماه)", "license_type_pro"),
		),
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("⭐ پلاس 4 ماهه", "license_type_plus4"),
		),
	)

	message := "🔑 **انتخاب نوع لایسنس**\n\n" +
		"📋 انواع لایسنس موجود:\n\n" +
		"🔸 **پلاس (Plus)**: مدت زمان 12 ماه\n" +
		"   • مشاهده ویزیتور: 3 نفر در روز\n" +
		"   • مشاهده تأمین‌کننده: 3 نفر در روز\n\n" +
		"🔸 **پرو (Pro)**: مدت زمان 30 ماه\n" +
		"   • مشاهده ویزیتور: 3 نفر در روز\n" +
		"   • مشاهده تأمین‌کننده: 6 نفر در روز\n\n" +
		"🔸 **پلاس 4 ماهه**: مدت زمان 4 ماه\n" +
		"   • مشاهده ویزیتور: 3 نفر در روز\n" +
		"   • مشاهده تأمین‌کننده: 3 نفر در روز\n" +
		"   • عدم امکان درخواست لایسنس SpotPlayer جدید\n\n" +
		"لطفا نوع لایسنس مورد نظر را انتخاب کنید:"

	msg := tgbotapi.NewMessage(chatID, message)
	msg.ParseMode = "Markdown"
	msg.ReplyMarkup = keyboard
	s.bot.Send(msg)
}

// handleLicenseTypeSelection handles license type selection callback
func (s *TelegramService) handleLicenseTypeSelection(chatID int64, licenseType string) {
	// Set session state with license type
	sessionMutex.Lock()
	sessionStates[chatID] = &SessionState{
		ChatID:          chatID,
		WaitingForInput: "license_count",
		Data: map[string]interface{}{
			"license_type": licenseType,
		},
	}
	sessionMutex.Unlock()

	licenseTypeName := "پلاس (12 ماه)"
	if licenseType == "pro" {
		licenseTypeName = "پرو (30 ماه)"
	} else if licenseType == "plus4" {
		licenseTypeName = "پلاس 4 ماهه"
	}

	message := "➕ **تولید لایسنس " + licenseTypeName + "**\n\n" +
		"📝 لطفا تعداد لایسنس‌هایی که می‌خواهید تولید کنید را وارد کنید:\n\n" +
		"🔢 **حداقل:** 1 لایسنس\n" +
		"🔢 **حداکثر:** 100 لایسنس\n\n" +
		"⌨️ لطفا عدد مورد نظر را وارد کنید:"

	msg := tgbotapi.NewMessage(chatID, message)
	msg.ParseMode = "Markdown"
	s.bot.Send(msg)
}
