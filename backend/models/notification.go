package models

import (
	"time"

	"gorm.io/gorm"
)

type Notification struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	Title       string         `json:"title" gorm:"size:255;not null;charset:utf8mb4;collation:utf8mb4_unicode_ci"`
	Message     string         `json:"message" gorm:"type:text;charset:utf8mb4;collation:utf8mb4_unicode_ci"`
	Type        string         `json:"type" gorm:"size:50;default:'info'"`       // info, warning, success, error
	Priority    string         `json:"priority" gorm:"size:20;default:'normal'"` // low, normal, high, urgent
	IsActive    bool           `json:"is_active" gorm:"default:true"`
	IsRead      bool           `json:"is_read" gorm:"default:false"`
	UserID      *uint          `json:"user_id" gorm:"index"` // null means broadcast to all users
	User        *User          `json:"user,omitempty" gorm:"foreignKey:UserID"`
	CreatedByID uint           `json:"created_by_id" gorm:"not null;index"`
	CreatedBy   User           `json:"created_by" gorm:"foreignKey:CreatedByID"`
	ExpiresAt   *time.Time     `json:"expires_at" gorm:"index"`
	ActionURL   string         `json:"action_url" gorm:"size:500"`
	ActionText  string         `json:"action_text" gorm:"size:100;charset:utf8mb4;collation:utf8mb4_unicode_ci"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

// DTO for creating a new notification
type CreateNotificationRequest struct {
	Title      string     `json:"title" binding:"required"`
	Message    string     `json:"message" binding:"required"`
	Type       string     `json:"type"`
	Priority   string     `json:"priority"`
	UserID     *uint      `json:"user_id"` // null for broadcast
	ExpiresAt  *time.Time `json:"expires_at"`
	ActionURL  string     `json:"action_url"`
	ActionText string     `json:"action_text"`
}

// DTO for updating notification
type UpdateNotificationRequest struct {
	Title      *string    `json:"title"`
	Message    *string    `json:"message"`
	Type       *string    `json:"type"`
	Priority   *string    `json:"priority"`
	IsActive   *bool      `json:"is_active"`
	ExpiresAt  *time.Time `json:"expires_at"`
	ActionURL  *string    `json:"action_url"`
	ActionText *string    `json:"action_text"`
}

// Response DTO for notification
type NotificationResponse struct {
	ID          uint          `json:"id"`
	Title       string        `json:"title"`
	Message     string        `json:"message"`
	Type        string        `json:"type"`
	Priority    string        `json:"priority"`
	IsActive    bool          `json:"is_active"`
	IsRead      bool          `json:"is_read"`
	UserID      *uint         `json:"user_id"`
	User        *UserResponse `json:"user,omitempty"`
	CreatedByID uint          `json:"created_by_id"`
	CreatedBy   UserResponse  `json:"created_by"`
	ExpiresAt   *time.Time    `json:"expires_at"`
	ActionURL   string        `json:"action_url"`
	ActionText  string        `json:"action_text"`
	CreatedAt   time.Time     `json:"created_at"`
	UpdatedAt   time.Time     `json:"updated_at"`
}

// CreateNotification creates a new notification
func CreateNotification(db *gorm.DB, createdByID uint, req CreateNotificationRequest) (*Notification, error) {
	notification := Notification{
		Title:       req.Title,
		Message:     req.Message,
		Type:        req.Type,
		Priority:    req.Priority,
		UserID:      req.UserID,
		CreatedByID: createdByID,
		ExpiresAt:   req.ExpiresAt,
		ActionURL:   req.ActionURL,
		ActionText:  req.ActionText,
	}

	// Set defaults
	if notification.Type == "" {
		notification.Type = "info"
	}
	if notification.Priority == "" {
		notification.Priority = "normal"
	}

	if err := db.Create(&notification).Error; err != nil {
		return nil, err
	}

	// Preload relationships
	if err := db.Preload("User").Preload("CreatedBy").First(&notification, notification.ID).Error; err != nil {
		return nil, err
	}

	return &notification, nil
}

// GetUserNotifications retrieves notifications for a specific user
func GetUserNotifications(db *gorm.DB, userID uint, page, perPage int, unreadOnly bool) ([]Notification, int64, error) {
	var notifications []Notification
	var total int64

	query := db.Model(&Notification{}).Where("is_active = ?", true)

	// Filter by user (broadcast notifications + user-specific notifications)
	query = query.Where("(user_id IS NULL OR user_id = ?)", userID)

	// Filter by expiration
	query = query.Where("(expires_at IS NULL OR expires_at > ?)", time.Now())

	// Filter by read status
	if unreadOnly {
		query = query.Where("is_read = ?", false)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * perPage
	err := query.Preload("User").Preload("CreatedBy").
		Order("priority DESC, created_at DESC").
		Offset(offset).Limit(perPage).Find(&notifications).Error
	if err != nil {
		return nil, 0, err
	}

	return notifications, total, nil
}

// GetNotification retrieves a single notification by ID
func GetNotification(db *gorm.DB, id uint) (*Notification, error) {
	var notification Notification
	err := db.Preload("User").Preload("CreatedBy").First(&notification, id).Error
	if err != nil {
		return nil, err
	}
	return &notification, nil
}

// MarkNotificationAsRead marks a notification as read
func MarkNotificationAsRead(db *gorm.DB, id, userID uint) error {
	return db.Model(&Notification{}).
		Where("id = ? AND (user_id IS NULL OR user_id = ?)", id, userID).
		Update("is_read", true).Error
}

// MarkAllNotificationsAsRead marks all notifications as read for a user
func MarkAllNotificationsAsRead(db *gorm.DB, userID uint) error {
	return db.Model(&Notification{}).
		Where("(user_id IS NULL OR user_id = ?) AND is_read = ?", userID, false).
		Update("is_read", true).Error
}

// GetUnreadNotificationCount gets the count of unread notifications for a user
func GetUnreadNotificationCount(db *gorm.DB, userID uint) (int64, error) {
	var count int64
	err := db.Model(&Notification{}).
		Where("is_active = ? AND (user_id IS NULL OR user_id = ?) AND is_read = ? AND (expires_at IS NULL OR expires_at > ?)",
			true, userID, false, time.Now()).
		Count(&count).Error
	return count, err
}

// UpdateNotification updates an existing notification
func UpdateNotification(db *gorm.DB, id uint, req UpdateNotificationRequest) (*Notification, error) {
	var notification Notification
	if err := db.First(&notification, id).Error; err != nil {
		return nil, err
	}

	updates := map[string]interface{}{}
	if req.Title != nil {
		updates["title"] = *req.Title
	}
	if req.Message != nil {
		updates["message"] = *req.Message
	}
	if req.Type != nil {
		updates["type"] = *req.Type
	}
	if req.Priority != nil {
		updates["priority"] = *req.Priority
	}
	if req.IsActive != nil {
		updates["is_active"] = *req.IsActive
	}
	if req.ExpiresAt != nil {
		updates["expires_at"] = *req.ExpiresAt
	}
	if req.ActionURL != nil {
		updates["action_url"] = *req.ActionURL
	}
	if req.ActionText != nil {
		updates["action_text"] = *req.ActionText
	}

	if err := db.Model(&notification).Updates(updates).Error; err != nil {
		return nil, err
	}

	// Preload relationships
	if err := db.Preload("User").Preload("CreatedBy").First(&notification, notification.ID).Error; err != nil {
		return nil, err
	}

	return &notification, nil
}

// DeleteNotification deletes a notification
func DeleteNotification(db *gorm.DB, id uint) error {
	return db.Delete(&Notification{}, id).Error
}

// GetNotificationStats gets notification statistics
func GetNotificationStats(db *gorm.DB) (map[string]interface{}, error) {
	var stats = make(map[string]interface{})

	// Total notifications
	var total int64
	if err := db.Model(&Notification{}).Count(&total).Error; err != nil {
		return nil, err
	}
	stats["total"] = total

	// Active notifications
	var active int64
	if err := db.Model(&Notification{}).Where("is_active = ?", true).Count(&active).Error; err != nil {
		return nil, err
	}
	stats["active"] = active

	// Unread notifications (all users)
	var unread int64
	if err := db.Model(&Notification{}).Where("is_active = ? AND is_read = ?", true, false).Count(&unread).Error; err != nil {
		return nil, err
	}
	stats["unread"] = unread

	// Notifications by type
	var typeStats []struct {
		Type  string `json:"type"`
		Count int64  `json:"count"`
	}
	if err := db.Model(&Notification{}).Select("type, count(*) as count").Group("type").Find(&typeStats).Error; err != nil {
		return nil, err
	}
	stats["by_type"] = typeStats

	return stats, nil
}
