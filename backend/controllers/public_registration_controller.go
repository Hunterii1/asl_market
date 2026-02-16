package controllers

import (
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"asl-market-backend/config"
	"asl-market-backend/models"
	"asl-market-backend/services"
	"asl-market-backend/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type PublicRegistrationController struct {
	db *gorm.DB
}

func NewPublicRegistrationController(db *gorm.DB) *PublicRegistrationController {
	return &PublicRegistrationController{db: db}
}

// PublicSupplierRegistrationRequest represents the request for public supplier registration
type PublicSupplierRegistrationRequest struct {
	// Personal & Contact Information
	FullName                string `json:"full_name" binding:"required"`
	Mobile                  string `json:"mobile" binding:"required"`
	BrandName               string `json:"brand_name"`
	ImageURL                string `json:"image_url"`
	City                    string `json:"city" binding:"required"`
	Address                 string `json:"address" binding:"required"`
	HasRegisteredBusiness   bool   `json:"has_registered_business"`
	BusinessRegistrationNum string `json:"business_registration_num"`

	// Export Experience
	HasExportExperience bool   `json:"has_export_experience"`
	ExportPrice         string `json:"export_price"`

	// Pricing
	WholesaleMinPrice        string `json:"wholesale_min_price" binding:"required"`
	WholesaleHighVolumePrice string `json:"wholesale_high_volume_price"`
	CanProducePrivateLabel   bool   `json:"can_produce_private_label"`

	// Products
	Products []PublicSupplierProductRequest `json:"products" binding:"required,min=1"`
}

type PublicSupplierProductRequest struct {
	ProductName          string `json:"product_name" binding:"required"`
	ProductType          string `json:"product_type" binding:"required"`
	Description          string `json:"description" binding:"required"`
	NeedsExportLicense   bool   `json:"needs_export_license"`
	RequiredLicenseType  string `json:"required_license_type"`
	MonthlyProductionMin string `json:"monthly_production_min" binding:"required"`
}

// PublicVisitorRegistrationRequest represents the request for public visitor registration
type PublicVisitorRegistrationRequest struct {
	// Personal Identification Information
	FullName       string `json:"full_name" binding:"required"`
	NationalID     string `json:"national_id" binding:"required"`
	PassportNumber string `json:"passport_number"`
	BirthDate      string `json:"birth_date" binding:"required"`
	Mobile         string `json:"mobile" binding:"required"`
	WhatsappNumber string `json:"whatsapp_number"`
	Email          string `json:"email" binding:"omitempty,email"`

	// Residence and Travel Information
	ResidenceAddress    string `json:"residence_address" binding:"required"`
	CityProvince        string `json:"city_province" binding:"required"`
	DestinationCities   string `json:"destination_cities" binding:"required"`
	HasLocalContact     bool   `json:"has_local_contact"`
	LocalContactDetails string `json:"local_contact_details"`

	// Banking and Payment Information
	BankAccountIBAN   string `json:"bank_account_iban" binding:"required"`
	BankName          string `json:"bank_name" binding:"required"`
	AccountHolderName string `json:"account_holder_name"`

	// Work Experience and Skills
	HasMarketingExperience  bool   `json:"has_marketing_experience"`
	MarketingExperienceDesc string `json:"marketing_experience_desc"`
	LanguageLevel           string `json:"language_level" binding:"required"`
	SpecialSkills           string `json:"special_skills"`

	// Interested Products
	InterestedProducts string `json:"interested_products"`

	// Commitments and Agreements
	AgreesToUseApprovedProducts   bool   `json:"agrees_to_use_approved_products" binding:"required"`
	AgreesToViolationConsequences bool   `json:"agrees_to_violation_consequences" binding:"required"`
	AgreesToSubmitReports         bool   `json:"agrees_to_submit_reports" binding:"required"`
	DigitalSignature              string `json:"digital_signature" binding:"required"`
	SignatureDate                 string `json:"signature_date" binding:"required"`
}

