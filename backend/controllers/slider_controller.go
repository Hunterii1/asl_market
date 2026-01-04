package controllers

import (
	"asl-market-backend/models"
	"asl-market-backend/utils"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// GetSliders retrieves sliders with pagination and filters
func GetSliders(c *gin.Context) {
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
	sliders, total, err := models.GetSliders(db, page, perPage, activeOnly)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch sliders"})
		return
	}

	// Convert to response format
	var responses []models.SliderResponse
	for _, slider := range sliders {
		responses = append(responses, models.SliderResponse{
			ID:         slider.ID,
			ImageURL:   slider.ImageURL,
			Link:       slider.Link,
			LinkType:   slider.LinkType,
			IsActive:   slider.IsActive,
			Order:      slider.Order,
			ClickCount: slider.ClickCount,
			ViewCount:  slider.ViewCount,
			AddedBy: models.UserResponse{
				ID:        slider.AddedBy.ID,
				FirstName: slider.AddedBy.FirstName,
				LastName:  slider.AddedBy.LastName,
				Email:     slider.AddedBy.Email,
			},
			CreatedAt: slider.CreatedAt,
			UpdatedAt: slider.UpdatedAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"sliders":     responses,
		"total":       total,
		"page":        page,
		"per_page":    perPage,
		"total_pages": (total + int64(perPage) - 1) / int64(perPage),
	})
}

// GetActiveSliders gets all active sliders for display
func GetActiveSliders(c *gin.Context) {
	db := models.GetDB()
	sliders, err := models.GetActiveSliders(db)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch sliders"})
		return
	}

	// Convert to response format
	var responses []models.SliderResponse
	for _, slider := range sliders {
		responses = append(responses, models.SliderResponse{
			ID:         slider.ID,
			ImageURL:   slider.ImageURL,
			Link:       slider.Link,
			LinkType:   slider.LinkType,
			IsActive:   slider.IsActive,
			Order:      slider.Order,
			ClickCount: slider.ClickCount,
			ViewCount:  slider.ViewCount,
			CreatedAt:  slider.CreatedAt,
			UpdatedAt:  slider.UpdatedAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{"sliders": responses})
}

// GetSlider retrieves a specific slider by ID
func GetSlider(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid slider ID"})
		return
	}

	db := models.GetDB()
	slider, err := models.GetSliderByID(db, uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Slider not found"})
		return
	}

	response := models.SliderResponse{
		ID:         slider.ID,
		ImageURL:   slider.ImageURL,
		Link:       slider.Link,
		LinkType:   slider.LinkType,
		IsActive:   slider.IsActive,
		Order:      slider.Order,
		ClickCount: slider.ClickCount,
		ViewCount:  slider.ViewCount,
		AddedBy: models.UserResponse{
			ID:        slider.AddedBy.ID,
			FirstName: slider.AddedBy.FirstName,
			LastName:  slider.AddedBy.LastName,
			Email:     slider.AddedBy.Email,
		},
		CreatedAt: slider.CreatedAt,
		UpdatedAt: slider.UpdatedAt,
	}

	c.JSON(http.StatusOK, response)
}

// CreateSlider creates a new slider (admin only)
func CreateSlider(c *gin.Context) {
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

	var req models.SliderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := models.GetDB()
	slider, err := models.CreateSlider(db, user.ID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create slider"})
		return
	}

	response := models.SliderResponse{
		ID:         slider.ID,
		ImageURL:   slider.ImageURL,
		Link:       slider.Link,
		LinkType:   slider.LinkType,
		IsActive:   slider.IsActive,
		Order:      slider.Order,
		ClickCount: slider.ClickCount,
		ViewCount:  slider.ViewCount,
		AddedBy: models.UserResponse{
			ID:        slider.AddedBy.ID,
			FirstName: slider.AddedBy.FirstName,
			LastName:  slider.AddedBy.LastName,
			Email:     slider.AddedBy.Email,
		},
		CreatedAt: slider.CreatedAt,
		UpdatedAt: slider.UpdatedAt,
	}

	c.JSON(http.StatusCreated, response)
}

// UpdateSlider updates an existing slider (admin only)
func UpdateSlider(c *gin.Context) {
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
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid slider ID"})
		return
	}

	var req models.SliderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := models.GetDB()
	slider, err := models.UpdateSlider(db, uint(id), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update slider"})
		return
	}

	response := models.SliderResponse{
		ID:         slider.ID,
		ImageURL:   slider.ImageURL,
		Link:       slider.Link,
		LinkType:   slider.LinkType,
		IsActive:   slider.IsActive,
		Order:      slider.Order,
		ClickCount: slider.ClickCount,
		ViewCount:  slider.ViewCount,
		AddedBy: models.UserResponse{
			ID:        slider.AddedBy.ID,
			FirstName: slider.AddedBy.FirstName,
			LastName:  slider.AddedBy.LastName,
			Email:     slider.AddedBy.Email,
		},
		CreatedAt: slider.CreatedAt,
		UpdatedAt: slider.UpdatedAt,
	}

	c.JSON(http.StatusOK, response)
}

// DeleteSlider deletes a slider (admin only)
func DeleteSlider(c *gin.Context) {
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
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid slider ID"})
		return
	}

	db := models.GetDB()

	// Get slider to delete image
	slider, err := models.GetSliderByID(db, uint(id))
	if err == nil && slider.ImageURL != "" {
		// Delete image file
		utils.DeleteImage(slider.ImageURL)
	}

	if err := models.DeleteSlider(db, uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete slider"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Slider deleted successfully"})
}

// UploadSliderImage uploads a slider image
func UploadSliderImage(c *gin.Context) {
	// Check if user is authenticated and is admin
	userInterface, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "لطفا ابتدا وارد شوید"})
		return
	}

	user := userInterface.(models.User)
	if !user.IsAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
		return
	}

	// Get file from request
	file, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "لطفا یک تصویر انتخاب کنید"})
		return
	}

	// Upload image to sliders folder
	imagePath, err := utils.UploadImage(file, "sliders")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "تصویر با موفقیت آپلود شد",
		"image_url": imagePath,
	})
}

// TrackSliderClick tracks when a user clicks on a slider
func TrackSliderClick(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid slider ID"})
		return
	}

	db := models.GetDB()
	if err := models.IncrementSliderClickCount(db, uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to track click"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Click tracked successfully"})
}

// TrackSliderView tracks when a slider is viewed
func TrackSliderView(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid slider ID"})
		return
	}

	db := models.GetDB()
	if err := models.IncrementViewCount(db, uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to track view"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "View tracked successfully"})
}
