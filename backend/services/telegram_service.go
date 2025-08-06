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
	MENU_USERS         = "👥 لیست کاربران"
	MENU_STATS         = "📊 آمار سیستم"
	MENU_SEARCH        = "🔍 جستجوی کاربر"
	MENU_LICENSES      = "🔑 مدیریت لایسنس"
	MENU_GENERATE      = "➕ تولید لایسنس"
	MENU_LIST_LICENSES = "📋 لیست لایسنس‌ها"
	MENU_SETTINGS      = "⚙️ تنظیمات"
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
			tgbotapi.NewKeyboardButton(MENU_LICENSES),
			tgbotapi.NewKeyboardButton(MENU_SEARCH),
		),
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_SETTINGS),
		),
	)
	keyboard.ResizeKeyboard = true

	msg := tgbotapi.NewMessage(chatID, "🎛️ به پنل مدیریت ASL Market خوش آمدید.\n\n🔑 **سیستم لایسنس جدید:**\n- لایسنس‌ها یکبار مصرف هستند\n- بعد از استفاده غیرفعال می‌شوند\n- تأیید اتوماتیک\n\nلطفا یکی از گزینه‌های زیر را انتخاب کنید:")
	msg.ParseMode = "Markdown"
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
	case MENU_LICENSES:
		s.showLicenseMenu(message.Chat.ID)
	case MENU_GENERATE:
		s.showGeneratePrompt(message.Chat.ID)
	case MENU_LIST_LICENSES:
		s.showLicensesList(message.Chat.ID, 1)
	case MENU_SETTINGS:
		s.showSettings(message.Chat.ID)
	case "🔙 بازگشت به منو اصلی":
		s.showMainMenu(message.Chat.ID)
	default:
		// Handle search queries, license generation count, or other text input
		if strings.Contains(message.Text, "@") {
			s.handleSearch(message.Chat.ID, message.Text)
		} else if count, err := strconv.Atoi(message.Text); err == nil && count > 0 && count <= 100 {
			s.handleGenerateLicenses(message.Chat.ID, count, message.From.ID)
		} else if strings.ContainsAny(message.Text, "0123456789") {
			s.handleSearch(message.Chat.ID, message.Text)
		}
	}
}

func (s *TelegramService) showStats(chatID int64) {
	var totalUsers, usersWithLicense int64
	var totalLicenses, usedLicenses, availableLicenses int64

	s.db.Model(&models.User{}).Count(&totalUsers)
	s.db.Model(&models.License{}).Where("is_used = ?", true).Distinct("used_by").Count(&usersWithLicense)

	s.db.Model(&models.License{}).Count(&totalLicenses)
	s.db.Model(&models.License{}).Where("is_used = ?", true).Count(&usedLicenses)
	availableLicenses = totalLicenses - usedLicenses

	response := fmt.Sprintf("📊 آمار سیستم:\n\n"+
		"👥 تعداد کل کاربران: %d\n"+
		"✅ کاربران دارای لایسنس: %d\n\n"+
		"🔑 آمار لایسنس‌ها:\n"+
		"📦 کل لایسنس‌ها: %d\n"+
		"✅ استفاده شده: %d\n"+
		"🆓 در دسترس: %d",
		totalUsers, usersWithLicense, totalLicenses, usedLicenses, availableLicenses)

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

	// Check if user has license
	hasLicense, _ := models.CheckUserLicense(s.db, user.ID)
	var licenseInfo string
	if hasLicense {
		if license, err := models.GetUserLicense(s.db, user.ID); err == nil {
			licenseInfo = fmt.Sprintf("✅ دارای لایسنس: %s", license.Code)
		} else {
			licenseInfo = "✅ دارای لایسنس"
		}
	} else {
		licenseInfo = "❌ بدون لایسنس"
	}

	message := fmt.Sprintf("📋 اطلاعات کاربر:\n\n"+
		"👤 نام: %s %s\n"+
		"📧 ایمیل: %s\n"+
		"📱 تلفن: %s\n"+
		"🔑 وضعیت لایسنس: %s",
		user.FirstName, user.LastName,
		user.Email,
		user.Phone,
		licenseInfo)

	// Add action buttons
	keyboard := tgbotapi.NewInlineKeyboardMarkup(
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("📊 آمار فعالیت", fmt.Sprintf("stats_%d", user.ID)),
			tgbotapi.NewInlineKeyboardButtonData("📝 یادداشت", fmt.Sprintf("note_%d", user.ID)),
		),
	)

	msg := tgbotapi.NewMessage(chatID, message)
	msg.ReplyMarkup = keyboard
	s.bot.Send(msg)
}

