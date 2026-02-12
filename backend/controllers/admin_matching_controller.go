package controllers

import (
	"net/http"
	"strconv"
	"time"

	"asl-market-backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// AdminMatchingController handles admin matching-related requests
type AdminMatchingController struct {
	db *gorm.DB
}

// NewAdminMatchingController creates a new admin matching controller
func NewAdminMatchingController(db *gorm.DB) *AdminMatchingController {
	return &AdminMatchingController{db: db}
}

// GetAllMatchingRequests gets all matching requests for admin
func (amc *AdminMatchingController) GetAllMatchingRequests(c *gin.Context) {
	status := c.DefaultQuery("status", "all")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))

	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}

	var requests []models.MatchingRequest
	var total int64

	query := amc.db.Model(&models.MatchingRequest{}).
		Preload("Supplier").
		Preload("Supplier.User").
		Preload("Responses").
		Preload("AcceptedVisitor")

	if status != "all" && status != "" {
		query = query.Where("status = ?", status)
	}

	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در شمارش درخواست‌ها"})
		return
	}

	offset := (page - 1) * perPage
	if err := query.Offset(offset).Limit(perPage).Order("created_at DESC").Find(&requests).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت درخواست‌ها"})
		return
	}

	// Build response with calculated fields
	var responseRequests []gin.H
	for _, req := range requests {
		remainingTime := ""
		isExpired := false
		if req.ExpiresAt.After(time.Now()) {
			remaining := time.Until(req.ExpiresAt)
			days := int(remaining.Hours() / 24)
			hours := int(remaining.Hours()) % 24
			remainingTime = strconv.Itoa(days) + " روز و " + strconv.Itoa(hours) + " ساعت"
		} else {
			isExpired = true
			remainingTime = "منقضی شده"
		}

		responseRequests = append(responseRequests, gin.H{
			"id":                    req.ID,
			"supplier_id":           req.SupplierID,
			"supplier":              req.Supplier,
			"product_name":          req.ProductName,
			"quantity":              req.Quantity,
			"unit":                  req.Unit,
			"destination_countries": req.DestinationCountries,
			"price":                 req.Price,
			"currency":              req.Currency,
			"payment_terms":         req.PaymentTerms,
			"delivery_time":         req.DeliveryTime,
			"description":           req.Description,
			"expires_at":            req.ExpiresAt,
			"status":                req.Status,
			"matched_visitor_count": req.MatchedVisitorCount,
			"accepted_visitor_id":   req.AcceptedVisitorID,
			"accepted_at":           req.AcceptedAt,
			"remaining_time":        remainingTime,
			"is_expired":            isExpired,
			"responses_count":       len(req.Responses),
			"created_at":            req.CreatedAt,
			"updated_at":            req.UpdatedAt,
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

// GetMatchingRequestStats gets statistics for admin dashboard
func (amc *AdminMatchingController) GetMatchingRequestStats(c *gin.Context) {
	var stats struct {
		TotalRequests     int64
		ActiveRequests    int64
		AcceptedRequests  int64
		ExpiredRequests   int64
		CompletedRequests int64
		TotalResponses    int64
		TotalChats        int64
	}

	amc.db.Model(&models.MatchingRequest{}).Count(&stats.TotalRequests)
	amc.db.Model(&models.MatchingRequest{}).Where("status = ?", "active").Count(&stats.ActiveRequests)
	amc.db.Model(&models.MatchingRequest{}).Where("status = ?", "accepted").Count(&stats.AcceptedRequests)
	amc.db.Model(&models.MatchingRequest{}).Where("status = ?", "expired").Count(&stats.ExpiredRequests)
	amc.db.Model(&models.MatchingRequest{}).Where("status = ?", "completed").Count(&stats.CompletedRequests)
	amc.db.Model(&models.MatchingResponse{}).Count(&stats.TotalResponses)
	amc.db.Model(&models.MatchingChat{}).Count(&stats.TotalChats)

	c.JSON(http.StatusOK, gin.H{"stats": stats})
}

// GetAllMatchingChats gets all matching chats for admin
func (amc *AdminMatchingController) GetAllMatchingChats(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))

	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}

	var chats []models.MatchingChat
	var total int64

	query := amc.db.Model(&models.MatchingChat{}).
		Preload("MatchingRequest").
		Preload("Supplier").
		Preload("Visitor")

	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در شمارش چت‌ها"})
		return
	}

	offset := (page - 1) * perPage
	// Order by last update time (no last_message_at column on MatchingChat)
	if err := query.Offset(offset).Limit(perPage).
		Order("updated_at DESC, created_at DESC").Find(&chats).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت چت‌ها"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":        chats,
		"total":       total,
		"page":        page,
		"per_page":    perPage,
		"total_pages": (int(total) + perPage - 1) / perPage,
	})
}

