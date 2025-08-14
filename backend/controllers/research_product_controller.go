package controllers

import (
	"asl-market-backend/models"
	"fmt"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/xuri/excelize/v2"
	"gorm.io/gorm"
)

// GetResearchProducts godoc
// @Summary Get research products
// @Description Get paginated list of research products
// @Tags research-products
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param per_page query int false "Items per page" default(10)
// @Param category query string false "Filter by category"
// @Param status query string false "Filter by status"
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /research-products [get]
func GetResearchProducts(c *gin.Context) {
	// Parse query parameters
	pageStr := c.DefaultQuery("page", "1")
	perPageStr := c.DefaultQuery("per_page", "10")
	category := c.DefaultQuery("category", "")
	status := c.DefaultQuery("status", "")

	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}

	perPage, err := strconv.Atoi(perPageStr)
	if err != nil || perPage < 1 || perPage > 50 {
		perPage = 10
	}

	// Get products
	products, total, err := models.GetResearchProducts(page, perPage, category, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "خطا در دریافت محصولات تحقیقی",
		})
		return
	}

	// Convert to response format
	var productResponses []models.ResearchProductResponse
	for _, product := range products {
		productResponse := models.ResearchProductResponse{
			ID:                 product.ID,
			Name:               product.Name,
			HSCode:             product.HSCode,
			Category:           product.Category,
			Description:        product.Description,
			ExportValue:        product.ExportValue,
			ImportValue:        product.ImportValue,
			MarketDemand:       product.MarketDemand,
			ProfitPotential:    product.ProfitPotential,
			CompetitionLevel:   product.CompetitionLevel,
			TargetCountry:      product.TargetCountry,
			IranPurchasePrice:  product.IranPurchasePrice,
			TargetCountryPrice: product.TargetCountryPrice,
			PriceCurrency:      product.PriceCurrency,
			ProfitMargin:       product.ProfitMargin,
			TargetCountries:    product.TargetCountries,
			SeasonalFactors:    product.SeasonalFactors,
			RequiredLicenses:   product.RequiredLicenses,
			QualityStandards:   product.QualityStandards,
			Status:             product.Status,
			Priority:           product.Priority,
			AddedBy:            product.AddedBy,
			AddedByAdmin: models.UserResponse{
				ID:        product.AddedByAdmin.ID,
				Email:     product.AddedByAdmin.Email,
				FirstName: product.AddedByAdmin.FirstName,
				LastName:  product.AddedByAdmin.LastName,
			},
			CreatedAt: product.CreatedAt,
			UpdatedAt: product.UpdatedAt,
		}
		productResponses = append(productResponses, productResponse)
	}

	// Calculate pagination info
	totalPages := (int(total) + perPage - 1) / perPage

	c.JSON(http.StatusOK, gin.H{
		"products": productResponses,
		"pagination": gin.H{
			"current_page": page,
			"per_page":     perPage,
			"total":        total,
			"total_pages":  totalPages,
		},
	})
}

// GetActiveResearchProducts godoc
// @Summary Get active research products for public display
// @Description Get all active research products without pagination
// @Tags research-products
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /research-products/active [get]
func GetActiveResearchProducts(c *gin.Context) {
	products, err := models.GetActiveResearchProducts()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "خطا در دریافت محصولات تحقیقی",
		})
		return
	}

	// Convert to response format
	var productResponses []models.ResearchProductResponse
	for _, product := range products {
		productResponse := models.ResearchProductResponse{
			ID:                 product.ID,
			Name:               product.Name,
			HSCode:             product.HSCode,
			Category:           product.Category,
			Description:        product.Description,
			ExportValue:        product.ExportValue,
			ImportValue:        product.ImportValue,
			MarketDemand:       product.MarketDemand,
			ProfitPotential:    product.ProfitPotential,
			CompetitionLevel:   product.CompetitionLevel,
			TargetCountry:      product.TargetCountry,
			IranPurchasePrice:  product.IranPurchasePrice,
			TargetCountryPrice: product.TargetCountryPrice,
			PriceCurrency:      product.PriceCurrency,
			ProfitMargin:       product.ProfitMargin,
			TargetCountries:    product.TargetCountries,
			SeasonalFactors:    product.SeasonalFactors,
			RequiredLicenses:   product.RequiredLicenses,
			QualityStandards:   product.QualityStandards,
			Status:             product.Status,
			Priority:           product.Priority,
			CreatedAt:          product.CreatedAt,
			UpdatedAt:          product.UpdatedAt,
		}
		productResponses = append(productResponses, productResponse)
	}

	c.JSON(http.StatusOK, gin.H{
		"products": productResponses,
	})
}

