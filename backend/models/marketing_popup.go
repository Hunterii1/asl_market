package models

import (
	"time"

	"gorm.io/gorm"
)

// MarketingPopup represents a marketing popup campaign
type MarketingPopup struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	Title       string         `json:"title" gorm:"size:255;charset:utf8mb4;collation:utf8mb4_unicode_ci;not null"`
	Message     string         `json:"message" gorm:"type:text;charset:utf8mb4;collation:utf8mb4_unicode_ci;not null"`
	DiscountURL string         `json:"discount_url" gorm:"size:500"`
	ButtonText  string         `json:"button_text" gorm:"size:100;charset:utf8mb4;collation:utf8mb4_unicode_ci;default:'مشاهده تخفیف'"`
	IsActive    bool           `json:"is_active" gorm:"default:true"`
	StartDate   *time.Time     `json:"start_date"`
	EndDate     *time.Time     `json:"end_date"`
	ShowCount   int            `json:"show_count" gorm:"default:0"`
	ClickCount  int            `json:"click_count" gorm:"default:0"`
	Priority    int            `json:"priority" gorm:"default:1"` // Higher number = higher priority
	AddedByID   uint           `json:"added_by_id" gorm:"not null"`
	AddedBy     User           `json:"added_by" gorm:"foreignKey:AddedByID"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

// MarketingPopupRequest represents the request body for creating/updating popup
type MarketingPopupRequest struct {
	Title       string     `json:"title" binding:"required"`
	Message     string     `json:"message" binding:"required"`
	DiscountURL string     `json:"discount_url"`
	ButtonText  string     `json:"button_text"`
	IsActive    bool       `json:"is_active"`
	StartDate   *time.Time `json:"start_date"`
	EndDate     *time.Time `json:"end_date"`
	Priority    int        `json:"priority"`
}

// MarketingPopupResponse represents the response body for popup
type MarketingPopupResponse struct {
	ID          uint         `json:"id"`
	Title       string       `json:"title"`
	Message     string       `json:"message"`
	DiscountURL string       `json:"discount_url"`
	ButtonText  string       `json:"button_text"`
	IsActive    bool         `json:"is_active"`
	StartDate   *time.Time   `json:"start_date"`
	EndDate     *time.Time   `json:"end_date"`
	ShowCount   int          `json:"show_count"`
	ClickCount  int          `json:"click_count"`
	Priority    int          `json:"priority"`
	AddedBy     UserResponse `json:"added_by"`
	CreatedAt   time.Time    `json:"created_at"`
	UpdatedAt   time.Time    `json:"updated_at"`
}

// CreateMarketingPopup creates a new marketing popup
func CreateMarketingPopup(db *gorm.DB, userID uint, req MarketingPopupRequest) (*MarketingPopup, error) {
	popup := MarketingPopup{
		Title:       req.Title,
		Message:     req.Message,
		DiscountURL: req.DiscountURL,
		ButtonText:  req.ButtonText,
		IsActive:    req.IsActive,
		StartDate:   req.StartDate,
		EndDate:     req.EndDate,
		Priority:    req.Priority,
		AddedByID:   userID,
	}

	if popup.ButtonText == "" {
		popup.ButtonText = "مشاهده تخفیف"
	}

	if popup.Priority == 0 {
		popup.Priority = 1
	}

	if err := db.Create(&popup).Error; err != nil {
		return nil, err
	}

	// Load the added by user
	if err := db.Preload("AddedBy").First(&popup, popup.ID).Error; err != nil {
		return nil, err
	}

	return &popup, nil
}

// GetMarketingPopups retrieves marketing popups with pagination and filters
func GetMarketingPopups(db *gorm.DB, page, perPage int, activeOnly bool) ([]MarketingPopup, int64, error) {
	var popups []MarketingPopup
	var total int64

	query := db.Model(&MarketingPopup{}).Preload("AddedBy")

	if activeOnly {
		query = query.Where("is_active = ?", true)
		// Also check if popup is within date range
		now := time.Now()
		query = query.Where("(start_date IS NULL OR start_date <= ?) AND (end_date IS NULL OR end_date >= ?)", now, now)
	}

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply pagination
	offset := (page - 1) * perPage
	if err := query.Order("priority DESC, created_at DESC").Offset(offset).Limit(perPage).Find(&popups).Error; err != nil {
		return nil, 0, err
	}

	return popups, total, nil
}

// GetActiveMarketingPopup gets the highest priority active popup
func GetActiveMarketingPopup(db *gorm.DB) (*MarketingPopup, error) {
	var popup MarketingPopup
	now := time.Now()

	err := db.Where("is_active = ?", true).
		Where("(start_date IS NULL OR start_date <= ?) AND (end_date IS NULL OR end_date >= ?)", now, now).
		Order("priority DESC, created_at DESC").
		First(&popup).Error

	if err != nil {
		return nil, err
	}

	return &popup, nil
}

// GetMarketingPopupByID retrieves a marketing popup by ID
func GetMarketingPopupByID(db *gorm.DB, id uint) (*MarketingPopup, error) {
	var popup MarketingPopup
	if err := db.Preload("AddedBy").First(&popup, id).Error; err != nil {
		return nil, err
	}
	return &popup, nil
}

// UpdateMarketingPopup updates a marketing popup
func UpdateMarketingPopup(db *gorm.DB, id uint, req MarketingPopupRequest) (*MarketingPopup, error) {
	var popup MarketingPopup
	if err := db.First(&popup, id).Error; err != nil {
		return nil, err
	}

	// Update fields
	popup.Title = req.Title
	popup.Message = req.Message
	popup.DiscountURL = req.DiscountURL
	popup.ButtonText = req.ButtonText
	popup.IsActive = req.IsActive
	popup.StartDate = req.StartDate
	popup.EndDate = req.EndDate
	popup.Priority = req.Priority

	if popup.ButtonText == "" {
		popup.ButtonText = "مشاهده تخفیف"
	}

	if popup.Priority == 0 {
		popup.Priority = 1
	}

	if err := db.Save(&popup).Error; err != nil {
		return nil, err
	}

	// Load the added by user
	if err := db.Preload("AddedBy").First(&popup, popup.ID).Error; err != nil {
		return nil, err
	}

	return &popup, nil
}

// DeleteMarketingPopup soft deletes a marketing popup
func DeleteMarketingPopup(db *gorm.DB, id uint) error {
	return db.Delete(&MarketingPopup{}, id).Error
}

// IncrementShowCount increments the show count for a popup
func IncrementShowCount(db *gorm.DB, id uint) error {
	return db.Model(&MarketingPopup{}).Where("id = ?", id).UpdateColumn("show_count", gorm.Expr("show_count + 1")).Error
}

// IncrementClickCount increments the click count for a popup
func IncrementClickCount(db *gorm.DB, id uint) error {
	return db.Model(&MarketingPopup{}).Where("id = ?", id).UpdateColumn("click_count", gorm.Expr("click_count + 1")).Error
}
