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

	// Visitor management sub-menus
	MENU_VISITORS          = "🚶‍♂️ مدیریت ویزیتورها"
	MENU_PENDING_VISITORS  = "⏳ ویزیتورهای در انتظار"
	MENU_APPROVED_VISITORS = "✅ ویزیتورهای تأیید شده"
	MENU_REJECTED_VISITORS = "❌ ویزیتورهای رد شده"
	MENU_ALL_VISITORS      = "📋 همه ویزیتورها"
	MENU_VISITOR_STATS     = "📊 آمار ویزیتورها"

	// Research products management sub-menus
	MENU_RESEARCH_PRODUCTS      = "🔬 مدیریت محصولات تحقیقی"
	MENU_ADD_RESEARCH_PRODUCT   = "➕ اضافه کردن محصول"
	MENU_LIST_RESEARCH_PRODUCTS = "📋 لیست محصولات"
	MENU_RESEARCH_PRODUCT_STATS = "📊 آمار محصولات"

	// Marketing popup management sub-menus
	MENU_MARKETING_POPUPS        = "📢 مدیریت پاپ‌اپ تبلیغاتی"
	MENU_ADD_MARKETING_POPUP     = "➕ اضافه کردن پاپ‌اپ"
	MENU_LIST_MARKETING_POPUPS   = "📋 لیست پاپ‌اپ‌ها"
	MENU_ACTIVE_MARKETING_POPUPS = "✅ پاپ‌اپ‌های فعال"
	MENU_MARKETING_POPUP_STATS   = "📊 آمار پاپ‌اپ‌ها"

	// Visitor action buttons
	MENU_APPROVE_VISITOR = "✅ تأیید"
	MENU_REJECT_VISITOR  = "❌ رد"
	MENU_VIEW_VISITOR    = "👁️ جزئیات"

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

		// Handle file uploads
		if update.Message.Document != nil {
			go s.handleFileUpload(&update)
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
			tgbotapi.NewKeyboardButton(MENU_VISITORS),
			tgbotapi.NewKeyboardButton(MENU_RESEARCH_PRODUCTS),
		),
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_MARKETING_POPUPS),
		),
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_BULK_IMPORT),
			tgbotapi.NewKeyboardButton(MENU_SINGLE_ADD),
		),
		tgbotapi.NewKeyboardButtonRow(
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
	case MENU_VISITORS:
		s.showVisitorMenu(message.Chat.ID)
	case MENU_PENDING_VISITORS:
		s.showVisitorsList(message.Chat.ID, "pending", 1)
	case MENU_APPROVED_VISITORS:
		s.showVisitorsList(message.Chat.ID, "approved", 1)
	case MENU_REJECTED_VISITORS:
		s.showVisitorsList(message.Chat.ID, "rejected", 1)
	case MENU_ALL_VISITORS:
		s.showVisitorsList(message.Chat.ID, "all", 1)
	case MENU_VISITOR_STATS:
		s.showVisitorStats(message.Chat.ID)
	case MENU_RESEARCH_PRODUCTS:
		s.showResearchProductsMenu(message.Chat.ID)
	case MENU_ADD_RESEARCH_PRODUCT:
		s.promptAddResearchProduct(message.Chat.ID)
	case MENU_LIST_RESEARCH_PRODUCTS:
		s.showResearchProductsList(message.Chat.ID)
	case MENU_RESEARCH_PRODUCT_STATS:
		s.showResearchProductsStats(message.Chat.ID)
	case MENU_MARKETING_POPUPS:
		s.showMarketingPopupsMenu(message.Chat.ID)
	case MENU_ADD_MARKETING_POPUP:
		s.promptAddMarketingPopup(message.Chat.ID)
	case MENU_LIST_MARKETING_POPUPS:
		s.showMarketingPopupsList(message.Chat.ID)
	case MENU_ACTIVE_MARKETING_POPUPS:
		s.showActiveMarketingPopups(message.Chat.ID)
	case MENU_MARKETING_POPUP_STATS:
		s.showMarketingPopupsStats(message.Chat.ID)
	case MENU_BULK_IMPORT:
		s.showBulkImportMenu(message.Chat.ID)
	case MENU_BULK_IMPORT_SUPPLIERS:
		s.promptBulkImportSuppliers(message.Chat.ID)
	case MENU_BULK_IMPORT_VISITORS:
		s.promptBulkImportVisitors(message.Chat.ID)
	case MENU_DOWNLOAD_TEMPLATES:
		s.showTemplateDownloadMenu(message.Chat.ID)
	case MENU_SUPPLIER_TEMPLATE:
		s.generateAndSendSupplierTemplate(message.Chat.ID)
	case MENU_VISITOR_TEMPLATE:
		s.generateAndSendVisitorTemplate(message.Chat.ID)
	case MENU_SINGLE_ADD:
		s.showSingleAddMenu(message.Chat.ID)
	case MENU_ADD_SINGLE_SUPPLIER:
		s.promptAddSingleSupplier(message.Chat.ID)
	case MENU_ADD_SINGLE_VISITOR:
		s.promptAddSingleVisitor(message.Chat.ID)
	case MENU_BULK_IMPORT_PRODUCTS:
		s.promptBulkImportProducts(message.Chat.ID)
	case MENU_PRODUCT_TEMPLATE:
		s.generateAndSendProductTemplate(message.Chat.ID)
	case MENU_ADD_SINGLE_PRODUCT:
		s.promptAddSingleProduct(message.Chat.ID)
	case MENU_GENERATE:
		s.showLicenseTypeSelection(message.Chat.ID)
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
					// Get license type from session data
					licenseType := "plus" // default
					if state.Data != nil {
						if lt, ok := state.Data["license_type"].(string); ok {
							licenseType = lt
						}
					}

					s.handleGenerateLicenses(message.Chat.ID, count, licenseType, message.From.ID)
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
			case "visitor_reject_reason":
				// Process visitor rejection reason
				sessionMutex.RLock()
				state := sessionStates[message.Chat.ID]
				sessionMutex.RUnlock()

				if state != nil && state.Data != nil {
					if visitorID, ok := state.Data["visitor_id"].(uint); ok {
						s.handleVisitorReject(message.Chat.ID, visitorID, message.Text)
					}
				}

				// Clear session state
				sessionMutex.Lock()
				delete(sessionStates, message.Chat.ID)
				sessionMutex.Unlock()
			case "research_product_name":
				s.handleResearchProductCreation(message.Chat.ID, message.Text, "name")
			case "research_product_category":
				s.handleResearchProductCreation(message.Chat.ID, message.Text, "category")
			case "research_product_description":
				s.handleResearchProductCreation(message.Chat.ID, message.Text, "description")
			case "research_product_target_country":
				s.handleResearchProductCreation(message.Chat.ID, message.Text, "target_country")
			case "research_product_iran_price":
				s.handleResearchProductCreation(message.Chat.ID, message.Text, "iran_price")
			case "research_product_target_price":
				s.handleResearchProductCreation(message.Chat.ID, message.Text, "target_price")
			case "research_product_currency":
				s.handleResearchProductCreation(message.Chat.ID, message.Text, "currency")
			case "research_product_market_demand":
				s.handleResearchProductCreation(message.Chat.ID, message.Text, "market_demand")
			case "marketing_popup_data":
				s.handleMarketingPopupInput(message.Chat.ID, message.Text)
			case "single_supplier_data":
				s.handleSingleSupplierInput(message.Chat.ID, message.Text)
			case "single_visitor_data":
				s.handleSingleVisitorInput(message.Chat.ID, message.Text)
			case "single_product_data":
				s.handleSingleProductInput(message.Chat.ID, message.Text)
			}
		} else {
			// Check for supplier command patterns
			if s.handleSupplierCommands(message.Chat.ID, message.Text) {
				return
			}

			// Check for visitor command patterns
			if s.handleVisitorCommands(message.Chat.ID, message.Text) {
				return
			}

			// Check for popup command patterns
			if s.handlePopupCommands(message) {
				return
			}

			// Check for product approval command patterns
			if s.HandleProductApprovalCommands(message.Chat.ID, message.Text) {
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
	if id, parseErr := strconv.ParseUint(query, 10, 32); parseErr == nil {
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

	log.Printf("Callback query received: chatID %d, data: %s", chatID, data)

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

	// Handle country button callbacks
	if strings.HasPrefix(data, "country_") {
		country := strings.TrimPrefix(data, "country_")
		var countryName string
		switch country {
		case "UAE":
			countryName = "امارات متحده عربی"
		case "Saudi":
			countryName = "عربستان سعودی"
		case "Kuwait":
			countryName = "کویت"
		case "Qatar":
			countryName = "قطر"
		case "Bahrain":
			countryName = "بحرین"
		case "Oman":
			countryName = "عمان"
		default:
			countryName = country
		}

		// Send acknowledgment to callback query
		callback := tgbotapi.NewCallback(query.ID, "")
		s.bot.Request(callback)

		s.handleResearchProductCreation(chatID, countryName, "target_country")
		return
	}

	// Handle currency button callbacks
	if strings.HasPrefix(data, "currency_") {
		currency := strings.TrimPrefix(data, "currency_")

		// Send acknowledgment to callback query
		callback := tgbotapi.NewCallback(query.ID, "")
		s.bot.Request(callback)

		s.handleResearchProductCreation(chatID, currency, "currency")
		return
	}

	// Handle demand button callbacks
	if strings.HasPrefix(data, "demand_") {
		demand := strings.TrimPrefix(data, "demand_")

		// Send acknowledgment to callback query
		callback := tgbotapi.NewCallback(query.ID, "")
		s.bot.Request(callback)

		s.handleResearchProductCreation(chatID, demand, "market_demand")
		return
	}

	// Handle license type selection callbacks
	if strings.HasPrefix(data, "license_type_") {
		licenseType := strings.TrimPrefix(data, "license_type_")

		// Send acknowledgment to callback query
		callback := tgbotapi.NewCallback(query.ID, "")
		s.bot.Request(callback)

		s.handleLicenseTypeSelection(chatID, licenseType)
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
					"🔘 عملیات: /view%d | /approve%d | /reject%d\n",
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
	// Check for supplier action commands: /view123, /approve123, /reject123
	if strings.HasPrefix(text, "/view") && len(text) > 5 {
		supplierIDStr := strings.TrimPrefix(text, "/view")
		if supplierID, err := strconv.ParseUint(supplierIDStr, 10, 32); err == nil {
			s.showSupplierDetails(chatID, uint(supplierID))
			return true
		}
	} else if strings.HasPrefix(text, "/approve") && len(text) > 8 {
		supplierIDStr := strings.TrimPrefix(text, "/approve")
		if supplierID, err := strconv.ParseUint(supplierIDStr, 10, 32); err == nil {
			s.handleSupplierApprove(chatID, uint(supplierID))
			return true
		}
	} else if strings.HasPrefix(text, "/reject") && len(text) > 7 {
		supplierIDStr := strings.TrimPrefix(text, "/reject")
		if supplierID, err := strconv.ParseUint(supplierIDStr, 10, 32); err == nil {
			s.promptSupplierReject(chatID, uint(supplierID))
			return true
		}
	}
	return false
}

// Visitor Command Handlers

func (s *TelegramService) handleVisitorCommands(chatID int64, text string) bool {
	// Check for visitor action commands: /vview3, /vapprove3, /vreject3
	if strings.HasPrefix(text, "/vview") && len(text) > 6 {
		visitorIDStr := strings.TrimPrefix(text, "/vview")
		if visitorID, err := strconv.ParseUint(visitorIDStr, 10, 32); err == nil {
			s.showVisitorDetails(chatID, uint(visitorID))
			return true
		}
	} else if strings.HasPrefix(text, "/vapprove") && len(text) > 9 {
		visitorIDStr := strings.TrimPrefix(text, "/vapprove")
		if visitorID, err := strconv.ParseUint(visitorIDStr, 10, 32); err == nil {
			s.handleVisitorApprove(chatID, uint(visitorID))
			return true
		}
	} else if strings.HasPrefix(text, "/vreject") && len(text) > 8 {
		visitorIDStr := strings.TrimPrefix(text, "/vreject")
		if visitorID, err := strconv.ParseUint(visitorIDStr, 10, 32); err == nil {
			s.promptVisitorReject(chatID, uint(visitorID))
			return true
		}
	}
	return false
}

func (s *TelegramService) showVisitorDetails(chatID int64, visitorID uint) {
	var visitor models.Visitor
	err := s.db.Preload("User").Where("id = ?", visitorID).First(&visitor).Error
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ ویزیتور یافت نشد")
		s.bot.Send(msg)
		return
	}

	// Build detailed message
	details := fmt.Sprintf("👤 **جزئیات ویزیتور #%d**\n\n", visitor.ID)
	details += fmt.Sprintf("📧 **نام کامل:** %s\n", visitor.FullName)
	details += fmt.Sprintf("📱 **موبایل:** %s\n", visitor.Mobile)
	details += fmt.Sprintf("🆔 **کد ملی:** %s\n", visitor.NationalID)

	if visitor.PassportNumber != "" {
		details += fmt.Sprintf("🛂 **پاسپورت:** %s\n", visitor.PassportNumber)
	}

	details += fmt.Sprintf("🎂 **تاریخ تولد:** %s\n", visitor.BirthDate)
	details += fmt.Sprintf("📧 **ایمیل:** %s\n", visitor.User.Email)
	details += fmt.Sprintf("📞 **واتساپ:** %s\n", visitor.WhatsappNumber)
	details += fmt.Sprintf("🏠 **آدرس:** %s\n", visitor.ResidenceAddress)
	details += fmt.Sprintf("🏘️ **شهر/استان:** %s\n", visitor.CityProvince)
	details += fmt.Sprintf("✈️ **مقصد:** %s\n", visitor.DestinationCities)

	if visitor.LocalContactDetails != "" {
		details += fmt.Sprintf("🤝 **آشنای محلی:** %s\n", visitor.LocalContactDetails)
	}

	details += fmt.Sprintf("🏦 **حساب بانکی:** %s\n", visitor.BankAccountIBAN)
	details += fmt.Sprintf("🏛️ **نام بانک:** %s\n", visitor.BankName)

	if visitor.AccountHolderName != "" {
		details += fmt.Sprintf("👤 **نام صاحب حساب:** %s\n", visitor.AccountHolderName)
	}

	// Experience and skills
	if visitor.HasMarketingExperience {
		details += fmt.Sprintf("💼 **تجربه بازاریابی:** بله - %s\n", visitor.MarketingExperienceDesc)
	} else {
		details += "💼 **تجربه بازاریابی:** خیر\n"
	}

	details += fmt.Sprintf("🌐 **سطح زبان:** %s\n", visitor.LanguageLevel)

	if visitor.SpecialSkills != "" {
		details += fmt.Sprintf("🎯 **مهارت‌های خاص:** %s\n", visitor.SpecialSkills)
	}

	// Commitments
	details += fmt.Sprintf("✅ **تعهد محصولات تایید شده:** %t\n", visitor.AgreesToUseApprovedProducts)
	details += fmt.Sprintf("⚖️ **تعهد عدم تخلف:** %t\n", visitor.AgreesToViolationConsequences)
	details += fmt.Sprintf("📊 **تعهد گزارش‌دهی:** %t\n", visitor.AgreesToSubmitReports)
	details += fmt.Sprintf("✍️ **امضا و تایید:** %s\n", visitor.DigitalSignature)
	details += fmt.Sprintf("📅 **تاریخ ثبت‌نام:** %s\n", visitor.CreatedAt.Format("2006/01/02"))

	// Status
	statusEmoji := "⏳"
	statusText := "در انتظار"
	switch visitor.Status {
	case "approved":
		statusEmoji = "✅"
		statusText = "تأیید شده"
	case "rejected":
		statusEmoji = "❌"
		statusText = "رد شده"
	}
	details += fmt.Sprintf("📊 **وضعیت:** %s %s\n", statusEmoji, statusText)

	// Create action buttons
	keyboard := tgbotapi.NewInlineKeyboardMarkup(
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("✅ تأیید", fmt.Sprintf("vapprove_%d", visitor.ID)),
			tgbotapi.NewInlineKeyboardButtonData("❌ رد", fmt.Sprintf("vreject_%d", visitor.ID)),
		),
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("🔙 بازگشت", "vback"),
		),
	)

	msg := tgbotapi.NewMessage(chatID, details)
	msg.ParseMode = "Markdown"
	msg.ReplyMarkup = keyboard
	s.bot.Send(msg)
}