// GetResearchProduct godoc
// @Summary Get research product by ID
// @Description Get a specific research product by ID
// @Tags research-products
// @Accept json
// @Produce json
// @Param id path int true "Research Product ID"
// @Success 200 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /research-products/{id} [get]
func GetResearchProduct(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "شناسه محصول نامعتبر است",
		})
		return
	}

	product, err := models.GetResearchProductByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "محصول تحقیقی یافت نشد",
		})
		return
	}

	productResponse := models.ResearchProductResponse{
		ID:                 product.ID,
		Name:               product.Name,
		Category:           product.Category,
		Description:        product.Description,
		ExportValue:        product.ExportValue,
		ImportValue:        product.ImportValue,
		MarketDemand:       product.MarketDemand,
		ProfitPotential:    product.ProfitPotential,
		CompetitionLevel:   product.CompetitionLevel,
		TargetCountry:      product.TargetCountry,
		IranPurchasePrice:  product.IranPurchasePrice,
		TargetCountryPrice: product.TargetCountryPrice,
		PriceCurrency:      product.PriceCurrency,
		ProfitMargin:       product.ProfitMargin,
		TargetCountries:    product.TargetCountries,
		SeasonalFactors:    product.SeasonalFactors,
		RequiredLicenses:   product.RequiredLicenses,
		QualityStandards:   product.QualityStandards,
		Status:             product.Status,
		Priority:           product.Priority,
		AddedBy:            product.AddedBy,
		AddedByAdmin: models.UserResponse{
			ID:        product.AddedByAdmin.ID,
			Email:     product.AddedByAdmin.Email,
			FirstName: product.AddedByAdmin.FirstName,
			LastName:  product.AddedByAdmin.LastName,
		},
		CreatedAt: product.CreatedAt,
		UpdatedAt: product.UpdatedAt,
	}

	c.JSON(http.StatusOK, gin.H{
		"product": productResponse,
	})
}

// CreateResearchProduct godoc
// @Summary Create research product (Admin only)
// @Description Create a new research product
// @Tags research-products
// @Accept json
// @Produce json
// @Param product body models.ResearchProductRequest true "Research Product data"
// @Success 201 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /admin/research-products [post]
func CreateResearchProduct(c *gin.Context) {
	var req models.ResearchProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "داده‌های ورودی نامعتبر است",
		})
		return
	}

	// Get admin user ID from context
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "احراز هویت شکست خورد",
		})
		return
	}

	adminID, ok := userID.(uint)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "خطا در شناسایی کاربر",
		})
		return
	}

	// Create product
	product, err := models.CreateResearchProduct(req, adminID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "خطا در ایجاد محصول تحقیقی",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "محصول تحقیقی با موفقیت ایجاد شد",
		"product": product,
	})
}

