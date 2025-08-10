package services

import (
	"fmt"
	"strconv"
	"strings"

	"asl-market-backend/models"

	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"
)

// Training menu constants
const (
	MENU_TRAINING_CATEGORIES   = "training_categories"
	MENU_TRAINING_ADD_CATEGORY = "training_add_category"
	MENU_TRAINING_ADD_VIDEO    = "training_add_video"
	MENU_TRAINING_LIST_VIDEOS  = "training_list_videos"
	MENU_TRAINING_EDIT_VIDEO   = "training_edit_video"
	MENU_TRAINING_DELETE_VIDEO = "training_delete_video"
	MENU_TRAINING_STATS        = "training_stats"
)

// showTrainingMenu displays the training management menu
func (ts *TelegramService) showTrainingMenu(chatID int64) {
	keyboard := tgbotapi.NewInlineKeyboardMarkup(
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("📂 مدیریت دسته‌بندی‌ها", MENU_TRAINING_CATEGORIES),
			tgbotapi.NewInlineKeyboardButtonData("➕ اضافه کردن ویدیو", MENU_TRAINING_ADD_VIDEO),
		),
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("📹 لیست ویدیوها", MENU_TRAINING_LIST_VIDEOS),
			tgbotapi.NewInlineKeyboardButtonData("📊 آمار آموزش", MENU_TRAINING_STATS),
		),
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("🔙 بازگشت به منوی اصلی", "main_menu"),
		),
	)

	message := "🎓 **مدیریت آموزش و ویدیوها**\n\n"
	message += "از منوی زیر گزینه مورد نظر خود را انتخاب کنید:\n\n"
	message += "📂 **مدیریت دسته‌بندی‌ها**: ایجاد و مدیریت دسته‌بندی‌های آموزشی\n"
	message += "➕ **اضافه کردن ویدیو**: آپلود ویدیو جدید یا افزودن لینک\n"
	message += "📹 **لیست ویدیوها**: مشاهده و مدیریت ویدیوهای موجود\n"
	message += "📊 **آمار آموزش**: مشاهده آمار ویدیوها و بازدیدها"

	msg := tgbotapi.NewMessage(chatID, message)
	msg.ParseMode = "Markdown"
	msg.ReplyMarkup = keyboard
	ts.bot.Send(msg)
}

// showTrainingCategories shows all categories with management options
func (ts *TelegramService) showTrainingCategories(chatID int64) {
	categories, err := models.GetTrainingCategories(models.GetDB())
	if err != nil {
		ts.bot.Send(tgbotapi.NewMessage(chatID, "❌ خطا در دریافت دسته‌بندی‌ها"))
		return
	}

	var keyboard [][]tgbotapi.InlineKeyboardButton

	if len(categories) == 0 {
		message := "📂 **دسته‌بندی‌های آموزشی**\n\n"
		message += "هیچ دسته‌بندی‌ای یافت نشد.\n"
		message += "برای شروع، دسته‌بندی جدید ایجاد کنید."
	} else {
		message := "📂 **دسته‌بندی‌های آموزشی**\n\n"
		for _, category := range categories {
			videoCount := len(category.Videos)
			message += fmt.Sprintf("🔸 **%s**\n", category.Name)
			message += fmt.Sprintf("   📹 تعداد ویدیو: %d\n", videoCount)
			if category.Description != "" {
				message += fmt.Sprintf("   📝 %s\n", category.Description)
			}
			message += fmt.Sprintf("   🎯 وضعیت: %s\n\n", map[bool]string{true: "فعال", false: "غیرفعال"}[category.IsActive])
		}

		msg := tgbotapi.NewMessage(chatID, message)
		msg.ParseMode = "Markdown"
		ts.bot.Send(msg)
	}

	// Add management buttons
	keyboard = append(keyboard, []tgbotapi.InlineKeyboardButton{
		tgbotapi.NewInlineKeyboardButtonData("➕ دسته‌بندی جدید", MENU_TRAINING_ADD_CATEGORY),
	})
	keyboard = append(keyboard, []tgbotapi.InlineKeyboardButton{
		tgbotapi.NewInlineKeyboardButtonData("🔙 بازگشت", MENU_TRAINING),
	})

	replyMarkup := tgbotapi.NewInlineKeyboardMarkup(keyboard...)
	msg := tgbotapi.NewMessage(chatID, "انتخاب کنید:")
	msg.ReplyMarkup = replyMarkup
	ts.bot.Send(msg)
}

