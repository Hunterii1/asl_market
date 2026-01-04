package controllers

import (
	"net/http"
	"time"

	"asl-market-backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GetDailyLimitsStatus returns remaining daily viewing limits for the user
func GetDailyLimitsStatus(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	userID := c.MustGet("user_id").(uint)

	// Get user's license to determine type
	license, err := models.GetUserLicense(db, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "لایسنس یافت نشد"})
		return
	}

	// Get remaining limits
	visitorRemaining, supplierRemaining, availableProductRemaining, err := models.GetRemainingLimits(db, userID, license.Type)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت محدودیت‌ها"})
		return
	}

	// Get today's usage
	limits, err := models.GetDailyLimits(db, userID, time.Now())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت آمار روزانه"})
		return
	}

	// Calculate max limits based on license type
	visitorMax := 3
	supplierMax := 3
	availableProductMax := 3
	if license.Type == "pro" {
		supplierMax = 6
		availableProductMax = 6
	}

	c.JSON(http.StatusOK, gin.H{
		"license_type": license.Type,
		"visitor_limits": gin.H{
			"used":      limits.VisitorViews,
			"max":       visitorMax,
			"remaining": visitorRemaining,
		},
		"supplier_limits": gin.H{
			"used":      limits.SupplierViews,
			"max":       supplierMax,
			"remaining": supplierRemaining,
		},
		"available_product_limits": gin.H{
			"used":      limits.AvailableProductViews,
			"max":       availableProductMax,
			"remaining": availableProductRemaining,
		},
		"date": limits.Date.Format("2006-01-02"),
	})
}

// CheckVisitorViewPermission checks if user can view a visitor
func CheckVisitorViewPermission(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	userID := c.MustGet("user_id").(uint)

	// Get user's license to determine type
	license, err := models.GetUserLicense(db, userID)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "لایسنس یافت نشد"})
		return
	}

	canView, err := models.CanViewVisitor(db, userID, license.Type)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در بررسی مجوز"})
		return
	}

	if !canView {
		c.JSON(http.StatusForbidden, gin.H{
			"error":         "محدودیت روزانه مشاهده ویزیتور به پایان رسیده است",
			"limit_reached": true,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"can_view": true})
}

// CheckSupplierViewPermission checks if user can view a supplier
func CheckSupplierViewPermission(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	userID := c.MustGet("user_id").(uint)

	// Get user's license to determine type
	license, err := models.GetUserLicense(db, userID)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "لایسنس یافت نشد"})
		return
	}

	canView, err := models.CanViewSupplier(db, userID, license.Type)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در بررسی مجوز"})
		return
	}

	if !canView {
		c.JSON(http.StatusForbidden, gin.H{
			"error":         "محدودیت روزانه مشاهده تأمین‌کننده به پایان رسیده است",
			"limit_reached": true,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"can_view": true})
}
