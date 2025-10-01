package controllers

import (
	"log"
	"net/http"
	"strconv"

	"asl-market-backend/models"
	"asl-market-backend/services"

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
	Email          string `json:"email"`

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
		Email:     req.Mobile + "@temp.aslmarket.com", // Temporary email
		Password:  "temp_password",                    // Temporary password
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

	// Send Telegram notification to admin
	telegramService := services.GetTelegramService()
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

	// Create a dummy support ticket to use the notification system
	dummyTicket := &models.SupportTicket{
		ID:          0,
		UserID:      tempUser.ID,
		Title:       "ثبت‌نام تأمین‌کننده جدید",
		Description: message,
		Status:      "open",
	}
	telegramService.NotifyNewSupportTicket(dummyTicket, &tempUser)

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

	// Create a temporary user for the visitor
	tempUser := models.User{
		FirstName: "Temp",
		LastName:  "User",
		Email:     req.Mobile + "@temp.aslmarket.com", // Temporary email
		Password:  "temp_password",                    // Temporary password
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

	// Send Telegram notification to admin
	telegramService := services.GetTelegramService()
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

	// Create a dummy support ticket to use the notification system
	dummyTicket := &models.SupportTicket{
		ID:          0,
		UserID:      tempUser.ID,
		Title:       "ثبت‌نام ویزیتور جدید",
		Description: message,
		Status:      "open",
	}
	telegramService.NotifyNewSupportTicket(dummyTicket, &tempUser)

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
