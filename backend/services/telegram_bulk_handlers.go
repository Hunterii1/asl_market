package services

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"asl-market-backend/models"
	"asl-market-backend/utils"

	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"
)

// Add constants for new menu items
const (
	// Bulk import menus
	MENU_BULK_IMPORT           = "📂 وارد کردن گروهی"
	MENU_BULK_IMPORT_SUPPLIERS = "🏪 وارد کردن تأمین‌کنندگان"
	MENU_BULK_IMPORT_VISITORS  = "🚶‍♂️ وارد کردن ویزیتورها"
	MENU_DOWNLOAD_TEMPLATES    = "📋 دانلود فایل نمونه"
	MENU_SUPPLIER_TEMPLATE     = "🏪 نمونه تأمین‌کنندگان"
	MENU_VISITOR_TEMPLATE      = "🚶‍♂️ نمونه ویزیتورها"

	// Single add menus
	MENU_SINGLE_ADD          = "➕ اضافه کردن تکی"
	MENU_ADD_SINGLE_SUPPLIER = "🏪 اضافه کردن تأمین‌کننده"
	MENU_ADD_SINGLE_VISITOR  = "🚶‍♂️ اضافه کردن ویزیتور"
	MENU_ADD_SINGLE_PRODUCT  = "📦 اضافه کردن کالا"

	// Available products menus
	MENU_BULK_IMPORT_PRODUCTS = "📦 وارد کردن کالاها"
	MENU_PRODUCT_TEMPLATE     = "📦 نمونه کالاها"
)

// showBulkImportMenu shows the bulk import options
func (s *TelegramService) showBulkImportMenu(chatID int64) {
	keyboard := tgbotapi.NewReplyKeyboard(
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_BULK_IMPORT_SUPPLIERS),
			tgbotapi.NewKeyboardButton(MENU_BULK_IMPORT_VISITORS),
		),
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_BULK_IMPORT_PRODUCTS),
		),
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_DOWNLOAD_TEMPLATES),
		),
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_BACK),
		),
	)
	keyboard.ResizeKeyboard = true

	message := "📂 **وارد کردن گروهی از فایل اکسل**\n\n" +
		"🎯 از این بخش می‌توانید:\n" +
		"• تأمین‌کنندگان و ویزیتورها را از فایل اکسل وارد کنید\n" +
		"• فایل‌های نمونه را دانلود کنید\n" +
		"• به صورت دسته‌ای اطلاعات را اضافه کنید\n\n" +
		"📝 **راهنما:**\n" +
		"• ابتدا فایل نمونه را دانلود کنید\n" +
		"• اطلاعات را در فایل اکسل وارد کنید\n" +
		"• فایل را ارسال کنید تا وارد شود\n" +
		"• تمام ردیف‌ها به صورت خودکار تأیید می‌شوند"

	msg := tgbotapi.NewMessage(chatID, message)
	msg.ParseMode = "Markdown"
	msg.ReplyMarkup = keyboard
	s.bot.Send(msg)
}

// showSingleAddMenu shows the single add options
func (s *TelegramService) showSingleAddMenu(chatID int64) {
	keyboard := tgbotapi.NewReplyKeyboard(
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_ADD_SINGLE_SUPPLIER),
			tgbotapi.NewKeyboardButton(MENU_ADD_SINGLE_VISITOR),
		),
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_ADD_SINGLE_PRODUCT),
		),
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_BACK),
		),
	)
	keyboard.ResizeKeyboard = true

	message := "➕ **اضافه کردن تکی**\n\n" +
		"🎯 از این بخش می‌توانید:\n" +
		"• تأمین‌کننده جدید اضافه کنید\n" +
		"• ویزیتور جدید اضافه کنید\n" +
		"• اطلاعات را مرحله به مرحله وارد کنید\n\n" +
		"📝 **راهنما:**\n" +
		"• گزینه مورد نظر را انتخاب کنید\n" +
		"• اطلاعات را طبق راهنما وارد کنید\n" +
		"• تمام موارد اضافه شده خودکار تأیید می‌شوند"

	msg := tgbotapi.NewMessage(chatID, message)
	msg.ParseMode = "Markdown"
	msg.ReplyMarkup = keyboard
	s.bot.Send(msg)
}

