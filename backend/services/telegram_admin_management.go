package services

import (
	"fmt"
	"strconv"
	"strings"

	"asl-market-backend/models"

	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"
)

// showAdminManagementMenu shows the admin management menu
func (s *TelegramService) showAdminManagementMenu(chatID int64) {
	// Only full admins can access this
	if !isAdmin(chatID) {
		msg := tgbotapi.NewMessage(chatID, "❌ فقط ادمین‌های کل می‌توانند به این بخش دسترسی داشته باشند.")
		s.bot.Send(msg)
		return
	}

	keyboard := tgbotapi.NewReplyKeyboard(
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_ADD_ADMIN),
			tgbotapi.NewKeyboardButton(MENU_LIST_ADMINS),
		),
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_REMOVE_ADMIN),
		),
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_BACK),
		),
	)
	keyboard.ResizeKeyboard = true

	message := "👑 **مدیریت ادمین‌ها**\n\n" +
		"از این بخش می‌توانید:\n" +
		"➕ اضافه کردن ادمین کل یا ادمین پشتیبانی\n" +
		"📋 مشاهده لیست تمام ادمین‌ها\n" +
		"🗑️ حذف ادمین\n\n" +
		"💡 **نکات مهم:**\n" +
		"• ادمین کل: دسترسی به تمام بخش‌های سیستم\n" +
		"• ادمین پشتیبانی: فقط دسترسی به تیکت‌های پشتیبانی\n" +
		"• تغییرات در دیتابیس ذخیره می‌شوند\n" +
		"• بعد از ریستارت سیستم حفظ می‌شوند"

	msg := tgbotapi.NewMessage(chatID, message)
	msg.ParseMode = "Markdown"
	msg.ReplyMarkup = keyboard
	s.bot.Send(msg)
}

// showAddAdminTypeMenu shows menu to choose admin type
func (s *TelegramService) showAddAdminTypeMenu(chatID int64) {
	keyboard := tgbotapi.NewReplyKeyboard(
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_ADD_FULL_ADMIN),
			tgbotapi.NewKeyboardButton(MENU_ADD_SUPPORT_ADMIN),
		),
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_BACK),
		),
	)
	keyboard.ResizeKeyboard = true

	message := "➕ **انتخاب نوع ادمین**\n\n" +
		"👑 **ادمین کل:**\n" +
		"• دسترسی به تمام بخش‌های سیستم\n" +
		"• مدیریت کاربران، لایسنس، برداشت‌ها\n" +
		"• مدیریت تأمین‌کنندگان و ویزیتورها\n" +
		"• تمام دسترسی‌های ادمین کل\n\n" +
		"🎫 **ادمین پشتیبانی:**\n" +
		"• فقط دسترسی به تیکت‌های پشتیبانی\n" +
		"• مشاهده و پاسخ به تیکت‌ها\n" +
		"• دسترسی محدود\n\n" +
		"لطفا نوع ادمین را انتخاب کنید:"

	msg := tgbotapi.NewMessage(chatID, message)
	msg.ParseMode = "Markdown"
	msg.ReplyMarkup = keyboard
	s.bot.Send(msg)
}

// promptAddAdmin prompts user to enter admin details
func (s *TelegramService) promptAddAdmin(chatID int64, isFullAdmin bool) {

	// Set session state to wait for admin Telegram ID
	sessionMutex.Lock()
	sessionStates[chatID] = &SessionState{
		ChatID:          chatID,
		WaitingForInput: "admin_telegram_id",
		Data: map[string]interface{}{
			"admin_type": isFullAdmin,
		},
	}
	sessionMutex.Unlock()

	adminTypeText := "ادمین کل"
	if !isFullAdmin {
		adminTypeText = "ادمین پشتیبانی"
	}
	message := fmt.Sprintf("➕ **اضافه کردن %s**\n\n", adminTypeText) +
		"📝 **مرحله 1: شناسه تلگرام**\n\n" +
		"لطفا شناسه تلگرام (Telegram ID) ادمین را وارد کنید.\n\n" +
		"💡 **نحوه پیدا کردن Telegram ID:**\n" +
		"1. از ربات @userinfobot استفاده کنید\n" +
		"2. یا از ربات @getidsbot\n" +
		"3. یا از طریق /start به ربات بفرستید\n\n" +
		"مثال: `276043481`\n\n" +
		"⚠️ **توجه:** فقط عدد وارد کنید (بدون @ یا هر کاراکتر دیگری)"

	msg := tgbotapi.NewMessage(chatID, message)
	msg.ParseMode = "Markdown"
	s.bot.Send(msg)
}

