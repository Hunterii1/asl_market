package models

import (
	"time"

	"gorm.io/gorm"
)

// Chat represents a chat session between user and AI
type Chat struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	UserID    uint           `json:"user_id" gorm:"not null;index"`
	User      User           `json:"user" gorm:"foreignKey:UserID"`
	Title     string         `json:"title" gorm:"size:255"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
	Messages  []Message      `json:"messages" gorm:"foreignKey:ChatID"`
}

// Message represents a single message in a chat
type Message struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	ChatID    uint           `json:"chat_id" gorm:"not null;index"`
	Chat      Chat           `json:"-" gorm:"foreignKey:ChatID"`
	Role      string         `json:"role" gorm:"size:20;not null"` // "user" or "assistant"
	Content   string         `json:"content" gorm:"type:text;not null"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// ChatRequest represents the request payload for chat
type ChatRequest struct {
	Message string `json:"message" binding:"required"`
	ChatID  *uint  `json:"chat_id,omitempty"`
}

// ChatResponse represents the response from chat
type ChatResponse struct {
	ChatID   uint      `json:"chat_id"`
	Message  string    `json:"message"`
	Response string    `json:"response"`
	Messages []Message `json:"messages"`
}

// TableName specifies the table name for Chat
func (Chat) TableName() string {
	return "chats"
}

// TableName specifies the table name for Message
func (Message) TableName() string {
	return "messages"
}