// showTemplateDownloadMenu shows template download options
func (s *TelegramService) showTemplateDownloadMenu(chatID int64) {
	keyboard := tgbotapi.NewReplyKeyboard(
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_SUPPLIER_TEMPLATE),
			tgbotapi.NewKeyboardButton(MENU_VISITOR_TEMPLATE),
		),
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_PRODUCT_TEMPLATE),
		),
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton(MENU_BACK),
		),
	)
	keyboard.ResizeKeyboard = true

	message := "📋 **دانلود فایل‌های نمونه اکسل**\n\n" +
		"📄 فایل‌های نمونه شامل:\n" +
		"• ستون‌های مورد نیاز\n" +
		"• نمونه داده‌های صحیح\n" +
		"• راهنمای پر کردن\n\n" +
		"💡 **توضیحات:**\n" +
		"• ستون‌های الزامی باید پر شوند\n" +
		"• فرمت تاریخ: YYYY-MM-DD\n" +
		"• برای گزینه‌های بله/خیر: بله یا خیر\n" +
		"• حداکثر ۱۰۰ ردیف در هر فایل"

	msg := tgbotapi.NewMessage(chatID, message)
	msg.ParseMode = "Markdown"
	msg.ReplyMarkup = keyboard
	s.bot.Send(msg)
}

// generateAndSendSupplierTemplate generates and sends supplier Excel template
func (s *TelegramService) generateAndSendSupplierTemplate(chatID int64) {
	excelService := NewExcelImportService(s.db)

	// Generate template
	f, err := excelService.GenerateSupplierTemplate()
	if err != nil {
		s.bot.Send(tgbotapi.NewMessage(chatID, fmt.Sprintf("❌ خطا در تولید فایل نمونه: %v", err)))
		return
	}

	// Create temp file
	tempDir := os.TempDir()
	fileName := fmt.Sprintf("supplier_template_%d.xlsx", time.Now().Unix())
	filePath := filepath.Join(tempDir, fileName)

	if err := f.SaveAs(filePath); err != nil {
		s.bot.Send(tgbotapi.NewMessage(chatID, fmt.Sprintf("❌ خطا در ذخیره فایل: %v", err)))
		return
	}

	// Send file
	document := tgbotapi.NewDocument(chatID, tgbotapi.FilePath(filePath))
	document.Caption = "📋 **فایل نمونه تأمین‌کنندگان**\n\n" +
		"🏪 این فایل شامل ستون‌های زیر است:\n" +
		"• اطلاعات شخصی تأمین‌کننده\n" +
		"• اطلاعات کسب و کار\n" +
		"• جزئیات محصولات (تا ۲ محصول)\n" +
		"• قیمت‌گذاری و شرایط\n\n" +
		"✅ **پس از پر کردن فایل، آن را ارسال کنید**"
	document.ParseMode = "Markdown"

	s.bot.Send(document)

	// Clean up temp file after a delay
	go func() {
		time.Sleep(1 * time.Minute)
		os.Remove(filePath)
	}()
}

// generateAndSendVisitorTemplate generates and sends visitor Excel template
func (s *TelegramService) generateAndSendVisitorTemplate(chatID int64) {
	excelService := NewExcelImportService(s.db)

	// Generate template
	f, err := excelService.GenerateVisitorTemplate()
	if err != nil {
		s.bot.Send(tgbotapi.NewMessage(chatID, fmt.Sprintf("❌ خطا در تولید فایل نمونه: %v", err)))
		return
	}

	// Create temp file
	tempDir := os.TempDir()
	fileName := fmt.Sprintf("visitor_template_%d.xlsx", time.Now().Unix())
	filePath := filepath.Join(tempDir, fileName)

	if err := f.SaveAs(filePath); err != nil {
		s.bot.Send(tgbotapi.NewMessage(chatID, fmt.Sprintf("❌ خطا در ذخیره فایل: %v", err)))
		return
	}

	// Send file
	document := tgbotapi.NewDocument(chatID, tgbotapi.FilePath(filePath))
	document.Caption = "📋 **فایل نمونه ویزیتورها**\n\n" +
		"🚶‍♂️ این فایل شامل ستون‌های زیر است:\n" +
		"• اطلاعات شناسایی فردی\n" +
		"• اطلاعات محل سکونت و سفر\n" +
		"• اطلاعات بانکی\n" +
		"• سوابق کاری و مهارت‌ها\n\n" +
		"✅ **پس از پر کردن فایل، آن را ارسال کنید**"
	document.ParseMode = "Markdown"

	s.bot.Send(document)

	// Clean up temp file after a delay
	go func() {
		time.Sleep(1 * time.Minute)
		os.Remove(filePath)
	}()
}

