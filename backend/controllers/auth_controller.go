package controllers

import (
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"strings"

	"asl-market-backend/models"
	"asl-market-backend/services"
	"asl-market-backend/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type AuthController struct {
	DB *gorm.DB
}

func NewAuthController(db *gorm.DB) *AuthController {
	return &AuthController{DB: db}
}

func (ac *AuthController) Register(c *gin.Context) {
	var req models.RegisterRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	// Check if user already exists by phone
	var existingUser models.User
	if err := ac.DB.Where("phone = ?", req.Phone).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{
			"error": "کاربری با این شماره موبایل قبلاً ثبت‌نام کرده است",
		})
		return
	}

	// Check if user already exists by email (if email is provided)
	if req.Email != "" {
		if err := ac.DB.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
			c.JSON(http.StatusConflict, gin.H{
				"error": "کاربری با این ایمیل قبلاً ثبت‌نام کرده است",
			})
			return
		}
	}

	// Hash password
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "خطا در رمزگذاری رمز عبور",
		})
		return
	}

	// Create user
	user := models.User{
		FirstName: req.FirstName,
		LastName:  req.LastName,
		Email:     req.Email,
		Password:  hashedPassword,
		Phone:     req.Phone,
		IsActive:  true,
	}

	if err := ac.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "خطا در ایجاد کاربر",
		})
		return
	}

	// Generate token (use phone as identifier since email might be empty)
	identifier := user.Phone
	if user.Email != "" {
		identifier = user.Email
	}

	token, err := utils.GenerateToken(user.ID, identifier)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "خطا در تولید توکن",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "ثبت‌نام با موفقیت انجام شد",
		"data": models.AuthResponse{
			Token: token,
			User:  user.ToResponse(),
		},
	})
}

func (ac *AuthController) Login(c *gin.Context) {
	var req models.LoginRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	// Validate that at least one of phone or email is provided
	if req.Phone == "" && req.Email == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "لطفاً شماره موبایل یا ایمیل را وارد کنید",
		})
		return
	}

	// Find user - try phone first, then email
	var user models.User
	var err error

	if req.Phone != "" {
		// Try to find user by phone first
		err = ac.DB.Where("phone = ?", req.Phone).First(&user).Error
		if err == nil {
			// User found by phone
		} else if req.Email != "" {
			// If phone not found and email provided, try email
			err = ac.DB.Where("email = ?", req.Email).First(&user).Error
		}
	} else if req.Email != "" {
		// Only email provided, try to find by email
		err = ac.DB.Where("email = ?", req.Email).First(&user).Error
	}

	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "شماره موبایل/ایمیل یا رمز عبور اشتباه است",
		})
		return
	}

	// Check password
	if !utils.CheckPassword(req.Password, user.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "شماره موبایل/ایمیل یا رمز عبور اشتباه است",
		})
		return
	}

	// Check if user is active
	if !user.IsActive {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "حساب کاربری غیرفعال شده است",
		})
		return
	}

	// Generate token (use phone as identifier since email might be empty)
	identifier := user.Phone
	if user.Email != "" {
		identifier = user.Email
	}

	token, err := utils.GenerateToken(user.ID, identifier)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "خطا در تولید توکن",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "ورود موفقیت‌آمیز",
		"data": models.AuthResponse{
			Token: token,
			User:  user.ToResponse(),
		},
	})
}

