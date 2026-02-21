package controllers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"asl-market-backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// VisitorProjectController handles visitor project-related requests
type VisitorProjectController struct {
	db *gorm.DB
}

// NewVisitorProjectController creates a new visitor project controller
func NewVisitorProjectController(db *gorm.DB) *VisitorProjectController {
	return &VisitorProjectController{db: db}
}

// CreateVisitorProject creates a new visitor project (Visitor)
func (vpc *VisitorProjectController) CreateVisitorProject(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "برای دسترسی به این بخش، لطفاً ابتدا وارد حساب کاربری خود شوید."})
		return
	}

	userIDUint := userID.(uint)

	// Check if user has an approved visitor
	visitor, err := models.GetVisitorByUserID(vpc.db, userIDUint)
	if err != nil || visitor.Status != "approved" {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "شما باید ویزیتور تأیید شده باشید تا بتوانید پروژه ایجاد کنید",
		})
		return
	}

	var req models.CreateVisitorProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "اطلاعات ارسالی نامعتبر است",
			"details": err.Error(),
		})
		return
	}

	// Create visitor project
	project, err := models.CreateVisitorProject(vpc.db, userIDUint, visitor.ID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "خطا در ایجاد پروژه",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "پروژه ویزیتوری با موفقیت ایجاد شد. تأمین‌کننده‌های مناسب به زودی مطلع خواهند شد.",
		"project": project,
	})
}

