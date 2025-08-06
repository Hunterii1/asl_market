package services

import (
	"fmt"
	"log"
	"strconv"
	"strings"
	"sync"
	"time"

	"asl-market-backend/models"
	"asl-market-backend/utils"

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
	MENU_USERS         = "👥 مدیریت کاربران"
	MENU_STATS         = "📊 آمار سیستم"
	MENU_SEARCH        = "🔍 جستجوی کاربر"
	MENU_LICENSES      = "🔑 مدیریت لایسنس"
	MENU_GENERATE      = "➕ تولید لایسنس"
	MENU_LIST_LICENSES = "📋 لیست لایسنس‌ها"
	MENU_SETTINGS      = "⚙️ تنظیمات"

	// User management sub-menus
	MENU_ALL_USERS        = "📄 همه کاربران"
	MENU_ACTIVE_USERS     = "✅ کاربران فعال"
	MENU_INACTIVE_USERS   = "❌ کاربران غیرفعال"
	MENU_LICENSED_USERS   = "🔑 کاربران با لایسنس"
	MENU_UNLICENSED_USERS = "🚫 کاربران بدون لایسنس"
	MENU_SEARCH_USER      = "🔍 جستجو کاربر"
	MENU_USER_STATS       = "📊 آمار کاربران"

	// Supplier management sub-menus
	MENU_SUPPLIERS          = "🏪 مدیریت تأمین‌کنندگان"
	MENU_PENDING_SUPPLIERS  = "⏳ تأمین‌کنندگان در انتظار"
	MENU_APPROVED_SUPPLIERS = "✅ تأمین‌کنندگان تأیید شده"
	MENU_REJECTED_SUPPLIERS = "❌ تأمین‌کنندگان رد شده"
	MENU_ALL_SUPPLIERS      = "📋 همه تأمین‌کنندگان"
	MENU_SUPPLIER_STATS     = "📊 آمار تأمین‌کنندگان"

	// Supplier action buttons
	MENU_APPROVE_SUPPLIER = "✅ تأیید"
	MENU_REJECT_SUPPLIER  = "❌ رد"
	MENU_VIEW_SUPPLIER    = "👁️ جزئیات"

	// Navigation
	MENU_PREV_PAGE = "⬅️ صفحه قبل"
	MENU_NEXT_PAGE = "➡️ صفحه بعد"
	MENU_BACK      = "🔙 بازگشت"
)

type TelegramService struct {
	bot *tgbotapi.BotAPI
	db  *gorm.DB
}

// Pagination structure for user management
type UserPagination struct {
	ChatID      int64
	Page        int
	PerPage     int
	FilterType  string // "all", "active", "inactive", "licensed", "unlicensed"
	SearchQuery string
}

// Global map to store user pagination state
var userPaginationStates = make(map[int64]*UserPagination)
var paginationMutex = sync.RWMutex{}

// User session states
type SessionState struct {
	ChatID          int64
	WaitingForInput string                 // "license_count", "search_query", "supplier_action", "reject_reason", etc.
	Data            map[string]interface{} // Additional session data
}

