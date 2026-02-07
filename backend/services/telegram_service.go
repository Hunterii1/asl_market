package services

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"

	"asl-market-backend/models"
	"asl-market-backend/utils"

	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"
	"github.com/xuri/excelize/v2"
	"gorm.io/gorm"
)

// Define admin IDs as a slice
var ADMIN_IDS = []int64{76599340, 276043481, 110435852}

// Define support-only admin IDs (limited access to support tickets only)
var SUPPORT_ADMIN_IDS = []int64{8095823308}

const ASL_PLATFORM_LICENSE = "ASL-PLATFORM-2024"

// Helper function to check if a user is admin (checks both static list and database)
func isAdmin(userID int64) bool {
	// First check static list
	for _, adminID := range ADMIN_IDS {
		if userID == adminID {
			return true
		}
	}

	// Then check database
	if models.CheckIfAdmin(models.GetDB(), userID, true) {
		return true
	}

	return false
}

// Helper function to check if a user is support admin (checks both static list and database)
func isSupportAdmin(userID int64) bool {
	// First check static list
	for _, supportAdminID := range SUPPORT_ADMIN_IDS {
		if userID == supportAdminID {
			return true
		}
	}

	// Then check database for support admins
	if models.CheckIfAdmin(models.GetDB(), userID, false) {
		// Make sure it's not a full admin
		var admin models.TelegramAdmin
		if err := models.GetDB().Where("telegram_id = ? AND is_active = ? AND is_full_admin = ?", userID, true, false).First(&admin).Error; err == nil {
			return true
		}
	}

	return false
}

// Helper function to check if a user has any admin access (full or support)
func hasAdminAccess(userID int64) bool {
	return isAdmin(userID) || isSupportAdmin(userID)
}

// Menu constants
const (
	MENU_USERS         = "👥 مدیریت کاربران"
	MENU_STATS         = "📊 آمار سیستم"
	MENU_SEARCH        = "🔍 جستجوی کاربر"
	MENU_LICENSES      = "🔑 مدیریت لایسنس"
	MENU_WITHDRAWALS   = "💰 مدیریت برداشت‌ها"
	MENU_TRAINING      = "🎓 مدیریت آموزش"
	MENU_GENERATE      = "➕ تولید لایسنس"
	MENU_LIST_LICENSES = "📋 لیست لایسنس‌ها"
	MENU_SETTINGS      = "⚙️ تنظیمات"
	MENU_NOTIFICATIONS = "🔔 مدیریت نوتیفیکیشن‌ها"

	// Notification management sub-menus
	MENU_SEND_NOTIFICATION    = "📤 ارسال نوتیفیکیشن"
	MENU_NOTIFICATION_HISTORY = "📋 تاریخچه نوتیفیکیشن‌ها"
	MENU_NOTIFICATION_STATS   = "📊 آمار نوتیفیکیشن‌ها"

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
	MENU_APPROVE_SUPPLIER   = "✅ تأیید"
	MENU_REJECT_SUPPLIER    = "❌ رد"
	MENU_EDIT_SUPPLIER      = "✏️ ویرایش"
	MENU_DELETE_SUPPLIER    = "🗑️ حذف"
	MENU_VIEW_SUPPLIER      = "👁️ جزئیات"
	MENU_FEATURE_SUPPLIER   = "⭐ برگزیده"
	MENU_UNFEATURE_SUPPLIER = "⭐ حذف برگزیده"
	MENU_FEATURED_SUPPLIERS = "⭐ تأمین‌کنندگان برگزیده"
	MENU_SEARCH_SUPPLIER    = "🔍 جستجوی تأمین‌کننده"

	// Visitor management sub-menus
	MENU_VISITORS          = "🚶‍♂️ مدیریت ویزیتورها"
	MENU_PENDING_VISITORS  = "⏳ ویزیتورهای در انتظار"
	MENU_APPROVED_VISITORS = "✅ ویزیتورهای تأیید شده"
	MENU_REJECTED_VISITORS = "❌ ویزیتورهای رد شده"
	MENU_ALL_VISITORS      = "📋 همه ویزیتورها"
	MENU_VISITOR_STATS     = "📊 آمار ویزیتورها"
	MENU_FEATURE_VISITOR   = "⭐ برگزیده"
	MENU_UNFEATURE_VISITOR = "⭐ حذف برگزیده"
	MENU_FEATURED_VISITORS = "⭐ ویزیتورهای برگزیده"
	MENU_SEARCH_VISITOR    = "🔍 جستجوی ویزیتور"

	// Withdrawal management
	MENU_WITHDRAWALS_PENDING    = "⏳ درخواست‌های در انتظار"
	MENU_WITHDRAWALS_APPROVED   = "✅ درخواست‌های تایید شده"
	MENU_WITHDRAWALS_PROCESSING = "🔄 درخواست‌های در حال پردازش"
	MENU_WITHDRAWALS_COMPLETED  = "✅ درخواست‌های تکمیل شده"
	MENU_WITHDRAWALS_REJECTED   = "❌ درخواست‌های رد شده"
	MENU_WITHDRAWALS_ALL        = "📋 همه درخواست‌ها"
	MENU_WITHDRAWALS_STATS      = "📊 آمار برداشت‌ها"

	// Research products management sub-menus
	MENU_RESEARCH_PRODUCTS       = "🔬 مدیریت محصولات تحقیقی"
	MENU_ADD_RESEARCH_PRODUCT    = "➕ اضافه کردن محصول"
	MENU_LIST_RESEARCH_PRODUCTS  = "📋 لیست محصولات"
	MENU_RESEARCH_PRODUCT_STATS  = "📊 آمار محصولات"
	MENU_EDIT_RESEARCH_PRODUCT   = "✏️ ویرایش محصول"
	MENU_DELETE_RESEARCH_PRODUCT = "🗑️ حذف محصول"

	// Marketing popup management sub-menus
	MENU_MARKETING_POPUPS        = "📢 مدیریت پاپ‌اپ تبلیغاتی"
	MENU_ADD_MARKETING_POPUP     = "➕ اضافه کردن پاپ‌اپ"
	MENU_LIST_MARKETING_POPUPS   = "📋 لیست پاپ‌اپ‌ها"
	MENU_ACTIVE_MARKETING_POPUPS = "✅ پاپ‌اپ‌های فعال"
	MENU_MARKETING_POPUP_STATS   = "📊 آمار پاپ‌اپ‌ها"

	// Support ticket management sub-menus
	MENU_SUPPORT_TICKETS     = "🎫 مدیریت تیکت‌های پشتیبانی"
	MENU_OPEN_TICKETS        = "📬 تیکت‌های باز"
	MENU_IN_PROGRESS_TICKETS = "🔄 تیکت‌های در حال بررسی"
	MENU_WAITING_TICKETS     = "⏳ منتظر پاسخ کاربر"
	MENU_CLOSED_TICKETS      = "✅ تیکت‌های بسته شده"
	MENU_ALL_TICKETS         = "📋 همه تیکت‌ها"
	MENU_TICKET_STATS        = "📊 آمار تیکت‌ها"

	// Available products management sub-menus
	MENU_AVAILABLE_PRODUCTS       = "📦 مدیریت کالاهای موجود"
	MENU_ADD_AVAILABLE_PRODUCT    = "➕ اضافه کردن کالا"
	MENU_LIST_AVAILABLE_PRODUCTS  = "📋 لیست کالاها"
	MENU_AVAILABLE_PRODUCT_STATS  = "📊 آمار کالاها"
	MENU_EDIT_AVAILABLE_PRODUCT   = "✏️ ویرایش کالا"
	MENU_DELETE_AVAILABLE_PRODUCT = "🗑️ حذف کالا"
	MENU_SEARCH_AVAILABLE_PRODUCT = "🔍 جستجوی کالا"

	// Visitor action buttons
	MENU_APPROVE_VISITOR = "✅ تأیید"
	MENU_REJECT_VISITOR  = "❌ رد"
	MENU_EDIT_VISITOR    = "✏️ ویرایش"
	MENU_DELETE_VISITOR  = "🗑️ حذف"
	MENU_VIEW_VISITOR    = "👁️ جزئیات"

	// Admin management sub-menus
	MENU_ADMIN_MANAGEMENT  = "👑 مدیریت ادمین‌ها"
	MENU_ADD_ADMIN         = "➕ اضافه کردن ادمین"
	MENU_REMOVE_ADMIN      = "🗑️ حذف ادمین"
	MENU_LIST_ADMINS       = "📋 لیست ادمین‌ها"
	MENU_ADD_FULL_ADMIN    = "👑 اضافه کردن ادمین کل"
	MENU_ADD_SUPPORT_ADMIN = "🎫 اضافه کردن ادمین پشتیبانی"

	// Excel Export sub-menus
	MENU_EXCEL_EXPORT           = "📊 خروجی اکسل"
	MENU_EXCEL_EXPORT_SUPPLIERS = "📊 خروجی اکسل تأمین‌کننده‌ها"
	MENU_EXCEL_EXPORT_VISITORS  = "📊 خروجی اکسل ویزیتورها"
	MENU_EXCEL_EXPORT_AVAILABLE = "📊 خروجی اکسل کالاهای موجود"
	MENU_EXCEL_EXPORT_RESEARCH  = "📊 خروجی اکسل محصولات تحقیقی"
	MENU_EXCEL_EXPORT_USERS     = "📊 خروجی اکسل تمامی کاربران"

	// Navigation
	MENU_PREV_PAGE = "⬅️ صفحه قبل"
	MENU_NEXT_PAGE = "➡️ صفحه بعد"
	MENU_BACK      = "🔙 بازگشت"
)

type TelegramService struct {
	bot *tgbotapi.BotAPI
	db  *gorm.DB
}

// NotifyUpgradeRequest notifies admins about a new upgrade request
func (t *TelegramService) NotifyUpgradeRequest(request *models.UpgradeRequest, user *models.User) {
	message := fmt.Sprintf(
		"🆙 **درخواست ارتقا جدید**\n\n"+
			"👤 **کاربر:** %s\n"+
			"📧 **ایمیل:** %s\n"+
			"📱 **شماره تماس:** %s\n\n"+
			"📦 **از پلن:** %s\n"+
			"⬆️ **به پلن:** %s\n\n"+
			"📝 **یادداشت کاربر:**\n%s\n\n"+
			"🆔 **شناسه درخواست:** %d",
		user.Name(), user.Email, user.Mobile(),
		request.FromPlan, request.ToPlan,
		getDefaultIfEmpty(request.RequestNote, "بدون یادداشت"),
		request.ID,
	)

	// Create inline keyboard for approval/rejection
	keyboard := tgbotapi.NewInlineKeyboardMarkup(
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("✅ تایید", fmt.Sprintf("upgrade_approve_%d", request.ID)),
			tgbotapi.NewInlineKeyboardButtonData("❌ رد", fmt.Sprintf("upgrade_reject_%d", request.ID)),
		),
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("📋 جزئیات", fmt.Sprintf("upgrade_details_%d", request.ID)),
		),
	)

	// Send to all admins
	for _, adminID := range ADMIN_IDS {
		msg := tgbotapi.NewMessage(adminID, message)
		msg.ParseMode = "Markdown"
		msg.ReplyMarkup = keyboard
		t.bot.Send(msg)
	}
}

// NotifyUpgradeResult notifies user about upgrade request result
func (t *TelegramService) NotifyUpgradeResult(userID uint, approved bool, adminNote string) {
	// Get user's telegram chat ID (if available)
	user, err := models.GetUserByID(models.DB, userID)
	if err != nil {
		log.Printf("Failed to get user for upgrade notification: %v", err)
		return
	}

	// For now, we'll send to admins to manually inform the user
	// In the future, you could implement a way to link user accounts to telegram chat IDs
	var status string
	var emoji string
	if approved {
		status = "تایید شد"
		emoji = "✅"
	} else {
		status = "رد شد"
		emoji = "❌"
	}

	message := fmt.Sprintf(
		"%s **نتیجه درخواست ارتقا**\n\n"+
			"👤 **کاربر:** %s (%s)\n"+
			"📧 **ایمیل:** %s\n\n"+
			"📊 **وضعیت:** %s\n\n"+
			"📝 **یادداشت ادمین:**\n%s\n\n"+
			"💡 **اقدام لازم:** لطفاً با کاربر تماس بگیرید و نتیجه را اطلاع دهید.",
		emoji, user.Name(), user.Mobile(), user.Email,
		status,
		getDefaultIfEmpty(adminNote, "بدون یادداشت"),
	)

	// Send to all admins
	for _, adminID := range ADMIN_IDS {
		msg := tgbotapi.NewMessage(adminID, message)
		msg.ParseMode = "Markdown"
		t.bot.Send(msg)
	}
}

// Support Ticket Notifications
func (t *TelegramService) NotifyNewSupportTicket(ticket *models.SupportTicket, user *models.User) {
	// Skip notification if ticket ID is 0 (dummy ticket for supplier/visitor registration)
	if ticket.ID == 0 {
		return
	}

	priorityEmoji := map[string]string{
		"low":    "🟢",
		"medium": "🟡",
		"high":   "🟠",
		"urgent": "🔴",
	}

	categoryEmoji := map[string]string{
		"general":   "📝",
		"technical": "🔧",
		"billing":   "💰",
		"license":   "🔑",
		"other":     "❓",
	}

	message := fmt.Sprintf(
		"🎫 **تیکت پشتیبانی جدید**\n\n"+
			"📋 **شناسه تیکت:** #%d\n"+
			"👤 **کاربر:** %s (%s)\n"+
			"📧 **ایمیل:** %s\n"+
			"📱 **موبایل:** %s\n\n"+
			"📝 **عنوان:** %s\n"+
			"📄 **توضیحات:** %s\n\n"+
			"%s **اولویت:** %s\n"+
			"%s **دسته‌بندی:** %s\n\n"+
			"🔗 **لینک تیکت:** /view_ticket_%d\n\n"+
			"💡 **اقدام لازم:** لطفاً به تیکت پاسخ دهید.",
		ticket.ID,
		user.Name(), user.Mobile(),
		user.Email,
		user.Phone,
		ticket.Title,
		truncateText(ticket.Description, 200),
		priorityEmoji[ticket.Priority], strings.Title(ticket.Priority),
		categoryEmoji[ticket.Category], strings.Title(ticket.Category),
		ticket.ID,
	)

	// Send to all admins (full admins + support admins from static and database)
	allAdminIDs := t.getAllAdminIDsForTickets()
	for _, adminID := range allAdminIDs {
		msg := tgbotapi.NewMessage(adminID, message)
		msg.ParseMode = "Markdown"
		if _, err := t.bot.Send(msg); err != nil {
			log.Printf("ERROR: Failed to send new support ticket notification to admin %d: %v", adminID, err)
		}
	}
}

// NotifyAdminPlainMessage sends a simple text message to all full admins.
// Useful for system-level notifications that are not tied to a specific ticket.
func (t *TelegramService) NotifyAdminPlainMessage(message string) {
	for _, adminID := range ADMIN_IDS {
		msg := tgbotapi.NewMessage(adminID, message)
		if _, err := t.bot.Send(msg); err != nil {
			log.Printf("ERROR: Failed to send plain admin message to %d: %v", adminID, err)
		}
	}
}

func (t *TelegramService) NotifyTicketMessage(ticket *models.SupportTicket, user *models.User, message *models.SupportTicketMessage) {
	// Only notify for user messages (not admin messages)
	if message.IsAdmin {
		return
	}

	messageText := fmt.Sprintf(
		"💬 **پیام جدید از کاربر**\n\n"+
			"📋 **تیکت #%d:** %s\n"+
			"👤 **کاربر:** %s %s (%s)\n"+
			"📧 **ایمیل:** %s\n"+
			"🎯 **دسته:** %s | **اولویت:** %s\n"+
			"📊 **وضعیت:** %s\n\n"+
			"💬 **پیام جدید:**\n%s\n\n"+
			"🔗 **دستورات:** /view_ticket_%d /respond_ticket_%d",
		ticket.ID, ticket.Title,
		user.FirstName, user.LastName, user.Phone,
		user.Email,
		ticket.Category, ticket.Priority,
		ticket.Status,
		truncateText(message.Message, 250),
		ticket.ID, ticket.ID,
	)

	// Send to all admins (full admins + support admins from static and database)
	allAdminIDs := t.getAllAdminIDsForTickets()
	for _, adminID := range allAdminIDs {
		msg := tgbotapi.NewMessage(adminID, messageText)
		msg.ParseMode = "Markdown"
		if _, err := t.bot.Send(msg); err != nil {
			log.Printf("ERROR: Failed to send ticket message notification to admin %d: %v", adminID, err)
		}
	}
}

// Helper function to get all admin IDs (static + database, both full and support admins)
func (t *TelegramService) getAllAdminIDsForTickets() []int64 {
	var allAdminIDs []int64

	// Add static full admins
	allAdminIDs = append(allAdminIDs, ADMIN_IDS...)

	// Add static support admins
	allAdminIDs = append(allAdminIDs, SUPPORT_ADMIN_IDS...)

	// Add full admins from database
	if dbAdmins, err := models.GetFullAdmins(t.db); err == nil {
		allAdminIDs = append(allAdminIDs, dbAdmins...)
	}

	// Add support admins from database
	if dbSupportAdmins, err := models.GetSupportAdmins(t.db); err == nil {
		allAdminIDs = append(allAdminIDs, dbSupportAdmins...)
	}

	// Remove duplicates
	seen := make(map[int64]bool)
	var uniqueIDs []int64
	for _, id := range allAdminIDs {
		if !seen[id] {
			seen[id] = true
			uniqueIDs = append(uniqueIDs, id)
		}
	}

	return uniqueIDs
}

func (t *TelegramService) NotifyNewTicket(ticket *models.SupportTicket, user *models.User) {
	messageText := fmt.Sprintf(
		"🆕 **تیکت جدید ایجاد شد**\n\n"+
			"📋 **شناسه تیکت:** #%d\n"+
			"👤 **کاربر:** %s %s (%s)\n"+
			"📧 **ایمیل:** %s\n"+
			"🎯 **دسته:** %s\n"+
			"⚡ **اولویت:** %s\n\n"+
			"📝 **عنوان:** %s\n\n"+
			"📄 **توضیحات:** %s\n\n"+
			"🔗 **دستورات:** /view_ticket_%d /respond_ticket_%d",
		ticket.ID,
		user.FirstName, user.LastName, user.Phone,
		user.Email,
		ticket.Category,
		ticket.Priority,
		ticket.Title,
		truncateText(ticket.Description, 200),
		ticket.ID, ticket.ID,
	)

	// Send to all admins (full admins + support admins from static and database)
	allAdminIDs := t.getAllAdminIDsForTickets()
	for _, adminID := range allAdminIDs {
		msg := tgbotapi.NewMessage(adminID, messageText)
		msg.ParseMode = "Markdown"
		if _, err := t.bot.Send(msg); err != nil {
			log.Printf("ERROR: Failed to send ticket notification to admin %d: %v", adminID, err)
		}
	}
}

func (t *TelegramService) NotifyTicketClosed(ticket *models.SupportTicket, user *models.User) {
	message := fmt.Sprintf(
		"🔒 **تیکت بسته شد**\n\n"+
			"📋 **شناسه تیکت:** #%d\n"+
			"👤 **کاربر:** %s (%s)\n"+
			"📝 **عنوان:** %s\n\n"+
			"✅ **وضعیت:** بسته شده توسط کاربر",
		ticket.ID,
		user.Name(), user.Mobile(),
		ticket.Title,
	)

	// Send to all admins (full admins + support admins from static and database)
	allAdminIDs := t.getAllAdminIDsForTickets()
	for _, adminID := range allAdminIDs {
		msg := tgbotapi.NewMessage(adminID, message)
		msg.ParseMode = "Markdown"
		if _, err := t.bot.Send(msg); err != nil {
			log.Printf("ERROR: Failed to send ticket closed notification to admin %d: %v", adminID, err)
		}
	}
}

func getDefaultIfEmpty(value, defaultValue string) string {
	if strings.TrimSpace(value) == "" {
		return defaultValue
	}
	return value
}

func truncateText(text string, maxLength int) string {
	if len(text) <= maxLength {
		return text
	}
	return text[:maxLength] + "..."
}

// escapeMarkdown escapes special Markdown characters
func escapeMarkdown(text string) string {
	// Characters that need to be escaped in Markdown V2: _ * [ ] ( ) ~ ` > # + - = | { } . !
	// But we're using Markdown (not V2), so we need: _ * [ ] ( ) ~ `
	escapeChars := []string{"_", "*", "[", "]", "(", ")", "~", "`"}
	result := text
	for _, char := range escapeChars {
		result = strings.ReplaceAll(result, char, "\\"+char)
	}
	return result
}

// splitLongMessage splits a message into multiple parts if it exceeds Telegram's limit (4096 chars)
func splitLongMessage(text string, maxLen int) []string {
	if len(text) <= maxLen {
		return []string{text}
	}

	var parts []string
	currentPart := ""
	lines := strings.Split(text, "\n")

	for _, line := range lines {
		// If adding this line would exceed the limit, save current part and start new
		if len(currentPart)+len(line)+1 > maxLen {
			if currentPart != "" {
				parts = append(parts, strings.TrimSpace(currentPart))
			}
			currentPart = line + "\n"
		} else {
			currentPart += line + "\n"
		}
	}

	if currentPart != "" {
		parts = append(parts, strings.TrimSpace(currentPart))
	}

	return parts
}

// Pagination structure for user management
type UserPagination struct {
	ChatID      int64
	Page        int
	PerPage     int
	FilterType  string // "all", "active", "inactive", "licensed", "unlicensed"
	SearchQuery string
}

// Pagination structure for supplier management
type SupplierPagination struct {
	ChatID  int64
	Page    int
	PerPage int
	Status  string // "pending", "approved", "rejected", "all"
}

// Pagination structure for visitor management
type VisitorPagination struct {
	ChatID  int64
	Page    int
	PerPage int
	Status  string // "pending", "approved", "rejected", "all"
}

// Pagination structure for ticket management
type TicketPagination struct {
	ChatID  int64
	Page    int
	PerPage int
	Status  string // "open", "in_progress", "waiting_response", "closed", "all"
}

// Global map to store user pagination state
var userPaginationStates = make(map[int64]*UserPagination)

// Global map to store supplier pagination state
var supplierPaginationStates = make(map[int64]*SupplierPagination)

// Global map to store visitor pagination state
var visitorPaginationStates = make(map[int64]*VisitorPagination)

// Global map to store ticket pagination state
var ticketPaginationStates = make(map[int64]*TicketPagination)
var paginationMutex = sync.RWMutex{}

// User session states
type SessionState struct {
	ChatID          int64
	WaitingForInput string                 // "license_count", "search_query", "supplier_action", "reject_reason", etc.
	State           string                 // "waiting_notification_title", "waiting_notification_message", etc.
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
			if !hasAdminAccess(update.CallbackQuery.From.ID) {
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

		// Only process messages from admins (full or support)
		if !hasAdminAccess(update.Message.From.ID) {
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
	// Check if user is support admin (limited access)
	if isSupportAdmin(chatID) {
		s.showSupportAdminMenu(chatID)
		return
	}

	// Full admin menu
	keyboard := tgbotapi.NewReplyKeyboard(
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_USERS),
			tgbotapi.NewKeyboardButton(MENU_STATS),
		),
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_LICENSES),
			tgbotapi.NewKeyboardButton(MENU_WITHDRAWALS),
		),
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_TRAINING),
			tgbotapi.NewKeyboardButton(MENU_SUPPORT_TICKETS),
		),
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_SUPPLIERS),
		),
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_VISITORS),
			tgbotapi.NewKeyboardButton(MENU_RESEARCH_PRODUCTS),
		),
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_MARKETING_POPUPS),
			tgbotapi.NewKeyboardButton(MENU_AVAILABLE_PRODUCTS),
		),
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_BULK_IMPORT),
			tgbotapi.NewKeyboardButton(MENU_SINGLE_ADD),
		),
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_SEARCH),
		),
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_NOTIFICATIONS),
		),
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_EXCEL_EXPORT),
		),
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_ADMIN_MANAGEMENT),
			tgbotapi.NewKeyboardButton(MENU_SETTINGS),
		),
	)
	keyboard.ResizeKeyboard = true

	msg := tgbotapi.NewMessage(chatID, "🎛️ به پنل مدیریت ASL Market خوش آمدید.\n\n🔑 **سیستم لایسنس جدید:**\n- لایسنس‌ها یکبار مصرف هستند\n- بعد از استفاده غیرفعال می‌شوند\n- تأیید اتوماتیک\n\nلطفا یکی از گزینه‌های زیر را انتخاب کنید:")
	msg.ParseMode = "Markdown"
	msg.ReplyMarkup = keyboard
	s.bot.Send(msg)
}

// Support admin menu (limited access - only support tickets)
func (s *TelegramService) showSupportAdminMenu(chatID int64) {
	keyboard := tgbotapi.NewReplyKeyboard(
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_SUPPORT_TICKETS),
		),
	)
	keyboard.ResizeKeyboard = true

	msg := tgbotapi.NewMessage(chatID, "🎫 **پنل مدیریت تیکت‌های پشتیبانی**\n\n"+
		"خوش آمدید! شما به عنوان ادمین پشتیبانی دسترسی محدود به مدیریت تیکت‌های پشتیبانی دارید.\n\n"+
		"✅ **دسترسی‌های شما:**\n"+
		"🎫 مشاهده و مدیریت تیکت‌های پشتیبانی\n"+
		"💬 پاسخ‌دهی به تیکت‌ها\n"+
		"📊 آمار تیکت‌ها\n\n"+
		"لطفاً گزینه مورد نظر خود را انتخاب کنید:")
	msg.ParseMode = "Markdown"
	msg.ReplyMarkup = keyboard
	s.bot.Send(msg)
}

// Handle messages for support admin (limited access)
func (s *TelegramService) handleSupportAdminMessage(message *tgbotapi.Message) {
	switch message.Text {
	case MENU_SUPPORT_TICKETS:
		s.showSupportTicketsMenu(message.Chat.ID)
	case MENU_OPEN_TICKETS:
		s.showSupportTicketsList(message.Chat.ID, "open", 1)
	case MENU_IN_PROGRESS_TICKETS:
		s.showSupportTicketsList(message.Chat.ID, "in_progress", 1)
	case MENU_WAITING_TICKETS:
		s.showSupportTicketsList(message.Chat.ID, "waiting_response", 1)
	case MENU_CLOSED_TICKETS:
		s.showSupportTicketsList(message.Chat.ID, "closed", 1)
	case MENU_ALL_TICKETS:
		s.showSupportTicketsList(message.Chat.ID, "all", 1)
	case MENU_TICKET_STATS:
		s.showSupportTicketsStats(message.Chat.ID)
	case MENU_PREV_PAGE:
		s.handlePagination(message.Chat.ID, -1)
	case MENU_NEXT_PAGE:
		s.handlePagination(message.Chat.ID, 1)
	case MENU_BACK:
		s.showSupportAdminMenu(message.Chat.ID)
	default:
		// Check for support ticket command patterns
		if s.handleSupportTicketCommands(message.Chat.ID, message.Text) {
			return
		}

		// Check if waiting for input
		sessionMutex.Lock()
		sessionState, exists := sessionStates[message.Chat.ID]
		sessionMutex.Unlock()

		if exists && sessionState.WaitingForInput != "" {
			if strings.HasPrefix(sessionState.WaitingForInput, "ticket_response_") {
				ticketID := sessionState.Data["ticket_id"].(uint)
				s.handleTicketResponse(message.Chat.ID, ticketID, message.Text)
				// Clear session state
				sessionMutex.Lock()
				delete(sessionStates, message.Chat.ID)
				sessionMutex.Unlock()
				return
			}
		}

		// Unknown command for support admin
		msg := tgbotapi.NewMessage(message.Chat.ID, "❌ دستور نامعتبر. لطفاً از منوی پشتیبانی استفاده کنید.")
		s.bot.Send(msg)
	}
}

