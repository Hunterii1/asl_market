package services

import (
	"fmt"
	"log"
	"strconv"
	"strings"
	"sync"

	"asl-market-backend/models"

	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"
	"gorm.io/gorm"
)

// Define admin IDs as a slice
var ADMIN_IDS = []int64{76599340, 276043481}

const ASL_PLATFORM_LICENSE = "ASL-PLATFORM-2024"

// Helper function to check if a user is admin
func isAdmin(userID int64) bool {
	for _, adminID := range ADMIN_IDS {
		if userID == adminID {
			return true
		}
	}
	return false
}

// Menu constants
const (
	MENU_USERS    = "👥 لیست کاربران"
	MENU_STATS    = "📊 آمار سیستم"
	MENU_SEARCH   = "🔍 جستجوی کاربر"
	MENU_PENDING  = "⏳ درخواست‌های در انتظار"
	MENU_SETTINGS = "⚙️ تنظیمات"
)

type TelegramService struct {
	bot *tgbotapi.BotAPI
	db  *gorm.DB
}

var (
	telegramService     *TelegramService
	telegramServiceOnce sync.Once
)

func GetTelegramService() *TelegramService {
	telegramServiceOnce.Do(func() {
		bot, err := tgbotapi.NewBotAPI("8435393631:AAGnAXjWfDj8JfijayunPXLTTlKC5gH3isA")
		if err != nil {
			log.Fatalf("Failed to create Telegram bot: %v", err)
		}

		telegramService = &TelegramService{
			bot: bot,
			db:  models.GetDB(),
		}

		go telegramService.startBot()
	})
	return telegramService
}

func (s *TelegramService) startBot() {
	u := tgbotapi.NewUpdate(0)
	u.Timeout = 60

	updates := s.bot.GetUpdatesChan(u)

	for update := range updates {
		// Handle callback queries (button clicks)
		if update.CallbackQuery != nil {
			if !isAdmin(update.CallbackQuery.From.ID) {
				callback := tgbotapi.NewCallback(update.CallbackQuery.ID, "شما دسترسی به این بات را ندارید.")
				s.bot.Request(callback)
				continue
			}
			go s.handleCallbackQuery(update.CallbackQuery)
			continue
		}

		// Handle messages
		if update.Message == nil {
			continue
		}

		// Only process messages from admins
		if !isAdmin(update.Message.From.ID) {
			msg := tgbotapi.NewMessage(update.Message.Chat.ID, "شما دسترسی به این بات را ندارید.")
			s.bot.Send(msg)
			continue
		}

		// If it's a /start command, show the main menu
		if update.Message.Command() == "start" {
			s.showMainMenu(update.Message.Chat.ID)
			continue
		}

		// Handle menu selections
		go s.handleMessage(update.Message)
	}
}

func (s *TelegramService) showMainMenu(chatID int64) {
	keyboard := tgbotapi.NewReplyKeyboard(
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_USERS),
			tgbotapi.NewKeyboardButton(MENU_STATS),
		),
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_SEARCH),
			tgbotapi.NewKeyboardButton(MENU_PENDING),
		),
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_SETTINGS),
		),
	)
	keyboard.ResizeKeyboard = true

	msg := tgbotapi.NewMessage(chatID, "به پنل مدیریت ASL Market خوش آمدید.\nلطفا یکی از گزینه‌های زیر را انتخاب کنید:")
	msg.ReplyMarkup = keyboard
	s.bot.Send(msg)
}

func (s *TelegramService) handleMessage(message *tgbotapi.Message) {
	switch message.Text {
	case MENU_USERS:
		s.showUsersList(message.Chat.ID, 1)
	case MENU_STATS:
		s.showStats(message.Chat.ID)
	case MENU_SEARCH:
		s.showSearchPrompt(message.Chat.ID)
	case MENU_PENDING:
		s.showPendingRequests(message.Chat.ID)
	case MENU_SETTINGS:
		s.showSettings(message.Chat.ID)
	default:
		// Handle search queries or other text input
		if strings.Contains(message.Text, "@") || strings.ContainsAny(message.Text, "0123456789") {
			s.handleSearch(message.Chat.ID, message.Text)
		}
	}
}

func (s *TelegramService) showStats(chatID int64) {
	var totalUsers, approvedUsers, pendingUsers int64
	s.db.Model(&models.User{}).Count(&totalUsers)
	s.db.Model(&models.User{}).Where("is_approved = ?", true).Count(&approvedUsers)
	s.db.Model(&models.User{}).Where("license != '' AND is_approved = ?", false).Count(&pendingUsers)

	response := fmt.Sprintf("📊 آمار سیستم:\n\n"+
		"👥 تعداد کل کاربران: %d\n"+
		"✅ کاربران تأیید شده: %d\n"+
		"⏳ در انتظار تأیید: %d\n",
		totalUsers, approvedUsers, pendingUsers)

	msg := tgbotapi.NewMessage(chatID, response)
	s.bot.Send(msg)
}

