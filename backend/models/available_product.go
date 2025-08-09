package models

import (
	"time"

	"gorm.io/gorm"
)

type AvailableProduct struct {
	ID         uint      `json:"id" gorm:"primaryKey"`
	AddedByID  uint      `json:"added_by_id" gorm:"not null;index"`
	AddedBy    User      `json:"added_by" gorm:"foreignKey:AddedByID"`
	SupplierID *uint     `json:"supplier_id" gorm:"index"` // Optional reference to supplier
	Supplier   *Supplier `json:"supplier,omitempty" gorm:"foreignKey:SupplierID"`

	// Product Basic Info
	SaleType    string `json:"sale_type" gorm:"size:20;not null;default:'wholesale'"` // wholesale, retail
	ProductName string `json:"product_name" gorm:"size:255;not null;charset:utf8mb4;collation:utf8mb4_unicode_ci"`
	Category    string `json:"category" gorm:"size:100;not null;charset:utf8mb4;collation:utf8mb4_unicode_ci"`
	Subcategory string `json:"subcategory" gorm:"size:100;charset:utf8mb4;collation:utf8mb4_unicode_ci"`
	Description string `json:"description" gorm:"type:text;charset:utf8mb4;collation:utf8mb4_unicode_ci"`

	// Pricing Info
	WholesalePrice string `json:"wholesale_price" gorm:"size:50"`
	RetailPrice    string `json:"retail_price" gorm:"size:50"`
	ExportPrice    string `json:"export_price" gorm:"size:50"`
	Currency       string `json:"currency" gorm:"size:10;default:'USD'"`

	// Quantity & Availability
	AvailableQuantity int    `json:"available_quantity" gorm:"default:0"`
	MinOrderQuantity  int    `json:"min_order_quantity" gorm:"default:1"`
	MaxOrderQuantity  int    `json:"max_order_quantity"`
	Unit              string `json:"unit" gorm:"size:50;default:'piece'"`

	// Product Details
	Brand   string `json:"brand" gorm:"size:100;charset:utf8mb4;collation:utf8mb4_unicode_ci"`
	Model   string `json:"model" gorm:"size:100;charset:utf8mb4;collation:utf8mb4_unicode_ci"`
	Origin  string `json:"origin" gorm:"size:100;charset:utf8mb4;collation:utf8mb4_unicode_ci"`
	Quality string `json:"quality" gorm:"size:50"` // A+, A, B, C

	// Packaging & Shipping
	PackagingType string `json:"packaging_type" gorm:"size:100;charset:utf8mb4;collation:utf8mb4_unicode_ci"`
	Weight        string `json:"weight" gorm:"size:50"`
	Dimensions    string `json:"dimensions" gorm:"size:100"`
	ShippingCost  string `json:"shipping_cost" gorm:"size:50"`

	// Location & Contact
	Location        string `json:"location" gorm:"size:100;not null;charset:utf8mb4;collation:utf8mb4_unicode_ci"`
	ContactPhone    string `json:"contact_phone" gorm:"size:20"`
	ContactEmail    string `json:"contact_email" gorm:"size:100"`
	ContactWhatsapp string `json:"contact_whatsapp" gorm:"size:20"`

	// Export & License Info
	CanExport       bool   `json:"can_export" gorm:"default:false"`
	RequiresLicense bool   `json:"requires_license" gorm:"default:false"`
	LicenseType     string `json:"license_type" gorm:"size:100;charset:utf8mb4;collation:utf8mb4_unicode_ci"`
	ExportCountries string `json:"export_countries" gorm:"type:text;charset:utf8mb4;collation:utf8mb4_unicode_ci"`

	// Media
	ImageURLs  string `json:"image_urls" gorm:"type:text"` // JSON array of image URLs
	VideoURL   string `json:"video_url" gorm:"size:500"`
	CatalogURL string `json:"catalog_url" gorm:"size:500"`

	// Status & Metadata
	Status     string `json:"status" gorm:"size:20;default:'active'"` // active, inactive, out_of_stock
	IsFeatured bool   `json:"is_featured" gorm:"default:false"`
	IsHotDeal  bool   `json:"is_hot_deal" gorm:"default:false"`
	Tags       string `json:"tags" gorm:"type:text;charset:utf8mb4;collation:utf8mb4_unicode_ci"` // Comma separated
	Notes      string `json:"notes" gorm:"type:text;charset:utf8mb4;collation:utf8mb4_unicode_ci"`

	// Timestamps
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// DTO for creating a new available product
type CreateAvailableProductRequest struct {
	SupplierID        *uint  `json:"supplier_id"`
	SaleType          string `json:"sale_type" binding:"required"`
	ProductName       string `json:"product_name" binding:"required"`
	Category          string `json:"category" binding:"required"`
	Subcategory       string `json:"subcategory"`
	Description       string `json:"description"`
	WholesalePrice    string `json:"wholesale_price"`
	RetailPrice       string `json:"retail_price"`
	ExportPrice       string `json:"export_price"`
	Currency          string `json:"currency"`
	AvailableQuantity int    `json:"available_quantity"`
	MinOrderQuantity  int    `json:"min_order_quantity"`
	MaxOrderQuantity  int    `json:"max_order_quantity"`
	Unit              string `json:"unit"`
	Brand             string `json:"brand"`
	Model             string `json:"model"`
	Origin            string `json:"origin"`
	Quality           string `json:"quality"`
	PackagingType     string `json:"packaging_type"`
	Weight            string `json:"weight"`
	Dimensions        string `json:"dimensions"`
	ShippingCost      string `json:"shipping_cost"`
	Location          string `json:"location" binding:"required"`
	ContactPhone      string `json:"contact_phone"`
	ContactEmail      string `json:"contact_email"`
	ContactWhatsapp   string `json:"contact_whatsapp"`
	CanExport         bool   `json:"can_export"`
	RequiresLicense   bool   `json:"requires_license"`
	LicenseType       string `json:"license_type"`
	ExportCountries   string `json:"export_countries"`
	ImageURLs         string `json:"image_urls"`
	VideoURL          string `json:"video_url"`
	CatalogURL        string `json:"catalog_url"`
	IsFeatured        bool   `json:"is_featured"`
	IsHotDeal         bool   `json:"is_hot_deal"`
	Tags              string `json:"tags"`
	Notes             string `json:"notes"`
}

// DTO for updating an available product
type UpdateAvailableProductRequest struct {
	SupplierID        *uint  `json:"supplier_id"`
	SaleType          string `json:"sale_type"`
	ProductName       string `json:"product_name"`
	Category          string `json:"category"`
	Subcategory       string `json:"subcategory"`
	Description       string `json:"description"`
	WholesalePrice    string `json:"wholesale_price"`
	RetailPrice       string `json:"retail_price"`
	ExportPrice       string `json:"export_price"`
	Currency          string `json:"currency"`
	AvailableQuantity int    `json:"available_quantity"`
	MinOrderQuantity  int    `json:"min_order_quantity"`
	MaxOrderQuantity  int    `json:"max_order_quantity"`
	Unit              string `json:"unit"`
	Brand             string `json:"brand"`
	Model             string `json:"model"`
	Origin            string `json:"origin"`
	Quality           string `json:"quality"`
	PackagingType     string `json:"packaging_type"`
	Weight            string `json:"weight"`
	Dimensions        string `json:"dimensions"`
	ShippingCost      string `json:"shipping_cost"`
	Location          string `json:"location"`
	ContactPhone      string `json:"contact_phone"`
	ContactEmail      string `json:"contact_email"`
	ContactWhatsapp   string `json:"contact_whatsapp"`
	CanExport         bool   `json:"can_export"`
	RequiresLicense   bool   `json:"requires_license"`
	LicenseType       string `json:"license_type"`
	ExportCountries   string `json:"export_countries"`
	ImageURLs         string `json:"image_urls"`
	VideoURL          string `json:"video_url"`
	CatalogURL        string `json:"catalog_url"`
	Status            string `json:"status"`
	IsFeatured        bool   `json:"is_featured"`
	IsHotDeal         bool   `json:"is_hot_deal"`
	Tags              string `json:"tags"`
	Notes             string `json:"notes"`
}

// DTO for available product response
type AvailableProductResponse struct {
	ID                uint              `json:"id"`
	AddedByID         uint              `json:"added_by_id"`
	AddedBy           UserResponse      `json:"added_by"`
	SupplierID        *uint             `json:"supplier_id"`
	Supplier          *SupplierResponse `json:"supplier,omitempty"`
	SaleType          string            `json:"sale_type"`
	ProductName       string            `json:"product_name"`
	Category          string            `json:"category"`
	Subcategory       string            `json:"subcategory"`
	Description       string            `json:"description"`
	WholesalePrice    string            `json:"wholesale_price"`
	RetailPrice       string            `json:"retail_price"`
	ExportPrice       string            `json:"export_price"`
	Currency          string            `json:"currency"`
	AvailableQuantity int               `json:"available_quantity"`
	MinOrderQuantity  int               `json:"min_order_quantity"`
	MaxOrderQuantity  int               `json:"max_order_quantity"`
	Unit              string            `json:"unit"`
	Brand             string            `json:"brand"`
	Model             string            `json:"model"`
	Origin            string            `json:"origin"`
	Quality           string            `json:"quality"`
	PackagingType     string            `json:"packaging_type"`
	Weight            string            `json:"weight"`
	Dimensions        string            `json:"dimensions"`
	ShippingCost      string            `json:"shipping_cost"`
	Location          string            `json:"location"`
	ContactPhone      string            `json:"contact_phone"`
	ContactEmail      string            `json:"contact_email"`
	ContactWhatsapp   string            `json:"contact_whatsapp"`
	CanExport         bool              `json:"can_export"`
	RequiresLicense   bool              `json:"requires_license"`
	LicenseType       string            `json:"license_type"`
	ExportCountries   string            `json:"export_countries"`
	ImageURLs         string            `json:"image_urls"`
	VideoURL          string            `json:"video_url"`
	CatalogURL        string            `json:"catalog_url"`
	Status            string            `json:"status"`
	IsFeatured        bool              `json:"is_featured"`
	IsHotDeal         bool              `json:"is_hot_deal"`
	Tags              string            `json:"tags"`
	Notes             string            `json:"notes"`
	CreatedAt         time.Time         `json:"created_at"`
	UpdatedAt         time.Time         `json:"updated_at"`
}

// CreateAvailableProduct creates a new available product in the database
func CreateAvailableProduct(db *gorm.DB, addedByID uint, req CreateAvailableProductRequest) (*AvailableProduct, error) {
	product := AvailableProduct{
		AddedByID:         addedByID,
		SupplierID:        req.SupplierID,
		SaleType:          req.SaleType,
		ProductName:       req.ProductName,
		Category:          req.Category,
		Subcategory:       req.Subcategory,
		Description:       req.Description,
		WholesalePrice:    req.WholesalePrice,
		RetailPrice:       req.RetailPrice,
		ExportPrice:       req.ExportPrice,
		Currency:          req.Currency,
		AvailableQuantity: req.AvailableQuantity,
		MinOrderQuantity:  req.MinOrderQuantity,
		MaxOrderQuantity:  req.MaxOrderQuantity,
		Unit:              req.Unit,
		Brand:             req.Brand,
		Model:             req.Model,
		Origin:            req.Origin,
		Quality:           req.Quality,
		PackagingType:     req.PackagingType,
		Weight:            req.Weight,
		Dimensions:        req.Dimensions,
		ShippingCost:      req.ShippingCost,
		Location:          req.Location,
		ContactPhone:      req.ContactPhone,
		ContactEmail:      req.ContactEmail,
		ContactWhatsapp:   req.ContactWhatsapp,
		CanExport:         req.CanExport,
		RequiresLicense:   req.RequiresLicense,
		LicenseType:       req.LicenseType,
		ExportCountries:   req.ExportCountries,
		ImageURLs:         req.ImageURLs,
		VideoURL:          req.VideoURL,
		CatalogURL:        req.CatalogURL,
		IsFeatured:        req.IsFeatured,
		IsHotDeal:         req.IsHotDeal,
		Tags:              req.Tags,
		Notes:             req.Notes,
		Status:            "active",
	}

	if err := db.Create(&product).Error; err != nil {
		return nil, err
	}
	return &product, nil
}

// GetAvailableProducts retrieves a list of available products with pagination and filters
func GetAvailableProducts(db *gorm.DB, page, perPage int, category, status string, featuredOnly bool) ([]AvailableProduct, int64, error) {
	var products []AvailableProduct
	var total int64
	query := db.Model(&AvailableProduct{}).Preload("AddedBy").Preload("Supplier")

	// Apply filters
	if category != "" {
		query = query.Where("category = ?", category)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	} else {
		query = query.Where("status = ?", "active") // Default to active only
	}
	if featuredOnly {
		query = query.Where("is_featured = ?", true)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * perPage
	err := query.Offset(offset).Limit(perPage).Order("created_at DESC").Find(&products).Error
	if err != nil {
		return nil, 0, err
	}
	return products, total, nil
}

// GetAvailableProductCategories retrieves unique categories
func GetAvailableProductCategories(db *gorm.DB) ([]string, error) {
	var categories []string
	err := db.Model(&AvailableProduct{}).Where("status = ?", "active").Distinct("category").Pluck("category", &categories).Error
	return categories, err
}

// GetAvailableProduct retrieves a single available product by ID
func GetAvailableProduct(db *gorm.DB, id uint) (*AvailableProduct, error) {
	var product AvailableProduct
	err := db.Preload("AddedBy").Preload("Supplier").First(&product, id).Error
	if err != nil {
		return nil, err
	}
	return &product, nil
}

// UpdateAvailableProduct updates an existing available product
func UpdateAvailableProduct(db *gorm.DB, id uint, req UpdateAvailableProductRequest) (*AvailableProduct, error) {
	var product AvailableProduct
	if err := db.First(&product, id).Error; err != nil {
		return nil, err
	}

	// Update fields if provided
	updates := map[string]interface{}{}
	if req.ProductName != "" {
		updates["product_name"] = req.ProductName
	}
	if req.Category != "" {
		updates["category"] = req.Category
	}
	if req.Subcategory != "" {
		updates["subcategory"] = req.Subcategory
	}
	if req.Description != "" {
		updates["description"] = req.Description
	}
	if req.WholesalePrice != "" {
		updates["wholesale_price"] = req.WholesalePrice
	}
	if req.RetailPrice != "" {
		updates["retail_price"] = req.RetailPrice
	}
	if req.ExportPrice != "" {
		updates["export_price"] = req.ExportPrice
	}
	if req.Currency != "" {
		updates["currency"] = req.Currency
	}
	if req.AvailableQuantity >= 0 {
		updates["available_quantity"] = req.AvailableQuantity
	}
	if req.MinOrderQuantity > 0 {
		updates["min_order_quantity"] = req.MinOrderQuantity
	}
	if req.MaxOrderQuantity > 0 {
		updates["max_order_quantity"] = req.MaxOrderQuantity
	}
	if req.Unit != "" {
		updates["unit"] = req.Unit
	}
	if req.Brand != "" {
		updates["brand"] = req.Brand
	}
	if req.Model != "" {
		updates["model"] = req.Model
	}
	if req.Origin != "" {
		updates["origin"] = req.Origin
	}
	if req.Quality != "" {
		updates["quality"] = req.Quality
	}
	if req.PackagingType != "" {
		updates["packaging_type"] = req.PackagingType
	}
	if req.Weight != "" {
		updates["weight"] = req.Weight
	}
	if req.Dimensions != "" {
		updates["dimensions"] = req.Dimensions
	}
	if req.ShippingCost != "" {
		updates["shipping_cost"] = req.ShippingCost
	}
	if req.Location != "" {
		updates["location"] = req.Location
	}
	if req.ContactPhone != "" {
		updates["contact_phone"] = req.ContactPhone
	}
	if req.ContactEmail != "" {
		updates["contact_email"] = req.ContactEmail
	}
	if req.ContactWhatsapp != "" {
		updates["contact_whatsapp"] = req.ContactWhatsapp
	}
	updates["can_export"] = req.CanExport
	updates["requires_license"] = req.RequiresLicense
	if req.LicenseType != "" {
		updates["license_type"] = req.LicenseType
	}
	if req.ExportCountries != "" {
		updates["export_countries"] = req.ExportCountries
	}
	if req.ImageURLs != "" {
		updates["image_urls"] = req.ImageURLs
	}
	if req.VideoURL != "" {
		updates["video_url"] = req.VideoURL
	}
	if req.CatalogURL != "" {
		updates["catalog_url"] = req.CatalogURL
	}
	if req.Status != "" {
		updates["status"] = req.Status
	}
	updates["is_featured"] = req.IsFeatured
	updates["is_hot_deal"] = req.IsHotDeal
	if req.Tags != "" {
		updates["tags"] = req.Tags
	}
	if req.Notes != "" {
		updates["notes"] = req.Notes
	}

	// Only update supplier_id if explicitly provided
	if req.SupplierID != nil {
		updates["supplier_id"] = *req.SupplierID
	}

	if err := db.Model(&product).Updates(updates).Error; err != nil {
		return nil, err
	}
	return &product, nil
}

// DeleteAvailableProduct deletes an available product by ID
func DeleteAvailableProduct(db *gorm.DB, id uint) error {
	return db.Delete(&AvailableProduct{}, id).Error
}

// UpdateAvailableProductStatus updates the status of an available product
func UpdateAvailableProductStatus(db *gorm.DB, id uint, status string) error {
	return db.Model(&AvailableProduct{}).Where("id = ?", id).Update("status", status).Error
}

// GetFeaturedAvailableProducts retrieves featured available products
func GetFeaturedAvailableProducts(db *gorm.DB, limit int) ([]AvailableProduct, error) {
	var products []AvailableProduct
	err := db.Where("status = ? AND is_featured = ?", "active", true).
		Preload("AddedBy").Preload("Supplier").
		Order("created_at DESC").
		Limit(limit).
		Find(&products).Error
	return products, err
}

// GetActiveAvailableProducts retrieves all active available products
func GetActiveAvailableProducts(db *gorm.DB) ([]AvailableProduct, error) {
	var products []AvailableProduct
	err := db.Where("status = ?", "active").
		Preload("AddedBy").
		Order("created_at DESC").
		Find(&products).Error
	return products, err
}

// GetHotDealsAvailableProducts retrieves hot deal available products
func GetHotDealsAvailableProducts(db *gorm.DB, limit int) ([]AvailableProduct, error) {
	var products []AvailableProduct
	err := db.Where("status = ? AND is_hot_deal = ?", "active", true).
		Preload("AddedBy").Preload("Supplier").
		Order("created_at DESC").
		Limit(limit).
		Find(&products).Error
	return products, err
}