func (s *TelegramService) handleMessage(message *tgbotapi.Message) {
	// Check if user is support admin and restrict access
	if isSupportAdmin(message.Chat.ID) {
		s.handleSupportAdminMessage(message)
		return
	}

	// Trim whitespace and normalize text
	text := strings.TrimSpace(message.Text)

	// Debug log
	fmt.Printf("Received message: '%s'\n", text)
	fmt.Printf("MENU_NOTIFICATION_HISTORY constant: '%s'\n", MENU_NOTIFICATION_HISTORY)
	fmt.Printf("Are they equal? %t\n", text == MENU_NOTIFICATION_HISTORY)

	switch text {
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
		// Clear any active session state when going back
		sessionMutex.Lock()
		delete(sessionStates, message.Chat.ID)
		sessionMutex.Unlock()
		s.showMainMenu(message.Chat.ID)
	case MENU_STATS:
		s.showStats(message.Chat.ID)
	case MENU_SEARCH:
		s.showSearchPrompt(message.Chat.ID)
	case MENU_LICENSES:
		s.showLicenseMenu(message.Chat.ID)
	case MENU_WITHDRAWALS:
		s.showWithdrawalMenu(message.Chat.ID)
	case MENU_TRAINING:
		s.showTrainingMenu(message.Chat.ID)
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
	case MENU_FEATURED_SUPPLIERS:
		s.showFeaturedSuppliersList(message.Chat.ID)
	case MENU_SEARCH_SUPPLIER:
		s.showSupplierSearchPrompt(message.Chat.ID)
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
	case MENU_FEATURED_VISITORS:
		s.showFeaturedVisitorsList(message.Chat.ID)
	case MENU_SEARCH_VISITOR:
		s.showVisitorSearchPrompt(message.Chat.ID)
	case MENU_VISITOR_STATS:
		s.showVisitorStats(message.Chat.ID)

	// Withdrawal management cases
	case MENU_WITHDRAWALS_PENDING:
		s.showWithdrawalsList(message.Chat.ID, "pending", 1)
	case MENU_WITHDRAWALS_APPROVED:
		s.showWithdrawalsList(message.Chat.ID, "approved", 1)
	case MENU_WITHDRAWALS_PROCESSING:
		s.showWithdrawalsList(message.Chat.ID, "processing", 1)
	case MENU_WITHDRAWALS_COMPLETED:
		s.showWithdrawalsList(message.Chat.ID, "completed", 1)
	case MENU_WITHDRAWALS_REJECTED:
		s.showWithdrawalsList(message.Chat.ID, "rejected", 1)
	case MENU_WITHDRAWALS_ALL:
		s.showWithdrawalsList(message.Chat.ID, "", 1)
	case MENU_WITHDRAWALS_STATS:
		s.showWithdrawalStats(message.Chat.ID)
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
	case MENU_SUPPORT_TICKETS:
		s.showSupportTicketsMenu(message.Chat.ID)
	case MENU_OPEN_TICKETS:
		s.showSupportTicketsList(message.Chat.ID, "open", 1)
	case MENU_IN_PROGRESS_TICKETS:
		s.showSupportTicketsList(message.Chat.ID, "in_progress", 1)
	case MENU_WAITING_TICKETS:
		s.showSupportTicketsList(message.Chat.ID, "waiting_response", 1)
	case MENU_CLOSED_TICKETS:
		s.showSupportTicketsList(message.Chat.ID, "closed", 1)
	case MENU_ALL_TICKETS:
		s.showSupportTicketsList(message.Chat.ID, "all", 1)
	case MENU_TICKET_STATS:
		s.showSupportTicketsStats(message.Chat.ID)
	case MENU_AVAILABLE_PRODUCTS:
		s.showAvailableProductsMenu(message.Chat.ID)
	case MENU_ADD_AVAILABLE_PRODUCT:
		s.promptAddAvailableProduct(message.Chat.ID)
	case MENU_LIST_AVAILABLE_PRODUCTS:
		s.showAvailableProductsList(message.Chat.ID)
	case MENU_SEARCH_AVAILABLE_PRODUCT:
		s.showAvailableProductSearchPrompt(message.Chat.ID)
	case MENU_AVAILABLE_PRODUCT_STATS:
		s.showAvailableProductsStats(message.Chat.ID)
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
	case MENU_LIST_LICENSES:
		s.showLicensesList(message.Chat.ID, 1)
	case MENU_NOTIFICATIONS:
		s.showNotificationMenu(message.Chat.ID)
	case MENU_SEND_NOTIFICATION:
		s.promptSendNotification(message.Chat.ID)
	case MENU_NOTIFICATION_HISTORY:
		s.showNotificationHistory(message.Chat.ID)
	case MENU_NOTIFICATION_STATS:
		s.showNotificationStats(message.Chat.ID)
	case MENU_ADMIN_MANAGEMENT:
		s.showAdminManagementMenu(message.Chat.ID)
	case MENU_ADD_ADMIN:
		s.showAddAdminTypeMenu(message.Chat.ID)
	case MENU_ADD_FULL_ADMIN:
		s.promptAddAdmin(message.Chat.ID, true)
	case MENU_ADD_SUPPORT_ADMIN:
		s.promptAddAdmin(message.Chat.ID, false)
	case MENU_LIST_ADMINS:
		s.showAdminsList(message.Chat.ID)
	case MENU_REMOVE_ADMIN:
		s.promptRemoveAdmin(message.Chat.ID)
	case MENU_SETTINGS:
		s.showMainMenu(message.Chat.ID) // Just redirect to main menu for now
	case MENU_EXCEL_EXPORT:
		s.showExcelExportMenu(message.Chat.ID)
	case MENU_EXCEL_EXPORT_SUPPLIERS:
		s.exportSuppliersToExcel(message.Chat.ID)
	case MENU_EXCEL_EXPORT_VISITORS:
		s.exportVisitorsToExcel(message.Chat.ID)
	case MENU_EXCEL_EXPORT_AVAILABLE:
		s.exportAvailableProductsToExcel(message.Chat.ID)
	case MENU_EXCEL_EXPORT_RESEARCH:
		s.exportResearchProductsToExcel(message.Chat.ID)
	case MENU_EXCEL_EXPORT_USERS:
		s.exportUsersToExcel(message.Chat.ID)
	case "🔙 بازگشت به منو اصلی":
		s.showMainMenu(message.Chat.ID)
	case "🔙 بازگشت به منو نوتیفیکیشن‌ها":
		s.showNotificationMenu(message.Chat.ID)
	default:
		// Check session state for input handling
		sessionMutex.RLock()
		state, exists := sessionStates[message.Chat.ID]
		sessionMutex.RUnlock()

		if exists {
			switch {
			case strings.HasPrefix(state.WaitingForInput, "awaiting_upgrade_approval_note_"):
				s.handleUpgradeApprovalNote(message, state)
				return
			case strings.HasPrefix(state.WaitingForInput, "awaiting_upgrade_rejection_note_"):
				s.handleUpgradeRejectionNote(message, state)
				return
			case state.State == "waiting_notification_title" || state.State == "waiting_notification_message" || state.State == "waiting_notification_priority" || state.State == "waiting_notification_user_id":
				s.handleNotificationInput(message.Chat.ID, message.Text)
				return
			case state.WaitingForInput == "withdrawal_account":
				withdrawalID := state.Data["withdrawal_id"].(string)
				accountNumber := strings.TrimSpace(message.Text)

				if len(accountNumber) < 10 {
					msg := tgbotapi.NewMessage(message.Chat.ID, "❌ شماره حساب نامعتبر است. لطفاً شماره حساب صحیح وارد کنید.")
					s.bot.Send(msg)
					return
				}

				// Parse withdrawal ID and approve with the account number
				id, err := strconv.ParseUint(withdrawalID, 10, 32)
				if err != nil {
					id = 0
				}
				if id == 0 {
					msg := tgbotapi.NewMessage(message.Chat.ID, "❌ خطا در پردازش درخواست")
					s.bot.Send(msg)
					return
				}

				err = models.UpdateWithdrawalStatus(s.db, uint(id), models.WithdrawalStatusApproved, nil, "تایید شده توسط ادمین", accountNumber)
				if err != nil {
					msg := tgbotapi.NewMessage(message.Chat.ID, "❌ خطا در تایید درخواست")
					s.bot.Send(msg)
					return
				}

				text := fmt.Sprintf("✅ درخواست برداشت %s تایید شد\n\n", withdrawalID)
				text += fmt.Sprintf("شماره حساب مقصد: %s\n\n", accountNumber)
				text += "کاربر می‌تواند واریز کند و فیش را بارگذاری کند."

				msg := tgbotapi.NewMessage(message.Chat.ID, text)
				s.bot.Send(msg)

				// Clear session state
				sessionMutex.Lock()
				delete(sessionStates, message.Chat.ID)
				sessionMutex.Unlock()
				return
			case state.WaitingForInput == "withdrawal_reject_reason":
				withdrawalID := state.Data["withdrawal_id"].(string)
				rejectReason := strings.TrimSpace(message.Text)

				if len(rejectReason) < 5 {
					msg := tgbotapi.NewMessage(message.Chat.ID, "❌ دلیل رد خیلی کوتاه است. لطفاً دلیل واضح‌تری وارد کنید.")
					s.bot.Send(msg)
					return
				}

				// Parse withdrawal ID and reject with the reason
				id, err := strconv.ParseUint(withdrawalID, 10, 32)
				if err != nil {
					id = 0
				}
				if id == 0 {
					msg := tgbotapi.NewMessage(message.Chat.ID, "❌ خطا در پردازش درخواست")
					s.bot.Send(msg)
					return
				}

				err = models.UpdateWithdrawalStatus(s.db, uint(id), models.WithdrawalStatusRejected, nil, rejectReason, "")
				if err != nil {
					msg := tgbotapi.NewMessage(message.Chat.ID, "❌ خطا در رد درخواست")
					s.bot.Send(msg)
					return
				}

				text := fmt.Sprintf("❌ درخواست برداشت %s رد شد\n\n", withdrawalID)
				text += fmt.Sprintf("دلیل رد: %s", rejectReason)

				msg := tgbotapi.NewMessage(message.Chat.ID, text)
				s.bot.Send(msg)

				// Clear session state
				sessionMutex.Lock()
				delete(sessionStates, message.Chat.ID)
				sessionMutex.Unlock()
				return
			case state.WaitingForInput == "admin_telegram_id" || state.WaitingForInput == "admin_first_name" || state.WaitingForInput == "admin_username":
				s.handleAddAdminInput(message.Chat.ID, message)
				return
			case state.WaitingForInput == "remove_admin_id":
				s.handleRemoveAdmin(message.Chat.ID, message.Text)
				return
			case state.WaitingForInput == "license_count":
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
			case state.WaitingForInput == "search_query":
				s.handleSearch(message.Chat.ID, message.Text)
				// Clear session state
				sessionMutex.Lock()
				delete(sessionStates, message.Chat.ID)
				sessionMutex.Unlock()
			case state.WaitingForInput == "search_supplier":
				s.handleSupplierSearch(message.Chat.ID, message.Text)
				// Don't clear session state here - it's handled in handleSupplierSearch
			case state.WaitingForInput == "search_visitor":
				s.handleVisitorSearch(message.Chat.ID, message.Text)
				// Don't clear session state here - it's handled in handleVisitorSearch
			case state.WaitingForInput == "search_available_product":
				s.handleAvailableProductSearch(message.Chat.ID, message.Text)
				// Don't clear session state here - it's handled in handleAvailableProductSearch
			case state.WaitingForInput == "reject_reason":
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
			case state.WaitingForInput == "visitor_reject_reason":
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
			case strings.HasPrefix(state.WaitingForInput, "ticket_response_"):
				// Check if user wants to cancel the response
				if message.Text == MENU_BACK || message.Text == "🔙 بازگشت" {
					// Clear session state and go back to main menu
					sessionMutex.Lock()
					delete(sessionStates, message.Chat.ID)
					sessionMutex.Unlock()
					s.showMainMenu(message.Chat.ID)
					return
				}

				// Process ticket response
				ticketIDStr := strings.TrimPrefix(state.WaitingForInput, "ticket_response_")
				if ticketID, err := strconv.ParseUint(ticketIDStr, 10, 32); err == nil {
					s.handleTicketResponse(message.Chat.ID, uint(ticketID), message.Text)
				}

				// Clear session state
				sessionMutex.Lock()
				delete(sessionStates, message.Chat.ID)
				sessionMutex.Unlock()
			}

			// Handle remaining state cases with simple if statements
			if state.WaitingForInput == "research_product_name" {
				s.handleResearchProductCreation(message.Chat.ID, message.Text, "name")
			} else if state.WaitingForInput == "research_product_category" {
				s.handleResearchProductCreation(message.Chat.ID, message.Text, "category")
			} else if state.WaitingForInput == "research_product_description" {
				s.handleResearchProductCreation(message.Chat.ID, message.Text, "description")
			} else if state.WaitingForInput == "research_product_target_country" {
				s.handleResearchProductCreation(message.Chat.ID, message.Text, "target_country")
			} else if state.WaitingForInput == "research_product_iran_price" {
				s.handleResearchProductCreation(message.Chat.ID, message.Text, "iran_price")
			} else if state.WaitingForInput == "research_product_target_price" {
				s.handleResearchProductCreation(message.Chat.ID, message.Text, "target_price")
			} else if state.WaitingForInput == "research_product_currency" {
				s.handleResearchProductCreation(message.Chat.ID, message.Text, "currency")
			} else if state.WaitingForInput == "research_product_market_demand" {
				s.handleResearchProductCreation(message.Chat.ID, message.Text, "market_demand")
			} else if state.WaitingForInput == "marketing_popup_data" {
				s.handleMarketingPopupInput(message.Chat.ID, message.Text)
			} else if state.WaitingForInput == "single_supplier_data" {
				s.handleSingleSupplierInput(message.Chat.ID, message.Text)
			} else if state.WaitingForInput == "single_visitor_data" {
				s.handleSingleVisitorInput(message.Chat.ID, message.Text)
			} else if state.WaitingForInput == "single_product_data" {
				s.handleSingleProductInput(message.Chat.ID, message.Text)
			} else if strings.HasPrefix(state.WaitingForInput, "edit_supplier_") {
				supplierIDStr := strings.TrimPrefix(state.WaitingForInput, "edit_supplier_")
				if supplierID, err := strconv.ParseUint(supplierIDStr, 10, 32); err == nil {
					s.handleSupplierEditInput(message.Chat.ID, uint(supplierID), message.Text)
				}
			} else if strings.HasPrefix(state.WaitingForInput, "edit_visitor_") {
				visitorIDStr := strings.TrimPrefix(state.WaitingForInput, "edit_visitor_")
				if visitorID, err := strconv.ParseUint(visitorIDStr, 10, 32); err == nil {
					s.handleVisitorEditInput(message.Chat.ID, uint(visitorID), message.Text)
				}
			} else if strings.HasPrefix(state.WaitingForInput, "edit_research_product_") {
				productIDStr := strings.TrimPrefix(state.WaitingForInput, "edit_research_product_")
				if productID, err := strconv.ParseUint(productIDStr, 10, 32); err == nil {
					s.handleResearchProductEditInput(message.Chat.ID, uint(productID), message.Text)
				}
			} else if strings.HasPrefix(state.WaitingForInput, "edit_available_product_") {
				productIDStr := strings.TrimPrefix(state.WaitingForInput, "edit_available_product_")
				if productID, err := strconv.ParseUint(productIDStr, 10, 32); err == nil {
					s.handleAvailableProductEditInput(message.Chat.ID, uint(productID), message.Text)
				}
			} else {
				// Handle training category name input
				if state.WaitingForInput == "awaiting_category_name" {
					ts := &TelegramService{bot: s.bot, db: s.db}
					ts.handleCategoryNameInput(message.Chat.ID, message.Text)
				} else if strings.HasPrefix(state.WaitingForInput, "awaiting_video_link_") {
					// Create TelegramService with training methods
					ts := &TelegramService{bot: s.bot, db: s.db}
					ts.handleVideoLinkInput(message.Chat.ID, message.Text, state.WaitingForInput)
				} else if strings.HasPrefix(state.WaitingForInput, "awaiting_video_title_") {
					ts := &TelegramService{bot: s.bot, db: s.db}
					ts.handleVideoTitleInput(message.Chat.ID, message.Text, state.WaitingForInput)
				} else if strings.HasPrefix(state.WaitingForInput, "awaiting_video_desc_") {
					ts := &TelegramService{bot: s.bot, db: s.db}
					ts.handleVideoDescInput(message.Chat.ID, message.Text, state.WaitingForInput)
				}
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

			// Check for support ticket command patterns
			if s.handleSupportTicketCommands(message.Chat.ID, message.Text) {
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

			// Check for research product command patterns
			if s.handleResearchProductCommands(message.Chat.ID, message.Text) {
				return
			}

			// Check for available product command patterns
			if s.handleAvailableProductCommands(message.Chat.ID, message.Text) {
				return
			}

			// No active session - show help message
			msg := tgbotapi.NewMessage(message.Chat.ID,
				"❓ **راهنمای استفاده:**\n\n"+
					"برای تولید لایسنس: ابتدا '➕ تولید لایسنس' را انتخاب کنید\n"+
					"برای جستجو: ابتدا '🔍 جستجو کاربر' را انتخاب کنید\n\n"+
					"یا از منوی زیر استفاده کنید:")
			msg.ParseMode = "Markdown"

			// Show main menu - use the same as showMainMenu function
			keyboard := tgbotapi.NewReplyKeyboard(
				tgbotapi.NewKeyboardButtonRow(
					tgbotapi.NewKeyboardButton(MENU_USERS),
					tgbotapi.NewKeyboardButton(MENU_STATS),
				),
				tgbotapi.NewKeyboardButtonRow(
					tgbotapi.NewKeyboardButton(MENU_LICENSES),
					tgbotapi.NewKeyboardButton(MENU_WITHDRAWALS),
				),
				tgbotapi.NewKeyboardButtonRow(
					tgbotapi.NewKeyboardButton(MENU_TRAINING),
					tgbotapi.NewKeyboardButton(MENU_SUPPORT_TICKETS),
				),
				tgbotapi.NewKeyboardButtonRow(
					tgbotapi.NewKeyboardButton(MENU_SUPPLIERS),
				),
				tgbotapi.NewKeyboardButtonRow(
					tgbotapi.NewKeyboardButton(MENU_VISITORS),
					tgbotapi.NewKeyboardButton(MENU_RESEARCH_PRODUCTS),
				),
				tgbotapi.NewKeyboardButtonRow(
					tgbotapi.NewKeyboardButton(MENU_MARKETING_POPUPS),
					tgbotapi.NewKeyboardButton(MENU_AVAILABLE_PRODUCTS),
				),
				tgbotapi.NewKeyboardButtonRow(
					tgbotapi.NewKeyboardButton(MENU_BULK_IMPORT),
					tgbotapi.NewKeyboardButton(MENU_SINGLE_ADD),
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
	// Store pagination state and clear other pagination states
	paginationMutex.Lock()
	// Clear other pagination states to avoid conflicts
	delete(supplierPaginationStates, chatID)
	delete(visitorPaginationStates, chatID)
	delete(ticketPaginationStates, chatID)
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

	messageText := message.String()

	// Check message length and split if needed (Telegram limit: 4096 characters)
	const maxMessageLength = 4000 // Leave some margin
	messages := splitLongMessage(messageText, maxMessageLength)

	// Send first message with keyboard
	if len(messages) > 0 {
		msg := tgbotapi.NewMessage(chatID, messages[0])
		msg.ParseMode = "Markdown"
		msg.ReplyMarkup = keyboard
		if _, err := s.bot.Send(msg); err != nil {
			log.Printf("ERROR: Failed to send users list message (filter: %s, page: %d): %v", filterType, page, err)
			log.Printf("DEBUG: Message length: %d chars", len(messages[0]))
			// Try sending as plain text without markdown
			msg2 := tgbotapi.NewMessage(chatID, messages[0])
			msg2.ReplyMarkup = keyboard
			if _, err2 := s.bot.Send(msg2); err2 != nil {
				log.Printf("ERROR: Failed to send as plain text too: %v", err2)
				// Send error message to user
				errorMsg := tgbotapi.NewMessage(chatID, fmt.Sprintf("❌ خطا در ارسال لیست کاربران\n\nفیلتر: %s\nصفحه: %d", filterName, page))
				s.bot.Send(errorMsg)
			}
		}

		// Send remaining parts if any (without keyboard)
		for i := 1; i < len(messages); i++ {
			msg := tgbotapi.NewMessage(chatID, messages[i])
			msg.ParseMode = "Markdown"
			if _, err := s.bot.Send(msg); err != nil {
				log.Printf("ERROR: Failed to send users list part %d: %v", i+1, err)
				// Try as plain text
				msg2 := tgbotapi.NewMessage(chatID, messages[i])
				s.bot.Send(msg2)
			}
		}
	}
}

// Handle pagination for user list, supplier list, visitor list, and ticket list
func (s *TelegramService) handlePagination(chatID int64, direction int) {
	paginationMutex.RLock()

	// Check if it's a user pagination
	var userState *UserPagination
	var supplierState *SupplierPagination
	var visitorState *VisitorPagination
	var ticketState *TicketPagination
	var isUser, isSupplier, isVisitor, isTicket bool

	if state, exists := userPaginationStates[chatID]; exists {
		userState = state
		isUser = true
		log.Printf("DEBUG: Found user pagination state for chatID %d, page %d, filter %s", chatID, state.Page, state.FilterType)
	} else if state, exists := supplierPaginationStates[chatID]; exists {
		supplierState = state
		isSupplier = true
		log.Printf("DEBUG: Found supplier pagination state for chatID %d, page %d, status %s", chatID, state.Page, state.Status)
	} else if state, exists := visitorPaginationStates[chatID]; exists {
		visitorState = state
		isVisitor = true
		log.Printf("DEBUG: Found visitor pagination state for chatID %d, page %d, status %s", chatID, state.Page, state.Status)
	} else if state, exists := ticketPaginationStates[chatID]; exists {
		ticketState = state
		isTicket = true
		log.Printf("DEBUG: Found ticket pagination state for chatID %d, page %d, status %s", chatID, state.Page, state.Status)
	} else {
		log.Printf("DEBUG: No pagination state found for chatID %d. User states: %d, Supplier states: %d, Visitor states: %d, Ticket states: %d",
			chatID, len(userPaginationStates), len(supplierPaginationStates), len(visitorPaginationStates), len(ticketPaginationStates))
	}

	paginationMutex.RUnlock()

	if isUser {
		newPage := userState.Page + direction
		if newPage < 1 {
			newPage = 1
		}
		log.Printf("DEBUG: Navigating user list to page %d", newPage)
		s.showUsersList(chatID, userState.FilterType, newPage)
		return
	}

	if isSupplier {
		newPage := supplierState.Page + direction
		if newPage < 1 {
			newPage = 1
		}
		log.Printf("DEBUG: Navigating supplier list to page %d", newPage)
		s.showSuppliersList(chatID, supplierState.Status, newPage)
		return
	}

	if isVisitor {
		newPage := visitorState.Page + direction
		if newPage < 1 {
			newPage = 1
		}
		log.Printf("DEBUG: Navigating visitor list to page %d", newPage)
		s.showVisitorsList(chatID, visitorState.Status, newPage)
		return
	}

	if isTicket {
		newPage := ticketState.Page + direction
		if newPage < 1 {
			newPage = 1
		}
		log.Printf("DEBUG: Navigating ticket list to page %d", newPage)
		s.showSupportTicketsList(chatID, ticketState.Status, newPage)
		return
	}

	// No pagination state found
	log.Printf("ERROR: No pagination state found for chatID %d after checking all types", chatID)
	msg := tgbotapi.NewMessage(chatID, "❌ وضعیت صفحه‌بندی یافت نشد. لطفا مجدد تلاش کنید.")
	s.bot.Send(msg)
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

	// Handle withdrawal callbacks
	if strings.Contains(data, "withdrawal") {
		s.handleWithdrawalCallback(query)
		return
	}

	// Handle notification callbacks
	if strings.Contains(data, "notif_") {
		s.handleNotificationCallback(query)
		return
	}

	// Handle upgrade callbacks
	if strings.HasPrefix(data, "upgrade_") {
		s.handleUpgradeCallback(query)
		return
	}

	// Handle training callbacks
	if strings.Contains(data, "training") || strings.HasPrefix(data, "select_category_") ||
		strings.HasPrefix(data, "edit_video_") || strings.HasPrefix(data, "delete_video_") ||
		strings.HasPrefix(data, "video_type_") || strings.HasPrefix(data, "confirm_delete_video_") {
		// Create TelegramService with training methods
		ts := &TelegramService{bot: s.bot, db: s.db}
		ts.handleTrainingCallback(query)
		return
	}

	if data == "cancel_delete" {
		// Send acknowledgment
		callback := tgbotapi.NewCallback(query.ID, "عملیات لغو شد")
		s.bot.Request(callback)

		msg := tgbotapi.NewMessage(chatID, "❌ عملیات حذف لغو شد.")
		s.bot.Send(msg)
		return
	}

	// Handle delete confirmation callbacks
	if strings.HasPrefix(data, "confirm_delete_") {
		log.Printf("Delete confirmation callback received: %s", data)
		s.handleDeleteConfirmation(query)
		return
	}

	// Handle feature/unfeature callbacks from search
	if strings.HasPrefix(data, "feature_supplier_") {
		supplierIDStr := strings.TrimPrefix(data, "feature_supplier_")
		if supplierID, err := strconv.ParseUint(supplierIDStr, 10, 32); err == nil {
			s.handleSupplierFeature(chatID, uint(supplierID))
			callback := tgbotapi.NewCallback(query.ID, "✅ تأمین‌کننده برگزیده شد")
			s.bot.Request(callback)
			// Update message
			s.handleSupplierSearch(chatID, supplierIDStr)
		}
		return
	}
	if strings.HasPrefix(data, "unfeature_supplier_") {
		supplierIDStr := strings.TrimPrefix(data, "unfeature_supplier_")
		if supplierID, err := strconv.ParseUint(supplierIDStr, 10, 32); err == nil {
			s.handleSupplierUnfeature(chatID, uint(supplierID))
			callback := tgbotapi.NewCallback(query.ID, "✅ برگزیده حذف شد")
			s.bot.Request(callback)
			// Update message
			s.handleSupplierSearch(chatID, supplierIDStr)
		}
		return
	}
	if strings.HasPrefix(data, "feature_visitor_") {
		visitorIDStr := strings.TrimPrefix(data, "feature_visitor_")
		if visitorID, err := strconv.ParseUint(visitorIDStr, 10, 32); err == nil {
			s.handleVisitorFeature(chatID, uint(visitorID))
			callback := tgbotapi.NewCallback(query.ID, "✅ ویزیتور برگزیده شد")
			s.bot.Request(callback)
			// Update message
			s.handleVisitorSearch(chatID, visitorIDStr)
		}
		return
	}
	if strings.HasPrefix(data, "unfeature_visitor_") {
		visitorIDStr := strings.TrimPrefix(data, "unfeature_visitor_")
		if visitorID, err := strconv.ParseUint(visitorIDStr, 10, 32); err == nil {
			s.handleVisitorUnfeature(chatID, uint(visitorID))
			callback := tgbotapi.NewCallback(query.ID, "✅ برگزیده حذف شد")
			s.bot.Request(callback)
			// Update message
			s.handleVisitorSearch(chatID, visitorIDStr)
		}
		return
	}
	if strings.HasPrefix(data, "feature_product_") {
		productIDStr := strings.TrimPrefix(data, "feature_product_")
		if productID, err := strconv.ParseUint(productIDStr, 10, 32); err == nil {
			s.handleAvailableProductFeature(chatID, uint(productID))
			callback := tgbotapi.NewCallback(query.ID, "✅ کالا برگزیده شد")
			s.bot.Request(callback)
			// Update message
			s.handleAvailableProductSearch(chatID, productIDStr)
		}
		return
	}
	if strings.HasPrefix(data, "unfeature_product_") {
		productIDStr := strings.TrimPrefix(data, "unfeature_product_")
		if productID, err := strconv.ParseUint(productIDStr, 10, 32); err == nil {
			s.handleAvailableProductUnfeature(chatID, uint(productID))
			callback := tgbotapi.NewCallback(query.ID, "✅ برگزیده حذف شد")
			s.bot.Request(callback)
			// Update message
			s.handleAvailableProductSearch(chatID, productIDStr)
		}
		return
	}

	// Handle supplier tag toggle: tag_supplier_{id}_{tagkey}
	if strings.HasPrefix(data, "tag_supplier_") {
		rest := strings.TrimPrefix(data, "tag_supplier_")
		parts := strings.SplitN(rest, "_", 2)
		if len(parts) == 2 {
			if supplierID, err := strconv.ParseUint(parts[0], 10, 32); err == nil {
				tagKey := parts[1]
				s.handleSupplierTagToggle(chatID, query, uint(supplierID), tagKey)
			}
		}
		return
	}

	// Handle "show tag management" for supplier: tags_supplier_{id}
	if strings.HasPrefix(data, "tags_supplier_") {
		supplierIDStr := strings.TrimPrefix(data, "tags_supplier_")
		if supplierID, err := strconv.ParseUint(supplierIDStr, 10, 32); err == nil {
			callback := tgbotapi.NewCallback(query.ID, "🏷️ تگ‌ها")
			s.bot.Request(callback)
			s.sendSupplierTagKeyboard(chatID, uint(supplierID))
		}
		return
	}

	// Handle edit callbacks from search
	if strings.HasPrefix(data, "edit_supplier_") {
		supplierIDStr := strings.TrimPrefix(data, "edit_supplier_")
		if supplierID, err := strconv.ParseUint(supplierIDStr, 10, 32); err == nil {
			callback := tgbotapi.NewCallback(query.ID, "✏️ در حال آماده‌سازی ویرایش...")
			s.bot.Request(callback)
			s.promptSupplierEdit(chatID, uint(supplierID))
		}
		return
	}
	if strings.HasPrefix(data, "edit_visitor_") {
		visitorIDStr := strings.TrimPrefix(data, "edit_visitor_")
		if visitorID, err := strconv.ParseUint(visitorIDStr, 10, 32); err == nil {
			callback := tgbotapi.NewCallback(query.ID, "✏️ در حال آماده‌سازی ویرایش...")
			s.bot.Request(callback)
			s.promptVisitorEdit(chatID, uint(visitorID))
		}
		return
	}
	if strings.HasPrefix(data, "edit_available_product_") {
		productIDStr := strings.TrimPrefix(data, "edit_available_product_")
		if productID, err := strconv.ParseUint(productIDStr, 10, 32); err == nil {
			callback := tgbotapi.NewCallback(query.ID, "✏️ در حال آماده‌سازی ویرایش...")
			s.bot.Request(callback)
			s.promptAvailableProductEdit(chatID, uint(productID))
		}
		return
	}

	// Handle delete callbacks from search
	if strings.HasPrefix(data, "delete_supplier_") {
		supplierIDStr := strings.TrimPrefix(data, "delete_supplier_")
		if supplierID, err := strconv.ParseUint(supplierIDStr, 10, 32); err == nil {
			callback := tgbotapi.NewCallback(query.ID, "🗑️ در حال آماده‌سازی حذف...")
			s.bot.Request(callback)
			s.confirmSupplierDelete(chatID, uint(supplierID))
		}
		return
	}
	if strings.HasPrefix(data, "delete_visitor_") {
		visitorIDStr := strings.TrimPrefix(data, "delete_visitor_")
		if visitorID, err := strconv.ParseUint(visitorIDStr, 10, 32); err == nil {
			callback := tgbotapi.NewCallback(query.ID, "🗑️ در حال آماده‌سازی حذف...")
			s.bot.Request(callback)
			s.confirmVisitorDelete(chatID, uint(visitorID))
		}
		return
	}
	if strings.HasPrefix(data, "delete_available_product_") {
		productIDStr := strings.TrimPrefix(data, "delete_available_product_")
		if productID, err := strconv.ParseUint(productIDStr, 10, 32); err == nil {
			callback := tgbotapi.NewCallback(query.ID, "🗑️ در حال آماده‌سازی حذف...")
			s.bot.Request(callback)
			s.confirmAvailableProductDelete(chatID, uint(productID))
		}
		return
	}

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
			tgbotapi.NewKeyboardButton(MENU_FEATURED_SUPPLIERS),
			tgbotapi.NewKeyboardButton(MENU_ALL_SUPPLIERS),
		),
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_SEARCH_SUPPLIER),
			tgbotapi.NewKeyboardButton(MENU_BACK),
		),
	)

	msg := tgbotapi.NewMessage(chatID,
		"🏪 **مدیریت تأمین‌کنندگان**\n\n"+
			"لطفا گزینه مورد نظر خود را انتخاب کنید:\n\n"+
			"⏳ **در انتظار**: تأمین‌کنندگان منتظر بررسی\n"+
			"✅ **تأیید شده**: تأمین‌کنندگان فعال\n"+
			"❌ **رد شده**: تأمین‌کنندگان رد شده\n"+
			"⭐ **برگزیده**: تأمین‌کنندگان برگزیده\n"+
			"📋 **همه**: تمام تأمین‌کنندگان\n"+
			"🔍 **جستجو**: جستجوی تأمین‌کننده برای برگزیده کردن\n"+
			"📊 **آمار**: آمار کلی تأمین‌کنندگان")

	msg.ParseMode = "Markdown"
	msg.ReplyMarkup = keyboard
	s.bot.Send(msg)
}

func (s *TelegramService) showSuppliersList(chatID int64, status string, page int) {
	const perPage = 5

	// Store pagination state and clear other pagination states
	paginationMutex.Lock()
	// Clear other pagination states to avoid conflicts
	delete(userPaginationStates, chatID)
	delete(visitorPaginationStates, chatID)
	delete(ticketPaginationStates, chatID)
	supplierPaginationStates[chatID] = &SupplierPagination{
		ChatID:  chatID,
		Page:    page,
		PerPage: perPage,
		Status:  status,
	}
	paginationMutex.Unlock()

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
	case "featured":
		filterName = "⭐ تأمین‌کنندگان برگزیده"
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

			// Featured icon
			featuredIcon := ""
			if supplier.IsFeatured {
				featuredIcon = "⭐"
			}

			// Load products count
			var productCount int64
			s.db.Model(&models.SupplierProduct{}).Where("supplier_id = ?", supplier.ID).Count(&productCount)

			supplierInfo := fmt.Sprintf(
				"**%d. %s%s %s**\n"+
					"📧 نام: %s\n"+
					"📱 موبایل: %s\n"+
					"🏘️ شهر: %s\n"+
					"📦 تعداد محصولات: %d\n"+
					"🗓️ تاریخ ثبت‌نام: %s\n"+
					"%s وضعیت: %s | %s نوع کسب‌وکار%s\n",
				startItem+i,
				featuredIcon,
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
				func() string {
					if supplier.IsFeatured {
						return " | ⭐ برگزیده"
					}
					return ""
				}(),
			)

			// Add action buttons
			if supplier.Status == "pending" {
				supplierInfo += fmt.Sprintf(
					"🔘 عملیات: /view%d | /approve%d | /reject%d | /edit%d | /delete%d\n",
					supplier.ID, supplier.ID, supplier.ID, supplier.ID, supplier.ID,
				)
			} else if supplier.Status == "approved" {
				if supplier.IsFeatured {
					supplierInfo += fmt.Sprintf(
						"🔧 عملیات: /view%d | /unfeature%d | /edit%d | /delete%d\n",
						supplier.ID, supplier.ID, supplier.ID, supplier.ID,
					)
				} else {
					supplierInfo += fmt.Sprintf(
						"🔧 عملیات: /view%d | /feature%d | /edit%d | /delete%d\n",
						supplier.ID, supplier.ID, supplier.ID, supplier.ID,
					)
				}
			} else {
				supplierInfo += fmt.Sprintf(
					"🔧 عملیات: /view%d | /edit%d | /delete%d\n",
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

func (s *TelegramService) showFeaturedSuppliersList(chatID int64) {
	s.showSuppliersList(chatID, "featured", 1)
}

// Supplier Command Handlers

func (s *TelegramService) handleSupplierCommands(chatID int64, text string) bool {
	// Check for supplier action commands: /view123, /approve123, /reject123, /edit123, /delete123
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
	} else if strings.HasPrefix(text, "/edit") && len(text) > 5 {
		supplierIDStr := strings.TrimPrefix(text, "/edit")
		if supplierID, err := strconv.ParseUint(supplierIDStr, 10, 32); err == nil {
			s.promptSupplierEdit(chatID, uint(supplierID))
			return true
		}
	} else if strings.HasPrefix(text, "/delete") && len(text) > 7 {
		supplierIDStr := strings.TrimPrefix(text, "/delete")
		if supplierID, err := strconv.ParseUint(supplierIDStr, 10, 32); err == nil {
			s.confirmSupplierDelete(chatID, uint(supplierID))
			return true
		}
	} else if strings.HasPrefix(text, "/feature") && len(text) > 8 {
		supplierIDStr := strings.TrimPrefix(text, "/feature")
		if supplierID, err := strconv.ParseUint(supplierIDStr, 10, 32); err == nil {
			s.handleSupplierFeature(chatID, uint(supplierID))
			return true
		}
	} else if strings.HasPrefix(text, "/unfeature") && len(text) > 10 {
		supplierIDStr := strings.TrimPrefix(text, "/unfeature")
		if supplierID, err := strconv.ParseUint(supplierIDStr, 10, 32); err == nil {
			s.handleSupplierUnfeature(chatID, uint(supplierID))
			return true
		}
	}
	return false
}

// Visitor Command Handlers

func (s *TelegramService) handleVisitorCommands(chatID int64, text string) bool {
	// Check for visitor action commands: /vview3, /vapprove3, /vreject3, /vedit3, /vdelete3
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
	} else if strings.HasPrefix(text, "/vedit") && len(text) > 6 {
		visitorIDStr := strings.TrimPrefix(text, "/vedit")
		if visitorID, err := strconv.ParseUint(visitorIDStr, 10, 32); err == nil {
			s.promptVisitorEdit(chatID, uint(visitorID))
			return true
		}
	} else if strings.HasPrefix(text, "/vdelete") && len(text) > 8 {
		visitorIDStr := strings.TrimPrefix(text, "/vdelete")
		if visitorID, err := strconv.ParseUint(visitorIDStr, 10, 32); err == nil {
			s.confirmVisitorDelete(chatID, uint(visitorID))
			return true
		}
	} else if strings.HasPrefix(text, "/vfeature") && len(text) > 9 {
		visitorIDStr := strings.TrimPrefix(text, "/vfeature")
		if visitorID, err := strconv.ParseUint(visitorIDStr, 10, 32); err == nil {
			s.handleVisitorFeature(chatID, uint(visitorID))
			return true
		}
	} else if strings.HasPrefix(text, "/vunfeature") && len(text) > 11 {
		visitorIDStr := strings.TrimPrefix(text, "/vunfeature")
		if visitorID, err := strconv.ParseUint(visitorIDStr, 10, 32); err == nil {
			s.handleVisitorUnfeature(chatID, uint(visitorID))
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

	if visitor.InterestedProducts != "" {
		details += fmt.Sprintf("⭐ **محصولات مورد علاقه:** %s\n", visitor.InterestedProducts)
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

	// Featured status
	if visitor.IsFeatured {
		details += "⭐ **برگزیده:** ✅ بله\n"
		if visitor.FeaturedAt != nil {
			details += fmt.Sprintf("⭐ **تاریخ برگزیده:** %s\n", visitor.FeaturedAt.Format("2006/01/02 15:04"))
		}
	} else {
		details += "⭐ **برگزیده:** ❌ خیر\n"
	}

	// Create action buttons based on status
	var keyboard tgbotapi.ReplyKeyboardMarkup
	if visitor.Status == "pending" {
		keyboard = tgbotapi.NewReplyKeyboard(
			tgbotapi.NewKeyboardButtonRow(
				tgbotapi.NewKeyboardButton(fmt.Sprintf("/vapprove%d", visitor.ID)),
				tgbotapi.NewKeyboardButton(fmt.Sprintf("/vreject%d", visitor.ID)),
			),
			tgbotapi.NewKeyboardButtonRow(
				tgbotapi.NewKeyboardButton(fmt.Sprintf("/vedit%d", visitor.ID)),
				tgbotapi.NewKeyboardButton(fmt.Sprintf("/vdelete%d", visitor.ID)),
			),
			tgbotapi.NewKeyboardButtonRow(
				tgbotapi.NewKeyboardButton(MENU_BACK),
			),
		)
	} else if visitor.Status == "approved" {
		// Add feature/unfeature buttons for approved visitors
		if visitor.IsFeatured {
			keyboard = tgbotapi.NewReplyKeyboard(
				tgbotapi.NewKeyboardButtonRow(
					tgbotapi.NewKeyboardButton(fmt.Sprintf("/vunfeature%d", visitor.ID)),
				),
				tgbotapi.NewKeyboardButtonRow(
					tgbotapi.NewKeyboardButton(fmt.Sprintf("/vedit%d", visitor.ID)),
					tgbotapi.NewKeyboardButton(fmt.Sprintf("/vdelete%d", visitor.ID)),
				),
				tgbotapi.NewKeyboardButtonRow(
					tgbotapi.NewKeyboardButton(MENU_BACK),
				),
			)
		} else {
			keyboard = tgbotapi.NewReplyKeyboard(
				tgbotapi.NewKeyboardButtonRow(
					tgbotapi.NewKeyboardButton(fmt.Sprintf("/vfeature%d", visitor.ID)),
				),
				tgbotapi.NewKeyboardButtonRow(
					tgbotapi.NewKeyboardButton(fmt.Sprintf("/vedit%d", visitor.ID)),
					tgbotapi.NewKeyboardButton(fmt.Sprintf("/vdelete%d", visitor.ID)),
				),
				tgbotapi.NewKeyboardButtonRow(
					tgbotapi.NewKeyboardButton(MENU_BACK),
				),
			)
		}
	} else {
		keyboard = tgbotapi.NewReplyKeyboard(
			tgbotapi.NewKeyboardButtonRow(
				tgbotapi.NewKeyboardButton(fmt.Sprintf("/vedit%d", visitor.ID)),
				tgbotapi.NewKeyboardButton(fmt.Sprintf("/vdelete%d", visitor.ID)),
			),
			tgbotapi.NewKeyboardButtonRow(
				tgbotapi.NewKeyboardButton(MENU_BACK),
			),
		)
	}

	// Check message length and split if needed (Telegram limit: 4096 characters)
	const maxMessageLength = 4000 // Leave some margin
	messages := splitLongMessage(details, maxMessageLength)

	// Send first message with keyboard
	if len(messages) > 0 {
		msg := tgbotapi.NewMessage(chatID, messages[0])
		msg.ParseMode = "Markdown"
		msg.ReplyMarkup = keyboard
		if _, err := s.bot.Send(msg); err != nil {
			log.Printf("ERROR: Failed to send visitor details message (ID %d): %v", visitorID, err)
			log.Printf("DEBUG: Message length: %d chars", len(messages[0]))
			// Try sending as plain text without markdown
			msg2 := tgbotapi.NewMessage(chatID, messages[0])
			msg2.ReplyMarkup = keyboard
			if _, err2 := s.bot.Send(msg2); err2 != nil {
				log.Printf("ERROR: Failed to send as plain text too: %v", err2)
				// Send error message to user
				errorMsg := tgbotapi.NewMessage(chatID, fmt.Sprintf("❌ خطا در ارسال جزئیات ویزیتور #%d\n\nپیام حاوی محتوای نامعتبر است.", visitorID))
				s.bot.Send(errorMsg)
			}
		}

		// Send remaining parts if any (without keyboard)
		for i := 1; i < len(messages); i++ {
			msg := tgbotapi.NewMessage(chatID, messages[i])
			msg.ParseMode = "Markdown"
			if _, err := s.bot.Send(msg); err != nil {
				log.Printf("ERROR: Failed to send visitor details part %d: %v", i+1, err)
				// Try as plain text
				msg2 := tgbotapi.NewMessage(chatID, messages[i])
				s.bot.Send(msg2)
			}
		}
	}
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

func (s *TelegramService) handleVisitorFeature(chatID int64, visitorID uint) {
	// Find admin user ID for featuring
	adminID, err := s.findOrCreateAdminUser(chatID)
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ خطا در شناسایی ادمین")
		s.bot.Send(msg)
		return
	}

	err = models.SetVisitorFeatured(s.db, visitorID, adminID, true)
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ خطا در برگزیده کردن ویزیتور")
		s.bot.Send(msg)
		return
	}

	msg := tgbotapi.NewMessage(chatID, fmt.Sprintf("⭐ ویزیتور #%d به عنوان برگزیده انتخاب شد", visitorID))
	s.bot.Send(msg)
}

func (s *TelegramService) handleVisitorUnfeature(chatID int64, visitorID uint) {
	// Find admin user ID for unfeaturing
	adminID, err := s.findOrCreateAdminUser(chatID)
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ خطا در شناسایی ادمین")
		s.bot.Send(msg)
		return
	}

	err = models.SetVisitorFeatured(s.db, visitorID, adminID, false)
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ خطا در حذف برگزیده ویزیتور")
		s.bot.Send(msg)
		return
	}

	msg := tgbotapi.NewMessage(chatID, fmt.Sprintf("⭐ ویزیتور #%d از لیست برگزیده‌ها حذف شد", visitorID))
	s.bot.Send(msg)
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

// handleSupplierTagToggle toggles a single tag for a supplier and updates the inline message
func (s *TelegramService) handleSupplierTagToggle(chatID int64, query *tgbotapi.CallbackQuery, supplierID uint, tagKey string) {
	var supplier models.Supplier
	if err := s.db.Where("id = ?", supplierID).First(&supplier).Error; err != nil {
		callback := tgbotapi.NewCallback(query.ID, "❌ تأمین‌کننده یافت نشد")
		s.bot.Request(callback)
		return
	}

	switch tagKey {
	case "first_class":
		supplier.TagFirstClass = !supplier.TagFirstClass
	case "good_price":
		supplier.TagGoodPrice = !supplier.TagGoodPrice
	case "export_experience":
		supplier.TagExportExperience = !supplier.TagExportExperience
	case "export_packaging":
		supplier.TagExportPackaging = !supplier.TagExportPackaging
	case "supply_without_capital":
		supplier.TagSupplyWithoutCapital = !supplier.TagSupplyWithoutCapital
	default:
		callback := tgbotapi.NewCallback(query.ID, "❌ تگ نامعتبر")
		s.bot.Request(callback)
		return
	}

	if err := s.db.Save(&supplier).Error; err != nil {
		callback := tgbotapi.NewCallback(query.ID, "❌ خطا در به‌روزرسانی تگ")
		s.bot.Request(callback)
		return
	}

	callback := tgbotapi.NewCallback(query.ID, "✅ تگ به‌روز شد")
	s.bot.Request(callback)

	// Edit the message to refresh the keyboard with new tag state
	newKeyboard := s.buildSupplierTagKeyboard(&supplier)
	edit := tgbotapi.NewEditMessageReplyMarkup(chatID, query.Message.MessageID, newKeyboard)
	s.bot.Request(edit)
}

// sendSupplierTagKeyboard sends a standalone message with tag toggle keyboard (for "تگ‌ها" from search result)
func (s *TelegramService) sendSupplierTagKeyboard(chatID int64, supplierID uint) {
	var supplier models.Supplier
	if err := s.db.Where("id = ?", supplierID).First(&supplier).Error; err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ تأمین‌کننده یافت نشد")
		s.bot.Send(msg)
		return
	}
	tagKeyboard := s.buildSupplierTagKeyboard(&supplier)
	tagMsg := tgbotapi.NewMessage(chatID, fmt.Sprintf("🏷️ **تگ‌های تأمین‌کننده #%d** (کلیک برای تغییر)", supplierID))
	tagMsg.ParseMode = "Markdown"
	tagMsg.ReplyMarkup = tagKeyboard
	s.bot.Send(tagMsg)
}

// buildSupplierTagKeyboard builds inline keyboard for toggling supplier tags (تگ‌های تأمین‌کننده)
func (s *TelegramService) buildSupplierTagKeyboard(supplier *models.Supplier) tgbotapi.InlineKeyboardMarkup {
	label := func(on bool, name string) string {
		if on {
			return name + " ✅"
		}
		return name + " ❌"
	}
	idStr := strconv.FormatUint(uint64(supplier.ID), 10)
	return tgbotapi.NewInlineKeyboardMarkup(
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData(label(supplier.TagFirstClass, "دسته اول"), "tag_supplier_"+idStr+"_first_class"),
		),
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData(label(supplier.TagGoodPrice, "خوش قیمت"), "tag_supplier_"+idStr+"_good_price"),
		),
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData(label(supplier.TagExportExperience, "سابقه صادرات"), "tag_supplier_"+idStr+"_export_experience"),
		),
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData(label(supplier.TagExportPackaging, "بسته‌بندی صادراتی"), "tag_supplier_"+idStr+"_export_packaging"),
		),
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData(label(supplier.TagSupplyWithoutCapital, "تأمین بدون سرمایه"), "tag_supplier_"+idStr+"_supply_without_capital"),
		),
	)
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
	if supplier.IsFeatured {
		message.WriteString("**⭐ برگزیده:** ✅ بله\n")
		if supplier.FeaturedAt != nil {
			message.WriteString(fmt.Sprintf("**⭐ تاریخ برگزیده:** %s\n", supplier.FeaturedAt.Format("2006/01/02 15:04")))
		}
	} else {
		message.WriteString("**⭐ برگزیده:** ❌ خیر\n")
	}

	// Supplier tags (تگ‌های تأمین‌کننده)
	message.WriteString("\n**🏷️ تگ‌ها:**\n")
	if supplier.TagFirstClass {
		message.WriteString("• تأمین‌کننده دسته اول: ✅\n")
	} else {
		message.WriteString("• تأمین‌کننده دسته اول: ❌\n")
	}
	if supplier.TagGoodPrice {
		message.WriteString("• تأمین‌کننده خوش قیمت: ✅\n")
	} else {
		message.WriteString("• تأمین‌کننده خوش قیمت: ❌\n")
	}
	if supplier.TagExportExperience {
		message.WriteString("• سابقه صادرات: ✅\n")
	} else {
		message.WriteString("• سابقه صادرات: ❌\n")
	}
	if supplier.TagExportPackaging {
		message.WriteString("• بسته‌بندی صادراتی: ✅\n")
	} else {
		message.WriteString("• بسته‌بندی صادراتی: ❌\n")
	}
	if supplier.TagSupplyWithoutCapital {
		message.WriteString("• تأمین بدون سرمایه: ✅\n")
	} else {
		message.WriteString("• تأمین بدون سرمایه: ❌\n")
	}

	message.WriteString(fmt.Sprintf("\n**🗓️ تاریخ ثبت‌نام:** %s\n", supplier.CreatedAt.Format("2006/01/02 15:04")))
	if supplier.ApprovedAt != nil {
		message.WriteString(fmt.Sprintf("**✅ تاریخ تأیید:** %s\n", supplier.ApprovedAt.Format("2006/01/02 15:04")))
	}
	if supplier.AdminNotes != "" {
		message.WriteString(fmt.Sprintf("**📝 یادداشت ادمین:** %s\n", supplier.AdminNotes))
	}

	// Action buttons for suppliers
	var keyboard tgbotapi.ReplyKeyboardMarkup
	if supplier.Status == "pending" {
		keyboard = tgbotapi.NewReplyKeyboard(
			tgbotapi.NewKeyboardButtonRow(
				tgbotapi.NewKeyboardButton(fmt.Sprintf("/approve%d", supplier.ID)),
				tgbotapi.NewKeyboardButton(fmt.Sprintf("/reject%d", supplier.ID)),
			),
			tgbotapi.NewKeyboardButtonRow(
				tgbotapi.NewKeyboardButton(fmt.Sprintf("/edit%d", supplier.ID)),
				tgbotapi.NewKeyboardButton(fmt.Sprintf("/delete%d", supplier.ID)),
			),
			tgbotapi.NewKeyboardButtonRow(
				tgbotapi.NewKeyboardButton(MENU_BACK),
			),
		)
	} else if supplier.Status == "approved" {
		// Add feature/unfeature buttons for approved suppliers
		if supplier.IsFeatured {
			keyboard = tgbotapi.NewReplyKeyboard(
				tgbotapi.NewKeyboardButtonRow(
					tgbotapi.NewKeyboardButton(fmt.Sprintf("/unfeature%d", supplier.ID)),
				),
				tgbotapi.NewKeyboardButtonRow(
					tgbotapi.NewKeyboardButton(fmt.Sprintf("/edit%d", supplier.ID)),
					tgbotapi.NewKeyboardButton(fmt.Sprintf("/delete%d", supplier.ID)),
				),
				tgbotapi.NewKeyboardButtonRow(
					tgbotapi.NewKeyboardButton(MENU_BACK),
				),
			)
		} else {
			keyboard = tgbotapi.NewReplyKeyboard(
				tgbotapi.NewKeyboardButtonRow(
					tgbotapi.NewKeyboardButton(fmt.Sprintf("/feature%d", supplier.ID)),
				),
				tgbotapi.NewKeyboardButtonRow(
					tgbotapi.NewKeyboardButton(fmt.Sprintf("/edit%d", supplier.ID)),
					tgbotapi.NewKeyboardButton(fmt.Sprintf("/delete%d", supplier.ID)),
				),
				tgbotapi.NewKeyboardButtonRow(
					tgbotapi.NewKeyboardButton(MENU_BACK),
				),
			)
		}
	} else {
		keyboard = tgbotapi.NewReplyKeyboard(
			tgbotapi.NewKeyboardButtonRow(
				tgbotapi.NewKeyboardButton(fmt.Sprintf("/edit%d", supplier.ID)),
				tgbotapi.NewKeyboardButton(fmt.Sprintf("/delete%d", supplier.ID)),
			),
			tgbotapi.NewKeyboardButtonRow(
				tgbotapi.NewKeyboardButton(MENU_BACK),
			),
		)
	}

	messageText := message.String()

	// Check message length and split if needed (Telegram limit: 4096 characters)
	const maxMessageLength = 4000 // Leave some margin
	messages := splitLongMessage(messageText, maxMessageLength)

	// Send first message with keyboard
	if len(messages) > 0 {
		msg := tgbotapi.NewMessage(chatID, messages[0])
		msg.ParseMode = "Markdown"
		msg.ReplyMarkup = keyboard
		if _, err := s.bot.Send(msg); err != nil {
			log.Printf("ERROR: Failed to send supplier details message (ID %d): %v", supplierID, err)
			log.Printf("DEBUG: Message length: %d chars", len(messages[0]))
			// Try sending as plain text without markdown
			msg2 := tgbotapi.NewMessage(chatID, messages[0])
			msg2.ReplyMarkup = keyboard
			if _, err2 := s.bot.Send(msg2); err2 != nil {
				log.Printf("ERROR: Failed to send as plain text too: %v", err2)
				// Send error message to user
				errorMsg := tgbotapi.NewMessage(chatID, fmt.Sprintf("❌ خطا در ارسال جزئیات تأمین‌کننده #%d\n\nپیام حاوی محتوای نامعتبر است.", supplierID))
				s.bot.Send(errorMsg)
			}
		}

		// Send remaining parts if any (without keyboard)
		for i := 1; i < len(messages); i++ {
			msg := tgbotapi.NewMessage(chatID, messages[i])
			msg.ParseMode = "Markdown"
			if _, err := s.bot.Send(msg); err != nil {
				log.Printf("ERROR: Failed to send supplier details part %d: %v", i+1, err)
				// Try as plain text
				msg2 := tgbotapi.NewMessage(chatID, messages[i])
				s.bot.Send(msg2)
			}
		}

		// Send tag management inline keyboard (تگ‌های تأمین‌کننده)
		tagKeyboard := s.buildSupplierTagKeyboard(&supplier)
		tagMsg := tgbotapi.NewMessage(chatID, "🏷️ **تگ‌های تأمین‌کننده** (کلیک برای تغییر)")
		tagMsg.ParseMode = "Markdown"
		tagMsg.ReplyMarkup = tagKeyboard
		s.bot.Send(tagMsg)
	}
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

