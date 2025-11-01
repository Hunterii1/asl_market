package models

import (
	"time"

	"gorm.io/gorm"
)

// Visitor represents a visitor in the system
type Visitor struct {
	ID     uint `json:"id" gorm:"primaryKey"`
	UserID uint `json:"user_id" gorm:"not null;index"`
	User   User `json:"user" gorm:"foreignKey:UserID"`

	// Personal Identification Information
	FullName       string `json:"full_name" gorm:"size:255;not null"`
	NationalID     string `json:"national_id" gorm:"size:20;not null"`
	PassportNumber string `json:"passport_number" gorm:"size:20"`
	BirthDate      string `json:"birth_date" gorm:"size:20;not null"`
	Mobile         string `json:"mobile" gorm:"size:20;not null"`
	WhatsappNumber string `json:"whatsapp_number" gorm:"size:20"`
	Email          string `json:"email" gorm:"size:255"`

	// Residence and Travel Information
	ResidenceAddress    string `json:"residence_address" gorm:"type:text;not null"`
	CityProvince        string `json:"city_province" gorm:"size:255;not null"`
	DestinationCities   string `json:"destination_cities" gorm:"type:text;not null"`
	HasLocalContact     bool   `json:"has_local_contact" gorm:"default:false"`
	LocalContactDetails string `json:"local_contact_details" gorm:"type:text"`

	// Banking and Payment Information
	BankAccountIBAN   string `json:"bank_account_iban" gorm:"size:50;not null"`
	BankName          string `json:"bank_name" gorm:"size:255;not null"`
	AccountHolderName string `json:"account_holder_name" gorm:"size:255"`

	// Work Experience and Skills
	HasMarketingExperience  bool   `json:"has_marketing_experience" gorm:"default:false"`
	MarketingExperienceDesc string `json:"marketing_experience_desc" gorm:"type:text"`
	LanguageLevel           string `json:"language_level" gorm:"size:50;not null"` // excellent, good, weak, none
	SpecialSkills           string `json:"special_skills" gorm:"type:text"`

	// Commitments and Agreements
	AgreesToUseApprovedProducts   bool   `json:"agrees_to_use_approved_products" gorm:"default:false"`
	AgreesToViolationConsequences bool   `json:"agrees_to_violation_consequences" gorm:"default:false"`
	AgreesToSubmitReports         bool   `json:"agrees_to_submit_reports" gorm:"default:false"`
	DigitalSignature              string `json:"digital_signature" gorm:"size:255"`
	SignatureDate                 string `json:"signature_date" gorm:"size:20"`

	// Document Attachments
	IDDocumentPath     string `json:"id_document_path" gorm:"size:500"`
	PersonalPhotoPath  string `json:"personal_photo_path" gorm:"size:500"`
	RecommendationPath string `json:"recommendation_path" gorm:"size:500"`

	// Status
	Status     string     `json:"status" gorm:"size:20;default:'pending'"` // pending, approved, rejected
	AdminNotes string     `json:"admin_notes" gorm:"type:text"`
	ApprovedAt *time.Time `json:"approved_at"`
	ApprovedBy *uint      `json:"approved_by"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// VisitorRequest DTOs for API
type VisitorRegistrationRequest struct {
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

type VisitorResponse struct {
	ID                            uint       `json:"id"`
	UserID                        uint       `json:"user_id"`
	FullName                      string     `json:"full_name"`
	NationalID                    string     `json:"national_id"`
	PassportNumber                string     `json:"passport_number"`
	BirthDate                     string     `json:"birth_date"`
	Mobile                        string     `json:"mobile"`
	WhatsappNumber                string     `json:"whatsapp_number"`
	Email                         string     `json:"email"`
	ResidenceAddress              string     `json:"residence_address"`
	CityProvince                  string     `json:"city_province"`
	DestinationCities             string     `json:"destination_cities"`
	HasLocalContact               bool       `json:"has_local_contact"`
	LocalContactDetails           string     `json:"local_contact_details"`
	BankAccountIBAN               string     `json:"bank_account_iban"`
	BankName                      string     `json:"bank_name"`
	AccountHolderName             string     `json:"account_holder_name"`
	HasMarketingExperience        bool       `json:"has_marketing_experience"`
	MarketingExperienceDesc       string     `json:"marketing_experience_desc"`
	LanguageLevel                 string     `json:"language_level"`
	SpecialSkills                 string     `json:"special_skills"`
	AgreesToUseApprovedProducts   bool       `json:"agrees_to_use_approved_products"`
	AgreesToViolationConsequences bool       `json:"agrees_to_violation_consequences"`
	AgreesToSubmitReports         bool       `json:"agrees_to_submit_reports"`
	DigitalSignature              string     `json:"digital_signature"`
	SignatureDate                 string     `json:"signature_date"`
	Status                        string     `json:"status"`
	AdminNotes                    string     `json:"admin_notes"`
	ApprovedAt                    *time.Time `json:"approved_at"`
	CreatedAt                     time.Time  `json:"created_at"`
}

// Helper functions for visitor management
func CreateVisitor(db *gorm.DB, userID uint, req VisitorRegistrationRequest) (*Visitor, error) {
	visitor := Visitor{
		UserID:                        userID,
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
	if err := db.Create(&visitor).Error; err != nil {
		return nil, err
	}

	return &visitor, nil
}

func GetVisitorByUserID(db *gorm.DB, userID uint) (*Visitor, error) {
	var visitor Visitor
	err := db.Preload("User").Where("user_id = ?", userID).First(&visitor).Error
	return &visitor, err
}

func GetApprovedVisitors(db *gorm.DB) ([]Visitor, error) {
	var visitors []Visitor
	err := db.Preload("User").Where("status = ?", "approved").Find(&visitors).Error
	return visitors, err
}

func GetVisitorsForAdmin(db *gorm.DB, status string, page, perPage int) ([]Visitor, int64, error) {
	var visitors []Visitor
	var total int64

	query := db.Model(&Visitor{}).Preload("User")

	if status != "all" && status != "" {
		query = query.Where("status = ?", status)
	}

	// Get total count
	query.Count(&total)

	// Get paginated results
	offset := (page - 1) * perPage
	err := query.Offset(offset).Limit(perPage).Order("created_at DESC").Find(&visitors).Error

	return visitors, total, err
}

func ApproveVisitor(db *gorm.DB, visitorID uint, adminID uint, notes string) error {
	now := time.Now()
	return db.Model(&Visitor{}).Where("id = ?", visitorID).Updates(map[string]interface{}{
		"status":      "approved",
		"admin_notes": notes,
		"approved_at": &now,
		"approved_by": adminID,
	}).Error
}

func RejectVisitor(db *gorm.DB, visitorID uint, adminID uint, notes string) error {
	return db.Model(&Visitor{}).Where("id = ?", visitorID).Updates(map[string]interface{}{
		"status":      "rejected",
		"admin_notes": notes,
		"approved_by": adminID,
	}).Error
}

// DeleteVisitorByUserID deletes a visitor that belongs to a specific user
// This function ensures only the owner can delete their own visitor registration
func DeleteVisitorByUserID(db *gorm.DB, userID uint) error {
	// First check if visitor exists and belongs to this user
	var visitor Visitor
	if err := db.Where("user_id = ?", userID).First(&visitor).Error; err != nil {
		return err
	}

	// Delete the visitor (soft delete with GORM)
	return db.Delete(&visitor).Error
}
