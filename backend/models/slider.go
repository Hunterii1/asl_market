package models

import (
	"time"

	"gorm.io/gorm"
)

// Slider represents a slider image for the main platform
type Slider struct {
	ID         uint           `json:"id" gorm:"primaryKey"`
	ImageURL   string         `json:"image_url" gorm:"size:500;not null"`
	Link       string         `json:"link" gorm:"size:500"`                        // Link to a section or external URL
	LinkType   string         `json:"link_type" gorm:"size:50;default:'internal'"` // internal, external
	IsActive   bool           `json:"is_active" gorm:"default:true"`
	Order      int            `json:"order" gorm:"default:0"` // Order for display
	ClickCount int            `json:"click_count" gorm:"default:0"`
	ViewCount  int            `json:"view_count" gorm:"default:0"`
	AddedByID  uint           `json:"added_by_id" gorm:"not null"`
	AddedBy    User           `json:"added_by" gorm:"foreignKey:AddedByID"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `json:"-" gorm:"index"`
}

// SliderRequest represents the request body for creating/updating slider
type SliderRequest struct {
	ImageURL string `json:"image_url" binding:"required"`
	Link     string `json:"link"`
	LinkType string `json:"link_type"` // internal, external
	IsActive bool   `json:"is_active"`
	Order    int    `json:"order"`
}

// SliderResponse represents the response body for slider
type SliderResponse struct {
	ID         uint         `json:"id"`
	ImageURL   string       `json:"image_url"`
	Link       string       `json:"link"`
	LinkType   string       `json:"link_type"`
	IsActive   bool         `json:"is_active"`
	Order      int          `json:"order"`
	ClickCount int          `json:"click_count"`
	ViewCount  int          `json:"view_count"`
	AddedBy    UserResponse `json:"added_by"`
	CreatedAt  time.Time    `json:"created_at"`
	UpdatedAt  time.Time    `json:"updated_at"`
}

// CreateSlider creates a new slider
func CreateSlider(db *gorm.DB, userID uint, req SliderRequest) (*Slider, error) {
	slider := Slider{
		ImageURL:  req.ImageURL,
		Link:      req.Link,
		LinkType:  req.LinkType,
		IsActive:  req.IsActive,
		Order:     req.Order,
		AddedByID: userID,
	}

	if slider.LinkType == "" {
		slider.LinkType = "internal"
	}

	if err := db.Create(&slider).Error; err != nil {
		return nil, err
	}

	// Load the added by user
	if err := db.Preload("AddedBy").First(&slider, slider.ID).Error; err != nil {
		return nil, err
	}

	return &slider, nil
}

// GetSliders retrieves sliders with pagination and filters
func GetSliders(db *gorm.DB, page, perPage int, activeOnly bool) ([]Slider, int64, error) {
	var sliders []Slider
	var total int64

	query := db.Model(&Slider{}).Preload("AddedBy")

	if activeOnly {
		query = query.Where("is_active = ?", true)
	}

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply pagination
	offset := (page - 1) * perPage
	if err := query.Order("`order` ASC, created_at DESC").Offset(offset).Limit(perPage).Find(&sliders).Error; err != nil {
		return nil, 0, err
	}

	return sliders, total, nil
}

// GetActiveSliders gets all active sliders ordered by order field
func GetActiveSliders(db *gorm.DB) ([]Slider, error) {
	var sliders []Slider

	err := db.Where("is_active = ?", true).
		Order("`order` ASC, created_at DESC").
		Find(&sliders).Error

	if err != nil {
		return nil, err
	}

	return sliders, nil
}

// GetSliderByID retrieves a slider by ID
func GetSliderByID(db *gorm.DB, id uint) (*Slider, error) {
	var slider Slider
	if err := db.Preload("AddedBy").First(&slider, id).Error; err != nil {
		return nil, err
	}
	return &slider, nil
}

// UpdateSlider updates a slider
func UpdateSlider(db *gorm.DB, id uint, req SliderRequest) (*Slider, error) {
	var slider Slider
	if err := db.First(&slider, id).Error; err != nil {
		return nil, err
	}

	// Update fields
	slider.ImageURL = req.ImageURL
	slider.Link = req.Link
	slider.LinkType = req.LinkType
	slider.IsActive = req.IsActive
	slider.Order = req.Order

	if slider.LinkType == "" {
		slider.LinkType = "internal"
	}

	if err := db.Save(&slider).Error; err != nil {
		return nil, err
	}

	// Load the added by user
	if err := db.Preload("AddedBy").First(&slider, slider.ID).Error; err != nil {
		return nil, err
	}

	return &slider, nil
}

// DeleteSlider soft deletes a slider
func DeleteSlider(db *gorm.DB, id uint) error {
	return db.Delete(&Slider{}, id).Error
}

// IncrementViewCount increments the view count for a slider
func IncrementViewCount(db *gorm.DB, id uint) error {
	return db.Model(&Slider{}).Where("id = ?", id).UpdateColumn("view_count", gorm.Expr("view_count + 1")).Error
}

// IncrementSliderClickCount increments the click count for a slider
func IncrementSliderClickCount(db *gorm.DB, id uint) error {
	return db.Model(&Slider{}).Where("id = ?", id).UpdateColumn("click_count", gorm.Expr("click_count + 1")).Error
}
