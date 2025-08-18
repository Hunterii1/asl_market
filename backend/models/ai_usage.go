package models

import (
	"time"

	"gorm.io/gorm"
)

// AIUsage represents daily AI message usage tracking for users
type AIUsage struct {
	ID           uint           `json:"id" gorm:"primaryKey"`
	UserID       uint           `json:"user_id" gorm:"not null;index"`
	User         User           `json:"user" gorm:"foreignKey:UserID"`
	Date         time.Time      `json:"date" gorm:"type:date;not null;index"` // Date for which usage is tracked
	MessageCount int            `json:"message_count" gorm:"default:0"`       // Number of messages sent on this date
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`
}

// TableName specifies the table name for AIUsage
func (AIUsage) TableName() string {
	return "ai_usage"
}

// AIUsageResponse represents the response for AI usage information
type AIUsageResponse struct {
	Date           string `json:"date"`
	MessageCount   int    `json:"message_count"`
	RemainingCount int    `json:"remaining_count"`
	DailyLimit     int    `json:"daily_limit"`
}

// Constants for AI usage limits
const (
	DailyAIMessageLimit = 20
)
