package services

import (
	"fmt"
	"strconv"
	"strings"

	"asl-market-backend/models"

	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"
)

// Marketing Popup Management Functions

func (s *TelegramService) showMarketingPopupsMenu(chatID int64) {
	keyboard := tgbotapi.NewReplyKeyboard(
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_ADD_MARKETING_POPUP),
			tgbotapi.NewKeyboardButton(MENU_LIST_MARKETING_POPUPS),
		),
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_ACTIVE_MARKETING_POPUPS),
			tgbotapi.NewKeyboardButton(MENU_MARKETING_POPUP_STATS),
		),
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_BACK),
		),
	)
	keyboard.ResizeKeyboard = true

	message := "📢 **مدیریت پاپ‌اپ تبلیغاتی**\n\n" +
		"🎯 از این بخش می‌توانید:\n" +
		"• پاپ‌اپ جدید ایجاد کنید\n" +
		"• پاپ‌اپ‌های موجود را مشاهده کنید\n" +
		"• آمار نمایش و کلیک را ببینید\n" +
		"• پاپ‌اپ‌ها را فعال/غیرفعال کنید\n\n" +
		"📝 **راهنما:**\n" +
		"• هر پاپ‌اپ شامل عنوان، متن و لینک تخفیف است\n" +
		"• اولویت بالاتر = نمایش زودتر\n" +
		"• تاریخ شروع و پایان قابل تنظیم است"

	msg := tgbotapi.NewMessage(chatID, message)
	msg.ParseMode = "Markdown"
	msg.ReplyMarkup = keyboard
	s.bot.Send(msg)
}

func (s *TelegramService) promptAddMarketingPopup(chatID int64) {
	message := "➕ **اضافه کردن پاپ‌اپ تبلیغاتی جدید**\n\n" +
		"📝 لطفا اطلاعات پاپ‌اپ را به ترتیب زیر وارد کنید:\n\n" +
		"**فرمت ورودی:**\n" +
		"```\n" +
		"عنوان: [عنوان پاپ‌اپ]\n" +
		"متن: [متن تبلیغاتی]\n" +
		"لینک: [لینک تخفیف]\n" +
		"دکمه: [متن دکمه] (اختیاری)\n" +
		"اولویت: [عدد 1-10] (اختیاری)\n" +
		"```\n\n" +
		"**مثال:**\n" +
		"```\n" +
		"عنوان: تخفیف ویژه نوروز\n" +
		"متن: با خرید محصولات ما ۳۰٪ تخفیف بگیرید!\n" +
		"لینک: https://asllmarket.ir/discount/nowruz\n" +
		"دکمه: دریافت تخفیف\n" +
		"اولویت: 5\n" +
		"```\n\n" +
		"⚠️ برای لغو /cancel تایپ کنید"

	// Set session state
	sessionMutex.Lock()
	sessionStates[chatID] = &SessionState{
		ChatID:          chatID,
		WaitingForInput: "marketing_popup_data",
	}
	sessionMutex.Unlock()

	msg := tgbotapi.NewMessage(chatID, message)
	msg.ParseMode = "Markdown"
	s.bot.Send(msg)
}

func (s *TelegramService) handleMarketingPopupInput(chatID int64, text string) {
	lines := strings.Split(text, "\n")
	req := models.MarketingPopupRequest{
		IsActive: true,
		Priority: 1,
	}

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "عنوان:") {
			req.Title = strings.TrimSpace(strings.TrimPrefix(line, "عنوان:"))
		} else if strings.HasPrefix(line, "متن:") {
			req.Message = strings.TrimSpace(strings.TrimPrefix(line, "متن:"))
		} else if strings.HasPrefix(line, "لینک:") {
			req.DiscountURL = strings.TrimSpace(strings.TrimPrefix(line, "لینک:"))
		} else if strings.HasPrefix(line, "دکمه:") {
			req.ButtonText = strings.TrimSpace(strings.TrimPrefix(line, "دکمه:"))
		} else if strings.HasPrefix(line, "اولویت:") {
			priorityStr := strings.TrimSpace(strings.TrimPrefix(line, "اولویت:"))
			if priority, err := strconv.Atoi(priorityStr); err == nil {
				req.Priority = priority
			}
		}
	}

	// Validation
	if req.Title == "" || req.Message == "" {
		s.bot.Send(tgbotapi.NewMessage(chatID, "❌ عنوان و متن پاپ‌اپ الزامی است. لطفا دوباره تلاش کنید."))
		return
	}

	// Create admin user for the request
	adminUser := models.User{ID: 1} // Use admin user ID

	// Create the popup
	popup, err := models.CreateMarketingPopup(s.db, adminUser.ID, req)
	if err != nil {
		s.bot.Send(tgbotapi.NewMessage(chatID, fmt.Sprintf("❌ خطا در ایجاد پاپ‌اپ: %v", err)))
		return
	}

	message := fmt.Sprintf(
		"✅ **پاپ‌اپ با موفقیت ایجاد شد!**\n\n"+
			"🏷️ **عنوان:** %s\n"+
			"📝 **متن:** %s\n"+
			"🔗 **لینک:** %s\n"+
			"🔘 **دکمه:** %s\n"+
			"🔢 **اولویت:** %d\n"+
			"📅 **تاریخ ایجاد:** %s\n\n"+
			"🎯 پاپ‌اپ به صورت فعال ایجاد شده و در سایت نمایش داده می‌شود.",
		popup.Title,
		popup.Message,
		popup.DiscountURL,
		popup.ButtonText,
		popup.Priority,
		popup.CreatedAt.Format("2006/01/02 15:04"),
	)

	// Clear session state
	sessionMutex.Lock()
	delete(sessionStates, chatID)
	sessionMutex.Unlock()

	s.bot.Send(tgbotapi.NewMessage(chatID, message))
	s.showMarketingPopupsMenu(chatID)
}

