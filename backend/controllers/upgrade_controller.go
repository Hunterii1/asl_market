package controllers

import (
	"asl-market-backend/models"
	"asl-market-backend/services"
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type UpgradeController struct {
	telegramService *services.TelegramService
}

func NewUpgradeController(telegramService *services.TelegramService) *UpgradeController {
	return &UpgradeController{
		telegramService: telegramService,
	}
}

type CreateUpgradeRequestDTO struct {
	ToPlan      string `json:"to_plan" binding:"required"`
	RequestNote string `json:"request_note"`
}

// CreateUpgradeRequest creates a new upgrade request
func (uc *UpgradeController) CreateUpgradeRequest(c *gin.Context) {
	userID := c.GetUint("user_id")

	// Debug log
	log.Printf("Upgrade request from user ID: %d", userID)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	var dto CreateUpgradeRequestDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "داده‌های ارسالی نامعتبر است"})
		return
	}

	// Check if user already has a pending upgrade request
	hasPending, err := models.HasPendingUpgradeRequest(models.DB, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در بررسی درخواست‌های قبلی"})
		return
	}

	if hasPending {
		c.JSON(http.StatusConflict, gin.H{"error": "شما درخواست ارتقا در انتظار بررسی دارید"})
		return
	}

	// Get user's current license
	license, err := models.GetUserLicense(models.DB, userID)
	if err != nil {
		log.Printf("License not found for user %d: %v", userID, err)
		c.JSON(http.StatusNotFound, gin.H{"error": "لایسنس کاربر یافت نشد"})
		return
	}

	// Debug log
	log.Printf("User %d license type: '%s', requesting upgrade to: '%s'", userID, license.Type, dto.ToPlan)

	// Validate upgrade path (only Plus to Pro for now)
	if license.Type != "Plus" || dto.ToPlan != "Pro" {
		log.Printf("Upgrade validation failed: license.Type='%s', dto.ToPlan='%s'", license.Type, dto.ToPlan)
		c.JSON(http.StatusBadRequest, gin.H{"error": "ارتقا فقط از پلن پلاس به پرو امکان‌پذیر است"})
		return
	}

	// Create upgrade request
	request, err := models.CreateUpgradeRequest(models.DB, userID, license.Type, dto.ToPlan, dto.RequestNote)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ایجاد درخواست ارتقا"})
		return
	}

	// Get user info for notification
	user, err := models.GetUserByID(models.DB, userID)
	if err == nil {
		// Notify admin via Telegram
		go uc.telegramService.NotifyUpgradeRequest(request, user)
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "درخواست ارتقا با موفقیت ثبت شد",
		"request": request,
	})
}

// GetUserUpgradeRequests gets all upgrade requests for the current user
func (uc *UpgradeController) GetUserUpgradeRequests(c *gin.Context) {
	userID := c.GetUint("user_id")

	requests, err := models.GetUserUpgradeRequests(models.DB, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت درخواست‌ها"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"requests": requests})
}

// ApproveUpgradeRequest approves an upgrade request (admin only)
func (uc *UpgradeController) ApproveUpgradeRequest(c *gin.Context) {
	requestIDStr := c.Param("id")
	requestID, err := strconv.ParseUint(requestIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه درخواست نامعتبر است"})
		return
	}

	var dto struct {
		AdminNote string `json:"admin_note"`
	}
	c.ShouldBindJSON(&dto)

	// Get the upgrade request
	request, err := models.GetUpgradeRequestByID(models.DB, uint(requestID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "درخواست یافت نشد"})
		return
	}

	if request.Status != models.UpgradeRequestStatusPending {
		c.JSON(http.StatusConflict, gin.H{"error": "این درخواست قبلاً پردازش شده است"})
		return
	}

	// Update request status
	adminID := c.GetUint("user_id")
	err = models.UpdateUpgradeRequestStatus(models.DB, uint(requestID), models.UpgradeRequestStatusApproved, dto.AdminNote, adminID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در تایید درخواست"})
		return
	}

	// Update user's license to Pro
	err = models.UpdateUserLicenseType(models.DB, request.UserID, "Pro")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ارتقا لایسنس"})
		return
	}

	// Notify user via Telegram (if possible)
	go uc.telegramService.NotifyUpgradeResult(request.UserID, true, dto.AdminNote)

	c.JSON(http.StatusOK, gin.H{"message": "درخواست ارتقا تایید شد"})
}

// RejectUpgradeRequest rejects an upgrade request (admin only)
func (uc *UpgradeController) RejectUpgradeRequest(c *gin.Context) {
	requestIDStr := c.Param("id")
	requestID, err := strconv.ParseUint(requestIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه درخواست نامعتبر است"})
		return
	}

	var dto struct {
		AdminNote string `json:"admin_note" binding:"required"`
	}
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "دلیل رد درخواست الزامی است"})
		return
	}

	// Get the upgrade request
	request, err := models.GetUpgradeRequestByID(models.DB, uint(requestID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "درخواست یافت نشد"})
		return
	}

	if request.Status != models.UpgradeRequestStatusPending {
		c.JSON(http.StatusConflict, gin.H{"error": "این درخواست قبلاً پردازش شده است"})
		return
	}

	// Update request status
	adminID := c.GetUint("user_id")
	err = models.UpdateUpgradeRequestStatus(models.DB, uint(requestID), models.UpgradeRequestStatusRejected, dto.AdminNote, adminID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در رد درخواست"})
		return
	}

	// Notify user via Telegram (if possible)
	go uc.telegramService.NotifyUpgradeResult(request.UserID, false, dto.AdminNote)

	c.JSON(http.StatusOK, gin.H{"message": "درخواست ارتقا رد شد"})
}

// GetPendingUpgradeRequests gets all pending upgrade requests (admin only)
func (uc *UpgradeController) GetPendingUpgradeRequests(c *gin.Context) {
	requests, err := models.GetPendingUpgradeRequests(models.DB)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت درخواست‌ها"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"requests": requests})
}
