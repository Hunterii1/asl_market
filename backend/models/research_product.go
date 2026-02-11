package models

import (
	"fmt"
	"strconv"
	"time"

	"gorm.io/gorm"
)

// ResearchProduct represents a research product in the system
type ResearchProduct struct {
	ID          uint   `json:"id" gorm:"primaryKey"`
	Name        string `json:"name" gorm:"size:255;charset:utf8mb4;collation:utf8mb4_unicode_ci;not null"`
	HSCode      string `json:"hs_code" gorm:"size:100;charset:utf8mb4;collation:utf8mb4_unicode_ci"`
	Category    string `json:"category" gorm:"size:100;charset:utf8mb4;collation:utf8mb4_unicode_ci;not null"`
	Description string `json:"description" gorm:"type:text;charset:utf8mb4;collation:utf8mb4_unicode_ci"`

	// Market Information
	ExportValue      string `json:"export_value" gorm:"size:100"`     // مقدار صادرات
	ImportValue      string `json:"import_value" gorm:"size:100"`     // مقدار واردات
	MarketDemand     string `json:"market_demand" gorm:"size:50"`     // تقاضای بازار: high, medium, low
	ProfitPotential  string `json:"profit_potential" gorm:"size:50"`  // پتانسیل سود: high, medium, low
	CompetitionLevel string `json:"competition_level" gorm:"size:50"` // سطح رقابت: high, medium, low

	// Target Country & Pricing
	TargetCountry      string `json:"target_country" gorm:"size:100;charset:utf8mb4;collation:utf8mb4_unicode_ci"` // کشور هدف اصلی
	IranPurchasePrice  string `json:"iran_purchase_price" gorm:"size:50"`                                          // قیمت خرید از ایران
	TargetCountryPrice string `json:"target_country_price" gorm:"size:50"`                                         // قیمت فروش در کشور هدف
	PriceCurrency      string `json:"price_currency" gorm:"size:10;default:'USD'"`                                 // واحد پول قیمت‌ها
	ProfitMargin       string `json:"profit_margin" gorm:"size:20"`                                                // حاشیه سود محاسبه شده

	// Additional Details
	TargetCountries  string `json:"target_countries" gorm:"type:text;charset:utf8mb4;collation:utf8mb4_unicode_ci"` // کشورهای هدف (چندتایی)
	SeasonalFactors  string `json:"seasonal_factors" gorm:"type:text;charset:utf8mb4;collation:utf8mb4_unicode_ci"` // عوامل فصلی
	RequiredLicenses string `json:"required_licenses" gorm:"type:text"`                                             // مجوزهای مورد نیاز
	QualityStandards string `json:"quality_standards" gorm:"type:text"`                                             // استانداردهای کیفی

	// Administrative
	Status       string `json:"status" gorm:"size:20;default:'active'"` // active, inactive
	Priority     int    `json:"priority" gorm:"default:0"`              // برای مرتب‌سازی
	AddedBy      uint   `json:"added_by" gorm:"not null"`               // Admin ID که اضافه کرده
	AddedByAdmin User   `json:"added_by_admin" gorm:"foreignKey:AddedBy"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

// ResearchProductRequest represents the request structure for creating research products
type ResearchProductRequest struct {
	Name               string `json:"name" validate:"required,min=2,max=255"`
	HSCode             string `json:"hs_code"`
	Category           string `json:"category" validate:"required,min=2,max=100"`
	Description        string `json:"description"`
	ExportValue        string `json:"export_value"`
	ImportValue        string `json:"import_value"`
	MarketDemand       string `json:"market_demand" validate:"omitempty,oneof=high medium low"`
	ProfitPotential    string `json:"profit_potential" validate:"omitempty,oneof=high medium low"`
	CompetitionLevel   string `json:"competition_level" validate:"omitempty,oneof=high medium low"`
	TargetCountry      string `json:"target_country"`
	IranPurchasePrice  string `json:"iran_purchase_price"`
	TargetCountryPrice string `json:"target_country_price"`
	PriceCurrency      string `json:"price_currency"`
	TargetCountries    string `json:"target_countries"`
	SeasonalFactors    string `json:"seasonal_factors"`
	RequiredLicenses   string `json:"required_licenses"`
	QualityStandards   string `json:"quality_standards"`
	Priority           int    `json:"priority"`
}

// ResearchProductResponse represents the response structure for research products
type ResearchProductResponse struct {
	ID                 uint         `json:"id"`
	Name               string       `json:"name"`
	HSCode             string       `json:"hs_code"`
	Category           string       `json:"category"`
	Description        string       `json:"description"`
	ExportValue        string       `json:"export_value"`
	ImportValue        string       `json:"import_value"`
	MarketDemand       string       `json:"market_demand"`
	ProfitPotential    string       `json:"profit_potential"`
	CompetitionLevel   string       `json:"competition_level"`
	TargetCountry      string       `json:"target_country"`
	IranPurchasePrice  string       `json:"iran_purchase_price"`
	TargetCountryPrice string       `json:"target_country_price"`
	PriceCurrency      string       `json:"price_currency"`
	ProfitMargin       string       `json:"profit_margin"`
	TargetCountries    string       `json:"target_countries"`
	SeasonalFactors    string       `json:"seasonal_factors"`
	RequiredLicenses   string       `json:"required_licenses"`
	QualityStandards   string       `json:"quality_standards"`
	Status             string       `json:"status"`
	Priority           int          `json:"priority"`
	AddedBy            uint         `json:"added_by"`
	AddedByAdmin       UserResponse `json:"added_by_admin"`
	CreatedAt          time.Time    `json:"created_at"`
	UpdatedAt          time.Time    `json:"updated_at"`
}

// Helper functions for ResearchProduct

// CreateResearchProduct creates a new research product
func CreateResearchProduct(req ResearchProductRequest, adminID uint) (*ResearchProduct, error) {
	db := GetDB()

	product := ResearchProduct{
		Name:               req.Name,
		HSCode:             req.HSCode,
		Category:           req.Category,
		Description:        req.Description,
		ExportValue:        req.ExportValue,
		ImportValue:        req.ImportValue,
		MarketDemand:       req.MarketDemand,
		ProfitPotential:    req.ProfitPotential,
		CompetitionLevel:   req.CompetitionLevel,
		TargetCountry:      req.TargetCountry,
		IranPurchasePrice:  req.IranPurchasePrice,
		TargetCountryPrice: req.TargetCountryPrice,
		PriceCurrency:      req.PriceCurrency,
		TargetCountries:    req.TargetCountries,
		SeasonalFactors:    req.SeasonalFactors,
		RequiredLicenses:   req.RequiredLicenses,
		QualityStandards:   req.QualityStandards,
		Priority:           req.Priority,
		AddedBy:            adminID,
		Status:             "active",
	}

	// Calculate profit margin if both prices are provided
	if req.IranPurchasePrice != "" && req.TargetCountryPrice != "" {
		if iranPrice, err1 := strconv.ParseFloat(req.IranPurchasePrice, 64); err1 == nil {
			if targetPrice, err2 := strconv.ParseFloat(req.TargetCountryPrice, 64); err2 == nil && iranPrice > 0 {
				margin := ((targetPrice - iranPrice) / iranPrice) * 100
				product.ProfitMargin = fmt.Sprintf("%.2f%%", margin)
			}
		}
	}

	err := db.Create(&product).Error
	if err != nil {
		return nil, err
	}

	return &product, nil
}

// GetResearchProducts returns paginated research products
func GetResearchProducts(page, perPage int, category, status, hsCode string) ([]ResearchProduct, int64, error) {
	db := GetDB()
	var products []ResearchProduct
	var total int64

	query := db.Model(&ResearchProduct{}).Preload("AddedByAdmin")

	// Apply filters
	if category != "" && category != "all" {
		query = query.Where("category = ?", category)
	}

	if status != "" && status != "all" {
		query = query.Where("status = ?", status)
	}

	if hsCode != "" {
		query = query.Where("hs_code LIKE ?", "%"+hsCode+"%")
	}

	// Get total count
	query.Count(&total)

	// Apply pagination and ordering
	offset := (page - 1) * perPage
	err := query.Order("priority DESC, created_at DESC").
		Offset(offset).
		Limit(perPage).
		Find(&products).Error

	if err != nil {
		return nil, 0, err
	}

	return products, total, nil
}

// GetActiveResearchProducts returns active research products for public display
func GetActiveResearchProducts() ([]ResearchProduct, error) {
	db := GetDB()
	var products []ResearchProduct

	err := db.Where("status = ?", "active").
		Order("priority DESC, created_at DESC").
		Find(&products).Error

	if err != nil {
		return nil, err
	}

	return products, nil
}

// GetActiveResearchProductsPaginated returns paginated list of active research products
func GetActiveResearchProductsPaginated(page, perPage int) ([]ResearchProduct, int64, error) {
	db := GetDB()
	var products []ResearchProduct
	var total int64

	query := db.Model(&ResearchProduct{}).Where("status = ?", "active")

	// Get total count
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	offset := (page - 1) * perPage
	err := query.Offset(offset).Limit(perPage).Order("priority DESC, created_at DESC").Find(&products).Error
	return products, total, err
}

// GetResearchProductByID returns a research product by ID
func GetResearchProductByID(id uint) (*ResearchProduct, error) {
	db := GetDB()
	var product ResearchProduct

	err := db.Preload("AddedByAdmin").Where("id = ?", id).First(&product).Error
	if err != nil {
		return nil, err
	}

	return &product, nil
}

// UpdateResearchProduct updates a research product
func UpdateResearchProduct(id uint, req ResearchProductRequest) (*ResearchProduct, error) {
	db := GetDB()
	var product ResearchProduct

	err := db.Where("id = ?", id).First(&product).Error
	if err != nil {
		return nil, err
	}

	// Update fields
	product.Name = req.Name
	product.HSCode = req.HSCode
	product.Category = req.Category
	product.Description = req.Description
	product.ExportValue = req.ExportValue
	product.ImportValue = req.ImportValue
	product.MarketDemand = req.MarketDemand
	product.ProfitPotential = req.ProfitPotential
	product.CompetitionLevel = req.CompetitionLevel
	product.TargetCountry = req.TargetCountry
	product.IranPurchasePrice = req.IranPurchasePrice
	product.TargetCountryPrice = req.TargetCountryPrice
	product.PriceCurrency = req.PriceCurrency
	product.TargetCountries = req.TargetCountries
	product.SeasonalFactors = req.SeasonalFactors
	product.RequiredLicenses = req.RequiredLicenses
	product.QualityStandards = req.QualityStandards
	product.Priority = req.Priority

	// Recalculate profit margin if both prices are provided
	product.ProfitMargin = ""
	if req.IranPurchasePrice != "" && req.TargetCountryPrice != "" {
		if iranPrice, err1 := strconv.ParseFloat(req.IranPurchasePrice, 64); err1 == nil {
			if targetPrice, err2 := strconv.ParseFloat(req.TargetCountryPrice, 64); err2 == nil && iranPrice > 0 {
				margin := ((targetPrice - iranPrice) / iranPrice) * 100
				product.ProfitMargin = fmt.Sprintf("%.2f%%", margin)
			}
		}
	}

	err = db.Save(&product).Error
	if err != nil {
		return nil, err
	}

	return &product, nil
}

// DeleteResearchProduct soft deletes a research product
func DeleteResearchProduct(id uint) error {
	db := GetDB()
	return db.Delete(&ResearchProduct{}, id).Error
}

// UpdateResearchProductStatus updates the status of a research product
func UpdateResearchProductStatus(id uint, status string) error {
	db := GetDB()
	return db.Model(&ResearchProduct{}).Where("id = ?", id).Update("status", status).Error
}

// GetResearchProductCategories returns distinct categories
func GetResearchProductCategories() ([]string, error) {
	db := GetDB()
	var categories []string

	err := db.Model(&ResearchProduct{}).
		Distinct("category").
		Where("status = ?", "active").
		Pluck("category", &categories).Error

	if err != nil {
		return nil, err
	}

	return categories, nil
}