func (s *TelegramService) handleVisitorApprove(chatID int64, visitorID uint) {
	// Get visitor
	var visitor models.Visitor
	err := s.db.Preload("User").Where("id = ?", visitorID).First(&visitor).Error
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ ویزیتور یافت نشد")
		s.bot.Send(msg)
		return
	}

	// Update status to approved
	err = s.db.Model(&visitor).Update("status", "approved").Error
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ خطا در تأیید ویزیتور")
		s.bot.Send(msg)
		return
	}

	// Send success message
	successMsg := fmt.Sprintf("✅ **ویزیتور تأیید شد**\n\n"+
		"👤 **نام:** %s\n"+
		"📱 **موبایل:** %s\n"+
		"📧 **ایمیل:** %s\n\n"+
		"ویزیتور مطلع شده است.", visitor.FullName, visitor.Mobile, visitor.User.Email)

	msg := tgbotapi.NewMessage(chatID, successMsg)
	msg.ParseMode = "Markdown"
	s.bot.Send(msg)

	// Show updated visitors list
	s.showVisitorsList(chatID, "pending", 1)
}

func (s *TelegramService) promptVisitorReject(chatID int64, visitorID uint) {
	// Get visitor
	var visitor models.Visitor
	err := s.db.Preload("User").Where("id = ?", visitorID).First(&visitor).Error
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ ویزیتور یافت نشد")
		s.bot.Send(msg)
		return
	}

	// Set session state to wait for rejection reason
	sessionMutex.Lock()
	sessionStates[chatID] = &SessionState{
		ChatID:          chatID,
		WaitingForInput: "visitor_reject_reason",
		Data: map[string]interface{}{
			"visitor_id": visitorID,
		},
	}
	sessionMutex.Unlock()

	msg := tgbotapi.NewMessage(chatID, fmt.Sprintf("❌ **رد ویزیتور %s**\n\nلطفا دلیل رد را وارد کنید:", visitor.FullName))
	msg.ParseMode = "Markdown"
	s.bot.Send(msg)
}

