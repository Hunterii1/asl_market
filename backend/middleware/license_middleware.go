package middleware

import (
	"net/http"
	"strings"

	"asl-market-backend/models"

	"github.com/gin-gonic/gin"
)

func LicenseMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get user ID from context (set by auth middleware)
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":      "لطفا ابتدا وارد شوید",
				"needs_auth": true,
			})
			c.Abort()
			return
		}

		// Get user from database
		var user models.User
		if err := models.GetDB().First(&user, userID).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "خطا در دریافت اطلاعات کاربر",
			})
			c.Abort()
			return
		}

		// Create response with user's license status
		licenseStatus := gin.H{
			"needs_license": user.License == "",
			"has_license":   user.License != "",
			"is_approved":   user.IsApproved,
		}

		// Check if this is an AI endpoint
		isAIEndpoint := strings.HasPrefix(c.Request.URL.Path, "/api/v1/ai/")

		// Check if user has license and it's approved
		if user.License == "" {
			errorMsg := "شما نیاز به لایسنس دارید"
			if isAIEndpoint {
				errorMsg = "برای استفاده از هوش مصنوعی نیاز به لایسنس دارید. لطفا ابتدا لایسنس خود را وارد کنید."
			}
			c.JSON(http.StatusForbidden, gin.H{
				"error":          errorMsg,
				"license_status": licenseStatus,
			})
			c.Abort()
			return
		}

		if !user.IsApproved {
			errorMsg := "لایسنس شما هنوز تأیید نشده است"
			if isAIEndpoint {
				errorMsg = "لایسنس شما برای استفاده از هوش مصنوعی هنوز تأیید نشده است. لطفا منتظر تأیید ادمین باشید."
			}
			c.JSON(http.StatusForbidden, gin.H{
				"error":          errorMsg,
				"license_status": licenseStatus,
			})
			c.Abort()
			return
		}

		// Add license status to context for other middleware/handlers
		c.Set("license_status", licenseStatus)
		c.Next()
	}
}