// ImportResearchProductsFromExcel godoc
// @Summary Import research products from Excel (Admin only)
// @Description Import research products from uploaded Excel file
// @Tags research-products
// @Accept multipart/form-data
// @Produce json
// @Param file formData file true "Excel file"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /admin/research-products/import [post]
func ImportResearchProductsFromExcel(c *gin.Context) {
	// Get admin user ID from context
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "احراز هویت شکست خورد",
		})
		return
	}

	adminID, ok := userID.(uint)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "خطا در شناسایی کاربر",
		})
		return
	}

	// Get uploaded file
	fileHeader, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "فایل آپلود نشده است",
		})
		return
	}

	// Validate file extension
	if !strings.HasSuffix(strings.ToLower(fileHeader.Filename), ".xlsx") {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "فقط فایل‌های Excel (.xlsx) پشتیبانی می‌شوند",
		})
		return
	}

	// Save uploaded file temporarily
	tempFilePath := filepath.Join("tmp", fmt.Sprintf("research_products_%d.xlsx", time.Now().Unix()))
	err = c.SaveUploadedFile(fileHeader, tempFilePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "خطا در ذخیره فایل",
		})
		return
	}

	// Import products from Excel
	db := models.GetDB()
	count, importErr := importResearchProductsFromExcel(db, tempFilePath, adminID)

	// Clean up temporary file
	// os.Remove(tempFilePath) // Uncomment in production

	if importErr != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "خطا در import داده‌ها",
			"details": importErr.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":        "فایل با موفقیت import شد",
		"imported_count": count,
	})
}

// Helper function for importing research products from Excel
func importResearchProductsFromExcel(db *gorm.DB, filePath string, adminID uint) (int, error) {
	f, err := excelize.OpenFile(filePath)
	if err != nil {
		return 0, fmt.Errorf("failed to open Excel file: %w", err)
	}
	defer f.Close()

	sheets := f.GetSheetList()
	if len(sheets) == 0 {
		return 0, fmt.Errorf("no sheets found")
	}

	rows, err := f.GetRows(sheets[0])
	if err != nil {
		return 0, fmt.Errorf("failed to read rows: %w", err)
	}

	if len(rows) < 3 { // Header + at least 2 data rows (skip first 2 rows)
		return 0, fmt.Errorf("insufficient data rows found")
	}

	successCount := 0

	// Skip first 2 rows (header and sample), start from row 2 (index 2)
	for i := 2; i < len(rows); i++ {
		row := rows[i]

		// Skip empty rows
		if len(row) == 0 || isEmptyRow(row) {
			continue
		}

		if len(row) < 5 {
			continue
		}

		// Extract data from columns based on structure:
		// 0: نام محصول
		// 1: HS code
		// 2: مقصدهای عربی اصلی
		// 3: کاربرد/نکته قابل استفاده در فروش
		// 4: حجم معاملات در سال ۲۰۲۴

		name := cleanStringField(getColumnValue(row, 0))
		hsCode := cleanStringField(getColumnValue(row, 1))
		targetCountries := cleanStringField(getColumnValue(row, 2))
		description := cleanStringField(getColumnValue(row, 3))
		exportValue := cleanStringField(getColumnValue(row, 4))

		// Validate required fields
		if name == "" {
			continue
		}

		// Check if product already exists
		var existingProduct models.ResearchProduct
		err := db.Where("name = ?", name).First(&existingProduct).Error
		if err == nil {
			continue // Skip if already exists
		}

		// Determine category based on product name
		category := determineCategoryFromName(name)

		// Create research product
		product := models.ResearchProduct{
			Name:            name,
			HSCode:          hsCode,
			Category:        category,
			Description:     description,
			ExportValue:     exportValue,
			TargetCountries: targetCountries,
			Status:          "active",
			Priority:        0,
			AddedBy:         adminID,
		}

		// Save to database
		err = db.Create(&product).Error
		if err != nil {
			continue
		}

		successCount++
	}

	return successCount, nil
}

// Helper functions
func getColumnValue(row []string, index int) string {
	if index >= len(row) {
		return ""
	}
	return row[index]
}

func cleanStringField(s string) string {
	s = strings.TrimSpace(s)
	s = strings.ReplaceAll(s, "\n", " ")
	s = strings.ReplaceAll(s, "\r", " ")
	s = strings.ReplaceAll(s, "\t", " ")
	// Remove multiple spaces
	for strings.Contains(s, "  ") {
		s = strings.ReplaceAll(s, "  ", " ")
	}
	return s
}

