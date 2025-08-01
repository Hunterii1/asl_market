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

const ADMIN_ID = 76599340
const ASL_PLATFORM_LICENSE = "ASL-PLATFORM-2024"

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
			go s.handleCallbackQuery(update.CallbackQuery)
			continue
		}

		// Handle messages
		if update.Message == nil {
			continue
		}

		// Only process messages from admin
		if update.Message.From.ID != ADMIN_ID {
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

	response := fmt.Sprintf("📋 اطلاعات کاربر:\n\n"+
		"👤 نام: %s %s\n"+
		"📧 ایمیل: %s\n"+
		"📱 تلفن: %s\n"+
		"🔑 لایسنس: %s\n"+
		"✅ تأیید شده: %v\n",
		user.FirstName, user.LastName,
		user.Email,
		user.Phone,
		user.License,
		user.IsApproved)

	// Add approve/reject buttons if user has license but not approved
	var keyboard tgbotapi.InlineKeyboardMarkup
	if user.License != "" && !user.IsApproved {
		keyboard = tgbotapi.NewInlineKeyboardMarkup(
			tgbotapi.NewInlineKeyboardRow(
				tgbotapi.NewInlineKeyboardButtonData("✅ تأیید", fmt.Sprintf("approve_%d", user.ID)),
				tgbotapi.NewInlineKeyboardButtonData("❌ رد", fmt.Sprintf("reject_%d", user.ID)),
			),
		)
	}

	msg := tgbotapi.NewMessage(chatID, response)
	if user.License != "" && !user.IsApproved {
		msg.ReplyMarkup = keyboard
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

	for _, user := range users {
		message := fmt.Sprintf("👤 %s %s\n📧 %s\n🔑 %s\n",
			user.FirstName, user.LastName, user.Email, user.License)

		keyboard := tgbotapi.NewInlineKeyboardMarkup(
			tgbotapi.NewInlineKeyboardRow(
				tgbotapi.NewInlineKeyboardButtonData("✅ تأیید", fmt.Sprintf("approve_%d", user.ID)),
				tgbotapi.NewInlineKeyboardButtonData("❌ رد", fmt.Sprintf("reject_%d", user.ID)),
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
		"👤 شناسه ادمین: "+fmt.Sprint(ADMIN_ID))
	s.bot.Send(msg)
}

func (s *TelegramService) showUsersList(chatID int64, page int) {
	const perPage = 5
	offset := (page - 1) * perPage

	var users []models.User
	var total int64

	s.db.Model(&models.User{}).Count(&total)
	if err := s.db.Offset(offset).Limit(perPage).Find(&users).Error; err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ خطا در دریافت لیست کاربران")
		s.bot.Send(msg)
		return
	}

	response := "👥 لیست کاربران:\n\n"
	for _, user := range users {
		response += fmt.Sprintf("🔹 ID: %d\n👤 %s %s\n📧 %s\n📱 %s\n✅ تأیید شده: %v\n➖➖➖➖➖➖\n",
			user.ID, user.FirstName, user.LastName, user.Email, user.Phone, user.IsApproved)
	}

	// Calculate total pages
	totalPages := (int(total) + perPage - 1) / perPage

	// Add pagination buttons if needed
	var keyboard tgbotapi.InlineKeyboardMarkup
	if totalPages > 1 {
		var row []tgbotapi.InlineKeyboardButton
		if page > 1 {
			row = append(row, tgbotapi.NewInlineKeyboardButtonData("◀️ قبلی", fmt.Sprintf("page_%d", page-1)))
		}
		if page < totalPages {
			row = append(row, tgbotapi.NewInlineKeyboardButtonData("بعدی ▶️", fmt.Sprintf("page_%d", page+1)))
		}
		keyboard = tgbotapi.NewInlineKeyboardMarkup(row)
	}

	msg := tgbotapi.NewMessage(chatID, fmt.Sprintf("%s\nصفحه %d از %d", response, page, totalPages))
	if totalPages > 1 {
		msg.ReplyMarkup = keyboard
	}
	s.bot.Send(msg)
}

func (s *TelegramService) handleCallbackQuery(query *tgbotapi.CallbackQuery) {
	data := query.Data
	chatID := query.Message.Chat.ID

	// Handle pagination
	if strings.HasPrefix(data, "page_") {
		parts := strings.Split(data, "_")
		if len(parts) != 2 {
			return
		}
		if page, err := strconv.Atoi(parts[1]); err == nil {
			s.showUsersList(chatID, page)
		}
		return
	}

	// Handle user actions (approve/reject)
	if strings.HasPrefix(data, "approve_") || strings.HasPrefix(data, "reject_") {
		parts := strings.Split(data, "_")
		if len(parts) != 2 {
			return
		}

		userID, err := strconv.ParseUint(parts[1], 10, 32)
		if err != nil {
			return
		}

		var user models.User
		if err := s.db.First(&user, userID).Error; err != nil {
			return
		}

		var response string
		switch parts[0] {
		case "approve":
			user.IsApproved = true
			if err := s.db.Save(&user).Error; err != nil {
				response = "❌ خطا در تأیید کاربر"
			} else {
				response = fmt.Sprintf("✅ کاربر %s %s با موفقیت تأیید شد", user.FirstName, user.LastName)
			}

		case "reject":
			user.IsApproved = false
			user.License = ""
			if err := s.db.Save(&user).Error; err != nil {
				response = "❌ خطا در رد درخواست کاربر"
			} else {
				response = fmt.Sprintf("❌ درخواست کاربر %s %s رد شد", user.FirstName, user.LastName)
			}
		}

		// Answer callback query
		callback := tgbotapi.NewCallback(query.ID, "")
		s.bot.Request(callback)

		// Send confirmation message
		msg := tgbotapi.NewMessage(chatID, response)
		s.bot.Send(msg)
	}
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

	msg := tgbotapi.NewMessage(ADMIN_ID, message)
	msg.ReplyMarkup = keyboard
	_, err := s.bot.Send(msg)
	return err
}
