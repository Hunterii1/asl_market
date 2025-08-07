package services

import (
	"fmt"

	"asl-market-backend/models"

	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"
)

// NotifyNewProductSubmission sends notification to admins about new product submission
func (s *TelegramService) NotifyNewProductSubmission(product *models.AvailableProduct, user *models.User) {
	saleTypeText := "فروش عمده"
	if product.SaleType == "retail" {
		saleTypeText = "فروش تکی"
	}

	message := fmt.Sprintf(
		"🆕 **کالای جدید ثبت شد**\n\n"+
			"**کاربر:** %s %s\n"+
			"**ایمیل:** %s\n\n"+
			"**نام محصول:** %s\n"+
			"**نوع فروش:** %s\n"+
			"**دسته‌بندی:** %s\n"+
			"**مکان:** %s\n"+
			"**قیمت عمده:** %s %s\n"+
			"**قیمت خرده:** %s %s\n"+
			"**موجودی:** %d %s\n\n"+
			"**توضیحات:** %s\n\n"+
			"**وضعیت:** در انتظار بررسی\n\n"+
			"برای تأیید یا رد: /papprove%d یا /preject%d",
		user.FirstName, user.LastName,
		user.Email,
		product.ProductName,
		saleTypeText,
		product.Category,
		product.Location,
		product.WholesalePrice, product.Currency,
		product.RetailPrice, product.Currency,
		product.AvailableQuantity, product.Unit,
		product.Description,
		product.ID, product.ID,
	)

	for _, adminID := range ADMIN_IDS {
		msg := tgbotapi.NewMessage(adminID, message)
		msg.ParseMode = "Markdown"
		s.bot.Send(msg)
	}
}

// HandleProductApprovalCommands handles /papprove and /preject commands
func (s *TelegramService) HandleProductApprovalCommands(chatID int64, text string) bool {
	if len(text) < 8 {
		return false
	}

	var productID uint
	var action string

	if _, err := fmt.Sscanf(text, "/papprove%d", &productID); err == nil {
		action = "approve"
	} else if _, err := fmt.Sscanf(text, "/preject%d", &productID); err == nil {
		action = "reject"
	} else {
		return false
	}

	db := models.GetDB()
	var product models.AvailableProduct
	if err := db.Preload("AddedBy").First(&product, productID).Error; err != nil {
		s.bot.Send(tgbotapi.NewMessage(chatID, "❌ محصول یافت نشد"))
		return true
	}

	if action == "approve" {
		db.Model(&product).Update("status", "active")
		s.bot.Send(tgbotapi.NewMessage(chatID, fmt.Sprintf("✅ محصول '%s' تأیید شد و در سایت نمایش داده می‌شود", product.ProductName)))

		// Note: We could notify user via email or if they had telegram ID
		// userMsg := fmt.Sprintf("✅ کالای شما '%s' تأیید شد و در سایت نمایش داده شده است.", product.ProductName)

	} else if action == "reject" {
		db.Model(&product).Update("status", "rejected")
		s.bot.Send(tgbotapi.NewMessage(chatID, fmt.Sprintf("❌ محصول '%s' رد شد", product.ProductName)))
	}

	return true
}