// generateAndSendProductTemplate generates and sends available product Excel template
func (s *TelegramService) generateAndSendProductTemplate(chatID int64) {
	excelService := NewExcelImportService(s.db)

	// Generate template
	f, err := excelService.GenerateAvailableProductTemplate()
	if err != nil {
		s.bot.Send(tgbotapi.NewMessage(chatID, fmt.Sprintf("❌ خطا در تولید فایل نمونه: %v", err)))
		return
	}

	// Create temp file
	tempDir := os.TempDir()
	fileName := fmt.Sprintf("product_template_%d.xlsx", time.Now().Unix())
	filePath := filepath.Join(tempDir, fileName)

	if err := f.SaveAs(filePath); err != nil {
		s.bot.Send(tgbotapi.NewMessage(chatID, fmt.Sprintf("❌ خطا در ذخیره فایل: %v", err)))
		return
	}

	// Send file
	document := tgbotapi.NewDocument(chatID, tgbotapi.FilePath(filePath))
	document.Caption = "📋 **فایل نمونه کالاهای موجود**\n\n" +
		"📦 این فایل شامل ستون‌های زیر است:\n" +
		"• اطلاعات اصلی محصول (نام، دسته‌بندی، توضیحات)\n" +
		"• قیمت‌گذاری (عمده، خرده، صادراتی)\n" +
		"• موجودی و سفارش (تعداد، حداقل، حداکثر)\n" +
		"• جزئیات محصول (برند، مدل، کیفیت)\n" +
		"• بسته‌بندی و حمل (نوع، وزن، ابعاد)\n" +
		"• اطلاعات تماس و مکان\n" +
		"• صادرات و مجوزها\n\n" +
		"✅ **پس از پر کردن فایل، آن را ارسال کنید**"
	document.ParseMode = "Markdown"

	s.bot.Send(document)

	// Clean up temp file after a delay
	go func() {
		time.Sleep(1 * time.Minute)
		os.Remove(filePath)
	}()
}

// promptBulkImportProducts prompts for available product Excel file upload
func (s *TelegramService) promptBulkImportProducts(chatID int64) {
	message := "📦 **وارد کردن گروهی کالاهای موجود**\n\n" +
		"📤 لطفا فایل اکسل کالاها را ارسال کنید\n\n" +
		"📋 **الزامات فایل:**\n" +
		"• فرمت: .xlsx یا .xls\n" +
		"• حداکثر ۱۰۰ ردیف\n" +
		"• شامل ستون‌های الزامی\n" +
		"• طبق فرمت فایل نمونه\n\n" +
		"⚠️ **نکات مهم:**\n" +
		"• ردیف اول باید header باشد\n" +
		"• تمام کالاها خودکار فعال می‌شوند\n" +
		"• برای لغو /cancel تایپ کنید"

	// Set session state
	sessionMutex.Lock()
	sessionStates[chatID] = &SessionState{
		ChatID:          chatID,
		WaitingForInput: "bulk_import_products_file",
	}
	sessionMutex.Unlock()

	msg := tgbotapi.NewMessage(chatID, message)
	msg.ParseMode = "Markdown"
	s.bot.Send(msg)
}

// promptBulkImportSuppliers prompts for supplier Excel file upload
func (s *TelegramService) promptBulkImportSuppliers(chatID int64) {
	message := "🏪 **وارد کردن گروهی تأمین‌کنندگان**\n\n" +
		"📤 لطفا فایل اکسل تأمین‌کنندگان را ارسال کنید\n\n" +
		"📋 **الزامات فایل:**\n" +
		"• فرمت: .xlsx یا .xls\n" +
		"• حداکثر ۱۰۰ ردیف\n" +
		"• شامل ستون‌های الزامی\n" +
		"• طبق فرمت فایل نمونه\n\n" +
		"⚠️ **نکات مهم:**\n" +
		"• ردیف اول باید header باشد\n" +
		"• تمام تأمین‌کنندگان خودکار تأیید می‌شوند\n" +
		"• برای لغو /cancel تایپ کنید"

	// Set session state
	sessionMutex.Lock()
	sessionStates[chatID] = &SessionState{
		ChatID:          chatID,
		WaitingForInput: "bulk_import_suppliers_file",
	}
	sessionMutex.Unlock()

	msg := tgbotapi.NewMessage(chatID, message)
	msg.ParseMode = "Markdown"
	s.bot.Send(msg)
}