var sessionStates = make(map[int64]*SessionState)
var sessionMutex = sync.RWMutex{}

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
			tgbotapi.NewKeyboardButton(MENU_SUPPLIERS),
		),
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_SEARCH),
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
		s.showUserManagementMenu(message.Chat.ID)
	case MENU_ALL_USERS:
		s.showUsersList(message.Chat.ID, "all", 1)
	case MENU_ACTIVE_USERS:
		s.showUsersList(message.Chat.ID, "active", 1)
	case MENU_INACTIVE_USERS:
		s.showUsersList(message.Chat.ID, "inactive", 1)
	case MENU_LICENSED_USERS:
		s.showUsersList(message.Chat.ID, "licensed", 1)
	case MENU_UNLICENSED_USERS:
		s.showUsersList(message.Chat.ID, "unlicensed", 1)
	case MENU_SEARCH_USER:
		s.showSearchPrompt(message.Chat.ID)
		// Set session state to wait for search query
		sessionMutex.Lock()
		sessionStates[message.Chat.ID] = &SessionState{
			ChatID:          message.Chat.ID,
			WaitingForInput: "search_query",
		}
		sessionMutex.Unlock()
	case MENU_USER_STATS:
		s.showUserStats(message.Chat.ID)
	case MENU_PREV_PAGE:
		s.handlePagination(message.Chat.ID, -1)
	case MENU_NEXT_PAGE:
		s.handlePagination(message.Chat.ID, 1)
	case MENU_BACK:
		s.showMainMenu(message.Chat.ID)
	case MENU_STATS:
		s.showStats(message.Chat.ID)
	case MENU_SEARCH:
		s.showSearchPrompt(message.Chat.ID)
	case MENU_LICENSES:
		s.showLicenseMenu(message.Chat.ID)
	case MENU_SUPPLIERS:
		s.showSupplierMenu(message.Chat.ID)
	case MENU_PENDING_SUPPLIERS:
		s.showSuppliersList(message.Chat.ID, "pending", 1)
	case MENU_APPROVED_SUPPLIERS:
		s.showSuppliersList(message.Chat.ID, "approved", 1)
	case MENU_REJECTED_SUPPLIERS:
		s.showSuppliersList(message.Chat.ID, "rejected", 1)
	case MENU_ALL_SUPPLIERS:
		s.showSuppliersList(message.Chat.ID, "all", 1)
	case MENU_SUPPLIER_STATS:
		s.showSupplierStats(message.Chat.ID)
	case MENU_GENERATE:
		s.showGeneratePrompt(message.Chat.ID)
		// Set session state to wait for license count
		sessionMutex.Lock()
		sessionStates[message.Chat.ID] = &SessionState{
			ChatID:          message.Chat.ID,
			WaitingForInput: "license_count",
		}
		sessionMutex.Unlock()
	case MENU_LIST_LICENSES:
		s.showLicensesList(message.Chat.ID, 1)
	case MENU_SETTINGS:
		s.showSettings(message.Chat.ID)
	case "🔙 بازگشت به منو اصلی":
		s.showMainMenu(message.Chat.ID)
	default:
		// Check session state for input handling
		sessionMutex.RLock()
		state, exists := sessionStates[message.Chat.ID]
		sessionMutex.RUnlock()

		if exists {
			switch state.WaitingForInput {
			case "license_count":
				if count, err := strconv.Atoi(message.Text); err == nil && count > 0 && count <= 100 {
					s.handleGenerateLicenses(message.Chat.ID, count, message.From.ID)
					// Clear session state
					sessionMutex.Lock()
					delete(sessionStates, message.Chat.ID)
					sessionMutex.Unlock()
				} else {
					msg := tgbotapi.NewMessage(message.Chat.ID, "❌ لطفا عددی بین 1 تا 100 وارد کنید.")
					s.bot.Send(msg)
				}
			case "search_query":
				s.handleSearch(message.Chat.ID, message.Text)
				// Clear session state
				sessionMutex.Lock()
				delete(sessionStates, message.Chat.ID)
				sessionMutex.Unlock()
			case "reject_reason":
				// Process rejection reason
				sessionMutex.RLock()
				state := sessionStates[message.Chat.ID]
				sessionMutex.RUnlock()

				if state != nil && state.Data != nil {
					if supplierID, ok := state.Data["supplier_id"].(uint); ok {
						s.handleSupplierReject(message.Chat.ID, supplierID, message.Text)
					}
				}

				// Clear session state
				sessionMutex.Lock()
				delete(sessionStates, message.Chat.ID)
				sessionMutex.Unlock()
			}
		} else {
			// Check for supplier command patterns
			if s.handleSupplierCommands(message.Chat.ID, message.Text) {
				return
			}

			// No active session - show help message
			msg := tgbotapi.NewMessage(message.Chat.ID,
				"❓ **راهنمای استفاده:**\n\n"+
					"برای تولید لایسنس: ابتدا '➕ تولید لایسنس' را انتخاب کنید\n"+
					"برای جستجو: ابتدا '🔍 جستجو کاربر' را انتخاب کنید\n\n"+
					"یا از منوی زیر استفاده کنید:")
			msg.ParseMode = "Markdown"

			// Show main menu
			keyboard := tgbotapi.NewReplyKeyboard(
				tgbotapi.NewKeyboardButtonRow(
					tgbotapi.NewKeyboardButton(MENU_STATS),
					tgbotapi.NewKeyboardButton(MENU_USERS),
				),
				tgbotapi.NewKeyboardButtonRow(
					tgbotapi.NewKeyboardButton(MENU_LICENSES),
					tgbotapi.NewKeyboardButton(MENU_SUPPLIERS),
				),
				tgbotapi.NewKeyboardButtonRow(
					tgbotapi.NewKeyboardButton(MENU_SETTINGS),
				),
			)
			msg.ReplyMarkup = keyboard
			s.bot.Send(msg)
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

// Show user management menu with options
func (s *TelegramService) showUserManagementMenu(chatID int64) {
	keyboard := tgbotapi.NewReplyKeyboard(
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_ALL_USERS),
			tgbotapi.NewKeyboardButton(MENU_USER_STATS),
		),
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_ACTIVE_USERS),
			tgbotapi.NewKeyboardButton(MENU_INACTIVE_USERS),
		),
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_LICENSED_USERS),
			tgbotapi.NewKeyboardButton(MENU_UNLICENSED_USERS),
		),
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_SEARCH_USER),
			tgbotapi.NewKeyboardButton(MENU_BACK),
		),
	)

	msg := tgbotapi.NewMessage(chatID,
		"👥 **مدیریت کاربران**\n\n"+
			"لطفا گزینه مورد نظر خود را انتخاب کنید:\n\n"+
			"📄 **همه کاربران**: نمایش تمام کاربران سیستم\n"+
			"✅ **کاربران فعال**: کاربرانی که فعال هستند\n"+
			"❌ **کاربران غیرفعال**: کاربرانی که غیرفعال شده‌اند\n"+
			"🔑 **کاربران با لایسنس**: کاربرانی که لایسنس فعال دارند\n"+
			"🚫 **کاربران بدون لایسنس**: کاربرانی که لایسنس ندارند\n"+
			"🔍 **جستجو کاربر**: جستجو بر اساس ایمیل یا نام\n"+
			"📊 **آمار کاربران**: نمایش آمار کلی کاربران")

	msg.ParseMode = "Markdown"
	msg.ReplyMarkup = keyboard
	s.bot.Send(msg)
}

