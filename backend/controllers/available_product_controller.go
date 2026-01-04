package controllers

import (
	"net/http"
	"strconv"

	"asl-market-backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GetAvailableProducts retrieves a list of available products with pagination and filters
func GetAvailableProducts(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)

	// Check if user is authenticated and check limits
	userIDInterface, exists := c.Get("user_id")
	if exists {
		userID := userIDInterface.(uint)
		// Get user's license to check limits
		license, err := models.GetUserLicense(db, userID)
		if err == nil {
			// Check if user can view
			canView, err := models.CanViewAvailableProduct(db, userID, license.Type)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در بررسی محدودیت"})
				return
			}
			if !canView {
				c.JSON(http.StatusForbidden, gin.H{
					"error":         "محدودیت روزانه مشاهده کالاهای موجود به پایان رسیده است",
					"limit_reached": true,
				})
				return
			}
			// Track the view
			if err := models.IncrementAvailableProductView(db, userID); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ثبت مشاهده"})
				return
			}
		}
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))
	category := c.Query("category")
	status := c.Query("status")
	featuredOnly := c.DefaultQuery("featured_only", "false") == "true"

	products, total, err := models.GetAvailableProducts(db, page, perPage, category, status, featuredOnly)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve available products"})
		return
	}

	// Convert to response format
	var responseProducts []models.AvailableProductResponse
	for _, product := range products {
		response := models.AvailableProductResponse{
			ID:        product.ID,
			AddedByID: product.AddedByID,
			AddedBy: models.UserResponse{
				ID:        product.AddedBy.ID,
				FirstName: product.AddedBy.FirstName,
				LastName:  product.AddedBy.LastName,
				Email:     product.AddedBy.Email,
			},
			SupplierID:        product.SupplierID,
			ProductName:       product.ProductName,
			Category:          product.Category,
			Subcategory:       product.Subcategory,
			Description:       product.Description,
			WholesalePrice:    product.WholesalePrice,
			RetailPrice:       product.RetailPrice,
			ExportPrice:       product.ExportPrice,
			Currency:          product.Currency,
			AvailableQuantity: product.AvailableQuantity,
			MinOrderQuantity:  product.MinOrderQuantity,
			MaxOrderQuantity:  product.MaxOrderQuantity,
			Unit:              product.Unit,
			Brand:             product.Brand,
			Model:             product.Model,
			Origin:            product.Origin,
			Quality:           product.Quality,
			PackagingType:     product.PackagingType,
			Weight:            product.Weight,
			Dimensions:        product.Dimensions,
			ShippingCost:      product.ShippingCost,
			Location:          product.Location,
			ContactPhone:      product.ContactPhone,
			ContactEmail:      product.ContactEmail,
			ContactWhatsapp:   product.ContactWhatsapp,
			CanExport:         product.CanExport,
			RequiresLicense:   product.RequiresLicense,
			LicenseType:       product.LicenseType,
			ExportCountries:   product.ExportCountries,
			ImageURLs:         product.ImageURLs,
			VideoURL:          product.VideoURL,
			CatalogURL:        product.CatalogURL,
			Status:            product.Status,
			IsFeatured:        product.IsFeatured,
			IsHotDeal:         product.IsHotDeal,
			Tags:              product.Tags,
			Notes:             product.Notes,
			CreatedAt:         product.CreatedAt,
			UpdatedAt:         product.UpdatedAt,
		}

		// Add supplier info if available
		if product.Supplier != nil {
			response.Supplier = &models.SupplierResponse{
				ID:        product.Supplier.ID,
				UserID:    product.Supplier.UserID,
				FullName:  product.Supplier.FullName,
				Mobile:    product.Supplier.Mobile,
				BrandName: product.Supplier.BrandName,
				ImageURL:  product.Supplier.ImageURL,
				City:      product.Supplier.City,
				Status:    product.Supplier.Status,
			}
		}

		responseProducts = append(responseProducts, response)
	}

	c.JSON(http.StatusOK, gin.H{
		"products": responseProducts,
		"total":    total,
		"page":     page,
		"per_page": perPage,
	})
}

// GetAvailableProductCategories retrieves unique categories
func GetAvailableProductCategories(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)

	categories, err := models.GetAvailableProductCategories(db)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve categories"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"categories": categories})
}

