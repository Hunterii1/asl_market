package controllers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"asl-market-backend/models"
	"asl-market-backend/services"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// MatchingController handles matching-related requests
type MatchingController struct {
	db              *gorm.DB
	matchingService *services.MatchingService
}

// NewMatchingController creates a new matching controller
func NewMatchingController(db *gorm.DB) *MatchingController {
	return &MatchingController{
		db:              db,
		matchingService: services.NewMatchingService(db),
	}
}

// CreateMatchingRequest creates a new matching request (Supplier)
func (mc *MatchingController) CreateMatchingRequest(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "لطفا ابتدا وارد شوید"})
		return
	}

	userIDUint := userID.(uint)

	// Check if user has an approved supplier
	supplier, err := models.GetSupplierByUserID(mc.db, userIDUint)
	if err != nil || supplier.Status != "approved" {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "شما باید تأمین‌کننده تأیید شده باشید تا بتوانید درخواست Matching ایجاد کنید",
		})
		return
	}

	var req models.CreateMatchingRequestRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "اطلاعات ارسالی نامعتبر است",
			"details": err.Error(),
		})
		return
	}

	// Validate product_id belongs to this supplier
	if req.ProductID != nil {
		var product models.SupplierProduct
		if err := mc.db.Where("id = ? AND supplier_id = ?", *req.ProductID, supplier.ID).First(&product).Error; err != nil {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "محصول انتخاب شده متعلق به شما نیست",
			})
			return
		}
		// Use product name if not provided
		if req.ProductName == "" {
			req.ProductName = product.ProductName
		}
	}

	// Create matching request
	matchingRequest, err := models.CreateMatchingRequest(mc.db, userIDUint, supplier.ID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "خطا در ایجاد درخواست Matching",
		})
		return
	}

	// Process matching in background
	go func() {
		// Load full request with relations
		fullRequest, err := models.GetMatchingRequestByID(mc.db, matchingRequest.ID)
		if err == nil {
			mc.matchingService.ProcessMatchingRequest(fullRequest)
		}
	}()

	c.JSON(http.StatusCreated, gin.H{
		"message":          "درخواست Matching با موفقیت ایجاد شد. ویزیتورهای مناسب به زودی مطلع خواهند شد.",
		"matching_request": matchingRequest,
	})
}

// GetMyMatchingRequests gets all matching requests for the current supplier
func (mc *MatchingController) GetMyMatchingRequests(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "لطفا ابتدا وارد شوید"})
		return
	}

	userIDUint := userID.(uint)

	// Get supplier
	supplier, err := models.GetSupplierByUserID(mc.db, userIDUint)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "شما تأمین‌کننده نیستید",
		})
		return
	}

	// Get query parameters
	status := c.DefaultQuery("status", "all")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "10"))

	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 10
	}

	// Get matching requests
	requests, total, err := models.GetMatchingRequestsBySupplier(mc.db, supplier.ID, status, page, perPage)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "خطا در دریافت درخواست‌ها",
		})
		return
	}

	// Convert to response format
	var responseRequests []models.MatchingRequestResponse
	for _, req := range requests {
		remainingTime := ""
		isExpired := false
		if req.ExpiresAt.After(time.Now()) {
			remaining := time.Until(req.ExpiresAt)
			days := int(remaining.Hours() / 24)
			hours := int(remaining.Hours()) % 24
			remainingTime = fmt.Sprintf("%d روز و %d ساعت", days, hours)
		} else {
			isExpired = true
			remainingTime = "منقضی شده"
		}

		responseRequests = append(responseRequests, models.MatchingRequestResponse{
			ID:                   req.ID,
			SupplierID:           req.SupplierID,
			UserID:               req.UserID, // Include user_id for ownership check
			ProductName:          req.ProductName,
			ProductID:            req.ProductID,
			Quantity:             req.Quantity,
			Unit:                 req.Unit,
			DestinationCountries: req.DestinationCountries,
			Price:                req.Price,
			Currency:             req.Currency,
			PaymentTerms:         req.PaymentTerms,
			DeliveryTime:         req.DeliveryTime,
			Description:          req.Description,
			ExpiresAt:            req.ExpiresAt,
			Status:               req.Status,
			MatchedVisitorCount:  req.MatchedVisitorCount,
			AcceptedVisitorID:    req.AcceptedVisitorID,
			AcceptedAt:           req.AcceptedAt,
			RemainingTime:        remainingTime,
			IsExpired:            isExpired,
			CreatedAt:            req.CreatedAt,
			UpdatedAt:            req.UpdatedAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"data":        responseRequests,
		"total":       total,
		"page":        page,
		"per_page":    perPage,
		"total_pages": (int(total) + perPage - 1) / perPage,
	})
}