// GetMyVisitorProjects gets all visitor projects for the current visitor
func (vpc *VisitorProjectController) GetMyVisitorProjects(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "برای دسترسی به این بخش، لطفاً ابتدا وارد حساب کاربری خود شوید."})
		return
	}

	userIDUint := userID.(uint)

	// Get visitor
	visitor, err := models.GetVisitorByUserID(vpc.db, userIDUint)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "شما ویزیتور نیستید",
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

	// Get visitor projects
	projects, total, err := models.GetVisitorProjectsByVisitor(vpc.db, visitor.ID, status, page, perPage)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "خطا در دریافت پروژه‌ها",
		})
		return
	}

	// Convert to response format
	var responseProjects []models.VisitorProjectResponse
	for _, proj := range projects {
		remainingTime := ""
		isExpired := false
		if proj.ExpiresAt.After(time.Now()) {
			remaining := time.Until(proj.ExpiresAt)
			days := int(remaining.Hours() / 24)
			hours := int(remaining.Hours()) % 24
			remainingTime = fmt.Sprintf("%d روز و %d ساعت", days, hours)
		} else {
			isExpired = true
			remainingTime = "منقضی شده"
		}

		responseProjects = append(responseProjects, models.VisitorProjectResponse{
			ID:                   proj.ID,
			VisitorID:            proj.VisitorID,
			UserID:               proj.UserID,
			ProjectTitle:         proj.ProjectTitle,
			ProductName:          proj.ProductName,
			Quantity:             proj.Quantity,
			Unit:                 proj.Unit,
			TargetCountries:      proj.TargetCountries,
			Budget:               proj.Budget,
			Currency:             proj.Currency,
			PaymentTerms:         proj.PaymentTerms,
			DeliveryTime:         proj.DeliveryTime,
			Description:          proj.Description,
			ExpiresAt:            proj.ExpiresAt,
			Status:               proj.Status,
			MatchedSupplierCount: proj.MatchedSupplierCount,
			AcceptedSupplierID:   proj.AcceptedSupplierID,
			AcceptedAt:           proj.AcceptedAt,
			RemainingTime:        remainingTime,
			IsExpired:            isExpired,
			CreatedAt:            proj.CreatedAt,
			UpdatedAt:            proj.UpdatedAt,
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

// GetAvailableVisitorProjects gets all active visitor projects for suppliers to view
func (vpc *VisitorProjectController) GetAvailableVisitorProjects(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "برای دسترسی به این بخش، لطفاً ابتدا وارد حساب کاربری خود شوید."})
		return
	}

	userIDUint := userID.(uint)

	// Check if user has an approved supplier
	supplier, err := models.GetSupplierByUserID(vpc.db, userIDUint)
	if err != nil || supplier.Status != "approved" {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "شما باید تأمین‌کننده تأیید شده باشید تا بتوانید پروژه‌های ویزیتوری را مشاهده کنید",
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

	// Get available visitor projects
	projects, total, err := models.GetAvailableVisitorProjects(vpc.db, page, perPage)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "خطا در دریافت پروژه‌ها",
		})
		return
	}

	// Convert to response format
	var responseProjects []models.VisitorProjectResponse
	for _, proj := range projects {
		remainingTime := ""
		isExpired := false
		if proj.ExpiresAt.After(time.Now()) {
			remaining := time.Until(proj.ExpiresAt)
			days := int(remaining.Hours() / 24)
			hours := int(remaining.Hours()) % 24
			remainingTime = fmt.Sprintf("%d روز و %d ساعت", days, hours)
		} else {
			isExpired = true
			remainingTime = "منقضی شده"
		}

		// Load visitor info (no need to build manually; just use existing visitor from project)
		visitorResp := models.VisitorResponse{
			ID:                proj.Visitor.ID,
			UserID:            proj.Visitor.UserID,
			FullName:          proj.Visitor.FullName,
			CityProvince:      proj.Visitor.CityProvince,
			DestinationCities: proj.Visitor.DestinationCities,
			Status:            proj.Visitor.Status,
			IsFeatured:        proj.Visitor.IsFeatured,
			FeaturedAt:        proj.Visitor.FeaturedAt,
			CreatedAt:         proj.Visitor.CreatedAt,
		}

		responseProjects = append(responseProjects, models.VisitorProjectResponse{
			ID:                   proj.ID,
			VisitorID:            proj.VisitorID,
			UserID:               proj.UserID,
			Visitor:              visitorResp,
			ProjectTitle:         proj.ProjectTitle,
			ProductName:          proj.ProductName,
			Quantity:             proj.Quantity,
			Unit:                 proj.Unit,
			TargetCountries:      proj.TargetCountries,
			Budget:               proj.Budget,
			Currency:             proj.Currency,
			PaymentTerms:         proj.PaymentTerms,
			DeliveryTime:         proj.DeliveryTime,
			Description:          proj.Description,
			ExpiresAt:            proj.ExpiresAt,
			Status:               proj.Status,
			MatchedSupplierCount: proj.MatchedSupplierCount,
			AcceptedSupplierID:   proj.AcceptedSupplierID,
			AcceptedAt:           proj.AcceptedAt,
			RemainingTime:        remainingTime,
			IsExpired:            isExpired,
			CreatedAt:            proj.CreatedAt,
			UpdatedAt:            proj.UpdatedAt,
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

// GetVisitorProjectDetails gets details of a specific visitor project
func (vpc *VisitorProjectController) GetVisitorProjectDetails(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "برای دسترسی به این بخش، لطفاً ابتدا وارد حساب کاربری خود شوید."})
		return
	}

	projectID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه پروژه معتبر نیست. لطفاً دوباره تلاش کنید."})
		return
	}

	// Get visitor project
	project, err := models.GetVisitorProjectByID(vpc.db, uint(projectID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "پروژه مورد نظر یافت نشد. ممکن است حذف شده یا دسترسی شما محدود شده باشد."})
		return
	}

	// Check authorization - user must be the visitor or an approved supplier
	userIDUint := userID.(uint)
	isAuthorized := false

	// Check if user is the visitor who created the project
	if project.UserID == userIDUint {
		isAuthorized = true
	}

	// Check if user is an approved supplier
	if !isAuthorized {
		supplier, err := models.GetSupplierByUserID(vpc.db, userIDUint)
		if err == nil && supplier.Status == "approved" {
			isAuthorized = true
		}
	}

	if !isAuthorized {
		c.JSON(http.StatusForbidden, gin.H{"error": "شما دسترسی به این پروژه ندارید"})
		return
	}

	// Calculate remaining time
	remainingTime := ""
	isExpired := false
	if project.ExpiresAt.After(time.Now()) {
		remaining := time.Until(project.ExpiresAt)
		days := int(remaining.Hours() / 24)
		hours := int(remaining.Hours()) % 24
		remainingTime = fmt.Sprintf("%d روز و %d ساعت", days, hours)
	} else {
		isExpired = true
		remainingTime = "منقضی شده"
	}

	// Convert proposals
	var proposalResponses []models.VisitorProjectProposalResponse
	for _, prop := range project.Proposals {
		// Load supplier info
		avgRating, totalRatings, _ := models.GetAverageRatingForUser(vpc.db, prop.Supplier.UserID)
		displayRating := avgRating
		if prop.Supplier.IsFeatured {
			displayRating = 5.0
		}

		proposalResponses = append(proposalResponses, models.VisitorProjectProposalResponse{
			ID:               prop.ID,
			VisitorProjectID: prop.VisitorProjectID,
			SupplierID:       prop.SupplierID,
			Supplier: models.SupplierResponse{
				ID:                      prop.Supplier.ID,
				UserID:                  prop.Supplier.UserID,
				FullName:                prop.Supplier.FullName,
				BrandName:               prop.Supplier.BrandName,
				City:                    prop.Supplier.City,
				IsFeatured:              prop.Supplier.IsFeatured,
				TagFirstClass:           prop.Supplier.TagFirstClass,
				TagGoodPrice:            prop.Supplier.TagGoodPrice,
				TagExportExperience:     prop.Supplier.TagExportExperience,
				TagExportPackaging:      prop.Supplier.TagExportPackaging,
				TagSupplyWithoutCapital: prop.Supplier.TagSupplyWithoutCapital,
				AverageRating:           displayRating,
				TotalRatings:            totalRatings,
			},
			ProposalType: prop.ProposalType,
			Message:      prop.Message,
			OfferedPrice: prop.OfferedPrice,
			Status:       prop.Status,
			CreatedAt:    prop.CreatedAt,
		})
	}

	// Load visitor info
	visitorResp := models.VisitorResponse{
		ID:                project.Visitor.ID,
		UserID:            project.Visitor.UserID,
		FullName:          project.Visitor.FullName,
		CityProvince:      project.Visitor.CityProvince,
		DestinationCities: project.Visitor.DestinationCities,
		Status:            project.Visitor.Status,
		IsFeatured:        project.Visitor.IsFeatured,
		FeaturedAt:        project.Visitor.FeaturedAt,
		CreatedAt:         project.Visitor.CreatedAt,
	}

	c.JSON(http.StatusOK, gin.H{
		"project": models.VisitorProjectResponse{
			ID:                   project.ID,
			VisitorID:            project.VisitorID,
			UserID:               project.UserID,
			Visitor:              visitorResp,
			ProjectTitle:         project.ProjectTitle,
			ProductName:          project.ProductName,
			Quantity:             project.Quantity,
			Unit:                 project.Unit,
			TargetCountries:      project.TargetCountries,
			Budget:               project.Budget,
			Currency:             project.Currency,
			PaymentTerms:         project.PaymentTerms,
			DeliveryTime:         project.DeliveryTime,
			Description:          project.Description,
			ExpiresAt:            project.ExpiresAt,
			Status:               project.Status,
			MatchedSupplierCount: project.MatchedSupplierCount,
			AcceptedSupplierID:   project.AcceptedSupplierID,
			AcceptedAt:           project.AcceptedAt,
			RemainingTime:        remainingTime,
			IsExpired:            isExpired,
			Proposals:            proposalResponses,
			CreatedAt:            project.CreatedAt,
			UpdatedAt:            project.UpdatedAt,
		},
	})
}

