package controllers

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"asl-market-backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// RegisterVisitor handles visitor registration
func RegisterVisitor(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "لطفا ابتدا وارد شوید"})
		return
	}

	userIDUint := userID.(uint)

	// Check if user already has a visitor registration
	existingVisitor, err := models.GetVisitorByUserID(models.GetDB(), userIDUint)
	if err == nil && existingVisitor.ID > 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "شما قبلاً به عنوان ویزیتور ثبت‌نام کرده‌اید",
			"visitor": existingVisitor,
		})
		return
	}

	var req models.VisitorRegistrationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "اطلاعات ارسالی نامعتبر است"})
		return
	}

	// Validate required fields
	if req.FullName == "" || req.NationalID == "" || req.BirthDate == "" ||
		req.Mobile == "" || req.ResidenceAddress == "" || req.CityProvince == "" ||
		req.DestinationCities == "" || req.BankAccountIBAN == "" || req.BankName == "" ||
		req.LanguageLevel == "" || req.DigitalSignature == "" || req.SignatureDate == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "لطفا تمام فیلدهای الزامی را پر کنید"})
		return
	}

	// Validate language level
	validLanguageLevels := []string{"excellent", "good", "weak", "none"}
	languageLevelValid := false
	for _, level := range validLanguageLevels {
		if req.LanguageLevel == level {
			languageLevelValid = true
			break
		}
	}
	if !languageLevelValid {
		c.JSON(http.StatusBadRequest, gin.H{"error": "سطح زبان انتخاب شده نامعتبر است"})
		return
	}

	// Validate agreements
	if !req.AgreesToUseApprovedProducts || !req.AgreesToViolationConsequences || !req.AgreesToSubmitReports {
		c.JSON(http.StatusBadRequest, gin.H{"error": "تایید تمام موارد قوانین همکاری الزامی است"})
		return
	}

	// STRICT VALIDATION: Only Arabic countries allowed, NO Iranian locations
	// Flexible format: accepts any separator (space, comma, dash, etc.)
	if !validateArabicLocation(req.CityProvince, "شهر و کشور محل سکونت") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شهر و کشور محل سکونت باید از کشورهای عربی باشد. ویزیتورهای ایرانی پذیرفته نمی‌شوند."})
		return
	}

	// Validate destination cities
	// Split only by comma (Persian or English), not by space or dash
	// This allows "راس الخیمه امارات متحده عربی" to stay as one item
	trimmedInput := strings.TrimSpace(req.DestinationCities)
	if trimmedInput == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "لطفا حداقل یک شهر مقصد وارد کنید"})
		return
	}

	// Split only by comma (Persian or English comma), not by space or dash
	destinations := strings.FieldsFunc(trimmedInput, func(r rune) bool {
		return r == ',' || r == '،'
	})

	// If no comma found, treat the whole string as one destination
	if len(destinations) == 0 {
		destinations = []string{trimmedInput}
	}

	for _, dest := range destinations {
		dest = strings.TrimSpace(dest)
		if dest != "" {
			if !validateArabicLocation(dest, "شهرهای مقصد") {
				c.JSON(http.StatusBadRequest, gin.H{"error": "شهرهای مقصد باید از کشورهای عربی باشد. ویزیتورهای ایرانی پذیرفته نمی‌شوند."})
				return
			}
		}
	}

	// Create visitor
	visitor, err := models.CreateVisitor(models.GetDB(), userIDUint, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ثبت اطلاعات ویزیتور"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "درخواست ثبت‌نام ویزیتور با موفقیت ارسال شد. پس از بررسی توسط تیم ما با شما تماس گرفته خواهد شد.",
		"visitor": visitor,
	})
}