// handleAddAdminInput handles the input for adding admin
func (s *TelegramService) handleAddAdminInput(chatID int64, message *tgbotapi.Message) {
	sessionMutex.Lock()
	state, exists := sessionStates[chatID]
	sessionMutex.Unlock()

	if !exists {
		return
	}

	switch state.WaitingForInput {
	case "admin_telegram_id":
		telegramIDStr := strings.TrimSpace(message.Text)
		telegramID, err := strconv.ParseInt(telegramIDStr, 10, 64)
		if err != nil {
			msg := tgbotapi.NewMessage(chatID, "❌ شناسه تلگرام نامعتبر است. لطفا فقط عدد وارد کنید.\n\nمثال: `276043481`")
			msg.ParseMode = "Markdown"
			s.bot.Send(msg)
			return
		}

		// Check if already admin in static list or database
		if isAdmin(telegramID) || isSupportAdmin(telegramID) {
			msg := tgbotapi.NewMessage(chatID, "⚠️ این کاربر قبلاً ادمین است.")
			s.bot.Send(msg)
			sessionMutex.Lock()
			delete(sessionStates, chatID)
			sessionMutex.Unlock()
			return
		}

		// Store telegram ID and move to next step
		if state.Data == nil {
			state.Data = make(map[string]interface{})
		}
		state.Data["telegram_id"] = telegramID
		state.WaitingForInput = "admin_first_name"
		state.Data["step"] = "first_name"

		sessionMutex.Lock()
		sessionStates[chatID] = state
		sessionMutex.Unlock()

		adminTypeText := "ادمین کل"
		isFullAdmin := state.Data["admin_type"].(bool)
		if !isFullAdmin {
			adminTypeText = "ادمین پشتیبانی"
		}

		msg := tgbotapi.NewMessage(chatID, fmt.Sprintf("✅ شناسه تلگرام: `%d`\n\n📝 **مرحله 2: نام (%s)**\n\nلطفا نام ادمین را وارد کنید:\n\nمثال: `ASL` یا `پشتیبانی`", telegramID, adminTypeText))
		msg.ParseMode = "Markdown"
		s.bot.Send(msg)

	case "admin_first_name":
		firstName := strings.TrimSpace(message.Text)
		if len(firstName) < 2 {
			msg := tgbotapi.NewMessage(chatID, "❌ نام باید حداقل 2 کاراکتر باشد.")
			s.bot.Send(msg)
			return
		}

		state.Data["first_name"] = firstName
		state.WaitingForInput = "admin_username"
		state.Data["step"] = "username"

		sessionMutex.Lock()
		sessionStates[chatID] = state
		sessionMutex.Unlock()

		msg := tgbotapi.NewMessage(chatID, fmt.Sprintf("✅ نام: `%s`\n\n📝 **مرحله 3: یوزرنیم تلگرام (اختیاری)**\n\nلطفا یوزرنیم تلگرام را وارد کنید (بدون @):\n\nمثال: `aslleasli`\n\nیا برای رد کردن این مرحله `/skip` بفرستید.", firstName))
		msg.ParseMode = "Markdown"
		s.bot.Send(msg)

	case "admin_username":
		username := strings.TrimSpace(message.Text)

		// Allow skip
		if strings.ToLower(username) == "/skip" || strings.ToLower(username) == "skip" || username == "" || strings.ToLower(username) == "رد" {
			username = ""
		} else {
			// Remove @ if user included it
			username = strings.TrimPrefix(username, "@")
		}

		state.Data["username"] = username

		// Get all data with safe type assertion
		telegramID, ok := state.Data["telegram_id"].(int64)
		if !ok {
			msg := tgbotapi.NewMessage(chatID, "❌ خطا در دریافت اطلاعات. لطفا دوباره امتحان کنید.")
			s.bot.Send(msg)
			sessionMutex.Lock()
			delete(sessionStates, chatID)
			sessionMutex.Unlock()
			return
		}

		firstName, ok := state.Data["first_name"].(string)
		if !ok {
			msg := tgbotapi.NewMessage(chatID, "❌ خطا در دریافت اطلاعات. لطفا دوباره امتحان کنید.")
			s.bot.Send(msg)
			sessionMutex.Lock()
			delete(sessionStates, chatID)
			sessionMutex.Unlock()
			return
		}

		isFullAdmin, ok := state.Data["admin_type"].(bool)
		if !ok {
			// Default to support admin if type assertion fails
			isFullAdmin = false
		}

		// Debug log
		fmt.Printf("DEBUG: Adding admin - TelegramID=%d, FirstName=%s, IsFullAdmin=%v (type: %T)\n", telegramID, firstName, isFullAdmin, state.Data["admin_type"])

		// Add admin to database
		admin, err := models.AddAdmin(
			s.db,
			telegramID,
			firstName,
			username,
			isFullAdmin,
			chatID,
			"اضافه شده از طریق ربات تلگرام",
		)

		if err != nil {
			msg := tgbotapi.NewMessage(chatID, fmt.Sprintf("❌ خطا در اضافه کردن ادمین: %v", err))
			s.bot.Send(msg)
			sessionMutex.Lock()
			delete(sessionStates, chatID)
			sessionMutex.Unlock()
			return
		}

		adminType := "👑 ادمین کل"
		if !isFullAdmin {
			adminType = "🎫 ادمین پشتیبانی"
		}

		usernameText := ""
		if username != "" {
			usernameText = fmt.Sprintf("\n👤 یوزرنیم: @%s", username)
		}

		successMsg := fmt.Sprintf(
			"✅ **ادمین با موفقیت اضافه شد!**\n\n"+
				"%s\n"+
				"🆔 شناسه تلگرام: `%d`\n"+
				"👤 نام: %s%s\n\n"+
				"💾 تغییرات در دیتابیس ذخیره شد\n"+
				"🔄 بعد از ریستارت سیستم حفظ می‌شود",
			adminType,
			admin.TelegramID,
			admin.FirstName,
			usernameText,
		)

		msg := tgbotapi.NewMessage(chatID, successMsg)
		msg.ParseMode = "Markdown"
		s.bot.Send(msg)

		// Clear session
		sessionMutex.Lock()
		delete(sessionStates, chatID)
		sessionMutex.Unlock()

		// Show menu again
		s.showAdminManagementMenu(chatID)
	}
}

