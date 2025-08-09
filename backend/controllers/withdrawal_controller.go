package controllers

import (
	"log"
	"net/http"
	"strconv"

	"asl-market-backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type WithdrawalController struct {
	db *gorm.DB
}

func NewWithdrawalController(db *gorm.DB) *WithdrawalController {
	return &WithdrawalController{db: db}
}

// CreateWithdrawalRequest creates a new withdrawal request
func (wc *WithdrawalController) CreateWithdrawalRequest(c *gin.Context) {
	userID := c.GetUint("user_id")

	var req struct {
		Amount         float64 `json:"amount" binding:"required,gt=0"`
		Currency       string  `json:"currency" binding:"required,oneof=USD AED SAR KWD QAR BHD OMR"`
		SourceCountry  string  `json:"source_country" binding:"required,oneof=AE SA KW QA BH OM"`
		BankCardNumber string  `json:"bank_card_number" binding:"required"`
		CardHolderName string  `json:"card_holder_name" binding:"required"`
		ShebaNumber    string  `json:"sheba_number" binding:"required"`
		BankName       string  `json:"bank_name" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "درخواست نامعتبر است"})
		return
	}

	withdrawalRequest := &models.WithdrawalRequest{
		UserID:         userID,
		Amount:         req.Amount,
		Currency:       req.Currency,
		SourceCountry:  req.SourceCountry,
		BankCardNumber: req.BankCardNumber,
		CardHolderName: req.CardHolderName,
		ShebaNumber:    req.ShebaNumber,
		BankName:       req.BankName,
	}

	if err := models.CreateWithdrawalRequest(wc.db, withdrawalRequest); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ثبت درخواست"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "درخواست برداشت با موفقیت ثبت شد",
		"request": withdrawalRequest,
	})
}

// GetUserWithdrawalRequests gets all withdrawal requests for the authenticated user
func (wc *WithdrawalController) GetUserWithdrawalRequests(c *gin.Context) {
	userID := c.GetUint("user_id")

	requests, err := models.GetUserWithdrawalRequests(wc.db, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت درخواست‌ها"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"requests": requests,
	})
}

// GetWithdrawalRequest gets a specific withdrawal request by ID
func (wc *WithdrawalController) GetWithdrawalRequest(c *gin.Context) {
	userID := c.GetUint("user_id")
	requestIDStr := c.Param("id")

	requestID, err := strconv.ParseUint(requestIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه درخواست نامعتبر است"})
		return
	}

	request, err := models.GetWithdrawalRequestByID(wc.db, uint(requestID))
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "درخواست یافت نشد"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت درخواست"})
		return
	}

	// Check if the request belongs to the authenticated user
	if request.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "دسترسی مجاز نیست"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"request": request,
	})
}

// GetUserWithdrawalStats gets withdrawal statistics for the authenticated user
func (wc *WithdrawalController) GetUserWithdrawalStats(c *gin.Context) {
	userID := c.GetUint("user_id")

	stats, err := models.GetWithdrawalStats(wc.db, &userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت آمار"})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// Admin endpoints

// GetAllWithdrawalRequests gets all withdrawal requests (admin only)
func (wc *WithdrawalController) GetAllWithdrawalRequests(c *gin.Context) {
	// Parse query parameters
	limitStr := c.DefaultQuery("limit", "10")
	offsetStr := c.DefaultQuery("offset", "0")
	statusStr := c.Query("status")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 10
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	var status *models.WithdrawalStatus
	if statusStr != "" {
		s := models.WithdrawalStatus(statusStr)
		status = &s
	}

	requests, total, err := models.GetWithdrawalRequests(wc.db, nil, status, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت درخواست‌ها"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"requests": requests,
		"total":    total,
		"limit":    limit,
		"offset":   offset,
	})
}

// UpdateWithdrawalStatus updates the status of a withdrawal request (admin only)
func (wc *WithdrawalController) UpdateWithdrawalStatus(c *gin.Context) {
	adminID := c.GetUint("user_id")
	requestIDStr := c.Param("id")

	requestID, err := strconv.ParseUint(requestIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه درخواست نامعتبر است"})
		return
	}

	var req struct {
		Status             string `json:"status" binding:"required,oneof=pending approved processing completed rejected"`
		AdminNotes         string `json:"admin_notes"`
		DestinationAccount string `json:"destination_account"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "درخواست نامعتبر است"})
		return
	}

	// Check if the request exists
	_, err = models.GetWithdrawalRequestByID(wc.db, uint(requestID))
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "درخواست یافت نشد"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت درخواست"})
		return
	}

	status := models.WithdrawalStatus(req.Status)
	if err := models.UpdateWithdrawalStatus(wc.db, uint(requestID), status, &adminID, req.AdminNotes, req.DestinationAccount); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در بروزرسانی وضعیت"})
		return
	}

	// Get updated request
	updatedRequest, _ := models.GetWithdrawalRequestByID(wc.db, uint(requestID))

	c.JSON(http.StatusOK, gin.H{
		"message": "وضعیت درخواست با موفقیت بروزرسانی شد",
		"request": updatedRequest,
	})
}

// GetAllWithdrawalStats gets withdrawal statistics for all users (admin only)
func (wc *WithdrawalController) GetAllWithdrawalStats(c *gin.Context) {
	stats, err := models.GetWithdrawalStats(wc.db, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت آمار"})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// UploadReceipt uploads a receipt for a withdrawal request
func (wc *WithdrawalController) UploadReceipt(c *gin.Context) {
	userID := c.GetUint("user_id")
	requestIDStr := c.Param("id")

	requestID, err := strconv.ParseUint(requestIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "شناسه درخواست نامعتبر است"})
		return
	}

	// Check if the request exists and belongs to the user
	request, err := models.GetWithdrawalRequestByID(wc.db, uint(requestID))
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "درخواست یافت نشد"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت درخواست"})
		return
	}

	if request.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "دسترسی مجاز نیست"})
		return
	}

	// Check if status allows receipt upload
	if request.Status != models.WithdrawalStatusProcessing && request.Status != models.WithdrawalStatusApproved {
		c.JSON(http.StatusBadRequest, gin.H{"error": "فقط در حالت تایید شده یا پردازش امکان بارگذاری فیش وجود دارد"})
		return
	}

	file, err := c.FormFile("receipt")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "فایل فیش یافت نشد"})
		return
	}

	// Save file (implement file saving logic here)
	filename := "receipts/withdrawal_" + requestIDStr + "_" + file.Filename
	if err := c.SaveUploadedFile(file, "uploads/"+filename); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ذخیره فایل"})
		return
	}

	// Update request with receipt path
	if err := models.UploadReceipt(wc.db, uint(requestID), filename); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در بروزرسانی درخواست"})
		return
	}

	// If the status was approved, change it to processing after receipt upload
	if request.Status == models.WithdrawalStatusApproved {
		if err := models.UpdateWithdrawalStatus(wc.db, uint(requestID), models.WithdrawalStatusProcessing, nil, "کاربر فیش را بارگذاری کرد", ""); err != nil {
			// Log error but don't fail the request since receipt was uploaded successfully
			log.Printf("Failed to update status to processing after receipt upload: %v", err)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message":      "فیش با موفقیت بارگذاری شد",
		"receipt_path": filename,
	})
}