func (s *TelegramService) showUsersList(chatID int64, filterType string, page int) {
	// Store pagination state
	paginationMutex.Lock()
	userPaginationStates[chatID] = &UserPagination{
		ChatID:     chatID,
		Page:       page,
		PerPage:    5,
		FilterType: filterType,
	}
	paginationMutex.Unlock()

	const perPage = 5
	offset := (page - 1) * perPage

	var users []models.User
	var total int64
	query := s.db.Model(&models.User{})

	// Apply filter
	switch filterType {
	case "active":
		query = query.Where("is_active = ?", true)
	case "inactive":
		query = query.Where("is_active = ?", false)
	case "licensed":
		// Users who have an active license
		query = query.Where("id IN (SELECT used_by FROM licenses WHERE is_used = ? AND used_by IS NOT NULL)", true)
	case "unlicensed":
		// Users who don't have an active license
		query = query.Where("id NOT IN (SELECT used_by FROM licenses WHERE is_used = ? AND used_by IS NOT NULL)", true)
	}

	// Get total count
	query.Count(&total)

	// Get paginated results
	if err := query.Offset(offset).Limit(perPage).Find(&users).Error; err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ خطا در دریافت لیست کاربران")
		s.bot.Send(msg)
		return
	}

	// Build header with filter info
	var filterName string
	switch filterType {
	case "all":
		filterName = "📄 همه کاربران"
	case "active":
		filterName = "✅ کاربران فعال"
	case "inactive":
		filterName = "❌ کاربران غیرفعال"
	case "licensed":
		filterName = "🔑 کاربران با لایسنس"
	case "unlicensed":
		filterName = "🚫 کاربران بدون لایسنس"
	}

	// Calculate pagination info
	totalPages := (int(total) + perPage - 1) / perPage
	startItem := offset + 1
	endItem := offset + len(users)

	// Build message
	var message strings.Builder
	message.WriteString(fmt.Sprintf("**%s**\n\n", filterName))
	message.WriteString(fmt.Sprintf("📊 **آمار**: %d کاربر | صفحه %d از %d\n", total, page, totalPages))
	message.WriteString(fmt.Sprintf("👀 **نمایش**: %d تا %d\n\n", startItem, endItem))

	if len(users) == 0 {
		message.WriteString("❌ کاربری با این فیلتر یافت نشد.")
	} else {
		message.WriteString("👥 **لیست کاربران:**\n\n")

		for i, user := range users {
			// Check license status
			hasLicense, _ := models.CheckUserLicense(s.db, user.ID)
			licenseIcon := "🚫"
			if hasLicense {
				licenseIcon = "🔑"
			}

			activeIcon := "❌"
			if user.IsActive {
				activeIcon = "✅"
			}

			message.WriteString(fmt.Sprintf(
				"**%d. %s %s**\n"+
					"📧 ایمیل: `%s`\n"+
					"📱 تلفن: %s\n"+
					"🗓️ تاریخ عضویت: %s\n"+
					"%s فعال | %s لایسنس\n"+
					"➖➖➖➖➖➖➖➖\n",
				startItem+i,
				user.FirstName,
				user.LastName,
				user.Email,
				user.Phone,
				user.CreatedAt.Format("2006/01/02"),
				activeIcon,
				licenseIcon,
			))
		}
	}

	// Create navigation keyboard
	var keyboardRows [][]tgbotapi.KeyboardButton

	// Navigation row
	var navRow []tgbotapi.KeyboardButton
	if page > 1 {
		navRow = append(navRow, tgbotapi.NewKeyboardButton(MENU_PREV_PAGE))
	}
	if page < totalPages {
		navRow = append(navRow, tgbotapi.NewKeyboardButton(MENU_NEXT_PAGE))
	}
	if len(navRow) > 0 {
		keyboardRows = append(keyboardRows, navRow)
	}

	// Back button
	keyboardRows = append(keyboardRows, []tgbotapi.KeyboardButton{
		tgbotapi.NewKeyboardButton(MENU_BACK),
	})

	keyboard := tgbotapi.NewReplyKeyboard(keyboardRows...)

	msg := tgbotapi.NewMessage(chatID, message.String())
	msg.ParseMode = "Markdown"
	msg.ReplyMarkup = keyboard
	s.bot.Send(msg)
}