// GetMatchingChatMessages gets messages for a specific chat (admin view)
func (amc *AdminMatchingController) GetMatchingChatMessages(c *gin.Context) {
	chatID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه چت نامعتبر است"})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "50"))

	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 50
	}

	messages, total, err := models.GetMatchingChatMessages(amc.db, uint(chatID), page, perPage)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت پیام‌ها"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"messages":    messages,
		"total":       total,
		"page":        page,
		"per_page":    perPage,
		"total_pages": (int(total) + perPage - 1) / perPage,
	})
}

// GetAllVisitorProjects gets all visitor projects for admin
func (amc *AdminMatchingController) GetAllVisitorProjects(c *gin.Context) {
	status := c.DefaultQuery("status", "all")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))

	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}

	var projects []models.VisitorProject
	var total int64

	query := amc.db.Model(&models.VisitorProject{}).
		Preload("Visitor").
		Preload("Visitor.User").
		Preload("Proposals").
		Preload("AcceptedSupplier")

	if status != "all" && status != "" {
		query = query.Where("status = ?", status)
	}

	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در شمارش پروژه‌ها"})
		return
	}

	offset := (page - 1) * perPage
	if err := query.Offset(offset).Limit(perPage).Order("created_at DESC").Find(&projects).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت پروژه‌ها"})
		return
	}

	// Build response with calculated fields
	var responseProjects []gin.H
	for _, proj := range projects {
		remainingTime := ""
		isExpired := false
		if proj.ExpiresAt.After(time.Now()) {
			remaining := time.Until(proj.ExpiresAt)
			days := int(remaining.Hours() / 24)
			hours := int(remaining.Hours()) % 24
			remainingTime = strconv.Itoa(days) + " روز و " + strconv.Itoa(hours) + " ساعت"
		} else {
			isExpired = true
			remainingTime = "منقضی شده"
		}

		responseProjects = append(responseProjects, gin.H{
			"id":                     proj.ID,
			"visitor_id":             proj.VisitorID,
			"visitor":                proj.Visitor,
			"project_title":          proj.ProjectTitle,
			"product_name":           proj.ProductName,
			"quantity":               proj.Quantity,
			"unit":                   proj.Unit,
			"target_countries":       proj.TargetCountries,
			"budget":                 proj.Budget,
			"currency":               proj.Currency,
			"payment_terms":          proj.PaymentTerms,
			"delivery_time":          proj.DeliveryTime,
			"description":            proj.Description,
			"expires_at":             proj.ExpiresAt,
			"status":                 proj.Status,
			"matched_supplier_count": proj.MatchedSupplierCount,
			"accepted_supplier_id":   proj.AcceptedSupplierID,
			"accepted_at":            proj.AcceptedAt,
			"remaining_time":         remainingTime,
			"is_expired":             isExpired,
			"proposals_count":        len(proj.Proposals),
			"created_at":             proj.CreatedAt,
			"updated_at":             proj.UpdatedAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"data":        responseProjects,
		"total":       total,
		"page":        page,
		"per_page":    perPage,
		"total_pages": (int(total) + perPage - 1) / perPage,
	})
}

// GetVisitorProjectStats gets statistics for admin dashboard
func (amc *AdminMatchingController) GetVisitorProjectStats(c *gin.Context) {
	var stats struct {
		TotalProjects     int64
		ActiveProjects    int64
		AcceptedProjects  int64
		ExpiredProjects   int64
		CompletedProjects int64
		TotalProposals    int64
		TotalChats        int64
	}

	amc.db.Model(&models.VisitorProject{}).Count(&stats.TotalProjects)
	amc.db.Model(&models.VisitorProject{}).Where("status = ?", "active").Count(&stats.ActiveProjects)
	amc.db.Model(&models.VisitorProject{}).Where("status = ?", "accepted").Count(&stats.AcceptedProjects)
	amc.db.Model(&models.VisitorProject{}).Where("status = ?", "expired").Count(&stats.ExpiredProjects)
	amc.db.Model(&models.VisitorProject{}).Where("status = ?", "completed").Count(&stats.CompletedProjects)
	amc.db.Model(&models.VisitorProjectProposal{}).Count(&stats.TotalProposals)
	amc.db.Model(&models.VisitorProjectChat{}).Count(&stats.TotalChats)

	c.JSON(http.StatusOK, gin.H{"stats": stats})
}

// GetAllVisitorProjectChats gets all visitor project chats for admin
func (amc *AdminMatchingController) GetAllVisitorProjectChats(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))

	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}

	var chats []models.VisitorProjectChat
	var total int64

	query := amc.db.Model(&models.VisitorProjectChat{}).
		Preload("VisitorProject").
		Preload("Supplier").
		Preload("Visitor")

	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در شمارش چت‌ها"})
		return
	}

	offset := (page - 1) * perPage
	// Use portable ordering without database-specific NULLS LAST syntax
	if err := query.Offset(offset).Limit(perPage).
		Order("last_message_at DESC, created_at DESC").Find(&chats).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت چت‌ها"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":        chats,
		"total":       total,
		"page":        page,
		"per_page":    perPage,
		"total_pages": (int(total) + perPage - 1) / perPage,
	})
}

// ==================== Admin mutations for Matching Requests ====================