func (s *TelegramService) handleVisitorReject(chatID int64, visitorID uint, reason string) {
	// Get visitor
	var visitor models.Visitor
	err := s.db.Preload("User").Where("id = ?", visitorID).First(&visitor).Error
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ ویزیتور یافت نشد")
		s.bot.Send(msg)
		return
	}

	// Update status to rejected with reason
	err = s.db.Model(&visitor).Updates(map[string]interface{}{
		"status":        "rejected",
		"reject_reason": reason,
	}).Error
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ خطا در رد ویزیتور")
		s.bot.Send(msg)
		return
	}

	// Send success message
	successMsg := fmt.Sprintf("❌ **ویزیتور رد شد**\n\n"+
		"👤 **نام:** %s\n"+
		"📱 **موبایل:** %s\n"+
		"📧 **ایمیل:** %s\n"+
		"📝 **دلیل رد:** %s\n\n"+
		"ویزیتور مطلع شده است.", visitor.FullName, visitor.Mobile, visitor.User.Email, reason)

	msg := tgbotapi.NewMessage(chatID, successMsg)
	msg.ParseMode = "Markdown"
	s.bot.Send(msg)

	// Show updated visitors list
	s.showVisitorsList(chatID, "pending", 1)
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
				tgbotapi.NewKeyboardButton(fmt.Sprintf("/approve%d", supplier.ID)),
				tgbotapi.NewKeyboardButton(fmt.Sprintf("/reject%d", supplier.ID)),
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