func (s *TelegramService) handleSupplierFeature(chatID int64, supplierID uint) {
	// Find admin user ID for featuring
	adminID, err := s.findOrCreateAdminUser(chatID)
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ خطا در شناسایی ادمین")
		s.bot.Send(msg)
		return
	}

	err = models.SetSupplierFeatured(s.db, supplierID, adminID, true)
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ خطا در برگزیده کردن تأمین‌کننده")
		s.bot.Send(msg)
		return
	}

	msg := tgbotapi.NewMessage(chatID, fmt.Sprintf("⭐ تأمین‌کننده #%d به عنوان برگزیده انتخاب شد", supplierID))
	s.bot.Send(msg)
}

func (s *TelegramService) handleSupplierUnfeature(chatID int64, supplierID uint) {
	// Find admin user ID for unfeaturing
	adminID, err := s.findOrCreateAdminUser(chatID)
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ خطا در شناسایی ادمین")
		s.bot.Send(msg)
		return
	}

	err = models.SetSupplierFeatured(s.db, supplierID, adminID, false)
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ خطا در حذف برگزیده تأمین‌کننده")
		s.bot.Send(msg)
		return
	}

	msg := tgbotapi.NewMessage(chatID, fmt.Sprintf("⭐ تأمین‌کننده #%d از لیست برگزیده‌ها حذف شد", supplierID))
	s.bot.Send(msg)
}