// showAdminsList shows list of all admins
func (s *TelegramService) showAdminsList(chatID int64) {
	// Only full admins can access this
	if !isAdmin(chatID) {
		msg := tgbotapi.NewMessage(chatID, "❌ فقط ادمین‌های کل می‌توانند به این بخش دسترسی داشته باشند.")
		s.bot.Send(msg)
		return
	}

	// Get static admins
	message := "👑 **لیست ادمین‌های کل (ثابت در کد):**\n\n"
	for i, adminID := range ADMIN_IDS {
		message += fmt.Sprintf("%d. `%d`\n", i+1, adminID)
	}

	// Get static support admins
	if len(SUPPORT_ADMIN_IDS) > 0 {
		message += "\n🎫 **ادمین‌های پشتیبانی (ثابت):**\n"
		for i, supportAdminID := range SUPPORT_ADMIN_IDS {
			message += fmt.Sprintf("%d. `%d`\n", i+1, supportAdminID)
		}
		message += "\n"
	} else {
		message += "\n🎫 **ادمین پشتیبانی (ثابت):**\nهیچ ادمین پشتیبانی ثابتی وجود ندارد.\n\n"
	}

	// Get dynamic admins from database
	admins, err := models.GetAllAdmins(s.db)
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, fmt.Sprintf("❌ خطا در دریافت لیست ادمین‌ها: %v", err))
		s.bot.Send(msg)
		return
	}

	if len(admins) > 0 {
		message += "💾 **ادمین‌های دیتابیس:**\n\n"
		for i, admin := range admins {
			adminType := "👑 ادمین کل"
			if !admin.IsFullAdmin {
				adminType = "🎫 ادمین پشتیبانی"
			}

			usernameText := ""
			if admin.Username != "" {
				usernameText = fmt.Sprintf(" (@%s)", admin.Username)
			}

			message += fmt.Sprintf(
				"%d. %s\n"+
					"   🆔 ID: `%d`\n"+
					"   👤 نام: %s%s\n"+
					"   📅 اضافه شده: %s\n\n",
				i+1,
				adminType,
				admin.TelegramID,
				admin.FirstName,
				usernameText,
				admin.CreatedAt.Format("2006/01/02 15:04"),
			)
		}
	} else {
		message += "💾 **ادمین دیتابیسی:**\nهیچ ادمین دیتابیسی وجود ندارد.\n\n"
	}

	message += "💡 **نکته:**\n" +
		"• ادمین‌های ثابت همیشه فعال هستند\n" +
		"• ادمین‌های دیتابیس بعد از ریستارت حفظ می‌شوند"

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