// Handle pagination for user list
func (s *TelegramService) handlePagination(chatID int64, direction int) {
	paginationMutex.RLock()
	state, exists := userPaginationStates[chatID]
	paginationMutex.RUnlock()

	if !exists {
		msg := tgbotapi.NewMessage(chatID, "❌ وضعیت صفحه‌بندی یافت نشد. لطفا مجدد تلاش کنید.")
		s.bot.Send(msg)
		return
	}

	newPage := state.Page + direction
	if newPage < 1 {
		newPage = 1
	}

	s.showUsersList(chatID, state.FilterType, newPage)
}

// Show comprehensive user statistics
func (s *TelegramService) showUserStats(chatID int64) {
	var totalUsers, activeUsers, inactiveUsers int64
	var licensedUsers, unlicensedUsers int64

	// Get total users
	s.db.Model(&models.User{}).Count(&totalUsers)

	// Get active/inactive users
	s.db.Model(&models.User{}).Where("is_active = ?", true).Count(&activeUsers)
	s.db.Model(&models.User{}).Where("is_active = ?", false).Count(&inactiveUsers)

	// Get licensed/unlicensed users
	s.db.Model(&models.User{}).Where("id IN (SELECT used_by FROM licenses WHERE is_used = ? AND used_by IS NOT NULL)", true).Count(&licensedUsers)
	unlicensedUsers = totalUsers - licensedUsers

	// Get recent registrations (last 7 days)
	var recentUsers int64
	weekAgo := time.Now().AddDate(0, 0, -7)
	s.db.Model(&models.User{}).Where("created_at > ?", weekAgo).Count(&recentUsers)

	// Get most recent user
	var lastUser models.User
	s.db.Model(&models.User{}).Order("created_at DESC").First(&lastUser)

	message := fmt.Sprintf(
		"📊 **آمار کامل کاربران سیستم**\n\n"+
			"👥 **آمار کلی:**\n"+
			"• کل کاربران: `%d` نفر\n"+
			"• کاربران فعال: `%d` نفر (%.1f%%)\n"+
			"• کاربران غیرفعال: `%d` نفر (%.1f%%)\n\n"+
			"🔑 **آمار لایسنس:**\n"+
			"• کاربران با لایسنس: `%d` نفر (%.1f%%)\n"+
			"• کاربران بدون لایسنس: `%d` نفر (%.1f%%)\n\n"+
			"📈 **آمار فعالیت:**\n"+
			"• ثبت‌نام های هفته اخیر: `%d` نفر\n"+
			"• آخرین کاربر: **%s %s**\n"+
			"• تاریخ آخرین ثبت‌نام: `%s`\n\n"+
			"📋 **عملیات قابل انجام:**\n"+
			"• مشاهده لیست کاربران بر اساس فیلترهای مختلف\n"+
			"• جستجو و یافتن کاربران خاص\n"+
			"• مدیریت وضعیت فعال/غیرفعال کاربران",
		totalUsers,
		activeUsers, float64(activeUsers)/float64(totalUsers)*100,
		inactiveUsers, float64(inactiveUsers)/float64(totalUsers)*100,
		licensedUsers, float64(licensedUsers)/float64(totalUsers)*100,
		unlicensedUsers, float64(unlicensedUsers)/float64(totalUsers)*100,
		recentUsers,
		lastUser.FirstName, lastUser.LastName,
		lastUser.CreatedAt.Format("2006/01/02 15:04"),
	)

	// Create back button
	keyboard := tgbotapi.NewReplyKeyboard(
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_BACK),
		),
	)

	msg := tgbotapi.NewMessage(chatID, message)
	msg.ParseMode = "Markdown"
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
			s.showUserManagementMenu(chatID) // Show filter options again
		case "back":
			s.showUserManagementMenu(chatID)
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

