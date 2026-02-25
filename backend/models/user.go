package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID          uint       `json:"id" gorm:"primaryKey"`
	FirstName   string     `json:"first_name" gorm:"size:100;not null"`
	LastName    string     `json:"last_name" gorm:"size:100;not null"`
	Email       string     `json:"email" gorm:"size:255"`
	Password    string     `json:"-" gorm:"size:255;not null"`
	Phone       string     `json:"phone" gorm:"size:255;not null"`
	IsActive    bool       `json:"is_active" gorm:"default:true"`
	IsAdmin     bool       `json:"is_admin" gorm:"default:false"`
	AffiliateID *uint      `json:"affiliate_id" gorm:"index"` // who referred this user (?ref=)
	Affiliate   *Affiliate `json:"affiliate,omitempty" gorm:"foreignKey:AffiliateID"`

	// Profile fields
	ProfileImageURL  string `json:"profile_image_url" gorm:"size:500"`
	CoverImageURL    string `json:"cover_image_url" gorm:"size:500"`
	Bio              string `json:"bio" gorm:"type:text"`
	Location         string `json:"location" gorm:"size:255"`
	Website          string `json:"website" gorm:"size:500"`
	SocialMediaLinks string `json:"social_media_links" gorm:"type:text"` // JSON: {instagram, telegram, linkedin, etc}

	// Popup tracking fields
	HasSeenLicensePopup       bool       `json:"has_seen_license_popup" gorm:"default:false"`
	LicensePopupShownAt       *time.Time `json:"license_popup_shown_at"`
	HasSeenPostLoginPopup     bool       `json:"has_seen_post_login_popup" gorm:"default:false"`
	PostLoginPopupShownAt     *time.Time `json:"post_login_popup_shown_at"`
	HasSeenBrowsingPopup      bool       `json:"has_seen_browsing_popup" gorm:"default:false"`
	BrowsingPopupShownAt      *time.Time `json:"browsing_popup_shown_at"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
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
	ID               uint      `json:"id"`
	FirstName        string    `json:"first_name"`
	LastName         string    `json:"last_name"`
	Email            string    `json:"email"`
	Phone            string    `json:"phone"`
	IsActive         bool      `json:"is_active"`
	ProfileImageURL  string    `json:"profile_image_url"`
	CoverImageURL    string    `json:"cover_image_url"`
	Bio              string    `json:"bio"`
	Location         string    `json:"location"`
	Website          string    `json:"website"`
	SocialMediaLinks string    `json:"social_media_links"`
	CreatedAt        time.Time `json:"created_at"`
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
		ID:               u.ID,
		FirstName:        u.FirstName,
		LastName:         u.LastName,
		Email:            u.Email,
		Phone:            u.Phone,
		IsActive:         u.IsActive,
		ProfileImageURL:  u.ProfileImageURL,
		CoverImageURL:    u.CoverImageURL,
		Bio:              u.Bio,
		Location:         u.Location,
		Website:          u.Website,
		SocialMediaLinks: u.SocialMediaLinks,
		CreatedAt:        u.CreatedAt,
	}
}

// UpdateProfileRequest represents profile update request
type UpdateProfileRequest struct {
	FirstName        string `json:"first_name"`
	LastName         string `json:"last_name"`
	Email            string `json:"email"`
	Bio              string `json:"bio"`
	Location         string `json:"location"`
	Website          string `json:"website"`
	SocialMediaLinks string `json:"social_media_links"`
}

// UpdateProfileImages updates profile and cover images
func UpdateProfileImages(db *gorm.DB, userID uint, profileImageURL, coverImageURL string) error {
	updates := make(map[string]interface{})
	if profileImageURL != "" {
		updates["profile_image_url"] = profileImageURL
	}
	if coverImageURL != "" {
		updates["cover_image_url"] = coverImageURL
	}
	return db.Model(&User{}).Where("id = ?", userID).Updates(updates).Error
}
