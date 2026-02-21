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

// ProfileController handles user profile requests
type ProfileController struct {
	db *gorm.DB
}

// NewProfileController creates a new profile controller
func NewProfileController(db *gorm.DB) *ProfileController {
	return &ProfileController{db: db}
}

// GetUserProfile gets a user's public profile
func (pc *ProfileController) GetUserProfile(c *gin.Context) {
	userID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه کاربر معتبر نیست. لطفاً دوباره تلاش کنید."})
		return
	}

	// Get user
	user, err := models.GetUserByID(pc.db, uint(userID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "کاربر مورد نظر یافت نشد. لطفاً اطلاعات ورود خود را بررسی کنید."})
		return
	}

	// Build base user response
	userResp := user.ToResponse()

	// Determine viewer (for contact privacy)
	viewerIDVal, hasViewer := c.Get("user_id")
	isOwner := false
	isAdmin := false

	if hasViewer {
		if viewerID, ok := viewerIDVal.(uint); ok {
			if viewerID == uint(userID) {
				isOwner = true
			}

			// Check if viewer is admin
			if !isOwner {
				if viewerUser, err := models.GetUserByID(pc.db, viewerID); err == nil && viewerUser.IsAdmin {
					isAdmin = true
				}
			}
		}
	}

	// If viewer is not owner or admin, hide email/phone (تماس فقط از طریق مکانیزم محدودیت)
	if !isOwner && !isAdmin {
		userResp.Email = ""
		userResp.Phone = ""
	}

	// Build profile response
	profile := gin.H{
		"user": userResp,
	}

	// Check if user is a supplier
	supplier, err := models.GetSupplierByUserID(pc.db, uint(userID))
	if err == nil {
		// Get supplier products
		var products []models.SupplierProduct
		pc.db.Where("supplier_id = ?", supplier.ID).Find(&products)

		// Get matching requests
		var matchingRequests []models.MatchingRequest
		pc.db.Where("supplier_id = ? AND status IN ?", supplier.ID, []string{"active", "accepted", "completed"}).
			Order("created_at DESC").
			Limit(10).
			Find(&matchingRequests)

		// Get ratings
		avgRating, totalRatings, _ := models.GetAverageRatingForUser(pc.db, uint(userID))
		displayRating := avgRating
		if supplier.IsFeatured {
			displayRating = 5.0
		}

		profile["is_supplier"] = true
		profile["supplier"] = gin.H{
			"id":                      supplier.ID,
			"full_name":               supplier.FullName,
			"brand_name":              supplier.BrandName,
			"city":                    supplier.City,
			"image_url":               supplier.ImageURL,
			"is_featured":             supplier.IsFeatured,
			"tag_first_class":         supplier.TagFirstClass,
			"tag_good_price":          supplier.TagGoodPrice,
			"tag_export_experience":   supplier.TagExportExperience,
			"tag_export_packaging":    supplier.TagExportPackaging,
			"tag_supply_without_capital": supplier.TagSupplyWithoutCapital,
			"average_rating":          displayRating,
			"total_ratings":           totalRatings,
			"has_export_experience":   supplier.HasExportExperience,
			"can_produce_private_label": supplier.CanProducePrivateLabel,
			"has_registered_business": supplier.HasRegisteredBusiness,
			"status":                  supplier.Status,
			"created_at":              supplier.CreatedAt,
		}
		profile["products_count"] = len(products)
		profile["matching_requests_count"] = len(matchingRequests)
		profile["recent_matching_requests"] = matchingRequests
	} else {
		profile["is_supplier"] = false
	}

	// Check if user is a visitor
	visitor, err := models.GetVisitorByUserID(pc.db, uint(userID))
	if err == nil {
		// Get visitor projects
		var visitorProjects []models.VisitorProject
		pc.db.Where("visitor_id = ? AND status IN ?", visitor.ID, []string{"active", "accepted", "completed"}).
			Order("created_at DESC").
			Limit(10).
			Find(&visitorProjects)

		// Get matching responses
		var matchingResponses []models.MatchingResponse
		pc.db.Preload("MatchingRequest").
			Where("visitor_id = ? AND response_type = ?", visitor.ID, "accepted").
			Order("created_at DESC").
			Limit(10).
			Find(&matchingResponses)

		// Get ratings
		avgRating, totalRatings, _ := models.GetAverageRatingForUser(pc.db, uint(userID))

		profile["is_visitor"] = true
		profile["visitor"] = gin.H{
			"id":                  visitor.ID,
			"full_name":           visitor.FullName,
			"city_province":       visitor.CityProvince,
			"destination_cities":  visitor.DestinationCities,
			"is_featured":         visitor.IsFeatured,
			"language_level":      visitor.LanguageLevel,
			"average_rating":      avgRating,
			"total_ratings":       totalRatings,
			"status":              visitor.Status,
			"created_at":          visitor.CreatedAt,
		}
		profile["visitor_projects_count"] = len(visitorProjects)
		profile["matching_responses_count"] = len(matchingResponses)
		profile["recent_visitor_projects"] = visitorProjects
	} else {
		profile["is_visitor"] = false
	}

	// Get user's license info
	hasLicense, _ := models.CheckUserLicense(pc.db, uint(userID))
	if hasLicense {
		var license models.License
		if err := pc.db.Where("used_by = ? AND is_used = ?", userID, true).
			Order("expires_at DESC").First(&license).Error; err == nil {
			// Check if not expired
			isActive := license.ExpiresAt != nil && license.ExpiresAt.After(time.Now())
			profile["has_license"] = true
			profile["license"] = gin.H{
				"is_active":  isActive,
				"expires_at": license.ExpiresAt,
			}
		} else {
			profile["has_license"] = false
		}
	} else {
		profile["has_license"] = false
	}

	// Get user's activity stats
	var chatsCount int64
	pc.db.Model(&models.MatchingChat{}).
		Joins("INNER JOIN suppliers ON suppliers.id = matching_chats.supplier_id OR matching_chats.supplier_id IN (SELECT id FROM suppliers WHERE user_id = ?)", userID).
		Count(&chatsCount)

	profile["activity"] = gin.H{
		"total_chats": chatsCount,
		"member_since": user.CreatedAt.Format("2006-01-02"),
	}

	c.JSON(http.StatusOK, profile)
}