// GetMyVisitorStatus returns current user's visitor status
func GetMyVisitorStatus(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "لطفا ابتدا وارد شوید"})
		return
	}

	userIDUint := userID.(uint)

	// Debug log
	fmt.Printf("🔍 GetMyVisitorStatus called for user ID: %d\n", userIDUint)

	visitor, err := models.GetVisitorByUserID(models.GetDB(), userIDUint)
	if err != nil {
		fmt.Printf("❌ Visitor not found for user ID %d: %v\n", userIDUint, err)
		c.JSON(http.StatusNotFound, gin.H{
			"has_visitor": false,
			"message":     "شما هنوز به عنوان ویزیتور ثبت‌نام نکرده‌اید",
		})
		return
	}

	fmt.Printf("✅ Found visitor ID %d for user ID %d\n", visitor.ID, userIDUint)

	// Calculate average rating for this visitor
	avgRating, totalRatings, _ := models.GetAverageRatingForUser(models.GetDB(), visitor.UserID)

	// If visitor is featured, always show 5.0 stars regardless of actual rating
	displayRating := avgRating
	if visitor.IsFeatured {
		displayRating = 5.0
	}

	// Convert to response format
	response := models.VisitorResponse{
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
		AgreesToUseApprovedProducts:   visitor.AgreesToUseApprovedProducts,
		AgreesToViolationConsequences: visitor.AgreesToViolationConsequences,
		AgreesToSubmitReports:         visitor.AgreesToSubmitReports,
		DigitalSignature:              visitor.DigitalSignature,
		SignatureDate:                 visitor.SignatureDate,
		Status:                        visitor.Status,
		AdminNotes:                    visitor.AdminNotes,
		ApprovedAt:                    visitor.ApprovedAt,
		IsFeatured:                    visitor.IsFeatured,
		UserProfileImageURL:           visitor.User.ProfileImageURL,
		UserCoverImageURL:             visitor.User.CoverImageURL,
		FeaturedAt:                    visitor.FeaturedAt,
		AverageRating:                 displayRating,
		TotalRatings:                  totalRatings,
		CreatedAt:                     visitor.CreatedAt,
	}

	c.JSON(http.StatusOK, gin.H{
		"has_visitor": true,
		"visitor":     response,
	})
}

// GetApprovedVisitors returns list of approved visitors with pagination and filters
func GetApprovedVisitors(c *gin.Context) {
	// Parse pagination and filter parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "12"))
	search := strings.TrimSpace(c.DefaultQuery("search", ""))
	cityProvince := strings.TrimSpace(c.DefaultQuery("city_province", ""))

	// Validate pagination
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 12
	}

	visitors, total, err := models.GetApprovedVisitorsPaginatedWithFilters(models.GetDB(), page, perPage, search, cityProvince)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت لیست ویزیتورها"})
		return
	}

	var response []models.VisitorResponse
	for _, visitor := range visitors {
		// Calculate average rating for this visitor
		avgRating, totalRatings, _ := models.GetAverageRatingForUser(models.GetDB(), visitor.UserID)

		// If visitor is featured, always show 5.0 stars regardless of actual rating
		displayRating := avgRating
		if visitor.IsFeatured {
			displayRating = 5.0
		}

		visitorResponse := models.VisitorResponse{
			ID:                  visitor.ID,
			UserID:              visitor.UserID,
			FullName:            visitor.FullName,
			Mobile:              visitor.Mobile,
			CityProvince:        visitor.CityProvince,
			DestinationCities:   visitor.DestinationCities,
			LanguageLevel:       visitor.LanguageLevel,
			SpecialSkills:       visitor.SpecialSkills,
			InterestedProducts:  visitor.InterestedProducts,
			Status:              visitor.Status,
			IsFeatured:          visitor.IsFeatured,
			FeaturedAt:          visitor.FeaturedAt,
			AverageRating:       displayRating,
			TotalRatings:        totalRatings,
			CreatedAt:           visitor.CreatedAt,
			UserProfileImageURL: visitor.User.ProfileImageURL,
			UserCoverImageURL:   visitor.User.CoverImageURL,
		}
		response = append(response, visitorResponse)
	}

	totalPages := (int(total) + perPage - 1) / perPage

	c.JSON(http.StatusOK, gin.H{
		"visitors":     response,
		"total":        total,
		"page":         page,
		"per_page":     perPage,
		"total_pages":  totalPages,
		"has_next":     page < totalPages,
		"has_previous": page > 1,
	})
}