// Search functions for featured items
func (s *TelegramService) showSupplierSearchPrompt(chatID int64) {
	msg := tgbotapi.NewMessage(chatID, "🔍 **جستجوی تأمین‌کننده**\n\n"+
		"لطفا نام، شماره تماس یا شناسه تأمین‌کننده را وارد کنید:\n\n"+
		"💡 می‌توانید بر اساس:\n"+
		"• نام تأمین‌کننده\n"+
		"• شماره موبایل\n"+
		"• شناسه (ID)")
	msg.ParseMode = "Markdown"
	s.bot.Send(msg)

	// Set session state to wait for search query
	sessionMutex.Lock()
	sessionStates[chatID] = &SessionState{
		ChatID:          chatID,
		WaitingForInput: "search_supplier",
	}
	sessionMutex.Unlock()
}

func (s *TelegramService) handleSupplierSearch(chatID int64, query string) {
	var suppliers []models.Supplier
	query = strings.TrimSpace(query)

	// Try to find by ID first
	if id, err := strconv.ParseUint(query, 10, 32); err == nil {
		var supplier models.Supplier
		if err := s.db.Preload("User").Where("id = ?", id).First(&supplier).Error; err == nil {
			suppliers = []models.Supplier{supplier}
		}
	} else {
		// Search by name or mobile
		searchPattern := "%" + query + "%"
		s.db.Preload("User").Where(
			"full_name LIKE ? OR mobile LIKE ? OR brand_name LIKE ?",
			searchPattern, searchPattern, searchPattern,
		).Limit(10).Find(&suppliers)
	}

	if len(suppliers) == 0 {
		msg := tgbotapi.NewMessage(chatID, "❌ تأمین‌کننده‌ای با این مشخصات یافت نشد.")
		s.bot.Send(msg)
		return
	}

	// Show results
	if len(suppliers) == 1 {
		// Single result - show details with feature/unfeature and tags
		supplier := suppliers[0]
		text := fmt.Sprintf("🔍 **نتیجه جستجو**\n\n"+
			"🏪 **تأمین‌کننده #%d**\n"+
			"👤 **نام:** %s\n"+
			"📱 **موبایل:** %s\n"+
			"🏷️ **برند:** %s\n"+
			"📍 **شهر:** %s\n"+
			"📊 **وضعیت:** %s\n",
			supplier.ID, supplier.FullName, supplier.Mobile,
			getDefaultIfEmpty(supplier.BrandName, "ندارد"),
			supplier.City, supplier.Status)

		if supplier.IsFeatured {
			text += "⭐ **برگزیده:** ✅ بله\n"
		} else {
			text += "⭐ **برگزیده:** ❌ خیر\n"
		}

		// تگ‌های تأمین‌کننده
		text += "\n**🏷️ تگ‌ها:** "
		tags := []string{}
		if supplier.TagFirstClass {
			tags = append(tags, "دسته اول")
		}
		if supplier.TagGoodPrice {
			tags = append(tags, "خوش قیمت")
		}
		if supplier.TagExportExperience {
			tags = append(tags, "صادرات")
		}
		if supplier.TagExportPackaging {
			tags = append(tags, "بسته‌بندی صادراتی")
		}
		if supplier.TagSupplyWithoutCapital {
			tags = append(tags, "بدون سرمایه")
		}
		if len(tags) > 0 {
			text += strings.Join(tags, " • ") + "\n"
		} else {
			text += "ندارد\n"
		}

		// Create inline keyboard with feature/unfeature, tags, edit and delete buttons
		var keyboard tgbotapi.InlineKeyboardMarkup
		if supplier.IsFeatured {
			keyboard = tgbotapi.NewInlineKeyboardMarkup(
				tgbotapi.NewInlineKeyboardRow(
					tgbotapi.NewInlineKeyboardButtonData("⭐ حذف برگزیده", fmt.Sprintf("unfeature_supplier_%d", supplier.ID)),
				),
				tgbotapi.NewInlineKeyboardRow(
					tgbotapi.NewInlineKeyboardButtonData("🏷️ تگ‌ها", fmt.Sprintf("tags_supplier_%d", supplier.ID)),
				),
				tgbotapi.NewInlineKeyboardRow(
					tgbotapi.NewInlineKeyboardButtonData("✏️ ویرایش", fmt.Sprintf("edit_supplier_%d", supplier.ID)),
					tgbotapi.NewInlineKeyboardButtonData("🗑️ حذف", fmt.Sprintf("delete_supplier_%d", supplier.ID)),
				),
			)
		} else {
			keyboard = tgbotapi.NewInlineKeyboardMarkup(
				tgbotapi.NewInlineKeyboardRow(
					tgbotapi.NewInlineKeyboardButtonData("⭐ برگزیده کن", fmt.Sprintf("feature_supplier_%d", supplier.ID)),
				),
				tgbotapi.NewInlineKeyboardRow(
					tgbotapi.NewInlineKeyboardButtonData("🏷️ تگ‌ها", fmt.Sprintf("tags_supplier_%d", supplier.ID)),
				),
				tgbotapi.NewInlineKeyboardRow(
					tgbotapi.NewInlineKeyboardButtonData("✏️ ویرایش", fmt.Sprintf("edit_supplier_%d", supplier.ID)),
					tgbotapi.NewInlineKeyboardButtonData("🗑️ حذف", fmt.Sprintf("delete_supplier_%d", supplier.ID)),
				),
			)
		}

		msg := tgbotapi.NewMessage(chatID, text)
		msg.ParseMode = "Markdown"
		msg.ReplyMarkup = keyboard
		s.bot.Send(msg)
		// Single result - clear session state
		sessionMutex.Lock()
		delete(sessionStates, chatID)
		sessionMutex.Unlock()
	} else {
		// Multiple results
		text := fmt.Sprintf("🔍 **نتایج جستجو** (%d نتیجه)\n\n", len(suppliers))
		for i, supplier := range suppliers {
			if i >= 10 {
				break
			}
			featuredIcon := ""
			if supplier.IsFeatured {
				featuredIcon = "⭐"
			}
			text += fmt.Sprintf("%s **#%d** - %s (%s)\n",
				featuredIcon, supplier.ID, supplier.FullName, supplier.Mobile)
		}

		text += "\n💡 برای مشاهده جزئیات و برگزیده کردن، شناسه (ID) را وارد کنید."

		msg := tgbotapi.NewMessage(chatID, text)
		msg.ParseMode = "Markdown"
		s.bot.Send(msg)

		// Keep session state active so user can enter ID
		sessionMutex.Lock()
		if sessionStates[chatID] == nil {
			sessionStates[chatID] = &SessionState{
				ChatID:          chatID,
				WaitingForInput: "search_supplier",
			}
		}
		sessionMutex.Unlock()
	}
}

func (s *TelegramService) showVisitorSearchPrompt(chatID int64) {
	msg := tgbotapi.NewMessage(chatID, "🔍 **جستجوی ویزیتور**\n\n"+
		"لطفا نام، شماره تماس یا شناسه ویزیتور را وارد کنید:\n\n"+
		"💡 می‌توانید بر اساس:\n"+
		"• نام ویزیتور\n"+
		"• شماره موبایل\n"+
		"• شناسه (ID)")
	msg.ParseMode = "Markdown"
	s.bot.Send(msg)

	// Set session state to wait for search query
	sessionMutex.Lock()
	sessionStates[chatID] = &SessionState{
		ChatID:          chatID,
		WaitingForInput: "search_visitor",
	}
	sessionMutex.Unlock()
}

func (s *TelegramService) handleVisitorSearch(chatID int64, query string) {
	var visitors []models.Visitor
	query = strings.TrimSpace(query)

	// Try to find by ID first
	if id, err := strconv.ParseUint(query, 10, 32); err == nil {
		var visitor models.Visitor
		if err := s.db.Preload("User").Where("id = ?", id).First(&visitor).Error; err == nil {
			visitors = []models.Visitor{visitor}
		}
	} else {
		// Search by name or mobile
		searchPattern := "%" + query + "%"
		s.db.Preload("User").Where(
			"full_name LIKE ? OR mobile LIKE ? OR national_id LIKE ?",
			searchPattern, searchPattern, searchPattern,
		).Limit(10).Find(&visitors)
	}

	if len(visitors) == 0 {
		msg := tgbotapi.NewMessage(chatID, "❌ ویزیتوری با این مشخصات یافت نشد.")
		s.bot.Send(msg)
		return
	}

	// Show results
	if len(visitors) == 1 {
		// Single result - show details with feature/unfeature button
		visitor := visitors[0]
		text := fmt.Sprintf("🔍 **نتیجه جستجو**\n\n"+
			"🚶‍♂️ **ویزیتور #%d**\n"+
			"👤 **نام:** %s\n"+
			"📱 **موبایل:** %s\n"+
			"🆔 **کد ملی:** %s\n"+
			"📍 **شهر:** %s\n"+
			"📊 **وضعیت:** %s\n",
			visitor.ID, visitor.FullName, visitor.Mobile,
			visitor.NationalID, visitor.CityProvince, visitor.Status)

		if visitor.IsFeatured {
			text += "⭐ **برگزیده:** ✅ بله\n"
		} else {
			text += "⭐ **برگزیده:** ❌ خیر\n"
		}

		// Create inline keyboard with feature/unfeature, edit and delete buttons
		var keyboard tgbotapi.InlineKeyboardMarkup
		if visitor.IsFeatured {
			keyboard = tgbotapi.NewInlineKeyboardMarkup(
				tgbotapi.NewInlineKeyboardRow(
					tgbotapi.NewInlineKeyboardButtonData("⭐ حذف برگزیده", fmt.Sprintf("unfeature_visitor_%d", visitor.ID)),
				),
				tgbotapi.NewInlineKeyboardRow(
					tgbotapi.NewInlineKeyboardButtonData("✏️ ویرایش", fmt.Sprintf("edit_visitor_%d", visitor.ID)),
					tgbotapi.NewInlineKeyboardButtonData("🗑️ حذف", fmt.Sprintf("delete_visitor_%d", visitor.ID)),
				),
			)
		} else {
			keyboard = tgbotapi.NewInlineKeyboardMarkup(
				tgbotapi.NewInlineKeyboardRow(
					tgbotapi.NewInlineKeyboardButtonData("⭐ برگزیده کن", fmt.Sprintf("feature_visitor_%d", visitor.ID)),
				),
				tgbotapi.NewInlineKeyboardRow(
					tgbotapi.NewInlineKeyboardButtonData("✏️ ویرایش", fmt.Sprintf("edit_visitor_%d", visitor.ID)),
					tgbotapi.NewInlineKeyboardButtonData("🗑️ حذف", fmt.Sprintf("delete_visitor_%d", visitor.ID)),
				),
			)
		}

		msg := tgbotapi.NewMessage(chatID, text)
		msg.ParseMode = "Markdown"
		msg.ReplyMarkup = keyboard
		s.bot.Send(msg)
		// Single result - clear session state
		sessionMutex.Lock()
		delete(sessionStates, chatID)
		sessionMutex.Unlock()
	} else {
		// Multiple results
		text := fmt.Sprintf("🔍 **نتایج جستجو** (%d نتیجه)\n\n", len(visitors))
		for i, visitor := range visitors {
			if i >= 10 {
				break
			}
			featuredIcon := ""
			if visitor.IsFeatured {
				featuredIcon = "⭐"
			}
			text += fmt.Sprintf("%s **#%d** - %s (%s)\n",
				featuredIcon, visitor.ID, visitor.FullName, visitor.Mobile)
		}

		text += "\n💡 برای مشاهده جزئیات و برگزیده کردن، شناسه (ID) را وارد کنید."

		msg := tgbotapi.NewMessage(chatID, text)
		msg.ParseMode = "Markdown"
		s.bot.Send(msg)

		// Keep session state active so user can enter ID
		sessionMutex.Lock()
		if sessionStates[chatID] == nil {
			sessionStates[chatID] = &SessionState{
				ChatID:          chatID,
				WaitingForInput: "search_visitor",
			}
		}
		sessionMutex.Unlock()
	}
}

func (s *TelegramService) showAvailableProductSearchPrompt(chatID int64) {
	msg := tgbotapi.NewMessage(chatID, "🔍 **جستجوی کالا**\n\n"+
		"لطفا نام کالا یا شناسه کالا را وارد کنید:\n\n"+
		"💡 می‌توانید بر اساس:\n"+
		"• نام کالا\n"+
		"• شناسه (ID)")
	msg.ParseMode = "Markdown"
	s.bot.Send(msg)

	// Set session state to wait for search query
	sessionMutex.Lock()
	sessionStates[chatID] = &SessionState{
		ChatID:          chatID,
		WaitingForInput: "search_available_product",
	}
	sessionMutex.Unlock()
}

func (s *TelegramService) handleAvailableProductSearch(chatID int64, query string) {
	var products []models.AvailableProduct
	query = strings.TrimSpace(query)

	// Try to find by ID first
	if id, err := strconv.ParseUint(query, 10, 32); err == nil {
		var product models.AvailableProduct
		if err := s.db.Preload("AddedBy").Where("id = ?", id).First(&product).Error; err == nil {
			products = []models.AvailableProduct{product}
		}
	} else {
		// Search by product name
		searchPattern := "%" + query + "%"
		s.db.Preload("AddedBy").Where(
			"product_name LIKE ? OR category LIKE ?",
			searchPattern, searchPattern,
		).Limit(10).Find(&products)
	}

	if len(products) == 0 {
		msg := tgbotapi.NewMessage(chatID, "❌ کالایی با این مشخصات یافت نشد.")
		s.bot.Send(msg)
		return
	}

	// Show results
	if len(products) == 1 {
		// Single result - show details with feature/unfeature button
		product := products[0]
		text := fmt.Sprintf("🔍 **نتیجه جستجو**\n\n"+
			"📦 **کالا #%d**\n"+
			"🏷️ **نام:** %s\n"+
			"📂 **دسته‌بندی:** %s\n"+
			"💰 **قیمت:** %s %s\n"+
			"📍 **موقعیت:** %s\n"+
			"📊 **وضعیت:** %s\n",
			product.ID, product.ProductName, product.Category,
			product.WholesalePrice, product.Currency,
			product.Location, product.Status)

		if product.IsFeatured {
			text += "⭐ **برگزیده:** ✅ بله\n"
		} else {
			text += "⭐ **برگزیده:** ❌ خیر\n"
		}

		// Create inline keyboard with feature/unfeature, edit and delete buttons
		var keyboard tgbotapi.InlineKeyboardMarkup
		if product.IsFeatured {
			keyboard = tgbotapi.NewInlineKeyboardMarkup(
				tgbotapi.NewInlineKeyboardRow(
					tgbotapi.NewInlineKeyboardButtonData("⭐ حذف برگزیده", fmt.Sprintf("unfeature_product_%d", product.ID)),
				),
				tgbotapi.NewInlineKeyboardRow(
					tgbotapi.NewInlineKeyboardButtonData("✏️ ویرایش", fmt.Sprintf("edit_available_product_%d", product.ID)),
					tgbotapi.NewInlineKeyboardButtonData("🗑️ حذف", fmt.Sprintf("delete_available_product_%d", product.ID)),
				),
			)
		} else {
			keyboard = tgbotapi.NewInlineKeyboardMarkup(
				tgbotapi.NewInlineKeyboardRow(
					tgbotapi.NewInlineKeyboardButtonData("⭐ برگزیده کن", fmt.Sprintf("feature_product_%d", product.ID)),
				),
				tgbotapi.NewInlineKeyboardRow(
					tgbotapi.NewInlineKeyboardButtonData("✏️ ویرایش", fmt.Sprintf("edit_available_product_%d", product.ID)),
					tgbotapi.NewInlineKeyboardButtonData("🗑️ حذف", fmt.Sprintf("delete_available_product_%d", product.ID)),
				),
			)
		}

		msg := tgbotapi.NewMessage(chatID, text)
		msg.ParseMode = "Markdown"
		msg.ReplyMarkup = keyboard
		s.bot.Send(msg)
		// Single result - clear session state
		sessionMutex.Lock()
		delete(sessionStates, chatID)
		sessionMutex.Unlock()
	} else {
		// Multiple results
		text := fmt.Sprintf("🔍 **نتایج جستجو** (%d نتیجه)\n\n", len(products))
		for i, product := range products {
			if i >= 10 {
				break
			}
			featuredIcon := ""
			if product.IsFeatured {
				featuredIcon = "⭐"
			}
			text += fmt.Sprintf("%s **#%d** - %s (%s)\n",
				featuredIcon, product.ID, product.ProductName, product.Category)
		}

		text += "\n💡 برای مشاهده جزئیات و برگزیده کردن، شناسه (ID) را وارد کنید."

		msg := tgbotapi.NewMessage(chatID, text)
		msg.ParseMode = "Markdown"
		s.bot.Send(msg)

		// Keep session state active so user can enter ID
		sessionMutex.Lock()
		if sessionStates[chatID] == nil {
			sessionStates[chatID] = &SessionState{
				ChatID:          chatID,
				WaitingForInput: "search_available_product",
			}
		}
		sessionMutex.Unlock()
	}
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
		text += fmt.Sprintf("🔧 عملیات: /rp_edit%d | /rp_delete%d\n", product.ID, product.ID)
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
	} else if licenseType == "plus4" {
		licenseTypeName = "پلاس 4 ماهه"
		duration = "4 ماه"
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
			tgbotapi.NewKeyboardButton(MENU_FEATURED_VISITORS),
			tgbotapi.NewKeyboardButton(MENU_ALL_VISITORS),
		),
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_SEARCH_VISITOR),
			tgbotapi.NewKeyboardButton(MENU_BACK),
		),
	)

	msg := tgbotapi.NewMessage(chatID,
		"🚶‍♂️ **مدیریت ویزیتورها**\n\n"+
			"لطفا گزینه مورد نظر خود را انتخاب کنید:\n\n"+
			"⏳ **در انتظار**: ویزیتورهای منتظر بررسی\n"+
			"✅ **تأیید شده**: ویزیتورهای فعال\n"+
			"❌ **رد شده**: ویزیتورهای رد شده\n"+
			"⭐ **برگزیده**: ویزیتورهای برگزیده\n"+
			"📋 **همه**: تمام ویزیتورها\n"+
			"🔍 **جستجو**: جستجوی ویزیتور برای برگزیده کردن\n"+
			"📊 **آمار**: آمار کلی ویزیتورها")

	msg.ParseMode = "Markdown"
	msg.ReplyMarkup = keyboard
	s.bot.Send(msg)
}

func (s *TelegramService) showVisitorsList(chatID int64, status string, page int) {
	const perPage = 5

	// Store pagination state and clear other pagination states
	paginationMutex.Lock()
	// Clear other pagination states to avoid conflicts
	delete(userPaginationStates, chatID)
	delete(supplierPaginationStates, chatID)
	delete(ticketPaginationStates, chatID)
	visitorPaginationStates[chatID] = &VisitorPagination{
		ChatID:  chatID,
		Page:    page,
		PerPage: perPage,
		Status:  status,
	}
	log.Printf("DEBUG: Stored visitor pagination state for chatID %d, page %d, status %s", chatID, page, status)
	paginationMutex.Unlock()

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
	case "featured":
		filterName = "⭐ ویزیتورهای برگزیده"
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

			// Featured icon
			featuredIcon := ""
			if visitor.IsFeatured {
				featuredIcon = "⭐"
			}

			visitorInfo := fmt.Sprintf(
				"**%d. %s%s %s**\n"+
					"📧 نام: %s\n"+
					"📱 موبایل: %s\n"+
					"🏘️ شهر/استان: %s\n"+
					"✈️ مقصد: %s\n"+
					"🌐 زبان: %s %s\n"+
					"🗓️ تاریخ ثبت‌نام: %s\n"+
					"%s وضعیت: %s%s\n",
				startItem+i,
				featuredIcon,
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
				func() string {
					if visitor.IsFeatured {
						return " | ⭐ برگزیده"
					}
					return ""
				}(),
			)

			// Add action buttons
			if visitor.Status == "pending" {
				visitorInfo += fmt.Sprintf(
					"🔘 عملیات: /vview%d | /vapprove%d | /vreject%d | /vedit%d | /vdelete%d\n",
					visitor.ID, visitor.ID, visitor.ID, visitor.ID, visitor.ID,
				)
			} else if visitor.Status == "approved" {
				if visitor.IsFeatured {
					visitorInfo += fmt.Sprintf(
						"🔧 عملیات: /vview%d | /vunfeature%d | /vedit%d | /vdelete%d\n",
						visitor.ID, visitor.ID, visitor.ID, visitor.ID,
					)
				} else {
					visitorInfo += fmt.Sprintf(
						"🔧 عملیات: /vview%d | /vfeature%d | /vedit%d | /vdelete%d\n",
						visitor.ID, visitor.ID, visitor.ID, visitor.ID,
					)
				}
			} else {
				visitorInfo += fmt.Sprintf(
					"🔧 عملیات: /vview%d | /vedit%d | /vdelete%d\n",
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

func (s *TelegramService) showFeaturedVisitorsList(chatID int64) {
	s.showVisitorsList(chatID, "featured", 1)
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

// =================== NEW EDIT/DELETE HANDLERS ===================

// Research Product Command Handlers
func (s *TelegramService) handleResearchProductCommands(chatID int64, text string) bool {
	// Commands for research products: /rp_edit123, /rp_delete123
	if strings.HasPrefix(text, "/rp_edit") && len(text) > 8 {
		productIDStr := strings.TrimPrefix(text, "/rp_edit")
		if productID, err := strconv.ParseUint(productIDStr, 10, 32); err == nil {
			s.promptResearchProductEdit(chatID, uint(productID))
			return true
		}
	} else if strings.HasPrefix(text, "/rp_delete") && len(text) > 10 {
		productIDStr := strings.TrimPrefix(text, "/rp_delete")
		if productID, err := strconv.ParseUint(productIDStr, 10, 32); err == nil {
			s.confirmResearchProductDelete(chatID, uint(productID))
			return true
		}
	}
	return false
}

// Available Product Command Handlers
func (s *TelegramService) handleAvailableProductCommands(chatID int64, text string) bool {
	// Commands for available products: /ap_edit123, /ap_delete123
	if strings.HasPrefix(text, "/ap_edit") && len(text) > 8 {
		productIDStr := strings.TrimPrefix(text, "/ap_edit")
		if productID, err := strconv.ParseUint(productIDStr, 10, 32); err == nil {
			s.promptAvailableProductEdit(chatID, uint(productID))
			return true
		}
	} else if strings.HasPrefix(text, "/ap_delete") && len(text) > 10 {
		productIDStr := strings.TrimPrefix(text, "/ap_delete")
		if productID, err := strconv.ParseUint(productIDStr, 10, 32); err == nil {
			s.confirmAvailableProductDelete(chatID, uint(productID))
			return true
		}
	}
	return false
}

// =================== SUPPLIER EDIT/DELETE ===================

func (s *TelegramService) promptSupplierEdit(chatID int64, supplierID uint) {
	// Get supplier info first
	var supplier models.Supplier
	err := s.db.Preload("User").Where("id = ?", supplierID).First(&supplier).Error
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ تأمین‌کننده یافت نشد")
		s.bot.Send(msg)
		return
	}

	// Show current info and prompt for edit
	editMsg := fmt.Sprintf("✏️ **ویرایش تأمین‌کننده #%d**\n\n"+
		"📋 **اطلاعات فعلی:**\n"+
		"👤 نام: %s\n"+
		"📱 موبایل: %s\n"+
		"🏙️ شهر: %s\n"+
		"🏢 برند: %s\n\n"+
		"📝 **برای ویرایش، اطلاعات را به فرمت زیر ارسال کنید:**\n\n"+
		"`نام|موبایل|شهر|برند`\n\n"+
		"**مثال:**\n"+
		"`احمد محمدی|09123456789|تهران|برند احمد`\n\n"+
		"💡 **نکته:** برای تغییر ندادن یک فیلد، همان مقدار قبلی را وارد کنید یا خالی بگذارید.\n\n"+
		"❌ برای لغو، '🔙 بازگشت' را ارسال کنید.",
		supplier.ID, supplier.FullName, supplier.Mobile, supplier.City, supplier.BrandName)

	// Set session state to wait for edit data
	sessionMutex.Lock()
	sessionStates[chatID] = &SessionState{
		ChatID:          chatID,
		WaitingForInput: fmt.Sprintf("edit_supplier_%d", supplierID),
		Data:            make(map[string]interface{}),
	}
	sessionMutex.Unlock()

	keyboard := tgbotapi.NewReplyKeyboard(
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_BACK),
		),
	)

	msg := tgbotapi.NewMessage(chatID, editMsg)
	msg.ParseMode = "Markdown"
	msg.ReplyMarkup = keyboard
	s.bot.Send(msg)
}

func (s *TelegramService) confirmSupplierDelete(chatID int64, supplierID uint) {
	// Get supplier info first
	var supplier models.Supplier
	err := s.db.Preload("User").Where("id = ?", supplierID).First(&supplier).Error
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ تأمین‌کننده یافت نشد")
		s.bot.Send(msg)
		return
	}

	// Create confirmation keyboard
	keyboard := tgbotapi.NewInlineKeyboardMarkup(
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("✅ بله، حذف کن", fmt.Sprintf("confirm_delete_supplier_%d", supplierID)),
			tgbotapi.NewInlineKeyboardButtonData("❌ لغو", "cancel_delete"),
		),
	)

	confirmMsg := fmt.Sprintf("🗑️ **تأیید حذف تأمین‌کننده**\n\n"+
		"👤 **نام:** %s\n"+
		"📱 **موبایل:** %s\n"+
		"🏙️ **شهر:** %s\n\n"+
		"⚠️ **هشدار:** این عمل غیرقابل بازگشت است!\n"+
		"تمام اطلاعات مربوط به این تأمین‌کننده حذف خواهد شد.\n\n"+
		"آیا مطمئن هستید؟", supplier.FullName, supplier.Mobile, supplier.City)

	msg := tgbotapi.NewMessage(chatID, confirmMsg)
	msg.ParseMode = "Markdown"
	msg.ReplyMarkup = keyboard
	s.bot.Send(msg)
}

// =================== VISITOR EDIT/DELETE ===================

