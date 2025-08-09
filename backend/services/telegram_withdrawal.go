package services

import (
	"fmt"

	"asl-market-backend/models"

	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"
)

// Withdrawal Management Functions

func (s *TelegramService) showWithdrawalMenu(chatID int64) {
	keyboard := tgbotapi.NewReplyKeyboard(
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_WITHDRAWALS_PENDING),
			tgbotapi.NewKeyboardButton(MENU_WITHDRAWALS_APPROVED),
		),
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_WITHDRAWALS_PROCESSING),
			tgbotapi.NewKeyboardButton(MENU_WITHDRAWALS_COMPLETED),
		),
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_WITHDRAWALS_REJECTED),
			tgbotapi.NewKeyboardButton(MENU_WITHDRAWALS_ALL),
		),
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_WITHDRAWALS_STATS),
		),
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton("🔙 بازگشت به منوی اصلی"),
		),
	)
	keyboard.ResizeKeyboard = true

	text := "💰 مدیریت برداشت‌ها\n\n" +
		"لطفاً گزینه مورد نظر را انتخاب کنید:"

	msg := tgbotapi.NewMessage(chatID, text)
	msg.ReplyMarkup = keyboard
	s.bot.Send(msg)
}

func (s *TelegramService) showWithdrawalsList(chatID int64, status string, page int) {
	var statusFilter *models.WithdrawalStatus
	var statusText string

	if status != "" && status != "all" {
		s := models.WithdrawalStatus(status)
		statusFilter = &s
		switch status {
		case "pending":
			statusText = "در انتظار"
		case "approved":
			statusText = "تایید شده"
		case "processing":
			statusText = "در حال پردازش"
		case "completed":
			statusText = "تکمیل شده"
		case "rejected":
			statusText = "رد شده"
		}
	} else {
		statusText = "همه"
	}

	limit := 5
	offset := (page - 1) * limit

	withdrawals, total, err := models.GetWithdrawalRequests(s.db, nil, statusFilter, limit, offset)
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ خطا در دریافت لیست درخواست‌ها")
		s.bot.Send(msg)
		return
	}

	if len(withdrawals) == 0 {
		msg := tgbotapi.NewMessage(chatID, fmt.Sprintf("📭 هیچ درخواست %s یافت نشد", statusText))
		s.bot.Send(msg)
		return
	}

	text := fmt.Sprintf("💰 درخواست‌های برداشت - %s\n", statusText)
	text += fmt.Sprintf("📊 نمایش %d تا %d از %d درخواست\n\n", offset+1, offset+len(withdrawals), total)

	for _, withdrawal := range withdrawals {
		statusEmoji := s.getWithdrawalStatusEmoji(string(withdrawal.Status))
		text += fmt.Sprintf("🆔 ID: %d\n", withdrawal.ID)
		text += fmt.Sprintf("👤 کاربر: %s %s\n", withdrawal.User.FirstName, withdrawal.User.LastName)
		text += fmt.Sprintf("💰 مبلغ: %.2f %s\n", withdrawal.Amount, withdrawal.Currency)
		text += fmt.Sprintf("🌍 کشور: %s\n", withdrawal.SourceCountry)
		text += fmt.Sprintf("📅 تاریخ: %s\n", withdrawal.RequestedAt.Format("2006/01/02 15:04"))
		text += fmt.Sprintf("📊 وضعیت: %s %s\n", statusEmoji, s.getWithdrawalStatusText(string(withdrawal.Status)))

		// Show bank details for pending and approved requests
		if withdrawal.Status == models.WithdrawalStatusPending || withdrawal.Status == models.WithdrawalStatusApproved {
			text += fmt.Sprintf("💳 کارت: %s\n", withdrawal.BankCardNumber)
			text += fmt.Sprintf("👤 نام: %s\n", withdrawal.CardHolderName)
			text += fmt.Sprintf("🏦 شبا: %s\n", withdrawal.ShebaNumber)
			text += fmt.Sprintf("🏛️ بانک: %s\n", withdrawal.BankName)
		}

		if withdrawal.DestinationAccount != "" {
			text += fmt.Sprintf("🎯 حساب مقصد: %s\n", withdrawal.DestinationAccount)
		}

		if withdrawal.AdminNotes != "" {
			text += fmt.Sprintf("📝 یادداشت ادمین: %s\n", withdrawal.AdminNotes)
		}

		text += "➖➖➖➖➖\n"
	}

	// Create inline keyboard for actions
	var keyboard [][]tgbotapi.InlineKeyboardButton

	for _, withdrawal := range withdrawals {
		if withdrawal.Status == models.WithdrawalStatusPending {
			row := []tgbotapi.InlineKeyboardButton{
				tgbotapi.NewInlineKeyboardButtonData(
					fmt.Sprintf("✅ تایید %d", withdrawal.ID),
					fmt.Sprintf("approve_withdrawal_%d", withdrawal.ID),
				),
				tgbotapi.NewInlineKeyboardButtonData(
					fmt.Sprintf("❌ رد %d", withdrawal.ID),
					fmt.Sprintf("reject_withdrawal_%d", withdrawal.ID),
				),
			}
			keyboard = append(keyboard, row)
		} else if withdrawal.Status == models.WithdrawalStatusApproved {
			row := []tgbotapi.InlineKeyboardButton{
				tgbotapi.NewInlineKeyboardButtonData(
					fmt.Sprintf("🔄 پردازش %d", withdrawal.ID),
					fmt.Sprintf("process_withdrawal_%d", withdrawal.ID),
				),
			}
			keyboard = append(keyboard, row)
		} else if withdrawal.Status == models.WithdrawalStatusProcessing {
			row := []tgbotapi.InlineKeyboardButton{
				tgbotapi.NewInlineKeyboardButtonData(
					fmt.Sprintf("✅ تکمیل %d", withdrawal.ID),
					fmt.Sprintf("complete_withdrawal_%d", withdrawal.ID),
				),
			}
			keyboard = append(keyboard, row)
		}
	}

	// Navigation buttons
	if page > 1 || int64(offset+limit) < total {
		navRow := []tgbotapi.InlineKeyboardButton{}
		if page > 1 {
			navRow = append(navRow, tgbotapi.NewInlineKeyboardButtonData("◀️ قبلی", fmt.Sprintf("withdrawals_%s_%d", status, page-1)))
		}
		if int64(offset+limit) < total {
			navRow = append(navRow, tgbotapi.NewInlineKeyboardButtonData("بعدی ▶️", fmt.Sprintf("withdrawals_%s_%d", status, page+1)))
		}
		keyboard = append(keyboard, navRow)
	}

	msg := tgbotapi.NewMessage(chatID, text)
	if len(keyboard) > 0 {
		msg.ReplyMarkup = tgbotapi.NewInlineKeyboardMarkup(keyboard...)
	}
	s.bot.Send(msg)
}

