package controllers

import (
	"net/http"

	"asl-market-backend/models"
	"asl-market-backend/services"

	"github.com/gin-gonic/gin"
)

// SpotPlayerController handles SpotPlayer related requests
type SpotPlayerController struct {
	spotPlayerService *services.SpotPlayerService
}

// NewSpotPlayerController creates a new SpotPlayer controller
func NewSpotPlayerController() *SpotPlayerController {
	return &SpotPlayerController{
		spotPlayerService: services.NewSpotPlayerService(),
	}
}

// GenerateSpotPlayerLicense generates a SpotPlayer license for the user
func (sc *SpotPlayerController) GenerateSpotPlayerLicense(c *gin.Context) {
	userID := c.GetUint("user_id")

	// Get user from database
	user, err := models.GetUserByID(models.GetDB(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "خطا در دریافت اطلاعات کاربر",
			"error":   err.Error(),
		})
		return
	}

	// Check if user already has a SpotPlayer license
	var existingLicense models.SpotPlayerLicense
	result := models.GetDB().Where("user_id = ?", userID).First(&existingLicense)
	if result.Error == nil {
		// User already has a license, return it
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "لایسنس قبلاً ایجاد شده است",
			"data": gin.H{
				"license_key": existingLicense.LicenseKey,
				"license_url": existingLicense.LicenseURL,
				"created_at":  existingLicense.CreatedAt,
			},
		})
		return
	}

	// Format phone number
	phoneNumber := sc.spotPlayerService.FormatPhoneNumber(user.Phone, userID)

	// Generate license name (user's full name or phone)
	licenseName := user.Name()
	if licenseName == "" {
		licenseName = phoneNumber
	}

	// Generate SpotPlayer license
	licenseData, err := sc.spotPlayerService.GenerateLicense(
		licenseName,
		[]string{"6878d13055b704ee2521bbb7"}, // Course ID
		[]string{phoneNumber},                // Watermark (phone number)
		false,                                // Not test mode
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "خطا در ایجاد لایسنس SpotPlayer",
			"error":   err.Error(),
		})
		return
	}

	// Extract license data
	licenseKey, _ := licenseData["key"].(string)
	licenseURL, _ := licenseData["url"].(string)
	licenseID, _ := licenseData["_id"].(string)

	// Save license to database
	spotPlayerLicense := models.SpotPlayerLicense{
		UserID:       userID,
		LicenseKey:   licenseKey,
		LicenseURL:   "https://dl.spotplayer.ir/" + licenseURL,
		SpotPlayerID: licenseID,
		PhoneNumber:  phoneNumber,
	}

	if err := models.GetDB().Create(&spotPlayerLicense).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "خطا در ذخیره لایسنس",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "لایسنس SpotPlayer با موفقیت ایجاد شد",
		"data": gin.H{
			"license_key": licenseKey,
			"license_url": spotPlayerLicense.LicenseURL,
			"created_at":  spotPlayerLicense.CreatedAt,
		},
	})
}

// GetSpotPlayerLicense gets the user's SpotPlayer license
func (sc *SpotPlayerController) GetSpotPlayerLicense(c *gin.Context) {
	userID := c.GetUint("user_id")

	var license models.SpotPlayerLicense
	result := models.GetDB().Where("user_id = ?", userID).First(&license)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "لایسنس SpotPlayer یافت نشد",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"license_key": license.LicenseKey,
			"license_url": license.LicenseURL,
			"created_at":  license.CreatedAt,
		},
	})
}