func (s *TelegramService) showIndividualUserStats(chatID int64, user models.User) {
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

// Supplier Management Methods

func (s *TelegramService) showSupplierMenu(chatID int64) {
	keyboard := tgbotapi.NewReplyKeyboard(
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_PENDING_SUPPLIERS),
			tgbotapi.NewKeyboardButton(MENU_SUPPLIER_STATS),
		),
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_APPROVED_SUPPLIERS),
			tgbotapi.NewKeyboardButton(MENU_REJECTED_SUPPLIERS),
		),
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_ALL_SUPPLIERS),
			tgbotapi.NewKeyboardButton(MENU_BACK),
		),
	)

	msg := tgbotapi.NewMessage(chatID,
		"🏪 **مدیریت تأمین‌کنندگان**\n\n"+
			"لطفا گزینه مورد نظر خود را انتخاب کنید:\n\n"+
			"⏳ **در انتظار**: تأمین‌کنندگان منتظر بررسی\n"+
			"✅ **تأیید شده**: تأمین‌کنندگان فعال\n"+
			"❌ **رد شده**: تأمین‌کنندگان رد شده\n"+
			"📋 **همه**: تمام تأمین‌کنندگان\n"+
			"📊 **آمار**: آمار کلی تأمین‌کنندگان")

	msg.ParseMode = "Markdown"
	msg.ReplyMarkup = keyboard
	s.bot.Send(msg)
}

func (s *TelegramService) showSuppliersList(chatID int64, status string, page int) {
	const perPage = 5

	suppliers, total, err := models.GetSuppliersForAdmin(s.db, status, page, perPage)
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ خطا در دریافت لیست تأمین‌کنندگان")
		s.bot.Send(msg)
		return
	}

	// Build header with filter info
	var filterName string
	switch status {
	case "pending":
		filterName = "⏳ تأمین‌کنندگان در انتظار"
	case "approved":
		filterName = "✅ تأمین‌کنندگان تأیید شده"
	case "rejected":
		filterName = "❌ تأمین‌کنندگان رد شده"
	default:
		filterName = "📋 همه تأمین‌کنندگان"
	}

	// Calculate pagination info
	totalPages := (int(total) + perPage - 1) / perPage
	startItem := (page-1)*perPage + 1
	endItem := startItem + len(suppliers) - 1

	// Build message
	var message strings.Builder
	message.WriteString(fmt.Sprintf("**%s**\n\n", filterName))
	message.WriteString(fmt.Sprintf("📊 **آمار**: %d تأمین‌کننده | صفحه %d از %d\n", total, page, totalPages))
	message.WriteString(fmt.Sprintf("👀 **نمایش**: %d تا %d\n\n", startItem, endItem))

	if len(suppliers) == 0 {
		message.WriteString("❌ تأمین‌کننده‌ای با این فیلتر یافت نشد.")
	} else {
		message.WriteString("🏪 **لیست تأمین‌کنندگان:**\n\n")

		for i, supplier := range suppliers {
			statusIcon := "⏳"
			switch supplier.Status {
			case "approved":
				statusIcon = "✅"
			case "rejected":
				statusIcon = "❌"
			}

			businessIcon := "👤"
			if supplier.HasRegisteredBusiness {
				businessIcon = "🏢"
			}

			// Load products count
			var productCount int64
			s.db.Model(&models.SupplierProduct{}).Where("supplier_id = ?", supplier.ID).Count(&productCount)

			supplierInfo := fmt.Sprintf(
				"**%d. %s %s**\n"+
					"📧 نام: %s\n"+
					"📱 موبایل: %s\n"+
					"🏘️ شهر: %s\n"+
					"📦 تعداد محصولات: %d\n"+
					"🗓️ تاریخ ثبت‌نام: %s\n"+
					"%s وضعیت: %s | %s نوع کسب‌وکار\n",
				startItem+i,
				statusIcon,
				supplier.FullName,
				supplier.FullName,
				supplier.Mobile,
				supplier.City,
				productCount,
				supplier.CreatedAt.Format("2006/01/02"),
				statusIcon,
				supplier.Status,
				businessIcon,
			)

			// Add action buttons for pending suppliers
			if supplier.Status == "pending" {
				supplierInfo += fmt.Sprintf(
					"🔘 عملیات: /view_%d | /approve_%d | /reject_%d\n",
					supplier.ID, supplier.ID, supplier.ID,
				)
			}

			supplierInfo += "➖➖➖➖➖➖➖➖\n"
			message.WriteString(supplierInfo)
		}
	}

	// Create navigation keyboard
	var keyboardRows [][]tgbotapi.KeyboardButton

	// Navigation row
	var navRow []tgbotapi.KeyboardButton
	if page > 1 {
		navRow = append(navRow, tgbotapi.NewKeyboardButton(MENU_PREV_PAGE))
	}
	if page < totalPages {
		navRow = append(navRow, tgbotapi.NewKeyboardButton(MENU_NEXT_PAGE))
	}
	if len(navRow) > 0 {
		keyboardRows = append(keyboardRows, navRow)
	}

	// Back button
	keyboardRows = append(keyboardRows, []tgbotapi.KeyboardButton{
		tgbotapi.NewKeyboardButton(MENU_BACK),
	})

	keyboard := tgbotapi.NewReplyKeyboard(keyboardRows...)

	msg := tgbotapi.NewMessage(chatID, message.String())
	msg.ParseMode = "Markdown"
	msg.ReplyMarkup = keyboard
	s.bot.Send(msg)
}

