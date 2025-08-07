package controllers

import (
	"fmt"
	"net/http"
	"time"

	"asl-market-backend/models"

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
		c.JSON(http.StatusUnauthorized, gin.H{"error": "لطفا ابتدا وارد شوید"})
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
		c.JSON(http.StatusBadRequest, gin.H{"error": "شما قبلاً از یک لایسنس استفاده کرده‌اید"})
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
		c.JSON(http.StatusUnauthorized, gin.H{"error": "لطفا ابتدا وارد شوید"})
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

// GetUserLicenseInfo returns detailed license information for the user
func GetUserLicenseInfo(c *gin.Context) {
	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "لطفا ابتدا وارد شوید"})
		return
	}

	userIDUint := userID.(uint)

	// Get user's license
	license, err := models.GetUserLicense(models.GetDB(), userIDUint)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "لایسنس یافت نشد"})
		return
	}

	// Calculate remaining time
	now := time.Now()
	remaining := license.ExpiresAt.Sub(now)
	remainingDays := int(remaining.Hours() / 24)
	remainingHours := int(remaining.Hours()) % 24

	// Check if license is still active
	isActive := now.Before(*license.ExpiresAt)

	c.JSON(http.StatusOK, gin.H{
		"license_code":    license.Code,
		"activated_at":    license.UsedAt,
		"expires_at":      license.ExpiresAt,
		"type":            license.Type,
		"duration":        license.Duration,
		"remaining_days":  remainingDays,
		"remaining_hours": remainingHours,
		"is_active":       isActive,
	})
}
