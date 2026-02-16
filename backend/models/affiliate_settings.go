package models

import (
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
		if err := db.Create(&settings).Error; err != nil {
			return nil, err
		}
		return &settings, nil
	}
	
	if err != nil {
		return nil, err
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