// CreateVisitorForAdminRequest defines payload for creating a visitor from admin panel
type CreateVisitorForAdminRequest struct {
	UserID                      uint   `json:"user_id" binding:"required"`
	FullName                    string `json:"full_name" binding:"required"`
	NationalID                  string `json:"national_id" binding:"required"`
	PassportNumber              string `json:"passport_number"`
	BirthDate                   string `json:"birth_date" binding:"required"`
	Mobile                      string `json:"mobile" binding:"required"`
	WhatsappNumber              string `json:"whatsapp_number"`
	Email                       string `json:"email"`
	ResidenceAddress            string `json:"residence_address" binding:"required"`
	CityProvince                string `json:"city_province" binding:"required"`
	DestinationCities           string `json:"destination_cities" binding:"required"`
	HasLocalContact             bool   `json:"has_local_contact"`
	LocalContactDetails         string `json:"local_contact_details"`
	BankAccountIBAN             string `json:"bank_account_iban" binding:"required"`
	BankName                    string `json:"bank_name" binding:"required"`
	AccountHolderName           string `json:"account_holder_name"`
	HasMarketingExperience      bool   `json:"has_marketing_experience"`
	MarketingExperienceDesc     string `json:"marketing_experience_desc"`
	LanguageLevel               string `json:"language_level" binding:"required"`
	SpecialSkills               string `json:"special_skills"`
	InterestedProducts          string `json:"interested_products"`
	AgreesToUseApprovedProducts bool   `json:"agrees_to_use_approved_products" binding:"required"`
	AgreesToViolationConsequences bool `json:"agrees_to_violation_consequences" binding:"required"`
	AgreesToSubmitReports         bool `json:"agrees_to_submit_reports" binding:"required"`
	DigitalSignature              string `json:"digital_signature" binding:"required"`
	SignatureDate                 string `json:"signature_date" binding:"required"`
}

// CreateVisitorForAdmin creates a new visitor record for a given user (admin-only)
func CreateVisitorForAdmin(c *gin.Context) {
	// Check if user is admin (allow web admin roles)
	userRole, exists := c.Get("user_role")
	roleStr, ok := userRole.(string)
	if !exists || !ok || (roleStr != "admin" && roleStr != "super_admin" && roleStr != "moderator") {
		c.JSON(http.StatusForbidden, gin.H{"error": "دسترسی غیرمجاز"})
		return
	}

	var req CreateVisitorForAdminRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "اطلاعات ارسالی نامعتبر است"})
		return
	}

	db := models.GetDB()

	// Ensure user exists
	var user models.User
	if err := db.First(&user, req.UserID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "کاربر انتخاب‌شده یافت نشد"})
		return
	}

	// Ensure this user does not already have a visitor profile
	if existing, err := models.GetVisitorByUserID(db, req.UserID); err == nil && existing.ID > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "برای این کاربر قبلاً پروفایل ویزیتور ثبت شده است"})
		return
	}

	// Map request to VisitorRegistrationRequest used by model helper
	visitorReq := models.VisitorRegistrationRequest{
		FullName:                    req.FullName,
		NationalID:                  req.NationalID,
		PassportNumber:              req.PassportNumber,
		BirthDate:                   req.BirthDate,
		Mobile:                      req.Mobile,
		WhatsappNumber:              req.WhatsappNumber,
		Email:                       req.Email,
		ResidenceAddress:            req.ResidenceAddress,
		CityProvince:                req.CityProvince,
		DestinationCities:           req.DestinationCities,
		HasLocalContact:             req.HasLocalContact,
		LocalContactDetails:         req.LocalContactDetails,
		BankAccountIBAN:             req.BankAccountIBAN,
		BankName:                    req.BankName,
		AccountHolderName:           req.AccountHolderName,
		HasMarketingExperience:      req.HasMarketingExperience,
		MarketingExperienceDesc:     req.MarketingExperienceDesc,
		LanguageLevel:               req.LanguageLevel,
		SpecialSkills:               req.SpecialSkills,
		InterestedProducts:          req.InterestedProducts,
		AgreesToUseApprovedProducts: req.AgreesToUseApprovedProducts,
		AgreesToViolationConsequences: req.AgreesToViolationConsequences,
		AgreesToSubmitReports:         req.AgreesToSubmitReports,
		DigitalSignature:              req.DigitalSignature,
		SignatureDate:                 req.SignatureDate,
	}

	visitor, err := models.CreateVisitor(db, req.UserID, visitorReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ایجاد ویزیتور"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "ویزیتور با موفقیت ایجاد شد",
		"visitor": visitor,
	})
}