func (s *TelegramService) promptVisitorEdit(chatID int64, visitorID uint) {
	// Get visitor info first
	var visitor models.Visitor
	err := s.db.Preload("User").Where("id = ?", visitorID).First(&visitor).Error
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ ویزیتور یافت نشد")
		s.bot.Send(msg)
		return
	}

	// Show current info and prompt for edit
	editMsg := fmt.Sprintf("✏️ **ویرایش ویزیتور #%d**\n\n"+
		"📋 **اطلاعات فعلی:**\n"+
		"👤 نام: %s\n"+
		"📱 موبایل: %s\n"+
		"🏙️ شهر/استان: %s\n"+
		"✈️ مقصد: %s\n\n"+
		"📝 **برای ویرایش، اطلاعات را به فرمت زیر ارسال کنید:**\n\n"+
		"`نام|موبایل|شهر/استان|مقصد`\n\n"+
		"**مثال:**\n"+
		"`احمد محمدی|09123456789|دبی امارات|مسقط عمان، ریاض عربستان`\n\n"+
		"💡 **نکته:** برای تغییر ندادن یک فیلد، همان مقدار قبلی را وارد کنید یا خالی بگذارید.\n\n"+
		"❌ برای لغو، '🔙 بازگشت' را ارسال کنید.",
		visitor.ID, visitor.FullName, visitor.Mobile, visitor.CityProvince, visitor.DestinationCities)

	// Set session state to wait for edit data
	sessionMutex.Lock()
	sessionStates[chatID] = &SessionState{
		ChatID:          chatID,
		WaitingForInput: fmt.Sprintf("edit_visitor_%d", visitorID),
		Data:            make(map[string]interface{}),
	}
	sessionMutex.Unlock()

	keyboard := tgbotapi.NewReplyKeyboard(
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_BACK),
		),
	)

	msg := tgbotapi.NewMessage(chatID, editMsg)
	msg.ParseMode = "Markdown"
	msg.ReplyMarkup = keyboard
	s.bot.Send(msg)
}

func (s *TelegramService) confirmVisitorDelete(chatID int64, visitorID uint) {
	// Get visitor info first
	var visitor models.Visitor
	err := s.db.Preload("User").Where("id = ?", visitorID).First(&visitor).Error
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ ویزیتور یافت نشد")
		s.bot.Send(msg)
		return
	}

	// Create confirmation keyboard
	keyboard := tgbotapi.NewInlineKeyboardMarkup(
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("✅ بله، حذف کن", fmt.Sprintf("confirm_delete_visitor_%d", visitorID)),
			tgbotapi.NewInlineKeyboardButtonData("❌ لغو", "cancel_delete"),
		),
	)

	confirmMsg := fmt.Sprintf("🗑️ **تأیید حذف ویزیتور**\n\n"+
		"👤 **نام:** %s\n"+
		"📱 **موبایل:** %s\n"+
		"🏙️ **شهر:** %s\n\n"+
		"⚠️ **هشدار:** این عمل غیرقابل بازگشت است!\n"+
		"تمام اطلاعات مربوط به این ویزیتور حذف خواهد شد.\n\n"+
		"آیا مطمئن هستید؟", visitor.FullName, visitor.Mobile, visitor.CityProvince)

	msg := tgbotapi.NewMessage(chatID, confirmMsg)
	msg.ParseMode = "Markdown"
	msg.ReplyMarkup = keyboard
	s.bot.Send(msg)
}

// =================== RESEARCH PRODUCT EDIT/DELETE ===================

func (s *TelegramService) promptResearchProductEdit(chatID int64, productID uint) {
	// Get product info first
	var product models.ResearchProduct
	err := s.db.Where("id = ?", productID).First(&product).Error
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ محصول تحقیقی یافت نشد")
		s.bot.Send(msg)
		return
	}

	// Show current info and prompt for edit
	editMsg := fmt.Sprintf("✏️ **ویرایش محصول تحقیقی #%d**\n\n"+
		"📋 **اطلاعات فعلی:**\n"+
		"📦 نام: %s\n"+
		"🏷️ دسته: %s\n"+
		"🌍 کشور هدف: %s\n"+
		"💰 قیمت صادرات: %s\n\n"+
		"📝 **برای ویرایش، اطلاعات را به فرمت زیر ارسال کنید:**\n\n"+
		"`نام|دسته|کشور هدف|قیمت صادرات`\n\n"+
		"**مثال:**\n"+
		"`زعفران درجه یک|کشاورزی|امارات|1000 دلار`\n\n"+
		"💡 **نکته:** برای تغییر ندادن یک فیلد، همان مقدار قبلی را وارد کنید یا خالی بگذارید.\n\n"+
		"❌ برای لغو، '🔙 بازگشت' را ارسال کنید.",
		product.ID, product.Name, product.Category, product.TargetCountry, product.ExportValue)

	// Set session state to wait for edit data
	sessionMutex.Lock()
	sessionStates[chatID] = &SessionState{
		ChatID:          chatID,
		WaitingForInput: fmt.Sprintf("edit_research_product_%d", productID),
		Data:            make(map[string]interface{}),
	}
	sessionMutex.Unlock()

	keyboard := tgbotapi.NewReplyKeyboard(
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_BACK),
		),
	)

	msg := tgbotapi.NewMessage(chatID, editMsg)
	msg.ParseMode = "Markdown"
	msg.ReplyMarkup = keyboard
	s.bot.Send(msg)
}

func (s *TelegramService) confirmResearchProductDelete(chatID int64, productID uint) {
	// Get product info first
	var product models.ResearchProduct
	err := s.db.Where("id = ?", productID).First(&product).Error
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ محصول تحقیقی یافت نشد")
		s.bot.Send(msg)
		return
	}

	// Create confirmation keyboard
	keyboard := tgbotapi.NewInlineKeyboardMarkup(
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("✅ بله، حذف کن", fmt.Sprintf("confirm_delete_research_%d", productID)),
			tgbotapi.NewInlineKeyboardButtonData("❌ لغو", "cancel_delete"),
		),
	)

	confirmMsg := fmt.Sprintf("🗑️ **تأیید حذف محصول تحقیقی**\n\n"+
		"📦 **نام:** %s\n"+
		"🏷️ **دسته:** %s\n"+
		"🌍 **کشور هدف:** %s\n\n"+
		"⚠️ **هشدار:** این عمل غیرقابل بازگشت است!\n"+
		"تمام اطلاعات مربوط به این محصول حذف خواهد شد.\n\n"+
		"آیا مطمئن هستید؟", product.Name, product.Category, product.TargetCountry)

	msg := tgbotapi.NewMessage(chatID, confirmMsg)
	msg.ParseMode = "Markdown"
	msg.ReplyMarkup = keyboard
	s.bot.Send(msg)
}

// =================== AVAILABLE PRODUCT EDIT/DELETE ===================

func (s *TelegramService) promptAvailableProductEdit(chatID int64, productID uint) {
	// Get product info first
	var product models.AvailableProduct
	err := s.db.Where("id = ?", productID).First(&product).Error
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ کالای موجود یافت نشد")
		s.bot.Send(msg)
		return
	}

	// Show current info and prompt for edit
	editMsg := fmt.Sprintf("✏️ **ویرایش کالای موجود #%d**\n\n"+
		"📋 **اطلاعات فعلی:**\n"+
		"📦 نام: %s\n"+
		"🏷️ دسته: %s\n"+
		"📍 مکان: %s\n"+
		"💰 قیمت: %s %s\n\n"+
		"📝 **برای ویرایش، اطلاعات را به فرمت زیر ارسال کنید:**\n\n"+
		"`نام|دسته|مکان|قیمت|واحد پول`\n\n"+
		"**مثال:**\n"+
		"`زعفران درجه یک|کشاورزی|تهران|5000000|تومان`\n\n"+
		"💡 **نکته:** برای تغییر ندادن یک فیلد، همان مقدار قبلی را وارد کنید یا خالی بگذارید.\n\n"+
		"❌ برای لغو، '🔙 بازگشت' را ارسال کنید.",
		product.ID, product.ProductName, product.Category, product.Location, product.WholesalePrice, product.Currency)

	// Set session state to wait for edit data
	sessionMutex.Lock()
	sessionStates[chatID] = &SessionState{
		ChatID:          chatID,
		WaitingForInput: fmt.Sprintf("edit_available_product_%d", productID),
		Data:            make(map[string]interface{}),
	}
	sessionMutex.Unlock()

	keyboard := tgbotapi.NewReplyKeyboard(
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_BACK),
		),
	)

	msg := tgbotapi.NewMessage(chatID, editMsg)
	msg.ParseMode = "Markdown"
	msg.ReplyMarkup = keyboard
	s.bot.Send(msg)
}

func (s *TelegramService) confirmAvailableProductDelete(chatID int64, productID uint) {
	// Get product info first
	var product models.AvailableProduct
	err := s.db.Where("id = ?", productID).First(&product).Error
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ کالای موجود یافت نشد")
		s.bot.Send(msg)
		return
	}

	// Create confirmation keyboard
	keyboard := tgbotapi.NewInlineKeyboardMarkup(
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("✅ بله، حذف کن", fmt.Sprintf("confirm_delete_available_%d", productID)),
			tgbotapi.NewInlineKeyboardButtonData("❌ لغو", "cancel_delete"),
		),
	)

	confirmMsg := fmt.Sprintf("🗑️ **تأیید حذف کالای موجود**\n\n"+
		"📦 **نام:** %s\n"+
		"🏷️ **دسته:** %s\n"+
		"📍 **مکان:** %s\n\n"+
		"⚠️ **هشدار:** این عمل غیرقابل بازگشت است!\n"+
		"تمام اطلاعات مربوط به این کالا حذف خواهد شد.\n\n"+
		"آیا مطمئن هستید؟", product.ProductName, product.Category, product.Location)

	msg := tgbotapi.NewMessage(chatID, confirmMsg)
	msg.ParseMode = "Markdown"
	msg.ReplyMarkup = keyboard
	s.bot.Send(msg)
}

// =================== AVAILABLE PRODUCTS MENU ===================

func (s *TelegramService) showAvailableProductsMenu(chatID int64) {
	keyboard := tgbotapi.NewReplyKeyboard(
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_ADD_AVAILABLE_PRODUCT),
			tgbotapi.NewKeyboardButton(MENU_LIST_AVAILABLE_PRODUCTS),
		),
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_AVAILABLE_PRODUCT_STATS),
			tgbotapi.NewKeyboardButton(MENU_SEARCH_AVAILABLE_PRODUCT),
		),
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_BACK),
		),
	)

	msg := tgbotapi.NewMessage(chatID,
		"📦 **مدیریت کالاهای موجود**\n\n"+
			"با استفاده از این بخش می‌توانید:\n\n"+
			"➕ **اضافه کردن کالا**: افزودن کالای جدید به لیست\n"+
			"📋 **لیست کالاها**: مشاهده و مدیریت کالاهای موجود\n"+
			"📊 **آمار کالاها**: نمایش آمار کلی کالاها\n"+
			"🔍 **جستجو**: جستجوی کالا برای برگزیده کردن\n\n"+
			"لطفا گزینه مورد نظر خود را انتخاب کنید:")

	msg.ParseMode = "Markdown"
	msg.ReplyMarkup = keyboard
	s.bot.Send(msg)
}

func (s *TelegramService) promptAddAvailableProduct(chatID int64) {
	s.promptAddSingleProduct(chatID) // Reuse existing function
}

func (s *TelegramService) showAvailableProductsList(chatID int64) {
	products, err := models.GetActiveAvailableProducts(s.db)
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ خطا در دریافت لیست کالاها")
		s.bot.Send(msg)
		return
	}

	if len(products) == 0 {
		msg := tgbotapi.NewMessage(chatID, "📋 **لیست کالاهای موجود**\n\nهنوز کالایی اضافه نشده است.")
		msg.ParseMode = "Markdown"
		s.bot.Send(msg)
		return
	}

	text := "📋 **لیست کالاهای موجود**\n\n"
	text += fmt.Sprintf("📊 **آمار:** %d کالا\n\n", len(products))

	for i, product := range products {
		if i >= 10 { // Limit to 10 products per message
			text += "...\n\n💡 *برای مشاهده کالاهای بیشتر از بخش مربوطه استفاده کنید*"
			break
		}

		statusEmoji := "📦"
		switch product.Status {
		case "active":
			statusEmoji = "✅"
		case "inactive":
			statusEmoji = "❌"
		case "out_of_stock":
			statusEmoji = "📤"
		}

		text += fmt.Sprintf("%d. **%s**\n", i+1, product.ProductName)
		text += fmt.Sprintf("🏷️ دسته: %s\n", product.Category)
		text += fmt.Sprintf("💰 قیمت: %s %s\n", product.WholesalePrice, product.Currency)
		text += fmt.Sprintf("📍 مکان: %s\n", product.Location)
		text += fmt.Sprintf("📊 موجودی: %d %s\n", product.AvailableQuantity, product.Unit)
		text += fmt.Sprintf("%s وضعیت: %s\n", statusEmoji, product.Status)
		text += fmt.Sprintf("🔧 عملیات: /ap_edit%d | /ap_delete%d\n", product.ID, product.ID)
		text += "➖➖➖➖➖➖➖➖\n"
	}

	msg := tgbotapi.NewMessage(chatID, text)
	msg.ParseMode = "Markdown"
	s.bot.Send(msg)
}

func (s *TelegramService) showAvailableProductsStats(chatID int64) {
	var total, active, inactive, outOfStock int64

	s.db.Model(&models.AvailableProduct{}).Count(&total)
	s.db.Model(&models.AvailableProduct{}).Where("status = ?", "active").Count(&active)
	s.db.Model(&models.AvailableProduct{}).Where("status = ?", "inactive").Count(&inactive)
	s.db.Model(&models.AvailableProduct{}).Where("status = ?", "out_of_stock").Count(&outOfStock)

	text := fmt.Sprintf(
		"📊 **آمار کالاهای موجود**\n\n"+
			"📈 **آمار کلی:**\n"+
			"• تعداد کل کالاها: `%d`\n"+
			"• فعال: `%d` کالا (%.1f%%)\n"+
			"• غیرفعال: `%d` کالا (%.1f%%)\n"+
			"• تمام شده: `%d` کالا (%.1f%%)\n",
		total,
		active, getSafePercentage(active, total),
		inactive, getSafePercentage(inactive, total),
		outOfStock, getSafePercentage(outOfStock, total),
	)

	msg := tgbotapi.NewMessage(chatID, text)
	msg.ParseMode = "Markdown"
	s.bot.Send(msg)
}

// =================== DELETE CONFIRMATION HANDLER ===================

func (s *TelegramService) handleDeleteConfirmation(query *tgbotapi.CallbackQuery) {
	data := query.Data
	chatID := query.Message.Chat.ID

	log.Printf("Processing delete confirmation: chatID %d, data: %s", chatID, data)

	// Parse callback data
	if strings.HasPrefix(data, "confirm_delete_supplier_") {
		idStr := strings.TrimPrefix(data, "confirm_delete_supplier_")
		if id, err := strconv.ParseUint(idStr, 10, 32); err == nil {
			s.executeSupplierDelete(chatID, uint(id))
		}
	} else if strings.HasPrefix(data, "confirm_delete_visitor_") {
		idStr := strings.TrimPrefix(data, "confirm_delete_visitor_")
		if id, err := strconv.ParseUint(idStr, 10, 32); err == nil {
			s.executeVisitorDelete(chatID, uint(id))
		}
	} else if strings.HasPrefix(data, "confirm_delete_research_") {
		idStr := strings.TrimPrefix(data, "confirm_delete_research_")
		if id, err := strconv.ParseUint(idStr, 10, 32); err == nil {
			s.executeResearchProductDelete(chatID, uint(id))
		}
	} else if strings.HasPrefix(data, "confirm_delete_available_") {
		idStr := strings.TrimPrefix(data, "confirm_delete_available_")
		if id, err := strconv.ParseUint(idStr, 10, 32); err == nil {
			s.executeAvailableProductDelete(chatID, uint(id))
		}
	} else {
		log.Printf("Unknown delete confirmation callback: %s", data)
	}

	// Send acknowledgment
	callback := tgbotapi.NewCallback(query.ID, "")
	s.bot.Request(callback)
}

// =================== DELETE EXECUTION FUNCTIONS ===================

func (s *TelegramService) executeSupplierDelete(chatID int64, supplierID uint) {
	// Get supplier info for final confirmation
	var supplier models.Supplier
	err := s.db.Preload("User").Where("id = ?", supplierID).First(&supplier).Error
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ تأمین‌کننده یافت نشد")
		s.bot.Send(msg)
		return
	}

	// Delete supplier (this will also delete related products due to cascade)
	err = s.db.Delete(&supplier).Error
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ خطا در حذف تأمین‌کننده")
		s.bot.Send(msg)
		return
	}

	successMsg := fmt.Sprintf("✅ **تأمین‌کننده با موفقیت حذف شد**\n\n"+
		"👤 **نام:** %s\n"+
		"📱 **موبایل:** %s\n"+
		"🏙️ **شهر:** %s\n\n"+
		"🗑️ تمام اطلاعات مربوط به این تأمین‌کننده حذف شدند.", supplier.FullName, supplier.Mobile, supplier.City)

	msg := tgbotapi.NewMessage(chatID, successMsg)
	msg.ParseMode = "Markdown"
	s.bot.Send(msg)
}

// handleUpgradeCallback handles upgrade-related callback queries
func (s *TelegramService) handleUpgradeCallback(query *tgbotapi.CallbackQuery) {
	data := query.Data
	chatID := query.Message.Chat.ID

	log.Printf("Handling upgrade callback: %s", data)

	// Send acknowledgment
	callback := tgbotapi.NewCallback(query.ID, "")
	s.bot.Request(callback)

	if strings.HasPrefix(data, "upgrade_approve_") {
		requestIDStr := strings.TrimPrefix(data, "upgrade_approve_")
		requestID, err := strconv.ParseUint(requestIDStr, 10, 32)
		if err != nil {
			msg := tgbotapi.NewMessage(chatID, "❌ خطا: شناسه درخواست نامعتبر است")
			s.bot.Send(msg)
			return
		}

		s.promptUpgradeApproval(chatID, uint(requestID))
	} else if strings.HasPrefix(data, "upgrade_reject_") {
		requestIDStr := strings.TrimPrefix(data, "upgrade_reject_")
		requestID, err := strconv.ParseUint(requestIDStr, 10, 32)
		if err != nil {
			msg := tgbotapi.NewMessage(chatID, "❌ خطا: شناسه درخواست نامعتبر است")
			s.bot.Send(msg)
			return
		}

		s.promptUpgradeRejection(chatID, uint(requestID))
	} else if strings.HasPrefix(data, "upgrade_details_") {
		requestIDStr := strings.TrimPrefix(data, "upgrade_details_")
		requestID, err := strconv.ParseUint(requestIDStr, 10, 32)
		if err != nil {
			msg := tgbotapi.NewMessage(chatID, "❌ خطا: شناسه درخواست نامعتبر است")
			s.bot.Send(msg)
			return
		}

		s.showUpgradeDetails(chatID, uint(requestID))
	}
}

// promptUpgradeApproval prompts admin for approval note
func (s *TelegramService) promptUpgradeApproval(chatID int64, requestID uint) {
	sessionMutex.Lock()
	sessionStates[chatID] = &SessionState{
		WaitingForInput: fmt.Sprintf("awaiting_upgrade_approval_note_%d", requestID),
		Data:            map[string]interface{}{"request_id": requestID},
	}
	sessionMutex.Unlock()

	message := "✅ **تایید درخواست ارتقا**\n\n" +
		"لطفاً یادداشت تایید را وارد کنید:\n" +
		"(مثلاً: درخواست شما تایید شد. لایسنس پرو فعال گردید.)\n\n" +
		"یا /cancel برای لغو عملیات."

	msg := tgbotapi.NewMessage(chatID, message)
	msg.ParseMode = "Markdown"
	s.bot.Send(msg)
}

// promptUpgradeRejection prompts admin for rejection reason
func (s *TelegramService) promptUpgradeRejection(chatID int64, requestID uint) {
	sessionMutex.Lock()
	sessionStates[chatID] = &SessionState{
		WaitingForInput: fmt.Sprintf("awaiting_upgrade_rejection_note_%d", requestID),
		Data:            map[string]interface{}{"request_id": requestID},
	}
	sessionMutex.Unlock()

	message := "❌ **رد درخواست ارتقا**\n\n" +
		"لطفاً دلیل رد درخواست را وارد کنید:\n" +
		"(مثلاً: درخواست شما به دلیل عدم تطابق شرایط رد شد.)\n\n" +
		"یا /cancel برای لغو عملیات."

	msg := tgbotapi.NewMessage(chatID, message)
	msg.ParseMode = "Markdown"
	s.bot.Send(msg)
}

// showUpgradeDetails shows detailed information about an upgrade request
func (s *TelegramService) showUpgradeDetails(chatID int64, requestID uint) {
	request, err := models.GetUpgradeRequestByID(models.DB, requestID)
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ خطا: درخواست یافت نشد")
		s.bot.Send(msg)
		return
	}

	var statusEmoji string
	switch request.Status {
	case models.UpgradeRequestStatusPending:
		statusEmoji = "🔄"
	case models.UpgradeRequestStatusApproved:
		statusEmoji = "✅"
	case models.UpgradeRequestStatusRejected:
		statusEmoji = "❌"
	}

	message := fmt.Sprintf(
		"📋 **جزئیات درخواست ارتقا**\n\n"+
			"🆔 **شناسه:** %d\n"+
			"👤 **کاربر:** %s\n"+
			"📧 **ایمیل:** %s\n"+
			"📱 **موبایل:** %s\n\n"+
			"📦 **از پلن:** %s\n"+
			"⬆️ **به پلن:** %s\n\n"+
			"%s **وضعیت:** %s\n"+
			"📅 **تاریخ درخواست:** %s\n\n"+
			"📝 **یادداشت کاربر:**\n%s",
		request.ID,
		request.User.Name(),
		request.User.Email,
		request.User.Mobile(),
		request.FromPlan,
		request.ToPlan,
		statusEmoji,
		string(request.Status),
		request.CreatedAt.Format("2006/01/02 15:04"),
		getDefaultIfEmpty(request.RequestNote, "بدون یادداشت"),
	)

	if request.Status != models.UpgradeRequestStatusPending {
		message += fmt.Sprintf(
			"\n\n📝 **یادداشت ادمین:**\n%s\n"+
				"📅 **تاریخ پردازش:** %s",
			getDefaultIfEmpty(request.AdminNote, "بدون یادداشت"),
			request.ProcessedAt.Format("2006/01/02 15:04"),
		)
	}

	msg := tgbotapi.NewMessage(chatID, message)
	msg.ParseMode = "Markdown"
	s.bot.Send(msg)
}

// handleUpgradeApprovalNote processes admin's approval note for upgrade request
func (s *TelegramService) handleUpgradeApprovalNote(message *tgbotapi.Message, state *SessionState) {
	chatID := message.Chat.ID
	adminNote := strings.TrimSpace(message.Text)

	requestID := state.Data["request_id"].(uint)

	// Clear session state
	sessionMutex.Lock()
	delete(sessionStates, chatID)
	sessionMutex.Unlock()

	// Update upgrade request status
	err := models.UpdateUpgradeRequestStatus(models.DB, requestID, models.UpgradeRequestStatusApproved, adminNote, 0)
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ خطا در تایید درخواست")
		s.bot.Send(msg)
		return
	}

	// Get request details to update user license
	request, err := models.GetUpgradeRequestByID(models.DB, requestID)
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ خطا در دریافت اطلاعات درخواست")
		s.bot.Send(msg)
		return
	}

	// Update user's license to Pro
	err = models.UpdateUserLicenseType(models.DB, request.UserID, "pro")
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ خطا در ارتقا لایسنس کاربر")
		s.bot.Send(msg)
		return
	}

	// Notify about successful upgrade
	s.NotifyUpgradeResult(request.UserID, true, adminNote)

	message_text := fmt.Sprintf(
		"✅ **درخواست ارتقا تایید شد**\n\n"+
			"👤 **کاربر:** %s\n"+
			"📦 **ارتقا:** %s → %s\n"+
			"📝 **یادداشت:** %s\n\n"+
			"🔄 لایسنس کاربر به پرو ارتقا یافت.",
		request.User.Name(),
		request.FromPlan, request.ToPlan,
		adminNote,
	)

	msg := tgbotapi.NewMessage(chatID, message_text)
	msg.ParseMode = "Markdown"
	s.bot.Send(msg)
}

// handleUpgradeRejectionNote processes admin's rejection note for upgrade request
func (s *TelegramService) handleUpgradeRejectionNote(message *tgbotapi.Message, state *SessionState) {
	chatID := message.Chat.ID
	adminNote := strings.TrimSpace(message.Text)

	if adminNote == "" {
		msg := tgbotapi.NewMessage(chatID, "❌ دلیل رد درخواست الزامی است. لطفاً دوباره وارد کنید.")
		s.bot.Send(msg)
		return
	}

	requestID := state.Data["request_id"].(uint)

	// Clear session state
	sessionMutex.Lock()
	delete(sessionStates, chatID)
	sessionMutex.Unlock()

	// Update upgrade request status
	err := models.UpdateUpgradeRequestStatus(models.DB, requestID, models.UpgradeRequestStatusRejected, adminNote, 0)
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ خطا در رد درخواست")
		s.bot.Send(msg)
		return
	}

	// Get request details for notification
	request, err := models.GetUpgradeRequestByID(models.DB, requestID)
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ خطا در دریافت اطلاعات درخواست")
		s.bot.Send(msg)
		return
	}

	// Notify about rejection
	s.NotifyUpgradeResult(request.UserID, false, adminNote)

	message_text := fmt.Sprintf(
		"❌ **درخواست ارتقا رد شد**\n\n"+
			"👤 **کاربر:** %s\n"+
			"📦 **درخواست:** %s → %s\n"+
			"📝 **دلیل رد:** %s",
		request.User.Name(),
		request.FromPlan, request.ToPlan,
		adminNote,
	)

	msg := tgbotapi.NewMessage(chatID, message_text)
	msg.ParseMode = "Markdown"
	s.bot.Send(msg)
}

func (s *TelegramService) executeVisitorDelete(chatID int64, visitorID uint) {
	log.Printf("Executing visitor delete: chatID %d, visitorID %d", chatID, visitorID)

	// Get visitor info for final confirmation
	var visitor models.Visitor
	err := s.db.Preload("User").Where("id = ?", visitorID).First(&visitor).Error
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ ویزیتور یافت نشد")
		s.bot.Send(msg)
		return
	}

	// Delete visitor
	err = s.db.Delete(&visitor).Error
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ خطا در حذف ویزیتور")
		s.bot.Send(msg)
		return
	}

	successMsg := fmt.Sprintf("✅ **ویزیتور با موفقیت حذف شد**\n\n"+
		"👤 **نام:** %s\n"+
		"📱 **موبایل:** %s\n"+
		"🏙️ **شهر:** %s\n\n"+
		"🗑️ تمام اطلاعات مربوط به این ویزیتور حذف شدند.", visitor.FullName, visitor.Mobile, visitor.CityProvince)

	msg := tgbotapi.NewMessage(chatID, successMsg)
	msg.ParseMode = "Markdown"
	s.bot.Send(msg)
}

func (s *TelegramService) executeResearchProductDelete(chatID int64, productID uint) {
	// Get product info for final confirmation
	var product models.ResearchProduct
	err := s.db.Where("id = ?", productID).First(&product).Error
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ محصول تحقیقی یافت نشد")
		s.bot.Send(msg)
		return
	}

	// Delete product
	err = s.db.Delete(&product).Error
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ خطا در حذف محصول تحقیقی")
		s.bot.Send(msg)
		return
	}

	successMsg := fmt.Sprintf("✅ **محصول تحقیقی با موفقیت حذف شد**\n\n"+
		"📦 **نام:** %s\n"+
		"🏷️ **دسته:** %s\n"+
		"🌍 **کشور هدف:** %s\n\n"+
		"🗑️ تمام اطلاعات مربوط به این محصول حذف شدند.", product.Name, product.Category, product.TargetCountry)

	msg := tgbotapi.NewMessage(chatID, successMsg)
	msg.ParseMode = "Markdown"
	s.bot.Send(msg)
}

