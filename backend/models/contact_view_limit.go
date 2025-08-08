package models

import (
	"time"

	"gorm.io/gorm"
)

// ContactViewLimit tracks how many times a user has viewed contact information
type ContactViewLimit struct {
	ID           uint           `json:"id" gorm:"primaryKey"`
	UserID       uint           `json:"user_id" gorm:"not null;index"`
	User         User           `json:"user" gorm:"foreignKey:UserID"`
	TargetType   string         `json:"target_type" gorm:"size:50;not null"` // "supplier" or "visitor"
	TargetID     uint           `json:"target_id" gorm:"not null"`
	ViewCount    int            `json:"view_count" gorm:"default:0"`
	LastViewedAt *time.Time     `json:"last_viewed_at"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`
}

// DailyContactViewLimit tracks daily limits for contact viewing
type DailyContactViewLimit struct {
	ID            uint           `json:"id" gorm:"primaryKey"`
	UserID        uint           `json:"user_id" gorm:"not null;index"`
	User          User           `json:"user" gorm:"foreignKey:UserID"`
	Date          time.Time      `json:"date" gorm:"type:date;not null;index"`
	SupplierViews int            `json:"supplier_views" gorm:"default:0"`
	VisitorViews  int            `json:"visitor_views" gorm:"default:0"`
	TotalViews    int            `json:"total_views" gorm:"default:0"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `json:"-" gorm:"index"`
}

// ContactViewRequest represents a request to view contact information
type ContactViewRequest struct {
	TargetType string `json:"target_type" binding:"required,oneof=supplier visitor"`
	TargetID   uint   `json:"target_id" binding:"required"`
}

// ContactViewResponse represents the response after viewing contact information
type ContactViewResponse struct {
	Success        bool   `json:"success"`
	Message        string `json:"message"`
	RemainingViews int    `json:"remaining_views"`
	TotalViews     int    `json:"total_views"`
	MaxViews       int    `json:"max_views"`
}

// ContactLimitsResponse represents current limits for a user
type ContactLimitsResponse struct {
	SupplierViewsToday int `json:"supplier_views_today"`
	VisitorViewsToday  int `json:"visitor_views_today"`
	TotalViewsToday    int `json:"total_views_today"`
	MaxDailyViews      int `json:"max_daily_views"`
	RemainingViews     int `json:"remaining_views"`
}

// GetContactLimits returns the current contact view limits for a user
func (u *User) GetContactLimits(db *gorm.DB) (*ContactLimitsResponse, error) {
	today := time.Now().Format("2006-01-02")

	var dailyLimit DailyContactViewLimit
	err := db.Where("user_id = ? AND DATE(date) = ?", u.ID, today).First(&dailyLimit).Error
	if err != nil && err != gorm.ErrRecordNotFound {
		return nil, err
	}

	maxDailyViews := 5 // Default limit per day
	remainingViews := maxDailyViews - dailyLimit.TotalViews
	if remainingViews < 0 {
		remainingViews = 0
	}

	return &ContactLimitsResponse{
		SupplierViewsToday: dailyLimit.SupplierViews,
		VisitorViewsToday:  dailyLimit.VisitorViews,
		TotalViewsToday:    dailyLimit.TotalViews,
		MaxDailyViews:      maxDailyViews,
		RemainingViews:     remainingViews,
	}, nil
}

// CanViewContact checks if user can view contact information
func (u *User) CanViewContact(db *gorm.DB) (bool, error) {
	limits, err := u.GetContactLimits(db)
	if err != nil {
		return false, err
	}

	return limits.RemainingViews > 0, nil
}

// RecordContactView records a contact view and updates limits
func (u *User) RecordContactView(db *gorm.DB, targetType string, targetID uint) error {
	today := time.Now()
	todayDate := today.Format("2006-01-02")

	// Start transaction
	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Find or create daily limit record
	var dailyLimit DailyContactViewLimit
	err := tx.Where("user_id = ? AND DATE(date) = ?", u.ID, todayDate).First(&dailyLimit).Error
	if err == gorm.ErrRecordNotFound {
		// Create new daily limit record
		dailyLimit = DailyContactViewLimit{
			UserID: u.ID,
			Date:   today,
		}
		if err := tx.Create(&dailyLimit).Error; err != nil {
			tx.Rollback()
			return err
		}
	} else if err != nil {
		tx.Rollback()
		return err
	}

	// Check if already at limit
	maxDailyViews := 5
	if dailyLimit.TotalViews >= maxDailyViews {
		tx.Rollback()
		return gorm.ErrRecordNotFound // Will be handled as "limit exceeded"
	}

	// Update daily limit
	updates := map[string]interface{}{
		"total_views": dailyLimit.TotalViews + 1,
	}

	if targetType == "supplier" {
		updates["supplier_views"] = dailyLimit.SupplierViews + 1
	} else if targetType == "visitor" {
		updates["visitor_views"] = dailyLimit.VisitorViews + 1
	}

	if err := tx.Model(&dailyLimit).Updates(updates).Error; err != nil {
		tx.Rollback()
		return err
	}

	// Find or create contact view limit record
	var contactLimit ContactViewLimit
	err = tx.Where("user_id = ? AND target_type = ? AND target_id = ?", u.ID, targetType, targetID).First(&contactLimit).Error
	if err == gorm.ErrRecordNotFound {
		// Create new contact view record
		contactLimit = ContactViewLimit{
			UserID:       u.ID,
			TargetType:   targetType,
			TargetID:     targetID,
			ViewCount:    1,
			LastViewedAt: &today,
		}
		if err := tx.Create(&contactLimit).Error; err != nil {
			tx.Rollback()
			return err
		}
	} else if err != nil {
		tx.Rollback()
		return err
	} else {
		// Update existing record
		if err := tx.Model(&contactLimit).Updates(map[string]interface{}{
			"view_count":     contactLimit.ViewCount + 1,
			"last_viewed_at": today,
		}).Error; err != nil {
			tx.Rollback()
			return err
		}
	}

	tx.Commit()
	return nil
}