// GetMatchingRequestDetails gets details of a specific matching request
func (mc *MatchingController) GetMatchingRequestDetails(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "لطفا ابتدا وارد شوید"})
		return
	}

	requestID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه درخواست نامعتبر است"})
		return
	}

	// Get matching request
	request, err := models.GetMatchingRequestByID(mc.db, uint(requestID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "درخواست یافت نشد"})
		return
	}

	// Check authorization - user must be the supplier, a matched visitor, or an approved visitor who can view available requests
	userIDUint := userID.(uint)
	isAuthorized := false

	// Check if user is the supplier
	if request.UserID == userIDUint {
		isAuthorized = true
	}

	// Check if user is a visitor who responded
	if !isAuthorized {
		for _, response := range request.Responses {
			if response.UserID == userIDUint {
				isAuthorized = true
				break
			}
		}
	}

	// Check if user is an approved visitor who can view this request (even if they haven't responded yet)
	if !isAuthorized {
		visitor, err := models.GetVisitorByUserID(mc.db, userIDUint)
		if err == nil && visitor.Status == "approved" {
			// Check if this request matches visitor's destination cities
			if mc.matchingService.CanVisitorViewRequest(visitor, request) {
				isAuthorized = true
			}
		}
	}

	if !isAuthorized {
		c.JSON(http.StatusForbidden, gin.H{"error": "شما دسترسی به این درخواست ندارید"})
		return
	}

	// Calculate remaining time
	remainingTime := ""
	isExpired := false
	if request.ExpiresAt.After(time.Now()) {
		remaining := time.Until(request.ExpiresAt)
		days := int(remaining.Hours() / 24)
		hours := int(remaining.Hours()) % 24
		remainingTime = fmt.Sprintf("%d روز و %d ساعت", days, hours)
	} else {
		isExpired = true
		remainingTime = "منقضی شده"
	}

	// Convert responses
	var responseResponses []models.MatchingResponseResponse
	for _, resp := range request.Responses {
		responseResponses = append(responseResponses, models.MatchingResponseResponse{
			ID:                resp.ID,
			MatchingRequestID: resp.MatchingRequestID,
			VisitorID:         resp.VisitorID,
			ResponseType:      resp.ResponseType,
			Message:           resp.Message,
			Status:            resp.Status,
			CreatedAt:         resp.CreatedAt,
		})
	}

	// Convert supplier to response format
	var supplierResponse models.SupplierResponse
	if request.Supplier.ID > 0 {
		supplierResponse = models.SupplierResponse{
			ID:        request.Supplier.ID,
			UserID:    request.Supplier.UserID,
			FullName:  request.Supplier.FullName,
			Mobile:    request.Supplier.Mobile,
			BrandName: request.Supplier.BrandName,
			ImageURL:  request.Supplier.ImageURL,
			City:      request.Supplier.City,
			Address:   request.Supplier.Address,
			Status:    request.Supplier.Status,
		}
	}

	response := models.MatchingRequestResponse{
		ID:                   request.ID,
		SupplierID:           request.SupplierID,
		UserID:               request.UserID, // Include user_id so frontend can check ownership
		Supplier:             supplierResponse,
		ProductName:          request.ProductName,
		ProductID:            request.ProductID,
		Quantity:             request.Quantity,
		Unit:                 request.Unit,
		DestinationCountries: request.DestinationCountries,
		Price:                request.Price,
		Currency:             request.Currency,
		PaymentTerms:         request.PaymentTerms,
		DeliveryTime:         request.DeliveryTime,
		Description:          request.Description,
		ExpiresAt:            request.ExpiresAt,
		Status:               request.Status,
		MatchedVisitorCount:  request.MatchedVisitorCount,
		AcceptedVisitorID:    request.AcceptedVisitorID,
		AcceptedAt:           request.AcceptedAt,
		RemainingTime:        remainingTime,
		IsExpired:            isExpired,
		Responses:            responseResponses,
		CreatedAt:            request.CreatedAt,
		UpdatedAt:            request.UpdatedAt,
	}

	c.JSON(http.StatusOK, gin.H{
		"data": response,
	})
}

