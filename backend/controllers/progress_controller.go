package controllers

import (
	"net/http"

	"asl-market-backend/models"

	"github.com/gin-gonic/gin"
)

// GetUserProgress returns user's current progress
func GetUserProgress(c *gin.Context) {
	userID := c.GetUint("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "کاربر احراز هویت نشده"})
		return
	}

	progress, err := models.GetOrCreateUserProgress(models.GetDB(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت پیشرفت کاربر"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "پیشرفت کاربر با موفقیت دریافت شد",
		"data":    progress.GetProgressBreakdown(),
	})
}

// UpdateUserProgress updates progress for a specific activity
func UpdateUserProgress(c *gin.Context) {
	userID := c.GetUint("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "کاربر احراز هویت نشده"})
		return
	}

	var request struct {
		Activity string `json:"activity" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "اطلاعات وارد شده صحیح نیست. لطفاً تمام فیلدهای الزامی را پر کنید."})
		return
	}

	progress, err := models.GetOrCreateUserProgress(models.GetDB(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت پیشرفت کاربر"})
		return
	}

	err = progress.UpdateProgress(models.GetDB(), request.Activity)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در به‌روزرسانی پیشرفت"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "پیشرفت با موفقیت به‌روزرسانی شد",
		"data":    progress.GetProgressBreakdown(),
	})
}
