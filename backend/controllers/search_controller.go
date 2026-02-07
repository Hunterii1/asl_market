package controllers

import (
	"net/http"
	"strings"

	"asl-market-backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// ChatSearchResult represents a simplified chat result for search
type ChatSearchResult struct {
	ID        uint   `json:"id"`
	Title     string `json:"title"`
	UserID    uint   `json:"user_id"`
	UserName  string `json:"user_name"`
	CreatedAt string `json:"created_at"`
}

// MessageSearchResult represents a simplified message result for search
type MessageSearchResult struct {
	ID        uint   `json:"id"`
	ChatID    uint   `json:"chat_id"`
	ChatTitle string `json:"chat_title"`
	Content   string `json:"content"`
	Role      string `json:"role"`
	UserID    uint   `json:"user_id"`
	UserName  string `json:"user_name"`
	CreatedAt string `json:"created_at"`
}

// GlobalSearchResponse represents the response for global search
type GlobalSearchResponse struct {
	Suppliers         []models.SupplierResponse         `json:"suppliers"`
	Visitors          []models.VisitorResponse          `json:"visitors"`
	AvailableProducts []models.AvailableProductResponse `json:"available_products"`
	ResearchProducts  []models.ResearchProductResponse  `json:"research_products"`
	Chats             []ChatSearchResult                `json:"chats"`
	Messages          []MessageSearchResult             `json:"messages"`
	Total             int                               `json:"total"`
}

// GlobalSearch performs a comprehensive search across all sections
func GlobalSearch(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	query := strings.TrimSpace(c.Query("q"))
	limit := 5 // Limit per category

	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Query parameter 'q' is required"})
		return
	}

	searchPattern := "%" + strings.ToLower(query) + "%"
	results := GlobalSearchResponse{}

	// Search Suppliers
	var suppliers []models.Supplier
	db.Where("LOWER(brand_name) LIKE ? OR LOWER(full_name) LIKE ? OR LOWER(city) LIKE ? OR LOWER(mobile) LIKE ?",
		searchPattern, searchPattern, searchPattern, searchPattern).
		Where("status = ?", "approved").
		Limit(limit).
		Find(&suppliers)

	for _, supplier := range suppliers {
		avgRating, totalRatings, _ := models.GetAverageRatingForUser(db, supplier.UserID)
		displayRating := avgRating
		if supplier.IsFeatured {
			displayRating = 5.0
		}

		results.Suppliers = append(results.Suppliers, models.SupplierResponse{
			ID:                     supplier.ID,
			UserID:                 supplier.UserID,
			FullName:               supplier.FullName,
			Mobile:                 supplier.Mobile,
			BrandName:              supplier.BrandName,
			ImageURL:               supplier.ImageURL,
			City:                   supplier.City,
			IsFeatured:             supplier.IsFeatured,
			TagFirstClass:          supplier.TagFirstClass,
			TagGoodPrice:           supplier.TagGoodPrice,
			TagExportExperience:    supplier.TagExportExperience,
			TagExportPackaging:     supplier.TagExportPackaging,
			TagSupplyWithoutCapital: supplier.TagSupplyWithoutCapital,
			AverageRating:          displayRating,
			TotalRatings:           totalRatings,
		})
	}

	// Search Visitors
	var visitors []models.Visitor
	db.Where("LOWER(full_name) LIKE ? OR LOWER(city) LIKE ? OR LOWER(country) LIKE ? OR LOWER(mobile) LIKE ? OR LOWER(languages) LIKE ?",
		searchPattern, searchPattern, searchPattern, searchPattern, searchPattern).
		Where("status = ?", "approved").
		Limit(limit).
		Find(&visitors)

	for _, visitor := range visitors {
		results.Visitors = append(results.Visitors, models.VisitorResponse{
			ID:           visitor.ID,
			UserID:       visitor.UserID,
			FullName:     visitor.FullName,
			Mobile:       visitor.Mobile,
			CityProvince: visitor.CityProvince,
			Email:        visitor.Email,
		})
	}

	// Search Available Products
	var availableProducts []models.AvailableProduct
	db.Preload("AddedBy").
		Preload("Supplier").
		Where("LOWER(product_name) LIKE ? OR LOWER(description) LIKE ? OR LOWER(category) LIKE ? OR LOWER(brand) LIKE ? OR LOWER(location) LIKE ?",
			searchPattern, searchPattern, searchPattern, searchPattern, searchPattern).
		Where("status = ?", "active").
		Limit(limit).
		Find(&availableProducts)

	for _, product := range availableProducts {
		response := models.AvailableProductResponse{
			ID:          product.ID,
			AddedByID:   product.AddedByID,
			ProductName: product.ProductName,
			Category:    product.Category,
			Description: product.Description,
			Location:    product.Location,
			Brand:       product.Brand,
			ImageURLs:   product.ImageURLs,
			Status:      product.Status,
			IsFeatured:  product.IsFeatured,
			IsHotDeal:   product.IsHotDeal,
		}

		if product.AddedBy.ID != 0 {
			response.AddedBy = models.UserResponse{
				ID:        product.AddedBy.ID,
				FirstName: product.AddedBy.FirstName,
				LastName:  product.AddedBy.LastName,
			}
		}

		if product.Supplier != nil {
			response.Supplier = &models.SupplierResponse{
				ID:        product.Supplier.ID,
				BrandName: product.Supplier.BrandName,
				FullName:  product.Supplier.FullName,
			}
		}

		results.AvailableProducts = append(results.AvailableProducts, response)
	}

	// Search Research Products
	var researchProducts []models.ResearchProduct
	db.Where("LOWER(name) LIKE ? OR LOWER(description) LIKE ? OR LOWER(category) LIKE ? OR LOWER(hs_code) LIKE ?",
		searchPattern, searchPattern, searchPattern, searchPattern).
		Where("status = ?", "active").
		Limit(limit).
		Find(&researchProducts)

	for _, product := range researchProducts {
		results.ResearchProducts = append(results.ResearchProducts, models.ResearchProductResponse{
			ID:          product.ID,
			Name:        product.Name,
			Category:    product.Category,
			Description: product.Description,
			Status:      product.Status,
		})
	}

	// Search Chats (by title)
	var chats []models.Chat
	db.Preload("User").
		Where("LOWER(title) LIKE ?", searchPattern).
		Limit(limit).
		Order("updated_at DESC").
		Find(&chats)

	for _, chat := range chats {
		results.Chats = append(results.Chats, ChatSearchResult{
			ID:        chat.ID,
			Title:     chat.Title,
			UserID:    chat.UserID,
			UserName:  chat.User.FirstName + " " + chat.User.LastName,
			CreatedAt: chat.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	// Search Messages (by content)
	var messages []models.Message
	db.Preload("Chat").
		Preload("Chat.User").
		Where("LOWER(content) LIKE ?", searchPattern).
		Limit(limit * 2). // More messages since they're smaller
		Order("created_at DESC").
		Find(&messages)

	for _, message := range messages {
		chatTitle := ""
		if message.Chat.ID != 0 {
			chatTitle = message.Chat.Title
		}
		userName := ""
		if message.Chat.User.ID != 0 {
			userName = message.Chat.User.FirstName + " " + message.Chat.User.LastName
		}

		// Truncate content for display
		content := message.Content
		if len(content) > 150 {
			content = content[:150] + "..."
		}

		results.Messages = append(results.Messages, MessageSearchResult{
			ID:        message.ID,
			ChatID:    message.ChatID,
			ChatTitle: chatTitle,
			Content:   content,
			Role:      message.Role,
			UserID:    message.Chat.UserID,
			UserName:  userName,
			CreatedAt: message.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	// Calculate total
	results.Total = len(results.Suppliers) + len(results.Visitors) + len(results.AvailableProducts) +
		len(results.ResearchProducts) + len(results.Chats) + len(results.Messages)

	c.JSON(http.StatusOK, results)
}