// AdminLogin handles login for web panel admins using username
// ONLY searches in WebAdmin table, not User table
func (ac *AuthController) AdminLogin(c *gin.Context) {
	var req struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required,min=6"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	log.Printf("AdminLogin: Attempting login for username: %s", req.Username)

	// Special case: alireza user (backward compatibility)
	// Check if this is alireza trying to login
	usernameLower := strings.ToLower(strings.TrimSpace(req.Username))
	isAlireza := usernameLower == "alireza"

	// Try to find web admin by username (case-insensitive)
	// Also try to match by email if username doesn't match
	var webAdmin models.WebAdmin
	err := ac.DB.Where("(username = ? OR LOWER(username) = LOWER(?)) AND is_active = ? AND deleted_at IS NULL",
		req.Username, req.Username, true).First(&webAdmin).Error

	// If not found by username, try email
	if err != nil {
		log.Printf("AdminLogin: WebAdmin not found by username '%s', trying email", req.Username)
		err = ac.DB.Where("(email = ? OR LOWER(email) = LOWER(?)) AND is_active = ? AND deleted_at IS NULL",
			req.Username, req.Username, true).First(&webAdmin).Error
	}

	// If not found in WebAdmin and this is alireza, try User table
	if err != nil && isAlireza {
		log.Printf("AdminLogin: WebAdmin not found for alireza, trying User table")
		var user models.User
		userErr := ac.DB.Where("(email = ? OR LOWER(email) = LOWER(?)) AND is_admin = ? AND is_active = ?",
			req.Username, req.Username, true, true).First(&user).Error

		if userErr == nil {
			// Found alireza in User table
			if !utils.CheckPassword(req.Password, user.Password) {
				log.Printf("AdminLogin: Password check failed for alireza")
				c.JSON(http.StatusUnauthorized, gin.H{
					"error": "نام کاربری یا رمز عبور اشتباه است",
				})
				return
			}

			log.Printf("AdminLogin: alireza found in User table, password verified")

			// Generate token
			identifier := user.Phone
			if user.Email != "" {
				identifier = user.Email
			}

			token, err := utils.GenerateToken(user.ID, identifier)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"error": "خطا در تولید توکن",
				})
				return
			}

			c.JSON(http.StatusOK, gin.H{
				"message": "ورود موفقیت‌آمیز",
				"token":   token,
				"user": gin.H{
					"id":          user.ID,
					"name":        fmt.Sprintf("%s %s", user.FirstName, user.LastName),
					"email":       user.Email,
					"username":    user.Email,
					"role":        "super_admin",
					"permissions": []string{"all"},
					"is_admin":    true,
					"first_name":  user.FirstName,
					"last_name":   user.LastName,
				},
			})
			return
		}
	}

	if err != nil {
		log.Printf("AdminLogin: WebAdmin not found for username/email: %s, error: %v", req.Username, err)
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "نام کاربری یا رمز عبور اشتباه است",
		})
		return
	}

	log.Printf("AdminLogin: WebAdmin found: ID=%d, Username=%s, Email=%s, IsActive=%v",
		webAdmin.ID, webAdmin.Username, webAdmin.Email, webAdmin.IsActive)

	// Check password
	if !utils.CheckPassword(req.Password, webAdmin.Password) {
		log.Printf("AdminLogin: Password check failed for username: %s", req.Username)
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "نام کاربری یا رمز عبور اشتباه است",
		})
		return
	}

	log.Printf("AdminLogin: Password check passed for username: %s", req.Username)

	if !webAdmin.IsActive {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "حساب کاربری غیرفعال شده است",
		})
		return
	}

	// Update last login
	if err := webAdmin.UpdateLastLogin(ac.DB); err != nil {
		log.Printf("AdminLogin: Error updating last login: %v", err)
	}

	// Parse permissions
	permissions := []string{}
	if webAdmin.Permissions != "" {
		if webAdmin.Permissions[0] == '[' {
			_ = json.Unmarshal([]byte(webAdmin.Permissions), &permissions)
		} else {
			parts := strings.Split(webAdmin.Permissions, ",")
			for _, part := range parts {
				permissions = append(permissions, strings.TrimSpace(part))
			}
		}
	}

	// Generate token
	token, err := utils.GenerateToken(webAdmin.ID, webAdmin.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "خطا در تولید توکن",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "ورود موفقیت‌آمیز",
		"token":   token,
		"user": gin.H{
			"id":          webAdmin.ID,
			"name":        webAdmin.Name,
			"email":       webAdmin.Email,
			"username":    webAdmin.Username,
			"role":        webAdmin.Role,
			"permissions": permissions,
			"is_admin":    true,
			"first_name":  webAdmin.Name,
			"last_name":   "",
		},
	})
}

func (ac *AuthController) Me(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	var user models.User
	if err := ac.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "User not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": user.ToResponse(),
	})
}