// UpdateMatchingRequest updates a matching request (Supplier)
func (mc *MatchingController) UpdateMatchingRequest(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "لطفا ابتدا وارد شوید"})
		return
	}

	userIDUint := userID.(uint)

	requestID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه درخواست نامعتبر است"})
		return
	}

	// Get matching request
	request, err := models.GetMatchingRequestByID(mc.db, uint(requestID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "درخواست یافت نشد"})
		return
	}

	// Check ownership
	if request.UserID != userIDUint {
		c.JSON(http.StatusForbidden, gin.H{"error": "شما دسترسی به این درخواست ندارید"})
		return
	}

	// Can't update if already accepted or completed
	if request.Status == "accepted" || request.Status == "completed" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "نمی‌توانید درخواست پذیرفته شده یا تکمیل شده را ویرایش کنید",
		})
		return
	}

	var req models.UpdateMatchingRequestRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "اطلاعات ارسالی نامعتبر است",
			"details": err.Error(),
		})
		return
	}

	// Update fields
	updates := make(map[string]interface{})
	if req.ProductName != "" {
		updates["product_name"] = req.ProductName
	}
	if req.ProductID != nil {
		updates["product_id"] = req.ProductID
	}
	if req.Quantity != "" {
		updates["quantity"] = req.Quantity
	}
	if req.Unit != "" {
		updates["unit"] = req.Unit
	}
	if req.DestinationCountries != "" {
		updates["destination_countries"] = req.DestinationCountries
	}
	if req.Price != "" {
		updates["price"] = req.Price
	}
	if req.Currency != "" {
		updates["currency"] = req.Currency
	}
	if req.PaymentTerms != "" {
		updates["payment_terms"] = req.PaymentTerms
	}
	if req.DeliveryTime != "" {
		updates["delivery_time"] = req.DeliveryTime
	}
	if req.Description != "" {
		updates["description"] = req.Description
	}
	if req.ExpiresAt != "" {
		expiresAt, err := time.Parse(time.RFC3339, req.ExpiresAt)
		if err == nil && expiresAt.After(time.Now()) {
			updates["expires_at"] = expiresAt
		}
	}

	if err := mc.db.Model(&models.MatchingRequest{}).Where("id = ?", requestID).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "خطا در بروزرسانی درخواست",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "درخواست با موفقیت بروزرسانی شد",
	})
}

// CancelMatchingRequest cancels a matching request (Supplier)
func (mc *MatchingController) CancelMatchingRequest(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "لطفا ابتدا وارد شوید"})
		return
	}

	userIDUint := userID.(uint)

	requestID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه درخواست نامعتبر است"})
		return
	}

	if err := models.CancelMatchingRequest(mc.db, uint(requestID), userIDUint); err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "درخواست یافت نشد"})
			return
		}
		if err == gorm.ErrInvalidValue {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "نمی‌توانید درخواست پذیرفته شده یا تکمیل شده را لغو کنید",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "خطا در لغو درخواست",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "درخواست با موفقیت لغو شد",
	})
}