func (s *TelegramService) showWithdrawalStats(chatID int64) {
	stats, err := models.GetWithdrawalStats(s.db, nil)
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ خطا در دریافت آمار")
		s.bot.Send(msg)
		return
	}

	text := "📊 آمار کلی برداشت‌ها\n\n"
	text += fmt.Sprintf("📄 کل درخواست‌ها: %v\n", stats["total"])
	text += fmt.Sprintf("✅ تکمیل شده: %v\n", stats["completed"])
	text += fmt.Sprintf("⏳ در انتظار: %v\n", stats["pending"])
	text += fmt.Sprintf("🔄 در حال پردازش: %v\n", stats["processing"])
	text += fmt.Sprintf("💰 کل مبلغ پرداخت شده: %.2f\n", stats["total_amount"])

	msg := tgbotapi.NewMessage(chatID, text)
	s.bot.Send(msg)
}

func (s *TelegramService) getWithdrawalStatusEmoji(status string) string {
	switch status {
	case "pending":
		return "⏳"
	case "approved":
		return "✅"
	case "processing":
		return "🔄"
	case "completed":
		return "✅"
	case "rejected":
		return "❌"
	default:
		return "❓"
	}
}

func (s *TelegramService) getWithdrawalStatusText(status string) string {
	switch status {
	case "pending":
		return "در انتظار بررسی"
	case "approved":
		return "تایید شده"
	case "processing":
		return "در حال پردازش"
	case "completed":
		return "تکمیل شده"
	case "rejected":
		return "رد شده"
	default:
		return "نامشخص"
	}
}

// Handle withdrawal inline button callbacks
func (s *TelegramService) handleWithdrawalCallback(callbackQuery *tgbotapi.CallbackQuery) {
	chatID := callbackQuery.Message.Chat.ID
	data := callbackQuery.Data

	// Admin ID for tracking
	adminID := uint(callbackQuery.From.ID)

	if data[:17] == "approve_withdrawal_" {
		withdrawalID := data[19:]
		s.sendWithdrawalApprovalPrompt(chatID, withdrawalID, adminID)
	} else if data[:17] == "reject_withdrawal_" {
		withdrawalID := data[18:]
		s.sendWithdrawalRejectionPrompt(chatID, withdrawalID, adminID)
	} else if data[:18] == "process_withdrawal_" {
		withdrawalID := data[19:]
		s.processWithdrawal(chatID, withdrawalID, adminID)
	} else if data[:19] == "complete_withdrawal_" {
		withdrawalID := data[20:]
		s.completeWithdrawal(chatID, withdrawalID, adminID)
	}

	// Answer the callback to remove loading state
	callback := tgbotapi.NewCallback(callbackQuery.ID, "")
	s.bot.Request(callback)
}

