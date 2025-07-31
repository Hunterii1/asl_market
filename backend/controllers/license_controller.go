package controllers

import (
	"net/http"

	"asl-market-backend/models"
	"asl-market-backend/services"

	"github.com/gin-gonic/gin"
)

type LicenseRequest struct {
	License string `json:"license" binding:"required"`
}

func VerifyLicense(c *gin.Context) {
	var req LicenseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "لطفا لایسنس را وارد کنید"})
		return
	}

	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "لطفا ابتدا وارد شوید"})
		return
	}

	// Get user from database
	var user models.User
	if err := models.GetDB().First(&user, userID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت اطلاعات کاربر"})
		return
	}

	// Check if license is valid
	if req.License != services.ASL_PLATFORM_LICENSE {
		c.JSON(http.StatusBadRequest, gin.H{"error": "لایسنس نامعتبر است"})
		return
	}

	// Save license for user
	user.License = req.License
	if err := models.GetDB().Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ثبت لایسنس"})
		return
	}

	// Send notification to admin via Telegram
	telegramService := services.GetTelegramService()
	if err := telegramService.SendLicenseRequest(&user); err != nil {
		// Just log the error, don't fail the request
		c.JSON(http.StatusOK, gin.H{
			"message": "لایسنس با موفقیت ثبت شد. لطفا منتظر تأیید ادمین باشید",
			"status":  "pending",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "لایسنس با موفقیت ثبت شد. لطفا منتظر تأیید ادمین باشید",
		"status":  "pending",
	})
}

func CheckLicenseStatus(c *gin.Context) {
	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "لطفا ابتدا وارد شوید"})
		return
	}

	// Get user from database
	var user models.User
	if err := models.GetDB().First(&user, userID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت اطلاعات کاربر"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"is_approved": user.IsApproved,
		"has_license": user.License != "",
	})
}