// Research Products Management Functions

func (s *TelegramService) showResearchProductsMenu(chatID int64) {
	keyboard := tgbotapi.NewReplyKeyboard(
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_ADD_RESEARCH_PRODUCT),
			tgbotapi.NewKeyboardButton(MENU_LIST_RESEARCH_PRODUCTS),
		),
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_RESEARCH_PRODUCT_STATS),
			tgbotapi.NewKeyboardButton(MENU_BACK),
		),
	)

	msg := tgbotapi.NewMessage(chatID,
		"🔬 **مدیریت محصولات تحقیقی**\n\n"+
			"با استفاده از این بخش می‌توانید:\n\n"+
			"➕ **اضافه کردن محصول**: افزودن محصول جدید به لیست\n"+
			"📋 **لیست محصولات**: مشاهده و مدیریت محصولات موجود\n"+
			"📊 **آمار محصولات**: نمایش آمار کلی محصولات\n\n"+
			"لطفا گزینه مورد نظر خود را انتخاب کنید:")

	msg.ParseMode = "Markdown"
	msg.ReplyMarkup = keyboard
	s.bot.Send(msg)
}

func (s *TelegramService) promptAddResearchProduct(chatID int64) {
	// Set session state for product creation
	sessionMutex.Lock()
	sessionStates[chatID] = &SessionState{
		ChatID:          chatID,
		WaitingForInput: "research_product_name",
		Data: map[string]interface{}{
			"step": "name",
		},
	}
	sessionMutex.Unlock()

	msg := tgbotapi.NewMessage(chatID,
		"🔬 **افزودن محصول تحقیقی جدید**\n\n"+
			"لطفا نام محصول را وارد کنید:\n\n"+
			"*مثال:* زعفران سرگل، خرما مجول، فرش دستباف")

	msg.ParseMode = "Markdown"
	s.bot.Send(msg)
}

func (s *TelegramService) showResearchProductsList(chatID int64) {
	products, err := models.GetActiveResearchProducts()
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ خطا در دریافت لیست محصولات")
		s.bot.Send(msg)
		return
	}

	if len(products) == 0 {
		msg := tgbotapi.NewMessage(chatID, "📋 **لیست محصولات تحقیقی**\n\nهنوز محصولی اضافه نشده است.")
		msg.ParseMode = "Markdown"
		s.bot.Send(msg)
		return
	}

	text := "📋 **لیست محصولات تحقیقی**\n\n"
	text += fmt.Sprintf("📊 **آمار:** %d محصول\n\n", len(products))

	for i, product := range products {
		if i >= 10 { // Limit to 10 products per message
			text += "...\n\n💡 *برای مشاهده محصولات بیشتر از /products استفاده کنید*"
			break
		}

		marketDemandEmoji := "📊"
		switch product.MarketDemand {
		case "high":
			marketDemandEmoji = "🔥"
		case "medium":
			marketDemandEmoji = "📈"
		case "low":
			marketDemandEmoji = "📉"
		}

		text += fmt.Sprintf("%d. **%s**\n", i+1, product.Name)
		text += fmt.Sprintf("🏷️ دسته: %s\n", product.Category)
		if product.ExportValue != "" {
			text += fmt.Sprintf("💰 صادرات: %s\n", product.ExportValue)
		}
		text += fmt.Sprintf("%s تقاضا: %s\n", marketDemandEmoji, product.MarketDemand)
		text += fmt.Sprintf("📅 ثبت: %s\n", product.CreatedAt.Format("2006/01/02"))
		text += "➖➖➖➖➖➖➖➖\n"
	}

	msg := tgbotapi.NewMessage(chatID, text)
	msg.ParseMode = "Markdown"
	s.bot.Send(msg)
}