// RegisterPublicSupplier handles public supplier registration
func (c *PublicRegistrationController) RegisterPublicSupplier(ctx *gin.Context) {
	var req PublicSupplierRegistrationRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	// Create a temporary user for the supplier
	tempUser := models.User{
		FirstName: "Temp",
		LastName:  "User",
		Email:     req.Mobile + "@temp.asllmarket.com", // Temporary email
		Password:  "temp_password",                     // Temporary password
		Phone:     req.Mobile,
		IsActive:  false, // Will be activated after admin approval
		IsAdmin:   false,
	}

	// Create user first
	if err := c.db.Create(&tempUser).Error; err != nil {
		log.Printf("Error creating temp user: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create user",
		})
		return
	}

	// Create supplier
	supplier := models.Supplier{
		UserID:                   tempUser.ID,
		FullName:                 req.FullName,
		Mobile:                   req.Mobile,
		BrandName:                req.BrandName,
		ImageURL:                 req.ImageURL,
		City:                     req.City,
		Address:                  req.Address,
		HasRegisteredBusiness:    req.HasRegisteredBusiness,
		BusinessRegistrationNum:  req.BusinessRegistrationNum,
		HasExportExperience:      req.HasExportExperience,
		ExportPrice:              req.ExportPrice,
		WholesaleMinPrice:        req.WholesaleMinPrice,
		WholesaleHighVolumePrice: req.WholesaleHighVolumePrice,
		CanProducePrivateLabel:   req.CanProducePrivateLabel,
		Status:                   "pending",
	}

	// Start transaction
	tx := c.db.Begin()
	if tx.Error != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to start transaction",
		})
		return
	}

	// Create supplier
	if err := tx.Create(&supplier).Error; err != nil {
		tx.Rollback()
		log.Printf("Error creating supplier: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create supplier",
		})
		return
	}

	// Create products
	for _, productReq := range req.Products {
		product := models.SupplierProduct{
			SupplierID:           supplier.ID,
			ProductName:          productReq.ProductName,
			ProductType:          productReq.ProductType,
			Description:          productReq.Description,
			NeedsExportLicense:   productReq.NeedsExportLicense,
			RequiredLicenseType:  productReq.RequiredLicenseType,
			MonthlyProductionMin: productReq.MonthlyProductionMin,
		}

		if err := tx.Create(&product).Error; err != nil {
			tx.Rollback()
			log.Printf("Error creating product: %v", err)
			ctx.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to create product",
			})
			return
		}
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to commit transaction",
		})
		return
	}

	message := "🆕 درخواست ثبت‌نام تأمین‌کننده جدید\n\n"
	message += "📋 اطلاعات تأمین‌کننده:\n"
	message += "👤 نام: " + req.FullName + "\n"
	message += "📱 موبایل: " + req.Mobile + "\n"
	message += "🏢 برند: " + req.BrandName + "\n"
	message += "🏙️ شهر: " + req.City + "\n"
	message += "📦 تعداد محصولات: " + strconv.Itoa(len(req.Products)) + "\n"
	message += "🗓️ تاریخ ثبت‌نام: " + supplier.CreatedAt.Format("2006/01/02") + "\n"
	message += "⏳ وضعیت: pending | 👤 نوع کسب‌وکار\n\n"
	message += "🔘 عملیات: /view" + strconv.Itoa(int(supplier.ID)) + " | /approve" + strconv.Itoa(int(supplier.ID)) + " | /reject" + strconv.Itoa(int(supplier.ID)) + "\n"
	message += "➖➖➖➖➖➖➖➖"

	// Send Telegram notification to admin (only when Telegram is enabled and not in Iran)
	if !config.AppConfig.Environment.IsInIran {
		go func() {
			telegramService := services.GetTelegramService()
			if telegramService != nil {
				telegramService.NotifyAdminPlainMessage(message)
			}
		}()
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Supplier registration submitted successfully. Awaiting admin approval.",
		"status":  "pending",
	})
}

