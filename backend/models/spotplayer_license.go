package models

import (
	"time"

	"gorm.io/gorm"
)

// SpotPlayerLicense represents a SpotPlayer license for a user
type SpotPlayerLicense struct {
	ID           uint           `json:"id" gorm:"primaryKey"`
	UserID       uint           `json:"user_id" gorm:"not null;index"`
	User         User           `json:"user" gorm:"foreignKey:UserID"`
	LicenseKey   string         `json:"license_key" gorm:"size:255;not null"`
	LicenseURL   string         `json:"license_url" gorm:"size:500;not null"`
	SpotPlayerID string         `json:"spotplayer_id" gorm:"size:100;not null"`
	PhoneNumber  string         `json:"phone_number" gorm:"size:20;not null"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`
}

// TableName specifies the table name for SpotPlayerLicense
func (SpotPlayerLicense) TableName() string {
	return "spotplayer_licenses"
}