func (s *TelegramService) showResearchProductsStats(chatID int64) {
	var total int64
	s.db.Model(&models.ResearchProduct{}).Where("status = ?", "active").Count(&total)

	var categories []string
	s.db.Model(&models.ResearchProduct{}).
		Distinct("category").
		Where("status = ?", "active").
		Pluck("category", &categories)

	var highDemand, mediumDemand, lowDemand int64
	s.db.Model(&models.ResearchProduct{}).Where("market_demand = ? AND status = ?", "high", "active").Count(&highDemand)
	s.db.Model(&models.ResearchProduct{}).Where("market_demand = ? AND status = ?", "medium", "active").Count(&mediumDemand)
	s.db.Model(&models.ResearchProduct{}).Where("market_demand = ? AND status = ?", "low", "active").Count(&lowDemand)

	// Get latest product
	var latestProduct models.ResearchProduct
	err := s.db.Where("status = ?", "active").Order("created_at DESC").First(&latestProduct).Error

	latestProductName := "هیچ کدام"
	latestProductDate := "---"
	if err == nil {
		latestProductName = latestProduct.Name
		latestProductDate = latestProduct.CreatedAt.Format("2006/01/02")
	}

	text := fmt.Sprintf(
		"📊 **آمار محصولات تحقیقی**\n\n"+
			"📈 **آمار کلی:**\n"+
			"• تعداد کل محصولات: `%d`\n"+
			"• تعداد دسته‌بندی‌ها: `%d`\n\n"+
			"🔥 **تقاضای بازار:**\n"+
			"• تقاضای بالا: `%d` محصول (%.1f%%)\n"+
			"• تقاضای متوسط: `%d` محصول (%.1f%%)\n"+
			"• تقاضای پایین: `%d` محصول (%.1f%%)\n\n"+
			"📦 **آخرین محصول:**\n"+
			"• نام: **%s**\n"+
			"• تاریخ افزودن: `%s`\n\n"+
			"🏷️ **دسته‌بندی‌ها:** %s",
		total,
		len(categories),
		highDemand, getSafePercentage(highDemand, total),
		mediumDemand, getSafePercentage(mediumDemand, total),
		lowDemand, getSafePercentage(lowDemand, total),
		latestProductName,
		latestProductDate,
		strings.Join(categories, "، "),
	)

	msg := tgbotapi.NewMessage(chatID, text)
	msg.ParseMode = "Markdown"
	s.bot.Send(msg)
}

