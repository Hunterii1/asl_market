package models

import (
	"time"

	"gorm.io/gorm"
)

// WebAdmin represents a web panel admin (not telegram admin)
type WebAdmin struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	Name        string         `json:"name" gorm:"size:100;not null"`
	Email       string         `json:"email" gorm:"size:255;uniqueIndex;not null"`
	Phone       string         `json:"phone" gorm:"size:20;not null"`
	Username    string         `json:"username" gorm:"size:100;uniqueIndex;not null"`
	Password    string         `json:"-" gorm:"size:255;not null"`
	TelegramID  *int64         `json:"telegram_id" gorm:"index"` // Optional: telegram ID for username/password
	Role        string         `json:"role" gorm:"size:50;default:'admin'"` // super_admin, admin, moderator
	Permissions string         `json:"permissions" gorm:"type:text"` // JSON array of permissions
	IsActive    bool           `json:"is_active" gorm:"default:true"`
	LastLogin   *time.Time     `json:"last_login"`
	LoginCount  int            `json:"login_count" gorm:"default:0"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

// GetWebAdminByID retrieves a web admin by ID
func GetWebAdminByID(db *gorm.DB, id uint) (*WebAdmin, error) {
	var admin WebAdmin
	if err := db.First(&admin, id).Error; err != nil {
		return nil, err
	}
	return &admin, nil
}

// GetWebAdminByUsername retrieves a web admin by username (case-insensitive)
func GetWebAdminByUsername(db *gorm.DB, username string) (*WebAdmin, error) {
	var admin WebAdmin
	// Try exact match first
	if err := db.Where("username = ? AND is_active = ? AND deleted_at IS NULL", username, true).First(&admin).Error; err == nil {
		return &admin, nil
	}
	// If not found, try case-insensitive match (MySQL: LOWER() function)
	if err := db.Where("LOWER(username) = LOWER(?) AND is_active = ? AND deleted_at IS NULL", username, true).First(&admin).Error; err != nil {
		return nil, err
	}
	return &admin, nil
}

// GetWebAdminByEmail retrieves a web admin by email
func GetWebAdminByEmail(db *gorm.DB, email string) (*WebAdmin, error) {
	var admin WebAdmin
	if err := db.Where("email = ? AND is_active = ? AND deleted_at IS NULL", email, true).First(&admin).Error; err != nil {
		return nil, err
	}
	return &admin, nil
}

// GetAllWebAdmins retrieves all web admins with pagination
func GetAllWebAdmins(db *gorm.DB, page, perPage int, role, status string) ([]WebAdmin, int64, error) {
	var admins []WebAdmin
	var total int64

	query := db.Model(&WebAdmin{}).Where("deleted_at IS NULL")

	// Apply filters
	if role != "" {
		query = query.Where("role = ?", role)
	}
	if status != "" {
		if status == "active" {
			query = query.Where("is_active = ?", true)
		} else if status == "inactive" {
			query = query.Where("is_active = ?", false)
		} else if status == "suspended" {
			query = query.Where("is_active = ?", false)
		}
	}

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply pagination
	offset := (page - 1) * perPage
	if err := query.Order("created_at DESC").Offset(offset).Limit(perPage).Find(&admins).Error; err != nil {
		return nil, 0, err
	}

	return admins, total, nil
}

// CreateWebAdmin creates a new web admin
func CreateWebAdmin(db *gorm.DB, admin *WebAdmin) error {
	return db.Create(admin).Error
}

// UpdateWebAdmin updates an existing web admin
func UpdateWebAdmin(db *gorm.DB, id uint, updates map[string]interface{}) error {
	return db.Model(&WebAdmin{}).Where("id = ?", id).Updates(updates).Error
}

// DeleteWebAdmin soft deletes a web admin
func DeleteWebAdmin(db *gorm.DB, id uint) error {
	return db.Delete(&WebAdmin{}, id).Error
}

// UpdateLastLogin updates the last login time and increments login count
func (wa *WebAdmin) UpdateLastLogin(db *gorm.DB) error {
	now := time.Now()
	wa.LastLogin = &now
	wa.LoginCount++
	return db.Save(wa).Error
}

