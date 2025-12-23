package models

import (
	"time"

	"gorm.io/gorm"
)

// PushSubscription represents a user's push notification subscription
type PushSubscription struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	UserID    uint           `json:"user_id" gorm:"not null;index"`
	User      User           `json:"user" gorm:"foreignKey:UserID"`
	Endpoint  string         `json:"endpoint" gorm:"type:text;not null"` // Can be FCM token or WebPush endpoint (no index on TEXT in MySQL)
	P256dh    string         `json:"p256dh" gorm:"type:text"`            // Optional for FCM
	Auth      string         `json:"auth" gorm:"type:text"`              // Optional for FCM
	UserAgent string         `json:"user_agent" gorm:"size:500"`
	IsActive  bool           `json:"is_active" gorm:"default:true"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// CreatePushSubscription creates a new push subscription
func CreatePushSubscription(db *gorm.DB, userID uint, endpoint, p256dh, auth, userAgent string) (*PushSubscription, error) {
	// Check if subscription already exists for this user and endpoint
	var existing PushSubscription
	if err := db.Where("user_id = ? AND endpoint = ?", userID, endpoint).First(&existing).Error; err == nil {
		// Update existing subscription
		existing.P256dh = p256dh
		existing.Auth = auth
		existing.UserAgent = userAgent
		existing.IsActive = true
		if err := db.Save(&existing).Error; err != nil {
			return nil, err
		}
		return &existing, nil
	}

	subscription := PushSubscription{
		UserID:    userID,
		Endpoint:  endpoint,
		P256dh:    p256dh,
		Auth:      auth,
		UserAgent: userAgent,
		IsActive:  true,
	}

	if err := db.Create(&subscription).Error; err != nil {
		return nil, err
	}

	return &subscription, nil
}

// GetUserPushSubscriptions gets all active push subscriptions for a user
func GetUserPushSubscriptions(db *gorm.DB, userID uint) ([]PushSubscription, error) {
	var subscriptions []PushSubscription
	err := db.Where("user_id = ? AND is_active = ?", userID, true).Find(&subscriptions).Error
	return subscriptions, err
}

// GetAllActivePushSubscriptions gets all active push subscriptions
func GetAllActivePushSubscriptions(db *gorm.DB) ([]PushSubscription, error) {
	var subscriptions []PushSubscription
	err := db.Where("is_active = ?", true).Preload("User").Find(&subscriptions).Error
	return subscriptions, err
}

// DeactivatePushSubscription deactivates a push subscription
func DeactivatePushSubscription(db *gorm.DB, userID uint, endpoint string) error {
	return db.Model(&PushSubscription{}).
		Where("user_id = ? AND endpoint = ?", userID, endpoint).
		Update("is_active", false).Error
}

// DeletePushSubscription deletes a push subscription
func DeletePushSubscription(db *gorm.DB, userID uint, endpoint string) error {
	return db.Where("user_id = ? AND endpoint = ?", userID, endpoint).
		Delete(&PushSubscription{}).Error
}
