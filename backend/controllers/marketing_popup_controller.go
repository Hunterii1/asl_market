package controllers

import (
	"asl-market-backend/models"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// GetMarketingPopups retrieves marketing popups with pagination and filters
func GetMarketingPopups(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "10"))
	activeOnly, _ := strconv.ParseBool(c.DefaultQuery("active_only", "false"))

	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 10
	}

	db := models.GetDB()
	popups, total, err := models.GetMarketingPopups(db, page, perPage, activeOnly)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch marketing popups"})
		return
	}

	// Convert to response format
	var responses []models.MarketingPopupResponse
	for _, popup := range popups {
		responses = append(responses, models.MarketingPopupResponse{
			ID:          popup.ID,
			Title:       popup.Title,
			Message:     popup.Message,
			DiscountURL: popup.DiscountURL,
			ButtonText:  popup.ButtonText,
			IsActive:    popup.IsActive,
			StartDate:   popup.StartDate,
			EndDate:     popup.EndDate,
			ShowCount:   popup.ShowCount,
			ClickCount:  popup.ClickCount,
			Priority:    popup.Priority,
			AddedBy: models.UserResponse{
				ID:        popup.AddedBy.ID,
				FirstName: popup.AddedBy.FirstName,
				LastName:  popup.AddedBy.LastName,
				Email:     popup.AddedBy.Email,
			},
			CreatedAt: popup.CreatedAt,
			UpdatedAt: popup.UpdatedAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"popups":      responses,
		"total":       total,
		"page":        page,
		"per_page":    perPage,
		"total_pages": (total + int64(perPage) - 1) / int64(perPage),
	})
}

// GetActiveMarketingPopup gets the currently active popup for display
func GetActiveMarketingPopup(c *gin.Context) {
	db := models.GetDB()
	popup, err := models.GetActiveMarketingPopup(db)
	if err != nil {
		// No active popup found is not an error
		c.JSON(http.StatusOK, gin.H{"popup": nil})
		return
	}

	// Increment show count
	models.IncrementShowCount(db, popup.ID)

	response := models.MarketingPopupResponse{
		ID:          popup.ID,
		Title:       popup.Title,
		Message:     popup.Message,
		DiscountURL: popup.DiscountURL,
		ButtonText:  popup.ButtonText,
		IsActive:    popup.IsActive,
		StartDate:   popup.StartDate,
		EndDate:     popup.EndDate,
		ShowCount:   popup.ShowCount,
		ClickCount:  popup.ClickCount,
		Priority:    popup.Priority,
		CreatedAt:   popup.CreatedAt,
		UpdatedAt:   popup.UpdatedAt,
	}

	c.JSON(http.StatusOK, gin.H{"popup": response})
}

// GetMarketingPopup retrieves a specific marketing popup by ID
func GetMarketingPopup(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid popup ID"})
		return
	}

	db := models.GetDB()
	popup, err := models.GetMarketingPopupByID(db, uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Marketing popup not found"})
		return
	}

	response := models.MarketingPopupResponse{
		ID:          popup.ID,
		Title:       popup.Title,
		Message:     popup.Message,
		DiscountURL: popup.DiscountURL,
		ButtonText:  popup.ButtonText,
		IsActive:    popup.IsActive,
		StartDate:   popup.StartDate,
		EndDate:     popup.EndDate,
		ShowCount:   popup.ShowCount,
		ClickCount:  popup.ClickCount,
		Priority:    popup.Priority,
		AddedBy: models.UserResponse{
			ID:        popup.AddedBy.ID,
			FirstName: popup.AddedBy.FirstName,
			LastName:  popup.AddedBy.LastName,
			Email:     popup.AddedBy.Email,
		},
		CreatedAt: popup.CreatedAt,
		UpdatedAt: popup.UpdatedAt,
	}

	c.JSON(http.StatusOK, response)
}

// CreateMarketingPopup creates a new marketing popup (admin only)
func CreateMarketingPopup(c *gin.Context) {
	// Get user from middleware
	userInterface, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	user := userInterface.(models.User)

	// Check if user is admin
	if !user.IsAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
		return
	}

	var req models.MarketingPopupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := models.GetDB()
	popup, err := models.CreateMarketingPopup(db, user.ID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create marketing popup"})
		return
	}

	response := models.MarketingPopupResponse{
		ID:          popup.ID,
		Title:       popup.Title,
		Message:     popup.Message,
		DiscountURL: popup.DiscountURL,
		ButtonText:  popup.ButtonText,
		IsActive:    popup.IsActive,
		StartDate:   popup.StartDate,
		EndDate:     popup.EndDate,
		ShowCount:   popup.ShowCount,
		ClickCount:  popup.ClickCount,
		Priority:    popup.Priority,
		AddedBy: models.UserResponse{
			ID:        popup.AddedBy.ID,
			FirstName: popup.AddedBy.FirstName,
			LastName:  popup.AddedBy.LastName,
			Email:     popup.AddedBy.Email,
		},
		CreatedAt: popup.CreatedAt,
		UpdatedAt: popup.UpdatedAt,
	}

	c.JSON(http.StatusCreated, response)
}

// UpdateMarketingPopup updates an existing marketing popup (admin only)
func UpdateMarketingPopup(c *gin.Context) {
	// Get user from middleware
	userInterface, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	user := userInterface.(models.User)

	// Check if user is admin
	if !user.IsAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid popup ID"})
		return
	}

	var req models.MarketingPopupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := models.GetDB()
	popup, err := models.UpdateMarketingPopup(db, uint(id), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update marketing popup"})
		return
	}

	response := models.MarketingPopupResponse{
		ID:          popup.ID,
		Title:       popup.Title,
		Message:     popup.Message,
		DiscountURL: popup.DiscountURL,
		ButtonText:  popup.ButtonText,
		IsActive:    popup.IsActive,
		StartDate:   popup.StartDate,
		EndDate:     popup.EndDate,
		ShowCount:   popup.ShowCount,
		ClickCount:  popup.ClickCount,
		Priority:    popup.Priority,
		AddedBy: models.UserResponse{
			ID:        popup.AddedBy.ID,
			FirstName: popup.AddedBy.FirstName,
			LastName:  popup.AddedBy.LastName,
			Email:     popup.AddedBy.Email,
		},
		CreatedAt: popup.CreatedAt,
		UpdatedAt: popup.UpdatedAt,
	}

	c.JSON(http.StatusOK, response)
}

// DeleteMarketingPopup deletes a marketing popup (admin only)
func DeleteMarketingPopup(c *gin.Context) {
	// Get user from middleware
	userInterface, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	user := userInterface.(models.User)

	// Check if user is admin
	if !user.IsAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid popup ID"})
		return
	}

	db := models.GetDB()
	if err := models.DeleteMarketingPopup(db, uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete marketing popup"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Marketing popup deleted successfully"})
}

// TrackPopupClick tracks when a user clicks on a popup
func TrackPopupClick(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid popup ID"})
		return
	}

	db := models.GetDB()
	if err := models.IncrementClickCount(db, uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to track click"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Click tracked successfully"})
}
