package models

import (
	"time"

	"gorm.io/gorm"
)

// Supplier represents a supplier in the system
type Supplier struct {
	ID     uint `json:"id" gorm:"primaryKey"`
	UserID uint `json:"user_id" gorm:"not null;index"`
	User   User `json:"user" gorm:"foreignKey:UserID"`

	// Personal & Contact Information
	FullName                string `json:"full_name" gorm:"size:255;not null"`
	Mobile                  string `json:"mobile" gorm:"size:20;not null"`
	BrandName               string `json:"brand_name" gorm:"size:255"`
	ImageURL                string `json:"image_url" gorm:"size:500"`
	City                    string `json:"city" gorm:"size:100;not null"`
	Address                 string `json:"address" gorm:"type:text;not null"`
	HasRegisteredBusiness   bool   `json:"has_registered_business" gorm:"default:false"`
	BusinessRegistrationNum string `json:"business_registration_num" gorm:"size:100"`
	BusinessDocumentPath    string `json:"business_document_path" gorm:"size:500"`

	// Export Experience
	HasExportExperience bool   `json:"has_export_experience" gorm:"default:false"`
	ExportPrice         string `json:"export_price" gorm:"type:text"`

	// Pricing
	WholesaleMinPrice        string `json:"wholesale_min_price" gorm:"type:text;not null"`
	WholesaleHighVolumePrice string `json:"wholesale_high_volume_price" gorm:"type:text"`
	CanProducePrivateLabel   bool   `json:"can_produce_private_label" gorm:"default:false"`

	// Status
	Status     string     `json:"status" gorm:"size:20;default:'pending'"` // pending, approved, rejected
	AdminNotes string     `json:"admin_notes" gorm:"type:text"`
	ApprovedAt *time.Time `json:"approved_at"`
	ApprovedBy *uint      `json:"approved_by"`

	// Featured status - for highlighting in listings
	IsFeatured bool       `json:"is_featured" gorm:"default:false"`
	FeaturedAt *time.Time `json:"featured_at"`
	FeaturedBy *uint      `json:"featured_by"`

	// Relations
	Products []SupplierProduct `json:"products" gorm:"foreignKey:SupplierID"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// SupplierProduct represents a product offered by a supplier
type SupplierProduct struct {
	ID         uint     `json:"id" gorm:"primaryKey"`
	SupplierID uint     `json:"supplier_id" gorm:"not null;index"`
	Supplier   Supplier `json:"supplier" gorm:"foreignKey:SupplierID"`

	ProductName          string `json:"product_name" gorm:"size:255;not null"`
	ProductType          string `json:"product_type" gorm:"size:50;not null"` // food, herbal, health, handicraft, industrial, home, other
	Description          string `json:"description" gorm:"type:text;not null"`
	NeedsExportLicense   bool   `json:"needs_export_license" gorm:"default:false"`
	RequiredLicenseType  string `json:"required_license_type" gorm:"size:255"`
	LicenseDocumentPath  string `json:"license_document_path" gorm:"size:500"`
	MonthlyProductionMin string `json:"monthly_production_min" gorm:"size:100;not null"`

	// Images and Documents
	ProductImages   string `json:"product_images" gorm:"type:text"`   // JSON array of image paths
	PackagingImages string `json:"packaging_images" gorm:"type:text"` // JSON array of image paths
	ProcessVideos   string `json:"process_videos" gorm:"type:text"`   // JSON array of video paths

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// SupplierRequest DTOs for API
type SupplierRegistrationRequest struct {
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
	Products []SupplierProductRequest `json:"products" binding:"required,min=1"`
}

type SupplierProductRequest struct {
	ProductName          string `json:"product_name" binding:"required"`
	ProductType          string `json:"product_type" binding:"required"`
	Description          string `json:"description" binding:"required"`
	NeedsExportLicense   bool   `json:"needs_export_license"`
	RequiredLicenseType  string `json:"required_license_type"`
	MonthlyProductionMin string `json:"monthly_production_min" binding:"required"`
}

type SupplierResponse struct {
	ID                       uint                      `json:"id"`
	UserID                   uint                      `json:"user_id"`
	FullName                 string                    `json:"full_name"`
	Mobile                   string                    `json:"mobile"`
	BrandName                string                    `json:"brand_name"`
	ImageURL                 string                    `json:"image_url"`
	City                     string                    `json:"city"`
	Address                  string                    `json:"address"`
	HasRegisteredBusiness    bool                      `json:"has_registered_business"`
	BusinessRegistrationNum  string                    `json:"business_registration_num"`
	HasExportExperience      bool                      `json:"has_export_experience"`
	ExportPrice              string                    `json:"export_price"`
	WholesaleMinPrice        string                    `json:"wholesale_min_price"`
	WholesaleHighVolumePrice string                    `json:"wholesale_high_volume_price"`
	CanProducePrivateLabel   bool                      `json:"can_produce_private_label"`
	Status                   string                    `json:"status"`
	AdminNotes               string                    `json:"admin_notes"`
	ApprovedAt               *time.Time                `json:"approved_at"`
	IsFeatured               bool                      `json:"is_featured"`
	FeaturedAt               *time.Time                `json:"featured_at"`
	AverageRating            float64                   `json:"average_rating"` // Average rating from matching requests (1-5)
	TotalRatings             int                       `json:"total_ratings"`  // Total number of ratings received
	CreatedAt                time.Time                 `json:"created_at"`
	Products                 []SupplierProductResponse `json:"products"`
}

type SupplierProductResponse struct {
	ID                   uint      `json:"id"`
	ProductName          string    `json:"product_name"`
	ProductType          string    `json:"product_type"`
	Description          string    `json:"description"`
	NeedsExportLicense   bool      `json:"needs_export_license"`
	RequiredLicenseType  string    `json:"required_license_type"`
	MonthlyProductionMin string    `json:"monthly_production_min"`
	ProductImages        []string  `json:"product_images"`
	PackagingImages      []string  `json:"packaging_images"`
	ProcessVideos        []string  `json:"process_videos"`
	CreatedAt            time.Time `json:"created_at"`
}

// Helper functions for supplier management
func CreateSupplier(db *gorm.DB, userID uint, req SupplierRegistrationRequest) (*Supplier, error) {
	supplier := Supplier{
		UserID:                   userID,
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
	tx := db.Begin()
	if tx.Error != nil {
		return nil, tx.Error
	}

	// Create supplier
	if err := tx.Create(&supplier).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	// Create products
	for _, productReq := range req.Products {
		product := SupplierProduct{
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
			return nil, err
		}
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return nil, err
	}

	return &supplier, nil
}

func GetSupplierByUserID(db *gorm.DB, userID uint) (*Supplier, error) {
	var supplier Supplier
	err := db.Preload("User").Preload("Products").Where("user_id = ?", userID).First(&supplier).Error
	return &supplier, err
}

func GetSupplierByID(db *gorm.DB, id uint) (*Supplier, error) {
	var supplier Supplier
	err := db.Preload("User").Preload("Products").Where("id = ?", id).First(&supplier).Error
	return &supplier, err
}

func GetApprovedSuppliers(db *gorm.DB) ([]Supplier, error) {
	var suppliers []Supplier
	err := db.Preload("User").Preload("Products").Where("status = ?", "approved").Order("is_featured DESC, created_at DESC").Find(&suppliers).Error
	return suppliers, err
}

// GetApprovedSuppliersPaginated returns paginated list of approved suppliers
func GetApprovedSuppliersPaginated(db *gorm.DB, page, perPage int) ([]Supplier, int64, error) {
	var suppliers []Supplier
	var total int64

	query := db.Model(&Supplier{}).Preload("User").Preload("Products").Where("status = ?", "approved")

	// Get total count
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	offset := (page - 1) * perPage
	err := query.Offset(offset).Limit(perPage).Order("is_featured DESC, created_at DESC").Find(&suppliers).Error
	return suppliers, total, err
}

func GetSuppliersForAdmin(db *gorm.DB, status string, page, perPage int) ([]Supplier, int64, error) {
	var suppliers []Supplier
	var total int64

	query := db.Model(&Supplier{}).Preload("User")

	if status == "featured" {
		query = query.Where("status = ? AND is_featured = ?", "approved", true)
	} else if status != "all" && status != "" {
		query = query.Where("status = ?", status)
	}

	// Get total count
	query.Count(&total)

	// Get paginated results with proper ordering
	offset := (page - 1) * perPage

	// Order by featured first, then by creation date
	if status == "all" || status == "approved" {
		err := query.Offset(offset).Limit(perPage).Order("is_featured DESC, created_at DESC").Find(&suppliers).Error
		return suppliers, total, err
	} else if status == "featured" {
		err := query.Offset(offset).Limit(perPage).Order("featured_at DESC").Find(&suppliers).Error
		return suppliers, total, err
	} else {
		err := query.Offset(offset).Limit(perPage).Order("created_at DESC").Find(&suppliers).Error
		return suppliers, total, err
	}
}

func ApproveSupplier(db *gorm.DB, supplierID uint, adminID uint, notes string) error {
	now := time.Now()
	return db.Model(&Supplier{}).Where("id = ?", supplierID).Updates(map[string]interface{}{
		"status":      "approved",
		"admin_notes": notes,
		"approved_at": &now,
		"approved_by": adminID,
	}).Error
}

func RejectSupplier(db *gorm.DB, supplierID uint, adminID uint, notes string) error {
	return db.Model(&Supplier{}).Where("id = ?", supplierID).Updates(map[string]interface{}{
		"status":      "rejected",
		"admin_notes": notes,
		"approved_by": adminID,
	}).Error
}

// SetSupplierFeatured sets or unsets a supplier as featured
func SetSupplierFeatured(db *gorm.DB, supplierID uint, adminID uint, featured bool) error {
	updates := map[string]interface{}{
		"is_featured": featured,
		"featured_by": adminID,
	}

	if featured {
		now := time.Now()
		updates["featured_at"] = &now
	} else {
		updates["featured_at"] = nil
	}

	return db.Model(&Supplier{}).Where("id = ?", supplierID).Updates(updates).Error
}

// GetFeaturedSuppliers returns all featured suppliers
func GetFeaturedSuppliers(db *gorm.DB) ([]Supplier, error) {
	var suppliers []Supplier
	err := db.Preload("User").Preload("Products").Where("status = ? AND is_featured = ?", "approved", true).Order("featured_at DESC").Find(&suppliers).Error
	return suppliers, err
}

// DeleteSupplierByUserID deletes a supplier that belongs to a specific user
// This function ensures only the owner can delete their own supplier registration
func DeleteSupplierByUserID(db *gorm.DB, userID uint) error {
	// First check if supplier exists and belongs to this user
	var supplier Supplier
	if err := db.Preload("Products").Where("user_id = ?", userID).First(&supplier).Error; err != nil {
		return err
	}

	// Start transaction to delete supplier and related products
	tx := db.Begin()
	if tx.Error != nil {
		return tx.Error
	}

	// Delete related products first (due to foreign key constraints)
	if err := tx.Where("supplier_id = ?", supplier.ID).Delete(&SupplierProduct{}).Error; err != nil {
		tx.Rollback()
		return err
	}

	// Delete supplier
	if err := tx.Delete(&supplier).Error; err != nil {
		tx.Rollback()
		return err
	}

	// Commit transaction
	return tx.Commit().Error
}
