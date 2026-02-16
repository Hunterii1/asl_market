package models

import (
	"log"
	"time"

	"gorm.io/gorm"
)

// AffiliateSettings represents global affiliate settings (singleton)
type AffiliateSettings struct {
	ID            uint           `json:"id" gorm:"primaryKey"`
	SMSPatternCode string         `json:"sms_pattern_code" gorm:"column:sms_pattern_code;size:100"` // Pattern code for SMS after registration
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `json:"-" gorm:"index"`
}

// TableName specifies the table name for AffiliateSettings
func (AffiliateSettings) TableName() string {
	return "affiliate_settings"
}

// GetAffiliateSettings retrieves or creates the singleton settings
func GetAffiliateSettings(db *gorm.DB) (*AffiliateSettings, error) {
	var settings AffiliateSettings
	
	// Try to get existing settings
	err := db.Where("deleted_at IS NULL").First(&settings).Error
	
	if err == gorm.ErrRecordNotFound {
		// Create default settings if not found
		settings = AffiliateSettings{
			SMSPatternCode: "",
		}
		if createErr := db.Create(&settings).Error; createErr != nil {
			// If table doesn't exist or creation fails, return empty settings instead of error
			log.Printf("[GetAffiliateSettings] Failed to create settings (table may not exist): %v", createErr)
			return &AffiliateSettings{SMSPatternCode: ""}, nil
		}
		return &settings, nil
	}
	
	if err != nil {
		// If any other error, return empty settings instead of failing
		log.Printf("[GetAffiliateSettings] Error getting settings: %v", err)
		return &AffiliateSettings{SMSPatternCode: ""}, nil
	}
	
	return &settings, nil
}

// UpdateAffiliateSettings updates the singleton settings
func UpdateAffiliateSettings(db *gorm.DB, updates map[string]interface{}) error {
	// Get or create settings first
	settings, err := GetAffiliateSettings(db)
	if err != nil {
		return err
	}
	
	return db.Model(settings).Updates(updates).Error
}