// showTrainingVideos shows all videos with management options
func (ts *TelegramService) showTrainingVideos(chatID int64) {
	videos, err := models.GetAllActiveVideos(models.GetDB())
	if err != nil {
		ts.bot.Send(tgbotapi.NewMessage(chatID, "❌ خطا در دریافت ویدیوها"))
		return
	}

	message := "📹 **ویدیوهای آموزشی**\n\n"

	if len(videos) == 0 {
		message += "هیچ ویدیویی یافت نشد.\n"
		message += "برای شروع، ویدیو جدید اضافه کنید."
	} else {
		currentCategory := ""
		for _, video := range videos {
			if video.Category.Name != currentCategory {
				currentCategory = video.Category.Name
				message += fmt.Sprintf("📂 **%s**\n", currentCategory)
			}

			message += fmt.Sprintf("   🎬 **%s**\n", video.Title)
			if video.Duration > 0 {
				minutes := video.Duration / 60
				seconds := video.Duration % 60
				message += fmt.Sprintf("   ⏱ مدت زمان: %d:%02d\n", minutes, seconds)
			}
			if video.Views > 0 {
				message += fmt.Sprintf("   👁 بازدید: %d\n", video.Views)
			}
			message += fmt.Sprintf("   📱 نوع: %s\n", map[string]string{
				"file": "فایل آپلود شده",
				"link": "لینک خارجی",
			}[video.VideoType])
			message += fmt.Sprintf("   🎯 وضعیت: %s\n", map[string]string{
				"active":   "فعال",
				"inactive": "غیرفعال",
				"draft":    "پیش‌نویس",
			}[video.Status])

			// Add edit/delete buttons for each video
			keyboard := [][]tgbotapi.InlineKeyboardButton{
				{
					tgbotapi.NewInlineKeyboardButtonData("✏️ ویرایش", fmt.Sprintf("edit_video_%d", video.ID)),
					tgbotapi.NewInlineKeyboardButtonData("🗑 حذف", fmt.Sprintf("delete_video_%d", video.ID)),
				},
			}

			msg := tgbotapi.NewMessage(chatID, fmt.Sprintf("🎬 **%s**", video.Title))
			msg.ParseMode = "Markdown"
			msg.ReplyMarkup = tgbotapi.NewInlineKeyboardMarkup(keyboard...)
			ts.bot.Send(msg)

			message += "\n"
		}
	}

	// Main menu buttons
	keyboard := tgbotapi.NewInlineKeyboardMarkup(
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("➕ ویدیو جدید", MENU_TRAINING_ADD_VIDEO),
		),
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("🔙 بازگشت", MENU_TRAINING),
		),
	)

	msg := tgbotapi.NewMessage(chatID, message)
	msg.ParseMode = "Markdown"
	msg.ReplyMarkup = keyboard
	ts.bot.Send(msg)
}

