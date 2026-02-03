package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	FirstName   string         `json:"first_name" gorm:"size:100;not null"`
	LastName    string         `json:"last_name" gorm:"size:100;not null"`
	Email       string         `json:"email" gorm:"size:255"`
	Password    string         `json:"-" gorm:"size:255;not null"`
	Phone       string         `json:"phone" gorm:"size:255;not null"`
	IsActive    bool           `json:"is_active" gorm:"default:true"`
	IsAdmin     bool           `json:"is_admin" gorm:"default:false"`
	AffiliateID *uint          `json:"affiliate_id" gorm:"index"` // who referred this user (?ref=)
	Affiliate   *Affiliate     `json:"affiliate,omitempty" gorm:"foreignKey:AffiliateID"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

// Helper methods for User
func (u *User) Name() string {
	return u.FirstName + " " + u.LastName
}

func (u *User) Mobile() string {
	return u.Phone
}

// GetUserByID retrieves a user by ID
func GetUserByID(db *gorm.DB, userID uint) (*User, error) {
	var user User
	if err := db.First(&user, userID).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

type LoginRequest struct {
	Phone    string `json:"phone" binding:"omitempty"` // At least one of phone or email must be provided
	Email    string `json:"email" binding:"omitempty"` // At least one of phone or email must be provided
	Password string `json:"password" binding:"required,min=6"`
}

type RegisterRequest struct {
	FirstName    string `json:"first_name" binding:"required,min=2,max=100"`
	LastName     string `json:"last_name" binding:"required,min=2,max=100"`
	Email        string `json:"email" binding:"omitempty,email"`
	Password     string `json:"password" binding:"required,min=6"`
	Phone        string `json:"phone" binding:"required"`
	ReferralCode string `json:"referral_code" binding:"omitempty"` // optional ?ref= from affiliate link
}

type UserResponse struct {
	ID        uint      `json:"id"`
	FirstName string    `json:"first_name"`
	LastName  string    `json:"last_name"`
	Email     string    `json:"email"`
	Phone     string    `json:"phone"`
	IsActive  bool      `json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
}

type AuthResponse struct {
	Token string       `json:"token"`
	User  UserResponse `json:"user"`
}

type PasswordRecoveryRequest struct {
	Phone string `json:"phone" binding:"required"`
}

type PasswordResetRequest struct {
	Phone       string `json:"phone" binding:"required"`
	Code        string `json:"code" binding:"required"`
	NewPassword string `json:"new_password" binding:"required,min=6"`
}

type PasswordRecoveryResponse struct {
	Message string `json:"message"`
	Success bool   `json:"success"`
}

func (u *User) ToResponse() UserResponse {
	return UserResponse{
		ID:        u.ID,
		FirstName: u.FirstName,
		LastName:  u.LastName,
		Email:     u.Email,
		Phone:     u.Phone,
		IsActive:  u.IsActive,
		CreatedAt: u.CreatedAt,
	}
}