// GetAvailableProduct retrieves a single available product by ID
func GetAvailableProduct(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	productID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	// Check if user is authenticated and track view
	userIDInterface, exists := c.Get("user_id")
	if exists {
		userID := userIDInterface.(uint)
		// Get user's license to check limits
		license, err := models.GetUserLicense(db, userID)
		if err == nil {
			// Check if user can view
			canView, err := models.CanViewAvailableProduct(db, userID, license.Type)
			if err == nil && canView {
				// Track the view
				models.IncrementAvailableProductView(db, userID)
			}
		}
	}

	product, err := models.GetAvailableProduct(db, uint(productID))
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve product"})
		return
	}

	// Convert to response format
	response := models.AvailableProductResponse{
		ID:        product.ID,
		AddedByID: product.AddedByID,
		AddedBy: models.UserResponse{
			ID:        product.AddedBy.ID,
			FirstName: product.AddedBy.FirstName,
			LastName:  product.AddedBy.LastName,
			Email:     product.AddedBy.Email,
		},
		SupplierID:        product.SupplierID,
		ProductName:       product.ProductName,
		Category:          product.Category,
		Subcategory:       product.Subcategory,
		Description:       product.Description,
		WholesalePrice:    product.WholesalePrice,
		RetailPrice:       product.RetailPrice,
		ExportPrice:       product.ExportPrice,
		Currency:          product.Currency,
		AvailableQuantity: product.AvailableQuantity,
		MinOrderQuantity:  product.MinOrderQuantity,
		MaxOrderQuantity:  product.MaxOrderQuantity,
		Unit:              product.Unit,
		Brand:             product.Brand,
		Model:             product.Model,
		Origin:            product.Origin,
		Quality:           product.Quality,
		PackagingType:     product.PackagingType,
		Weight:            product.Weight,
		Dimensions:        product.Dimensions,
		ShippingCost:      product.ShippingCost,
		Location:          product.Location,
		ContactPhone:      product.ContactPhone,
		ContactEmail:      product.ContactEmail,
		ContactWhatsapp:   product.ContactWhatsapp,
		CanExport:         product.CanExport,
		RequiresLicense:   product.RequiresLicense,
		LicenseType:       product.LicenseType,
		ExportCountries:   product.ExportCountries,
		ImageURLs:         product.ImageURLs,
		VideoURL:          product.VideoURL,
		CatalogURL:        product.CatalogURL,
		Status:            product.Status,
		IsFeatured:        product.IsFeatured,
		IsHotDeal:         product.IsHotDeal,
		Tags:              product.Tags,
		Notes:             product.Notes,
		CreatedAt:         product.CreatedAt,
		UpdatedAt:         product.UpdatedAt,
	}

	// Add supplier info if available
	if product.Supplier != nil {
		response.Supplier = &models.SupplierResponse{
			ID:        product.Supplier.ID,
			UserID:    product.Supplier.UserID,
			FullName:  product.Supplier.FullName,
			Mobile:    product.Supplier.Mobile,
			BrandName: product.Supplier.BrandName,
			City:      product.Supplier.City,
			Status:    product.Supplier.Status,
		}
	}

	c.JSON(http.StatusOK, response)
}

// CreateAvailableProduct creates a new available product (Admin only)
func CreateAvailableProduct(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	user := c.MustGet("user").(models.User)

	if !user.IsAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden"})
		return
	}

	var req models.CreateAvailableProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	product, err := models.CreateAvailableProduct(db, user.ID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create product"})
		return
	}

	c.JSON(http.StatusCreated, product)
}

// UpdateAvailableProduct updates an existing available product (Admin only)
func UpdateAvailableProduct(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	user := c.MustGet("user").(models.User)

	if !user.IsAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden"})
		return
	}

	productID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	var req models.UpdateAvailableProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	product, err := models.UpdateAvailableProduct(db, uint(productID), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update product"})
		return
	}

	c.JSON(http.StatusOK, product)
}

// DeleteAvailableProduct deletes an available product (Admin only)
func DeleteAvailableProduct(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	user := c.MustGet("user").(models.User)

	if !user.IsAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden"})
		return
	}

	productID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	err = models.DeleteAvailableProduct(db, uint(productID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete product"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Product deleted successfully"})
}