func (s *TelegramService) showSettings(chatID int64) {
	msg := tgbotapi.NewMessage(chatID, "⚙️ تنظیمات سیستم:\n\n"+
		"🎛️ نوع سیستم: لایسنس یکبار مصرف\n"+
		"👤 ادمین‌ها: "+fmt.Sprint(ADMIN_IDS)+"\n"+
		"🔑 حداکثر تولید لایسنس: 100 عدد در هر درخواست")
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

		// بررسی وضعیت لایسنس کاربر
		hasLicense, _ := models.CheckUserLicense(s.db, user.ID)
		if hasLicense {
			if license, err := models.GetUserLicense(s.db, user.ID); err == nil {
				message += fmt.Sprintf("\n🔑 لایسنس: %s", license.Code)
			} else {
				message += "\n🔑 دارای لایسنس"
			}
		} else {
			message += "\n❌ بدون لایسنس"
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
		// در سیستم جدید تأیید خودکار است، اما می‌توانیم کاربر را فعال/غیرفعال کنیم
		user.IsActive = true
		if err := s.db.Save(user).Error; err != nil {
			response = "❌ خطا در فعال کردن کاربر"
		} else {
			response = fmt.Sprintf("✅ کاربر %s %s فعال شد", user.FirstName, user.LastName)
		}

	case "reject":
		// غیرفعال کردن کاربر
		user.IsActive = false
		if err := s.db.Save(user).Error; err != nil {
			response = "❌ خطا در غیرفعال کردن کاربر"
		} else {
			response = fmt.Sprintf("❌ کاربر %s %s غیرفعال شد", user.FirstName, user.LastName)
		}

	case "recheck":
		// Refresh user data and check license status
		if err := s.db.First(user, user.ID).Error; err != nil {
			response = "❌ خطا در بروزرسانی اطلاعات کاربر"
		} else {
			hasLicense, _ := models.CheckUserLicense(s.db, user.ID)
			licenseStatus := "❌ بدون لایسنس"
			if hasLicense {
				licenseStatus = "✅ دارای لایسنس"
			}
			response = fmt.Sprintf("🔄 اطلاعات کاربر %s %s بروزرسانی شد\n%s", user.FirstName, user.LastName, licenseStatus)
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
	// بررسی وضعیت لایسنس
	hasLicense, _ := models.CheckUserLicense(s.db, user.ID)
	licenseInfo := "❌ بدون لایسنس"
	if hasLicense {
		if license, err := models.GetUserLicense(s.db, user.ID); err == nil {
			licenseInfo = fmt.Sprintf("✅ لایسنس: %s", license.Code)
		} else {
			licenseInfo = "✅ دارای لایسنس"
		}
	}

	message := fmt.Sprintf("👤 اطلاعات کامل کاربر:\n\n"+
		"نام: %s %s\n"+
		"ایمیل: %s\n"+
		"تلفن: %s\n"+
		"🔑 %s\n"+
		"وضعیت حساب: %s\n"+
		"تاریخ ثبت‌نام: %s",
		user.FirstName, user.LastName,
		user.Email,
		user.Phone,
		licenseInfo,
		map[bool]string{true: "فعال", false: "غیرفعال"}[user.IsActive],
		user.CreatedAt.Format("2006/01/02 15:04"))

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
	hasLicense, _ := models.CheckUserLicense(s.db, user.ID)
	licenseStatus := "❌ بدون لایسنس"
	if hasLicense {
		licenseStatus = "✅ دارای لایسنس"
	}

	message := fmt.Sprintf("📊 آمار فعالیت %s %s:\n\n"+
		"تعداد ورود: -\n"+
		"آخرین فعالیت: -\n"+
		"وضعیت لایسنس: %s\n"+
		"وضعیت حساب: %s",
		user.FirstName, user.LastName,
		licenseStatus,
		map[bool]string{true: "فعال", false: "غیرفعال"}[user.IsActive])

	msg := tgbotapi.NewMessage(chatID, message)
	s.bot.Send(msg)
}

// SendLicenseRequest is deprecated in the new license system
// Licenses are now auto-approved and one-time use
func (s *TelegramService) SendLicenseRequest(user *models.User) error {
	// در سیستم جدید لایسنس‌ها خودکار تأیید می‌شوند
	// این متد فقط برای سازگاری با کد قدیمی نگه داشته شده است
	return nil
}

// New License Management Methods

func (s *TelegramService) showLicenseMenu(chatID int64) {
	keyboard := tgbotapi.NewReplyKeyboard(
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_GENERATE),
			tgbotapi.NewKeyboardButton(MENU_LIST_LICENSES),
		),
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton("🔙 بازگشت به منو اصلی"),
		),
	)
	keyboard.ResizeKeyboard = true

	msg := tgbotapi.NewMessage(chatID, "🔑 **مدیریت لایسنس‌ها**\n\n"+
		"در این بخش می‌توانید:\n"+
		"• لایسنس‌های جدید تولید کنید\n"+
		"• لیست لایسنس‌ها را مشاهده کنید\n"+
		"• وضعیت استفاده از لایسنس‌ها را بررسی کنید\n\n"+
		"لطفا یکی از گزینه‌های زیر را انتخاب کنید:")
	msg.ParseMode = "Markdown"
	msg.ReplyMarkup = keyboard
	s.bot.Send(msg)
}