// SubmitProposal allows supplier to submit a proposal to a visitor project
func (vpc *VisitorProjectController) SubmitProposal(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "برای دسترسی به این بخش، لطفاً ابتدا وارد حساب کاربری خود شوید."})
		return
	}

	userIDUint := userID.(uint)

	// Check if user has an approved supplier
	supplier, err := models.GetSupplierByUserID(vpc.db, userIDUint)
	if err != nil || supplier.Status != "approved" {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "شما باید تأمین‌کننده تأیید شده باشید تا بتوانید پیشنهاد ارسال کنید",
		})
		return
	}

	projectID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه پروژه معتبر نیست. لطفاً دوباره تلاش کنید."})
		return
	}

	var req models.VisitorProjectProposalRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "اطلاعات ارسالی نامعتبر است",
			"details": err.Error(),
		})
		return
	}

	// Check if project exists and is active
	project, err := models.GetVisitorProjectByID(vpc.db, uint(projectID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "پروژه مورد نظر یافت نشد. ممکن است حذف شده یا دسترسی شما محدود شده باشد."})
		return
	}

	if project.Status != "active" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "این پروژه دیگر فعال نیست"})
		return
	}

	if project.ExpiresAt.Before(time.Now()) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "این پروژه منقضی شده است"})
		return
	}

	// Check if supplier already has a proposal for this project
	var existingProposal models.VisitorProjectProposal
	if err := vpc.db.Where("visitor_project_id = ? AND supplier_id = ?", projectID, supplier.ID).First(&existingProposal).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شما قبلاً برای این پروژه پیشنهاد ارسال کرده‌اید"})
		return
	}

	// Create proposal
	proposal, err := models.CreateVisitorProjectProposal(vpc.db, uint(projectID), supplier.ID, userIDUint, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ارسال پیشنهاد"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":  "پیشنهاد شما با موفقیت ارسال شد. ویزیتور به زودی مطلع خواهد شد.",
		"proposal": proposal,
	})
}