// GetUserAvailableProducts retrieves products added by the current user
func GetUserAvailableProducts(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	user := c.MustGet("user").(models.User)

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))

	products, total, err := models.GetUserAvailableProducts(db, user.ID, page, perPage)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve user products"})
		return
	}

	// Convert to response format
	var responseProducts []models.AvailableProductResponse
	for _, product := range products {
		response := models.AvailableProductResponse{
			ID:                product.ID,
			AddedByID:         product.AddedByID,
			ProductName:       product.ProductName,
			Category:          product.Category,
			Subcategory:       product.Subcategory,
			Description:       product.Description,
			WholesalePrice:    product.WholesalePrice,
			RetailPrice:       product.RetailPrice,
			ExportPrice:       product.ExportPrice,
			Currency:          product.Currency,
			AvailableQuantity: product.AvailableQuantity,
			MinOrderQuantity:  product.MinOrderQuantity,
			MaxOrderQuantity:  product.MaxOrderQuantity,
			Unit:              product.Unit,
			Brand:             product.Brand,
			Model:             product.Model,
			Origin:            product.Origin,
			Quality:           product.Quality,
			PackagingType:     product.PackagingType,
			Weight:            product.Weight,
			Dimensions:        product.Dimensions,
			ShippingCost:      product.ShippingCost,
			Location:          product.Location,
			ContactPhone:      product.ContactPhone,
			ContactEmail:      product.ContactEmail,
			ContactWhatsapp:   product.ContactWhatsapp,
			CanExport:         product.CanExport,
			RequiresLicense:   product.RequiresLicense,
			LicenseType:       product.LicenseType,
			ExportCountries:   product.ExportCountries,
			ImageURLs:         product.ImageURLs,
			VideoURL:          product.VideoURL,
			CatalogURL:        product.CatalogURL,
			Status:            product.Status,
			IsFeatured:        product.IsFeatured,
			IsHotDeal:         product.IsHotDeal,
			Tags:              product.Tags,
			Notes:             product.Notes,
			CreatedAt:         product.CreatedAt,
			UpdatedAt:         product.UpdatedAt,
		}
		responseProducts = append(responseProducts, response)
	}

	c.JSON(http.StatusOK, gin.H{
		"products": responseProducts,
		"pagination": gin.H{
			"page":        page,
			"per_page":    perPage,
			"total":       total,
			"total_pages": (total + int64(perPage) - 1) / int64(perPage),
		},
	})
}