// RequestPasswordRecovery sends a recovery code via SMS
func (ac *AuthController) RequestPasswordRecovery(c *gin.Context) {
	var req models.PasswordRecoveryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	var user models.User
	if err := ac.DB.Where("phone = ?", req.Phone).First(&user).Error; err != nil {
		c.JSON(http.StatusOK, models.PasswordRecoveryResponse{
			Message: "اگر شماره موبایل در سیستم ثبت شده باشد، کد بازیابی ارسال خواهد شد",
			Success: true,
		})
		return
	}

	// Check if user has a phone number
	if user.Phone == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "این کاربر شماره موبایل ثبت شده‌ای ندارد. لطفاً با پشتیبانی تماس بگیرید",
		})
		return
	}

	recoveryCode := fmt.Sprintf("%06d", rand.Intn(1000000))
	smsService := services.GetSMSService()
	if smsService != nil {
		phoneNumber := services.ValidateIranianPhoneNumber(req.Phone)
		if phoneNumber != "" {
			err := smsService.SendPasswordRecoverySMS(phoneNumber, recoveryCode)
			if err != nil {
				fmt.Printf("Failed to send password recovery SMS: %v\n", err)
			}
		}
	}

	c.JSON(http.StatusOK, models.PasswordRecoveryResponse{
		Message: "اگر شماره موبایل در سیستم ثبت شده باشد، کد بازیابی ارسال خواهد شد",
		Success: true,
	})
}

// ResetPassword resets password using recovery code
func (ac *AuthController) ResetPassword(c *gin.Context) {
	var req models.PasswordResetRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	// Find user by phone number
	var user models.User
	if err := ac.DB.Where("phone = ?", req.Phone).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "کاربری با این شماره موبایل یافت نشد",
		})
		return
	}

	// TODO: Verify the recovery code (you should implement proper code verification)
	// For now, we'll accept any code for demonstration

	// Hash the new password
	hashedPassword, err := utils.HashPassword(req.NewPassword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "خطا در رمزگذاری رمز عبور جدید",
		})
		return
	}

	// Update user's password
	if err := ac.DB.Model(&user).Update("password", hashedPassword).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "خطا در بروزرسانی رمز عبور",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "رمز عبور با موفقیت تغییر یافت",
		"success": true,
	})
}

// UpdateProfile allows user to update their profile information
func (ac *AuthController) UpdateProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "لطفا ابتدا وارد شوید"})
		return
	}

	userIDUint := userID.(uint)

	var req struct {
		FirstName string `json:"first_name" binding:"required,min=2,max=100"`
		LastName  string `json:"last_name" binding:"required,min=2,max=100"`
		Email     string `json:"email" binding:"omitempty,email"`
		Phone     string `json:"phone" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "اطلاعات ارسالی نامعتبر است",
			"details": err.Error(),
		})
		return
	}

	// Check if phone number is already taken by another user
	var existingUser models.User
	if err := ac.DB.Where("phone = ? AND id != ?", req.Phone, userIDUint).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{
			"error": "شماره موبایل قبلاً توسط کاربر دیگری استفاده شده است",
		})
		return
	}

	// Check if email is already taken by another user (if email is provided)
	if req.Email != "" {
		if err := ac.DB.Where("email = ? AND id != ?", req.Email, userIDUint).First(&existingUser).Error; err == nil {
			c.JSON(http.StatusConflict, gin.H{
				"error": "ایمیل قبلاً توسط کاربر دیگری استفاده شده است",
			})
			return
		}
	}

	// Update user information
	updates := map[string]interface{}{
		"first_name": req.FirstName,
		"last_name":  req.LastName,
		"phone":      req.Phone,
	}

	// Only update email if provided
	if req.Email != "" {
		updates["email"] = req.Email
	}

	err := ac.DB.Model(&models.User{}).Where("id = ?", userIDUint).Updates(updates).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "خطا در به‌روزرسانی پروفایل",
		})
		return
	}

	// Get updated user
	var updatedUser models.User
	if err := ac.DB.First(&updatedUser, userIDUint).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "خطا در دریافت اطلاعات به‌روزرسانی شده",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "پروفایل با موفقیت به‌روزرسانی شد",
		"user": models.UserResponse{
			ID:        updatedUser.ID,
			FirstName: updatedUser.FirstName,
			LastName:  updatedUser.LastName,
			Email:     updatedUser.Email,
			Phone:     updatedUser.Phone,
			IsActive:  updatedUser.IsActive,
			CreatedAt: updatedUser.CreatedAt,
		},
	})
}