// promptRemoveAdmin prompts to remove an admin
func (s *TelegramService) promptRemoveAdmin(chatID int64) {
	// Only full admins can access this
	if !isAdmin(chatID) {
		msg := tgbotapi.NewMessage(chatID, "❌ فقط ادمین‌های کل می‌توانند به این بخش دسترسی داشته باشند.")
		s.bot.Send(msg)
		return
	}

	// Set session state
	sessionMutex.Lock()
	sessionStates[chatID] = &SessionState{
		ChatID:          chatID,
		WaitingForInput: "remove_admin_id",
	}
	sessionMutex.Unlock()

	message := "🗑️ **حذف ادمین**\n\n" +
		"⚠️ **توجه:**\n" +
		"• فقط ادمین‌های دیتابیس قابل حذف هستند\n" +
		"• ادمین‌های ثابت در کد قابل حذف نیستند\n" +
		"• بعد از حذف، کاربر دیگر دسترسی ادمین نخواهد داشت\n\n" +
		"لطفا شناسه تلگرام ادمین را وارد کنید:\n\n" +
		"مثال: `276043481`"

	msg := tgbotapi.NewMessage(chatID, message)
	msg.ParseMode = "Markdown"
	s.bot.Send(msg)
}

// handleRemoveAdmin handles removing an admin
func (s *TelegramService) handleRemoveAdmin(chatID int64, telegramIDStr string) {
	telegramID, err := strconv.ParseInt(strings.TrimSpace(telegramIDStr), 10, 64)
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ شناسه تلگرام نامعتبر است. لطفا فقط عدد وارد کنید.")
		s.bot.Send(msg)
		return
	}

	// Check if it's a static admin
	for _, adminID := range ADMIN_IDS {
		if telegramID == adminID {
			msg := tgbotapi.NewMessage(chatID, "❌ این ادمین در لیست ثابت کد است و قابل حذف نیست.\n\nبرای حذف باید در کد تغییر دهید.")
			s.bot.Send(msg)
			return
		}
	}

	// Check if it's a static support admin
	for _, supportAdminID := range SUPPORT_ADMIN_IDS {
		if telegramID == supportAdminID {
			msg := tgbotapi.NewMessage(chatID, "❌ این ادمین پشتیبانی در لیست ثابت کد است و قابل حذف نیست.\n\nبرای حذف باید در کد تغییر دهید.")
			s.bot.Send(msg)
			return
		}
	}

	// Check if exists in database
	var admin models.TelegramAdmin
	if err := s.db.Where("telegram_id = ?", telegramID).First(&admin).Error; err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ این ادمین در دیتابیس یافت نشد.")
		s.bot.Send(msg)
		return
	}

	// Remove admin
	if err := models.RemoveAdmin(s.db, telegramID); err != nil {
		msg := tgbotapi.NewMessage(chatID, fmt.Sprintf("❌ خطا در حذف ادمین: %v", err))
		s.bot.Send(msg)
		return
	}

	adminType := "ادمین کل"
	if !admin.IsFullAdmin {
		adminType = "ادمین پشتیبانی"
	}

	successMsg := fmt.Sprintf(
		"✅ **ادمین با موفقیت حذف شد!**\n\n"+
			"🆔 شناسه تلگرام: `%d`\n"+
			"👤 نام: %s\n"+
			"👑 نوع: %s\n\n"+
			"💾 تغییرات در دیتابیس ذخیره شد",
		admin.TelegramID,
		admin.FirstName,
		adminType,
	)

	msg := tgbotapi.NewMessage(chatID, successMsg)
	msg.ParseMode = "Markdown"
	s.bot.Send(msg)

	// Clear session
	sessionMutex.Lock()
	delete(sessionStates, chatID)
	sessionMutex.Unlock()

	// Show menu again
	s.showAdminManagementMenu(chatID)
}