func (s *TelegramService) showSearchPrompt(chatID int64) {
	msg := tgbotapi.NewMessage(chatID, "🔍 لطفا شناسه کاربر یا ایمیل را وارد کنید:")
	s.bot.Send(msg)
}

func (s *TelegramService) handleSearch(chatID int64, query string) {
	var user models.User
	var err error

	// Try to find by ID first
	if id, err := strconv.ParseUint(query, 10, 32); err == nil {
		err = s.db.First(&user, id).Error
	} else {
		// Try to find by email
		err = s.db.Where("email LIKE ?", "%"+query+"%").First(&user).Error
	}

	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ کاربری با این مشخصات یافت نشد.")
		s.bot.Send(msg)
		return
	}

	message := fmt.Sprintf("📋 اطلاعات کاربر:\n\n"+
		"👤 نام: %s %s\n"+
		"📧 ایمیل: %s\n"+
		"📱 تلفن: %s\n"+
		"🔑 لایسنس: %s\n"+
		"✅ تأیید شده: %v",
		user.FirstName, user.LastName,
		user.Email,
		user.Phone,
		user.License,
		user.IsApproved)

	var keyboard [][]tgbotapi.InlineKeyboardButton

	// Add approve/reject buttons if user has license but not approved
	if user.License != "" && !user.IsApproved {
		keyboard = append(keyboard, tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("✅ تأیید کاربر", fmt.Sprintf("approve_%d", user.ID)),
			tgbotapi.NewInlineKeyboardButtonData("❌ رد کاربر", fmt.Sprintf("reject_%d", user.ID)),
		))
	}

	// Add additional action buttons
	keyboard = append(keyboard, tgbotapi.NewInlineKeyboardRow(
		tgbotapi.NewInlineKeyboardButtonData("📊 آمار فعالیت", fmt.Sprintf("stats_%d", user.ID)),
		tgbotapi.NewInlineKeyboardButtonData("📝 یادداشت", fmt.Sprintf("note_%d", user.ID)),
	))

	msg := tgbotapi.NewMessage(chatID, message)
	if len(keyboard) > 0 {
		msg.ReplyMarkup = tgbotapi.NewInlineKeyboardMarkup(keyboard...)
	}
	s.bot.Send(msg)
}

func (s *TelegramService) showPendingRequests(chatID int64) {
	var users []models.User
	if err := s.db.Where("license != '' AND is_approved = ?", false).Find(&users).Error; err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ خطا در دریافت لیست درخواست‌ها")
		s.bot.Send(msg)
		return
	}

	if len(users) == 0 {
		msg := tgbotapi.NewMessage(chatID, "📝 هیچ درخواست در انتظار تأییدی وجود ندارد.")
		s.bot.Send(msg)
		return
	}

	// Send header message
	headerMsg := tgbotapi.NewMessage(chatID, "📋 لیست درخواست‌های در انتظار تأیید:")
	s.bot.Send(headerMsg)

	// Send each request as a separate message with its own buttons
	for _, user := range users {
		message := fmt.Sprintf("🆕 درخواست جدید\n\n"+
			"👤 نام: %s %s\n"+
			"📧 ایمیل: %s\n"+
			"📱 تلفن: %s\n"+
			"🔑 لایسنس: %s\n"+
			"📅 تاریخ درخواست: %s",
			user.FirstName, user.LastName,
			user.Email,
			user.Phone,
			user.License,
			"اکنون") // TODO: Add request date to user model

		keyboard := tgbotapi.NewInlineKeyboardMarkup(
			tgbotapi.NewInlineKeyboardRow(
				tgbotapi.NewInlineKeyboardButtonData("✅ تأیید درخواست", fmt.Sprintf("approve_%d", user.ID)),
				tgbotapi.NewInlineKeyboardButtonData("❌ رد درخواست", fmt.Sprintf("reject_%d", user.ID)),
			),
			tgbotapi.NewInlineKeyboardRow(
				tgbotapi.NewInlineKeyboardButtonData("👁 بررسی پروفایل", fmt.Sprintf("profile_%d", user.ID)),
				tgbotapi.NewInlineKeyboardButtonData("📝 ارسال پیام", fmt.Sprintf("message_%d", user.ID)),
			),
		)

		msg := tgbotapi.NewMessage(chatID, message)
		msg.ReplyMarkup = keyboard
		s.bot.Send(msg)
	}
}

