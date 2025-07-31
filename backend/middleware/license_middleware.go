package middleware

import (
	"net/http"

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

		// Check if user has license and it's approved
		if user.License == "" {
			c.JSON(http.StatusForbidden, gin.H{
				"error":         "شما نیاز به لایسنس دارید",
				"needs_license": true,
				"has_license":   false,
				"is_approved":   false,
			})
			c.Abort()
			return
		}

		if !user.IsApproved {
			c.JSON(http.StatusForbidden, gin.H{
				"error":         "لایسنس شما هنوز تأیید نشده است",
				"needs_license": false,
				"has_license":   true,
				"is_approved":   false,
			})
			c.Abort()
			return
		}

		c.Next()
	}
}