// RegisterPublicVisitor handles public visitor registration
func (c *PublicRegistrationController) RegisterPublicVisitor(ctx *gin.Context) {
	var req PublicVisitorRegistrationRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	// STRICT VALIDATION: Only Arabic countries allowed, NO Iranian locations
	// Flexible format: accepts any separator (space, comma, dash, etc.)
	if !validateArabicLocation(req.CityProvince, "شهر و کشور محل سکونت") {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "شهر و کشور محل سکونت باید از کشورهای عربی باشد. ویزیتورهای ایرانی پذیرفته نمی‌شوند."})
		return
	}

	// Validate destination cities
	// Split only by comma (Persian or English), not by space or dash
	// This allows "راس الخیمه امارات متحده عربی" to stay as one item
	trimmedInput := strings.TrimSpace(req.DestinationCities)
	if trimmedInput == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "لطفا حداقل یک شهر مقصد وارد کنید"})
		return
	}

	// Split only by comma (Persian or English comma), not by space or dash
	destinations := strings.FieldsFunc(trimmedInput, func(r rune) bool {
		return r == ',' || r == '،'
	})

	// If no comma found, treat the whole string as one destination
	if len(destinations) == 0 {
		destinations = []string{trimmedInput}
	}

	for _, dest := range destinations {
		dest = strings.TrimSpace(dest)
		if dest != "" {
			if !validateArabicLocation(dest, "شهرهای مقصد") {
				ctx.JSON(http.StatusBadRequest, gin.H{"error": "شهرهای مقصد باید از کشورهای عربی باشد. ویزیتورهای ایرانی پذیرفته نمی‌شوند."})
				return
			}
		}
	}

	// Create a temporary user for the visitor
	tempUser := models.User{
		FirstName: "Temp",
		LastName:  "User",
		Email:     req.Mobile + "@temp.asllmarket.com", // Temporary email
		Password:  "temp_password",                     // Temporary password
		Phone:     req.Mobile,
		IsActive:  false, // Will be activated after admin approval
		IsAdmin:   false,
	}

	// Create user first
	if err := c.db.Create(&tempUser).Error; err != nil {
		log.Printf("Error creating temp user: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create user",
		})
		return
	}

	// Create visitor
	visitor := models.Visitor{
		UserID:                        tempUser.ID,
		FullName:                      req.FullName,
		NationalID:                    req.NationalID,
		PassportNumber:                req.PassportNumber,
		BirthDate:                     req.BirthDate,
		Mobile:                        req.Mobile,
		WhatsappNumber:                req.WhatsappNumber,
		Email:                         req.Email,
		ResidenceAddress:              req.ResidenceAddress,
		CityProvince:                  req.CityProvince,
		DestinationCities:             req.DestinationCities,
		HasLocalContact:               req.HasLocalContact,
		LocalContactDetails:           req.LocalContactDetails,
		BankAccountIBAN:               req.BankAccountIBAN,
		BankName:                      req.BankName,
		AccountHolderName:             req.AccountHolderName,
		HasMarketingExperience:        req.HasMarketingExperience,
		MarketingExperienceDesc:       req.MarketingExperienceDesc,
		LanguageLevel:                 req.LanguageLevel,
		SpecialSkills:                 req.SpecialSkills,
		InterestedProducts:            req.InterestedProducts,
		AgreesToUseApprovedProducts:   req.AgreesToUseApprovedProducts,
		AgreesToViolationConsequences: req.AgreesToViolationConsequences,
		AgreesToSubmitReports:         req.AgreesToSubmitReports,
		DigitalSignature:              req.DigitalSignature,
		SignatureDate:                 req.SignatureDate,
		Status:                        "pending",
	}

	// Create visitor
	if err := c.db.Create(&visitor).Error; err != nil {
		log.Printf("Error creating visitor: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create visitor",
		})
		return
	}

	message := "🆕 درخواست ثبت‌نام ویزیتور جدید\n\n"
	message += "📋 اطلاعات ویزیتور:\n"
	message += "👤 نام: " + req.FullName + "\n"
	message += "📱 موبایل: " + req.Mobile + "\n"
	message += "🆔 کد ملی: " + req.NationalID + "\n"
	message += "🏙️ شهر: " + req.CityProvince + "\n"
	message += "✈️ شهرهای مقصد: " + req.DestinationCities + "\n"
	message += "🗣️ سطح زبان: " + req.LanguageLevel + "\n"
	message += "🗓️ تاریخ ثبت‌نام: " + visitor.CreatedAt.Format("2006/01/02") + "\n"
	message += "⏳ وضعیت: pending | 🌍 نماینده\n\n"
	message += "🔘 عملیات: /vview" + strconv.Itoa(int(visitor.ID)) + " | /vapprove" + strconv.Itoa(int(visitor.ID)) + " | /vreject" + strconv.Itoa(int(visitor.ID)) + "\n"
	message += "➖➖➖➖➖➖➖➖"

	// Send Telegram notification to admin (only when Telegram is enabled and not in Iran)
	if !config.AppConfig.Environment.IsInIran {
		go func() {
			telegramService := services.GetTelegramService()
			if telegramService != nil {
				telegramService.NotifyAdminPlainMessage(message)
			}
		}()
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Visitor registration submitted successfully. Awaiting admin approval.",
		"status":  "pending",
	})
}