func (s *TelegramService) showSettings(chatID int64) {
	msg := tgbotapi.NewMessage(chatID, "⚙️ تنظیمات:\n\n"+
		"🔑 لایسنس فعلی: "+ASL_PLATFORM_LICENSE+"\n"+
		"👤 شناسه ادمین: "+fmt.Sprint(ADMIN_IDS))
	s.bot.Send(msg)
}

func (s *TelegramService) showUsersList(chatID int64, page int) {
	// First show user categories
	message := "👥 لطفا نوع کاربران مورد نظر را انتخاب کنید:"

	keyboard := tgbotapi.NewInlineKeyboardMarkup(
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("✅ کاربران تأیید شده", "userlist_approved"),
			tgbotapi.NewInlineKeyboardButtonData("⏳ در انتظار تأیید", "userlist_pending"),
		),
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("❌ کاربران رد شده", "userlist_rejected"),
			tgbotapi.NewInlineKeyboardButtonData("👥 همه کاربران", "userlist_all"),
		),
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("🔍 جستجوی پیشرفته", "userlist_search"),
		),
	)

	msg := tgbotapi.NewMessage(chatID, message)
	msg.ReplyMarkup = keyboard
	s.bot.Send(msg)
}

func (s *TelegramService) showFilteredUsers(chatID int64, filter string, page int) {
	const perPage = 5
	offset := (page - 1) * perPage

	var users []models.User
	var total int64
	query := s.db.Model(&models.User{})

	// Apply filter
	switch filter {
	case "approved":
		query = query.Where("is_approved = ?", true)
	case "pending":
		// Changed condition: show users who have license and are not approved
		query = query.Where("license IS NOT NULL AND license != '' AND is_approved = ?", false)
	case "rejected":
		// Changed condition: show users who don't have license and are not approved
		query = query.Where("(license IS NULL OR license = '') AND is_approved = ?", false)
	}

	// Get total count
	query.Count(&total)

	// Get paginated results
	if err := query.Offset(offset).Limit(perPage).Find(&users).Error; err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ خطا در دریافت لیست کاربران")
		s.bot.Send(msg)
		return
	}

	// Show filter type in header
	var filterName string
	switch filter {
	case "approved":
		filterName = "✅ کاربران تأیید شده"
	case "pending":
		filterName = "⏳ کاربران در انتظار تأیید"
	case "rejected":
		filterName = "❌ کاربران رد شده"
	default:
		filterName = "👥 همه کاربران"
	}

	// Send header with total count
	headerMsg := fmt.Sprintf("%s\nتعداد کل: %d", filterName, total)
	s.bot.Send(tgbotapi.NewMessage(chatID, headerMsg))

	if total == 0 {
		msg := tgbotapi.NewMessage(chatID, "📝 هیچ کاربری در این دسته وجود ندارد.")
		s.bot.Send(msg)
		return
	}

	// Send each user as a separate message
	for _, user := range users {
		message := fmt.Sprintf("🔹 ID: %d\n👤 %s %s\n📧 %s\n📱 %s",
			user.ID, user.FirstName, user.LastName, user.Email, user.Phone)

		if filter == "pending" {
			message += fmt.Sprintf("\n🔑 لایسنس: %s", user.License)
		} else {
			message += fmt.Sprintf("\n✅ تأیید شده: %v", user.IsApproved)
		}

		var keyboard [][]tgbotapi.InlineKeyboardButton

		// Add appropriate action buttons based on user status
		switch filter {
		case "pending":
			keyboard = append(keyboard, tgbotapi.NewInlineKeyboardRow(
				tgbotapi.NewInlineKeyboardButtonData("✅ تأیید", fmt.Sprintf("approve_%d", user.ID)),
				tgbotapi.NewInlineKeyboardButtonData("❌ رد", fmt.Sprintf("reject_%d", user.ID)),
			))
		case "rejected":
			keyboard = append(keyboard, tgbotapi.NewInlineKeyboardRow(
				tgbotapi.NewInlineKeyboardButtonData("🔄 بررسی مجدد", fmt.Sprintf("recheck_%d", user.ID)),
			))
		}

		// Add common action buttons
		keyboard = append(keyboard, tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("👁 جزئیات", fmt.Sprintf("details_%d", user.ID)),
			tgbotapi.NewInlineKeyboardButtonData("📝 پیام", fmt.Sprintf("message_%d", user.ID)),
		))

		msg := tgbotapi.NewMessage(chatID, message)
		msg.ReplyMarkup = tgbotapi.NewInlineKeyboardMarkup(keyboard...)
		s.bot.Send(msg)
	}

	// Add pagination if needed
	if total > int64(perPage) {
		totalPages := (int(total) + perPage - 1) / perPage
		var paginationKeyboard [][]tgbotapi.InlineKeyboardButton
		var row []tgbotapi.InlineKeyboardButton

		if page > 1 {
			row = append(row, tgbotapi.NewInlineKeyboardButtonData(
				"◀️ صفحه قبل",
				fmt.Sprintf("page_%s_%d", filter, page-1),
			))
		}
		if page < totalPages {
			row = append(row, tgbotapi.NewInlineKeyboardButtonData(
				"صفحه بعد ▶️",
				fmt.Sprintf("page_%s_%d", filter, page+1),
			))
		}

		// Add filter selection button
		row = append(row, tgbotapi.NewInlineKeyboardButtonData("🔄 تغییر فیلتر", "userlist_filter"))

		paginationKeyboard = append(paginationKeyboard, row)

		msg := tgbotapi.NewMessage(chatID, fmt.Sprintf("📄 صفحه %d از %d", page, totalPages))
		msg.ReplyMarkup = tgbotapi.NewInlineKeyboardMarkup(paginationKeyboard...)
		s.bot.Send(msg)
	}
}