// promptBulkImportVisitors prompts for visitor Excel file upload
func (s *TelegramService) promptBulkImportVisitors(chatID int64) {
	message := "🚶‍♂️ **وارد کردن گروهی ویزیتورها**\n\n" +
		"📤 لطفا فایل اکسل ویزیتورها را ارسال کنید\n\n" +
		"📋 **الزامات فایل:**\n" +
		"• فرمت: .xlsx یا .xls\n" +
		"• حداکثر ۱۰۰ ردیف\n" +
		"• شامل ستون‌های الزامی\n" +
		"• طبق فرمت فایل نمونه\n\n" +
		"⚠️ **نکات مهم:**\n" +
		"• ردیف اول باید header باشد\n" +
		"• تمام ویزیتورها خودکار تأیید می‌شوند\n" +
		"• برای لغو /cancel تایپ کنید"

	// Set session state
	sessionMutex.Lock()
	sessionStates[chatID] = &SessionState{
		ChatID:          chatID,
		WaitingForInput: "bulk_import_visitors_file",
	}
	sessionMutex.Unlock()

	msg := tgbotapi.NewMessage(chatID, message)
	msg.ParseMode = "Markdown"
	s.bot.Send(msg)
}

// handleFileUpload handles Excel file uploads for bulk import
func (s *TelegramService) handleFileUpload(update *tgbotapi.Update) {
	if update.Message.Document == nil {
		return
	}

	chatID := update.Message.Chat.ID

	// Check session state
	sessionMutex.RLock()
	state, exists := sessionStates[chatID]
	sessionMutex.RUnlock()

	if !exists {
		return // No active session
	}

	document := update.Message.Document

	// Validate file type
	if !strings.HasSuffix(strings.ToLower(document.FileName), ".xlsx") &&
		!strings.HasSuffix(strings.ToLower(document.FileName), ".xls") {
		s.bot.Send(tgbotapi.NewMessage(chatID, "❌ لطفا فایل اکسل (.xlsx یا .xls) ارسال کنید"))
		return
	}

	// Validate file size (5MB limit)
	if document.FileSize > 5*1024*1024 {
		s.bot.Send(tgbotapi.NewMessage(chatID, "❌ حجم فایل نباید بیشتر از ۵ مگابایت باشد"))
		return
	}

	// Download file
	fileURL, err := s.bot.GetFileDirectURL(document.FileID)
	if err != nil {
		s.bot.Send(tgbotapi.NewMessage(chatID, fmt.Sprintf("❌ خطا در دریافت فایل: %v", err)))
		return
	}

	// Download to temp file
	tempDir := os.TempDir()
	fileName := fmt.Sprintf("import_%d_%s", time.Now().Unix(), document.FileName)
	filePath := filepath.Join(tempDir, fileName)

	if err := s.downloadFile(fileURL, filePath); err != nil {
		s.bot.Send(tgbotapi.NewMessage(chatID, fmt.Sprintf("❌ خطا در دانلود فایل: %v", err)))
		return
	}

	// Process file based on session state
	s.bot.Send(tgbotapi.NewMessage(chatID, "⏳ در حال پردازش فایل... لطفا کمی صبر کنید"))

	excelService := NewExcelImportService(s.db)
	var result *ImportResult

	switch state.WaitingForInput {
	case "bulk_import_suppliers_file":
		result, err = excelService.ImportSuppliersFromExcel(filePath)
	case "bulk_import_visitors_file":
		result, err = excelService.ImportVisitorsFromExcel(filePath)
	case "bulk_import_products_file":
		// For available products, we need to get the admin user ID
		// Since this is admin-only functionality, we can use a default admin ID
		// In production, you might want to store admin info in session
		result, err = excelService.ImportAvailableProductsFromExcel(filePath, 1) // Assuming admin user ID is 1
	default:
		s.bot.Send(tgbotapi.NewMessage(chatID, "❌ نوع فایل نامشخص"))
		return
	}

	// Clean up temp file
	os.Remove(filePath)

	// Clear session state
	sessionMutex.Lock()
	delete(sessionStates, chatID)
	sessionMutex.Unlock()

	if err != nil {
		s.bot.Send(tgbotapi.NewMessage(chatID, fmt.Sprintf("❌ خطا در پردازش فایل: %v", err)))
		return
	}

	// Send results
	s.sendImportResults(chatID, result, state.WaitingForInput)
}