func (s *TelegramService) handleResearchProductCreation(chatID int64, text, step string) {
	sessionMutex.RLock()
	state := sessionStates[chatID]
	sessionMutex.RUnlock()

	if state == nil {
		msg := tgbotapi.NewMessage(chatID, "❌ خطا در فرآیند ایجاد محصول - session نامعتبر")
		s.bot.Send(msg)
		log.Printf("Research product creation failed: no session state for chatID %d, step %s", chatID, step)
		return
	}

	log.Printf("Research product creation: chatID %d, step %s, text %s", chatID, step, text)

	switch step {
	case "name":
		// Store product name and ask for category
		sessionMutex.Lock()
		state.Data["name"] = text
		state.Data["step"] = "category"
		state.WaitingForInput = "research_product_category"
		sessionMutex.Unlock()

		msg := tgbotapi.NewMessage(chatID,
			"✅ نام محصول ثبت شد: **"+text+"**\n\n"+
				"حالا دسته‌بندی محصول را وارد کنید:\n\n"+
				"*مثال:* کشاورزی، صنایع دستی، مواد غذایی، نساجی، معدن")
		msg.ParseMode = "Markdown"
		s.bot.Send(msg)

	case "category":
		// Store category and ask for description
		sessionMutex.Lock()
		state.Data["category"] = text
		state.Data["step"] = "description"
		state.WaitingForInput = "research_product_description"
		sessionMutex.Unlock()

		msg := tgbotapi.NewMessage(chatID,
			"✅ دسته‌بندی ثبت شد: **"+text+"**\n\n"+
				"توضیحات محصول را وارد کنید:\n\n"+
				"*مثال:* زعفران درجه یک صادراتی با کیفیت بالا مناسب برای صادرات")
		msg.ParseMode = "Markdown"
		s.bot.Send(msg)

	case "description":
		// Store description and ask for target country
		sessionMutex.Lock()
		state.Data["description"] = text
		state.Data["step"] = "target_country"
		state.WaitingForInput = "research_product_target_country"
		sessionMutex.Unlock()

		keyboard := tgbotapi.NewInlineKeyboardMarkup(
			tgbotapi.NewInlineKeyboardRow(
				tgbotapi.NewInlineKeyboardButtonData("🇦🇪 امارات", "country_UAE"),
				tgbotapi.NewInlineKeyboardButtonData("🇸🇦 عربستان", "country_Saudi"),
			),
			tgbotapi.NewInlineKeyboardRow(
				tgbotapi.NewInlineKeyboardButtonData("🇰🇼 کویت", "country_Kuwait"),
				tgbotapi.NewInlineKeyboardButtonData("🇶🇦 قطر", "country_Qatar"),
			),
			tgbotapi.NewInlineKeyboardRow(
				tgbotapi.NewInlineKeyboardButtonData("🇧🇭 بحرین", "country_Bahrain"),
				tgbotapi.NewInlineKeyboardButtonData("🇴🇲 عمان", "country_Oman"),
			),
		)

		msg := tgbotapi.NewMessage(chatID,
			"✅ توضیحات ثبت شد\n\n"+
				"کشور هدف اصلی برای صادرات این محصول کدام است؟")
		msg.ReplyMarkup = keyboard
		s.bot.Send(msg)

	case "target_country":
		// Store target country and ask for Iran purchase price
		sessionMutex.Lock()
		state.Data["target_country"] = text
		state.Data["step"] = "iran_price"
		state.WaitingForInput = "research_product_iran_price"
		sessionMutex.Unlock()

		msg := tgbotapi.NewMessage(chatID,
			"✅ کشور هدف ثبت شد: **"+text+"**\n\n"+
				"قیمت خرید از ایران را وارد کنید (بدون واحد پول):\n\n"+
				"*مثال:* 1500")
		msg.ParseMode = "Markdown"
		s.bot.Send(msg)

	case "iran_price":
		// Validate price is a number
		if _, err := strconv.ParseFloat(text, 64); err != nil {
			msg := tgbotapi.NewMessage(chatID,
				"❌ لطفا قیمت را به صورت عدد وارد کنید\n\n"+
					"*مثال:* 1500")
			msg.ParseMode = "Markdown"
			s.bot.Send(msg)
			return
		}

		// Store Iran price and ask for target country price
		sessionMutex.Lock()
		state.Data["iran_price"] = text
		state.Data["step"] = "target_price"
		state.WaitingForInput = "research_product_target_price"
		sessionMutex.Unlock()

		msg := tgbotapi.NewMessage(chatID,
			"✅ قیمت خرید از ایران ثبت شد: **"+text+"**\n\n"+
				"قیمت فروش در کشور هدف را وارد کنید (بدون واحد پول):\n\n"+
				"*مثال:* 2200")
		msg.ParseMode = "Markdown"
		s.bot.Send(msg)

	case "target_price":
		// Validate price is a number
		if _, err := strconv.ParseFloat(text, 64); err != nil {
			msg := tgbotapi.NewMessage(chatID,
				"❌ لطفا قیمت را به صورت عدد وارد کنید\n\n"+
					"*مثال:* 2200")
			msg.ParseMode = "Markdown"
			s.bot.Send(msg)
			return
		}

		// Store target price and ask for currency
		sessionMutex.Lock()
		state.Data["target_price"] = text
		state.Data["step"] = "currency"
		state.WaitingForInput = "research_product_currency"
		sessionMutex.Unlock()

		keyboard := tgbotapi.NewInlineKeyboardMarkup(
			tgbotapi.NewInlineKeyboardRow(
				tgbotapi.NewInlineKeyboardButtonData("💵 USD", "currency_USD"),
				tgbotapi.NewInlineKeyboardButtonData("💶 EUR", "currency_EUR"),
			),
			tgbotapi.NewInlineKeyboardRow(
				tgbotapi.NewInlineKeyboardButtonData("💴 AED", "currency_AED"),
				tgbotapi.NewInlineKeyboardButtonData("💷 SAR", "currency_SAR"),
			),
		)

		msg := tgbotapi.NewMessage(chatID,
			"✅ قیمت فروش در کشور هدف ثبت شد: **"+text+"**\n\n"+
				"واحد پول قیمت‌ها را انتخاب کنید:")
		msg.ParseMode = "Markdown"
		msg.ReplyMarkup = keyboard
		s.bot.Send(msg)

	case "currency":
		// Store currency and ask for market demand
		sessionMutex.Lock()
		state.Data["currency"] = text
		state.Data["step"] = "market_demand"
		state.WaitingForInput = "research_product_market_demand"
		sessionMutex.Unlock()

		keyboard := tgbotapi.NewInlineKeyboardMarkup(
			tgbotapi.NewInlineKeyboardRow(
				tgbotapi.NewInlineKeyboardButtonData("🔥 بالا", "demand_high"),
				tgbotapi.NewInlineKeyboardButtonData("📈 متوسط", "demand_medium"),
				tgbotapi.NewInlineKeyboardButtonData("📉 پایین", "demand_low"),
			),
		)

		msg := tgbotapi.NewMessage(chatID,
			"✅ واحد پول ثبت شد: **"+text+"**\n\n"+
				"تقاضای بازار برای این محصول چگونه است؟")
		msg.ParseMode = "Markdown"
		msg.ReplyMarkup = keyboard
		s.bot.Send(msg)

	case "market_demand":
		// Create the product
		name := state.Data["name"].(string)
		category := state.Data["category"].(string)
		description := state.Data["description"].(string)
		targetCountry := state.Data["target_country"].(string)
		iranPrice := state.Data["iran_price"].(string)
		targetPrice := state.Data["target_price"].(string)
		currency := state.Data["currency"].(string)

		// Get admin ID (assuming first admin for simplicity)
		var adminID uint = 1 // This should be the actual admin ID

		productReq := models.ResearchProductRequest{
			Name:               name,
			Category:           category,
			Description:        description,
			TargetCountry:      targetCountry,
			IranPurchasePrice:  iranPrice,
			TargetCountryPrice: targetPrice,
			PriceCurrency:      currency,
			MarketDemand:       text,
			Priority:           0,
		}

		product, err := models.CreateResearchProduct(productReq, adminID)
		if err != nil {
			msg := tgbotapi.NewMessage(chatID, "❌ خطا در ایجاد محصول: "+err.Error())
			s.bot.Send(msg)
		} else {
			successMsg := fmt.Sprintf(
				"✅ **محصول تحقیقی با موفقیت اضافه شد!**\n\n"+
					"📦 **نام:** %s\n"+
					"🏷️ **دسته:** %s\n"+
					"📝 **توضیحات:** %s\n"+
					"🌍 **کشور هدف:** %s\n"+
					"💰 **قیمت خرید ایران:** %s %s\n"+
					"💰 **قیمت فروش هدف:** %s %s\n"+
					"📈 **حاشیه سود:** %s\n"+
					"🔥 **تقاضای بازار:** %s\n"+
					"🆔 **شناسه:** #%d",
				product.Name,
				product.Category,
				product.Description,
				product.TargetCountry,
				product.IranPurchasePrice,
				product.PriceCurrency,
				product.TargetCountryPrice,
				product.PriceCurrency,
				product.ProfitMargin,
				product.MarketDemand,
				product.ID,
			)

			msg := tgbotapi.NewMessage(chatID, successMsg)
			msg.ParseMode = "Markdown"
			s.bot.Send(msg)
		}

		// Clear session state
		sessionMutex.Lock()
		delete(sessionStates, chatID)
		sessionMutex.Unlock()

		// Return to research products menu
		s.showResearchProductsMenu(chatID)
	}
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

func (s *TelegramService) handleGenerateLicenses(chatID int64, count int, licenseType string, adminTelegramID int64) {
	// Find or create admin user for telegram bot
	adminID, err := s.findOrCreateAdminUser(adminTelegramID)
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, fmt.Sprintf("❌ خطا در یافتن ادمین: %v", err))
		s.bot.Send(msg)
		return
	}

	licenses, err := models.GenerateLicenses(s.db, count, licenseType, adminID)
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, fmt.Sprintf("❌ خطا در تولید لایسنس‌ها: %v", err))
		s.bot.Send(msg)
		return
	}

	// Send success message
	licenseTypeName := "پلاس"
	duration := "12 ماه"
	if licenseType == "pro" {
		licenseTypeName = "پرو"
		duration = "30 ماه"
	}

	successMsg := fmt.Sprintf("✅ **%d لایسنس %s (%s) با موفقیت تولید شد!**\n\n", count, licenseTypeName, duration)
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

	// Get license statistics
	var proTotal, plusTotal, proUsed, plusUsed int64
	s.db.Model(&models.License{}).Where("type = ?", "pro").Count(&proTotal)
	s.db.Model(&models.License{}).Where("type = ?", "plus").Count(&plusTotal)
	s.db.Model(&models.License{}).Where("type = ? AND is_used = ?", "pro", true).Count(&proUsed)
	s.db.Model(&models.License{}).Where("type = ? AND is_used = ?", "plus", true).Count(&plusUsed)

	// Create header message
	var headerBuilder strings.Builder
	headerBuilder.WriteString(fmt.Sprintf("📋 **لیست لایسنس‌ها** (صفحه %d)\n\n", page))
	headerBuilder.WriteString(fmt.Sprintf("📊 تعداد کل: %d\n\n", total))
	headerBuilder.WriteString("📈 **آمار بر اساس نوع:**\n")
	headerBuilder.WriteString(fmt.Sprintf("💎 پرو (30 ماه): %d کل (%d استفاده شده)\n", proTotal, proUsed))
	headerBuilder.WriteString(fmt.Sprintf("🔑 پلاس (12 ماه): %d کل (%d استفاده شده)\n\n", plusTotal, plusUsed))

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

		licenseTypeText := "🔑 پلاس (12 ماه)"
		if license.Type == "pro" {
			licenseTypeText = "💎 پرو (30 ماه)"
		}

		message := fmt.Sprintf("🔑 **لایسنس #%d**\n\n"+
			"`%s`\n\n"+
			"🏷 نوع: %s\n"+
			"📊 وضعیت: %s\n"+
			"%s\n"+
			"%s\n"+
			"📅 تاریخ تولید: %s",
			offset+i+1,
			license.Code,
			licenseTypeText,
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

// Visitor Management Methods

func (s *TelegramService) showVisitorMenu(chatID int64) {
	keyboard := tgbotapi.NewReplyKeyboard(
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_PENDING_VISITORS),
			tgbotapi.NewKeyboardButton(MENU_VISITOR_STATS),
		),
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_APPROVED_VISITORS),
			tgbotapi.NewKeyboardButton(MENU_REJECTED_VISITORS),
		),
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_ALL_VISITORS),
			tgbotapi.NewKeyboardButton(MENU_BACK),
		),
	)

	msg := tgbotapi.NewMessage(chatID,
		"🚶‍♂️ **مدیریت ویزیتورها**\n\n"+
			"لطفا گزینه مورد نظر خود را انتخاب کنید:\n\n"+
			"⏳ **در انتظار**: ویزیتورهای منتظر بررسی\n"+
			"✅ **تأیید شده**: ویزیتورهای فعال\n"+
			"❌ **رد شده**: ویزیتورهای رد شده\n"+
			"📋 **همه**: تمام ویزیتورها\n"+
			"📊 **آمار**: آمار کلی ویزیتورها")

	msg.ParseMode = "Markdown"
	msg.ReplyMarkup = keyboard
	s.bot.Send(msg)
}

