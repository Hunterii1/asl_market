package services

import (
	"fmt"
	"strconv"
	"strings"

	"asl-market-backend/models"

	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"
)

// promptAddSingleProduct prompts for single available product creation
func (s *TelegramService) promptAddSingleProduct(chatID int64) {
	message := "📦 **اضافه کردن کالای موجود تکی**\n\n" +
		"📝 لطفا اطلاعات کالا را به ترتیب زیر وارد کنید:\n\n" +
		"**فرمت ورودی (حداقل موارد الزامی):**\n" +
		"```\n" +
		"نام: [نام محصول]\n" +
		"دسته: [دسته‌بندی]\n" +
		"توضیحات: [توضیحات محصول]\n" +
		"عکس: [لینک عکس]\n" +
		"قیمت عمده: [قیمت عمده فروشی]\n" +
		"مکان: [مکان]\n" +
		"موجودی: [تعداد موجودی]\n" +
		"واحد: [piece/kg/box]\n" +
		"تلفن: [شماره تماس]\n" +
		"```\n\n" +
		"**مثال:**\n" +
		"```\n" +
		"نام: خشکبار ممتاز\n" +
		"دسته: غذایی\n" +
		"توضیحات: خشکبار درجه یک\n" +
		"عکس: https://example.com/nuts.jpg\n" +
		"قیمت عمده: 50000\n" +
		"مکان: تهران\n" +
		"موجودی: 1000\n" +
		"واحد: kg\n" +
		"تلفن: 02133445566\n" +
		"```\n\n" +
		"⚠️ برای لغو /cancel تایپ کنید"

	// Set session state
	sessionMutex.Lock()
	sessionStates[chatID] = &SessionState{
		ChatID:          chatID,
		WaitingForInput: "single_product_data",
	}
	sessionMutex.Unlock()

	msg := tgbotapi.NewMessage(chatID, message)
	msg.ParseMode = "Markdown"
	s.bot.Send(msg)
}

// handleSingleProductInput handles single available product input
func (s *TelegramService) handleSingleProductInput(chatID int64, text string) {
	lines := strings.Split(text, "\n")
	data := make(map[string]string)

	// Parse input
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if strings.Contains(line, ":") {
			parts := strings.SplitN(line, ":", 2)
			if len(parts) == 2 {
				key := strings.TrimSpace(parts[0])
				value := strings.TrimSpace(parts[1])
				data[key] = value
			}
		}
	}

	// Create product request
	parseInt := func(value string, defaultVal int) int {
		if value == "" {
			return defaultVal
		}
		if i, err := strconv.Atoi(value); err == nil {
			return i
		}
		return defaultVal
	}

	req := models.CreateAvailableProductRequest{
		ProductName:       data["نام"],
		Category:          data["دسته"],
		Description:       data["توضیحات"],
		ImageURLs:         data["عکس"],
		WholesalePrice:    data["قیمت عمده"],
		Currency:          "USD",
		AvailableQuantity: parseInt(data["موجودی"], 0),
		MinOrderQuantity:  1,
		Unit:              data["واحد"],
		Location:          data["مکان"],
		ContactPhone:      data["تلفن"],
	}

	// Set defaults
	if req.Unit == "" {
		req.Unit = "piece"
	}

	// Validation
	if req.ProductName == "" || req.Category == "" || req.Location == "" {
		s.bot.Send(tgbotapi.NewMessage(chatID, "❌ فیلدهای الزامی (نام، دسته، مکان) باید پر شوند"))
		return
	}

	// Create available product
	s.createProductFromInput(chatID, req)
}

// createProductFromInput creates available product from parsed input
func (s *TelegramService) createProductFromInput(chatID int64, req models.CreateAvailableProductRequest) {
	// Create available product (using admin user ID 1)
	product, err := models.CreateAvailableProduct(s.db, 1, req)
	if err != nil {
		s.bot.Send(tgbotapi.NewMessage(chatID, fmt.Sprintf("❌ خطا در ایجاد کالا: %v", err)))
		return
	}

	// Auto-activate
	s.db.Model(product).Update("status", "active")

	message := fmt.Sprintf(
		"✅ **کالا با موفقیت اضافه شد!**\n\n"+
			"📦 **نام:** %s\n"+
			"📂 **دسته:** %s\n"+
			"💰 **قیمت عمده:** %s %s\n"+
			"📍 **مکان:** %s\n"+
			"📊 **موجودی:** %d %s\n"+
			"✅ **وضعیت:** فعال\n\n"+
			"🎯 **کالا در سیستم ثبت و فعال شده است**",
		req.ProductName,
		req.Category,
		req.WholesalePrice,
		req.Currency,
		req.Location,
		req.AvailableQuantity,
		req.Unit,
	)

	// Clear session state
	sessionMutex.Lock()
	delete(sessionStates, chatID)
	sessionMutex.Unlock()

	s.bot.Send(tgbotapi.NewMessage(chatID, message))
	s.showSingleAddMenu(chatID)
}