// showTrainingStats shows training statistics
func (ts *TelegramService) showTrainingStats(chatID int64) {
	stats, err := models.GetVideoStats(models.GetDB())
	if err != nil {
		ts.bot.Send(tgbotapi.NewMessage(chatID, "❌ خطا در دریافت آمار"))
		return
	}

	message := "📊 **آمار ویدیوهای آموزشی**\n\n"
	message += fmt.Sprintf("📹 تعداد کل ویدیوها: **%v**\n", stats["total_videos"])
	message += fmt.Sprintf("👁 مجموع بازدیدها: **%v**\n", stats["total_views"])
	message += fmt.Sprintf("📂 تعداد دسته‌بندی‌ها: **%v**\n", stats["active_categories"])

	// Calculate average views
	if totalVideos, ok := stats["total_videos"].(int64); ok && totalVideos > 0 {
		if totalViews, ok := stats["total_views"].(int64); ok {
			avgViews := float64(totalViews) / float64(totalVideos)
			message += fmt.Sprintf("📈 میانگین بازدید: **%.1f**\n", avgViews)
		}
	}

	keyboard := tgbotapi.NewInlineKeyboardMarkup(
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("🔙 بازگشت", MENU_TRAINING),
		),
	)

	msg := tgbotapi.NewMessage(chatID, message)
	msg.ParseMode = "Markdown"
	msg.ReplyMarkup = keyboard
	ts.bot.Send(msg)
}

// promptAddCategory prompts admin to add a new category
func (ts *TelegramService) promptAddCategory(chatID int64) {
	sessionMutex.Lock()
	sessionStates[chatID] = &SessionState{
		ChatID:          chatID,
		WaitingForInput: "awaiting_category_name",
	}
	sessionMutex.Unlock()

	message := "📂 **ایجاد دسته‌بندی جدید**\n\n"
	message += "نام دسته‌بندی را وارد کنید:\n"
	message += "(مثال: آموزش پایه، آموزش پیشرفته، مهارت‌های فروش)"

	msg := tgbotapi.NewMessage(chatID, message)
	msg.ParseMode = "Markdown"
	ts.bot.Send(msg)
}

// promptAddVideo prompts admin to add a new video
func (ts *TelegramService) promptAddVideo(chatID int64) {
	// First show categories to choose from
	categories, err := models.GetTrainingCategories(models.GetDB())
	if err != nil || len(categories) == 0 {
		ts.bot.Send(tgbotapi.NewMessage(chatID, "❌ ابتدا باید دسته‌بندی ایجاد کنید"))
		return
	}

	var keyboard [][]tgbotapi.InlineKeyboardButton
	for _, category := range categories {
		keyboard = append(keyboard, []tgbotapi.InlineKeyboardButton{
			tgbotapi.NewInlineKeyboardButtonData(category.Name, fmt.Sprintf("select_category_%d", category.ID)),
		})
	}
	keyboard = append(keyboard, []tgbotapi.InlineKeyboardButton{
		tgbotapi.NewInlineKeyboardButtonData("🔙 بازگشت", MENU_TRAINING),
	})

	message := "📂 **انتخاب دسته‌بندی**\n\n"
	message += "ابتدا دسته‌بندی مناسب برای ویدیو را انتخاب کنید:"

	msg := tgbotapi.NewMessage(chatID, message)
	msg.ParseMode = "Markdown"
	msg.ReplyMarkup = tgbotapi.NewInlineKeyboardMarkup(keyboard...)
	ts.bot.Send(msg)
}

// handleTrainingCallback handles training-related callback queries
func (ts *TelegramService) handleTrainingCallback(callback *tgbotapi.CallbackQuery) {
	chatID := callback.Message.Chat.ID
	data := callback.Data

	switch {
	case data == MENU_TRAINING:
		ts.showTrainingMenu(chatID)
	case data == MENU_TRAINING_CATEGORIES:
		ts.showTrainingCategories(chatID)
	case data == MENU_TRAINING_ADD_CATEGORY:
		ts.promptAddCategory(chatID)
	case data == MENU_TRAINING_ADD_VIDEO:
		ts.promptAddVideo(chatID)
	case data == MENU_TRAINING_LIST_VIDEOS:
		ts.showTrainingVideos(chatID)
	case data == MENU_TRAINING_STATS:
		ts.showTrainingStats(chatID)
	case strings.HasPrefix(data, "select_category_"):
		ts.handleCategorySelection(chatID, data)
	case strings.HasPrefix(data, "edit_video_"):
		ts.handleVideoEdit(chatID, data)
	case strings.HasPrefix(data, "delete_video_"):
		ts.handleVideoDelete(chatID, data)
	}

	// Answer callback to remove loading state
	ts.bot.Request(tgbotapi.NewCallback(callback.ID, ""))
}

