package models

import (
	"time"

	"gorm.io/gorm"
)

type WithdrawalStatus string

const (
	WithdrawalStatusPending    WithdrawalStatus = "pending"
	WithdrawalStatusApproved   WithdrawalStatus = "approved"
	WithdrawalStatusProcessing WithdrawalStatus = "processing"
	WithdrawalStatusCompleted  WithdrawalStatus = "completed"
	WithdrawalStatusRejected   WithdrawalStatus = "rejected"
)

type WithdrawalRequest struct {
	ID            uint    `json:"id" gorm:"primaryKey"`
	UserID        uint    `json:"user_id" gorm:"not null;index"`
	User          User    `json:"user" gorm:"foreignKey:UserID"`
	Amount        float64 `json:"amount" gorm:"not null"`
	Currency      string  `json:"currency" gorm:"size:10;not null"`      // USD, AED, SAR, etc.
	SourceCountry string  `json:"source_country" gorm:"size:5;not null"` // AE, SA, KW, etc.

	// Iranian Bank Details
	BankCardNumber string `json:"bank_card_number" gorm:"size:20"`
	CardHolderName string `json:"card_holder_name" gorm:"size:100"`
	ShebaNumber    string `json:"sheba_number" gorm:"size:30"`
	BankName       string `json:"bank_name" gorm:"size:50"`

	// Destination Account (Filled by admin after approval)
	DestinationAccount string `json:"destination_account" gorm:"size:50"`

	// Status and tracking
	Status      WithdrawalStatus `json:"status" gorm:"type:varchar(20);default:'pending'"`
	RequestedAt time.Time        `json:"requested_at"`
	ApprovedAt  *time.Time       `json:"approved_at"`
	CompletedAt *time.Time       `json:"completed_at"`
	RejectedAt  *time.Time       `json:"rejected_at"`

	// Admin notes and receipt
	AdminNotes  string `json:"admin_notes" gorm:"type:text"`
	ReceiptPath string `json:"receipt_path" gorm:"size:255"`
	AdminID     *uint  `json:"admin_id"`
	Admin       *User  `json:"admin" gorm:"foreignKey:AdminID"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// GetWithdrawalRequests retrieves withdrawal requests with pagination and filtering
func GetWithdrawalRequests(db *gorm.DB, userID *uint, status *WithdrawalStatus, limit, offset int) ([]WithdrawalRequest, int64, error) {
	var requests []WithdrawalRequest
	var total int64

	query := db.Model(&WithdrawalRequest{}).Preload("User").Preload("Admin")

	if userID != nil {
		query = query.Where("user_id = ?", *userID)
	}

	if status != nil {
		query = query.Where("status = ?", *status)
	}

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	if err := query.Order("created_at DESC").Limit(limit).Offset(offset).Find(&requests).Error; err != nil {
		return nil, 0, err
	}

	return requests, total, nil
}

// CreateWithdrawalRequest creates a new withdrawal request
func CreateWithdrawalRequest(db *gorm.DB, request *WithdrawalRequest) error {
	now := time.Now()
	request.Status = WithdrawalStatusPending
	request.RequestedAt = now
	request.CreatedAt = now
	request.UpdatedAt = now

	return db.Create(request).Error
}

// UpdateWithdrawalStatus updates the status of a withdrawal request
func UpdateWithdrawalStatus(db *gorm.DB, requestID uint, status WithdrawalStatus, adminID uint, notes string, destinationAccount string) error {
	updates := map[string]interface{}{
		"status":      status,
		"admin_id":    adminID,
		"admin_notes": notes,
	}

	now := time.Now()

	switch status {
	case WithdrawalStatusApproved:
		updates["approved_at"] = now
		if destinationAccount != "" {
			updates["destination_account"] = destinationAccount
		}
	case WithdrawalStatusProcessing:
		// Processing status doesn't need a specific timestamp
	case WithdrawalStatusCompleted:
		updates["completed_at"] = now
	case WithdrawalStatusRejected:
		updates["rejected_at"] = now
	}

	return db.Model(&WithdrawalRequest{}).Where("id = ?", requestID).Updates(updates).Error
}

// GetWithdrawalRequestByID retrieves a withdrawal request by ID
func GetWithdrawalRequestByID(db *gorm.DB, id uint) (*WithdrawalRequest, error) {
	var request WithdrawalRequest

	err := db.Preload("User").Preload("Admin").First(&request, id).Error
	if err != nil {
		return nil, err
	}

	return &request, nil
}

// GetUserWithdrawalRequests gets all withdrawal requests for a specific user
func GetUserWithdrawalRequests(db *gorm.DB, userID uint) ([]WithdrawalRequest, error) {
	var requests []WithdrawalRequest

	err := db.Where("user_id = ?", userID).Order("created_at DESC").Find(&requests).Error
	if err != nil {
		return nil, err
	}

	return requests, nil
}

// UploadReceipt uploads receipt for a withdrawal request
func UploadReceipt(db *gorm.DB, requestID uint, receiptPath string) error {
	return db.Model(&WithdrawalRequest{}).Where("id = ?", requestID).Update("receipt_path", receiptPath).Error
}

// GetWithdrawalStats returns statistics about withdrawal requests
func GetWithdrawalStats(db *gorm.DB, userID *uint) (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	query := db.Model(&WithdrawalRequest{})
	if userID != nil {
		query = query.Where("user_id = ?", *userID)
	}

	// Total requests
	var total int64
	query.Count(&total)
	stats["total"] = total

	// Completed requests
	var completed int64
	query.Where("status = ?", WithdrawalStatusCompleted).Count(&completed)
	stats["completed"] = completed

	// Pending requests
	var pending int64
	query.Where("status = ?", WithdrawalStatusPending).Count(&pending)
	stats["pending"] = pending

	// Processing requests
	var processing int64
	query.Where("status = ?", WithdrawalStatusProcessing).Count(&processing)
	stats["processing"] = processing

	// Total amount withdrawn (completed only)
	var totalAmount float64
	query.Where("status = ?", WithdrawalStatusCompleted).Select("COALESCE(SUM(amount), 0)").Scan(&totalAmount)
	stats["total_amount"] = totalAmount

	return stats, nil
}