func (s *TelegramService) showSupplierStats(chatID int64) {
	var totalSuppliers, pendingSuppliers, approvedSuppliers, rejectedSuppliers int64

	// Get supplier counts
	s.db.Model(&models.Supplier{}).Count(&totalSuppliers)
	s.db.Model(&models.Supplier{}).Where("status = ?", "pending").Count(&pendingSuppliers)
	s.db.Model(&models.Supplier{}).Where("status = ?", "approved").Count(&approvedSuppliers)
	s.db.Model(&models.Supplier{}).Where("status = ?", "rejected").Count(&rejectedSuppliers)

	// Get total products
	var totalProducts int64
	s.db.Model(&models.SupplierProduct{}).Count(&totalProducts)

	// Get recent registrations (last 7 days)
	var recentSuppliers int64
	weekAgo := time.Now().AddDate(0, 0, -7)
	s.db.Model(&models.Supplier{}).Where("created_at > ?", weekAgo).Count(&recentSuppliers)

	// Get most recent supplier
	var lastSupplier models.Supplier
	s.db.Model(&models.Supplier{}).Order("created_at DESC").First(&lastSupplier)

	message := fmt.Sprintf(
		"🏪 **آمار کامل تأمین‌کنندگان**\n\n"+
			"📊 **آمار کلی:**\n"+
			"• کل تأمین‌کنندگان: `%d` تأمین‌کننده\n"+
			"• در انتظار بررسی: `%d` تأمین‌کننده (%.1f%%)\n"+
			"• تأیید شده: `%d` تأمین‌کننده (%.1f%%)\n"+
			"• رد شده: `%d` تأمین‌کننده (%.1f%%)\n\n"+
			"📦 **آمار محصولات:**\n"+
			"• کل محصولات: `%d` محصول\n"+
			"• متوسط محصول هر تأمین‌کننده: `%.1f`\n\n"+
			"📈 **آمار فعالیت:**\n"+
			"• ثبت‌نام های هفته اخیر: `%d` تأمین‌کننده\n"+
			"• آخرین ثبت‌نام: **%s**\n"+
			"• تاریخ آخرین ثبت‌نام: `%s`\n\n"+
			"⚡ **عملیات سریع:**\n"+
			"• بررسی درخواست‌های جدید\n"+
			"• تأیید/رد تأمین‌کنندگان\n"+
			"• مشاهده جزئیات هر تأمین‌کننده",
		totalSuppliers,
		pendingSuppliers, getSafePercentage(pendingSuppliers, totalSuppliers),
		approvedSuppliers, getSafePercentage(approvedSuppliers, totalSuppliers),
		rejectedSuppliers, getSafePercentage(rejectedSuppliers, totalSuppliers),
		totalProducts,
		getSafeAverage(totalProducts, totalSuppliers),
		recentSuppliers,
		lastSupplier.FullName,
		lastSupplier.CreatedAt.Format("2006/01/02 15:04"),
	)

	// Create back button
	keyboard := tgbotapi.NewReplyKeyboard(
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_BACK),
		),
	)

	msg := tgbotapi.NewMessage(chatID, message)
	msg.ParseMode = "Markdown"
	msg.ReplyMarkup = keyboard
	s.bot.Send(msg)
}

// Supplier Command Handlers

func (s *TelegramService) handleSupplierCommands(chatID int64, text string) bool {
	// Check for supplier action commands: /view_123, /approve_123, /reject_123
	if strings.HasPrefix(text, "/view_") {
		supplierIDStr := strings.TrimPrefix(text, "/view_")
		if supplierID, err := strconv.ParseUint(supplierIDStr, 10, 32); err == nil {
			s.showSupplierDetails(chatID, uint(supplierID))
			return true
		}
	} else if strings.HasPrefix(text, "/approve_") {
		supplierIDStr := strings.TrimPrefix(text, "/approve_")
		if supplierID, err := strconv.ParseUint(supplierIDStr, 10, 32); err == nil {
			s.handleSupplierApprove(chatID, uint(supplierID))
			return true
		}
	} else if strings.HasPrefix(text, "/reject_") {
		supplierIDStr := strings.TrimPrefix(text, "/reject_")
		if supplierID, err := strconv.ParseUint(supplierIDStr, 10, 32); err == nil {
			s.promptSupplierReject(chatID, uint(supplierID))
			return true
		}
	}
	return false
}

