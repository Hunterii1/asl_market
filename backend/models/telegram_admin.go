package models

import (
	"fmt"
	"time"

	"gorm.io/gorm"
)

// TelegramAdmin represents a telegram admin stored in database
type TelegramAdmin struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	TelegramID  int64          `json:"telegram_id" gorm:"uniqueIndex;not null"`
	FirstName   string         `json:"first_name" gorm:"size:100"`
	Username    string         `json:"username" gorm:"size:100"`
	IsFullAdmin bool           `json:"is_full_admin" gorm:"default:false"` // true = full admin, false = support admin
	IsActive    bool           `json:"is_active" gorm:"default:true"`
	AddedBy     *uint          `json:"added_by"` // Telegram ID of admin who added this admin
	Notes       string         `json:"notes" gorm:"type:text"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

// GetFullAdmins returns all active full admins from database
func GetFullAdmins(db *gorm.DB) ([]int64, error) {
	var admins []TelegramAdmin
	err := db.Where("is_full_admin = ? AND is_active = ?", true, true).Find(&admins).Error
	if err != nil {
		return nil, err
	}

	var ids []int64
	for _, admin := range admins {
		ids = append(ids, admin.TelegramID)
	}
	return ids, nil
}

// GetSupportAdmins returns all active support admins from database
func GetSupportAdmins(db *gorm.DB) ([]int64, error) {
	var admins []TelegramAdmin
	err := db.Where("is_full_admin = ? AND is_active = ?", false, true).Find(&admins).Error
	if err != nil {
		return nil, err
	}

	var ids []int64
	for _, admin := range admins {
		ids = append(ids, admin.TelegramID)
	}
	return ids, nil
}

// CheckIfAdmin checks if a telegram ID is admin in database
func CheckIfAdmin(db *gorm.DB, telegramID int64, requireFullAdmin bool) bool {
	var admin TelegramAdmin
	query := db.Where("telegram_id = ? AND is_active = ? AND deleted_at IS NULL", telegramID, true)
	if requireFullAdmin {
		query = query.Where("is_full_admin = ?", true)
	} else {
		// For support admin, make sure it's not full admin
		query = query.Where("is_full_admin = ?", false)
	}
	err := query.First(&admin).Error
	return err == nil
}

// AddAdmin adds a new admin to database
func AddAdmin(db *gorm.DB, telegramID int64, firstName, username string, isFullAdmin bool, addedBy int64, notes string) (*TelegramAdmin, error) {
	// Check if admin already exists (including soft deleted)
	var existing TelegramAdmin
	err := db.Unscoped().Where("telegram_id = ?", telegramID).First(&existing).Error
	if err == nil {
		// Update existing admin (restore if soft deleted)
		existing.FirstName = firstName
		existing.Username = username
		existing.IsFullAdmin = isFullAdmin // Explicitly set, don't rely on default
		existing.IsActive = true
		existing.DeletedAt = gorm.DeletedAt{} // Restore if soft deleted
		if notes != "" {
			existing.Notes = notes
		}
		addedByUint := uint(addedBy)
		existing.AddedBy = &addedByUint

		// Debug: Log the value being set
		fmt.Printf("DEBUG: Updating admin with TelegramID=%d, IsFullAdmin=%v\n", telegramID, isFullAdmin)

		if err := db.Unscoped().Save(&existing).Error; err != nil {
			return nil, err
		}
		return &existing, nil
	}

	// Create new admin
	addedByUint := uint(addedBy)
	admin := TelegramAdmin{
		TelegramID:  telegramID,
		FirstName:   firstName,
		Username:    username,
		IsFullAdmin: isFullAdmin, // Explicitly set the value
		IsActive:    true,
		AddedBy:     &addedByUint,
		Notes:       notes,
	}

	// Debug: Log the value being set
	fmt.Printf("DEBUG: Creating admin with TelegramID=%d, IsFullAdmin=%v\n", telegramID, isFullAdmin)

	if err := db.Create(&admin).Error; err != nil {
		return nil, err
	}

	return &admin, nil
}

// RemoveAdmin removes an admin (soft delete)
func RemoveAdmin(db *gorm.DB, telegramID int64) error {
	return db.Where("telegram_id = ?", telegramID).Delete(&TelegramAdmin{}).Error
}

// GetAllAdmins returns all admins (both full and support)
func GetAllAdmins(db *gorm.DB) ([]TelegramAdmin, error) {
	var admins []TelegramAdmin
	err := db.Where("is_active = ?", true).Order("is_full_admin DESC, created_at DESC").Find(&admins).Error
	return admins, err
}