func (s *TelegramService) showGeneratePrompt(chatID int64) {
	msg := tgbotapi.NewMessage(chatID, "➕ **تولید لایسنس جدید**\n\n"+
		"لطفا تعداد لایسنس‌هایی که می‌خواهید تولید کنید را وارد کنید:\n\n"+
		"• حداقل: 1 عدد\n"+
		"• حداکثر: 100 عدد\n\n"+
		"مثال: 10")
	msg.ParseMode = "Markdown"
	s.bot.Send(msg)
}

func (s *TelegramService) handleGenerateLicenses(chatID int64, count int, adminTelegramID int64) {
	// Find admin user by telegram ID (this is a simplified approach)
	// In a real scenario, you'd have a mapping between telegram IDs and user IDs
	adminID := uint(adminTelegramID) // Simplified for now

	licenses, err := models.GenerateLicenses(s.db, count, adminID)
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, fmt.Sprintf("❌ خطا در تولید لایسنس‌ها: %v", err))
		s.bot.Send(msg)
		return
	}

	// Send success message
	successMsg := fmt.Sprintf("✅ **%d لایسنس با موفقیت تولید شد!**\n\n", count)
	successMsgObj := tgbotapi.NewMessage(chatID, successMsg)
	successMsgObj.ParseMode = "Markdown"
	s.bot.Send(successMsgObj)

	// Send licenses in chunks (Telegram has message length limits)
	chunkSize := 10
	for i := 0; i < len(licenses); i += chunkSize {
		end := i + chunkSize
		if end > len(licenses) {
			end = len(licenses)
		}

		var message strings.Builder
		message.WriteString(fmt.Sprintf("🔑 **لایسنس‌های %d تا %d:**\n\n", i+1, end))

		for j, license := range licenses[i:end] {
			message.WriteString(fmt.Sprintf("`%d.` `%s`\n", i+j+1, license))
		}

		msg := tgbotapi.NewMessage(chatID, message.String())
		msg.ParseMode = "Markdown"
		s.bot.Send(msg)
	}

	// Send final instructions
	instructionsMsg := "📋 **دستورالعمل:**\n\n" +
		"• هر لایسنس فقط یک بار قابل استفاده است\n" +
		"• بعد از استفاده، لایسنس غیرفعال می‌شود\n" +
		"• لایسنس‌ها برای فروش دستی آماده هستند\n" +
		"• کاربران بعد از وارد کردن لایسنس بلافاصله دسترسی پیدا می‌کنند"

	finalMsg := tgbotapi.NewMessage(chatID, instructionsMsg)
	finalMsg.ParseMode = "Markdown"
	s.bot.Send(finalMsg)
}

