package models

import (
	"time"

	"gorm.io/gorm"
)

// SupportTicket represents a support ticket
type SupportTicket struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	UserID      uint           `json:"user_id" gorm:"not null;index"`
	User        User           `json:"user" gorm:"foreignKey:UserID"`
	Title       string         `json:"title" gorm:"size:255;not null;charset:utf8mb4;collation:utf8mb4_unicode_ci"`
	Description string         `json:"description" gorm:"type:text;not null;charset:utf8mb4;collation:utf8mb4_unicode_ci"`
	Priority    string         `json:"priority" gorm:"size:20;default:'medium'"`  // low, medium, high, urgent
	Status      string         `json:"status" gorm:"size:20;default:'open'"`      // open, in_progress, waiting_response, closed
	Category    string         `json:"category" gorm:"size:50;default:'general'"` // general, technical, billing, license, other
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`

	// Relations
	Messages []SupportTicketMessage `json:"messages" gorm:"foreignKey:TicketID"`
}

// SupportTicketMessage represents a message in a support ticket conversation
type SupportTicketMessage struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	TicketID  uint           `json:"ticket_id" gorm:"not null;index"`
	Ticket    SupportTicket  `json:"-" gorm:"foreignKey:TicketID"`
	SenderID  *uint          `json:"sender_id" gorm:"index"` // null for admin messages
	Sender    *User          `json:"sender,omitempty" gorm:"foreignKey:SenderID"`
	Message   string         `json:"message" gorm:"type:text;not null;charset:utf8mb4;collation:utf8mb4_unicode_ci"`
	IsAdmin   bool           `json:"is_admin" gorm:"default:false"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// CreateTicketRequest represents the request to create a new ticket
type CreateTicketRequest struct {
	Title       string `json:"title" binding:"required"`
	Description string `json:"description" binding:"required"`
	Priority    string `json:"priority" binding:"required,oneof=low medium high urgent"`
	Category    string `json:"category" binding:"required,oneof=general technical billing license other"`
}

// AddMessageRequest represents the request to add a message to a ticket
type AddMessageRequest struct {
	Message string `json:"message" binding:"required"`
}

// TicketResponse represents the response format for tickets
type TicketResponse struct {
	ID          uint                    `json:"id"`
	Title       string                  `json:"title"`
	Description string                  `json:"description"`
	Priority    string                  `json:"priority"`
	Status      string                  `json:"status"`
	Category    string                  `json:"category"`
	User        TicketUserResponse      `json:"user"`
	Messages    []TicketMessageResponse `json:"messages"`
	CreatedAt   time.Time               `json:"created_at"`
	UpdatedAt   time.Time               `json:"updated_at"`
}

// TicketUserResponse represents user info in ticket response
type TicketUserResponse struct {
	ID        uint   `json:"id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Email     string `json:"email"`
	Phone     string `json:"phone"`
}

// TicketMessageResponse represents message info in ticket response
type TicketMessageResponse struct {
	ID        uint                `json:"id"`
	Message   string              `json:"message"`
	IsAdmin   bool                `json:"is_admin"`
	Sender    *TicketUserResponse `json:"sender,omitempty"`
	CreatedAt time.Time           `json:"created_at"`
}

// TableName specifies the table name for SupportTicket
func (SupportTicket) TableName() string {
	return "support_tickets"
}

// TableName specifies the table name for SupportTicketMessage
func (SupportTicketMessage) TableName() string {
	return "support_ticket_messages"
}
