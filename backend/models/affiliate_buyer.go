package models

import (
	"time"

	"gorm.io/gorm"
)

// AffiliateBuyer is a buyer attributed to an affiliate (matched from sales list and confirmed by admin)
type AffiliateBuyer struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	AffiliateID uint           `json:"affiliate_id" gorm:"not null;index"`
	Affiliate   Affiliate      `json:"-" gorm:"foreignKey:AffiliateID"`
	Name        string         `json:"name" gorm:"size:200;not null"`
	Phone       string         `json:"phone" gorm:"size:20;not null;index"`
	PurchasedAt *time.Time     `json:"purchased_at" gorm:"type:date"` // week of sale
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

// GetAffiliateBuyers returns paginated list for an affiliate
func GetAffiliateBuyers(db *gorm.DB, affiliateID uint, limit, offset int) ([]AffiliateBuyer, int64, error) {
	var list []AffiliateBuyer
	var total int64
	query := db.Model(&AffiliateBuyer{}).Where("affiliate_id = ?", affiliateID)
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if err := query.Order("purchased_at DESC, created_at DESC").Limit(limit).Offset(offset).Find(&list).Error; err != nil {
		return nil, 0, err
	}
	return list, total, nil
}

// CreateAffiliateBuyerBatch inserts multiple buyers (after admin confirm)
func CreateAffiliateBuyerBatch(db *gorm.DB, affiliateID uint, purchasedAt *time.Time, rows []AffiliateBuyer) error {
	if len(rows) == 0 {
		return nil
	}
	for i := range rows {
		rows[i].AffiliateID = affiliateID
		rows[i].PurchasedAt = purchasedAt
	}
	return db.Create(&rows).Error
}