func (s *TelegramService) showLicensesList(chatID int64, page int) {
	const pageSize = 20
	offset := (page - 1) * pageSize

	var licenses []models.License
	var total int64

	// Get total count
	s.db.Model(&models.License{}).Count(&total)

	// Get licenses for current page
	if err := s.db.Preload("User").Preload("Admin").
		Order("created_at DESC").
		Limit(pageSize).Offset(offset).
		Find(&licenses).Error; err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ خطا در دریافت لیست لایسنس‌ها")
		s.bot.Send(msg)
		return
	}

	if len(licenses) == 0 {
		msg := tgbotapi.NewMessage(chatID, "📝 هیچ لایسنسی یافت نشد.")
		s.bot.Send(msg)
		return
	}

	// Create header message
	var headerBuilder strings.Builder
	headerBuilder.WriteString(fmt.Sprintf("📋 **لیست لایسنس‌ها** (صفحه %d)\n\n", page))
	headerBuilder.WriteString(fmt.Sprintf("📊 تعداد کل: %d\n\n", total))

	headerMsg := tgbotapi.NewMessage(chatID, headerBuilder.String())
	headerMsg.ParseMode = "Markdown"
	s.bot.Send(headerMsg)

	// Send licenses
	for i, license := range licenses {
		var status, userInfo string
		if license.IsUsed {
			status = "❌ استفاده شده"
			if license.User != nil {
				userInfo = fmt.Sprintf("👤 کاربر: %s %s (%s)",
					license.User.FirstName, license.User.LastName, license.User.Email)
			}
		} else {
			status = "✅ قابل استفاده"
			userInfo = "👤 کاربر: ---"
		}

		adminInfo := fmt.Sprintf("🛠 تولید شده توسط: %s %s",
			license.Admin.FirstName, license.Admin.LastName)

		message := fmt.Sprintf("🔑 **لایسنس #%d**\n\n"+
			"`%s`\n\n"+
			"📊 وضعیت: %s\n"+
			"%s\n"+
			"%s\n"+
			"📅 تاریخ تولید: %s",
			offset+i+1,
			license.Code,
			status,
			userInfo,
			adminInfo,
			license.CreatedAt.Format("2006/01/02 15:04"))

		msg := tgbotapi.NewMessage(chatID, message)
		msg.ParseMode = "Markdown"
		s.bot.Send(msg)
	}

	// Pagination buttons
	var buttons [][]tgbotapi.InlineKeyboardButton
	var navRow []tgbotapi.InlineKeyboardButton

	if page > 1 {
		navRow = append(navRow, tgbotapi.NewInlineKeyboardButtonData("◀️ قبلی", fmt.Sprintf("licenses_page_%d", page-1)))
	}

	totalPages := int((total + int64(pageSize) - 1) / int64(pageSize))
	if page < totalPages {
		navRow = append(navRow, tgbotapi.NewInlineKeyboardButtonData("بعدی ▶️", fmt.Sprintf("licenses_page_%d", page+1)))
	}

	if len(navRow) > 0 {
		buttons = append(buttons, navRow)
	}

	if len(buttons) > 0 {
		keyboard := tgbotapi.NewInlineKeyboardMarkup(buttons...)
		paginationMsg := tgbotapi.NewMessage(chatID, fmt.Sprintf("📄 صفحه %d از %d", page, totalPages))
		paginationMsg.ReplyMarkup = keyboard
		s.bot.Send(paginationMsg)
	}
}
