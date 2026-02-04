package models

import (
	"time"

	"gorm.io/gorm"
)

// AffiliateRegisteredUser is a user imported by admin for an affiliate (from CSV - name, phone, registration date)
type AffiliateRegisteredUser struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	AffiliateID uint           `json:"affiliate_id" gorm:"not null;index"`
	Affiliate   Affiliate      `json:"-" gorm:"foreignKey:AffiliateID"`
	Name        string         `json:"name" gorm:"size:200;not null"`
	Phone       string         `json:"phone" gorm:"size:20;not null;index"`
	RegisteredAt *time.Time    `json:"registered_at" gorm:"type:date"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

// GetAffiliateRegisteredUsers returns paginated list for an affiliate
func GetAffiliateRegisteredUsers(db *gorm.DB, affiliateID uint, limit, offset int) ([]AffiliateRegisteredUser, int64, error) {
	var list []AffiliateRegisteredUser
	var total int64
	query := db.Model(&AffiliateRegisteredUser{}).Where("affiliate_id = ?", affiliateID)
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if err := query.Order("registered_at DESC, created_at DESC").Limit(limit).Offset(offset).Find(&list).Error; err != nil {
		return nil, 0, err
	}
	return list, total, nil
}

// CreateAffiliateRegisteredUserBatch inserts multiple rows (from CSV import).
// Uses CreateInBatches with batch size 1000 so all rows are inserted (GORM default Create batch size is 100).
func CreateAffiliateRegisteredUserBatch(db *gorm.DB, affiliateID uint, rows []AffiliateRegisteredUser) error {
	if len(rows) == 0 {
		return nil
	}
	for i := range rows {
		rows[i].AffiliateID = affiliateID
	}
	const batchSize = 1000
	return db.CreateInBatches(rows, batchSize).Error
}
