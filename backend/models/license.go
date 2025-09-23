package models

import (
	"crypto/rand"
	"fmt"
	"strings"
	"time"

	"gorm.io/gorm"
)

// License represents a generated license key
type License struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	Code        string         `json:"code" gorm:"uniqueIndex;size:32;not null"`
	Type        string         `json:"type" gorm:"size:10;not null;default:'plus'"` // 'pro', 'plus', or 'plus4'
	Duration    int            `json:"duration" gorm:"not null;default:12"`         // Duration in months
	IsUsed      bool           `json:"is_used" gorm:"default:false"`
	UsedBy      *uint          `json:"used_by" gorm:"index"`
	User        *User          `json:"user,omitempty" gorm:"foreignKey:UsedBy"`
	UsedAt      *time.Time     `json:"used_at"`
	ExpiresAt   *time.Time     `json:"expires_at"` // When license expires for the user
	GeneratedBy uint           `json:"generated_by" gorm:"not null"`
	Admin       User           `json:"admin" gorm:"foreignKey:GeneratedBy"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

// LicenseVerifyRequest represents the request to verify a license
type LicenseVerifyRequest struct {
	License string `json:"license" binding:"required"`
}

// LicenseVerifyResponse represents the response after license verification
type LicenseVerifyResponse struct {
	Message        string `json:"message"`
	Status         string `json:"status"`
	Type           string `json:"type,omitempty"`
	ExpiresAt      string `json:"expires_at,omitempty"`
	RemainingDays  int    `json:"remaining_days,omitempty"`
	RemainingHours int    `json:"remaining_hours,omitempty"`
}

// LicenseGenerateRequest represents the request to generate licenses
type LicenseGenerateRequest struct {
	Count int    `json:"count" binding:"required,min=1,max=100"`
	Type  string `json:"type" binding:"required,oneof=pro plus plus4"`
}

// LicenseGenerateResponse represents the response after generating licenses
type LicenseGenerateResponse struct {
	Message  string   `json:"message"`
	Count    int      `json:"count"`
	Type     string   `json:"type"`
	Duration int      `json:"duration"`
	Licenses []string `json:"licenses"`
}

// LicenseResponse represents a license in API responses
type LicenseResponse struct {
	ID          uint       `json:"id"`
	Code        string     `json:"code"`
	Type        string     `json:"type"`
	Duration    int        `json:"duration"`
	IsUsed      bool       `json:"is_used"`
	UsedBy      *uint      `json:"used_by"`
	User        *User      `json:"user,omitempty"`
	UsedAt      *time.Time `json:"used_at"`
	ExpiresAt   *time.Time `json:"expires_at"`
	GeneratedBy uint       `json:"generated_by"`
	Admin       User       `json:"admin"`
	CreatedAt   time.Time  `json:"created_at"`
}

// LicenseListResponse represents the response for listing licenses
type LicenseListResponse struct {
	Total     int64     `json:"total"`
	Used      int64     `json:"used"`
	Available int64     `json:"available"`
	Licenses  []License `json:"licenses"`
}

// GenerateLicenseCode generates a unique license code (new format without dashes)
func GenerateLicenseCode() (string, error) {
	// Generate random bytes
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}

	// Convert to hex and format as ASL followed by 16 hex characters (no dashes)
	hex := fmt.Sprintf("%x", bytes)
	code := fmt.Sprintf("ASL%s%s%s%s",
		strings.ToUpper(hex[0:4]),
		strings.ToUpper(hex[4:8]),
		strings.ToUpper(hex[8:12]),
		strings.ToUpper(hex[12:16]),
	)

	return code, nil
}

// GenerateLicenses creates multiple license codes
func GenerateLicenses(db *gorm.DB, count int, licenseType string, adminID uint) ([]string, error) {
	var licenses []License
	var codes []string

	for i := 0; i < count; i++ {
		code, err := GenerateLicenseCode()
		if err != nil {
			return nil, fmt.Errorf("failed to generate license code: %v", err)
		}

		// Check if code already exists (very unlikely but just in case)
		var existing License
		if err := db.Where("code = ?", code).First(&existing).Error; err == nil {
			// Code exists, try again
			i--
			continue
		}

		// Set duration based on license type
		duration := 12 // default for plus
		if licenseType == "pro" {
			duration = 30
		} else if licenseType == "plus4" {
			duration = 4
		}

		license := License{
			Code:        code,
			Type:        licenseType,
			Duration:    duration,
			GeneratedBy: adminID,
		}

		licenses = append(licenses, license)
		codes = append(codes, code)
	}

	// Batch insert
	if err := db.Create(&licenses).Error; err != nil {
		return nil, fmt.Errorf("failed to save licenses: %v", err)
	}

	return codes, nil
}

// UseLicense marks a license as used by a user
func UseLicense(db *gorm.DB, code string, userID uint) (*License, error) {
	var license License

	// Find unused license
	if err := db.Where("code = ? AND is_used = ?", code, false).First(&license).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("لایسنس نامعتبر یا قبلاً استفاده شده است")
		}
		return nil, fmt.Errorf("خطا در بررسی لایسنس: %v", err)
	}

	// Mark as used
	now := time.Now()
	expiresAt := now.AddDate(0, license.Duration, 0) // Add months based on duration

	license.IsUsed = true
	license.UsedBy = &userID
	license.UsedAt = &now
	license.ExpiresAt = &expiresAt

	if err := db.Save(&license).Error; err != nil {
		return nil, fmt.Errorf("خطا در ثبت لایسنس: %v", err)
	}

	return &license, nil
}

// CheckUserLicense checks if user has a valid license
func CheckUserLicense(db *gorm.DB, userID uint) (bool, error) {
	var count int64

	if err := db.Model(&License{}).Where("used_by = ? AND is_used = ? AND expires_at > ?", userID, true, time.Now()).Count(&count).Error; err != nil {
		return false, err
	}

	return count > 0, nil
}

// GetUserLicense gets the license used by a specific user
func GetUserLicense(db *gorm.DB, userID uint) (*License, error) {
	var license License

	if err := db.Where("used_by = ? AND is_used = ?", userID, true).
		Preload("Admin").First(&license).Error; err != nil {
		return nil, err
	}

	return &license, nil
}

// UpdateUserLicenseType updates a user's license type (for upgrades)
func UpdateUserLicenseType(db *gorm.DB, userID uint, newType string) error {
	// Update the license type and extend duration if upgrading to Pro
	updates := map[string]interface{}{
		"type": newType,
	}

	// If upgrading to Pro, extend duration to 30 months from now
	if newType == "pro" {
		newExpiresAt := time.Now().AddDate(0, 30, 0)
		updates["expires_at"] = newExpiresAt
	}

	return db.Model(&License{}).Where("used_by = ? AND is_used = ?", userID, true).Updates(updates).Error
}

// TableName specifies the table name for License
func (License) TableName() string {
	return "licenses"
}