// downloadFile downloads a file from URL to local path
func (s *TelegramService) downloadFile(url, filepath string) error {
	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	out, err := os.Create(filepath)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, resp.Body)
	return err
}

// sendImportResults sends the import results to user
func (s *TelegramService) sendImportResults(chatID int64, result *ImportResult, importType string) {
	var entityType string
	switch importType {
	case "bulk_import_suppliers_file":
		entityType = "تأمین‌کننده"
	case "bulk_import_visitors_file":
		entityType = "ویزیتور"
	case "bulk_import_products_file":
		entityType = "کالا"
	default:
		entityType = "آیتم"
	}

	message := fmt.Sprintf(
		"📊 **نتایج وارد کردن گروهی %s**\n\n"+
			"📈 **آمار کلی:**\n"+
			"• 📄 تعداد کل ردیف‌ها: `%d`\n"+
			"• ✅ موفق: `%d`\n"+
			"• ❌ ناموفق: `%d`\n"+
			"• 📊 نرخ موفقیت: `%.1f%%`\n\n",
		entityType,
		result.TotalRows,
		result.SuccessCount,
		result.ErrorCount,
		float64(result.SuccessCount)/float64(result.TotalRows)*100,
	)

	// Add success items (first 10)
	if len(result.SuccessItems) > 0 {
		message += "✅ **موارد موفق:**\n"
		for i, item := range result.SuccessItems {
			if i >= 10 {
				message += fmt.Sprintf("• ... و %d مورد دیگر\n", len(result.SuccessItems)-10)
				break
			}
			message += fmt.Sprintf("• %s\n", item)
		}
		message += "\n"
	}

	// Add errors (first 10)
	if len(result.Errors) > 0 {
		message += "❌ **خطاها:**\n"
		for i, err := range result.Errors {
			if i >= 10 {
				message += fmt.Sprintf("• ... و %d خطای دیگر\n", len(result.Errors)-10)
				break
			}
			message += fmt.Sprintf("• %s\n", err)
		}
		message += "\n"
	}

	message += "🎯 **تمام موارد موفق به صورت خودکار تأیید شده‌اند**"

	msg := tgbotapi.NewMessage(chatID, message)
	msg.ParseMode = "Markdown"
	s.bot.Send(msg)

	// Return to main menu
	s.showBulkImportMenu(chatID)
}

// promptAddSingleSupplier prompts for single supplier creation
func (s *TelegramService) promptAddSingleSupplier(chatID int64) {
	message := "🏪 **اضافه کردن تأمین‌کننده تکی**\n\n" +
		"📝 لطفا اطلاعات تأمین‌کننده را به ترتیب زیر وارد کنید:\n\n" +
		"**فرمت ورودی:**\n" +
		"```\n" +
		"نام: [نام و نام خانوادگی]\n" +
		"موبایل: [شماره موبایل]\n" +
		"برند: [نام برند]\n" +
		"عکس: [لینک عکس]\n" +
		"شهر: [شهر]\n" +
		"آدرس: [آدرس کامل]\n" +
		"کسب و کار: [بله/خیر]\n" +
		"شماره ثبت: [شماره ثبت کسب و کار]\n" +
		"صادرات: [بله/خیر]\n" +
		"قیمت صادرات: [قیمت]\n" +
		"قیمت عمده: [حداقل قیمت عمده]\n" +
		"قیمت حجم بالا: [قیمت حجم بالا]\n" +
		"برند خصوصی: [بله/خیر]\n" +
		"محصول: [نام محصول]\n" +
		"نوع محصول: [نوع]\n" +
		"توضیحات: [توضیحات محصول]\n" +
		"مجوز: [بله/خیر]\n" +
		"نوع مجوز: [نوع مجوز]\n" +
		"تولید ماهانه: [تعداد]\n" +
		"```\n\n" +
		"**مثال:**\n" +
		"```\n" +
		"نام: احمد محمدی\n" +
		"موبایل: 09123456789\n" +
		"برند: برند نمونه\n" +
		"عکس: https://example.com/photo.jpg\n" +
		"شهر: تهران\n" +
		"آدرس: خیابان ولیعصر\n" +
		"کسب و کار: بله\n" +
		"شماره ثبت: 123456\n" +
		"صادرات: بله\n" +
		"قیمت صادرات: $10\n" +
		"قیمت عمده: 50000\n" +
		"قیمت حجم بالا: 45000\n" +
		"برند خصوصی: بله\n" +
		"محصول: خشکبار\n" +
		"نوع محصول: غذایی\n" +
		"توضیحات: خشکبار درجه یک\n" +
		"مجوز: خیر\n" +
		"نوع مجوز: \n" +
		"تولید ماهانه: 1000\n" +
		"```\n\n" +
		"⚠️ برای لغو /cancel تایپ کنید"

	// Set session state
	sessionMutex.Lock()
	sessionStates[chatID] = &SessionState{
		ChatID:          chatID,
		WaitingForInput: "single_supplier_data",
	}
	sessionMutex.Unlock()

	msg := tgbotapi.NewMessage(chatID, message)
	msg.ParseMode = "Markdown"
	s.bot.Send(msg)
}

