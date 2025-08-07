package middleware

import (
	"net/http"

	"asl-market-backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// VisitorViewLimitMiddleware checks if user can view visitors and increments counter
func VisitorViewLimitMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		db := c.MustGet("db").(*gorm.DB)
		userID := c.MustGet("user_id").(uint)

		// Get user's license
		license, err := models.GetUserLicense(db, userID)
		if err != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "لایسنس یافت نشد"})
			c.Abort()
			return
		}

		// Check if user can view more visitors
		canView, err := models.CanViewVisitor(db, userID, license.Type)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در بررسی محدودیت"})
			c.Abort()
			return
		}

		if !canView {
			c.JSON(http.StatusForbidden, gin.H{
				"error":         "محدودیت روزانه مشاهده ویزیتور به پایان رسیده است",
				"limit_reached": true,
			})
			c.Abort()
			return
		}

		// Increment visitor view count
		if err := models.IncrementVisitorView(db, userID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ثبت مشاهده"})
			c.Abort()
			return
		}

		c.Next()
	}
}

// SupplierViewLimitMiddleware checks if user can view suppliers and increments counter
func SupplierViewLimitMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		db := c.MustGet("db").(*gorm.DB)
		userID := c.MustGet("user_id").(uint)

		// Get user's license
		license, err := models.GetUserLicense(db, userID)
		if err != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "لایسنس یافت نشد"})
			c.Abort()
			return
		}

		// Check if user can view more suppliers
		canView, err := models.CanViewSupplier(db, userID, license.Type)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در بررسی محدودیت"})
			c.Abort()
			return
		}

		if !canView {
			c.JSON(http.StatusForbidden, gin.H{
				"error":         "محدودیت روزانه مشاهده تأمین‌کننده به پایان رسیده است",
				"limit_reached": true,
			})
			c.Abort()
			return
		}

		// Increment supplier view count
		if err := models.IncrementSupplierView(db, userID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ثبت مشاهده"})
			c.Abort()
			return
		}

		c.Next()
	}
}