func (s *TelegramService) executeAvailableProductDelete(chatID int64, productID uint) {
	// Get product info for final confirmation
	var product models.AvailableProduct
	err := s.db.Where("id = ?", productID).First(&product).Error
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ کالای موجود یافت نشد")
		s.bot.Send(msg)
		return
	}

	// Delete product
	err = s.db.Delete(&product).Error
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ خطا در حذف کالای موجود")
		s.bot.Send(msg)
		return
	}

	successMsg := fmt.Sprintf("✅ **کالای موجود با موفقیت حذف شد**\n\n"+
		"📦 **نام:** %s\n"+
		"🏷️ **دسته:** %s\n"+
		"📍 **مکان:** %s\n\n"+
		"🗑️ تمام اطلاعات مربوط به این کالا حذف شدند.", product.ProductName, product.Category, product.Location)

	msg := tgbotapi.NewMessage(chatID, successMsg)
	msg.ParseMode = "Markdown"
	s.bot.Send(msg)
}

// =================== EDIT INPUT HANDLERS ===================

func (s *TelegramService) handleSupplierEditInput(chatID int64, supplierID uint, inputText string) {
	// Check if user wants to cancel
	if inputText == MENU_BACK || inputText == "🔙 بازگشت" {
		sessionMutex.Lock()
		delete(sessionStates, chatID)
		sessionMutex.Unlock()
		msg := tgbotapi.NewMessage(chatID, "❌ عملیات ویرایش لغو شد.")
		s.bot.Send(msg)
		return
	}

	// Parse input: name|mobile|city|brand
	parts := strings.Split(inputText, "|")
	if len(parts) != 4 {
		msg := tgbotapi.NewMessage(chatID, "❌ فرمت ورودی نامعتبر است.\n\nلطفاً به فرمت زیر وارد کنید:\n`نام|موبایل|شهر|برند`")
		msg.ParseMode = "Markdown"
		s.bot.Send(msg)
		return
	}

	// Get supplier
	var supplier models.Supplier
	err := s.db.Where("id = ?", supplierID).First(&supplier).Error
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ تأمین‌کننده یافت نشد")
		s.bot.Send(msg)
		return
	}

	// Update fields (only if not empty)
	if strings.TrimSpace(parts[0]) != "" {
		supplier.FullName = strings.TrimSpace(parts[0])
	}
	if strings.TrimSpace(parts[1]) != "" {
		supplier.Mobile = strings.TrimSpace(parts[1])
	}
	if strings.TrimSpace(parts[2]) != "" {
		supplier.City = strings.TrimSpace(parts[2])
	}
	if strings.TrimSpace(parts[3]) != "" {
		supplier.BrandName = strings.TrimSpace(parts[3])
	}

	// Save changes
	err = s.db.Save(&supplier).Error
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ خطا در به‌روزرسانی تأمین‌کننده")
		s.bot.Send(msg)
		return
	}

	// Clear session
	sessionMutex.Lock()
	delete(sessionStates, chatID)
	sessionMutex.Unlock()

	successMsg := fmt.Sprintf("✅ **تأمین‌کننده با موفقیت به‌روزرسانی شد**\n\n"+
		"👤 **نام:** %s\n"+
		"📱 **موبایل:** %s\n"+
		"🏙️ **شهر:** %s\n"+
		"🏢 **برند:** %s",
		supplier.FullName, supplier.Mobile, supplier.City, supplier.BrandName)

	msg := tgbotapi.NewMessage(chatID, successMsg)
	msg.ParseMode = "Markdown"
	s.bot.Send(msg)
}

func (s *TelegramService) handleVisitorEditInput(chatID int64, visitorID uint, inputText string) {
	// Check if user wants to cancel
	if inputText == MENU_BACK || inputText == "🔙 بازگشت" {
		sessionMutex.Lock()
		delete(sessionStates, chatID)
		sessionMutex.Unlock()
		msg := tgbotapi.NewMessage(chatID, "❌ عملیات ویرایش لغو شد.")
		s.bot.Send(msg)
		return
	}

	// Parse input: name|mobile|city_province|destination_cities
	parts := strings.Split(inputText, "|")
	if len(parts) != 4 {
		msg := tgbotapi.NewMessage(chatID, "❌ فرمت ورودی نامعتبر است.\n\nلطفاً به فرمت زیر وارد کنید:\n`نام|موبایل|شهر/استان|مقصد`")
		msg.ParseMode = "Markdown"
		s.bot.Send(msg)
		return
	}

	// Get visitor
	var visitor models.Visitor
	err := s.db.Where("id = ?", visitorID).First(&visitor).Error
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ ویزیتور یافت نشد")
		s.bot.Send(msg)
		return
	}

	// Update fields (only if not empty)
	if strings.TrimSpace(parts[0]) != "" {
		visitor.FullName = strings.TrimSpace(parts[0])
	}
	if strings.TrimSpace(parts[1]) != "" {
		visitor.Mobile = strings.TrimSpace(parts[1])
	}
	if strings.TrimSpace(parts[2]) != "" {
		visitor.CityProvince = strings.TrimSpace(parts[2])
	}
	if strings.TrimSpace(parts[3]) != "" {
		visitor.DestinationCities = strings.TrimSpace(parts[3])
	}

	// Save changes
	err = s.db.Save(&visitor).Error
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ خطا در به‌روزرسانی ویزیتور")
		s.bot.Send(msg)
		return
	}

	// Clear session
	sessionMutex.Lock()
	delete(sessionStates, chatID)
	sessionMutex.Unlock()

	successMsg := fmt.Sprintf("✅ **ویزیتور با موفقیت به‌روزرسانی شد**\n\n"+
		"👤 **نام:** %s\n"+
		"📱 **موبایل:** %s\n"+
		"🏙️ **شهر/استان:** %s\n"+
		"✈️ **مقصد:** %s",
		visitor.FullName, visitor.Mobile, visitor.CityProvince, visitor.DestinationCities)

	msg := tgbotapi.NewMessage(chatID, successMsg)
	msg.ParseMode = "Markdown"
	s.bot.Send(msg)
}

func (s *TelegramService) handleResearchProductEditInput(chatID int64, productID uint, inputText string) {
	// Check if user wants to cancel
	if inputText == MENU_BACK || inputText == "🔙 بازگشت" {
		sessionMutex.Lock()
		delete(sessionStates, chatID)
		sessionMutex.Unlock()
		msg := tgbotapi.NewMessage(chatID, "❌ عملیات ویرایش لغو شد.")
		s.bot.Send(msg)
		return
	}

	// Parse input: name|category|target_country|export_value
	parts := strings.Split(inputText, "|")
	if len(parts) != 4 {
		msg := tgbotapi.NewMessage(chatID, "❌ فرمت ورودی نامعتبر است.\n\nلطفاً به فرمت زیر وارد کنید:\n`نام|دسته|کشور هدف|قیمت صادرات`")
		msg.ParseMode = "Markdown"
		s.bot.Send(msg)
		return
	}

	// Get product
	var product models.ResearchProduct
	err := s.db.Where("id = ?", productID).First(&product).Error
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ محصول تحقیقی یافت نشد")
		s.bot.Send(msg)
		return
	}

	// Update fields (only if not empty)
	if strings.TrimSpace(parts[0]) != "" {
		product.Name = strings.TrimSpace(parts[0])
	}
	if strings.TrimSpace(parts[1]) != "" {
		product.Category = strings.TrimSpace(parts[1])
	}
	if strings.TrimSpace(parts[2]) != "" {
		product.TargetCountry = strings.TrimSpace(parts[2])
	}
	if strings.TrimSpace(parts[3]) != "" {
		product.ExportValue = strings.TrimSpace(parts[3])
	}

	// Save changes
	err = s.db.Save(&product).Error
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ خطا در به‌روزرسانی محصول تحقیقی")
		s.bot.Send(msg)
		return
	}

	// Clear session
	sessionMutex.Lock()
	delete(sessionStates, chatID)
	sessionMutex.Unlock()

	successMsg := fmt.Sprintf("✅ **محصول تحقیقی با موفقیت به‌روزرسانی شد**\n\n"+
		"📦 **نام:** %s\n"+
		"🏷️ **دسته:** %s\n"+
		"🌍 **کشور هدف:** %s\n"+
		"💰 **قیمت صادرات:** %s",
		product.Name, product.Category, product.TargetCountry, product.ExportValue)

	msg := tgbotapi.NewMessage(chatID, successMsg)
	msg.ParseMode = "Markdown"
	s.bot.Send(msg)
}

func (s *TelegramService) handleAvailableProductEditInput(chatID int64, productID uint, inputText string) {
	// Check if user wants to cancel
	if inputText == MENU_BACK || inputText == "🔙 بازگشت" {
		sessionMutex.Lock()
		delete(sessionStates, chatID)
		sessionMutex.Unlock()
		msg := tgbotapi.NewMessage(chatID, "❌ عملیات ویرایش لغو شد.")
		s.bot.Send(msg)
		return
	}

	// Parse input: name|category|location|price|currency
	parts := strings.Split(inputText, "|")
	if len(parts) != 5 {
		msg := tgbotapi.NewMessage(chatID, "❌ فرمت ورودی نامعتبر است.\n\nلطفاً به فرمت زیر وارد کنید:\n`نام|دسته|مکان|قیمت|واحد پول`")
		msg.ParseMode = "Markdown"
		s.bot.Send(msg)
		return
	}

	// Get product
	var product models.AvailableProduct
	err := s.db.Where("id = ?", productID).First(&product).Error
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ کالای موجود یافت نشد")
		s.bot.Send(msg)
		return
	}

	// Update fields (only if not empty)
	if strings.TrimSpace(parts[0]) != "" {
		product.ProductName = strings.TrimSpace(parts[0])
	}
	if strings.TrimSpace(parts[1]) != "" {
		product.Category = strings.TrimSpace(parts[1])
	}
	if strings.TrimSpace(parts[2]) != "" {
		product.Location = strings.TrimSpace(parts[2])
	}
	if strings.TrimSpace(parts[3]) != "" {
		product.WholesalePrice = strings.TrimSpace(parts[3])
	}
	if strings.TrimSpace(parts[4]) != "" {
		product.Currency = strings.TrimSpace(parts[4])
	}

	// Save changes
	err = s.db.Save(&product).Error
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ خطا در به‌روزرسانی کالای موجود")
		s.bot.Send(msg)
		return
	}

	// Clear session
	sessionMutex.Lock()
	delete(sessionStates, chatID)
	sessionMutex.Unlock()

	successMsg := fmt.Sprintf("✅ **کالای موجود با موفقیت به‌روزرسانی شد**\n\n"+
		"📦 **نام:** %s\n"+
		"🏷️ **دسته:** %s\n"+
		"📍 **مکان:** %s\n"+
		"💰 **قیمت:** %s %s",
		product.ProductName, product.Category, product.Location, product.WholesalePrice, product.Currency)

	msg := tgbotapi.NewMessage(chatID, successMsg)
	msg.ParseMode = "Markdown"
	s.bot.Send(msg)
}

func (s *TelegramService) handleAvailableProductFeature(chatID int64, productID uint) {
	var product models.AvailableProduct
	if err := s.db.Where("id = ?", productID).First(&product).Error; err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ کالا یافت نشد")
		s.bot.Send(msg)
		return
	}

	// Update product to featured
	product.IsFeatured = true
	if err := s.db.Save(&product).Error; err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ خطا در برگزیده کردن کالا")
		s.bot.Send(msg)
		return
	}

	msg := tgbotapi.NewMessage(chatID, fmt.Sprintf("⭐ کالا #%d (%s) به عنوان برگزیده انتخاب شد", productID, product.ProductName))
	s.bot.Send(msg)
}

func (s *TelegramService) handleAvailableProductUnfeature(chatID int64, productID uint) {
	var product models.AvailableProduct
	if err := s.db.Where("id = ?", productID).First(&product).Error; err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ کالا یافت نشد")
		s.bot.Send(msg)
		return
	}

	// Update product to unfeatured
	product.IsFeatured = false
	if err := s.db.Save(&product).Error; err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ خطا در حذف برگزیده کالا")
		s.bot.Send(msg)
		return
	}

	msg := tgbotapi.NewMessage(chatID, fmt.Sprintf("⭐ کالا #%d (%s) از لیست برگزیده‌ها حذف شد", productID, product.ProductName))
	s.bot.Send(msg)
}

// Support Ticket Management Functions

func (s *TelegramService) showSupportTicketsMenu(chatID int64) {
	keyboard := tgbotapi.NewReplyKeyboard(
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_OPEN_TICKETS),
			tgbotapi.NewKeyboardButton(MENU_IN_PROGRESS_TICKETS),
		),
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_WAITING_TICKETS),
			tgbotapi.NewKeyboardButton(MENU_CLOSED_TICKETS),
		),
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_ALL_TICKETS),
			tgbotapi.NewKeyboardButton(MENU_TICKET_STATS),
		),
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_BACK),
		),
	)

	msg := tgbotapi.NewMessage(chatID,
		"🎫 **مدیریت تیکت‌های پشتیبانی**\n\n"+
			"با استفاده از این بخش می‌توانید:\n\n"+
			"📬 **تیکت‌های باز**: مشاهده تیکت‌های جدید\n"+
			"🔄 **در حال بررسی**: تیکت‌هایی که در دست بررسی هستند\n"+
			"⏳ **منتظر پاسخ**: تیکت‌هایی که منتظر پاسخ کاربر هستند\n"+
			"✅ **بسته شده**: تیکت‌های حل شده\n"+
			"📋 **همه تیکت‌ها**: مشاهده تمام تیکت‌ها\n"+
			"📊 **آمار تیکت‌ها**: نمایش آمار کلی\n\n"+
			"لطفا گزینه مورد نظر خود را انتخاب کنید:")

	msg.ParseMode = "Markdown"
	msg.ReplyMarkup = keyboard
	s.bot.Send(msg)
}

func (s *TelegramService) showSupportTicketsList(chatID int64, status string, page int) {
	const perPage = 10

	// Store pagination state and clear other pagination states
	paginationMutex.Lock()
	// Clear other pagination states to avoid conflicts
	delete(userPaginationStates, chatID)
	delete(supplierPaginationStates, chatID)
	delete(visitorPaginationStates, chatID)
	ticketPaginationStates[chatID] = &TicketPagination{
		ChatID:  chatID,
		Page:    page,
		PerPage: perPage,
		Status:  status,
	}
	paginationMutex.Unlock()

	offset := (page - 1) * perPage

	var tickets []models.SupportTicket
	var total int64
	query := s.db.Model(&models.SupportTicket{}).Preload("User").Preload("Messages")

	// Apply status filter
	switch status {
	case "open":
		query = query.Where("status = ?", "open")
	case "in_progress":
		query = query.Where("status = ?", "in_progress")
	case "waiting_response":
		query = query.Where("status = ?", "waiting_response")
	case "closed":
		query = query.Where("status = ?", "closed")
	case "all":
		// No filter, show all tickets
	default:
		query = query.Where("status = ?", "open")
	}

	// Get total count
	query.Count(&total)

	// Get paginated results
	if err := query.Order("created_at DESC").Offset(offset).Limit(perPage).Find(&tickets).Error; err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ خطا در دریافت لیست تیکت‌ها")
		s.bot.Send(msg)
		return
	}

	if len(tickets) == 0 {
		statusText := s.getTicketStatusText(status)
		msg := tgbotapi.NewMessage(chatID, fmt.Sprintf("❌ هیچ تیکت %s یافت نشد.", statusText))
		s.bot.Send(msg)
		return
	}

	// Calculate pagination info
	totalPages := (int(total) + perPage - 1) / perPage
	if totalPages == 0 {
		totalPages = 1
	}
	startItem := offset + 1
	endItem := offset + len(tickets)

	var message strings.Builder
	statusText := s.getTicketStatusText(status)
	message.WriteString(fmt.Sprintf("🎫 **تیکت‌های %s**\n\n", statusText))
	message.WriteString(fmt.Sprintf("📊 **آمار**: %d تیکت | صفحه %d از %d\n", total, page, totalPages))
	message.WriteString(fmt.Sprintf("👀 **نمایش**: %d تا %d\n\n", startItem, endItem))

	for i, ticket := range tickets {
		priorityIcon := s.getPriorityIcon(ticket.Priority)
		categoryIcon := s.getCategoryIcon(ticket.Category)

		message.WriteString(fmt.Sprintf("%d. %s %s **%s**\n",
			startItem+i, priorityIcon, categoryIcon, ticket.Title))
		message.WriteString(fmt.Sprintf("   👤 کاربر: %s %s\n",
			ticket.User.FirstName, ticket.User.LastName))
		message.WriteString(fmt.Sprintf("   📱 تلفن: %s\n", ticket.User.Phone))
		message.WriteString(fmt.Sprintf("   📅 تاریخ: %s\n",
			ticket.CreatedAt.Format("2006/01/02 15:04")))
		message.WriteString(fmt.Sprintf("   💬 پیام‌ها: %d\n", len(ticket.Messages)))
		message.WriteString(fmt.Sprintf("   🎯 دسته: %s | اولویت: %s\n",
			s.getCategoryName(ticket.Category), s.getPriorityName(ticket.Priority)))

		// Add action buttons for active tickets
		if ticket.Status == "open" || ticket.Status == "in_progress" || ticket.Status == "waiting_response" {
			message.WriteString(fmt.Sprintf("   🔗 دستورات: /viewticket%d /respondticket%d /closeticket%d\n",
				ticket.ID, ticket.ID, ticket.ID))
		} else {
			message.WriteString(fmt.Sprintf("   🔗 مشاهده: /viewticket%d\n", ticket.ID))
		}
		message.WriteString("\n")
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

	messageText := message.String()

	// Check message length and split if needed (Telegram limit: 4096 characters)
	const maxMessageLength = 4000 // Leave some margin
	messages := splitLongMessage(messageText, maxMessageLength)

	// Send first message with keyboard
	if len(messages) > 0 {
		msg := tgbotapi.NewMessage(chatID, messages[0])
		msg.ParseMode = "Markdown"
		msg.ReplyMarkup = keyboard
		if _, err := s.bot.Send(msg); err != nil {
			log.Printf("ERROR: Failed to send tickets list message (status: %s, page: %d): %v", status, page, err)
			log.Printf("DEBUG: Message length: %d chars", len(messages[0]))
			// Try sending as plain text without markdown
			msg2 := tgbotapi.NewMessage(chatID, messages[0])
			msg2.ReplyMarkup = keyboard
			if _, err2 := s.bot.Send(msg2); err2 != nil {
				log.Printf("ERROR: Failed to send as plain text too: %v", err2)
				errorMsg := tgbotapi.NewMessage(chatID, fmt.Sprintf("❌ خطا در ارسال لیست تیکت‌ها\n\nوضعیت: %s\nصفحه: %d", statusText, page))
				s.bot.Send(errorMsg)
			}
		}

		// Send remaining parts if any (without keyboard)
		for i := 1; i < len(messages); i++ {
			msg := tgbotapi.NewMessage(chatID, messages[i])
			msg.ParseMode = "Markdown"
			if _, err := s.bot.Send(msg); err != nil {
				log.Printf("ERROR: Failed to send tickets list part %d: %v", i+1, err)
				// Try as plain text
				msg2 := tgbotapi.NewMessage(chatID, messages[i])
				s.bot.Send(msg2)
			}
		}
	}
}

func (s *TelegramService) showSupportTicketsStats(chatID int64) {
	var openTickets, inProgressTickets, waitingTickets, closedTickets, totalTickets int64

	// Get ticket counts by status
	s.db.Model(&models.SupportTicket{}).Where("status = ?", "open").Count(&openTickets)
	s.db.Model(&models.SupportTicket{}).Where("status = ?", "in_progress").Count(&inProgressTickets)
	s.db.Model(&models.SupportTicket{}).Where("status = ?", "waiting_response").Count(&waitingTickets)
	s.db.Model(&models.SupportTicket{}).Where("status = ?", "closed").Count(&closedTickets)
	s.db.Model(&models.SupportTicket{}).Count(&totalTickets)

	// Get priority stats
	var lowPriority, mediumPriority, highPriority, urgentPriority int64
	s.db.Model(&models.SupportTicket{}).Where("priority = ? AND status != ?", "low", "closed").Count(&lowPriority)
	s.db.Model(&models.SupportTicket{}).Where("priority = ? AND status != ?", "medium", "closed").Count(&mediumPriority)
	s.db.Model(&models.SupportTicket{}).Where("priority = ? AND status != ?", "high", "closed").Count(&highPriority)
	s.db.Model(&models.SupportTicket{}).Where("priority = ? AND status != ?", "urgent", "closed").Count(&urgentPriority)

	// Get category stats
	var technicalTickets, billingTickets, licenseTickets, generalTickets int64
	s.db.Model(&models.SupportTicket{}).Where("category = ? AND status != ?", "technical", "closed").Count(&technicalTickets)
	s.db.Model(&models.SupportTicket{}).Where("category = ? AND status != ?", "billing", "closed").Count(&billingTickets)
	s.db.Model(&models.SupportTicket{}).Where("category = ? AND status != ?", "license", "closed").Count(&licenseTickets)
	s.db.Model(&models.SupportTicket{}).Where("category = ? AND status != ?", "general", "closed").Count(&generalTickets)

	// Get latest ticket
	var latestTicket models.SupportTicket
	s.db.Preload("User").Order("created_at DESC").First(&latestTicket)

	message := fmt.Sprintf(
		"📊 **آمار تیکت‌های پشتیبانی**\n\n"+
			"📈 **آمار کلی:**\n"+
			"🎫 کل تیکت‌ها: **%d**\n"+
			"📬 باز: **%d**\n"+
			"🔄 در حال بررسی: **%d**\n"+
			"⏳ منتظر پاسخ: **%d**\n"+
			"✅ بسته شده: **%d**\n\n"+
			"🎯 **بر اساس اولویت (فعال):**\n"+
			"🔴 فوری: **%d**\n"+
			"🟠 بالا: **%d**\n"+
			"🟡 متوسط: **%d**\n"+
			"🟢 پایین: **%d**\n\n"+
			"📂 **بر اساس دسته‌بندی (فعال):**\n"+
			"🔧 فنی: **%d**\n"+
			"💰 مالی: **%d**\n"+
			"🔑 لایسنس: **%d**\n"+
			"📝 عمومی: **%d**\n\n",
		totalTickets, openTickets, inProgressTickets, waitingTickets, closedTickets,
		urgentPriority, highPriority, mediumPriority, lowPriority,
		technicalTickets, billingTickets, licenseTickets, generalTickets,
	)

	if latestTicket.ID > 0 {
		message += fmt.Sprintf(
			"🆕 **آخرین تیکت:**\n"+
				"📝 عنوان: %s\n"+
				"👤 کاربر: %s %s\n"+
				"📅 تاریخ: %s\n",
			latestTicket.Title,
			latestTicket.User.FirstName, latestTicket.User.LastName,
			latestTicket.CreatedAt.Format("2006/01/02 15:04"),
		)
	}

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

// Helper functions for support tickets

func (s *TelegramService) getTicketStatusText(status string) string {
	switch status {
	case "open":
		return "باز"
	case "in_progress":
		return "در حال بررسی"
	case "waiting_response":
		return "منتظر پاسخ کاربر"
	case "closed":
		return "بسته شده"
	case "all":
		return "همه"
	default:
		return "باز"
	}
}

func (s *TelegramService) getPriorityIcon(priority string) string {
	switch priority {
	case "urgent":
		return "🔴"
	case "high":
		return "🟠"
	case "medium":
		return "🟡"
	case "low":
		return "🟢"
	default:
		return "🟡"
	}
}

func (s *TelegramService) getPriorityName(priority string) string {
	switch priority {
	case "urgent":
		return "فوری"
	case "high":
		return "بالا"
	case "medium":
		return "متوسط"
	case "low":
		return "پایین"
	default:
		return "متوسط"
	}
}

func (s *TelegramService) getCategoryIcon(category string) string {
	switch category {
	case "technical":
		return "🔧"
	case "billing":
		return "💰"
	case "license":
		return "🔑"
	case "general":
		return "📝"
	default:
		return "📝"
	}
}

func (s *TelegramService) getCategoryName(category string) string {
	switch category {
	case "technical":
		return "فنی"
	case "billing":
		return "مالی"
	case "license":
		return "لایسنس"
	case "general":
		return "عمومی"
	default:
		return "عمومی"
	}
}

// Support Ticket Command Handlers

func (s *TelegramService) handleSupportTicketCommands(chatID int64, text string) bool {
	// Check for support ticket action commands: /view_ticket_123, /respond_ticket_123, /close_ticket_123
	if strings.HasPrefix(text, "/view_ticket_") && len(text) > 13 {
		ticketIDStr := strings.TrimPrefix(text, "/view_ticket_")
		if ticketID, err := strconv.ParseUint(ticketIDStr, 10, 32); err == nil {
			s.showSupportTicketDetails(chatID, uint(ticketID))
			return true
		}
	}

	if strings.HasPrefix(text, "/respond_ticket_") && len(text) > 16 {
		ticketIDStr := strings.TrimPrefix(text, "/respond_ticket_")
		if ticketID, err := strconv.ParseUint(ticketIDStr, 10, 32); err == nil {
			s.promptTicketResponse(chatID, uint(ticketID))
			return true
		}
	}

	if strings.HasPrefix(text, "/close_ticket_") && len(text) > 14 {
		ticketIDStr := strings.TrimPrefix(text, "/close_ticket_")
		if ticketID, err := strconv.ParseUint(ticketIDStr, 10, 32); err == nil {
			s.handleTicketClose(chatID, uint(ticketID))
			return true
		}
	}

	// Also handle the old format for backward compatibility
	if strings.HasPrefix(text, "/viewticket") && len(text) > 11 {
		ticketIDStr := strings.TrimPrefix(text, "/viewticket")
		if ticketID, err := strconv.ParseUint(ticketIDStr, 10, 32); err == nil {
			s.showSupportTicketDetails(chatID, uint(ticketID))
			return true
		}
	}

	if strings.HasPrefix(text, "/respondticket") && len(text) > 13 {
		ticketIDStr := strings.TrimPrefix(text, "/respondticket")
		if ticketID, err := strconv.ParseUint(ticketIDStr, 10, 32); err == nil {
			s.promptTicketResponse(chatID, uint(ticketID))
			return true
		}
	}

	if strings.HasPrefix(text, "/closeticket") && len(text) > 12 {
		ticketIDStr := strings.TrimPrefix(text, "/closeticket")
		if ticketID, err := strconv.ParseUint(ticketIDStr, 10, 32); err == nil {
			s.handleTicketClose(chatID, uint(ticketID))
			return true
		}
	}

	return false
}

func (s *TelegramService) showSupportTicketDetails(chatID int64, ticketID uint) {
	var ticket models.SupportTicket
	err := s.db.Preload("User").Preload("Messages").Where("id = ?", ticketID).First(&ticket).Error
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ تیکت یافت نشد")
		s.bot.Send(msg)
		return
	}

	priorityIcon := s.getPriorityIcon(ticket.Priority)
	categoryIcon := s.getCategoryIcon(ticket.Category)

	var message strings.Builder
	message.WriteString(fmt.Sprintf("🎫 **جزئیات تیکت #%d**\n\n", ticket.ID))
	message.WriteString(fmt.Sprintf("📝 **عنوان:** %s\n", ticket.Title))
	message.WriteString(fmt.Sprintf("👤 **کاربر:** %s %s\n", ticket.User.FirstName, ticket.User.LastName))
	message.WriteString(fmt.Sprintf("📱 **تلفن:** %s\n", ticket.User.Phone))
	message.WriteString(fmt.Sprintf("📧 **ایمیل:** %s\n", ticket.User.Email))
	message.WriteString(fmt.Sprintf("🎯 **دسته:** %s %s\n", categoryIcon, s.getCategoryName(ticket.Category)))
	message.WriteString(fmt.Sprintf("⚡ **اولویت:** %s %s\n", priorityIcon, s.getPriorityName(ticket.Priority)))
	message.WriteString(fmt.Sprintf("📊 **وضعیت:** %s\n", s.getTicketStatusText(ticket.Status)))
	message.WriteString(fmt.Sprintf("📅 **تاریخ ایجاد:** %s\n\n", ticket.CreatedAt.Format("2006/01/02 15:04")))

	message.WriteString(fmt.Sprintf("📄 **توضیحات:**\n%s\n\n", ticket.Description))

	if len(ticket.Messages) > 0 {
		// Count admin and user messages
		adminMsgCount := 0
		userMsgCount := 0
		for _, msg := range ticket.Messages {
			if msg.IsAdmin {
				adminMsgCount++
			} else {
				userMsgCount++
			}
		}

		message.WriteString(fmt.Sprintf("💬 **مکالمه (%d پیام):**\n", len(ticket.Messages)))
		message.WriteString(fmt.Sprintf("   🛡️ پشتیبانی: %d پیام | 👤 کاربر: %d پیام\n\n", adminMsgCount, userMsgCount))

		for _, msg := range ticket.Messages {
			if msg.IsAdmin {
				message.WriteString(fmt.Sprintf("🛡️ **پشتیبانی** - %s\n", msg.CreatedAt.Format("2006/01/02 15:04")))
			} else {
				message.WriteString(fmt.Sprintf("👤 **کاربر** - %s\n", msg.CreatedAt.Format("2006/01/02 15:04")))
			}
			message.WriteString(fmt.Sprintf("📝 %s\n\n", msg.Message))
		}

		// Show last message info
		if len(ticket.Messages) > 0 {
			lastMsg := ticket.Messages[len(ticket.Messages)-1]
			lastSender := "👤 کاربر"
			if lastMsg.IsAdmin {
				lastSender = "🛡️ پشتیبانی"
			}
			message.WriteString(fmt.Sprintf("🕐 **آخرین پیام:** %s - %s\n\n", lastSender, lastMsg.CreatedAt.Format("2006/01/02 15:04")))
		}
	} else {
		message.WriteString("💬 **مکالمه:** هیچ پیامی وجود ندارد\n\n")
	}

	// Action buttons based on status
	var keyboard tgbotapi.ReplyKeyboardMarkup
	if ticket.Status == "open" || ticket.Status == "in_progress" || ticket.Status == "waiting_response" {
		// Check if there are any admin messages
		hasAdminResponse := false
		for _, msg := range ticket.Messages {
			if msg.IsAdmin {
				hasAdminResponse = true
				break
			}
		}

		// If no admin response yet, or status is not waiting_response, show respond button
		if !hasAdminResponse || ticket.Status != "waiting_response" {
			keyboard = tgbotapi.NewReplyKeyboard(
				tgbotapi.NewKeyboardButtonRow(
					tgbotapi.NewKeyboardButton(fmt.Sprintf("/respond_ticket_%d", ticket.ID)),
					tgbotapi.NewKeyboardButton(fmt.Sprintf("/close_ticket_%d", ticket.ID)),
				),
				tgbotapi.NewKeyboardButtonRow(
					tgbotapi.NewKeyboardButton(MENU_BACK),
				),
			)
		} else {
			// If admin has responded and waiting for user, show limited options
			keyboard = tgbotapi.NewReplyKeyboard(
				tgbotapi.NewKeyboardButtonRow(
					tgbotapi.NewKeyboardButton(fmt.Sprintf("/respond_ticket_%d", ticket.ID)),
					tgbotapi.NewKeyboardButton(fmt.Sprintf("/close_ticket_%d", ticket.ID)),
				),
				tgbotapi.NewKeyboardButtonRow(
					tgbotapi.NewKeyboardButton(MENU_BACK),
				),
			)
		}
	} else {
		keyboard = tgbotapi.NewReplyKeyboard(
			tgbotapi.NewKeyboardButtonRow(
				tgbotapi.NewKeyboardButton(MENU_BACK),
			),
		)
	}

	messageText := message.String()

	// Check message length and split if needed (Telegram limit: 4096 characters)
	const maxMessageLength = 4000 // Leave some margin
	messages := splitLongMessage(messageText, maxMessageLength)

	// Send first message with keyboard
	if len(messages) > 0 {
		msg := tgbotapi.NewMessage(chatID, messages[0])
		msg.ParseMode = "Markdown"
		msg.ReplyMarkup = keyboard
		if _, err := s.bot.Send(msg); err != nil {
			log.Printf("ERROR: Failed to send ticket details message (ID %d): %v", ticketID, err)
			log.Printf("DEBUG: Message length: %d chars", len(messages[0]))
			// Try sending as plain text without markdown
			msg2 := tgbotapi.NewMessage(chatID, messages[0])
			msg2.ReplyMarkup = keyboard
			if _, err2 := s.bot.Send(msg2); err2 != nil {
				log.Printf("ERROR: Failed to send as plain text too: %v", err2)
				// Send error message to user
				errorMsg := tgbotapi.NewMessage(chatID, fmt.Sprintf("❌ خطا در ارسال جزئیات تیکت #%d\n\nپیام حاوی محتوای نامعتبر است.", ticketID))
				s.bot.Send(errorMsg)
			}
		}

		// Send remaining parts if any (without keyboard)
		for i := 1; i < len(messages); i++ {
			msg := tgbotapi.NewMessage(chatID, messages[i])
			msg.ParseMode = "Markdown"
			if _, err := s.bot.Send(msg); err != nil {
				log.Printf("ERROR: Failed to send ticket details part %d: %v", i+1, err)
				// Try as plain text
				msg2 := tgbotapi.NewMessage(chatID, messages[i])
				s.bot.Send(msg2)
			}
		}
	}
}