func (s *TelegramService) showVisitorsList(chatID int64, status string, page int) {
	const perPage = 5

	visitors, total, err := models.GetVisitorsForAdmin(s.db, status, page, perPage)
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ خطا در دریافت لیست ویزیتورها")
		s.bot.Send(msg)
		return
	}

	// Build header with filter info
	var filterName string
	switch status {
	case "pending":
		filterName = "⏳ ویزیتورهای در انتظار"
	case "approved":
		filterName = "✅ ویزیتورهای تأیید شده"
	case "rejected":
		filterName = "❌ ویزیتورهای رد شده"
	default:
		filterName = "📋 همه ویزیتورها"
	}

	// Calculate pagination info
	totalPages := (int(total) + perPage - 1) / perPage
	startItem := (page-1)*perPage + 1
	endItem := startItem + len(visitors) - 1

	// Build message
	var message strings.Builder
	message.WriteString(fmt.Sprintf("**%s**\n\n", filterName))
	message.WriteString(fmt.Sprintf("📊 **آمار**: %d ویزیتور | صفحه %d از %d\n", total, page, totalPages))
	message.WriteString(fmt.Sprintf("👀 **نمایش**: %d تا %d\n\n", startItem, endItem))

	if len(visitors) == 0 {
		message.WriteString("❌ ویزیتوری با این فیلتر یافت نشد.")
	} else {
		message.WriteString("🚶‍♂️ **لیست ویزیتورها:**\n\n")

		for i, visitor := range visitors {
			statusIcon := "⏳"
			switch visitor.Status {
			case "approved":
				statusIcon = "✅"
			case "rejected":
				statusIcon = "❌"
			}

			languageIcon := "🌐"
			switch visitor.LanguageLevel {
			case "excellent":
				languageIcon = "🌟"
			case "good":
				languageIcon = "👍"
			case "weak":
				languageIcon = "👎"
			case "none":
				languageIcon = "❌"
			}

			visitorInfo := fmt.Sprintf(
				"**%d. %s %s**\n"+
					"📧 نام: %s\n"+
					"📱 موبایل: %s\n"+
					"🏘️ شهر/استان: %s\n"+
					"✈️ مقصد: %s\n"+
					"🌐 زبان: %s %s\n"+
					"🗓️ تاریخ ثبت‌نام: %s\n"+
					"%s وضعیت: %s\n",
				startItem+i,
				statusIcon,
				visitor.FullName,
				visitor.FullName,
				visitor.Mobile,
				visitor.CityProvince,
				visitor.DestinationCities,
				languageIcon,
				visitor.LanguageLevel,
				visitor.CreatedAt.Format("2006/01/02"),
				statusIcon,
				visitor.Status,
			)

			// Add action buttons for pending visitors
			if visitor.Status == "pending" {
				visitorInfo += fmt.Sprintf(
					"🔘 عملیات: /vview%d | /vapprove%d | /vreject%d\n",
					visitor.ID, visitor.ID, visitor.ID,
				)
			}

			visitorInfo += "➖➖➖➖➖➖➖➖\n"
			message.WriteString(visitorInfo)
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

func (s *TelegramService) showVisitorStats(chatID int64) {
	var totalVisitors, pendingVisitors, approvedVisitors, rejectedVisitors int64

	// Get visitor counts
	s.db.Model(&models.Visitor{}).Count(&totalVisitors)
	s.db.Model(&models.Visitor{}).Where("status = ?", "pending").Count(&pendingVisitors)
	s.db.Model(&models.Visitor{}).Where("status = ?", "approved").Count(&approvedVisitors)
	s.db.Model(&models.Visitor{}).Where("status = ?", "rejected").Count(&rejectedVisitors)

	// Get language level statistics
	var excellentLang, goodLang, weakLang, noneLang int64
	s.db.Model(&models.Visitor{}).Where("language_level = ?", "excellent").Count(&excellentLang)
	s.db.Model(&models.Visitor{}).Where("language_level = ?", "good").Count(&goodLang)
	s.db.Model(&models.Visitor{}).Where("language_level = ?", "weak").Count(&weakLang)
	s.db.Model(&models.Visitor{}).Where("language_level = ?", "none").Count(&noneLang)

	// Get recent registrations (last 7 days)
	var recentVisitors int64
	weekAgo := time.Now().AddDate(0, 0, -7)
	s.db.Model(&models.Visitor{}).Where("created_at > ?", weekAgo).Count(&recentVisitors)

	// Get visitors with marketing experience
	var marketingExp int64
	s.db.Model(&models.Visitor{}).Where("has_marketing_experience = ?", true).Count(&marketingExp)

	// Get most recent visitor
	var lastVisitor models.Visitor
	s.db.Model(&models.Visitor{}).Order("created_at DESC").First(&lastVisitor)

	message := fmt.Sprintf(
		"🚶‍♂️ **آمار کامل ویزیتورها**\n\n"+
			"📊 **آمار کلی:**\n"+
			"• کل ویزیتورها: `%d` ویزیتور\n"+
			"• در انتظار بررسی: `%d` ویزیتور (%.1f%%)\n"+
			"• تأیید شده: `%d` ویزیتور (%.1f%%)\n"+
			"• رد شده: `%d` ویزیتور (%.1f%%)\n\n"+
			"🌐 **آمار زبان:**\n"+
			"• عالی: `%d` ویزیتور (%.1f%%)\n"+
			"• متوسط: `%d` ویزیتور (%.1f%%)\n"+
			"• ضعیف: `%d` ویزیتور (%.1f%%)\n"+
			"• بلد نیستم: `%d` ویزیتور (%.1f%%)\n\n"+
			"💼 **آمار تجربه:**\n"+
			"• تجربه بازاریابی: `%d` ویزیتور (%.1f%%)\n\n"+
			"📈 **آمار فعالیت:**\n"+
			"• ثبت‌نام های هفته اخیر: `%d` ویزیتور\n"+
			"• آخرین ثبت‌نام: **%s**\n"+
			"• تاریخ آخرین ثبت‌نام: `%s`\n\n"+
			"⚡ **عملیات سریع:**\n"+
			"• بررسی درخواست‌های جدید\n"+
			"• تأیید/رد ویزیتورها\n"+
			"• مشاهده جزئیات هر ویزیتور",
		totalVisitors,
		pendingVisitors, getSafePercentage(pendingVisitors, totalVisitors),
		approvedVisitors, getSafePercentage(approvedVisitors, totalVisitors),
		rejectedVisitors, getSafePercentage(rejectedVisitors, totalVisitors),
		excellentLang, getSafePercentage(excellentLang, totalVisitors),
		goodLang, getSafePercentage(goodLang, totalVisitors),
		weakLang, getSafePercentage(weakLang, totalVisitors),
		noneLang, getSafePercentage(noneLang, totalVisitors),
		marketingExp, getSafePercentage(marketingExp, totalVisitors),
		recentVisitors,
		lastVisitor.FullName,
		lastVisitor.CreatedAt.Format("2006/01/02 15:04"),
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