func (s *TelegramService) showSupplierDetails(chatID int64, supplierID uint) {
	var supplier models.Supplier
	err := s.db.Preload("User").Preload("Products").Where("id = ?", supplierID).First(&supplier).Error
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ تأمین‌کننده یافت نشد")
		s.bot.Send(msg)
		return
	}

	// Build detailed message
	var message strings.Builder
	message.WriteString(fmt.Sprintf("**📋 جزئیات تأمین‌کننده #%d**\n\n", supplier.ID))

	// Personal Info
	message.WriteString("**👤 اطلاعات شخصی:**\n")
	message.WriteString(fmt.Sprintf("• نام کامل: %s\n", supplier.FullName))
	message.WriteString(fmt.Sprintf("• موبایل: %s\n", supplier.Mobile))
	if supplier.BrandName != "" {
		message.WriteString(fmt.Sprintf("• نام برند: %s\n", supplier.BrandName))
	}
	message.WriteString(fmt.Sprintf("• شهر: %s\n", supplier.City))
	message.WriteString(fmt.Sprintf("• آدرس: %s\n", supplier.Address))

	// Business Info
	message.WriteString("\n**🏢 اطلاعات کسب‌وکار:**\n")
	if supplier.HasRegisteredBusiness {
		message.WriteString("• کسب‌وکار ثبت‌شده: ✅ بله\n")
		if supplier.BusinessRegistrationNum != "" {
			message.WriteString(fmt.Sprintf("• شماره ثبت: %s\n", supplier.BusinessRegistrationNum))
		}
	} else {
		message.WriteString("• کسب‌وکار ثبت‌شده: ❌ خیر\n")
	}

	// Export Experience
	if supplier.HasExportExperience {
		message.WriteString("• سابقه صادراتی: ✅ دارد\n")
		if supplier.ExportPrice != "" {
			message.WriteString(fmt.Sprintf("• قیمت صادراتی: %s\n", supplier.ExportPrice))
		}
	} else {
		message.WriteString("• سابقه صادراتی: ❌ ندارد\n")
	}

	// Pricing
	message.WriteString("\n**💰 قیمت‌گذاری:**\n")
	message.WriteString(fmt.Sprintf("• قیمت عمده حداقلی: %s\n", supplier.WholesaleMinPrice))
	if supplier.WholesaleHighVolumePrice != "" {
		message.WriteString(fmt.Sprintf("• قیمت عمده حجم بالا: %s\n", supplier.WholesaleHighVolumePrice))
	}
	if supplier.CanProducePrivateLabel {
		message.WriteString("• تولید برند خصوصی: ✅ امکان‌پذیر\n")
	}

	// Products
	message.WriteString(fmt.Sprintf("\n**📦 محصولات (%d عدد):**\n", len(supplier.Products)))
	for i, product := range supplier.Products {
		message.WriteString(fmt.Sprintf("%d. **%s** (%s)\n", i+1, product.ProductName, product.ProductType))
		message.WriteString(fmt.Sprintf("   توضیحات: %s\n", product.Description))
		message.WriteString(fmt.Sprintf("   تولید ماهانه: %s\n", product.MonthlyProductionMin))
		if product.NeedsExportLicense {
			message.WriteString("   نیاز به مجوز صادراتی: ✅\n")
			if product.RequiredLicenseType != "" {
				message.WriteString(fmt.Sprintf("   نوع مجوز: %s\n", product.RequiredLicenseType))
			}
		}
		message.WriteString("\n")
	}

	// Status
	message.WriteString(fmt.Sprintf("**📊 وضعیت:** %s\n", supplier.Status))
	message.WriteString(fmt.Sprintf("**🗓️ تاریخ ثبت‌نام:** %s\n", supplier.CreatedAt.Format("2006/01/02 15:04")))
	if supplier.ApprovedAt != nil {
		message.WriteString(fmt.Sprintf("**✅ تاریخ تأیید:** %s\n", supplier.ApprovedAt.Format("2006/01/02 15:04")))
	}
	if supplier.AdminNotes != "" {
		message.WriteString(fmt.Sprintf("**📝 یادداشت ادمین:** %s\n", supplier.AdminNotes))
	}

	// Action buttons for pending suppliers
	var keyboard tgbotapi.ReplyKeyboardMarkup
	if supplier.Status == "pending" {
		keyboard = tgbotapi.NewReplyKeyboard(
			tgbotapi.NewKeyboardButtonRow(
				tgbotapi.NewKeyboardButton(fmt.Sprintf("/approve_%d", supplier.ID)),
				tgbotapi.NewKeyboardButton(fmt.Sprintf("/reject_%d", supplier.ID)),
			),
			tgbotapi.NewKeyboardButtonRow(
				tgbotapi.NewKeyboardButton(MENU_BACK),
			),
		)
	} else {
		keyboard = tgbotapi.NewReplyKeyboard(
			tgbotapi.NewKeyboardButtonRow(
				tgbotapi.NewKeyboardButton(MENU_BACK),
			),
		)
	}

	msg := tgbotapi.NewMessage(chatID, message.String())
	msg.ParseMode = "Markdown"
	msg.ReplyMarkup = keyboard
	s.bot.Send(msg)
}