func (s *TelegramService) promptTicketResponse(chatID int64, ticketID uint) {
	var ticket models.SupportTicket
	err := s.db.Where("id = ?", ticketID).First(&ticket).Error
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ تیکت یافت نشد")
		s.bot.Send(msg)
		return
	}

	if ticket.Status == "closed" {
		msg := tgbotapi.NewMessage(chatID, "❌ این تیکت بسته شده و امکان پاسخ وجود ندارد")
		s.bot.Send(msg)
		return
	}

	// Set session state to wait for response
	sessionMutex.Lock()
	sessionStates[chatID] = &SessionState{
		ChatID:          chatID,
		WaitingForInput: fmt.Sprintf("ticket_response_%d", ticketID),
		Data: map[string]interface{}{
			"ticket_id": ticketID,
		},
	}
	sessionMutex.Unlock()

	// Create keyboard with back option
	keyboard := tgbotapi.NewReplyKeyboard(
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_BACK),
		),
	)

	msg := tgbotapi.NewMessage(chatID, fmt.Sprintf("💬 **پاسخ به تیکت #%d**\n\n📝 **عنوان:** %s\n\nلطفاً پاسخ خود را بنویسید:\n\n💡 **نکته:** برای لغو، دکمه 'بازگشت' را بزنید", ticketID, ticket.Title))
	msg.ParseMode = "Markdown"
	msg.ReplyMarkup = keyboard
	s.bot.Send(msg)
}

func (s *TelegramService) handleTicketClose(chatID int64, ticketID uint) {
	var ticket models.SupportTicket
	err := s.db.Where("id = ?", ticketID).First(&ticket).Error
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ تیکت یافت نشد")
		s.bot.Send(msg)
		return
	}

	if ticket.Status == "closed" {
		msg := tgbotapi.NewMessage(chatID, "❌ این تیکت قبلاً بسته شده است")
		s.bot.Send(msg)
		return
	}

	// Update ticket status to closed
	err = s.db.Model(&ticket).Update("status", "closed").Error
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ خطا در بستن تیکت")
		s.bot.Send(msg)
		return
	}

	// Load user info for notification
	var user models.User
	s.db.Where("id = ?", ticket.UserID).First(&user)

	successMsg := fmt.Sprintf("✅ **تیکت بسته شد**\n\n"+
		"📋 شناسه تیکت: #%d\n"+
		"👤 کاربر: %s %s (%s)\n"+
		"📝 عنوان: %s\n\n"+
		"🔒 وضعیت: بسته شده توسط ادمین",
		ticket.ID, user.FirstName, user.LastName, user.Phone, ticket.Title)

	msg := tgbotapi.NewMessage(chatID, successMsg)
	msg.ParseMode = "Markdown"
	s.bot.Send(msg)

	// Optionally, you could send a notification to the user here
	// via Telegram if they have connected their Telegram account
}

func (s *TelegramService) handleTicketResponse(chatID int64, ticketID uint, responseText string) {
	responseText = strings.TrimSpace(responseText)
	if responseText == "" {
		msg := tgbotapi.NewMessage(chatID, "❌ پاسخ نمی‌تواند خالی باشد")
		s.bot.Send(msg)
		return
	}

	// Load ticket
	var ticket models.SupportTicket
	err := s.db.Preload("User").Where("id = ?", ticketID).First(&ticket).Error
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ تیکت یافت نشد")
		s.bot.Send(msg)
		return
	}

	if ticket.Status == "closed" {
		msg := tgbotapi.NewMessage(chatID, "❌ این تیکت بسته شده و امکان پاسخ وجود ندارد")
		s.bot.Send(msg)
		return
	}

	// Create admin message
	ticketMessage := models.SupportTicketMessage{
		TicketID: ticketID,
		Message:  responseText,
		IsAdmin:  true,
		SenderID: nil, // Admin message, no user sender
	}

	err = s.db.Create(&ticketMessage).Error
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ خطا در ارسال پاسخ")
		s.bot.Send(msg)
		return
	}

	// Update ticket status to waiting_response (admin responded, waiting for user)
	s.db.Model(&ticket).Update("status", "waiting_response")

	successMsg := fmt.Sprintf("✅ **پاسخ ارسال شد**\n\n"+
		"📋 تیکت #%d\n"+
		"👤 کاربر: %s %s (%s)\n"+
		"📝 عنوان: %s\n\n"+
		"💬 **پاسخ شما:**\n%s\n\n"+
		"📊 وضعیت تیکت: منتظر پاسخ کاربر",
		ticket.ID, ticket.User.FirstName, ticket.User.LastName, ticket.User.Phone, ticket.Title, responseText)

	msg := tgbotapi.NewMessage(chatID, successMsg)
	msg.ParseMode = "Markdown"
	s.bot.Send(msg)

	// Show main menu
	s.showMainMenu(chatID)
}

// showNotificationMenu shows the notification management menu
func (s *TelegramService) showNotificationMenu(chatID int64) {
	keyboard := tgbotapi.NewReplyKeyboard(
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_SEND_NOTIFICATION),
		),
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_NOTIFICATION_HISTORY),
			tgbotapi.NewKeyboardButton(MENU_NOTIFICATION_STATS),
		),
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton("🔙 بازگشت به منو اصلی"),
		),
	)
	keyboard.ResizeKeyboard = true

	msg := tgbotapi.NewMessage(chatID, "🔔 **مدیریت نوتیفیکیشن‌ها**\n\nلطفا یکی از گزینه‌های زیر را انتخاب کنید:")
	msg.ParseMode = "Markdown"
	msg.ReplyMarkup = keyboard
	s.bot.Send(msg)
}

// showNotificationStats shows notification statistics
func (s *TelegramService) showNotificationStats(chatID int64) {
	// Get notification stats from database
	var stats struct {
		Total  int64 `json:"total"`
		Active int64 `json:"active"`
		Unread int64 `json:"unread"`
	}

	// Count total notifications
	s.db.Model(&models.Notification{}).Count(&stats.Total)

	// Count active notifications
	s.db.Model(&models.Notification{}).Where("is_active = ?", true).Count(&stats.Active)

	// Count unread notifications
	s.db.Model(&models.Notification{}).Where("is_active = ? AND is_read = ?", true, false).Count(&stats.Unread)

	// Get notifications by type
	var typeStats []struct {
		Type  string `json:"type"`
		Count int64  `json:"count"`
	}
	s.db.Model(&models.Notification{}).Select("type, count(*) as count").Group("type").Find(&typeStats)

	// Format type stats
	typeStatsText := ""
	for _, stat := range typeStats {
		typeStatsText += fmt.Sprintf("• %s: %d\n", stat.Type, stat.Count)
	}

	statsText := fmt.Sprintf("📊 **آمار نوتیفیکیشن‌ها**\n\n"+
		"📈 **آمار کلی:**\n"+
		"• کل نوتیفیکیشن‌ها: %d\n"+
		"• نوتیفیکیشن‌های فعال: %d\n"+
		"• نوتیفیکیشن‌های خوانده نشده: %d\n\n"+
		"📋 **توزیع بر اساس نوع:**\n%s",
		stats.Total, stats.Active, stats.Unread, typeStatsText)

	msg := tgbotapi.NewMessage(chatID, statsText)
	msg.ParseMode = "Markdown"
	s.bot.Send(msg)

	// Show notification menu again
	s.showNotificationMenu(chatID)
}

// promptSendNotification prompts admin to send a notification
func (s *TelegramService) promptSendNotification(chatID int64) {
	// Set session state
	sessionMutex.Lock()
	sessionStates[chatID] = &SessionState{
		State: "waiting_notification_title",
		Data:  make(map[string]interface{}),
	}
	sessionMutex.Unlock()

	msg := tgbotapi.NewMessage(chatID, "📤 **ارسال نوتیفیکیشن جدید**\n\n"+
		"لطفا عنوان نوتیفیکیشن را ارسال کنید:")
	msg.ParseMode = "Markdown"
	s.bot.Send(msg)
}

// handleNotificationInput handles notification input from admin
func (s *TelegramService) handleNotificationInput(chatID int64, text string) {
	sessionMutex.RLock()
	state, exists := sessionStates[chatID]
	sessionMutex.RUnlock()

	if !exists {
		return
	}

	switch state.State {
	case "waiting_notification_title":
		// Store title and ask for message
		state.Data["title"] = text
		state.State = "waiting_notification_message"
		sessionMutex.Lock()
		sessionStates[chatID] = state
		sessionMutex.Unlock()

		msg := tgbotapi.NewMessage(chatID, "✅ عنوان ذخیره شد\n\n"+
			"لطفا متن نوتیفیکیشن را ارسال کنید:")
		s.bot.Send(msg)

	case "waiting_notification_message":
		// Store message and ask for type
		state.Data["message"] = text
		state.State = "waiting_notification_type"
		sessionMutex.Lock()
		sessionStates[chatID] = state
		sessionMutex.Unlock()

		keyboard := tgbotapi.NewInlineKeyboardMarkup(
			tgbotapi.NewInlineKeyboardRow(
				tgbotapi.NewInlineKeyboardButtonData("ℹ️ اطلاعات", "notif_type_info"),
				tgbotapi.NewInlineKeyboardButtonData("✅ موفقیت", "notif_type_success"),
			),
			tgbotapi.NewInlineKeyboardRow(
				tgbotapi.NewInlineKeyboardButtonData("⚠️ هشدار", "notif_type_warning"),
				tgbotapi.NewInlineKeyboardButtonData("❌ خطا", "notif_type_error"),
			),
		)

		msg := tgbotapi.NewMessage(chatID, "✅ متن ذخیره شد\n\n"+
			"لطفا نوع نوتیفیکیشن را انتخاب کنید:")
		msg.ReplyMarkup = keyboard
		s.bot.Send(msg)

	case "waiting_notification_priority":
		// Store priority and ask for target
		state.Data["priority"] = text
		state.State = "waiting_notification_target"
		sessionMutex.Lock()
		sessionStates[chatID] = state
		sessionMutex.Unlock()

		keyboard := tgbotapi.NewInlineKeyboardMarkup(
			tgbotapi.NewInlineKeyboardRow(
				tgbotapi.NewInlineKeyboardButtonData("🌐 همه کاربران", "notif_target_all"),
			),
			tgbotapi.NewInlineKeyboardRow(
				tgbotapi.NewInlineKeyboardButtonData("👤 کاربر خاص", "notif_target_user"),
			),
		)

		msg := tgbotapi.NewMessage(chatID, "✅ اولویت ذخیره شد\n\n"+
			"لطفا مخاطب نوتیفیکیشن را انتخاب کنید:")
		msg.ReplyMarkup = keyboard
		s.bot.Send(msg)

	case "waiting_notification_user_id":
		// Store user ID and create notification
		userID, err := strconv.ParseUint(text, 10, 64)
		if err != nil {
			msg := tgbotapi.NewMessage(chatID, "❌ شناسه کاربر نامعتبر است. لطفا عدد صحیح وارد کنید:")
			s.bot.Send(msg)
			return
		}

		state.Data["user_id"] = userID
		sessionMutex.Lock()
		sessionStates[chatID] = state
		sessionMutex.Unlock()

		s.createNotification(chatID, state.Data)
	}
}

// createNotification creates a notification based on collected data
func (s *TelegramService) createNotification(chatID int64, data map[string]interface{}) {
	// Get admin user ID (assuming first admin)
	adminID := uint(1) // You might want to get this from the database

	// Prepare notification data
	notificationData := models.CreateNotificationRequest{
		Title:    data["title"].(string),
		Message:  data["message"].(string),
		Type:     data["type"].(string),
		Priority: data["priority"].(string),
	}

	// Set user ID if specified
	if userID, exists := data["user_id"]; exists {
		userIDUint := uint(userID.(uint64))
		notificationData.UserID = &userIDUint
	}

	// Create notification
	notification, err := models.CreateNotification(s.db, adminID, notificationData)
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ خطا در ایجاد نوتیفیکیشن: "+err.Error())
		s.bot.Send(msg)
		return
	}

	// Send FCM push notification
	pushService := GetPushNotificationService()
	pushMessage := PushMessage{
		Title:   notification.Title,
		Message: notification.Message,
		Icon:    "/pwa.png",
		Tag:     fmt.Sprintf("notification-%d", notification.ID),
		Data: map[string]interface{}{
			"url":  notification.ActionURL,
			"type": notification.Type,
		},
	}

	// Send to specific user or all users
	if notification.UserID != nil {
		// Send to specific user
		if err := pushService.SendPushNotification(*notification.UserID, pushMessage); err != nil {
			log.Printf("Failed to send FCM push notification to user %d: %v", *notification.UserID, err)
		}
	} else {
		// Broadcast to all users
		if err := pushService.SendPushNotificationToAll(pushMessage); err != nil {
			log.Printf("Failed to send FCM push notification to all users: %v", err)
		}
	}

	// Clear session state
	sessionMutex.Lock()
	delete(sessionStates, chatID)
	sessionMutex.Unlock()

	// Send success message
	targetText := "همه کاربران"
	if notification.UserID != nil {
		targetText = fmt.Sprintf("کاربر #%d", *notification.UserID)
	}

	successMsg := fmt.Sprintf("✅ **نوتیفیکیشن با موفقیت ارسال شد**\n\n"+
		"📋 **جزئیات:**\n"+
		"• شناسه: #%d\n"+
		"• عنوان: %s\n"+
		"• نوع: %s\n"+
		"• اولویت: %s\n"+
		"• مخاطب: %s\n\n"+
		"📱 نوتیفیکیشن در header کاربران و از طریق FCM Push ارسال شد.",
		notification.ID, notification.Title, notification.Type, notification.Priority, targetText)

	msg := tgbotapi.NewMessage(chatID, successMsg)
	msg.ParseMode = "Markdown"
	s.bot.Send(msg)

	// Show notification menu
	s.showNotificationMenu(chatID)
}

// showNotificationHistory shows notification history for admin
func (s *TelegramService) showNotificationHistory(chatID int64) {
	// Get recent notifications (last 20)
	var notifications []models.Notification
	err := s.db.Preload("CreatedBy").Order("created_at DESC").Limit(20).Find(&notifications).Error
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ خطا در دریافت تاریخچه نوتیفیکیشن‌ها")
		s.bot.Send(msg)
		return
	}

	if len(notifications) == 0 {
		msg := tgbotapi.NewMessage(chatID, "📋 **تاریخچه نوتیفیکیشن‌ها**\n\n"+
			"هیچ نوتیفیکیشنی ارسال نشده است.")
		msg.ParseMode = "Markdown"

		// Add back button
		keyboard := tgbotapi.NewReplyKeyboard(
			tgbotapi.NewKeyboardButtonRow(
				tgbotapi.NewKeyboardButton("🔙 بازگشت به منو نوتیفیکیشن‌ها"),
			),
		)
		keyboard.ResizeKeyboard = true
		msg.ReplyMarkup = keyboard

		s.bot.Send(msg)
		return
	}

	var message strings.Builder
	message.WriteString("📋 **تاریخچه نوتیفیکیشن‌ها** (آخرین ۲۰ مورد)\n\n")

	for i, notification := range notifications {
		// Get type and priority emojis
		typeEmoji := "ℹ️"
		switch notification.Type {
		case "success":
			typeEmoji = "✅"
		case "warning":
			typeEmoji = "⚠️"
		case "error":
			typeEmoji = "❌"
		}

		priorityEmoji := "🟡"
		switch notification.Priority {
		case "urgent":
			priorityEmoji = "🔴"
		case "high":
			priorityEmoji = "🟠"
		case "low":
			priorityEmoji = "🟢"
		}

		// Target info
		target := "همه کاربران"
		if notification.UserID != nil {
			target = fmt.Sprintf("کاربر #%d", *notification.UserID)
		}

		// Status
		status := "✅ فعال"
		if !notification.IsActive {
			status = "❌ غیرفعال"
		}

		message.WriteString(fmt.Sprintf("%d. %s %s **%s**\n",
			i+1, typeEmoji, priorityEmoji, notification.Title))
		message.WriteString(fmt.Sprintf("   📝 %s\n", notification.Message))
		message.WriteString(fmt.Sprintf("   👤 ارسال‌کننده: %s %s\n",
			notification.CreatedBy.FirstName, notification.CreatedBy.LastName))
		message.WriteString(fmt.Sprintf("   🎯 مخاطب: %s\n", target))
		message.WriteString(fmt.Sprintf("   📊 وضعیت: %s\n", status))
		message.WriteString(fmt.Sprintf("   📅 تاریخ: %s\n\n",
			notification.CreatedAt.Format("2006/01/02 15:04")))
	}

	msg := tgbotapi.NewMessage(chatID, message.String())
	msg.ParseMode = "Markdown"

	// Add back button
	keyboard := tgbotapi.NewReplyKeyboard(
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton("🔙 بازگشت به منو نوتیفیکیشن‌ها"),
		),
	)
	keyboard.ResizeKeyboard = true
	msg.ReplyMarkup = keyboard

	s.bot.Send(msg)
}

// handleNotificationCallback handles notification-related callback queries
func (s *TelegramService) handleNotificationCallback(query *tgbotapi.CallbackQuery) {
	data := query.Data
	chatID := query.Message.Chat.ID

	// Send acknowledgment
	callback := tgbotapi.NewCallback(query.ID, "")
	s.bot.Request(callback)

	sessionMutex.RLock()
	state, exists := sessionStates[chatID]
	sessionMutex.RUnlock()

	if !exists {
		return
	}

	switch data {
	case "notif_type_info":
		state.Data["type"] = "info"
		state.State = "waiting_notification_priority"
		sessionMutex.Lock()
		sessionStates[chatID] = state
		sessionMutex.Unlock()

		keyboard := tgbotapi.NewInlineKeyboardMarkup(
			tgbotapi.NewInlineKeyboardRow(
				tgbotapi.NewInlineKeyboardButtonData("🔴 فوری", "notif_priority_urgent"),
				tgbotapi.NewInlineKeyboardButtonData("🟠 بالا", "notif_priority_high"),
			),
			tgbotapi.NewInlineKeyboardRow(
				tgbotapi.NewInlineKeyboardButtonData("🟡 متوسط", "notif_priority_normal"),
				tgbotapi.NewInlineKeyboardButtonData("🟢 پایین", "notif_priority_low"),
			),
		)

		msg := tgbotapi.NewMessage(chatID, "✅ نوع اطلاعات انتخاب شد\n\n"+
			"لطفا اولویت نوتیفیکیشن را انتخاب کنید:")
		msg.ReplyMarkup = keyboard
		s.bot.Send(msg)

	case "notif_type_success":
		state.Data["type"] = "success"
		state.State = "waiting_notification_priority"
		sessionMutex.Lock()
		sessionStates[chatID] = state
		sessionMutex.Unlock()

		keyboard := tgbotapi.NewInlineKeyboardMarkup(
			tgbotapi.NewInlineKeyboardRow(
				tgbotapi.NewInlineKeyboardButtonData("🔴 فوری", "notif_priority_urgent"),
				tgbotapi.NewInlineKeyboardButtonData("🟠 بالا", "notif_priority_high"),
			),
			tgbotapi.NewInlineKeyboardRow(
				tgbotapi.NewInlineKeyboardButtonData("🟡 متوسط", "notif_priority_normal"),
				tgbotapi.NewInlineKeyboardButtonData("🟢 پایین", "notif_priority_low"),
			),
		)

		msg := tgbotapi.NewMessage(chatID, "✅ نوع موفقیت انتخاب شد\n\n"+
			"لطفا اولویت نوتیفیکیشن را انتخاب کنید:")
		msg.ReplyMarkup = keyboard
		s.bot.Send(msg)

	case "notif_type_warning":
		state.Data["type"] = "warning"
		state.State = "waiting_notification_priority"
		sessionMutex.Lock()
		sessionStates[chatID] = state
		sessionMutex.Unlock()

		keyboard := tgbotapi.NewInlineKeyboardMarkup(
			tgbotapi.NewInlineKeyboardRow(
				tgbotapi.NewInlineKeyboardButtonData("🔴 فوری", "notif_priority_urgent"),
				tgbotapi.NewInlineKeyboardButtonData("🟠 بالا", "notif_priority_high"),
			),
			tgbotapi.NewInlineKeyboardRow(
				tgbotapi.NewInlineKeyboardButtonData("🟡 متوسط", "notif_priority_normal"),
				tgbotapi.NewInlineKeyboardButtonData("🟢 پایین", "notif_priority_low"),
			),
		)

		msg := tgbotapi.NewMessage(chatID, "✅ نوع هشدار انتخاب شد\n\n"+
			"لطفا اولویت نوتیفیکیشن را انتخاب کنید:")
		msg.ReplyMarkup = keyboard
		s.bot.Send(msg)

	case "notif_type_error":
		state.Data["type"] = "error"
		state.State = "waiting_notification_priority"
		sessionMutex.Lock()
		sessionStates[chatID] = state
		sessionMutex.Unlock()

		keyboard := tgbotapi.NewInlineKeyboardMarkup(
			tgbotapi.NewInlineKeyboardRow(
				tgbotapi.NewInlineKeyboardButtonData("🔴 فوری", "notif_priority_urgent"),
				tgbotapi.NewInlineKeyboardButtonData("🟠 بالا", "notif_priority_high"),
			),
			tgbotapi.NewInlineKeyboardRow(
				tgbotapi.NewInlineKeyboardButtonData("🟡 متوسط", "notif_priority_normal"),
				tgbotapi.NewInlineKeyboardButtonData("🟢 پایین", "notif_priority_low"),
			),
		)

		msg := tgbotapi.NewMessage(chatID, "✅ نوع خطا انتخاب شد\n\n"+
			"لطفا اولویت نوتیفیکیشن را انتخاب کنید:")
		msg.ReplyMarkup = keyboard
		s.bot.Send(msg)

	case "notif_priority_urgent":
		state.Data["priority"] = "urgent"
		state.State = "waiting_notification_target"
		sessionMutex.Lock()
		sessionStates[chatID] = state
		sessionMutex.Unlock()

		keyboard := tgbotapi.NewInlineKeyboardMarkup(
			tgbotapi.NewInlineKeyboardRow(
				tgbotapi.NewInlineKeyboardButtonData("🌐 همه کاربران", "notif_target_all"),
			),
			tgbotapi.NewInlineKeyboardRow(
				tgbotapi.NewInlineKeyboardButtonData("👤 کاربر خاص", "notif_target_user"),
			),
		)

		msg := tgbotapi.NewMessage(chatID, "✅ اولویت فوری انتخاب شد\n\n"+
			"لطفا مخاطب نوتیفیکیشن را انتخاب کنید:")
		msg.ReplyMarkup = keyboard
		s.bot.Send(msg)

	case "notif_priority_high":
		state.Data["priority"] = "high"
		state.State = "waiting_notification_target"
		sessionMutex.Lock()
		sessionStates[chatID] = state
		sessionMutex.Unlock()

		keyboard := tgbotapi.NewInlineKeyboardMarkup(
			tgbotapi.NewInlineKeyboardRow(
				tgbotapi.NewInlineKeyboardButtonData("🌐 همه کاربران", "notif_target_all"),
			),
			tgbotapi.NewInlineKeyboardRow(
				tgbotapi.NewInlineKeyboardButtonData("👤 کاربر خاص", "notif_target_user"),
			),
		)

		msg := tgbotapi.NewMessage(chatID, "✅ اولویت بالا انتخاب شد\n\n"+
			"لطفا مخاطب نوتیفیکیشن را انتخاب کنید:")
		msg.ReplyMarkup = keyboard
		s.bot.Send(msg)

	case "notif_priority_normal":
		state.Data["priority"] = "normal"
		state.State = "waiting_notification_target"
		sessionMutex.Lock()
		sessionStates[chatID] = state
		sessionMutex.Unlock()

		keyboard := tgbotapi.NewInlineKeyboardMarkup(
			tgbotapi.NewInlineKeyboardRow(
				tgbotapi.NewInlineKeyboardButtonData("🌐 همه کاربران", "notif_target_all"),
			),
			tgbotapi.NewInlineKeyboardRow(
				tgbotapi.NewInlineKeyboardButtonData("👤 کاربر خاص", "notif_target_user"),
			),
		)

		msg := tgbotapi.NewMessage(chatID, "✅ اولویت متوسط انتخاب شد\n\n"+
			"لطفا مخاطب نوتیفیکیشن را انتخاب کنید:")
		msg.ReplyMarkup = keyboard
		s.bot.Send(msg)

	case "notif_priority_low":
		state.Data["priority"] = "low"
		state.State = "waiting_notification_target"
		sessionMutex.Lock()
		sessionStates[chatID] = state
		sessionMutex.Unlock()

		keyboard := tgbotapi.NewInlineKeyboardMarkup(
			tgbotapi.NewInlineKeyboardRow(
				tgbotapi.NewInlineKeyboardButtonData("🌐 همه کاربران", "notif_target_all"),
			),
			tgbotapi.NewInlineKeyboardRow(
				tgbotapi.NewInlineKeyboardButtonData("👤 کاربر خاص", "notif_target_user"),
			),
		)

		msg := tgbotapi.NewMessage(chatID, "✅ اولویت پایین انتخاب شد\n\n"+
			"لطفا مخاطب نوتیفیکیشن را انتخاب کنید:")
		msg.ReplyMarkup = keyboard
		s.bot.Send(msg)

	case "notif_target_all":
		// Send to all users - no user_id needed
		s.createNotification(chatID, state.Data)

	case "notif_target_user":
		state.State = "waiting_notification_user_id"
		sessionMutex.Lock()
		sessionStates[chatID] = state
		sessionMutex.Unlock()

		msg := tgbotapi.NewMessage(chatID, "✅ کاربر خاص انتخاب شد\n\n"+
			"لطفا شناسه کاربر (User ID) را وارد کنید:")
		s.bot.Send(msg)
	}
}

