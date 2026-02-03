package models

import (
	"time"

	"gorm.io/gorm"
)

type AffiliateWithdrawalStatus string

const (
	AffiliateWithdrawalPending    AffiliateWithdrawalStatus = "pending"
	AffiliateWithdrawalApproved   AffiliateWithdrawalStatus = "approved"
	AffiliateWithdrawalProcessing AffiliateWithdrawalStatus = "processing"
	AffiliateWithdrawalCompleted  AffiliateWithdrawalStatus = "completed"
	AffiliateWithdrawalRejected   AffiliateWithdrawalStatus = "rejected"
)

// AffiliateWithdrawalRequest is a withdrawal request from an affiliate
type AffiliateWithdrawalRequest struct {
	ID             uint                      `json:"id" gorm:"primaryKey"`
	AffiliateID    uint                      `json:"affiliate_id" gorm:"not null;index"`
	Affiliate      Affiliate                 `json:"affiliate" gorm:"foreignKey:AffiliateID"`
	Amount         float64                   `json:"amount" gorm:"not null"`
	Currency       string                    `json:"currency" gorm:"size:10;default:'IRR'"`
	BankCardNumber string                    `json:"bank_card_number" gorm:"size:20"`
	CardHolderName string                    `json:"card_holder_name" gorm:"size:100"`
	ShebaNumber    string                    `json:"sheba_number" gorm:"size:30"`
	BankName       string                    `json:"bank_name" gorm:"size:50"`
	Status         AffiliateWithdrawalStatus `json:"status" gorm:"type:varchar(20);default:'pending'"`
	RequestedAt    time.Time                 `json:"requested_at"`
	ApprovedAt     *time.Time                `json:"approved_at"`
	CompletedAt    *time.Time                `json:"completed_at"`
	RejectedAt     *time.Time                `json:"rejected_at"`
	AdminNotes     string                    `json:"admin_notes" gorm:"type:text"`
	ReceiptPath    string                    `json:"receipt_path" gorm:"size:255"`
	CreatedAt      time.Time                 `json:"created_at"`
	UpdatedAt      time.Time                 `json:"updated_at"`
	DeletedAt      gorm.DeletedAt            `json:"-" gorm:"index"`
}

func GetAffiliateWithdrawalRequests(db *gorm.DB, affiliateID uint, limit, offset int) ([]AffiliateWithdrawalRequest, int64, error) {
	var list []AffiliateWithdrawalRequest
	var total int64
	query := db.Model(&AffiliateWithdrawalRequest{}).Where("affiliate_id = ?", affiliateID)
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if err := query.Order("created_at DESC").Limit(limit).Offset(offset).Find(&list).Error; err != nil {
		return nil, 0, err
	}
	return list, total, nil
}

func CreateAffiliateWithdrawalRequest(db *gorm.DB, req *AffiliateWithdrawalRequest) error {
	req.Status = AffiliateWithdrawalPending
	req.RequestedAt = time.Now()
	return db.Create(req).Error
}

func GetAffiliateWithdrawalByID(db *gorm.DB, id uint) (*AffiliateWithdrawalRequest, error) {
	var req AffiliateWithdrawalRequest
	if err := db.Preload("Affiliate").First(&req, id).Error; err != nil {
		return nil, err
	}
	return &req, nil
}

func UpdateAffiliateWithdrawalStatus(db *gorm.DB, id uint, status AffiliateWithdrawalStatus, notes string) error {
	updates := map[string]interface{}{"status": status, "admin_notes": notes}
	now := time.Now()
	switch status {
	case AffiliateWithdrawalApproved:
		updates["approved_at"] = now
	case AffiliateWithdrawalCompleted:
		updates["completed_at"] = now
	case AffiliateWithdrawalRejected:
		updates["rejected_at"] = now
	}
	return db.Model(&AffiliateWithdrawalRequest{}).Where("id = ?", id).Updates(updates).Error
}