func (s *TelegramService) showAdvancedSearch(chatID int64) {
	message := "🔍 جستجوی پیشرفته کاربران\n\n" +
		"لطفا یکی از موارد زیر را انتخاب کنید:"

	keyboard := tgbotapi.NewInlineKeyboardMarkup(
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("🆔 جستجو با شناسه", "search_by_id"),
			tgbotapi.NewInlineKeyboardButtonData("📧 جستجو با ایمیل", "search_by_email"),
		),
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("📱 جستجو با شماره تماس", "search_by_phone"),
			tgbotapi.NewInlineKeyboardButtonData("👤 جستجو با نام", "search_by_name"),
		),
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("🔙 بازگشت به لیست", "userlist_back"),
		),
	)

	msg := tgbotapi.NewMessage(chatID, message)
	msg.ReplyMarkup = keyboard
	s.bot.Send(msg)
}

func (s *TelegramService) handleCallbackQuery(query *tgbotapi.CallbackQuery) {
	data := query.Data
	chatID := query.Message.Chat.ID

	// Handle user list filters
	if strings.HasPrefix(data, "userlist_") {
		filter := strings.TrimPrefix(data, "userlist_")
		switch filter {
		case "approved":
			s.showFilteredUsers(chatID, "approved", 1)
		case "pending":
			s.showFilteredUsers(chatID, "pending", 1)
		case "rejected":
			s.showFilteredUsers(chatID, "rejected", 1)
		case "all":
			s.showFilteredUsers(chatID, "all", 1)
		case "search":
			s.showAdvancedSearch(chatID)
		case "filter":
			s.showUsersList(chatID, 1) // Show filter options again
		case "back":
			s.showUsersList(chatID, 1)
		}
		return
	}

	// Handle pagination with filters
	if strings.HasPrefix(data, "page_") {
		parts := strings.Split(strings.TrimPrefix(data, "page_"), "_")
		if len(parts) == 2 {
			filter := parts[0]
			if page, err := strconv.Atoi(parts[1]); err == nil {
				s.showFilteredUsers(chatID, filter, page)
			}
		}
		return
	}

	// Handle search methods
	if strings.HasPrefix(data, "search_by_") {
		searchType := strings.TrimPrefix(data, "search_by_")
		var prompt string
		switch searchType {
		case "id":
			prompt = "🔍 لطفا شناسه کاربر را وارد کنید:"
		case "email":
			prompt = "🔍 لطفا ایمیل کاربر را وارد کنید:"
		case "phone":
			prompt = "🔍 لطفا شماره تماس کاربر را وارد کنید:"
		case "name":
			prompt = "🔍 لطفا نام کاربر را وارد کنید:"
		}
		msg := tgbotapi.NewMessage(chatID, prompt)
		s.bot.Send(msg)
		return
	}

	// Handle other actions (approve, reject, etc.)
	parts := strings.Split(data, "_")
	if len(parts) != 2 {
		return
	}

	action := parts[0]
	userID, err := strconv.ParseUint(parts[1], 10, 32)
	if err != nil {
		return
	}

	var user models.User
	if err := s.db.First(&user, userID).Error; err != nil {
		return
	}

	switch action {
	case "approve", "reject", "recheck":
		s.handleUserStatusChange(chatID, &user, action)
	case "details":
		s.showUserDetails(chatID, user)
	case "message":
		msg := tgbotapi.NewMessage(chatID, fmt.Sprintf("📝 لطفا پیام خود را برای %s %s وارد کنید:", user.FirstName, user.LastName))
		s.bot.Send(msg)
	}
}