func (s *TelegramService) showMarketingPopupsList(chatID int64) {
	popups, _, err := models.GetMarketingPopups(s.db, 1, 20, false)
	if err != nil {
		s.bot.Send(tgbotapi.NewMessage(chatID, "❌ خطا در دریافت لیست پاپ‌اپ‌ها"))
		return
	}

	if len(popups) == 0 {
		message := "📋 **لیست پاپ‌اپ‌های تبلیغاتی**\n\n" +
			"❌ هیچ پاپ‌اپی یافت نشد.\n\n" +
			"💡 برای اضافه کردن پاپ‌اپ جدید از منو استفاده کنید."
		s.bot.Send(tgbotapi.NewMessage(chatID, message))
		return
	}

	message := "📋 **لیست پاپ‌اپ‌های تبلیغاتی**\n\n"
	for i, popup := range popups {
		status := "❌ غیرفعال"
		if popup.IsActive {
			status = "✅ فعال"
		}

		message += fmt.Sprintf(
			"**%d. %s**\n"+
				"📊 وضعیت: %s\n"+
				"📈 نمایش: %d | کلیک: %d\n"+
				"🔢 اولویت: %d\n"+
				"📅 ایجاد: %s\n"+
				"🔘 عملیات: /pedit%d | /pdelete%d | /ptoggle%d\n\n",
			i+1, popup.Title,
			status,
			popup.ShowCount, popup.ClickCount,
			popup.Priority,
			popup.CreatedAt.Format("2006/01/02"),
			popup.ID, popup.ID, popup.ID,
		)
	}

	message += "➖➖➖➖➖➖➖➖\n" +
		"💡 **راهنما:**\n" +
		"• `/pedit[ID]` - ویرایش پاپ‌اپ\n" +
		"• `/pdelete[ID]` - حذف پاپ‌اپ\n" +
		"• `/ptoggle[ID]` - فعال/غیرفعال کردن"

	// Create back button
	keyboard := tgbotapi.NewReplyKeyboard(
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_BACK),
		),
	)
	keyboard.ResizeKeyboard = true

	msg := tgbotapi.NewMessage(chatID, message)
	msg.ParseMode = "Markdown"
	msg.ReplyMarkup = keyboard
	s.bot.Send(msg)
}

func (s *TelegramService) showActiveMarketingPopups(chatID int64) {
	popups, _, err := models.GetMarketingPopups(s.db, 1, 20, true)
	if err != nil {
		s.bot.Send(tgbotapi.NewMessage(chatID, "❌ خطا در دریافت پاپ‌اپ‌های فعال"))
		return
	}

	if len(popups) == 0 {
		message := "✅ **پاپ‌اپ‌های فعال**\n\n" +
			"❌ هیچ پاپ‌اپ فعالی یافت نشد."
		s.bot.Send(tgbotapi.NewMessage(chatID, message))
		return
	}

	message := "✅ **پاپ‌اپ‌های فعال**\n\n"
	for i, popup := range popups {
		message += fmt.Sprintf(
			"**%d. %s**\n"+
				"📝 متن: %s\n"+
				"🔗 لینک: %s\n"+
				"📈 نمایش: %d | کلیک: %d\n"+
				"🔢 اولویت: %d\n\n",
			i+1, popup.Title,
			popup.Message,
			popup.DiscountURL,
			popup.ShowCount, popup.ClickCount,
			popup.Priority,
		)
	}

	// Create back button
	keyboard := tgbotapi.NewReplyKeyboard(
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_BACK),
		),
	)
	keyboard.ResizeKeyboard = true

	msg := tgbotapi.NewMessage(chatID, message)
	msg.ParseMode = "Markdown"
	msg.ReplyMarkup = keyboard
	s.bot.Send(msg)
}

