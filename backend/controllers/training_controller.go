package controllers

import (
	"net/http"
	"strconv"

	"asl-market-backend/models"

	"github.com/gin-gonic/gin"
)

// GetTrainingCategories returns all training categories with videos
func GetTrainingCategories(c *gin.Context) {
	categories, err := models.GetTrainingCategories(models.GetDB())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت دسته‌بندی‌ها"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "دسته‌بندی‌های آموزشی با موفقیت دریافت شد",
		"data":    categories,
	})
}

// GetVideosByCategory returns videos for a specific category
func GetVideosByCategory(c *gin.Context) {
	categoryID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه دسته‌بندی نامعتبر"})
		return
	}

	videos, err := models.GetVideosByCategory(models.GetDB(), uint(categoryID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت ویدیوها"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "ویدیوهای دسته‌بندی با موفقیت دریافت شد",
		"data":    videos,
	})
}

// GetAllTrainingVideos returns all active training videos
func GetAllTrainingVideos(c *gin.Context) {
	videos, err := models.GetAllActiveVideos(models.GetDB())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت ویدیوها"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "ویدیوهای آموزشی با موفقیت دریافت شد",
		"data":    videos,
	})
}

// GetTrainingVideo returns a single video by ID and increments view count
func GetTrainingVideo(c *gin.Context) {
	videoID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه ویدیو نامعتبر"})
		return
	}

	video, err := models.GetVideoByID(models.GetDB(), uint(videoID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ویدیو یافت نشد"})
		return
	}

	// Increment view count
	models.IncrementVideoViews(models.GetDB(), uint(videoID))

	c.JSON(http.StatusOK, gin.H{
		"message": "ویدیو با موفقیت دریافت شد",
		"data":    video,
	})
}

// SearchTrainingVideos searches videos by query
func SearchTrainingVideos(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "کلمه کلیدی جستجو الزامی است"})
		return
	}

	videos, err := models.SearchVideos(models.GetDB(), query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در جستجو"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "نتایج جستجو",
		"query":   query,
		"data":    videos,
	})
}

// GetTrainingStats returns training video statistics
func GetTrainingStats(c *gin.Context) {
	stats, err := models.GetVideoStats(models.GetDB())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت آمار"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "آمار ویدیوهای آموزشی",
		"data":    stats,
	})
}

// Admin Controllers

// CreateTrainingVideo creates a new training video (admin only)
func CreateTrainingVideo(c *gin.Context) {
	var video models.TrainingVideo

	if err := c.ShouldBindJSON(&video); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "داده‌های ورودی نامعتبر", "details": err.Error()})
		return
	}

	if err := models.CreateTrainingVideo(models.GetDB(), &video); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ایجاد ویدیو"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "ویدیو آموزشی با موفقیت ایجاد شد",
		"data":    video,
	})
}

// UpdateTrainingVideo updates an existing video (admin only)
func UpdateTrainingVideo(c *gin.Context) {
	videoID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه ویدیو نامعتبر"})
		return
	}

	var updates models.TrainingVideo
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "داده‌های ورودی نامعتبر"})
		return
	}

	if err := models.UpdateTrainingVideo(models.GetDB(), uint(videoID), &updates); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در به‌روزرسانی ویدیو"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "ویدیو با موفقیت به‌روزرسانی شد",
	})
}

// DeleteTrainingVideo deletes a video (admin only)
func DeleteTrainingVideo(c *gin.Context) {
	videoID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه ویدیو نامعتبر"})
		return
	}

	if err := models.DeleteTrainingVideo(models.GetDB(), uint(videoID)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در حذف ویدیو"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "ویدیو با موفقیت حذف شد",
	})
}

// CreateTrainingCategory creates a new category (admin only)
func CreateTrainingCategory(c *gin.Context) {
	var category models.TrainingCategory

	if err := c.ShouldBindJSON(&category); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "داده‌های ورودی نامعتبر"})
		return
	}

	if err := models.GetDB().Create(&category).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ایجاد دسته‌بندی"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "دسته‌بندی با موفقیت ایجاد شد",
		"data":    category,
	})
}

// GetAllVideosForAdmin returns all videos for admin management
func GetAllVideosForAdmin(c *gin.Context) {
	var videos []models.TrainingVideo

	err := models.GetDB().Preload("Category").
		Order("created_at DESC").
		Find(&videos).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت ویدیوها"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "تمام ویدیوها برای مدیریت",
		"data":    videos,
	})
}
