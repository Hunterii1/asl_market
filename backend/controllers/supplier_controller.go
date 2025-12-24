package controllers

import (
	"net/http"
	"strconv"

	"asl-market-backend/models"

	"github.com/gin-gonic/gin"
)

// RegisterSupplier handles supplier registration
func RegisterSupplier(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "لطفا ابتدا وارد شوید"})
		return
	}

	userIDUint := userID.(uint)

	// Check if user already has a supplier registration
	existingSupplier, err := models.GetSupplierByUserID(models.GetDB(), userIDUint)
	if err == nil && existingSupplier.ID > 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":    "شما قبلاً به عنوان تأمین‌کننده ثبت‌نام کرده‌اید",
			"supplier": existingSupplier,
		})
		return
	}

	var req models.SupplierRegistrationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "اطلاعات ارسالی نامعتبر است"})
		return
	}

	// Validate required fields
	if req.FullName == "" || req.Mobile == "" || req.City == "" ||
		req.Address == "" || req.WholesaleMinPrice == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "لطفا تمام فیلدهای الزامی را پر کنید"})
		return
	}

	if len(req.Products) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "حداقل یک محصول باید معرفی کنید"})
		return
	}

	// Create supplier
	supplier, err := models.CreateSupplier(models.GetDB(), userIDUint, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ثبت اطلاعات تأمین‌کننده"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":  "درخواست ثبت‌نام تأمین‌کننده با موفقیت ارسال شد. پس از بررسی توسط تیم ما با شما تماس گرفته خواهد شد.",
		"supplier": supplier,
	})
}

// GetMySupplierStatus returns current user's supplier status
func GetMySupplierStatus(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "لطفا ابتدا وارد شوید"})
		return
	}

	userIDUint := userID.(uint)

	supplier, err := models.GetSupplierByUserID(models.GetDB(), userIDUint)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"has_supplier": false,
			"message":      "شما هنوز به عنوان تأمین‌کننده ثبت‌نام نکرده‌اید",
		})
		return
	}

	// Calculate average rating for this supplier
	avgRating, totalRatings, _ := models.GetAverageRatingForUser(models.GetDB(), supplier.UserID)

	// If supplier is featured, always show 5.0 stars regardless of actual rating
	displayRating := avgRating
	if supplier.IsFeatured {
		displayRating = 5.0
	}

	// Convert to response format
	response := models.SupplierResponse{
		ID:                       supplier.ID,
		UserID:                   supplier.UserID,
		FullName:                 supplier.FullName,
		Mobile:                   supplier.Mobile,
		BrandName:                supplier.BrandName,
		ImageURL:                 supplier.ImageURL,
		City:                     supplier.City,
		Address:                  supplier.Address,
		HasRegisteredBusiness:    supplier.HasRegisteredBusiness,
		BusinessRegistrationNum:  supplier.BusinessRegistrationNum,
		HasExportExperience:      supplier.HasExportExperience,
		ExportPrice:              supplier.ExportPrice,
		WholesaleMinPrice:        supplier.WholesaleMinPrice,
		WholesaleHighVolumePrice: supplier.WholesaleHighVolumePrice,
		CanProducePrivateLabel:   supplier.CanProducePrivateLabel,
		Status:                   supplier.Status,
		AdminNotes:               supplier.AdminNotes,
		ApprovedAt:               supplier.ApprovedAt,
		IsFeatured:               supplier.IsFeatured,
		FeaturedAt:               supplier.FeaturedAt,
		AverageRating:            displayRating,
		TotalRatings:             totalRatings,
		CreatedAt:                supplier.CreatedAt,
	}

	c.JSON(http.StatusOK, gin.H{
		"has_supplier": true,
		"supplier":     response,
	})
}

