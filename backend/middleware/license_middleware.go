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

		userIDUint := userID.(uint)

		// Check if user has valid license
		hasLicense, err := models.CheckUserLicense(models.GetDB(), userIDUint)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "خطا در بررسی وضعیت لایسنس",
			})
			c.Abort()
			return
		}

		// Create response with user's license status
		licenseStatus := gin.H{
			"needs_license": !hasLicense,
			"has_license":   hasLicense,
			"is_approved":   hasLicense, // Auto-approved now
			"is_active":     hasLicense,
		}

		// Check if this is an AI endpoint
		isAIEndpoint := strings.HasPrefix(c.Request.URL.Path, "/api/v1/ai/")

		// Check if user has valid license
		if !hasLicense {
			errorMsg := "شما نیاز به لایسنس معتبر دارید"
			if isAIEndpoint {
				errorMsg = "برای استفاده از هوش مصنوعی نیاز به لایسنس معتبر دارید. لطفا ابتدا لایسنس خود را وارد کنید."
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