func (s *TelegramService) handleUserStatusChange(chatID int64, user *models.User, action string) {
	var response string

	switch action {
	case "approve":
		user.IsApproved = true
		if err := s.db.Save(user).Error; err != nil {
			response = "❌ خطا در تأیید کاربر"
		} else {
			response = fmt.Sprintf("✅ کاربر %s %s با موفقیت تأیید شد", user.FirstName, user.LastName)
		}

	case "reject":
		user.IsApproved = false
		user.License = ""
		if err := s.db.Save(user).Error; err != nil {
			response = "❌ خطا در رد درخواست کاربر"
		} else {
			response = fmt.Sprintf("❌ درخواست کاربر %s %s رد شد", user.FirstName, user.LastName)
		}

	case "recheck":
		// Simply change status to approved
		user.IsApproved = true
		if err := s.db.Save(user).Error; err != nil {
			response = "❌ خطا در بررسی مجدد کاربر"
		} else {
			response = fmt.Sprintf("✅ کاربر %s %s با موفقیت تأیید شد", user.FirstName, user.LastName)
		}
	}

	msg := tgbotapi.NewMessage(chatID, response)
	s.bot.Send(msg)
}

func (s *TelegramService) sendCallbackResponse(query *tgbotapi.CallbackQuery, message string) {
	// Answer callback query
	callback := tgbotapi.NewCallback(query.ID, "")
	s.bot.Request(callback)

	// Update the original message to show the result
	msg := tgbotapi.NewEditMessageText(query.Message.Chat.ID, query.Message.MessageID, query.Message.Text+"\n\n"+message)
	s.bot.Send(msg)
}

func (s *TelegramService) showUserDetails(chatID int64, user models.User) {
	message := fmt.Sprintf("👤 اطلاعات کامل کاربر:\n\n"+
		"نام: %s %s\n"+
		"ایمیل: %s\n"+
		"تلفن: %s\n"+
		"لایسنس: %s\n"+
		"وضعیت تأیید: %v\n"+
		"تاریخ ثبت‌نام: %s",
		user.FirstName, user.LastName,
		user.Email,
		user.Phone,
		user.License,
		user.IsApproved,
		"اکنون") // TODO: Add registration date to user model

	keyboard := tgbotapi.NewInlineKeyboardMarkup(
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("📊 آمار فعالیت", fmt.Sprintf("stats_%d", user.ID)),
			tgbotapi.NewInlineKeyboardButtonData("📝 ارسال پیام", fmt.Sprintf("message_%d", user.ID)),
		),
	)

	msg := tgbotapi.NewMessage(chatID, message)
	msg.ReplyMarkup = keyboard
	s.bot.Send(msg)
}

func (s *TelegramService) showUserStats(chatID int64, user models.User) {
	// TODO: Implement user statistics
	message := fmt.Sprintf("📊 آمار فعالیت %s %s:\n\n"+
		"تعداد ورود: -\n"+
		"آخرین فعالیت: -\n"+
		"وضعیت فعلی: %v",
		user.FirstName, user.LastName,
		user.IsApproved)

	msg := tgbotapi.NewMessage(chatID, message)
	s.bot.Send(msg)
}

func (s *TelegramService) SendLicenseRequest(user *models.User) error {
	message := fmt.Sprintf("🆕 درخواست تأیید لایسنس جدید\n\n"+
		"👤 نام: %s %s\n"+
		"📧 ایمیل: %s\n"+
		"📱 تلفن: %s\n"+
		"🔑 لایسنس: %s\n\n"+
		"لطفا درخواست را تأیید یا رد کنید.",
		user.FirstName, user.LastName,
		user.Email,
		user.Phone,
		user.License)

	keyboard := tgbotapi.NewInlineKeyboardMarkup(
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("✅ تأیید", fmt.Sprintf("approve_%d", user.ID)),
			tgbotapi.NewInlineKeyboardButtonData("❌ رد", fmt.Sprintf("reject_%d", user.ID)),
		),
	)

	// Send message to all admins
	var firstError error
	for _, adminID := range ADMIN_IDS {
		msg := tgbotapi.NewMessage(adminID, message)
		msg.ReplyMarkup = keyboard
		if _, err := s.bot.Send(msg); err != nil && firstError == nil {
			firstError = err
		}
	}
	return firstError
}
