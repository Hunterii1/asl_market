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

		// If it's a /start command or any message, show the main menu
		s.showMainMenu(update.Message.Chat.ID)
	}
}

func (s *TelegramService) showMainMenu(chatID int64) {
	keyboard := tgbotapi.NewInlineKeyboardMarkup(
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("👥 لیست کاربران", "menu_users"),
			tgbotapi.NewInlineKeyboardButtonData("📊 آمار سیستم", "menu_stats"),
		),
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("🔍 جستجوی کاربر", "menu_search"),
			tgbotapi.NewInlineKeyboardButtonData("⏳ درخواست‌های در انتظار", "menu_pending"),
		),
	)

	msg := tgbotapi.NewMessage(chatID, "به پنل مدیریت ASL Market خوش آمدید.\nلطفا یکی از گزینه‌های زیر را انتخاب کنید:")
	msg.ReplyMarkup = keyboard
	s.bot.Send(msg)
}

func (s *TelegramService) handleCallbackQuery(query *tgbotapi.CallbackQuery) {
	data := query.Data
	chatID := query.Message.Chat.ID

	// First check if it's a menu action
	if strings.HasPrefix(data, "menu_") {
		s.handleMenuAction(data, chatID)
		return
	}

	// Then check if it's a user action (approve/reject)
	if strings.HasPrefix(data, "approve_") || strings.HasPrefix(data, "reject_") {
		s.handleUserAction(data, query)
		return
	}

	// Handle pagination
	if strings.HasPrefix(data, "page_") {
		s.handlePagination(data, chatID)
		return
	}

	// Handle back button
	if data == "back_to_menu" {
		s.showMainMenu(chatID)
		return
	}
}

func (s *TelegramService) handleMenuAction(action string, chatID int64) {
	switch action {
	case "menu_users":
		s.showUsersList(chatID, 1) // Show first page

	case "menu_stats":
		var totalUsers, approvedUsers, pendingUsers int64
		s.db.Model(&models.User{}).Count(&totalUsers)
		s.db.Model(&models.User{}).Where("is_approved = ?", true).Count(&approvedUsers)
		s.db.Model(&models.User{}).Where("license != '' AND is_approved = ?", false).Count(&pendingUsers)

		response := fmt.Sprintf("📊 آمار سیستم:\n\n"+
			"👥 تعداد کل کاربران: %d\n"+
			"✅ کاربران تأیید شده: %d\n"+
			"⏳ در انتظار تأیید: %d\n",
			totalUsers, approvedUsers, pendingUsers)

		keyboard := tgbotapi.NewInlineKeyboardMarkup(
			tgbotapi.NewInlineKeyboardRow(
				tgbotapi.NewInlineKeyboardButtonData("🔙 بازگشت به منو", "back_to_menu"),
			),
		)

		msg := tgbotapi.NewMessage(chatID, response)
		msg.ReplyMarkup = keyboard
		s.bot.Send(msg)

	case "menu_search":
		keyboard := tgbotapi.NewInlineKeyboardMarkup(
			tgbotapi.NewInlineKeyboardRow(
				tgbotapi.NewInlineKeyboardButtonData("🔙 بازگشت به منو", "back_to_menu"),
			),
		)

		msg := tgbotapi.NewMessage(chatID, "🔍 برای جستجوی کاربر، لطفا شناسه کاربر یا ایمیل را ارسال کنید:")
		msg.ReplyMarkup = keyboard
		s.bot.Send(msg)

	case "menu_pending":
		var users []models.User
		if err := s.db.Where("license != '' AND is_approved = ?", false).Find(&users).Error; err != nil {
			msg := tgbotapi.NewMessage(chatID, "❌ خطا در دریافت لیست درخواست‌ها")
			s.bot.Send(msg)
			return
		}

		if len(users) == 0 {
			keyboard := tgbotapi.NewInlineKeyboardMarkup(
				tgbotapi.NewInlineKeyboardRow(
					tgbotapi.NewInlineKeyboardButtonData("🔙 بازگشت به منو", "back_to_menu"),
				),
			)

			msg := tgbotapi.NewMessage(chatID, "📝 هیچ درخواست در انتظار تأییدی وجود ندارد.")
			msg.ReplyMarkup = keyboard
			s.bot.Send(msg)
			return
		}

		response := "📝 درخواست‌های در انتظار تأیید:\n\n"
		var keyboard [][]tgbotapi.InlineKeyboardButton

		for _, user := range users {
			response += fmt.Sprintf("👤 %s %s\n📧 %s\n🔑 %s\n➖➖➖➖➖➖\n",
				user.FirstName, user.LastName, user.Email, user.License)

			keyboard = append(keyboard,
				tgbotapi.NewInlineKeyboardRow(
					tgbotapi.NewInlineKeyboardButtonData(
						fmt.Sprintf("✅ تأیید %s", user.FirstName),
						fmt.Sprintf("approve_%d", user.ID),
					),
					tgbotapi.NewInlineKeyboardButtonData(
						fmt.Sprintf("❌ رد %s", user.FirstName),
						fmt.Sprintf("reject_%d", user.ID),
					),
				),
			)
		}

		keyboard = append(keyboard,
			tgbotapi.NewInlineKeyboardRow(
				tgbotapi.NewInlineKeyboardButtonData("🔙 بازگشت به منو", "back_to_menu"),
			),
		)

		msg := tgbotapi.NewMessage(chatID, response)
		msg.ReplyMarkup = tgbotapi.NewInlineKeyboardMarkup(keyboard...)
		s.bot.Send(msg)
	}
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

	// Create pagination keyboard
	var keyboard [][]tgbotapi.InlineKeyboardButton
	var row []tgbotapi.InlineKeyboardButton

	if page > 1 {
		row = append(row, tgbotapi.NewInlineKeyboardButtonData("◀️ قبلی", fmt.Sprintf("page_%d", page-1)))
	}
	if page < totalPages {
		row = append(row, tgbotapi.NewInlineKeyboardButtonData("بعدی ▶️", fmt.Sprintf("page_%d", page+1)))
	}

	if len(row) > 0 {
		keyboard = append(keyboard, row)
	}

	keyboard = append(keyboard,
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("🔙 بازگشت به منو", "back_to_menu"),
		),
	)

	msg := tgbotapi.NewMessage(chatID, fmt.Sprintf("%s\nصفحه %d از %d", response, page, totalPages))
	msg.ReplyMarkup = tgbotapi.NewInlineKeyboardMarkup(keyboard...)
	s.bot.Send(msg)
}

func (s *TelegramService) handleUserAction(data string, query *tgbotapi.CallbackQuery) {
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

	var response string
	switch action {
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

	// Send confirmation message and show main menu
	msg := tgbotapi.NewMessage(query.Message.Chat.ID, response)
	s.bot.Send(msg)
	s.showMainMenu(query.Message.Chat.ID)
}

func (s *TelegramService) handlePagination(data string, chatID int64) {
	parts := strings.Split(data, "_")
	if len(parts) != 2 {
		return
	}

	page, err := strconv.Atoi(parts[1])
	if err != nil {
		return
	}

	s.showUsersList(chatID, page)
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