// promptAddSingleVisitor prompts for single visitor creation
func (s *TelegramService) promptAddSingleVisitor(chatID int64) {
	message := "🚶‍♂️ **اضافه کردن ویزیتور تکی**\n\n" +
		"📝 لطفا اطلاعات ویزیتور را به ترتیب زیر وارد کنید:\n\n" +
		"**فرمت ورودی:**\n" +
		"```\n" +
		"نام: [نام و نام خانوادگی]\n" +
		"کد ملی: [کد ملی]\n" +
		"پاسپورت: [شماره پاسپورت]\n" +
		"تولد: [تاریخ تولد YYYY-MM-DD]\n" +
		"موبایل: [شماره موبایل]\n" +
		"واتساپ: [شماره واتساپ]\n" +
		"ایمیل: [آدرس ایمیل]\n" +
		"آدرس: [آدرس کامل]\n" +
		"شهر: [شهر/استان]\n" +
		"مقصد: [شهرهای مقصد]\n" +
		"ارتباط محلی: [بله/خیر]\n" +
		"جزئیات ارتباط: [توضیحات]\n" +
		"حساب بانکی: [شماره IBAN]\n" +
		"نام بانک: [نام بانک]\n" +
		"صاحب حساب: [نام]\n" +
		"بازاریابی: [بله/خیر]\n" +
		"زبان: [excellent/good/weak/none]\n" +
		"سابقه بازاریابی: [توضیحات]\n" +
		"مهارت: [مهارت‌های خاص]\n" +
		"```\n\n" +
		"**مثال:**\n" +
		"```\n" +
		"نام: فاطمه احمدی\n" +
		"کد ملی: 1234567890\n" +
		"پاسپورت: P123456\n" +
		"تولد: 1985-03-15\n" +
		"موبایل: 09123456789\n" +
		"واتساپ: 09123456789\n" +
		"ایمیل: fateme@example.com\n" +
		"آدرس: تهران، خیابان انقلاب\n" +
		"شهر: تهران\n" +
		"مقصد: دبی، ابوظبی\n" +
		"ارتباط محلی: بله\n" +
		"جزئیات ارتباط: دوست در دبی\n" +
		"حساب بانکی: IR123456789\n" +
		"نام بانک: بانک ملی\n" +
		"صاحب حساب: فاطمه احمدی\n" +
		"بازاریابی: بله\n" +
		"زبان: good\n" +
		"سابقه بازاریابی: ۳ سال\n" +
		"مهارت: عکاسی\n" +
		"```\n\n" +
		"⚠️ برای لغو /cancel تایپ کنید"

	// Set session state
	sessionMutex.Lock()
	sessionStates[chatID] = &SessionState{
		ChatID:          chatID,
		WaitingForInput: "single_visitor_data",
	}
	sessionMutex.Unlock()

	msg := tgbotapi.NewMessage(chatID, message)
	msg.ParseMode = "Markdown"
	s.bot.Send(msg)
}