// ========== Excel Export Functions ==========

// showExcelExportMenu shows the Excel export menu
func (s *TelegramService) showExcelExportMenu(chatID int64) {
	keyboard := tgbotapi.NewReplyKeyboard(
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_EXCEL_EXPORT_SUPPLIERS),
			tgbotapi.NewKeyboardButton(MENU_EXCEL_EXPORT_VISITORS),
		),
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_EXCEL_EXPORT_AVAILABLE),
			tgbotapi.NewKeyboardButton(MENU_EXCEL_EXPORT_RESEARCH),
		),
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_EXCEL_EXPORT_USERS),
		),
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_BACK),
		),
	)
	keyboard.ResizeKeyboard = true

	message := "📊 **خروجی اکسل**\n\n" +
		"از این بخش می‌توانید خروجی اکسل موارد زیر را دریافت کنید:\n\n" +
		"🏪 **تأمین‌کننده‌ها:** شامل تمام اطلاعات تأمین‌کنندگان\n" +
		"🚶‍♂️ **ویزیتورها:** شامل تمام اطلاعات ویزیتورها\n" +
		"📦 **کالاهای موجود:** شامل تمام کالاهای موجود\n" +
		"🔬 **محصولات تحقیقی:** شامل تمام محصولات تحقیقی\n" +
		"👥 **کاربران:** شامل تمام کاربران سیستم\n\n" +
		"💡 **نکته:** فایل اکسل شامل تمام اطلاعات موجود در سیستم است."

	msg := tgbotapi.NewMessage(chatID, message)
	msg.ParseMode = "Markdown"
	msg.ReplyMarkup = keyboard
	s.bot.Send(msg)
}

// exportSuppliersToExcel generates and sends Excel file for suppliers
func (s *TelegramService) exportSuppliersToExcel(chatID int64) {
	// Send loading message
	s.bot.Send(tgbotapi.NewMessage(chatID, "⏳ در حال تولید فایل اکسل تأمین‌کننده‌ها..."))

	// Fetch all suppliers with their user and products
	var suppliers []models.Supplier
	if err := s.db.Preload("User").Preload("Products").Find(&suppliers).Error; err != nil {
		s.bot.Send(tgbotapi.NewMessage(chatID, fmt.Sprintf("❌ خطا در دریافت اطلاعات: %v", err)))
		return
	}

	// Create Excel file
	f := excelize.NewFile()
	sheetName := "تأمین‌کنندگان"
	f.SetSheetName("Sheet1", sheetName)

	// Set headers
	headers := []string{
		"شناسه", "نام", "شماره تماس", "نام برند", "شهر", "آدرس",
		"کسب‌وکار ثبت‌شده", "شماره ثبت", "سابقه صادرات", "قیمت صادرات",
		"قیمت عمده", "قیمت عمده حجم بالا", "قابلیت برچسب خصوصی",
		"وضعیت", "یادداشت ادمین", "تاریخ تأیید", "تاریخ ایجاد",
	}
	for i, header := range headers {
		cell := fmt.Sprintf("%c1", 'A'+i)
		f.SetCellValue(sheetName, cell, header)
	}

	// Set data rows
	for rowIdx, supplier := range suppliers {
		row := rowIdx + 2
		f.SetCellValue(sheetName, fmt.Sprintf("A%d", row), supplier.ID)
		f.SetCellValue(sheetName, fmt.Sprintf("B%d", row), supplier.FullName)
		f.SetCellValue(sheetName, fmt.Sprintf("C%d", row), supplier.Mobile)
		f.SetCellValue(sheetName, fmt.Sprintf("D%d", row), supplier.BrandName)
		f.SetCellValue(sheetName, fmt.Sprintf("E%d", row), supplier.City)
		f.SetCellValue(sheetName, fmt.Sprintf("F%d", row), supplier.Address)
		f.SetCellValue(sheetName, fmt.Sprintf("G%d", row), boolToPersian(supplier.HasRegisteredBusiness))
		f.SetCellValue(sheetName, fmt.Sprintf("H%d", row), supplier.BusinessRegistrationNum)
		f.SetCellValue(sheetName, fmt.Sprintf("I%d", row), boolToPersian(supplier.HasExportExperience))
		f.SetCellValue(sheetName, fmt.Sprintf("J%d", row), supplier.ExportPrice)
		f.SetCellValue(sheetName, fmt.Sprintf("K%d", row), supplier.WholesaleMinPrice)
		f.SetCellValue(sheetName, fmt.Sprintf("L%d", row), supplier.WholesaleHighVolumePrice)
		f.SetCellValue(sheetName, fmt.Sprintf("M%d", row), boolToPersian(supplier.CanProducePrivateLabel))
		f.SetCellValue(sheetName, fmt.Sprintf("N%d", row), supplier.Status)
		f.SetCellValue(sheetName, fmt.Sprintf("O%d", row), supplier.AdminNotes)
		if supplier.ApprovedAt != nil {
			f.SetCellValue(sheetName, fmt.Sprintf("P%d", row), supplier.ApprovedAt.Format("2006-01-02 15:04:05"))
		}
		f.SetCellValue(sheetName, fmt.Sprintf("Q%d", row), supplier.CreatedAt.Format("2006-01-02 15:04:05"))

	}

	// Create products sheet if any supplier has products
	hasProducts := false
	for _, supplier := range suppliers {
		if len(supplier.Products) > 0 {
			hasProducts = true
			break
		}
	}

	if hasProducts {
		f.NewSheet("محصولات")
		productHeaders := []string{"شناسه تأمین‌کننده", "نام تأمین‌کننده", "شماره تماس", "نام محصول", "نوع محصول", "توضیحات", "نیاز به مجوز", "نوع مجوز", "حداقل تولید ماهانه"}
		for i, header := range productHeaders {
			f.SetCellValue("محصولات", fmt.Sprintf("%c1", 'A'+i), header)
		}

		productRow := 2
		for _, supplier := range suppliers {
			for _, product := range supplier.Products {
				f.SetCellValue("محصولات", fmt.Sprintf("A%d", productRow), supplier.ID)
				f.SetCellValue("محصولات", fmt.Sprintf("B%d", productRow), supplier.FullName)
				f.SetCellValue("محصولات", fmt.Sprintf("C%d", productRow), supplier.Mobile)
				f.SetCellValue("محصولات", fmt.Sprintf("D%d", productRow), product.ProductName)
				f.SetCellValue("محصولات", fmt.Sprintf("E%d", productRow), product.ProductType)
				f.SetCellValue("محصولات", fmt.Sprintf("F%d", productRow), product.Description)
				f.SetCellValue("محصولات", fmt.Sprintf("G%d", productRow), boolToPersian(product.NeedsExportLicense))
				f.SetCellValue("محصولات", fmt.Sprintf("H%d", productRow), product.RequiredLicenseType)
				f.SetCellValue("محصولات", fmt.Sprintf("I%d", productRow), product.MonthlyProductionMin)
				productRow++
			}
		}
	}

	// Save and send file
	s.sendExcelFile(chatID, f, "تأمین‌کننده‌ها", fmt.Sprintf("تعداد: %d", len(suppliers)))
}

// exportVisitorsToExcel generates and sends Excel file for visitors
func (s *TelegramService) exportVisitorsToExcel(chatID int64) {
	s.bot.Send(tgbotapi.NewMessage(chatID, "⏳ در حال تولید فایل اکسل ویزیتورها..."))

	var visitors []models.Visitor
	if err := s.db.Preload("User").Find(&visitors).Error; err != nil {
		s.bot.Send(tgbotapi.NewMessage(chatID, fmt.Sprintf("❌ خطا در دریافت اطلاعات: %v", err)))
		return
	}

	f := excelize.NewFile()
	sheetName := "ویزیتورها"
	f.SetSheetName("Sheet1", sheetName)

	headers := []string{
		"شناسه", "نام", "شماره تماس", "کد ملی", "شماره پاسپورت", "تاریخ تولد",
		"شماره واتساپ", "ایمیل", "آدرس محل سکونت", "شهر و استان", "شهرهای مقصد",
		"تماس محلی", "جزئیات تماس محلی", "شماره حساب IBAN", "نام بانک", "نام صاحب حساب",
		"تجربه بازاریابی", "توضیحات تجربه", "سطح زبان", "مهارت‌های خاص",
		"موافقت با محصولات تأییدشده", "موافقت با عواقب تخلف", "وضعیت", "تاریخ ایجاد",
	}
	for i, header := range headers {
		f.SetCellValue(sheetName, fmt.Sprintf("%c1", 'A'+i), header)
	}

	for rowIdx, visitor := range visitors {
		row := rowIdx + 2
		f.SetCellValue(sheetName, fmt.Sprintf("A%d", row), visitor.ID)
		f.SetCellValue(sheetName, fmt.Sprintf("B%d", row), visitor.FullName)
		f.SetCellValue(sheetName, fmt.Sprintf("C%d", row), visitor.Mobile)
		f.SetCellValue(sheetName, fmt.Sprintf("D%d", row), visitor.NationalID)
		f.SetCellValue(sheetName, fmt.Sprintf("E%d", row), visitor.PassportNumber)
		f.SetCellValue(sheetName, fmt.Sprintf("F%d", row), visitor.BirthDate)
		f.SetCellValue(sheetName, fmt.Sprintf("G%d", row), visitor.WhatsappNumber)
		f.SetCellValue(sheetName, fmt.Sprintf("H%d", row), visitor.Email)
		f.SetCellValue(sheetName, fmt.Sprintf("I%d", row), visitor.ResidenceAddress)
		f.SetCellValue(sheetName, fmt.Sprintf("J%d", row), visitor.CityProvince)
		f.SetCellValue(sheetName, fmt.Sprintf("K%d", row), visitor.DestinationCities)
		f.SetCellValue(sheetName, fmt.Sprintf("L%d", row), boolToPersian(visitor.HasLocalContact))
		f.SetCellValue(sheetName, fmt.Sprintf("M%d", row), visitor.LocalContactDetails)
		f.SetCellValue(sheetName, fmt.Sprintf("N%d", row), visitor.BankAccountIBAN)
		f.SetCellValue(sheetName, fmt.Sprintf("O%d", row), visitor.BankName)
		f.SetCellValue(sheetName, fmt.Sprintf("P%d", row), visitor.AccountHolderName)
		f.SetCellValue(sheetName, fmt.Sprintf("Q%d", row), boolToPersian(visitor.HasMarketingExperience))
		f.SetCellValue(sheetName, fmt.Sprintf("R%d", row), visitor.MarketingExperienceDesc)
		f.SetCellValue(sheetName, fmt.Sprintf("S%d", row), visitor.LanguageLevel)
		f.SetCellValue(sheetName, fmt.Sprintf("T%d", row), visitor.SpecialSkills)
		f.SetCellValue(sheetName, fmt.Sprintf("U%d", row), boolToPersian(visitor.AgreesToUseApprovedProducts))
		f.SetCellValue(sheetName, fmt.Sprintf("V%d", row), boolToPersian(visitor.AgreesToViolationConsequences))
		f.SetCellValue(sheetName, fmt.Sprintf("W%d", row), visitor.Status)
		f.SetCellValue(sheetName, fmt.Sprintf("X%d", row), visitor.CreatedAt.Format("2006-01-02 15:04:05"))
	}

	s.sendExcelFile(chatID, f, "ویزیتورها", fmt.Sprintf("تعداد: %d", len(visitors)))
}

// exportAvailableProductsToExcel generates and sends Excel file for available products
func (s *TelegramService) exportAvailableProductsToExcel(chatID int64) {
	s.bot.Send(tgbotapi.NewMessage(chatID, "⏳ در حال تولید فایل اکسل کالاهای موجود..."))

	var products []models.AvailableProduct
	if err := s.db.Preload("AddedBy").Preload("Supplier").Find(&products).Error; err != nil {
		s.bot.Send(tgbotapi.NewMessage(chatID, fmt.Sprintf("❌ خطا در دریافت اطلاعات: %v", err)))
		return
	}

	f := excelize.NewFile()
	sheetName := "کالاهای موجود"
	f.SetSheetName("Sheet1", sheetName)

	headers := []string{
		"شناسه", "نام محصول", "دسته‌بندی", "زیردسته", "توضیحات", "نوع فروش",
		"قیمت عمده", "قیمت خرده", "قیمت صادراتی", "ارز", "موجودی", "حداقل سفارش",
		"حداکثر سفارش", "واحد", "برند", "مدل", "مبدا", "کیفیت", "نوع بسته‌بندی",
		"وزن", "ابعاد", "هزینه حمل", "مکان", "تلفن تماس", "ایمیل تماس", "واتساپ تماس",
		"قابلیت صادرات", "نیاز به مجوز", "نوع مجوز", "کشورهای صادراتی", "وضعیت",
		"ویژه", "پیشنهاد ویژه", "تگ‌ها", "یادداشت‌ها", "نام افزودن‌کننده", "تلفن افزودن‌کننده",
		"نام تأمین‌کننده", "تلفن تأمین‌کننده", "تاریخ ایجاد",
	}
	for i, header := range headers {
		f.SetCellValue(sheetName, fmt.Sprintf("%c1", 'A'+i), header)
	}

	for rowIdx, product := range products {
		row := rowIdx + 2
		f.SetCellValue(sheetName, fmt.Sprintf("A%d", row), product.ID)
		f.SetCellValue(sheetName, fmt.Sprintf("B%d", row), product.ProductName)
		f.SetCellValue(sheetName, fmt.Sprintf("C%d", row), product.Category)
		f.SetCellValue(sheetName, fmt.Sprintf("D%d", row), product.Subcategory)
		f.SetCellValue(sheetName, fmt.Sprintf("E%d", row), product.Description)
		f.SetCellValue(sheetName, fmt.Sprintf("F%d", row), product.SaleType)
		f.SetCellValue(sheetName, fmt.Sprintf("G%d", row), product.WholesalePrice)
		f.SetCellValue(sheetName, fmt.Sprintf("H%d", row), product.RetailPrice)
		f.SetCellValue(sheetName, fmt.Sprintf("I%d", row), product.ExportPrice)
		f.SetCellValue(sheetName, fmt.Sprintf("J%d", row), product.Currency)
		f.SetCellValue(sheetName, fmt.Sprintf("K%d", row), product.AvailableQuantity)
		f.SetCellValue(sheetName, fmt.Sprintf("L%d", row), product.MinOrderQuantity)
		f.SetCellValue(sheetName, fmt.Sprintf("M%d", row), product.MaxOrderQuantity)
		f.SetCellValue(sheetName, fmt.Sprintf("N%d", row), product.Unit)
		f.SetCellValue(sheetName, fmt.Sprintf("O%d", row), product.Brand)
		f.SetCellValue(sheetName, fmt.Sprintf("P%d", row), product.Model)
		f.SetCellValue(sheetName, fmt.Sprintf("Q%d", row), product.Origin)
		f.SetCellValue(sheetName, fmt.Sprintf("R%d", row), product.Quality)
		f.SetCellValue(sheetName, fmt.Sprintf("S%d", row), product.PackagingType)
		f.SetCellValue(sheetName, fmt.Sprintf("T%d", row), product.Weight)
		f.SetCellValue(sheetName, fmt.Sprintf("U%d", row), product.Dimensions)
		f.SetCellValue(sheetName, fmt.Sprintf("V%d", row), product.ShippingCost)
		f.SetCellValue(sheetName, fmt.Sprintf("W%d", row), product.Location)
		f.SetCellValue(sheetName, fmt.Sprintf("X%d", row), product.ContactPhone)
		f.SetCellValue(sheetName, fmt.Sprintf("Y%d", row), product.ContactEmail)
		f.SetCellValue(sheetName, fmt.Sprintf("Z%d", row), product.ContactWhatsapp)
		f.SetCellValue(sheetName, fmt.Sprintf("AA%d", row), boolToPersian(product.CanExport))
		f.SetCellValue(sheetName, fmt.Sprintf("AB%d", row), boolToPersian(product.RequiresLicense))
		f.SetCellValue(sheetName, fmt.Sprintf("AC%d", row), product.LicenseType)
		f.SetCellValue(sheetName, fmt.Sprintf("AD%d", row), product.ExportCountries)
		f.SetCellValue(sheetName, fmt.Sprintf("AE%d", row), product.Status)
		f.SetCellValue(sheetName, fmt.Sprintf("AF%d", row), boolToPersian(product.IsFeatured))
		f.SetCellValue(sheetName, fmt.Sprintf("AG%d", row), boolToPersian(product.IsHotDeal))
		f.SetCellValue(sheetName, fmt.Sprintf("AH%d", row), product.Tags)
		f.SetCellValue(sheetName, fmt.Sprintf("AI%d", row), product.Notes)
		if product.AddedBy.ID > 0 {
			f.SetCellValue(sheetName, fmt.Sprintf("AJ%d", row), product.AddedBy.Name())
			f.SetCellValue(sheetName, fmt.Sprintf("AK%d", row), product.AddedBy.Phone)
		}
		if product.Supplier != nil {
			f.SetCellValue(sheetName, fmt.Sprintf("AL%d", row), product.Supplier.FullName)
			f.SetCellValue(sheetName, fmt.Sprintf("AM%d", row), product.Supplier.Mobile)
		}
		f.SetCellValue(sheetName, fmt.Sprintf("AN%d", row), product.CreatedAt.Format("2006-01-02 15:04:05"))
	}

	s.sendExcelFile(chatID, f, "کالاهای موجود", fmt.Sprintf("تعداد: %d", len(products)))
}

// exportResearchProductsToExcel generates and sends Excel file for research products
func (s *TelegramService) exportResearchProductsToExcel(chatID int64) {
	s.bot.Send(tgbotapi.NewMessage(chatID, "⏳ در حال تولید فایل اکسل محصولات تحقیقی..."))

	var products []models.ResearchProduct
	if err := s.db.Preload("AddedByAdmin").Find(&products).Error; err != nil {
		s.bot.Send(tgbotapi.NewMessage(chatID, fmt.Sprintf("❌ خطا در دریافت اطلاعات: %v", err)))
		return
	}

	f := excelize.NewFile()
	sheetName := "محصولات تحقیقی"
	f.SetSheetName("Sheet1", sheetName)

	headers := []string{
		"شناسه", "نام", "کد HS", "دسته‌بندی", "توضیحات", "مقدار صادرات", "مقدار واردات",
		"تقاضای بازار", "پتانسیل سود", "سطح رقابت", "کشور هدف", "قیمت خرید از ایران",
		"قیمت فروش در کشور هدف", "واحد پول", "حاشیه سود", "کشورهای هدف", "عوامل فصلی",
		"مجوزهای مورد نیاز", "استانداردهای کیفی", "وضعیت", "اولویت", "افزودن‌کننده",
		"تاریخ ایجاد",
	}
	for i, header := range headers {
		f.SetCellValue(sheetName, fmt.Sprintf("%c1", 'A'+i), header)
	}

	for rowIdx, product := range products {
		row := rowIdx + 2
		f.SetCellValue(sheetName, fmt.Sprintf("A%d", row), product.ID)
		f.SetCellValue(sheetName, fmt.Sprintf("B%d", row), product.Name)
		f.SetCellValue(sheetName, fmt.Sprintf("C%d", row), product.HSCode)
		f.SetCellValue(sheetName, fmt.Sprintf("D%d", row), product.Category)
		f.SetCellValue(sheetName, fmt.Sprintf("E%d", row), product.Description)
		f.SetCellValue(sheetName, fmt.Sprintf("F%d", row), product.ExportValue)
		f.SetCellValue(sheetName, fmt.Sprintf("G%d", row), product.ImportValue)
		f.SetCellValue(sheetName, fmt.Sprintf("H%d", row), product.MarketDemand)
		f.SetCellValue(sheetName, fmt.Sprintf("I%d", row), product.ProfitPotential)
		f.SetCellValue(sheetName, fmt.Sprintf("J%d", row), product.CompetitionLevel)
		f.SetCellValue(sheetName, fmt.Sprintf("K%d", row), product.TargetCountry)
		f.SetCellValue(sheetName, fmt.Sprintf("L%d", row), product.IranPurchasePrice)
		f.SetCellValue(sheetName, fmt.Sprintf("M%d", row), product.TargetCountryPrice)
		f.SetCellValue(sheetName, fmt.Sprintf("N%d", row), product.PriceCurrency)
		f.SetCellValue(sheetName, fmt.Sprintf("O%d", row), product.ProfitMargin)
		f.SetCellValue(sheetName, fmt.Sprintf("P%d", row), product.TargetCountries)
		f.SetCellValue(sheetName, fmt.Sprintf("Q%d", row), product.SeasonalFactors)
		f.SetCellValue(sheetName, fmt.Sprintf("R%d", row), product.RequiredLicenses)
		f.SetCellValue(sheetName, fmt.Sprintf("S%d", row), product.QualityStandards)
		f.SetCellValue(sheetName, fmt.Sprintf("T%d", row), product.Status)
		f.SetCellValue(sheetName, fmt.Sprintf("U%d", row), product.Priority)
		if product.AddedByAdmin.ID > 0 {
			f.SetCellValue(sheetName, fmt.Sprintf("V%d", row), product.AddedByAdmin.Name())
		}
		f.SetCellValue(sheetName, fmt.Sprintf("W%d", row), product.CreatedAt.Format("2006-01-02 15:04:05"))
	}

	s.sendExcelFile(chatID, f, "محصولات تحقیقی", fmt.Sprintf("تعداد: %d", len(products)))
}

// exportUsersToExcel generates and sends Excel file for all users
func (s *TelegramService) exportUsersToExcel(chatID int64) {
	s.bot.Send(tgbotapi.NewMessage(chatID, "⏳ در حال تولید فایل اکسل کاربران..."))

	var users []models.User
	if err := s.db.Find(&users).Error; err != nil {
		s.bot.Send(tgbotapi.NewMessage(chatID, fmt.Sprintf("❌ خطا در دریافت اطلاعات: %v", err)))
		return
	}

	f := excelize.NewFile()
	sheetName := "کاربران"
	f.SetSheetName("Sheet1", sheetName)

	headers := []string{
		"شناسه", "نام", "نام خانوادگی", "نام کامل", "شماره تماس", "ایمیل",
		"وضعیت فعال", "ادمین", "تاریخ ایجاد", "تاریخ به‌روزرسانی",
	}
	for i, header := range headers {
		f.SetCellValue(sheetName, fmt.Sprintf("%c1", 'A'+i), header)
	}

	for rowIdx, user := range users {
		row := rowIdx + 2
		f.SetCellValue(sheetName, fmt.Sprintf("A%d", row), user.ID)
		f.SetCellValue(sheetName, fmt.Sprintf("B%d", row), user.FirstName)
		f.SetCellValue(sheetName, fmt.Sprintf("C%d", row), user.LastName)
		f.SetCellValue(sheetName, fmt.Sprintf("D%d", row), user.Name())
		f.SetCellValue(sheetName, fmt.Sprintf("E%d", row), user.Phone)
		f.SetCellValue(sheetName, fmt.Sprintf("F%d", row), user.Email)
		f.SetCellValue(sheetName, fmt.Sprintf("G%d", row), boolToPersian(user.IsActive))
		f.SetCellValue(sheetName, fmt.Sprintf("H%d", row), boolToPersian(user.IsAdmin))
		f.SetCellValue(sheetName, fmt.Sprintf("I%d", row), user.CreatedAt.Format("2006-01-02 15:04:05"))
		f.SetCellValue(sheetName, fmt.Sprintf("J%d", row), user.UpdatedAt.Format("2006-01-02 15:04:05"))
	}

	s.sendExcelFile(chatID, f, "کاربران", fmt.Sprintf("تعداد: %d", len(users)))
}

// sendExcelFile saves and sends Excel file to Telegram
func (s *TelegramService) sendExcelFile(chatID int64, f *excelize.File, title, info string) {
	tempDir := os.TempDir()
	fileName := fmt.Sprintf("%s_%d.xlsx", strings.ReplaceAll(title, " ", "_"), time.Now().Unix())
	filePath := filepath.Join(tempDir, fileName)

	if err := f.SaveAs(filePath); err != nil {
		s.bot.Send(tgbotapi.NewMessage(chatID, fmt.Sprintf("❌ خطا در ذخیره فایل: %v", err)))
		return
	}

	document := tgbotapi.NewDocument(chatID, tgbotapi.FilePath(filePath))
	document.Caption = fmt.Sprintf("📊 **خروجی اکسل %s**\n\n%s\n\n✅ فایل آماده است.", title, info)
	document.ParseMode = "Markdown"

	if _, err := s.bot.Send(document); err != nil {
		s.bot.Send(tgbotapi.NewMessage(chatID, fmt.Sprintf("❌ خطا در ارسال فایل: %v", err)))
		os.Remove(filePath)
		return
	}

	// Clean up temp file after a delay
	go func() {
		time.Sleep(5 * time.Minute)
		os.Remove(filePath)
	}()
}

// boolToPersian converts boolean to Persian text
func boolToPersian(b bool) string {
	if b {
		return "بله"
	}
	return "خیر"
}