// GetApprovedSuppliers returns list of approved suppliers for users with license (with pagination)
func GetApprovedSuppliers(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "لطفا ابتدا وارد شوید"})
		return
	}

	userIDUint := userID.(uint)

	// Check if user has license
	hasLicense, err := models.CheckUserLicense(models.GetDB(), userIDUint)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در بررسی وضعیت لایسنس"})
		return
	}

	if !hasLicense {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "برای مشاهده تأمین‌کنندگان نیاز به لایسنس معتبر دارید",
			"license_status": gin.H{
				"needs_license": true,
				"has_license":   false,
			},
		})
		return
	}

	// Parse pagination parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "12"))

	// Validate pagination
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 12
	}

	suppliers, total, err := models.GetApprovedSuppliersPaginated(models.GetDB(), page, perPage)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت لیست تأمین‌کنندگان"})
		return
	}

	// Convert to response format
	var suppliersResponse []models.SupplierResponse
	for _, supplier := range suppliers {
		var productsResponse []models.SupplierProductResponse

		// Load products for this supplier
		var products []models.SupplierProduct
		models.GetDB().Where("supplier_id = ?", supplier.ID).Find(&products)

		for _, product := range products {
			productsResponse = append(productsResponse, models.SupplierProductResponse{
				ID:                   product.ID,
				ProductName:          product.ProductName,
				ProductType:          product.ProductType,
				Description:          product.Description,
				NeedsExportLicense:   product.NeedsExportLicense,
				RequiredLicenseType:  product.RequiredLicenseType,
				MonthlyProductionMin: product.MonthlyProductionMin,
				CreatedAt:            product.CreatedAt,
			})
		}

		// Calculate average rating for this supplier
		avgRating, totalRatings, _ := models.GetAverageRatingForUser(models.GetDB(), supplier.UserID)

		// If supplier is featured, always show 5.0 stars regardless of actual rating
		displayRating := avgRating
		if supplier.IsFeatured {
			displayRating = 5.0
		}

		suppliersResponse = append(suppliersResponse, models.SupplierResponse{
			ID:                     supplier.ID,
			UserID:                 supplier.UserID,
			FullName:               supplier.FullName,
			Mobile:                 supplier.Mobile,
			BrandName:              supplier.BrandName,
			ImageURL:               supplier.ImageURL,
			City:                   supplier.City,
			HasRegisteredBusiness:  supplier.HasRegisteredBusiness,
			HasExportExperience:    supplier.HasExportExperience,
			CanProducePrivateLabel: supplier.CanProducePrivateLabel,
			ApprovedAt:             supplier.ApprovedAt,
			IsFeatured:             supplier.IsFeatured,
			FeaturedAt:             supplier.FeaturedAt,
			AverageRating:          displayRating,
			TotalRatings:           totalRatings,
			CreatedAt:              supplier.CreatedAt,
			Products:               productsResponse,
		})
	}

	totalPages := (int(total) + perPage - 1) / perPage

	c.JSON(http.StatusOK, gin.H{
		"suppliers":    suppliersResponse,
		"total":        total,
		"page":         page,
		"per_page":     perPage,
		"total_pages":  totalPages,
		"has_next":     page < totalPages,
		"has_previous": page > 1,
	})
}

// Admin functions for supplier management

// GetSuppliersForAdmin returns paginated list of suppliers for admin
func GetSuppliersForAdmin(c *gin.Context) {
	pageStr := c.DefaultQuery("page", "1")
	statusFilter := c.DefaultQuery("status", "all")
	perPageStr := c.DefaultQuery("per_page", "10")

	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}

	perPage, err := strconv.Atoi(perPageStr)
	if err != nil || perPage < 1 || perPage > 50 {
		perPage = 10
	}

	suppliers, total, err := models.GetSuppliersForAdmin(models.GetDB(), statusFilter, page, perPage)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت لیست تأمین‌کنندگان"})
		return
	}

	// Convert to response format
	var suppliersResponse []models.SupplierResponse
	for _, supplier := range suppliers {
		// Calculate average rating for this supplier
		avgRating, totalRatings, _ := models.GetAverageRatingForUser(models.GetDB(), supplier.UserID)

		// If supplier is featured, always show 5.0 stars regardless of actual rating
		displayRating := avgRating
		if supplier.IsFeatured {
			displayRating = 5.0
		}

		suppliersResponse = append(suppliersResponse, models.SupplierResponse{
			ID:                       supplier.ID,
			UserID:                   supplier.UserID,
			FullName:                 supplier.FullName,
			Mobile:                   supplier.Mobile,
			BrandName:                supplier.BrandName,
			ImageURL:                 supplier.ImageURL,
			City:                     supplier.City,
			Address:                  supplier.Address,
			HasRegisteredBusiness:    supplier.HasRegisteredBusiness,
			BusinessRegistrationNum:  supplier.BusinessRegistrationNum,
			HasExportExperience:      supplier.HasExportExperience,
			ExportPrice:              supplier.ExportPrice,
			WholesaleMinPrice:        supplier.WholesaleMinPrice,
			WholesaleHighVolumePrice: supplier.WholesaleHighVolumePrice,
			CanProducePrivateLabel:   supplier.CanProducePrivateLabel,
			Status:                   supplier.Status,
			AdminNotes:               supplier.AdminNotes,
			ApprovedAt:               supplier.ApprovedAt,
			IsFeatured:               supplier.IsFeatured,
			FeaturedAt:               supplier.FeaturedAt,
			AverageRating:            displayRating,
			TotalRatings:             totalRatings,
			CreatedAt:                supplier.CreatedAt,
		})
	}

	totalPages := (int(total) + perPage - 1) / perPage

	c.JSON(http.StatusOK, gin.H{
		"suppliers":   suppliersResponse,
		"total":       total,
		"page":        page,
		"per_page":    perPage,
		"total_pages": totalPages,
		"has_next":    page < totalPages,
		"has_prev":    page > 1,
	})
}

