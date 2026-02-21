package controllers

import (
	"net/http"
	"strconv"

	"asl-market-backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ContactController struct {
	db *gorm.DB
}

func NewContactController(db *gorm.DB) *ContactController {
	return &ContactController{db: db}
}

// GetContactLimits returns current contact viewing limits for the user
func (cc *ContactController) GetContactLimits(c *gin.Context) {
	userID := getUserIDFromContext(c)

	var user models.User
	if err := cc.db.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "کاربر مورد نظر یافت نشد. لطفاً اطلاعات ورود خود را بررسی کنید."})
		return
	}

	limits, err := user.GetContactLimits(cc.db)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت محدودیت‌ها"})
		return
	}

	c.JSON(http.StatusOK, limits)
}

// ViewContactInfo allows user to view contact information if within limits
func (cc *ContactController) ViewContactInfo(c *gin.Context) {
	userID := getUserIDFromContext(c)

	var req models.ContactViewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "اطلاعات وارد شده صحیح نیست. لطفاً تمام فیلدهای الزامی را پر کنید."})
		return
	}

	var user models.User
	if err := cc.db.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "کاربر مورد نظر یافت نشد. لطفاً اطلاعات ورود خود را بررسی کنید."})
		return
	}

	// Check if user can view contact
	canView, err := user.CanViewContact(cc.db, req.TargetType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در بررسی محدودیت‌ها"})
		return
	}

	if !canView {
		limits, _ := user.GetContactLimits(cc.db)
		c.JSON(http.StatusForbidden, models.ContactViewResponse{
			Success:        false,
			Message:        "محدودیت روزانه دیدن اطلاعات تماس به پایان رسیده است",
			RemainingViews: limits.RemainingViews,
			TotalViews:     limits.TotalViewsToday,
			MaxViews:       limits.MaxDailyViews,
		})
		return
	}

	// Record the contact view
	if err := user.RecordContactView(cc.db, req.TargetType, req.TargetID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ثبت دیدن اطلاعات"})
		return
	}

	// Get contact information based on target type
	var contactInfo gin.H
	if req.TargetType == "supplier" {
		var supplier models.Supplier
		if err := cc.db.Preload("User").First(&supplier, req.TargetID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "تامین‌کننده یافت نشد"})
			return
		}

		contactInfo = gin.H{
			"id":     supplier.ID,
			"name":   supplier.BrandName,
			"mobile": supplier.Mobile,
			"email":  supplier.User.Email,
			"type":   "supplier",
		}
	} else if req.TargetType == "visitor" {
		var visitor models.Visitor
		if err := cc.db.Preload("User").First(&visitor, req.TargetID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "ویزیتور یافت نشد"})
			return
		}

		contactInfo = gin.H{
			"id":     visitor.ID,
			"name":   visitor.FullName,
			"mobile": visitor.Mobile,
			"email":  visitor.User.Email,
			"type":   "visitor",
		}
	} else if req.TargetType == "available_product" {
		var product models.AvailableProduct
		if err := cc.db.Preload("AddedBy").First(&product, req.TargetID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "کالا یافت نشد"})
			return
		}

		// Get contact info from product or added_by user
		mobile := product.ContactPhone
		email := product.ContactEmail
		if mobile == "" && product.AddedBy.ID != 0 {
			// Try to get from user
			var user models.User
			if err := cc.db.First(&user, product.AddedByID).Error; err == nil {
				if mobile == "" {
					mobile = user.Phone
				}
				if email == "" {
					email = user.Email
				}
			}
		}

		contactInfo = gin.H{
			"id":     product.ID,
			"name":   product.ProductName,
			"mobile": mobile,
			"email":  email,
			"type":   "available_product",
		}
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "نوع هدف نامعتبر"})
		return
	}

	// Get updated limits
	limits, _ := user.GetContactLimits(cc.db)

	response := models.ContactViewResponse{
		Success:        true,
		Message:        "اطلاعات تماس با موفقیت دریافت شد",
		RemainingViews: limits.RemainingViews,
		TotalViews:     limits.TotalViewsToday,
		MaxViews:       limits.MaxDailyViews,
	}

	c.JSON(http.StatusOK, gin.H{
		"response":     response,
		"contact_info": contactInfo,
	})
}

// GetContactHistory returns the user's contact viewing history
func (cc *ContactController) GetContactHistory(c *gin.Context) {
	userID := getUserIDFromContext(c)

	var contactViews []models.ContactViewLimit
	if err := cc.db.Where("user_id = ?", userID).Order("last_viewed_at DESC").Find(&contactViews).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت تاریخچه"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"contact_views": contactViews})
}

// CheckCanViewContact checks if user can view a specific contact without consuming the limit
func (cc *ContactController) CheckCanViewContact(c *gin.Context) {
	userID := getUserIDFromContext(c)
	targetType := c.Param("type")
	targetIDStr := c.Param("id")

	targetID, err := strconv.ParseUint(targetIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه نامعتبر"})
		return
	}

	var user models.User
	if err := cc.db.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "کاربر مورد نظر یافت نشد. لطفاً اطلاعات ورود خود را بررسی کنید."})
		return
	}

	canView, err := user.CanViewContact(cc.db, targetType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در بررسی محدودیت‌ها"})
		return
	}

	// Check if user has already viewed this specific contact
	var existingView models.ContactViewLimit
	hasViewed := cc.db.Where("user_id = ? AND target_type = ? AND target_id = ?",
		userID, targetType, uint(targetID)).First(&existingView).Error == nil

	limits, _ := user.GetContactLimits(cc.db)

	c.JSON(http.StatusOK, gin.H{
		"can_view":        canView,
		"has_viewed":      hasViewed,
		"remaining_views": limits.RemainingViews,
		"total_views":     limits.TotalViewsToday,
		"max_views":       limits.MaxDailyViews,
		"view_count":      existingView.ViewCount,
	})
}

// Helper function to get user ID from context (assuming it's set by auth middleware)
func getUserIDFromContext(c *gin.Context) uint {
	userID, exists := c.Get("user_id")
	if !exists {
		return 0
	}

	if id, ok := userID.(uint); ok {
		return id
	}

	if id, ok := userID.(float64); ok {
		return uint(id)
	}

	return 0
}
