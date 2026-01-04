package models

import (
	"time"

	"gorm.io/gorm"
)

// DailyViewLimit tracks daily viewing limits for users
type DailyViewLimit struct {
	ID                    uint      `json:"id" gorm:"primaryKey"`
	UserID                uint      `json:"user_id" gorm:"not null;index"`
	User                  User      `json:"user" gorm:"foreignKey:UserID"`
	Date                  time.Time `json:"date" gorm:"type:date;not null;index"`
	VisitorViews          int       `json:"visitor_views" gorm:"default:0"`
	SupplierViews         int       `json:"supplier_views" gorm:"default:0"`
	AvailableProductViews int       `json:"available_product_views" gorm:"default:0"`
	CreatedAt             time.Time `json:"created_at"`
	UpdatedAt             time.Time `json:"updated_at"`
}

// GetDailyLimits gets or creates daily limits for a user
func GetDailyLimits(db *gorm.DB, userID uint, date time.Time) (*DailyViewLimit, error) {
	var limits DailyViewLimit

	// Ensure date is at start of day
	dateOnly := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())

	err := db.Where("user_id = ? AND date = ?", userID, dateOnly).First(&limits).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			// Create new record
			limits = DailyViewLimit{
				UserID: userID,
				Date:   dateOnly,
			}
			if err := db.Create(&limits).Error; err != nil {
				return nil, err
			}
		} else {
			return nil, err
		}
	}

	return &limits, nil
}

// CanViewVisitor checks if user can view another visitor today
func CanViewVisitor(db *gorm.DB, userID uint, licenseType string) (bool, error) {
	limits, err := GetDailyLimits(db, userID, time.Now())
	if err != nil {
		return false, err
	}

	maxViews := 3 // Default for both plus and pro

	return limits.VisitorViews < maxViews, nil
}

// CanViewSupplier checks if user can view another supplier today
func CanViewSupplier(db *gorm.DB, userID uint, licenseType string) (bool, error) {
	limits, err := GetDailyLimits(db, userID, time.Now())
	if err != nil {
		return false, err
	}

	maxViews := 3 // Default for plus
	if licenseType == "pro" {
		maxViews = 6
	}

	return limits.SupplierViews < maxViews, nil
}

// IncrementVisitorView increments visitor view count
func IncrementVisitorView(db *gorm.DB, userID uint) error {
	limits, err := GetDailyLimits(db, userID, time.Now())
	if err != nil {
		return err
	}

	return db.Model(limits).Update("visitor_views", limits.VisitorViews+1).Error
}

// IncrementSupplierView increments supplier view count
func IncrementSupplierView(db *gorm.DB, userID uint) error {
	limits, err := GetDailyLimits(db, userID, time.Now())
	if err != nil {
		return err
	}

	return db.Model(limits).Update("supplier_views", limits.SupplierViews+1).Error
}

// CanViewAvailableProduct checks if user can view available products today
func CanViewAvailableProduct(db *gorm.DB, userID uint, licenseType string) (bool, error) {
	limits, err := GetDailyLimits(db, userID, time.Now())
	if err != nil {
		return false, err
	}

	maxViews := 3 // Default for plus
	if licenseType == "pro" {
		maxViews = 6
	}

	return limits.AvailableProductViews < maxViews, nil
}

// IncrementAvailableProductView increments available product view count
func IncrementAvailableProductView(db *gorm.DB, userID uint) error {
	limits, err := GetDailyLimits(db, userID, time.Now())
	if err != nil {
		return err
	}

	return db.Model(limits).Update("available_product_views", limits.AvailableProductViews+1).Error
}

// GetRemainingLimits returns remaining views for today
func GetRemainingLimits(db *gorm.DB, userID uint, licenseType string) (int, int, int, error) {
	limits, err := GetDailyLimits(db, userID, time.Now())
	if err != nil {
		return 0, 0, 0, err
	}

	visitorMax := 3
	supplierMax := 3
	availableProductMax := 3
	if licenseType == "pro" {
		supplierMax = 6
		availableProductMax = 6
	}

	visitorRemaining := visitorMax - limits.VisitorViews
	if visitorRemaining < 0 {
		visitorRemaining = 0
	}

	supplierRemaining := supplierMax - limits.SupplierViews
	if supplierRemaining < 0 {
		supplierRemaining = 0
	}

	availableProductRemaining := availableProductMax - limits.AvailableProductViews
	if availableProductRemaining < 0 {
		availableProductRemaining = 0
	}

	return visitorRemaining, supplierRemaining, availableProductRemaining, nil
}