// handleSingleSupplierInput handles single supplier input
func (s *TelegramService) handleSingleSupplierInput(chatID int64, text string) {
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

	// Create supplier request
	parseBool := func(value string) bool {
		value = strings.ToLower(strings.TrimSpace(value))
		return value == "بله" || value == "yes" || value == "true"
	}

	req := models.SupplierRegistrationRequest{
		FullName:                 data["نام"],
		Mobile:                   data["موبایل"],
		BrandName:                data["برند"],
		ImageURL:                 data["عکس"],
		City:                     data["شهر"],
		Address:                  data["آدرس"],
		HasRegisteredBusiness:    parseBool(data["کسب و کار"]),
		BusinessRegistrationNum:  data["شماره ثبت"],
		HasExportExperience:      parseBool(data["صادرات"]),
		ExportPrice:              data["قیمت صادرات"],
		WholesaleMinPrice:        data["قیمت عمده"],
		WholesaleHighVolumePrice: data["قیمت حجم بالا"],
		CanProducePrivateLabel:   parseBool(data["برند خصوصی"]),
	}

	// Add product
	if data["محصول"] != "" {
		product := models.SupplierProductRequest{
			ProductName:          data["محصول"],
			ProductType:          data["نوع محصول"],
			Description:          data["توضیحات"],
			NeedsExportLicense:   parseBool(data["مجوز"]),
			RequiredLicenseType:  data["نوع مجوز"],
			MonthlyProductionMin: data["تولید ماهانه"],
		}
		req.Products = append(req.Products, product)
	}

	// Validation
	if req.FullName == "" || req.Mobile == "" || req.City == "" || req.WholesaleMinPrice == "" {
		s.bot.Send(tgbotapi.NewMessage(chatID, "❌ فیلدهای الزامی (نام، موبایل، شهر، قیمت عمده) باید پر شوند"))
		return
	}

	if len(req.Products) == 0 {
		s.bot.Send(tgbotapi.NewMessage(chatID, "❌ حداقل یک محصول الزامی است"))
		return
	}

	// Create user and supplier
	s.createSupplierFromInput(chatID, req)
}

// handleSingleVisitorInput handles single visitor input
func (s *TelegramService) handleSingleVisitorInput(chatID int64, text string) {
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

	// Create visitor request
	parseBool := func(value string) bool {
		value = strings.ToLower(strings.TrimSpace(value))
		return value == "بله" || value == "yes" || value == "true"
	}

	req := models.VisitorRegistrationRequest{
		FullName:                      data["نام"],
		NationalID:                    data["کد ملی"],
		PassportNumber:                data["پاسپورت"],
		BirthDate:                     data["تولد"],
		Mobile:                        data["موبایل"],
		WhatsappNumber:                data["واتساپ"],
		Email:                         data["ایمیل"],
		ResidenceAddress:              data["آدرس"],
		CityProvince:                  data["شهر"],
		DestinationCities:             data["مقصد"],
		HasLocalContact:               parseBool(data["ارتباط محلی"]),
		LocalContactDetails:           data["جزئیات ارتباط"],
		BankAccountIBAN:               data["حساب بانکی"],
		BankName:                      data["نام بانک"],
		AccountHolderName:             data["صاحب حساب"],
		HasMarketingExperience:        parseBool(data["بازاریابی"]),
		LanguageLevel:                 data["زبان"],
		MarketingExperienceDesc:       data["سابقه بازاریابی"],
		SpecialSkills:                 data["مهارت"],
		InterestedProducts:            data["محصولات مورد علاقه"],
		AgreesToUseApprovedProducts:   true,
		AgreesToViolationConsequences: true,
		AgreesToSubmitReports:         true,
		DigitalSignature:              "TELEGRAM_IMPORT",
	}

	// Validation
	if req.FullName == "" || req.Mobile == "" || req.Email == "" || req.CityProvince == "" {
		s.bot.Send(tgbotapi.NewMessage(chatID, "❌ فیلدهای الزامی (نام، موبایل، ایمیل، شهر) باید پر شوند"))
		return
	}

	// Create user and visitor
	s.createVisitorFromInput(chatID, req)
}