// GetVisitorsForAdmin returns paginated list of visitors for admin panel
func GetVisitorsForAdmin(c *gin.Context) {
	// Check if user is admin (allow web admin roles)
	userRole, exists := c.Get("user_role")
	roleStr, ok := userRole.(string)
	if !exists || !ok || (roleStr != "admin" && roleStr != "super_admin" && roleStr != "moderator") {
		c.JSON(http.StatusForbidden, gin.H{"error": "دسترسی غیرمجاز"})
		return
	}

	// Parse query parameters
	status := c.DefaultQuery("status", "all")
	pageStr := c.DefaultQuery("page", "1")
	perPageStr := c.DefaultQuery("per_page", "10")

	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}

	perPage, err := strconv.Atoi(perPageStr)
	if err != nil || perPage < 1 || perPage > 100 {
		perPage = 10
	}

	visitors, total, err := models.GetVisitorsForAdmin(models.GetDB(), status, page, perPage)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت لیست ویزیتورها"})
		return
	}

	// Convert to response format
	var response []models.VisitorResponse
	for _, visitor := range visitors {
		// Calculate average rating for this visitor
		avgRating, totalRatings, _ := models.GetAverageRatingForUser(models.GetDB(), visitor.UserID)

		// If visitor is featured, always show 5.0 stars regardless of actual rating
		displayRating := avgRating
		if visitor.IsFeatured {
			displayRating = 5.0
		}

		visitorResponse := models.VisitorResponse{
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
			AverageRating:                 displayRating,
			TotalRatings:                  totalRatings,
			CreatedAt:                     visitor.CreatedAt,
		}
		response = append(response, visitorResponse)
	}

	totalPages := (int(total) + perPage - 1) / perPage

	c.JSON(http.StatusOK, gin.H{
		"visitors":     response,
		"total":        total,
		"page":         page,
		"per_page":     perPage,
		"total_pages":  totalPages,
		"has_next":     page < totalPages,
		"has_previous": page > 1,
	})
}

// ApproveVisitorByAdmin approves a visitor registration
func ApproveVisitorByAdmin(c *gin.Context) {
	// Check if user is admin (allow web admin roles)
	userRole, exists := c.Get("user_role")
	roleStr, ok := userRole.(string)
	if !exists || !ok || (roleStr != "admin" && roleStr != "super_admin" && roleStr != "moderator") {
		c.JSON(http.StatusForbidden, gin.H{"error": "دسترسی غیرمجاز"})
		return
	}

	visitorIDStr := c.Param("id")
	visitorID, err := strconv.ParseUint(visitorIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه ویزیتور نامعتبر است"})
		return
	}

	userID, _ := c.Get("user_id")
	adminID := userID.(uint)

	var req struct {
		AdminNotes string `json:"admin_notes"`
	}
	c.ShouldBindJSON(&req)

	err = models.ApproveVisitor(models.GetDB(), uint(visitorID), adminID, req.AdminNotes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در تایید ویزیتور"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "ویزیتور با موفقیت تایید شد",
	})
}