func (s *TelegramService) showMarketingPopupsStats(chatID int64) {
	popups, total, err := models.GetMarketingPopups(s.db, 1, 1000, false)
	if err != nil {
		s.bot.Send(tgbotapi.NewMessage(chatID, "❌ خطا در دریافت آمار پاپ‌اپ‌ها"))
		return
	}

	activeCount := 0
	totalShows := 0
	totalClicks := 0
	var topPopup *models.MarketingPopup

	for i := range popups {
		if popups[i].IsActive {
			activeCount++
		}
		totalShows += popups[i].ShowCount
		totalClicks += popups[i].ClickCount

		if topPopup == nil || popups[i].ClickCount > topPopup.ClickCount {
			topPopup = &popups[i]
		}
	}

	clickRate := float64(0)
	if totalShows > 0 {
		clickRate = (float64(totalClicks) / float64(totalShows)) * 100
	}

	topPopupName := "ندارد"
	if topPopup != nil {
		topPopupName = topPopup.Title
	}

	message := fmt.Sprintf(
		"📊 **آمار کلی پاپ‌اپ‌های تبلیغاتی**\n\n"+
			"📈 **تعداد کل:** `%d` پاپ‌اپ\n"+
			"✅ **فعال:** `%d` پاپ‌اپ (%.1f%%)\n"+
			"❌ **غیرفعال:** `%d` پاپ‌اپ (%.1f%%)\n\n"+
			"📊 **آمار عملکرد:**\n"+
			"👁️ **کل نمایش:** `%d`\n"+
			"🖱️ **کل کلیک:** `%d`\n"+
			"📈 **نرخ کلیک:** `%.2f%%`\n\n"+
			"🏆 **بهترین پاپ‌اپ:** %s\n\n"+
			"⚡ **عملیات سریع:**\n"+
			"• مشاهده پاپ‌اپ‌های فعال\n"+
			"• اضافه کردن پاپ‌اپ جدید\n"+
			"• ویرایش پاپ‌اپ‌های موجود",
		total,
		activeCount, getSafePercentage(int64(activeCount), total),
		int(total)-activeCount, getSafePercentage(int64(int(total)-activeCount), total),
		totalShows,
		totalClicks,
		clickRate,
		topPopupName,
	)

	// Create back button
	keyboard := tgbotapi.NewReplyKeyboard(
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_BACK),
		),
	)
	keyboard.ResizeKeyboard = true

	msg := tgbotapi.NewMessage(chatID, message)
	msg.ParseMode = "Markdown"
	msg.ReplyMarkup = keyboard
	s.bot.Send(msg)
}

func (s *TelegramService) handlePopupCommands(message *tgbotapi.Message) bool {
	text := message.Text

	// Check for popup delete commands
	if strings.HasPrefix(text, "/pdelete") {
		idStr := strings.TrimPrefix(text, "/pdelete")
		if id, err := strconv.ParseUint(idStr, 10, 32); err == nil {
			s.deleteMarketingPopup(message.Chat.ID, uint(id))
			return true
		}
	}

	// Check for popup toggle commands
	if strings.HasPrefix(text, "/ptoggle") {
		idStr := strings.TrimPrefix(text, "/ptoggle")
		if id, err := strconv.ParseUint(idStr, 10, 32); err == nil {
			s.toggleMarketingPopup(message.Chat.ID, uint(id))
			return true
		}
	}

	return false
}

func (s *TelegramService) deleteMarketingPopup(chatID int64, popupID uint) {
	if err := models.DeleteMarketingPopup(s.db, popupID); err != nil {
		s.bot.Send(tgbotapi.NewMessage(chatID, "❌ خطا در حذف پاپ‌اپ"))
		return
	}

	s.bot.Send(tgbotapi.NewMessage(chatID, "✅ پاپ‌اپ با موفقیت حذف شد"))
	s.showMarketingPopupsList(chatID)
}

func (s *TelegramService) toggleMarketingPopup(chatID int64, popupID uint) {
	popup, err := models.GetMarketingPopupByID(s.db, popupID)
	if err != nil {
		s.bot.Send(tgbotapi.NewMessage(chatID, "❌ پاپ‌اپ یافت نشد"))
		return
	}

	// Toggle active status
	req := models.MarketingPopupRequest{
		Title:       popup.Title,
		Message:     popup.Message,
		DiscountURL: popup.DiscountURL,
		ButtonText:  popup.ButtonText,
		IsActive:    !popup.IsActive,
		StartDate:   popup.StartDate,
		EndDate:     popup.EndDate,
		Priority:    popup.Priority,
	}

	if _, err := models.UpdateMarketingPopup(s.db, popupID, req); err != nil {
		s.bot.Send(tgbotapi.NewMessage(chatID, "❌ خطا در تغییر وضعیت پاپ‌اپ"))
		return
	}

	status := "غیرفعال"
	if req.IsActive {
		status = "فعال"
	}

	message := fmt.Sprintf("✅ وضعیت پاپ‌اپ '%s' به %s تغییر یافت", popup.Title, status)
	s.bot.Send(tgbotapi.NewMessage(chatID, message))
	s.showMarketingPopupsList(chatID)
}