// GetUserAvailableProduct retrieves a single product by the current user
func GetUserAvailableProduct(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	user := c.MustGet("user").(models.User)

	productID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	product, err := models.GetUserAvailableProduct(db, uint(productID), user.ID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	// Convert to response format
	response := models.AvailableProductResponse{
		ID:                product.ID,
		AddedByID:         product.AddedByID,
		ProductName:       product.ProductName,
		Category:          product.Category,
		Subcategory:       product.Subcategory,
		Description:       product.Description,
		WholesalePrice:    product.WholesalePrice,
		RetailPrice:       product.RetailPrice,
		ExportPrice:       product.ExportPrice,
		Currency:          product.Currency,
		AvailableQuantity: product.AvailableQuantity,
		MinOrderQuantity:  product.MinOrderQuantity,
		MaxOrderQuantity:  product.MaxOrderQuantity,
		Unit:              product.Unit,
		Brand:             product.Brand,
		Model:             product.Model,
		Origin:            product.Origin,
		Quality:           product.Quality,
		PackagingType:     product.PackagingType,
		Weight:            product.Weight,
		Dimensions:        product.Dimensions,
		ShippingCost:      product.ShippingCost,
		Location:          product.Location,
		ContactPhone:      product.ContactPhone,
		ContactEmail:      product.ContactEmail,
		ContactWhatsapp:   product.ContactWhatsapp,
		CanExport:         product.CanExport,
		RequiresLicense:   product.RequiresLicense,
		LicenseType:       product.LicenseType,
		ExportCountries:   product.ExportCountries,
		ImageURLs:         product.ImageURLs,
		VideoURL:          product.VideoURL,
		CatalogURL:        product.CatalogURL,
		Status:            product.Status,
		IsFeatured:        product.IsFeatured,
		IsHotDeal:         product.IsHotDeal,
		Tags:              product.Tags,
		Notes:             product.Notes,
		CreatedAt:         product.CreatedAt,
		UpdatedAt:         product.UpdatedAt,
	}

	c.JSON(http.StatusOK, response)
}

// UpdateUserAvailableProduct updates a product by the current user
func UpdateUserAvailableProduct(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	user := c.MustGet("user").(models.User)

	productID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	var req models.UpdateAvailableProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	product, err := models.UpdateUserAvailableProduct(db, uint(productID), user.ID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update product"})
		return
	}

	// Convert to response format
	response := models.AvailableProductResponse{
		ID:                product.ID,
		AddedByID:         product.AddedByID,
		ProductName:       product.ProductName,
		Category:          product.Category,
		Subcategory:       product.Subcategory,
		Description:       product.Description,
		WholesalePrice:    product.WholesalePrice,
		RetailPrice:       product.RetailPrice,
		ExportPrice:       product.ExportPrice,
		Currency:          product.Currency,
		AvailableQuantity: product.AvailableQuantity,
		MinOrderQuantity:  product.MinOrderQuantity,
		MaxOrderQuantity:  product.MaxOrderQuantity,
		Unit:              product.Unit,
		Brand:             product.Brand,
		Model:             product.Model,
		Origin:            product.Origin,
		Quality:           product.Quality,
		PackagingType:     product.PackagingType,
		Weight:            product.Weight,
		Dimensions:        product.Dimensions,
		ShippingCost:      product.ShippingCost,
		Location:          product.Location,
		ContactPhone:      product.ContactPhone,
		ContactEmail:      product.ContactEmail,
		ContactWhatsapp:   product.ContactWhatsapp,
		CanExport:         product.CanExport,
		RequiresLicense:   product.RequiresLicense,
		LicenseType:       product.LicenseType,
		ExportCountries:   product.ExportCountries,
		ImageURLs:         product.ImageURLs,
		VideoURL:          product.VideoURL,
		CatalogURL:        product.CatalogURL,
		Status:            product.Status,
		IsFeatured:        product.IsFeatured,
		IsHotDeal:         product.IsHotDeal,
		Tags:              product.Tags,
		Notes:             product.Notes,
		CreatedAt:         product.CreatedAt,
		UpdatedAt:         product.UpdatedAt,
	}

	c.JSON(http.StatusOK, response)
}

// DeleteUserAvailableProduct deletes a product by the current user
func DeleteUserAvailableProduct(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	user := c.MustGet("user").(models.User)

	productID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	err = models.DeleteUserAvailableProduct(db, uint(productID), user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete product"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Product deleted successfully"})
}

// UpdateAvailableProductStatus updates the status of an available product (Admin only)
func UpdateAvailableProductStatus(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	user := c.MustGet("user").(models.User)

	if !user.IsAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden"})
		return
	}

	productID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	var req struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = models.UpdateAvailableProductStatus(db, uint(productID), req.Status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update product status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Product status updated successfully"})
}

// GetFeaturedAvailableProducts retrieves featured available products
func GetFeaturedAvailableProducts(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	products, err := models.GetFeaturedAvailableProducts(db, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve featured products"})
		return
	}

	// Convert to response format
	var responseProducts []models.AvailableProductResponse
	for _, product := range products {
		response := models.AvailableProductResponse{
			ID:        product.ID,
			AddedByID: product.AddedByID,
			AddedBy: models.UserResponse{
				ID:        product.AddedBy.ID,
				FirstName: product.AddedBy.FirstName,
				LastName:  product.AddedBy.LastName,
				Email:     product.AddedBy.Email,
			},
			SupplierID:        product.SupplierID,
			ProductName:       product.ProductName,
			Category:          product.Category,
			Subcategory:       product.Subcategory,
			Description:       product.Description,
			WholesalePrice:    product.WholesalePrice,
			RetailPrice:       product.RetailPrice,
			ExportPrice:       product.ExportPrice,
			Currency:          product.Currency,
			AvailableQuantity: product.AvailableQuantity,
			MinOrderQuantity:  product.MinOrderQuantity,
			MaxOrderQuantity:  product.MaxOrderQuantity,
			Unit:              product.Unit,
			Brand:             product.Brand,
			Model:             product.Model,
			Origin:            product.Origin,
			Quality:           product.Quality,
			PackagingType:     product.PackagingType,
			Weight:            product.Weight,
			Dimensions:        product.Dimensions,
			ShippingCost:      product.ShippingCost,
			Location:          product.Location,
			ContactPhone:      product.ContactPhone,
			ContactEmail:      product.ContactEmail,
			ContactWhatsapp:   product.ContactWhatsapp,
			CanExport:         product.CanExport,
			RequiresLicense:   product.RequiresLicense,
			LicenseType:       product.LicenseType,
			ExportCountries:   product.ExportCountries,
			ImageURLs:         product.ImageURLs,
			VideoURL:          product.VideoURL,
			CatalogURL:        product.CatalogURL,
			Status:            product.Status,
			IsFeatured:        product.IsFeatured,
			IsHotDeal:         product.IsHotDeal,
			Tags:              product.Tags,
			Notes:             product.Notes,
			CreatedAt:         product.CreatedAt,
			UpdatedAt:         product.UpdatedAt,
		}

		// Add supplier info if available
		if product.Supplier != nil {
			response.Supplier = &models.SupplierResponse{
				ID:        product.Supplier.ID,
				UserID:    product.Supplier.UserID,
				FullName:  product.Supplier.FullName,
				Mobile:    product.Supplier.Mobile,
				BrandName: product.Supplier.BrandName,
				ImageURL:  product.Supplier.ImageURL,
				City:      product.Supplier.City,
				Status:    product.Supplier.Status,
			}
		}

		responseProducts = append(responseProducts, response)
	}

	c.JSON(http.StatusOK, gin.H{"products": responseProducts})
}