// RejectVisitorByAdmin rejects a visitor registration
func RejectVisitorByAdmin(c *gin.Context) {
	// Check if user is admin (allow web admin roles)
	userRole, exists := c.Get("user_role")
	roleStr, ok := userRole.(string)
	if !exists || !ok || (roleStr != "admin" && roleStr != "super_admin" && roleStr != "moderator") {
		c.JSON(http.StatusForbidden, gin.H{"error": "دسترسی غیرمجاز"})
		return
	}

	visitorIDStr := c.Param("id")
	visitorID, err := strconv.ParseUint(visitorIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه ویزیتور نامعتبر است"})
		return
	}

	userID, _ := c.Get("user_id")
	adminID := userID.(uint)

	var req struct {
		AdminNotes string `json:"admin_notes" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "لطفا دلیل رد درخواست را وارد کنید"})
		return
	}

	err = models.RejectVisitor(models.GetDB(), uint(visitorID), adminID, req.AdminNotes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در رد درخواست ویزیتور"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "درخواست ویزیتور رد شد",
	})
}

// FeatureVisitor sets a visitor as featured (admin only)
func FeatureVisitor(c *gin.Context) {
	adminID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "دسترسی غیرمجاز"})
		return
	}
	visitorIDStr := c.Param("id")
	visitorID, err := strconv.ParseUint(visitorIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه ویزیتور نامعتبر است"})
		return
	}
	if err := models.SetVisitorFeatured(models.GetDB(), uint(visitorID), adminID.(uint), true); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در برگزیده کردن ویزیتور"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "ویزیتور برگزیده شد"})
}

// UnfeatureVisitor removes featured from a visitor (admin only)
func UnfeatureVisitor(c *gin.Context) {
	adminID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "دسترسی غیرمجاز"})
		return
	}
	visitorIDStr := c.Param("id")
	visitorID, err := strconv.ParseUint(visitorIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه ویزیتور نامعتبر است"})
		return
	}
	if err := models.SetVisitorFeatured(models.GetDB(), uint(visitorID), adminID.(uint), false); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در حذف برگزیده ویزیتور"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "برگزیده حذف شد"})
}

// GetVisitorByID returns visitor by ID (for debugging)
func GetVisitorByID(c *gin.Context) {
	visitorIDStr := c.Param("id")
	visitorID, err := strconv.ParseUint(visitorIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه ویزیتور نامعتبر است"})
		return
	}

	// Find visitor by ID
	var visitor models.Visitor
	err = models.GetDB().Preload("User").Where("id = ?", visitorID).First(&visitor).Error
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ویزیتور یافت نشد"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"visitor": visitor,
	})
}

// GetVisitorDetails returns detailed information about a specific visitor for admin
func GetVisitorDetails(c *gin.Context) {
	// Check if user is admin (allow web admin roles)
	userRole, exists := c.Get("user_role")
	roleStr, ok := userRole.(string)
	if !exists || !ok || (roleStr != "admin" && roleStr != "super_admin" && roleStr != "moderator") {
		c.JSON(http.StatusForbidden, gin.H{"error": "دسترسی غیرمجاز"})
		return
	}

	visitorIDStr := c.Param("id")
	visitorID, err := strconv.ParseUint(visitorIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه ویزیتور نامعتبر است"})
		return
	}

	// Find visitor by ID
	var visitor models.Visitor
	err = models.GetDB().Preload("User").Where("id = ?", visitorID).First(&visitor).Error
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ویزیتور یافت نشد"})
		return
	}

	// Calculate average rating for this visitor
	avgRating, totalRatings, _ := models.GetAverageRatingForUser(models.GetDB(), visitor.UserID)

	// If visitor is featured, always show 5.0 stars regardless of actual rating
	displayRating := avgRating
	if visitor.IsFeatured {
		displayRating = 5.0
	}

	// Convert to response format
	response := models.VisitorResponse{
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
		AgreesToUseApprovedProducts:   visitor.AgreesToUseApprovedProducts,
		AgreesToViolationConsequences: visitor.AgreesToViolationConsequences,
		AgreesToSubmitReports:         visitor.AgreesToSubmitReports,
		DigitalSignature:              visitor.DigitalSignature,
		SignatureDate:                 visitor.SignatureDate,
		Status:                        visitor.Status,
		AdminNotes:                    visitor.AdminNotes,
		ApprovedAt:                    visitor.ApprovedAt,
		IsFeatured:                    visitor.IsFeatured,
		UserProfileImageURL:           visitor.User.ProfileImageURL,
		UserCoverImageURL:             visitor.User.CoverImageURL,
		FeaturedAt:                    visitor.FeaturedAt,
		AverageRating:                 displayRating,
		TotalRatings:                  totalRatings,
		CreatedAt:                     visitor.CreatedAt,
	}

	c.JSON(http.StatusOK, gin.H{
		"visitor": response,
		"user":    visitor.User,
	})
}

// UpdateVisitorStatus allows admin to update visitor status with notes
func UpdateVisitorStatus(c *gin.Context) {
	// Check if user is admin (allow web admin roles)
	userRole, exists := c.Get("user_role")
	roleStr, ok := userRole.(string)
	if !exists || !ok || (roleStr != "admin" && roleStr != "super_admin" && roleStr != "moderator") {
		c.JSON(http.StatusForbidden, gin.H{"error": "دسترسی غیرمجاز"})
		return
	}

	visitorIDStr := c.Param("id")
	visitorID, err := strconv.ParseUint(visitorIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه ویزیتور نامعتبر است"})
		return
	}

	var req struct {
		Status     string `json:"status" binding:"required"`
		AdminNotes string `json:"admin_notes"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "اطلاعات ارسالی نامعتبر است"})
		return
	}

	// Validate status
	validStatuses := []string{"pending", "approved", "rejected"}
	statusValid := false
	for _, status := range validStatuses {
		if req.Status == status {
			statusValid = true
			break
		}
	}
	if !statusValid {
		c.JSON(http.StatusBadRequest, gin.H{"error": "وضعیت انتخاب شده نامعتبر است"})
		return
	}

	userID, _ := c.Get("user_id")
	adminID := userID.(uint)

	// Update visitor status
	updates := map[string]interface{}{
		"status":      req.Status,
		"admin_notes": req.AdminNotes,
		"approved_by": adminID,
	}

	if req.Status == "approved" {
		now := time.Now()
		updates["approved_at"] = &now
	} else {
		updates["approved_at"] = nil
	}

	err = models.GetDB().Model(&models.Visitor{}).Where("id = ?", visitorID).Updates(updates).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در به‌روزرسانی وضعیت ویزیتور"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "وضعیت ویزیتور با موفقیت به‌روزرسانی شد",
	})
}