// handleCategorySelection handles category selection for adding video
func (ts *TelegramService) handleCategorySelection(chatID int64, data string) {
	categoryIDStr := strings.TrimPrefix(data, "select_category_")
	categoryID, err := strconv.ParseUint(categoryIDStr, 10, 32)
	if err != nil {
		ts.bot.Send(tgbotapi.NewMessage(chatID, "❌ خطا در انتخاب دسته‌بندی"))
		return
	}

	sessionMutex.Lock()
	sessionStates[chatID] = &SessionState{
		ChatID:          chatID,
		WaitingForInput: fmt.Sprintf("awaiting_video_type_%d", categoryID),
	}
	sessionMutex.Unlock()

	keyboard := tgbotapi.NewInlineKeyboardMarkup(
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("📁 آپلود فایل ویدیو", fmt.Sprintf("video_type_file_%d", categoryID)),
			tgbotapi.NewInlineKeyboardButtonData("🔗 لینک ویدیو", fmt.Sprintf("video_type_link_%d", categoryID)),
		),
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("🔙 بازگشت", MENU_TRAINING_ADD_VIDEO),
		),
	)

	message := "📹 **نوع ویدیو**\n\n"
	message += "نحوه اضافه کردن ویدیو را انتخاب کنید:\n\n"
	message += "📁 **آپلود فایل**: ویدیو را مستقیماً در تلگرام آپلود کنید\n"
	message += "🔗 **لینک ویدیو**: لینک ویدیو از یوتیوب، آپارات یا سایر پلتفرم‌ها"

	msg := tgbotapi.NewMessage(chatID, message)
	msg.ParseMode = "Markdown"
	msg.ReplyMarkup = keyboard
	ts.bot.Send(msg)
}

// handleVideoEdit handles video editing
func (ts *TelegramService) handleVideoEdit(chatID int64, data string) {
	videoIDStr := strings.TrimPrefix(data, "edit_video_")
	videoID, err := strconv.ParseUint(videoIDStr, 10, 32)
	if err != nil {
		ts.bot.Send(tgbotapi.NewMessage(chatID, "❌ خطا در شناسایی ویدیو"))
		return
	}

	video, err := models.GetVideoByID(models.GetDB(), uint(videoID))
	if err != nil {
		ts.bot.Send(tgbotapi.NewMessage(chatID, "❌ ویدیو یافت نشد"))
		return
	}

	keyboard := tgbotapi.NewInlineKeyboardMarkup(
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("✏️ عنوان", fmt.Sprintf("edit_title_%d", videoID)),
			tgbotapi.NewInlineKeyboardButtonData("📝 توضیحات", fmt.Sprintf("edit_desc_%d", videoID)),
		),
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("🎯 وضعیت", fmt.Sprintf("edit_status_%d", videoID)),
			tgbotapi.NewInlineKeyboardButtonData("📂 دسته‌بندی", fmt.Sprintf("edit_category_%d", videoID)),
		),
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("🔙 بازگشت", MENU_TRAINING_LIST_VIDEOS),
		),
	)

	message := fmt.Sprintf("✏️ **ویرایش ویدیو**\n\n")
	message += fmt.Sprintf("🎬 **عنوان:** %s\n", video.Title)
	message += fmt.Sprintf("📂 **دسته‌بندی:** %s\n", video.Category.Name)
	message += fmt.Sprintf("🎯 **وضعیت:** %s\n", video.Status)
	if video.Description != "" {
		message += fmt.Sprintf("📝 **توضیحات:** %s\n", video.Description)
	}

	msg := tgbotapi.NewMessage(chatID, message)
	msg.ParseMode = "Markdown"
	msg.ReplyMarkup = keyboard
	ts.bot.Send(msg)
}

