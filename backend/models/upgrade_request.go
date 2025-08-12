package models

import (
	"time"

	"gorm.io/gorm"
)

type UpgradeRequestStatus string

const (
	UpgradeRequestStatusPending  UpgradeRequestStatus = "pending"
	UpgradeRequestStatusApproved UpgradeRequestStatus = "approved"
	UpgradeRequestStatusRejected UpgradeRequestStatus = "rejected"
)

type UpgradeRequest struct {
	ID          uint                 `gorm:"primaryKey" json:"id"`
	UserID      uint                 `gorm:"not null" json:"user_id"`
	User        User                 `gorm:"foreignKey:UserID" json:"user,omitempty"`
	FromPlan    string               `gorm:"not null" json:"from_plan"`
	ToPlan      string               `gorm:"not null" json:"to_plan"`
	Status      UpgradeRequestStatus `gorm:"default:pending" json:"status"`
	RequestNote string               `gorm:"type:text" json:"request_note"`
	AdminNote   string               `gorm:"type:text" json:"admin_note"`
	ProcessedBy *uint                `json:"processed_by"`
	ProcessedAt *time.Time           `json:"processed_at"`
	CreatedAt   time.Time            `json:"created_at"`
	UpdatedAt   time.Time            `json:"updated_at"`
	DeletedAt   gorm.DeletedAt       `gorm:"index" json:"-"`
}

// CreateUpgradeRequest creates a new upgrade request
func CreateUpgradeRequest(db *gorm.DB, userID uint, fromPlan, toPlan, note string) (*UpgradeRequest, error) {
	request := &UpgradeRequest{
		UserID:      userID,
		FromPlan:    fromPlan,
		ToPlan:      toPlan,
		RequestNote: note,
		Status:      UpgradeRequestStatusPending,
	}

	if err := db.Create(request).Error; err != nil {
		return nil, err
	}

	return request, nil
}

// GetUpgradeRequestByID gets an upgrade request by ID
func GetUpgradeRequestByID(db *gorm.DB, id uint) (*UpgradeRequest, error) {
	var request UpgradeRequest
	if err := db.Preload("User").First(&request, id).Error; err != nil {
		return nil, err
	}
	return &request, nil
}

// GetPendingUpgradeRequests gets all pending upgrade requests
func GetPendingUpgradeRequests(db *gorm.DB) ([]UpgradeRequest, error) {
	var requests []UpgradeRequest
	if err := db.Preload("User").Where("status = ?", UpgradeRequestStatusPending).Find(&requests).Error; err != nil {
		return nil, err
	}
	return requests, nil
}

// GetUserUpgradeRequests gets all upgrade requests for a user
func GetUserUpgradeRequests(db *gorm.DB, userID uint) ([]UpgradeRequest, error) {
	var requests []UpgradeRequest
	if err := db.Where("user_id = ?", userID).Order("created_at DESC").Find(&requests).Error; err != nil {
		return nil, err
	}
	return requests, nil
}

// UpdateUpgradeRequestStatus updates the status of an upgrade request
func UpdateUpgradeRequestStatus(db *gorm.DB, requestID uint, status UpgradeRequestStatus, adminNote string, processedBy uint) error {
	now := time.Now()
	return db.Model(&UpgradeRequest{}).Where("id = ?", requestID).Updates(map[string]interface{}{
		"status":       status,
		"admin_note":   adminNote,
		"processed_by": processedBy,
		"processed_at": &now,
	}).Error
}

// HasPendingUpgradeRequest checks if user has a pending upgrade request
func HasPendingUpgradeRequest(db *gorm.DB, userID uint) (bool, error) {
	var count int64
	err := db.Model(&UpgradeRequest{}).Where("user_id = ? AND status = ?", userID, UpgradeRequestStatusPending).Count(&count).Error
	return count > 0, err
}
