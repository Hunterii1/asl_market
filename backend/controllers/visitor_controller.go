package controllers

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"asl-market-backend/models"

	"github.com/gin-gonic/gin"
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

	// Validate destination cities (split by comma, dash, space, or any separator and check each)
	destinations := strings.FieldsFunc(req.DestinationCities, func(r rune) bool {
		return r == ',' || r == '،' || r == '-' || r == '–' || r == ' ' || r == '\n'
	})
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
		CreatedAt:                     visitor.CreatedAt,
	}

	c.JSON(http.StatusOK, gin.H{
		"has_visitor": true,
		"visitor":     response,
	})
}

// GetApprovedVisitors returns list of approved visitors (for internal use)
func GetApprovedVisitors(c *gin.Context) {
	// This endpoint might be used for admin purposes or internal communications
	visitors, err := models.GetApprovedVisitors(models.GetDB())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت لیست ویزیتورها"})
		return
	}

	var response []models.VisitorResponse
	for _, visitor := range visitors {
		visitorResponse := models.VisitorResponse{
			ID:                visitor.ID,
			UserID:            visitor.UserID,
			FullName:          visitor.FullName,
			Mobile:            visitor.Mobile,
			CityProvince:      visitor.CityProvince,
			DestinationCities: visitor.DestinationCities,
			LanguageLevel:     visitor.LanguageLevel,
			Status:            visitor.Status,
			CreatedAt:         visitor.CreatedAt,
		}
		response = append(response, visitorResponse)
	}

	c.JSON(http.StatusOK, gin.H{
		"visitors": response,
		"count":    len(response),
	})
}

// GetVisitorsForAdmin returns paginated list of visitors for admin panel
func GetVisitorsForAdmin(c *gin.Context) {
	// Check if user is admin
	userRole, exists := c.Get("user_role")
	if !exists || userRole != "admin" {
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
	// Check if user is admin
	userRole, exists := c.Get("user_role")
	if !exists || userRole != "admin" {
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

	// TODO: Send Telegram notification when TelegramChatID is added to User model

	c.JSON(http.StatusOK, gin.H{
		"message": "ویزیتور با موفقیت تایید شد",
	})
}

// RejectVisitorByAdmin rejects a visitor registration
func RejectVisitorByAdmin(c *gin.Context) {
	// Check if user is admin
	userRole, exists := c.Get("user_role")
	if !exists || userRole != "admin" {
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

	// TODO: Send Telegram notification when TelegramChatID is added to User model

	c.JSON(http.StatusOK, gin.H{
		"message": "درخواست ویزیتور رد شد",
	})
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
	// Check if user is admin
	userRole, exists := c.Get("user_role")
	if !exists || userRole != "admin" {
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
		CreatedAt:                     visitor.CreatedAt,
	}

	c.JSON(http.StatusOK, gin.H{
		"visitor": response,
		"user":    visitor.User,
	})
}

// UpdateVisitorStatus allows admin to update visitor status with notes
func UpdateVisitorStatus(c *gin.Context) {
	// Check if user is admin
	userRole, exists := c.Get("user_role")
	if !exists || userRole != "admin" {
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

	// Validate destination cities (split by comma, dash, or any separator and check each)
	destinations := strings.FieldsFunc(req.DestinationCities, func(r rune) bool {
		return r == ',' || r == '،' || r == '-' || r == '–' || r == ' ' || r == '\n'
	})
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