// UpdateVisitorByAdmin allows admin to update visitor information
func UpdateVisitorByAdmin(c *gin.Context) {
	// Check if user is admin (allow web admin roles)
	userRole, exists := c.Get("user_role")
	roleStr, ok := userRole.(string)
	if !exists || !ok || (roleStr != "admin" && roleStr != "super_admin" && roleStr != "moderator") {
		c.JSON(http.StatusForbidden, gin.H{"error": "دسترسی غیرمجاز"})
		return
	}

	visitorIDStr := c.Param("id")
	visitorID, err := strconv.ParseUint(visitorIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه ویزیتور نامعتبر است"})
		return
	}

	var req struct {
		FullName          string `json:"full_name"`
		Mobile            string `json:"mobile"`
		Email             string `json:"email"`
		CityProvince      string `json:"city_province"`
		DestinationCities string `json:"destination_cities"`
		AdminNotes        string `json:"admin_notes"`
		Status            string `json:"status"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "اطلاعات ارسالی نامعتبر است"})
		return
	}

	// Build updates map
	updates := make(map[string]interface{})
	if req.FullName != "" {
		updates["full_name"] = req.FullName
	}
	if req.Mobile != "" {
		updates["mobile"] = req.Mobile
	}
	if req.Email != "" {
		updates["email"] = req.Email
	}
	if req.CityProvince != "" {
		updates["city_province"] = req.CityProvince
	}
	if req.DestinationCities != "" {
		updates["destination_cities"] = req.DestinationCities
	}
	if req.AdminNotes != "" {
		updates["admin_notes"] = req.AdminNotes
	}
	if req.Status != "" {
		// Validate status
		validStatuses := []string{"pending", "approved", "rejected"}
		statusValid := false
		for _, status := range validStatuses {
			if req.Status == status {
				statusValid = true
				break
			}
		}
		if !statusValid {
			c.JSON(http.StatusBadRequest, gin.H{"error": "وضعیت انتخاب شده نامعتبر است"})
			return
		}
		updates["status"] = req.Status
		userID, _ := c.Get("user_id")
		adminID := userID.(uint)
		updates["approved_by"] = adminID

		if req.Status == "approved" {
			now := time.Now()
			updates["approved_at"] = &now
		} else {
			updates["approved_at"] = nil
		}
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "هیچ فیلدی برای به‌روزرسانی ارسال نشده است"})
		return
	}

	err = models.GetDB().Model(&models.Visitor{}).Where("id = ?", visitorID).Updates(updates).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در به‌روزرسانی اطلاعات ویزیتور"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "اطلاعات ویزیتور با موفقیت به‌روزرسانی شد",
	})
}

// UpdateMyVisitor allows user to update their own visitor information
func UpdateMyVisitor(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "لطفا ابتدا وارد شوید"})
		return
	}

	userIDUint := userID.(uint)

	// Get current visitor
	visitor, err := models.GetVisitorByUserID(models.GetDB(), userIDUint)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "اطلاعات ویزیتور یافت نشد"})
		return
	}

	var req models.VisitorRegistrationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "اطلاعات ارسالی نامعتبر است"})
		return
	}

	// Validate required fields
	if req.FullName == "" || req.NationalID == "" || req.BirthDate == "" ||
		req.Mobile == "" || req.ResidenceAddress == "" || req.CityProvince == "" ||
		req.DestinationCities == "" || req.BankAccountIBAN == "" || req.BankName == "" ||
		req.LanguageLevel == "" || req.DigitalSignature == "" || req.SignatureDate == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "لطفا تمام فیلدهای الزامی را پر کنید"})
		return
	}

	// Validate language level
	validLanguageLevels := []string{"excellent", "good", "weak", "none"}
	languageLevelValid := false
	for _, level := range validLanguageLevels {
		if req.LanguageLevel == level {
			languageLevelValid = true
			break
		}
	}
	if !languageLevelValid {
		c.JSON(http.StatusBadRequest, gin.H{"error": "سطح زبان انتخاب شده نامعتبر است"})
		return
	}

	// Validate agreements
	if !req.AgreesToUseApprovedProducts || !req.AgreesToViolationConsequences ||
		!req.AgreesToSubmitReports {
		c.JSON(http.StatusBadRequest, gin.H{"error": "لطفا تمام توافق‌نامه‌ها را بپذیرید"})
		return
	}

	// STRICT VALIDATION: Only Arabic countries allowed, NO Iranian locations
	// Flexible format: accepts any separator (space, comma, dash, etc.)
	if !validateArabicLocation(req.CityProvince, "شهر و کشور محل سکونت") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شهر و کشور محل سکونت باید از کشورهای عربی باشد. ویزیتورهای ایرانی پذیرفته نمی‌شوند."})
		return
	}

	// Validate destination cities
	// Split only by comma (Persian or English), not by space or dash
	// This allows "راس الخیمه امارات متحده عربی" to stay as one item
	trimmedInput := strings.TrimSpace(req.DestinationCities)
	if trimmedInput == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "لطفا حداقل یک شهر مقصد وارد کنید"})
		return
	}

	// Split only by comma (Persian or English comma), not by space or dash
	destinations := strings.FieldsFunc(trimmedInput, func(r rune) bool {
		return r == ',' || r == '،'
	})

	// If no comma found, treat the whole string as one destination
	if len(destinations) == 0 {
		destinations = []string{trimmedInput}
	}

	for _, dest := range destinations {
		dest = strings.TrimSpace(dest)
		if dest != "" {
			if !validateArabicLocation(dest, "شهرهای مقصد") {
				c.JSON(http.StatusBadRequest, gin.H{"error": "شهرهای مقصد باید از کشورهای عربی باشد. ویزیتورهای ایرانی پذیرفته نمی‌شوند."})
				return
			}
		}
	}

	// Update visitor information
	updates := map[string]interface{}{
		"full_name":                        req.FullName,
		"national_id":                      req.NationalID,
		"passport_number":                  req.PassportNumber,
		"birth_date":                       req.BirthDate,
		"mobile":                           req.Mobile,
		"whatsapp_number":                  req.WhatsappNumber,
		"email":                            req.Email,
		"residence_address":                req.ResidenceAddress,
		"city_province":                    req.CityProvince,
		"destination_cities":               req.DestinationCities,
		"has_local_contact":                req.HasLocalContact,
		"local_contact_details":            req.LocalContactDetails,
		"bank_account_iban":                req.BankAccountIBAN,
		"bank_name":                        req.BankName,
		"account_holder_name":              req.AccountHolderName,
		"has_marketing_experience":         req.HasMarketingExperience,
		"marketing_experience_desc":        req.MarketingExperienceDesc,
		"language_level":                   req.LanguageLevel,
		"special_skills":                   req.SpecialSkills,
		"interested_products":              req.InterestedProducts,
		"agrees_to_use_approved_products":  req.AgreesToUseApprovedProducts,
		"agrees_to_violation_consequences": req.AgreesToViolationConsequences,
		"agrees_to_submit_reports":         req.AgreesToSubmitReports,
		"digital_signature":                req.DigitalSignature,
		"signature_date":                   req.SignatureDate,
		"status":                           "pending", // Reset to pending after update
		"admin_notes":                      "",        // Clear admin notes
		"approved_at":                      nil,       // Clear approval
		"approved_by":                      nil,       // Clear approver
	}

	err = models.GetDB().Model(&models.Visitor{}).Where("id = ?", visitor.ID).Updates(updates).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در به‌روزرسانی اطلاعات ویزیتور"})
		return
	}

	// Get updated visitor
	updatedVisitor, err := models.GetVisitorByUserID(models.GetDB(), userIDUint)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت اطلاعات به‌روزرسانی شده"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "اطلاعات ویزیتور با موفقیت به‌روزرسانی شد. پس از بررسی مجدد توسط تیم ما، وضعیت شما اعلام خواهد شد.",
		"visitor": updatedVisitor,
	})
}

// DeleteMyVisitor allows user to delete their own visitor registration
func DeleteMyVisitor(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "لطفا ابتدا وارد شوید"})
		return
	}

	userIDUint := userID.(uint)

	// Delete visitor (this will check ownership automatically in the model function)
	err := models.DeleteVisitorByUserID(models.GetDB(), userIDUint)
	if err != nil {
		if err.Error() == "record not found" || err.Error() == "gorm.ErrRecordNotFound" {
			c.JSON(http.StatusNotFound, gin.H{"error": "اطلاعات ویزیتور یافت نشد"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در حذف اطلاعات ویزیتور"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "اطلاعات ویزیتور با موفقیت حذف شد",
	})
}

// DeleteVisitorByAdmin deletes a visitor by ID (admin only)
func DeleteVisitorByAdmin(c *gin.Context) {
	// Check if user is admin (allow web admin roles)
	userRole, exists := c.Get("user_role")
	roleStr, ok := userRole.(string)
	if !exists || !ok || (roleStr != "admin" && roleStr != "super_admin" && roleStr != "moderator") {
		c.JSON(http.StatusForbidden, gin.H{"error": "دسترسی غیرمجاز"})
		return
	}

	visitorIDStr := c.Param("id")
	visitorID, err := strconv.ParseUint(visitorIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه ویزیتور نامعتبر است"})
		return
	}

	err = models.DeleteVisitorByID(models.GetDB(), uint(visitorID))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "ویزیتور یافت نشد"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در حذف ویزیتور"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "ویزیتور با موفقیت حذف شد",
	})
}