// UpdateMatchingRequestAdmin allows admin to update basic fields of a matching request (e.g. status)
func (amc *AdminMatchingController) UpdateMatchingRequestAdmin(c *gin.Context) {
	// Allow only web admin roles
	userRole, exists := c.Get("user_role")
	roleStr, ok := userRole.(string)
	if !exists || !ok || (roleStr != "admin" && roleStr != "super_admin" && roleStr != "moderator") {
		c.JSON(http.StatusForbidden, gin.H{"error": "دسترسی غیرمجاز"})
		return
	}

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه درخواست نامعتبر است"})
		return
	}

	var req struct {
		Status string `json:"status"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "اطلاعات ارسالی نامعتبر است"})
		return
	}

	updates := make(map[string]interface{})

	if req.Status != "" {
		validStatuses := map[string]bool{
			"pending":   true,
			"active":    true,
			"accepted":  true,
			"expired":   true,
			"cancelled": true,
			"completed": true,
		}
		if !validStatuses[req.Status] {
			c.JSON(http.StatusBadRequest, gin.H{"error": "وضعیت نامعتبر است"})
			return
		}
		updates["status"] = req.Status
	}

	if len(updates) == 0 {
		c.JSON(http.StatusOK, gin.H{"message": "بدون تغییر"})
		return
	}

	if err := amc.db.Model(&models.MatchingRequest{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در به‌روزرسانی درخواست"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "درخواست با موفقیت به‌روزرسانی شد"})
}

// DeleteMatchingRequestAdmin allows admin to delete a matching request
func (amc *AdminMatchingController) DeleteMatchingRequestAdmin(c *gin.Context) {
	// Allow only web admin roles
	userRole, exists := c.Get("user_role")
	roleStr, ok := userRole.(string)
	if !exists || !ok || (roleStr != "admin" && roleStr != "super_admin" && roleStr != "moderator") {
		c.JSON(http.StatusForbidden, gin.H{"error": "دسترسی غیرمجاز"})
		return
	}

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه درخواست نامعتبر است"})
		return
	}

	if err := amc.db.Delete(&models.MatchingRequest{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در حذف درخواست"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "درخواست با موفقیت حذف شد"})
}

// ==================== Admin mutations for Visitor Projects ====================

// UpdateVisitorProjectAdmin allows admin to update basic fields of a visitor project (e.g. status)
func (amc *AdminMatchingController) UpdateVisitorProjectAdmin(c *gin.Context) {
	// Allow only web admin roles
	userRole, exists := c.Get("user_role")
	roleStr, ok := userRole.(string)
	if !exists || !ok || (roleStr != "admin" && roleStr != "super_admin" && roleStr != "moderator") {
		c.JSON(http.StatusForbidden, gin.H{"error": "دسترسی غیرمجاز"})
		return
	}

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه پروژه نامعتبر است"})
		return
	}

	var req struct {
		Status string `json:"status"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "اطلاعات ارسالی نامعتبر است"})
		return
	}

	updates := make(map[string]interface{})

	if req.Status != "" {
		validStatuses := map[string]bool{
			"pending":   true,
			"active":    true,
			"accepted":  true,
			"expired":   true,
			"cancelled": true,
			"completed": true,
		}
		if !validStatuses[req.Status] {
			c.JSON(http.StatusBadRequest, gin.H{"error": "وضعیت نامعتبر است"})
			return
		}
		updates["status"] = req.Status
	}

	if len(updates) == 0 {
		c.JSON(http.StatusOK, gin.H{"message": "بدون تغییر"})
		return
	}

	if err := amc.db.Model(&models.VisitorProject{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در به‌روزرسانی پروژه"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "پروژه با موفقیت به‌روزرسانی شد"})
}

// DeleteVisitorProjectAdmin allows admin to delete a visitor project
func (amc *AdminMatchingController) DeleteVisitorProjectAdmin(c *gin.Context) {
	// Allow only web admin roles
	userRole, exists := c.Get("user_role")
	roleStr, ok := userRole.(string)
	if !exists || !ok || (roleStr != "admin" && roleStr != "super_admin" && roleStr != "moderator") {
		c.JSON(http.StatusForbidden, gin.H{"error": "دسترسی غیرمجاز"})
		return
	}

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه پروژه نامعتبر است"})
		return
	}

	if err := amc.db.Delete(&models.VisitorProject{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در حذف پروژه"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "پروژه با موفقیت حذف شد"})
}

// GetVisitorProjectChatMessages gets messages for a specific visitor project chat (admin view)
func (amc *AdminMatchingController) GetVisitorProjectChatMessages(c *gin.Context) {
	chatID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه چت نامعتبر است"})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "50"))

	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 50
	}

	messages, total, err := models.GetVisitorProjectChatMessages(amc.db, uint(chatID), page, perPage)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت پیام‌ها"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"messages":    messages,
		"total":       total,
		"page":        page,
		"per_page":    perPage,
		"total_pages": (int(total) + perPage - 1) / perPage,
	})
}