func (s *TelegramService) sendWithdrawalApprovalPrompt(chatID int64, withdrawalID string, adminID uint) {
	text := fmt.Sprintf("✅ تایید درخواست برداشت %s\n\n", withdrawalID)
	text += "لطفاً شماره حساب مقصد برای واریز را وارد کنید:"

	msg := tgbotapi.NewMessage(chatID, text)
	s.bot.Send(msg)

	// Store admin state for next message
	// This would require implementing a state management system
}

func (s *TelegramService) sendWithdrawalRejectionPrompt(chatID int64, withdrawalID string, adminID uint) {
	text := fmt.Sprintf("❌ رد درخواست برداشت %s\n\n", withdrawalID)
	text += "لطفاً دلیل رد درخواست را وارد کنید:"

	msg := tgbotapi.NewMessage(chatID, text)
	s.bot.Send(msg)

	// Store admin state for next message
}

func (s *TelegramService) processWithdrawal(chatID int64, withdrawalID string, adminID uint) {
	// Convert withdrawalID to uint
	id := s.parseWithdrawalID(withdrawalID)
	if id == 0 {
		msg := tgbotapi.NewMessage(chatID, "❌ شناسه درخواست نامعتبر است")
		s.bot.Send(msg)
		return
	}

	err := models.UpdateWithdrawalStatus(s.db, id, models.WithdrawalStatusProcessing, adminID, "در حال پردازش توسط ادمین", "")
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ خطا در بروزرسانی وضعیت درخواست")
		s.bot.Send(msg)
		return
	}

	text := fmt.Sprintf("🔄 درخواست برداشت %s به حالت پردازش تغییر یافت\n\n", withdrawalID)
	text += "کاربر می‌تواند فیش واریز را بارگذاری کند."

	msg := tgbotapi.NewMessage(chatID, text)
	s.bot.Send(msg)
}

func (s *TelegramService) completeWithdrawal(chatID int64, withdrawalID string, adminID uint) {
	// Convert withdrawalID to uint
	id := s.parseWithdrawalID(withdrawalID)
	if id == 0 {
		msg := tgbotapi.NewMessage(chatID, "❌ شناسه درخواست نامعتبر است")
		s.bot.Send(msg)
		return
	}

	err := models.UpdateWithdrawalStatus(s.db, id, models.WithdrawalStatusCompleted, adminID, "تکمیل شده توسط ادمین", "")
	if err != nil {
		msg := tgbotapi.NewMessage(chatID, "❌ خطا در بروزرسانی وضعیت درخواست")
		s.bot.Send(msg)
		return
	}

	text := fmt.Sprintf("✅ درخواست برداشت %s با موفقیت تکمیل شد", withdrawalID)

	msg := tgbotapi.NewMessage(chatID, text)
	s.bot.Send(msg)
}

func (s *TelegramService) parseWithdrawalID(idStr string) uint {
	// Simple string to uint conversion
	// You should implement proper error handling here
	var id uint
	fmt.Sscanf(idStr, "%d", &id)
	return id
}

// Notify admin when new withdrawal request is created
func (s *TelegramService) NotifyNewWithdrawalRequest(withdrawal *models.WithdrawalRequest) {
	text := "🚨 درخواست برداشت جدید!\n\n"
	text += fmt.Sprintf("🆔 ID: %d\n", withdrawal.ID)
	text += fmt.Sprintf("👤 کاربر: %s %s\n", withdrawal.User.FirstName, withdrawal.User.LastName)
	text += fmt.Sprintf("💰 مبلغ: %.2f %s\n", withdrawal.Amount, withdrawal.Currency)
	text += fmt.Sprintf("🌍 کشور: %s\n", withdrawal.SourceCountry)
	text += fmt.Sprintf("💳 کارت: %s\n", withdrawal.BankCardNumber)
	text += fmt.Sprintf("👤 نام: %s\n", withdrawal.CardHolderName)
	text += fmt.Sprintf("🏦 شبا: %s\n", withdrawal.ShebaNumber)
	text += fmt.Sprintf("🏛️ بانک: %s\n", withdrawal.BankName)
	text += fmt.Sprintf("📅 تاریخ: %s\n", withdrawal.RequestedAt.Format("2006/01/02 15:04"))

	keyboard := tgbotapi.NewInlineKeyboardMarkup(
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData(
				fmt.Sprintf("✅ تایید %d", withdrawal.ID),
				fmt.Sprintf("approve_withdrawal_%d", withdrawal.ID),
			),
			tgbotapi.NewInlineKeyboardButtonData(
				fmt.Sprintf("❌ رد %d", withdrawal.ID),
				fmt.Sprintf("reject_withdrawal_%d", withdrawal.ID),
			),
		),
	)

	// Send to all admins
	for _, adminID := range ADMIN_IDS {
		msg := tgbotapi.NewMessage(adminID, text)
		msg.ReplyMarkup = keyboard
		s.bot.Send(msg)
	}
}