// ApproveSupplier approves a supplier (admin only)
func ApproveSupplier(c *gin.Context) {
	supplierIDStr := c.Param("id")
	supplierID, err := strconv.ParseUint(supplierIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه تأمین‌کننده نامعتبر است"})
		return
	}

	adminID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "دسترسی غیرمجاز"})
		return
	}

	var req struct {
		Notes string `json:"notes"`
	}
	c.ShouldBindJSON(&req)

	err = models.ApproveSupplier(models.GetDB(), uint(supplierID), adminID.(uint), req.Notes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در تأیید تأمین‌کننده"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "تأمین‌کننده با موفقیت تأیید شد",
	})
}

// RejectSupplier rejects a supplier (admin only)
func RejectSupplier(c *gin.Context) {
	supplierIDStr := c.Param("id")
	supplierID, err := strconv.ParseUint(supplierIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه تأمین‌کننده نامعتبر است"})
		return
	}

	adminID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "دسترسی غیرمجاز"})
		return
	}

	var req struct {
		Notes string `json:"notes" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "لطفا دلیل رد را وارد کنید"})
		return
	}

	err = models.RejectSupplier(models.GetDB(), uint(supplierID), adminID.(uint), req.Notes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در رد تأمین‌کننده"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "تأمین‌کننده رد شد",
	})
}

// UpdateMySupplier allows user to update their own supplier information
func UpdateMySupplier(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "لطفا ابتدا وارد شوید"})
		return
	}

	userIDUint := userID.(uint)

	// Get current supplier
	supplier, err := models.GetSupplierByUserID(models.GetDB(), userIDUint)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "اطلاعات تأمین‌کننده یافت نشد"})
		return
	}

	var req models.SupplierRegistrationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "اطلاعات ارسالی نامعتبر است"})
		return
	}

	// Validate required fields
	if req.FullName == "" || req.Mobile == "" || req.City == "" ||
		req.Address == "" || req.WholesaleMinPrice == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "لطفا تمام فیلدهای الزامی را پر کنید"})
		return
	}

	if len(req.Products) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "حداقل یک محصول باید معرفی کنید"})
		return
	}

	// Start transaction
	tx := models.GetDB().Begin()
	if tx.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در شروع تراکنش"})
		return
	}

	// Update supplier information
	updates := map[string]interface{}{
		"full_name":                   req.FullName,
		"mobile":                      req.Mobile,
		"brand_name":                  req.BrandName,
		"image_url":                   req.ImageURL,
		"city":                        req.City,
		"address":                     req.Address,
		"has_registered_business":     req.HasRegisteredBusiness,
		"business_registration_num":   req.BusinessRegistrationNum,
		"has_export_experience":       req.HasExportExperience,
		"export_price":                req.ExportPrice,
		"wholesale_min_price":         req.WholesaleMinPrice,
		"wholesale_high_volume_price": req.WholesaleHighVolumePrice,
		"can_produce_private_label":   req.CanProducePrivateLabel,
		"status":                      "pending", // Reset to pending after update
		"admin_notes":                 "",        // Clear admin notes
		"approved_at":                 nil,       // Clear approval
		"approved_by":                 nil,       // Clear approver
	}

	err = tx.Model(&models.Supplier{}).Where("id = ?", supplier.ID).Updates(updates).Error
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در به‌روزرسانی اطلاعات تأمین‌کننده"})
		return
	}

	// Delete existing products
	err = tx.Where("supplier_id = ?", supplier.ID).Delete(&models.SupplierProduct{}).Error
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در حذف محصولات قبلی"})
		return
	}

	// Create new products
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
			c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ایجاد محصولات جدید"})
			return
		}
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در تأیید تراکنش"})
		return
	}

	// Get updated supplier
	updatedSupplier, err := models.GetSupplierByUserID(models.GetDB(), userIDUint)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت اطلاعات به‌روزرسانی شده"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "اطلاعات تأمین‌کننده با موفقیت به‌روزرسانی شد. پس از بررسی مجدد توسط تیم ما، وضعیت شما اعلام خواهد شد.",
		"supplier": updatedSupplier,
	})
}

// DeleteMySupplier allows user to delete their own supplier registration
func DeleteMySupplier(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "لطفا ابتدا وارد شوید"})
		return
	}

	userIDUint := userID.(uint)

	// Delete supplier (this will check ownership automatically in the model function)
	err := models.DeleteSupplierByUserID(models.GetDB(), userIDUint)
	if err != nil {
		if err.Error() == "record not found" || err.Error() == "gorm.ErrRecordNotFound" {
			c.JSON(http.StatusNotFound, gin.H{"error": "اطلاعات تأمین‌کننده یافت نشد"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در حذف اطلاعات تأمین‌کننده"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "اطلاعات تأمین‌کننده با موفقیت حذف شد",
	})
}
