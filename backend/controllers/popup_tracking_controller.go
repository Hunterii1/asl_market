package controllers

import (
	"net/http"
	"time"

	"asl-market-backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type PopupTrackingController struct {
	db *gorm.DB
}

func NewPopupTrackingController(db *gorm.DB) *PopupTrackingController {
	return &PopupTrackingController{db: db}
}

// PopupType represents the type of popup shown
type PopupType string

const (
	PopupTypeLicense     PopupType = "license"      // Initial popup after login without license
	PopupTypePostLogin   PopupType = "post_login"   // Popup shown right after login
	PopupTypeBrowsing    PopupType = "browsing"     // Popup shown after 2 minutes of browsing
)

// MarkPopupSeenRequest represents request to mark popup as seen
type MarkPopupSeenRequest struct {
	PopupType PopupType `json:"popup_type" binding:"required,oneof=license post_login browsing"`
}

// GetPopupStatusResponse returns popup visibility status
type GetPopupStatusResponse struct {
	ShouldShowPopup bool      `json:"should_show_popup"`
	PopupType       PopupType `json:"popup_type,omitempty"`
	HasLicense      bool      `json:"has_license"`
	Message         string    `json:"message,omitempty"`
}

// GetPopupStatus checks if user should see any popup
func (pc *PopupTrackingController) GetPopupStatus(c *gin.Context) {
	userID := c.GetUint("user_id")

	var user models.User
	if err := pc.db.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Check if user has active license
	var license models.License
	hasLicense := pc.db.Where("used_by = ? AND is_used = ? AND expires_at > ?", 
		userID, true, time.Now()).First(&license).Error == nil

	response := GetPopupStatusResponse{
		HasLicense: hasLicense,
	}

	// If user has license, never show popup
	if hasLicense {
		response.ShouldShowPopup = false
		response.Message = "User has active license"
		c.JSON(http.StatusOK, response)
		return
	}

	// Check which popup should be shown (priority order)
	// 1. Post-login popup (shown once right after login if not seen)
	if !user.HasSeenPostLoginPopup {
		response.ShouldShowPopup = true
		response.PopupType = PopupTypePostLogin
		response.Message = "Show post-login popup"
		c.JSON(http.StatusOK, response)
		return
	}

	// 2. Browsing popup (shown after 2 minutes if not seen)
	if !user.HasSeenBrowsingPopup {
		response.ShouldShowPopup = true
		response.PopupType = PopupTypeBrowsing
		response.Message = "Show browsing popup after 2 minutes"
		c.JSON(http.StatusOK, response)
		return
	}

	// All popups have been shown
	response.ShouldShowPopup = false
	response.Message = "All popups already shown"
	c.JSON(http.StatusOK, response)
}

// MarkPopupSeen marks a popup as seen by the user
func (pc *PopupTrackingController) MarkPopupSeen(c *gin.Context) {
	userID := c.GetUint("user_id")

	var req MarkPopupSeenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := pc.db.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	now := time.Now()
	updates := make(map[string]interface{})

	switch req.PopupType {
	case PopupTypeLicense:
		updates["has_seen_license_popup"] = true
		updates["license_popup_shown_at"] = now
	case PopupTypePostLogin:
		updates["has_seen_post_login_popup"] = true
		updates["post_login_popup_shown_at"] = now
	case PopupTypeBrowsing:
		updates["has_seen_browsing_popup"] = true
		updates["browsing_popup_shown_at"] = now
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid popup type"})
		return
	}

	if err := pc.db.Model(&user).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update popup status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Popup marked as seen",
		"popup_type": req.PopupType,
	})
}

// ResetPopupStatus resets all popup tracking (admin only, for testing)
func (pc *PopupTrackingController) ResetPopupStatus(c *gin.Context) {
	userID := c.GetUint("user_id")

	updates := map[string]interface{}{
		"has_seen_license_popup":     false,
		"license_popup_shown_at":     nil,
		"has_seen_post_login_popup":  false,
		"post_login_popup_shown_at":  nil,
		"has_seen_browsing_popup":    false,
		"browsing_popup_shown_at":    nil,
	}

	if err := pc.db.Model(&models.User{}).Where("id = ?", userID).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reset popup status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Popup status reset successfully",
	})
}