// GetHotDealsAvailableProducts retrieves hot deal available products
func GetHotDealsAvailableProducts(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	products, err := models.GetHotDealsAvailableProducts(db, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve hot deals"})
		return
	}

	// Convert to response format
	var responseProducts []models.AvailableProductResponse
	for _, product := range products {
		response := models.AvailableProductResponse{
			ID:        product.ID,
			AddedByID: product.AddedByID,
			AddedBy: models.UserResponse{
				ID:        product.AddedBy.ID,
				FirstName: product.AddedBy.FirstName,
				LastName:  product.AddedBy.LastName,
				Email:     product.AddedBy.Email,
			},
			SupplierID:        product.SupplierID,
			ProductName:       product.ProductName,
			Category:          product.Category,
			Subcategory:       product.Subcategory,
			Description:       product.Description,
			WholesalePrice:    product.WholesalePrice,
			RetailPrice:       product.RetailPrice,
			ExportPrice:       product.ExportPrice,
			Currency:          product.Currency,
			AvailableQuantity: product.AvailableQuantity,
			MinOrderQuantity:  product.MinOrderQuantity,
			MaxOrderQuantity:  product.MaxOrderQuantity,
			Unit:              product.Unit,
			Brand:             product.Brand,
			Model:             product.Model,
			Origin:            product.Origin,
			Quality:           product.Quality,
			PackagingType:     product.PackagingType,
			Weight:            product.Weight,
			Dimensions:        product.Dimensions,
			ShippingCost:      product.ShippingCost,
			Location:          product.Location,
			ContactPhone:      product.ContactPhone,
			ContactEmail:      product.ContactEmail,
			ContactWhatsapp:   product.ContactWhatsapp,
			CanExport:         product.CanExport,
			RequiresLicense:   product.RequiresLicense,
			LicenseType:       product.LicenseType,
			ExportCountries:   product.ExportCountries,
			ImageURLs:         product.ImageURLs,
			VideoURL:          product.VideoURL,
			CatalogURL:        product.CatalogURL,
			Status:            product.Status,
			IsFeatured:        product.IsFeatured,
			IsHotDeal:         product.IsHotDeal,
			Tags:              product.Tags,
			Notes:             product.Notes,
			CreatedAt:         product.CreatedAt,
			UpdatedAt:         product.UpdatedAt,
		}

		// Add supplier info if available
		if product.Supplier != nil {
			response.Supplier = &models.SupplierResponse{
				ID:        product.Supplier.ID,
				UserID:    product.Supplier.UserID,
				FullName:  product.Supplier.FullName,
				Mobile:    product.Supplier.Mobile,
				BrandName: product.Supplier.BrandName,
				ImageURL:  product.Supplier.ImageURL,
				City:      product.Supplier.City,
				Status:    product.Supplier.Status,
			}
		}

		responseProducts = append(responseProducts, response)
	}

	c.JSON(http.StatusOK, gin.H{"products": responseProducts})
}