// handleVideoDelete handles video deletion
func (ts *TelegramService) handleVideoDelete(chatID int64, data string) {
	videoIDStr := strings.TrimPrefix(data, "delete_video_")
	videoID, err := strconv.ParseUint(videoIDStr, 10, 32)
	if err != nil {
		ts.bot.Send(tgbotapi.NewMessage(chatID, "❌ خطا در شناسایی ویدیو"))
		return
	}

	video, err := models.GetVideoByID(models.GetDB(), uint(videoID))
	if err != nil {
		ts.bot.Send(tgbotapi.NewMessage(chatID, "❌ ویدیو یافت نشد"))
		return
	}

	keyboard := tgbotapi.NewInlineKeyboardMarkup(
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("✅ تایید حذف", fmt.Sprintf("confirm_delete_%d", videoID)),
			tgbotapi.NewInlineKeyboardButtonData("❌ لغو", MENU_TRAINING_LIST_VIDEOS),
		),
	)

	message := fmt.Sprintf("🗑 **تایید حذف ویدیو**\n\n")
	message += fmt.Sprintf("آیا مطمئن هستید که می‌خواهید این ویدیو را حذف کنید؟\n\n")
	message += fmt.Sprintf("🎬 **عنوان:** %s\n", video.Title)
	message += fmt.Sprintf("📂 **دسته‌بندی:** %s\n", video.Category.Name)
	message += "\n⚠️ **توجه:** این عمل قابل بازگشت نیست!"

	msg := tgbotapi.NewMessage(chatID, message)
	msg.ParseMode = "Markdown"
	msg.ReplyMarkup = keyboard
	ts.bot.Send(msg)
}

// processVideoUpload processes uploaded video files
func (ts *TelegramService) processVideoUpload(message *tgbotapi.Message) {
	if message.Video == nil {
		ts.bot.Send(tgbotapi.NewMessage(message.Chat.ID, "❌ لطفاً یک فایل ویدیو ارسال کنید"))
		return
	}

	sessionMutex.Lock()
	sessionState := sessionStates[message.Chat.ID]
	sessionMutex.Unlock()

	if sessionState == nil || !strings.HasPrefix(sessionState.WaitingForInput, "awaiting_video_file_") {
		return
	}

	categoryIDStr := strings.TrimPrefix(sessionState.WaitingForInput, "awaiting_video_file_")
	categoryID, err := strconv.ParseUint(categoryIDStr, 10, 32)
	if err != nil {
		ts.bot.Send(tgbotapi.NewMessage(message.Chat.ID, "❌ خطا در پردازش"))
		return
	}

	// Create video record
	video := models.TrainingVideo{
		CategoryID:     uint(categoryID),
		Title:          "ویدیو جدید", // Will be updated by admin
		VideoType:      "file",
		TelegramFileID: message.Video.FileID,
		Duration:       message.Video.Duration,
		FileSize:       int64(message.Video.FileSize),
		Status:         "draft", // Start as draft
	}

	if err := models.CreateTrainingVideo(models.GetDB(), &video); err != nil {
		ts.bot.Send(tgbotapi.NewMessage(message.Chat.ID, "❌ خطا در ذخیره ویدیو"))
		return
	}

	sessionMutex.Lock()
	sessionStates[message.Chat.ID] = &SessionState{
		ChatID:          message.Chat.ID,
		WaitingForInput: fmt.Sprintf("awaiting_video_title_%d", video.ID),
	}
	sessionMutex.Unlock()

	message_text := "✅ **ویدیو آپلود شد!**\n\n"
	message_text += "حالا عنوان ویدیو را وارد کنید:"

	msg := tgbotapi.NewMessage(message.Chat.ID, message_text)
	msg.ParseMode = "Markdown"
	ts.bot.Send(msg)
}
