package controllers

import (
	"net/http"

	"asl-market-backend/config"
	"asl-market-backend/models"
	"asl-market-backend/services"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// SubmitProduct allows users to submit products for review
func SubmitProduct(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	user := c.MustGet("user").(models.User)

	var req models.CreateAvailableProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate sale_type
	if req.SaleType != "wholesale" && req.SaleType != "retail" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid sale_type. Must be 'wholesale' or 'retail'"})
		return
	}

	// Create product with "pending" status
	product, err := models.CreateAvailableProduct(db, user.ID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to submit product"})
		return
	}

	// Set status to pending for admin review
	db.Model(product).Update("status", "pending")

	// Send notification to Telegram bot (only when Telegram is enabled and not in Iran)
	if !config.AppConfig.Environment.IsInIran {
		go func() {
			telegramService := services.GetTelegramService()
			if telegramService != nil {
				telegramService.NotifyNewProductSubmission(product, &user)
			}
		}()
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":    "Product submitted successfully and is pending admin review",
		"product_id": product.ID,
	})
}