func isEmptyRow(row []string) bool {
	for _, cell := range row {
		if strings.TrimSpace(cell) != "" {
			return false
		}
	}
	return true
}

func determineCategoryFromName(name string) string {
	name = strings.ToLower(name)

	// Category mapping based on product names
	categoryMap := map[string]string{
		"پلی":     "پلاستیک و پلیمر",
		"پلاستیک": "پلاستیک و پلیمر",
		"پلیمر":   "پلاستیک و پلیمر",
		"زعفران":  "ادویه و چاشنی",
		"خرما":    "میوه و خشکبار",
		"پسته":    "میوه و خشکبار",
		"فرش":     "صنایع دستی",
		"قالی":    "صنایع دستی",
		"چای":     "نوشیدنی",
		"برنج":    "غلات",
		"نفت":     "انرژی",
		"گاز":     "انرژی",
		"مس":      "فلزات",
		"آهن":     "فلزات",
		"فولاد":   "فلزات",
		"سیمان":   "مصالح ساختمانی",
		"سنگ":     "مصالح ساختمانی",
		"شیمیایی": "مواد شیمیایی",
		"دارو":    "دارو و بهداشت",
		"کشمش":    "میوه و خشکبار",
		"انجیر":   "میوه و خشکبار",
	}

	// Check for category keywords in product name
	for keyword, category := range categoryMap {
		if strings.Contains(name, keyword) {
			return category
		}
	}

	// Default category
	return "سایر محصولات"
}

// UpdateResearchProduct godoc
// @Summary Update research product (Admin only)
// @Description Update an existing research product
// @Tags research-products
// @Accept json
// @Produce json
// @Param id path int true "Research Product ID"
// @Param product body models.ResearchProductRequest true "Research Product data"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /admin/research-products/{id} [put]
func UpdateResearchProduct(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "شناسه محصول نامعتبر است",
		})
		return
	}

	var req models.ResearchProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "داده‌های ورودی نامعتبر است",
		})
		return
	}

	product, err := models.UpdateResearchProduct(uint(id), req)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "محصول تحقیقی یافت نشد",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "محصول تحقیقی با موفقیت به‌روزرسانی شد",
		"product": product,
	})
}

// DeleteResearchProduct godoc
// @Summary Delete research product (Admin only)
// @Description Delete a research product
// @Tags research-products
// @Accept json
// @Produce json
// @Param id path int true "Research Product ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /admin/research-products/{id} [delete]
func DeleteResearchProduct(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "شناسه محصول نامعتبر است",
		})
		return
	}

	err = models.DeleteResearchProduct(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "محصول تحقیقی یافت نشد",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "محصول تحقیقی با موفقیت حذف شد",
	})
}

// UpdateResearchProductStatus godoc
// @Summary Update research product status (Admin only)
// @Description Update the status of a research product
// @Tags research-products
// @Accept json
// @Produce json
// @Param id path int true "Research Product ID"
// @Param status body map[string]string true "Status data"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /admin/research-products/{id}/status [patch]
func UpdateResearchProductStatus(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "شناسه محصول نامعتبر است",
		})
		return
	}

	var req struct {
		Status string `json:"status" binding:"required,oneof=active inactive"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "وضعیت نامعتبر است",
		})
		return
	}

	err = models.UpdateResearchProductStatus(uint(id), req.Status)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "محصول تحقیقی یافت نشد",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "وضعیت محصول تحقیقی با موفقیت به‌روزرسانی شد",
	})
}

// GetResearchProductCategories godoc
// @Summary Get research product categories
// @Description Get list of distinct research product categories
// @Tags research-products
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /research-products/categories [get]
func GetResearchProductCategories(c *gin.Context) {
	categories, err := models.GetResearchProductCategories()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "خطا در دریافت دسته‌بندی‌ها",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"categories": categories,
	})
}