// GetSupplierCapacityForVisitorProjects gets suppliers with their proposal counts
func (vpc *VisitorProjectController) GetSupplierCapacityForVisitorProjects(c *gin.Context) {
	capacity, _ := strconv.Atoi(c.DefaultQuery("capacity", "5"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	if capacity < 1 {
		capacity = 5
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	suppliers, err := models.GetSupplierCapacityForVisitorProjects(vpc.db, capacity, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت ظرفیت تأمین‌کننده‌ها"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"suppliers": suppliers,
	})
}

// UpdateVisitorProject updates a visitor project (owner only)
func (vpc *VisitorProjectController) UpdateVisitorProject(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "برای دسترسی به این بخش، لطفاً ابتدا وارد حساب کاربری خود شوید."})
		return
	}

	projectID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه پروژه معتبر نیست. لطفاً دوباره تلاش کنید."})
		return
	}

	// Get project
	project, err := models.GetVisitorProjectByID(vpc.db, uint(projectID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "پروژه مورد نظر یافت نشد. ممکن است حذف شده یا دسترسی شما محدود شده باشد."})
		return
	}

	// Check ownership
	if project.UserID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "شما مالک این پروژه نیستید"})
		return
	}

	var req models.UpdateVisitorProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "اطلاعات وارد شده صحیح نیست. لطفاً فرم را با دقت تکمیل کنید."})
		return
	}

	if err := models.UpdateVisitorProject(vpc.db, uint(projectID), req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در به‌روزرسانی پروژه"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "پروژه با موفقیت به‌روزرسانی شد"})
}

// DeleteVisitorProject deletes a visitor project (owner only)
func (vpc *VisitorProjectController) DeleteVisitorProject(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "برای دسترسی به این بخش، لطفاً ابتدا وارد حساب کاربری خود شوید."})
		return
	}

	projectID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه پروژه معتبر نیست. لطفاً دوباره تلاش کنید."})
		return
	}

	// Get project
	project, err := models.GetVisitorProjectByID(vpc.db, uint(projectID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "پروژه مورد نظر یافت نشد. ممکن است حذف شده یا دسترسی شما محدود شده باشد."})
		return
	}

	// Check ownership
	if project.UserID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "شما مالک این پروژه نیستید"})
		return
	}

	if err := models.DeleteVisitorProject(vpc.db, uint(projectID)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در حذف پروژه"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "پروژه با موفقیت حذف شد"})
}