// UpdateProfileImages updates user's profile and cover images
func (pc *ProfileController) UpdateProfileImages(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "برای دسترسی به این بخش، لطفاً ابتدا وارد حساب کاربری خود شوید."})
		return
	}

	var req struct {
		ProfileImageURL string `json:"profile_image_url"`
		CoverImageURL   string `json:"cover_image_url"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "اطلاعات نامعتبر است"})
		return
	}

	if err := models.UpdateProfileImages(pc.db, userID.(uint), req.ProfileImageURL, req.CoverImageURL); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در به‌روزرسانی تصاویر"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "تصاویر پروفایل با موفقیت به‌روزرسانی شد"})
}

// UpdateProfile updates user's profile information
func (pc *ProfileController) UpdateProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "برای دسترسی به این بخش، لطفاً ابتدا وارد حساب کاربری خود شوید."})
		return
	}

	var req models.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "اطلاعات نامعتبر است"})
		return
	}

	updates := make(map[string]interface{})
	if req.FirstName != "" {
		updates["first_name"] = req.FirstName
	}
	if req.LastName != "" {
		updates["last_name"] = req.LastName
	}
	if req.Email != "" {
		updates["email"] = req.Email
	}
	if req.Bio != "" {
		updates["bio"] = req.Bio
	}
	if req.Location != "" {
		updates["location"] = req.Location
	}
	if req.Website != "" {
		updates["website"] = req.Website
	}
	if req.SocialMediaLinks != "" {
		updates["social_media_links"] = req.SocialMediaLinks
	}

	if err := pc.db.Model(&models.User{}).Where("id = ?", userID).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در به‌روزرسانی پروفایل"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "پروفایل با موفقیت به‌روزرسانی شد"})
}

// UploadProfileImage handles profile image upload
func (pc *ProfileController) UploadProfileImage(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "برای دسترسی به این بخش، لطفاً ابتدا وارد حساب کاربری خود شوید."})
		return
	}

	file, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "لطفاً یک تصویر انتخاب کنید"})
		return
	}

	// Generate unique filename
	filename := fmt.Sprintf("profile_%d_%d_%s", userID, time.Now().Unix(), file.Filename)
	filepath := "./uploads/profiles/" + filename

	// Save file
	if err := c.SaveUploadedFile(file, filepath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در آپلود تصویر"})
		return
	}

	imageURL := "/uploads/profiles/" + filename

	// Update user's profile image
	if err := models.UpdateProfileImages(pc.db, userID.(uint), imageURL, ""); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در به‌روزرسانی تصویر پروفایل"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "تصویر پروفایل با موفقیت آپلود شد",
		"image_url": imageURL,
	})
}

// UploadCoverImage handles cover image upload
func (pc *ProfileController) UploadCoverImage(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "برای دسترسی به این بخش، لطفاً ابتدا وارد حساب کاربری خود شوید."})
		return
	}

	file, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "لطفاً یک تصویر انتخاب کنید"})
		return
	}

	// Generate unique filename
	filename := fmt.Sprintf("cover_%d_%d_%s", userID, time.Now().Unix(), file.Filename)
	filepath := "./uploads/covers/" + filename

	// Save file
	if err := c.SaveUploadedFile(file, filepath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در آپلود تصویر"})
		return
	}

	imageURL := "/uploads/covers/" + filename

	// Update user's cover image
	if err := models.UpdateProfileImages(pc.db, userID.(uint), "", imageURL); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در به‌روزرسانی تصویر پس‌زمینه"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "تصویر پس‌زمینه با موفقیت آپلود شد",
		"image_url": imageURL,
	})
}