// GetRegistrationStatus handles checking registration status
func (ctrl *PublicRegistrationController) GetRegistrationStatus(ctx *gin.Context) {
	mobile := ctx.Query("mobile")
	registrationType := ctx.Query("type")

	if mobile == "" || registrationType == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Mobile and type parameters are required"})
		return
	}

	if registrationType != "supplier" && registrationType != "visitor" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid type. Must be 'supplier' or 'visitor'"})
		return
	}

	// Find user by mobile
	var user models.User
	if err := ctrl.db.Where("phone = ?", mobile).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Registration not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	var registrationData interface{}

	if registrationType == "supplier" {
		var supplier models.Supplier
		if err := ctrl.db.Where("user_id = ?", user.ID).First(&supplier).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				ctx.JSON(http.StatusNotFound, gin.H{"error": "Supplier registration not found"})
				return
			}
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
			return
		}

		registrationData = gin.H{
			"id":         supplier.ID,
			"type":       "supplier",
			"full_name":  supplier.FullName,
			"mobile":     supplier.Mobile,
			"status":     supplier.Status,
			"created_at": supplier.CreatedAt,
			"updated_at": supplier.UpdatedAt,
			"brand_name": supplier.BrandName,
			"city":       supplier.City,
			"address":    supplier.Address,
		}
	} else {
		var visitor models.Visitor
		if err := ctrl.db.Where("user_id = ?", user.ID).First(&visitor).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				ctx.JSON(http.StatusNotFound, gin.H{"error": "Visitor registration not found"})
				return
			}
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
			return
		}

		registrationData = gin.H{
			"id":                 visitor.ID,
			"type":               "visitor",
			"full_name":          visitor.FullName,
			"mobile":             visitor.Mobile,
			"status":             visitor.Status,
			"created_at":         visitor.CreatedAt,
			"updated_at":         visitor.UpdatedAt,
			"national_id":        visitor.NationalID,
			"city_province":      visitor.CityProvince,
			"destination_cities": visitor.DestinationCities,
			"language_level":     visitor.LanguageLevel,
		}
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    registrationData,
	})
}

// AffiliateRegisterRequest represents the request for affiliate registration
type AffiliateRegisterRequest struct {
	FirstName  string `json:"first_name" binding:"required,min=2,max=100"`
	LastName   string `json:"last_name" binding:"required,min=2,max=100"`
	Email      string `json:"email" binding:"omitempty,email"`
	Phone      string `json:"phone" binding:"required"`
	Password   string `json:"password" binding:"required,min=6"`
	PromoterID uint   `json:"promoter_id" binding:"required"`
}

// RegisterAffiliate handles user registration through affiliate landing page
func (c *PublicRegistrationController) RegisterAffiliate(ctx *gin.Context) {
	var req AffiliateRegisterRequest

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	// Check if affiliate exists and is active
	var affiliate models.Affiliate
	if err := c.db.Where("id = ? AND is_active = ? AND deleted_at IS NULL", req.PromoterID, true).First(&affiliate).Error; err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error": "افیلیت یافت نشد یا غیرفعال است",
		})
		return
	}

	// Check if user already exists by phone
	var existingUser models.User
	if err := c.db.Where("phone = ?", req.Phone).First(&existingUser).Error; err == nil {
		ctx.JSON(http.StatusConflict, gin.H{
			"error": "کاربری با این شماره موبایل قبلاً ثبت‌نام کرده است",
		})
		return
	}

	// Check if user already exists by email (if email is provided)
	if req.Email != "" {
		if err := c.db.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
			ctx.JSON(http.StatusConflict, gin.H{
				"error": "کاربری با این ایمیل قبلاً ثبت‌نام کرده است",
			})
			return
		}
	}

	// Hash password
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": "خطا در رمزگذاری رمز عبور",
		})
		return
	}

	affiliateID := affiliate.ID

	// Create user with affiliate_id
	user := models.User{
		FirstName:   req.FirstName,
		LastName:     req.LastName,
		Email:       req.Email,
		Password:    hashedPassword,
		Phone:       req.Phone,
		IsActive:    true,
		AffiliateID: &affiliateID,
	}

	if err := c.db.Create(&user).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": "خطا در ایجاد کاربر",
		})
		return
	}

	// Register in affiliate_registered_users table
	now := time.Now()
	registeredUser := models.AffiliateRegisteredUser{
		AffiliateID: affiliateID,
		Name:        req.FirstName + " " + req.LastName,
		Phone:       req.Phone,
		RegisteredAt: &now,
	}

	if err := c.db.Create(&registeredUser).Error; err != nil {
		log.Printf("[AffiliateRegister] Error creating registered user: %v", err)
		// Don't fail the registration if this fails, just log it
	}

	log.Printf("[AffiliateRegister] User registered: ID=%d, Phone=%s, AffiliateID=%d", user.ID, user.Phone, affiliateID)

	ctx.JSON(http.StatusCreated, gin.H{
		"message": "ثبت‌نام با موفقیت انجام شد",
		"data": gin.H{
			"user_id":      user.ID,
			"affiliate_id": affiliateID,
		},
	})
}