// CloseVisitorProject closes/completes a visitor project (owner only)
func (vpc *VisitorProjectController) CloseVisitorProject(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "برای دسترسی به این بخش، لطفاً ابتدا وارد حساب کاربری خود شوید."})
		return
	}

	projectID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه پروژه معتبر نیست. لطفاً دوباره تلاش کنید."})
		return
	}

	// Get project
	project, err := models.GetVisitorProjectByID(vpc.db, uint(projectID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "پروژه مورد نظر یافت نشد. ممکن است حذف شده یا دسترسی شما محدود شده باشد."})
		return
	}

	// Check ownership
	if project.UserID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "شما مالک این پروژه نیستید"})
		return
	}

	if err := models.CloseVisitorProject(vpc.db, uint(projectID)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در بستن پروژه"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "پروژه با موفقیت مختوم شد"})
}

// GetVisitorProjectChats gets all chats for current user
func (vpc *VisitorProjectController) GetVisitorProjectChats(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "برای دسترسی به این بخش، لطفاً ابتدا وارد حساب کاربری خود شوید."})
		return
	}

	userIDUint := userID.(uint)

	// Check if user is supplier or visitor
	isSupplier := false
	_, err := models.GetSupplierByUserID(vpc.db, userIDUint)
	if err == nil {
		isSupplier = true
	}

	chats, err := models.GetVisitorProjectChatsForUser(vpc.db, userIDUint, isSupplier)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت چت‌ها"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"chats": chats})
}

// GetVisitorProjectChatMessages gets messages for a specific chat
func (vpc *VisitorProjectController) GetVisitorProjectChatMessages(c *gin.Context) {
	_, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "برای دسترسی به این بخش، لطفاً ابتدا وارد حساب کاربری خود شوید."})
		return
	}

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

	messages, total, err := models.GetVisitorProjectChatMessages(vpc.db, uint(chatID), page, perPage)
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

// SendVisitorProjectChatMessage sends a message in a chat
func (vpc *VisitorProjectController) SendVisitorProjectChatMessage(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "برای دسترسی به این بخش، لطفاً ابتدا وارد حساب کاربری خود شوید."})
		return
	}

	chatID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه چت نامعتبر است"})
		return
	}

	var req struct {
		Message  string `json:"message" binding:"required"`
		ImageURL string `json:"image_url"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "پیام نامعتبر است"})
		return
	}

	userIDUint := userID.(uint)

	// Determine sender type
	senderType := "visitor"
	_, err = models.GetSupplierByUserID(vpc.db, userIDUint)
	if err == nil {
		senderType = "supplier"
	}

	message, err := models.CreateVisitorProjectMessage(vpc.db, uint(chatID), userIDUint, senderType, req.Message, req.ImageURL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ارسال پیام"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "پیام با موفقیت ارسال شد",
		"data":    message,
	})
}

// StartVisitorProjectChat starts a chat between visitor and supplier
func (vpc *VisitorProjectController) StartVisitorProjectChat(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "برای دسترسی به این بخش، لطفاً ابتدا وارد حساب کاربری خود شوید."})
		return
	}

	projectID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه پروژه معتبر نیست. لطفاً دوباره تلاش کنید."})
		return
	}

	var req struct {
		SupplierID uint `json:"supplier_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "اطلاعات نامعتبر است"})
		return
	}

	userIDUint := userID.(uint)

	// Get project
	project, err := models.GetVisitorProjectByID(vpc.db, uint(projectID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "پروژه مورد نظر یافت نشد. ممکن است حذف شده یا دسترسی شما محدود شده باشد."})
		return
	}

	// Check if user is the visitor who owns the project or the supplier
	var visitorID, supplierID uint
	
	// Try to get visitor
	visitor, err := models.GetVisitorByUserID(vpc.db, userIDUint)
	if err == nil && visitor.ID == project.VisitorID {
		visitorID = visitor.ID
		supplierID = req.SupplierID
	} else {
		// Try to get supplier
		supplier, err := models.GetSupplierByUserID(vpc.db, userIDUint)
		if err != nil || supplier.ID != req.SupplierID {
			c.JSON(http.StatusForbidden, gin.H{"error": "شما دسترسی به این چت ندارید"})
			return
		}
		visitorID = project.VisitorID
		supplierID = supplier.ID
	}

	// Get or create chat
	chat, err := models.GetOrCreateVisitorProjectChat(vpc.db, uint(projectID), visitorID, supplierID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ایجاد چت"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "چت با موفقیت ایجاد شد",
		"chat":    chat,
	})
}
