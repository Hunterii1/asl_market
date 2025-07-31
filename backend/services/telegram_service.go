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

		go s.handleMessage(update.Message)
	}
}

func (s *TelegramService) handleMessage(message *tgbotapi.Message) {
	command := strings.ToLower(message.Command())
	args := message.CommandArguments()

	var response string
	switch command {
	case "start":
		response = "سلام! به پنل مدیریت ASL Market خوش آمدید.\n\n" +
			"دستورات موجود:\n" +
			"/users - نمایش لیست کاربران\n" +
			"/checkuser [user_id] - بررسی وضعیت کاربر\n" +
			"/stats - نمایش آمار کلی سیستم\n" +
			"/help - نمایش این راهنما"

	case "users":
		var users []models.User
		if err := s.db.Find(&users).Error; err != nil {
			response = fmt.Sprintf("خطا در دریافت لیست کاربران: %v", err)
		} else {
			response = "لیست کاربران:\n\n"
			for _, user := range users {
				response += fmt.Sprintf("🔹 ID: %d\n👤 نام: %s %s\n📧 ایمیل: %s\n📱 تلفن: %s\n✅ تأیید شده: %v\n➖➖➖➖➖➖\n",
					user.ID, user.FirstName, user.LastName, user.Email, user.Phone, user.IsApproved)
			}
		}

	case "checkuser":
		if args == "" {
			response = "لطفا شناسه کاربر را وارد کنید. مثال:\n/checkuser 123"
			break
		}

		userID, err := strconv.ParseUint(args, 10, 32)
		if err != nil {
			response = "شناسه کاربر نامعتبر است"
			break
		}

		var user models.User
		if err := s.db.First(&user, userID).Error; err != nil {
			response = fmt.Sprintf("خطا در دریافت اطلاعات کاربر: %v", err)
			break
		}

		response = fmt.Sprintf("📋 اطلاعات کاربر:\n\n"+
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

	case "stats":
		var totalUsers int64
		var approvedUsers int64
		var pendingUsers int64

		s.db.Model(&models.User{}).Count(&totalUsers)
		s.db.Model(&models.User{}).Where("is_approved = ?", true).Count(&approvedUsers)
		s.db.Model(&models.User{}).Where("license != '' AND is_approved = ?", false).Count(&pendingUsers)

		response = fmt.Sprintf("📊 آمار سیستم:\n\n"+
			"👥 تعداد کل کاربران: %d\n"+
			"✅ کاربران تأیید شده: %d\n"+
			"⏳ در انتظار تأیید: %d\n",
			totalUsers, approvedUsers, pendingUsers)

	case "help":
		response = "راهنمای دستورات:\n\n" +
			"/users - نمایش لیست کاربران\n" +
			"/checkuser [user_id] - بررسی وضعیت کاربر\n" +
			"/stats - نمایش آمار کلی سیستم\n" +
			"/help - نمایش این راهنما"

	default:
		response = "دستور نامعتبر. برای مشاهده لیست دستورات از /help استفاده کنید."
	}

	msg := tgbotapi.NewMessage(message.Chat.ID, response)
	msg.ParseMode = tgbotapi.ModeHTML
	s.bot.Send(msg)
}

func (s *TelegramService) handleCallbackQuery(query *tgbotapi.CallbackQuery) {
	// Extract user ID and action from callback data
	parts := strings.Split(query.Data, "_")
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

	// Send confirmation message
	msg := tgbotapi.NewMessage(query.Message.Chat.ID, response)
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

	// Create inline keyboard with approve/reject buttons
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
