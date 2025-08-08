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
	// Get user's license info first
	license, err := GetUserLicense(db, u.ID)
	if err != nil {
		// No license - use default limits (same as plus)
		license = &License{Type: "plus"}
	}

	// Get current usage
	limits, err := GetDailyLimits(db, u.ID, time.Now())
	if err != nil {
		return nil, err
	}

	totalUsed := limits.VisitorViews + limits.SupplierViews

	// Calculate max based on license type
	visitorMax := 3
	supplierMax := 3
	if license.Type == "pro" {
		supplierMax = 6
	}
	totalMax := visitorMax + supplierMax
	totalRemaining := totalMax - totalUsed

	if totalRemaining < 0 {
		totalRemaining = 0
	}

	return &ContactLimitsResponse{
		SupplierViewsToday: limits.SupplierViews,
		VisitorViewsToday:  limits.VisitorViews,
		TotalViewsToday:    totalUsed,
		MaxDailyViews:      totalMax,
		RemainingViews:     totalRemaining,
	}, nil
}

// CanViewContact checks if user can view contact information based on target type
func (u *User) CanViewContact(db *gorm.DB, targetType string) (bool, error) {
	// Get user's license info
	license, err := GetUserLicense(db, u.ID)
	if err != nil {
		// No license - use default limits (same as plus)
		license = &License{Type: "plus"}
	}

	if targetType == "visitor" {
		return CanViewVisitor(db, u.ID, license.Type)
	} else if targetType == "supplier" {
		return CanViewSupplier(db, u.ID, license.Type)
	}

	return false, nil
}

// RecordContactView records a contact view and updates limits using existing system
func (u *User) RecordContactView(db *gorm.DB, targetType string, targetID uint) error {
	// Check if user can view this type of contact
	canView, err := u.CanViewContact(db, targetType)
	if err != nil {
		return err
	}
	if !canView {
		return gorm.ErrRecordNotFound // Will be handled as "limit exceeded"
	}

	// Start transaction
	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Use existing daily limits system
	if targetType == "visitor" {
		if err := IncrementVisitorView(tx, u.ID); err != nil {
			tx.Rollback()
			return err
		}
	} else if targetType == "supplier" {
		if err := IncrementSupplierView(tx, u.ID); err != nil {
			tx.Rollback()
			return err
		}
	}

	// Find or create contact view limit record for history tracking
	today := time.Now()
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
