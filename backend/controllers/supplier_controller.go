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

	// Convert to response format
	response := models.SupplierResponse{
		ID:                       supplier.ID,
		UserID:                   supplier.UserID,
		FullName:                 supplier.FullName,
		Mobile:                   supplier.Mobile,
		BrandName:                supplier.BrandName,
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
		CreatedAt:                supplier.CreatedAt,
	}

	c.JSON(http.StatusOK, gin.H{
		"has_supplier": true,
		"supplier":     response,
	})
}

// GetApprovedSuppliers returns list of approved suppliers for users with license
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

	suppliers, err := models.GetApprovedSuppliers(models.GetDB())
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

		suppliersResponse = append(suppliersResponse, models.SupplierResponse{
			ID:                     supplier.ID,
			UserID:                 supplier.UserID,
			FullName:               supplier.FullName,
			Mobile:                 supplier.Mobile,
			BrandName:              supplier.BrandName,
			City:                   supplier.City,
			HasRegisteredBusiness:  supplier.HasRegisteredBusiness,
			HasExportExperience:    supplier.HasExportExperience,
			CanProducePrivateLabel: supplier.CanProducePrivateLabel,
			ApprovedAt:             supplier.ApprovedAt,
			CreatedAt:              supplier.CreatedAt,
			Products:               productsResponse,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"suppliers": suppliersResponse,
		"total":     len(suppliersResponse),
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
		suppliersResponse = append(suppliersResponse, models.SupplierResponse{
			ID:                       supplier.ID,
			UserID:                   supplier.UserID,
			FullName:                 supplier.FullName,
			Mobile:                   supplier.Mobile,
			BrandName:                supplier.BrandName,
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
