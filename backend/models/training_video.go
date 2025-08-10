package models

import (
	"time"

	"gorm.io/gorm"
)

// TrainingCategory represents video categories
type TrainingCategory struct {
	ID           uint   `gorm:"primaryKey"`
	Name         string `gorm:"size:100;not null"`              // نام دسته‌بندی
	NameEn       string `gorm:"size:100"`                       // نام انگلیسی
	Description  string `gorm:"type:text"`                      // توضیحات دسته‌بندی
	Icon         string `gorm:"size:50"`                        // نام آیکون
	Color        string `gorm:"size:20"`                        // رنگ دسته‌بندی
	DisplayOrder int    `gorm:"default:0;column:display_order"` // ترتیب نمایش
	IsActive     bool   `gorm:"default:true"`                   // فعال/غیرفعال
	CreatedAt    time.Time
	UpdatedAt    time.Time

	// Relations
	Videos []TrainingVideo `gorm:"foreignKey:CategoryID"`
}

// TrainingVideo represents uploaded training videos
type TrainingVideo struct {
	ID         uint             `gorm:"primaryKey"`
	CategoryID uint             `gorm:"not null"`
	Category   TrainingCategory `gorm:"foreignKey:CategoryID"`

	// Video details
	Title       string `gorm:"size:200;not null"` // عنوان ویدیو
	Description string `gorm:"type:text"`         // توضیحات ویدیو

	// Video source
	VideoType      string `gorm:"size:20;default:'link'"` // "file" or "link"
	VideoURL       string `gorm:"size:500"`               // لینک ویدیو یا فایل
	TelegramFileID string `gorm:"size:200"`               // Telegram file ID (اگه فایل باشه)

	// Video metadata
	Duration  int    `gorm:"default:0"` // مدت زمان (ثانیه)
	Thumbnail string `gorm:"size:500"`  // تصویر پیش‌نمایش
	FileSize  int64  `gorm:"default:0"` // حجم فایل (بایت)

	// Organization
	DisplayOrder int    `gorm:"default:0;column:display_order"` // ترتیب در دسته‌بندی
	Difficulty   string `gorm:"size:20;default:'beginner'"`     // مقطع (beginner/intermediate/advanced)
	Tags         string `gorm:"type:text"`                      // برچسب‌ها (JSON array)

	// Status
	Status string `gorm:"size:20;default:'active'"` // active/inactive/draft
	Views  int    `gorm:"default:0"`                // تعداد بازدید

	// Timestamps
	CreatedAt   time.Time
	UpdatedAt   time.Time
	PublishedAt *time.Time // زمان انتشار

	// Relations
	UploadedBy uint `gorm:"default:0"` // کاربری که اپلود کرده (از تلگرام)
}

// GetTrainingCategories returns all active categories with video counts
func GetTrainingCategories(db *gorm.DB) ([]TrainingCategory, error) {
	var categories []TrainingCategory

	err := db.Preload("Videos", "status = ?", "active").
		Where("is_active = ?", true).
		Order("display_order ASC, name ASC").
		Find(&categories).Error

	return categories, err
}

// GetVideosByCategory returns videos for a specific category
func GetVideosByCategory(db *gorm.DB, categoryID uint) ([]TrainingVideo, error) {
	var videos []TrainingVideo

	err := db.Preload("Category").
		Where("category_id = ? AND status = ?", categoryID, "active").
		Order("display_order ASC, created_at DESC").
		Find(&videos).Error

	return videos, err
}

// GetAllActiveVideos returns all active videos with categories
func GetAllActiveVideos(db *gorm.DB) ([]TrainingVideo, error) {
	var videos []TrainingVideo

	err := db.Preload("Category").
		Where("status = ?", "active").
		Order("category_id ASC, display_order ASC, created_at DESC").
		Find(&videos).Error

	return videos, err
}

// CreateTrainingVideo creates a new training video
func CreateTrainingVideo(db *gorm.DB, video *TrainingVideo) error {
	now := time.Now()
	video.CreatedAt = now
	video.UpdatedAt = now

	if video.Status == "active" && video.PublishedAt == nil {
		video.PublishedAt = &now
	}

	return db.Create(video).Error
}

// UpdateTrainingVideo updates an existing video
func UpdateTrainingVideo(db *gorm.DB, videoID uint, updates *TrainingVideo) error {
	updates.UpdatedAt = time.Now()

	// If changing to active and no publish date, set it
	if updates.Status == "active" {
		var existing TrainingVideo
		if err := db.First(&existing, videoID).Error; err == nil {
			if existing.PublishedAt == nil {
				now := time.Now()
				updates.PublishedAt = &now
			}
		}
	}

	return db.Model(&TrainingVideo{}).Where("id = ?", videoID).Updates(updates).Error
}

// DeleteTrainingVideo soft deletes a video
func DeleteTrainingVideo(db *gorm.DB, videoID uint) error {
	return db.Model(&TrainingVideo{}).Where("id = ?", videoID).Update("status", "inactive").Error
}

// IncrementVideoViews increments the view count for a video
func IncrementVideoViews(db *gorm.DB, videoID uint) error {
	return db.Model(&TrainingVideo{}).Where("id = ?", videoID).UpdateColumn("views", gorm.Expr("views + ?", 1)).Error
}

// GetVideoByID returns a single video by ID
func GetVideoByID(db *gorm.DB, videoID uint) (*TrainingVideo, error) {
	var video TrainingVideo
	err := db.Preload("Category").First(&video, videoID).Error
	return &video, err
}

// SearchVideos searches videos by title, description, or tags
func SearchVideos(db *gorm.DB, query string) ([]TrainingVideo, error) {
	var videos []TrainingVideo

	searchTerm := "%" + query + "%"
	err := db.Preload("Category").
		Where("(title LIKE ? OR description LIKE ? OR tags LIKE ?) AND status = ?",
			searchTerm, searchTerm, searchTerm, "active").
		Order("created_at DESC").
		Find(&videos).Error

	return videos, err
}

// GetVideoStats returns video statistics
func GetVideoStats(db *gorm.DB) (map[string]interface{}, error) {
	var totalVideos int64
	var totalViews int64
	var activeCategories int64

	// Count total active videos
	db.Model(&TrainingVideo{}).Where("status = ?", "active").Count(&totalVideos)

	// Sum total views
	db.Model(&TrainingVideo{}).Where("status = ?", "active").Select("COALESCE(SUM(views), 0)").Scan(&totalViews)

	// Count active categories
	db.Model(&TrainingCategory{}).Where("is_active = ?", true).Count(&activeCategories)

	return map[string]interface{}{
		"total_videos":      totalVideos,
		"total_views":       totalViews,
		"active_categories": activeCategories,
	}, nil
}