func (s *TelegramService) handleSupplierApprove(chatID int64, supplierID uint) {
	// Find admin user ID for approval
	adminID, err := s.findOrCreateAdminUser(chatID)
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ خطا در شناسایی ادمین")
		s.bot.Send(msg)
		return
	}

	err = models.ApproveSupplier(s.db, supplierID, adminID, "تأیید شده توسط ادمین")
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ خطا در تأیید تأمین‌کننده")
		s.bot.Send(msg)
		return
	}

	msg := tgbotapi.NewMessage(chatID, fmt.Sprintf("✅ تأمین‌کننده #%d با موفقیت تأیید شد", supplierID))
	s.bot.Send(msg)

	// Show pending suppliers list again
	s.showSuppliersList(chatID, "pending", 1)
}

func (s *TelegramService) promptSupplierReject(chatID int64, supplierID uint) {
	// Set session state to wait for rejection reason
	sessionMutex.Lock()
	sessionStates[chatID] = &SessionState{
		ChatID:          chatID,
		WaitingForInput: "reject_reason",
		Data: map[string]interface{}{
			"supplier_id": supplierID,
		},
	}
	sessionMutex.Unlock()

	msg := tgbotapi.NewMessage(chatID, fmt.Sprintf("📝 لطفا دلیل رد تأمین‌کننده #%d را وارد کنید:", supplierID))
	s.bot.Send(msg)
}

func (s *TelegramService) handleSupplierReject(chatID int64, supplierID uint, reason string) {
	// Find admin user ID for rejection
	adminID, err := s.findOrCreateAdminUser(chatID)
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ خطا در شناسایی ادمین")
		s.bot.Send(msg)
		return
	}

	err = models.RejectSupplier(s.db, supplierID, adminID, reason)
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ خطا در رد تأمین‌کننده")
		s.bot.Send(msg)
		return
	}

	msg := tgbotapi.NewMessage(chatID, fmt.Sprintf("❌ تأمین‌کننده #%d رد شد\n📝 دلیل: %s", supplierID, reason))
	s.bot.Send(msg)

	// Show pending suppliers list again
	s.showSuppliersList(chatID, "pending", 1)
}

// Helper functions
func getSafePercentage(part, total int64) float64 {
	if total == 0 {
		return 0
	}
	return float64(part) / float64(total) * 100
}

func getSafeAverage(total, count int64) float64 {
	if count == 0 {
		return 0
	}
	return float64(total) / float64(count)
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

// Helper function to find or create admin user for telegram bot operations
func (s *TelegramService) findOrCreateAdminUser(telegramID int64) (uint, error) {
	// First try to find existing admin user
	var adminUser models.User

	// Try to find by a predictable email pattern
	adminEmail := fmt.Sprintf("admin_%d@aslmarket.local", telegramID)

	err := s.db.Where("email = ?", adminEmail).First(&adminUser).Error
	if err == nil {
		return adminUser.ID, nil
	}

	// If not found, create a new admin user
	adminUser = models.User{
		FirstName: "Admin",
		LastName:  fmt.Sprintf("Bot_%d", telegramID),
		Email:     adminEmail,
		Password:  "telegram_bot_admin", // This will be hashed
		Phone:     fmt.Sprintf("bot_%d", telegramID),
		IsActive:  true,
	}

	// Hash the password
	if hashedPassword, err := utils.HashPassword(adminUser.Password); err != nil {
		return 0, fmt.Errorf("خطا در هش کردن رمز عبور: %w", err)
	} else {
		adminUser.Password = hashedPassword
	}

	// Create the user
	if err := s.db.Create(&adminUser).Error; err != nil {
		return 0, fmt.Errorf("خطا در ایجاد کاربر ادمین: %w", err)
	}

	return adminUser.ID, nil
}

func (s *TelegramService) handleGenerateLicenses(chatID int64, count int, adminTelegramID int64) {
	// Find or create admin user for telegram bot
	adminID, err := s.findOrCreateAdminUser(adminTelegramID)
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, fmt.Sprintf("❌ خطا در یافتن ادمین: %v", err))
		s.bot.Send(msg)
		return
	}

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