// createSupplierFromInput creates supplier from parsed input
func (s *TelegramService) createSupplierFromInput(chatID int64, req models.SupplierRegistrationRequest) {
	// Create user first
	nameParts := strings.Split(req.FullName, " ")
	firstName := nameParts[0]
	lastName := "imported"
	if len(nameParts) > 1 {
		lastName = strings.Join(nameParts[1:], " ")
	}

	email := fmt.Sprintf("supplier_%s@telegram.com", req.Mobile)
	hashedPassword, _ := utils.HashPassword("telegram123")

	user := models.User{
		FirstName: firstName,
		LastName:  lastName,
		Email:     email,
		Password:  hashedPassword,
		Phone:     req.Mobile,
		IsActive:  true,
	}

	// Check if user exists
	var existingUser models.User
	if err := s.db.Where("email = ?", email).First(&existingUser).Error; err != nil {
		// Create new user
		if err := s.db.Create(&user).Error; err != nil {
			s.bot.Send(tgbotapi.NewMessage(chatID, fmt.Sprintf("❌ خطا در ایجاد کاربر: %v", err)))
			return
		}
		existingUser = user
	}

	// Create supplier
	supplier, err := models.CreateSupplier(s.db, existingUser.ID, req)
	if err != nil {
		s.bot.Send(tgbotapi.NewMessage(chatID, fmt.Sprintf("❌ خطا در ایجاد تأمین‌کننده: %v", err)))
		return
	}

	// Auto-approve
	s.db.Model(supplier).Update("status", "approved")

	message := fmt.Sprintf(
		"✅ **تأمین‌کننده با موفقیت اضافه شد!**\n\n"+
			"🏪 **نام:** %s\n"+
			"📱 **موبایل:** %s\n"+
			"🏷️ **برند:** %s\n"+
			"🏙️ **شهر:** %s\n"+
			"📦 **تعداد محصولات:** %d\n"+
			"✅ **وضعیت:** تأیید شده\n\n"+
			"🔐 **اطلاعات ورود:**\n"+
			"📧 **ایمیل:** %s\n"+
			"🗝️ **رمز عبور:** telegram123",
		req.FullName,
		req.Mobile,
		req.BrandName,
		req.City,
		len(req.Products),
		email,
	)

	// Clear session state
	sessionMutex.Lock()
	delete(sessionStates, chatID)
	sessionMutex.Unlock()

	s.bot.Send(tgbotapi.NewMessage(chatID, message))
	s.showSingleAddMenu(chatID)
}

// createVisitorFromInput creates visitor from parsed input
func (s *TelegramService) createVisitorFromInput(chatID int64, req models.VisitorRegistrationRequest) {
	// Create user first
	nameParts := strings.Split(req.FullName, " ")
	firstName := nameParts[0]
	lastName := "imported"
	if len(nameParts) > 1 {
		lastName = strings.Join(nameParts[1:], " ")
	}

	hashedPassword, _ := utils.HashPassword("telegram123")

	user := models.User{
		FirstName: firstName,
		LastName:  lastName,
		Email:     req.Email,
		Password:  hashedPassword,
		Phone:     req.Mobile,
		IsActive:  true,
	}

	// Check if user exists
	var existingUser models.User
	if err := s.db.Where("email = ?", req.Email).First(&existingUser).Error; err != nil {
		// Create new user
		if err := s.db.Create(&user).Error; err != nil {
			s.bot.Send(tgbotapi.NewMessage(chatID, fmt.Sprintf("❌ خطا در ایجاد کاربر: %v", err)))
			return
		}
		existingUser = user
	}

	// Create visitor
	visitor, err := models.CreateVisitor(s.db, existingUser.ID, req)
	if err != nil {
		s.bot.Send(tgbotapi.NewMessage(chatID, fmt.Sprintf("❌ خطا در ایجاد ویزیتور: %v", err)))
		return
	}

	// Auto-approve
	s.db.Model(visitor).Update("status", "approved")

	message := fmt.Sprintf(
		"✅ **ویزیتور با موفقیت اضافه شد!**\n\n"+
			"🚶‍♂️ **نام:** %s\n"+
			"📱 **موبایل:** %s\n"+
			"📧 **ایمیل:** %s\n"+
			"🏙️ **شهر:** %s\n"+
			"✈️ **مقصد:** %s\n"+
			"🌐 **زبان:** %s\n"+
			"✅ **وضعیت:** تأیید شده\n\n"+
			"🔐 **اطلاعات ورود:**\n"+
			"📧 **ایمیل:** %s\n"+
			"🗝️ **رمز عبور:** telegram123",
		req.FullName,
		req.Mobile,
		req.Email,
		req.CityProvince,
		req.DestinationCities,
		req.LanguageLevel,
		req.Email,
	)

	// Clear session state
	sessionMutex.Lock()
	delete(sessionStates, chatID)
	sessionMutex.Unlock()

	s.bot.Send(tgbotapi.NewMessage(chatID, message))
	s.showSingleAddMenu(chatID)
}
