package controllers

import (
	"fmt"
	"net/http"
	"time"

	"asl-market-backend/models"
	"asl-market-backend/services"

	"github.com/gin-gonic/gin"
)

func VerifyLicense(c *gin.Context) {
	var req models.LicenseVerifyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "لطفا لایسنس را وارد کنید"})
		return
	}

	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "برای دسترسی به این بخش، لطفاً ابتدا وارد حساب کاربری خود شوید."})
		return
	}

	userIDUint := userID.(uint)

	// Check if user already has a license
	hasLicense, err := models.CheckUserLicense(models.GetDB(), userIDUint)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در بررسی وضعیت لایسنس"})
		return
	}

	if hasLicense {
		// Instead of blocking, show current license info
		existingLicense, err := models.GetUserLicense(models.GetDB(), userIDUint)
		if err == nil && existingLicense != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "شما در حال حاضر لایسنس فعال دارید",
				"current_license": gin.H{
					"code":       existingLicense.Code,
					"type":       existingLicense.Type,
					"expires_at": existingLicense.ExpiresAt,
				},
			})
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "شما قبلاً از یک لایسنس استفاده کرده‌اید"})
		}
		return
	}

	// Try to use the license
	license, err := models.UseLicense(models.GetDB(), req.License, userIDUint)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Calculate remaining time
	now := time.Now()
	remaining := license.ExpiresAt.Sub(now)
	remainingDays := int(remaining.Hours() / 24)
	remainingHours := int(remaining.Hours()) % 24

	licenseTypeName := "پلاس"
	if license.Type == "pro" {
		licenseTypeName = "پرو"
	}

	// Send SMS notification after successful license activation
	go func() {
		// Get user information for SMS
		var user models.User
		if err := models.GetDB().First(&user, userIDUint).Error; err == nil {
			smsService := services.GetSMSService()
			if smsService != nil && user.Mobile() != "" {
				// Validate and format phone number
				phoneNumber := services.ValidateIranianPhoneNumber(user.Mobile())
				if phoneNumber != "" {
					// Send SMS with user name and license plan
					userName := user.Name()
					if userName == "" || userName == " " {
						userName = user.Email // fallback to email if no full name
					}

					err := smsService.SendLicenseActivationSMS(phoneNumber, userName, licenseTypeName)
					if err != nil {
						fmt.Printf("Failed to send license activation SMS to %s: %v\n", phoneNumber, err)
					}
				}
			}
		}
	}()

	c.JSON(http.StatusOK, models.LicenseVerifyResponse{
		Message:        fmt.Sprintf("لایسنس %s با موفقیت فعال شد! اکنون می‌توانید از تمام امکانات سایت استفاده کنید.", licenseTypeName),
		Status:         "activated",
		Type:           license.Type,
		ExpiresAt:      license.ExpiresAt.Format("2006-01-02 15:04:05"),
		RemainingDays:  remainingDays,
		RemainingHours: remainingHours,
	})
}

func CheckLicenseStatus(c *gin.Context) {
	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "برای دسترسی به این بخش، لطفاً ابتدا وارد حساب کاربری خود شوید."})
		return
	}

	userIDUint := userID.(uint)

	// Check if user has valid license
	hasLicense, err := models.CheckUserLicense(models.GetDB(), userIDUint)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در بررسی وضعیت لایسنس"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"has_license": hasLicense,
		"is_approved": hasLicense, // Since licenses are auto-approved now
		"is_active":   hasLicense,
	})
}

// RefreshLicense helps users recover their license status
func RefreshLicense(c *gin.Context) {
	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "برای دسترسی به این بخش، لطفاً ابتدا وارد حساب کاربری خود شوید."})
		return
	}

	userIDUint := userID.(uint)

	// Check if user has valid license
	hasLicense, err := models.CheckUserLicense(models.GetDB(), userIDUint)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در بررسی وضعیت لایسنس"})
		return
	}

	if !hasLicense {
		c.JSON(http.StatusOK, gin.H{
			"message":     "شما در حال حاضر لایسنس فعال ندارید",
			"has_license": false,
		})
		return
	}

	// Get license details
	license, err := models.GetUserLicense(models.GetDB(), userIDUint)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت اطلاعات لایسنس"})
		return
	}

	// Calculate remaining time
	now := time.Now()
	remaining := license.ExpiresAt.Sub(now)
	remainingDays := int(remaining.Hours() / 24)
	remainingHours := int(remaining.Hours()) % 24

	licenseTypeName := "پلاس"
	if license.Type == "pro" {
		licenseTypeName = "پرو"
	}

	c.JSON(http.StatusOK, gin.H{
		"message":     fmt.Sprintf("لایسنس %s شما فعال است", licenseTypeName),
		"has_license": true,
		"license_info": gin.H{
			"code":            license.Code,
			"type":            license.Type,
			"type_name":       licenseTypeName,
			"expires_at":      license.ExpiresAt.Format("2006-01-02 15:04:05"),
			"remaining_days":  remainingDays,
			"remaining_hours": remainingHours,
			"used_at":         license.UsedAt.Format("2006-01-02 15:04:05"),
		},
	})
}

// GetUserLicenseInfo returns detailed license information for the user
func GetUserLicenseInfo(c *gin.Context) {
	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "برای دسترسی به این بخش، لطفاً ابتدا وارد حساب کاربری خود شوید."})
		return
	}

	userIDUint := userID.(uint)

	// Get user's license
	license, err := models.GetUserLicense(models.GetDB(), userIDUint)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "لایسنس یافت نشد"})
		return
	}

	// Handle old licenses without ExpiresAt
	var expiresAt *time.Time
	var remainingDays, remainingHours int
	var isActive bool
	var licenseType string
	var duration int

	if license.ExpiresAt != nil {
		// New license format with expiry date
		expiresAt = license.ExpiresAt
		now := time.Now()
		remaining := license.ExpiresAt.Sub(now)
		remainingDays = int(remaining.Hours() / 24)
		remainingHours = int(remaining.Hours()) % 24
		isActive = now.Before(*license.ExpiresAt)
		licenseType = license.Type
		duration = license.Duration
	} else {
		// Old license format - calculate expiry based on activation date
		if license.UsedAt != nil {
			// Default to Plus (12 months) for old licenses
			licenseType = "plus"
			duration = 12

			// Calculate expiry: activation + 12 months
			expiryDate := license.UsedAt.AddDate(0, 12, 0)
			expiresAt = &expiryDate

			now := time.Now()
			remaining := expiryDate.Sub(now)
			remainingDays = int(remaining.Hours() / 24)
			remainingHours = int(remaining.Hours()) % 24
			isActive = now.Before(expiryDate)
		} else {
			// No activation date - mark as expired
			licenseType = "plus"
			duration = 12
			remainingDays = 0
			remainingHours = 0
			isActive = false
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"license_code":    license.Code,
		"activated_at":    license.UsedAt,
		"expires_at":      expiresAt,
		"type":            licenseType,
		"duration":        duration,
		"remaining_days":  remainingDays,
		"remaining_hours": remainingHours,
		"is_active":       isActive,
	})
}
