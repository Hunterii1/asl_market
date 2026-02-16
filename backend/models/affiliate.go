package models

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"strings"
	"time"

	"gorm.io/gorm"
)

// Affiliate represents an affiliate user (separate from WebAdmin and User)
type Affiliate struct {
	ID                uint           `json:"id" gorm:"primaryKey"`
	Name              string         `json:"name" gorm:"size:100;not null"`
	Username          string         `json:"username" gorm:"size:100;uniqueIndex;not null"`
	Password          string         `json:"-" gorm:"size:255;not null"`
	ReferralCode      string         `json:"referral_code" gorm:"size:32"`                // Auto-generated, optional (no longer unique)
	ReferralLink      string         `json:"referral_link" gorm:"size:500"`               // Custom referral link (full URL)
	Balance           float64        `json:"balance" gorm:"type:decimal(14,2);default:0"` // withdrawable balance
	TotalEarnings     float64        `json:"total_earnings" gorm:"type:decimal(14,2);default:0"`
	CommissionPercent float64        `json:"commission_percent" gorm:"type:decimal(5,2);default:100"` // درصد سهم افیلیت از درآمد واقعی (۰–۱۰۰)
	IsActive          bool           `json:"is_active" gorm:"default:true"`
	LastLogin         *time.Time     `json:"last_login"`
	LoginCount        int            `json:"login_count" gorm:"default:0"`
	CreatedAt         time.Time      `json:"created_at"`
	UpdatedAt         time.Time      `json:"updated_at"`
	DeletedAt         gorm.DeletedAt `json:"-" gorm:"index"`
}

// GenerateReferralCode creates a unique short code for the affiliate
func GenerateReferralCode(db *gorm.DB) (string, error) {
	for i := 0; i < 10; i++ {
		b := make([]byte, 4)
		if _, err := rand.Read(b); err != nil {
			return "", err
		}
		code := strings.ToLower(hex.EncodeToString(b))[:8]
		var count int64
		db.Model(&Affiliate{}).Where("referral_code = ?", code).Count(&count)
		if count == 0 {
			return code, nil
		}
	}
	return "", gorm.ErrInvalidData
}

// GetAffiliateByID retrieves an affiliate by ID
func GetAffiliateByID(db *gorm.DB, id uint) (*Affiliate, error) {
	var a Affiliate
	if err := db.First(&a, id).Error; err != nil {
		return nil, err
	}
	return &a, nil
}

// GetAffiliateByUsername retrieves an affiliate by username (case-insensitive)
func GetAffiliateByUsername(db *gorm.DB, username string) (*Affiliate, error) {
	var a Affiliate
	// Normalize username: trim spaces and convert to lowercase for consistent comparison
	usernameNormalized := strings.TrimSpace(strings.ToLower(username))
	usernameTrimmed := strings.TrimSpace(username)

	// Try multiple strategies for maximum compatibility:
	// 1. Exact match with normalized username (most common case for new affiliates)
	if err := db.Where("username = ? AND is_active = ? AND deleted_at IS NULL", usernameNormalized, true).First(&a).Error; err == nil {
		return &a, nil
	}

	// 2. Case-insensitive match with normalized username
	if err := db.Where("LOWER(username) = ? AND is_active = ? AND deleted_at IS NULL", usernameNormalized, true).First(&a).Error; err == nil {
		return &a, nil
	}

	// 3. Exact match with trimmed original username (for backward compatibility)
	if err := db.Where("username = ? AND is_active = ? AND deleted_at IS NULL", usernameTrimmed, true).First(&a).Error; err == nil {
		return &a, nil
	}

	// 4. Case-insensitive match with trimmed original username (last resort)
	if err := db.Where("LOWER(username) = LOWER(?) AND is_active = ? AND deleted_at IS NULL", usernameTrimmed, true).First(&a).Error; err != nil {
		return nil, err
	}
	return &a, nil
}

// GetAffiliateByReferralCode retrieves an affiliate by referral code
func GetAffiliateByReferralCode(db *gorm.DB, code string) (*Affiliate, error) {
	var a Affiliate
	code = strings.TrimSpace(strings.ToLower(code))
	if err := db.Where("referral_code = ? AND is_active = ? AND deleted_at IS NULL", code, true).First(&a).Error; err != nil {
		return nil, err
	}
	return &a, nil
}

// GetAllAffiliates with pagination and filters
func GetAllAffiliates(db *gorm.DB, page, perPage int, status string) ([]Affiliate, int64, error) {
	var list []Affiliate
	var total int64
	query := db.Model(&Affiliate{}).Where("deleted_at IS NULL")
	if status == "active" {
		query = query.Where("is_active = ?", true)
	} else if status == "inactive" {
		query = query.Where("is_active = ?", false)
	}
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	offset := (page - 1) * perPage
	if err := query.Order("created_at DESC").Offset(offset).Limit(perPage).Find(&list).Error; err != nil {
		return nil, 0, err
	}
	return list, total, nil
}

// CreateAffiliate creates a new affiliate
func CreateAffiliate(db *gorm.DB, a *Affiliate) error {
	// ReferralCode is optional now - admin can set ReferralLink directly
	// But we still generate one if not provided for backward compatibility
	if a.ReferralCode == "" && a.ReferralLink == "" {
		code, err := GenerateReferralCode(db)
		if err != nil {
			return err
		}
		a.ReferralCode = code
	}
	
	// Create affiliate first to get the ID
	if err := db.Create(a).Error; err != nil {
		return err
	}
	
	// If ReferralLink is empty, set default link with promoter parameter
	if a.ReferralLink == "" {
		baseURL := "https://asllmarket.com"
		defaultLink := baseURL + "/affiliate/register?promoter=" + fmt.Sprintf("%d", a.ID)
		if err := db.Model(a).Update("referral_link", defaultLink).Error; err != nil {
			return err
		}
		a.ReferralLink = defaultLink
	}
	
	return nil
}

// UpdateAffiliate updates an affiliate
func UpdateAffiliate(db *gorm.DB, id uint, updates map[string]interface{}) error {
	return db.Model(&Affiliate{}).Where("id = ?", id).Updates(updates).Error
}

// DeleteAffiliate soft deletes an affiliate
func DeleteAffiliate(db *gorm.DB, id uint) error {
	return db.Delete(&Affiliate{}, id).Error
}

// UpdateLastLogin updates last login time and count
func (a *Affiliate) UpdateLastLogin(db *gorm.DB) error {
	now := time.Now()
	a.LastLogin = &now
	a.LoginCount++
	return db.Save(a).Error
}