// ExtendMatchingRequest extends the expiration time of a matching request (Supplier)
func (mc *MatchingController) ExtendMatchingRequest(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "لطفا ابتدا وارد شوید"})
		return
	}

	userIDUint := userID.(uint)

	requestID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه درخواست نامعتبر است"})
		return
	}

	var req struct {
		ExpiresAt string `json:"expires_at" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "اطلاعات ارسالی نامعتبر است",
			"details": err.Error(),
		})
		return
	}

	expiresAt, err := time.Parse(time.RFC3339, req.ExpiresAt)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "فرمت تاریخ نامعتبر است. از فرمت ISO 8601 استفاده کنید",
		})
		return
	}

	if err := models.ExtendMatchingRequest(mc.db, uint(requestID), userIDUint, expiresAt); err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "درخواست یافت نشد"})
			return
		}
		if err == gorm.ErrInvalidValue {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "تاریخ انقضا باید در آینده باشد",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "خطا در تمدید درخواست",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "زمان انقضای درخواست با موفقیت تمدید شد",
	})
}

// GetAvailableMatchingRequests gets available matching requests for a visitor
func (mc *MatchingController) GetAvailableMatchingRequests(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "لطفا ابتدا وارد شوید"})
		return
	}

	userIDUint := userID.(uint)

	// Check if user has an approved visitor
	visitor, err := models.GetVisitorByUserID(mc.db, userIDUint)
	if err != nil || visitor.Status != "approved" {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "شما باید ویزیتور تأیید شده باشید تا بتوانید درخواست‌های Matching را مشاهده کنید",
		})
		return
	}

	// Get query parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "10"))

	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 10
	}

	// Get available matching requests
	requests, total, err := models.GetAvailableMatchingRequestsForVisitor(mc.db, visitor.ID, page, perPage)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "خطا در دریافت درخواست‌ها",
		})
		return
	}

	// Convert to response format
	var responseRequests []models.MatchingRequestResponse
	for _, req := range requests {
		remainingTime := ""
		isExpired := false
		if req.ExpiresAt.After(time.Now()) {
			remaining := time.Until(req.ExpiresAt)
			days := int(remaining.Hours() / 24)
			hours := int(remaining.Hours()) % 24
			remainingTime = fmt.Sprintf("%d روز و %d ساعت", days, hours)
		} else {
			isExpired = true
			remainingTime = "منقضی شده"
		}

		// Convert supplier to response format
		var supplierResponse models.SupplierResponse
		if req.Supplier.ID > 0 {
			supplierResponse = models.SupplierResponse{
				ID:        req.Supplier.ID,
				UserID:    req.Supplier.UserID,
				FullName:  req.Supplier.FullName,
				Mobile:    req.Supplier.Mobile,
				BrandName: req.Supplier.BrandName,
				ImageURL:  req.Supplier.ImageURL,
				City:      req.Supplier.City,
				Status:    req.Supplier.Status,
			}
		}

		responseRequests = append(responseRequests, models.MatchingRequestResponse{
			ID:                   req.ID,
			SupplierID:           req.SupplierID,
			UserID:               req.UserID, // Include user_id for ownership check
			Supplier:             supplierResponse,
			ProductName:          req.ProductName,
			ProductID:            req.ProductID,
			Quantity:             req.Quantity,
			Unit:                 req.Unit,
			DestinationCountries: req.DestinationCountries,
			Price:                req.Price,
			Currency:             req.Currency,
			PaymentTerms:         req.PaymentTerms,
			DeliveryTime:         req.DeliveryTime,
			Description:          req.Description,
			ExpiresAt:            req.ExpiresAt,
			Status:               req.Status,
			MatchedVisitorCount:  req.MatchedVisitorCount,
			AcceptedVisitorID:    req.AcceptedVisitorID,
			AcceptedAt:           req.AcceptedAt,
			RemainingTime:        remainingTime,
			IsExpired:            isExpired,
			CreatedAt:            req.CreatedAt,
			UpdatedAt:            req.UpdatedAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"data":        responseRequests,
		"total":       total,
		"page":        page,
		"per_page":    perPage,
		"total_pages": (int(total) + perPage - 1) / perPage,
	})
}

// RespondToMatchingRequest responds to a matching request (Visitor)
func (mc *MatchingController) RespondToMatchingRequest(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "لطفا ابتدا وارد شوید"})
		return
	}

	userIDUint := userID.(uint)

	// Check if user has an approved visitor
	visitor, err := models.GetVisitorByUserID(mc.db, userIDUint)
	if err != nil || visitor.Status != "approved" {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "شما باید ویزیتور تأیید شده باشید",
		})
		return
	}

	requestID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه درخواست نامعتبر است"})
		return
	}

	// Check if request exists and is still active
	request, err := models.GetMatchingRequestByID(mc.db, uint(requestID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "درخواست یافت نشد"})
		return
	}

	if request.Status != "pending" && request.Status != "active" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "این درخواست دیگر فعال نیست",
		})
		return
	}

	if request.ExpiresAt.Before(time.Now()) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "این درخواست منقضی شده است",
		})
		return
	}

	var req models.MatchingResponseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "اطلاعات ارسالی نامعتبر است",
			"details": err.Error(),
		})
		return
	}

	// Create response
	response, err := models.CreateMatchingResponse(mc.db, uint(requestID), visitor.ID, userIDUint, req)
	if err != nil {
		if err == gorm.ErrInvalidValue {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "نوع پاسخ نامعتبر است یا پیام برای سوال الزامی است",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "خطا در ثبت پاسخ",
		})
		return
	}

	// If accepted, send notification to supplier
	if req.ResponseType == "accepted" {
		// Create notification for supplier
		supplierUserID := request.UserID
		notification := models.Notification{
			UserID:      &supplierUserID,
			Title:       "درخواست Matching شما پذیرفته شد",
			Message:     fmt.Sprintf("ویزیتور %s درخواست شما برای %s را پذیرفته است", visitor.FullName, request.ProductName),
			Type:        "matching",
			Priority:    "high",
			IsRead:      false,
			CreatedByID: userIDUint, // System notification
			ActionURL:   fmt.Sprintf("/matching/requests/%d", request.ID),
		}
		mc.db.Create(&notification)
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":  "پاسخ شما با موفقیت ثبت شد",
		"response": response,
	})
}

// CreateMatchingRating creates a rating for a completed matching request
func (mc *MatchingController) CreateMatchingRating(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "لطفا ابتدا وارد شوید"})
		return
	}

	userIDUint := userID.(uint)

	requestID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه درخواست نامعتبر است"})
		return
	}

	// Get matching request
	request, err := models.GetMatchingRequestByID(mc.db, uint(requestID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "درخواست یافت نشد"})
		return
	}

	// Check if request is completed or accepted
	if request.Status != "accepted" && request.Status != "completed" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "فقط می‌توانید به درخواست‌های پذیرفته شده یا تکمیل شده امتیاز دهید",
		})
		return
	}

	// Determine rater and rated
	var raterID, ratedID uint
	var raterType, ratedType string

	// Check if user is supplier
	if request.UserID == userIDUint {
		raterID = userIDUint
		raterType = "supplier"
		if request.AcceptedVisitorID != nil {
			visitor, _ := models.GetVisitorByUserID(mc.db, *request.AcceptedVisitorID)
			if visitor != nil {
				ratedID = visitor.UserID
				ratedType = "visitor"
			}
		}
	} else if request.AcceptedVisitorID != nil {
		// User is visitor
		visitor, _ := models.GetVisitorByUserID(mc.db, *request.AcceptedVisitorID)
		if visitor != nil && visitor.UserID == userIDUint {
			raterID = userIDUint
			raterType = "visitor"
			ratedID = request.UserID
			ratedType = "supplier"
		}
	}

	if raterID == 0 || ratedID == 0 {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "شما دسترسی به امتیازدهی این درخواست را ندارید",
		})
		return
	}

	var req models.MatchingRatingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "اطلاعات ارسالی نامعتبر است",
			"details": err.Error(),
		})
		return
	}

	// Create rating
	rating, err := models.CreateMatchingRating(mc.db, uint(requestID), raterID, ratedID, raterType, ratedType, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "خطا در ثبت امتیاز",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "امتیاز شما با موفقیت ثبت شد",
		"rating":  rating,
	})
}

// GetSuggestedVisitors gets suggested visitors for a matching request (for supplier)
func (mc *MatchingController) GetSuggestedVisitors(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "لطفا ابتدا وارد شوید"})
		return
	}

	requestID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه درخواست نامعتبر است"})
		return
	}

	// Get matching request
	request, err := models.GetMatchingRequestByID(mc.db, uint(requestID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "درخواست یافت نشد"})
		return
	}

	// Check ownership
	if request.UserID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "شما دسترسی به این درخواست ندارید"})
		return
	}

	// Find matching visitors
	visitors, err := mc.matchingService.FindMatchingVisitors(request)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "خطا در یافتن ویزیتورهای مناسب",
		})
		return
	}

	// Convert to response format
	var responseVisitors []models.VisitorResponse
	for _, visitor := range visitors {
		responseVisitors = append(responseVisitors, models.VisitorResponse{
			ID:                            visitor.ID,
			UserID:                        visitor.UserID,
			FullName:                      visitor.FullName,
			NationalID:                    visitor.NationalID,
			PassportNumber:                visitor.PassportNumber,
			BirthDate:                     visitor.BirthDate,
			Mobile:                        visitor.Mobile,
			WhatsappNumber:                visitor.WhatsappNumber,
			Email:                         visitor.Email,
			ResidenceAddress:              visitor.ResidenceAddress,
			CityProvince:                  visitor.CityProvince,
			DestinationCities:             visitor.DestinationCities,
			HasLocalContact:               visitor.HasLocalContact,
			LocalContactDetails:           visitor.LocalContactDetails,
			BankAccountIBAN:               visitor.BankAccountIBAN,
			BankName:                      visitor.BankName,
			AccountHolderName:             visitor.AccountHolderName,
			HasMarketingExperience:        visitor.HasMarketingExperience,
			MarketingExperienceDesc:       visitor.MarketingExperienceDesc,
			LanguageLevel:                 visitor.LanguageLevel,
			SpecialSkills:                 visitor.SpecialSkills,
			InterestedProducts:            visitor.InterestedProducts,
			AgreesToUseApprovedProducts:   visitor.AgreesToUseApprovedProducts,
			AgreesToViolationConsequences: visitor.AgreesToViolationConsequences,
			AgreesToSubmitReports:         visitor.AgreesToSubmitReports,
			DigitalSignature:              visitor.DigitalSignature,
			SignatureDate:                 visitor.SignatureDate,
			Status:                        visitor.Status,
			AdminNotes:                    visitor.AdminNotes,
			ApprovedAt:                    visitor.ApprovedAt,
			IsFeatured:                    visitor.IsFeatured,
			FeaturedAt:                    visitor.FeaturedAt,
			CreatedAt:                     visitor.CreatedAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  responseVisitors,
		"total": len(responseVisitors),
	})
}

// GetMatchingChatMessages gets all messages for a matching chat
func (mc *MatchingController) GetMatchingChatMessages(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "لطفا ابتدا وارد شوید"})
		return
	}

	userIDUint := userID.(uint)

	requestID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه درخواست نامعتبر است"})
		return
	}

	// Get or create chat
	chat, err := models.GetOrCreateMatchingChat(mc.db, uint(requestID))
	if err != nil {
		if err == gorm.ErrInvalidValue {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "این درخواست accepted نشده است یا شما دسترسی ندارید",
			})
			return
		}
		c.JSON(http.StatusNotFound, gin.H{"error": "چت یافت نشد"})
		return
	}

	// Verify user has access to this chat
	if chat.SupplierUserID != userIDUint && chat.VisitorUserID != userIDUint {
		c.JSON(http.StatusForbidden, gin.H{"error": "شما دسترسی به این چت ندارید"})
		return
	}

	// Get pagination params
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "50"))

	// Get messages
	messages, total, err := models.GetMatchingChatMessages(mc.db, chat.ID, page, perPage)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت پیام‌ها"})
		return
	}

	// Mark messages as read
	go models.MarkMatchingMessagesAsRead(mc.db, chat.ID, userIDUint)

	// Convert to response format
	var responseMessages []models.MatchingMessageResponse
	for _, msg := range messages {
		responseMessages = append(responseMessages, models.MatchingMessageResponse{
			ID:             msg.ID,
			MatchingChatID: msg.MatchingChatID,
			SenderID:       msg.SenderID,
			SenderName:     msg.Sender.Name(),
			SenderType:     msg.SenderType,
			Message:        msg.Message,
			ImageURL:       msg.ImageURL,
			IsRead:         msg.IsRead,
			ReadAt:         msg.ReadAt,
			CreatedAt:      msg.CreatedAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"messages": responseMessages,
		"pagination": gin.H{
			"page":        page,
			"per_page":    perPage,
			"total":       total,
			"total_pages": (total + int64(perPage) - 1) / int64(perPage),
		},
	})
}

// SendMatchingChatMessage sends a message in a matching chat
func (mc *MatchingController) SendMatchingChatMessage(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "لطفا ابتدا وارد شوید"})
		return
	}

	userIDUint := userID.(uint)

	requestID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه درخواست نامعتبر است"})
		return
	}

	// Get or create chat
	chat, err := models.GetOrCreateMatchingChat(mc.db, uint(requestID))
	if err != nil {
		if err == gorm.ErrInvalidValue {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "این درخواست accepted نشده است",
			})
			return
		}
		c.JSON(http.StatusNotFound, gin.H{"error": "چت یافت نشد"})
		return
	}

	// Determine sender type
	var senderType string
	if chat.SupplierUserID == userIDUint {
		senderType = "supplier"
	} else if chat.VisitorUserID == userIDUint {
		senderType = "visitor"
	} else {
		c.JSON(http.StatusForbidden, gin.H{"error": "شما دسترسی به این چت ندارید"})
		return
	}

	var req models.SendMatchingMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "اطلاعات ارسالی نامعتبر است",
			"details": err.Error(),
		})
		return
	}

	// Create message
	message, err := models.CreateMatchingMessage(mc.db, chat.ID, userIDUint, senderType, req.Message, req.ImageURL)
	if err != nil {
		if err == gorm.ErrInvalidValue {
			c.JSON(http.StatusForbidden, gin.H{"error": "شما دسترسی به این چت ندارید"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ارسال پیام"})
		return
	}

	// Send push notification to the other party
	pushService := services.GetPushNotificationService()
	var recipientID uint
	if senderType == "supplier" {
		recipientID = chat.VisitorUserID
	} else {
		recipientID = chat.SupplierUserID
	}

	pushMessage := services.PushMessage{
		Title:   "پیام جدید در چت Matching",
		Message: fmt.Sprintf("پیام جدید از %s", message.Sender.Name()),
		Icon:    "/pwa.png",
		Tag:     fmt.Sprintf("matching-chat-%d", chat.ID),
		Data: map[string]interface{}{
			"url":  fmt.Sprintf("/matching/requests/%d/chat", requestID),
			"type": "matching_chat",
		},
	}
	go pushService.SendPushNotification(recipientID, pushMessage)

	// Convert to response
	response := models.MatchingMessageResponse{
		ID:             message.ID,
		MatchingChatID: message.MatchingChatID,
		SenderID:       message.SenderID,
		SenderName:     message.Sender.Name(),
		SenderType:     message.SenderType,
		Message:        message.Message,
		ImageURL:       message.ImageURL,
		IsRead:         message.IsRead,
		ReadAt:         message.ReadAt,
		CreatedAt:      message.CreatedAt,
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": response,
	})
}

// GetMatchingChatConversations gets all chat conversations for the current user
func (mc *MatchingController) GetMatchingChatConversations(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "لطفا ابتدا وارد شوید"})
		return
	}

	userIDUint := userID.(uint)

	// Get pagination params
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))

	// Get chats
	chats, total, err := models.GetMatchingChatsForUser(mc.db, userIDUint, page, perPage)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت مکالمات"})
		return
	}

	// Convert to response format
	var responseChats []models.MatchingChatResponse
	for _, chat := range chats {
		// Get unread count
		var unreadCount int64
		mc.db.Model(&models.MatchingMessage{}).
			Where("matching_chat_id = ? AND sender_id != ? AND is_read = ?", chat.ID, userIDUint, false).
			Count(&unreadCount)

		// Get last message
		var lastMessage models.MatchingMessage
		var lastMessageText string
		var lastMessageAt *time.Time
		if err := mc.db.Where("matching_chat_id = ?", chat.ID).
			Order("created_at DESC").First(&lastMessage).Error; err == nil {
			// Show image indicator if message has image
			if lastMessage.ImageURL != "" {
				if lastMessage.Message != "" {
					lastMessageText = "📷 " + lastMessage.Message
				} else {
					lastMessageText = "📷 تصویر"
				}
			} else {
				lastMessageText = lastMessage.Message
			}
			lastMessageAt = &lastMessage.CreatedAt
		}

		responseChats = append(responseChats, models.MatchingChatResponse{
			ID:                chat.ID,
			MatchingRequestID: chat.MatchingRequestID,
			SupplierID:        chat.SupplierID,
			SupplierName:      chat.Supplier.FullName,
			VisitorID:         chat.VisitorID,
			VisitorName:       chat.Visitor.FullName,
			IsActive:          chat.IsActive,
			LastMessage:       lastMessageText,
			LastMessageAt:     lastMessageAt,
			UnreadCount:       int(unreadCount),
			CreatedAt:         chat.CreatedAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"conversations": responseChats,
		"pagination": gin.H{
			"page":        page,
			"per_page":    perPage,
			"total":       total,
			"total_pages": (total + int64(perPage) - 1) / int64(perPage),
		},
	})
}

// GetMatchingRatingsByUser gets all ratings for a user
func (mc *MatchingController) GetMatchingRatingsByUser(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "لطفا ابتدا وارد شوید"})
		return
	}

	userIDUint := userID.(uint)

	// Get pagination params
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))

	// Get ratings
	ratings, total, err := models.GetMatchingRatingsByUser(mc.db, userIDUint, page, perPage)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت امتیازها"})
		return
	}

	// Convert to response format
	var responseRatings []models.MatchingRatingResponse
	for _, rating := range ratings {
		responseRatings = append(responseRatings, models.MatchingRatingResponse{
			ID:                rating.ID,
			MatchingRequestID: rating.MatchingRequestID,
			RaterID:           rating.RaterID,
			RaterType:         rating.RaterType,
			RatedID:           rating.RatedID,
			RatedType:         rating.RatedType,
			Rating:            rating.Rating,
			Comment:           rating.Comment,
			CreatedAt:         rating.CreatedAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"ratings": responseRatings,
		"pagination": gin.H{
			"page":        page,
			"per_page":    perPage,
			"total":       total,
			"total_pages": (total + int64(perPage) - 1) / int64(perPage),
		},
	})
}
