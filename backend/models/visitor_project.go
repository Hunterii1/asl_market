package models

import (
	"fmt"
	"math"
	"time"

	"gorm.io/gorm"
)

// VisitorProject represents a project/demand created by a visitor
type VisitorProject struct {
	ID         uint    `json:"id" gorm:"primaryKey"`
	VisitorID  uint    `json:"visitor_id" gorm:"not null;index"`
	Visitor    Visitor `json:"visitor" gorm:"foreignKey:VisitorID"`
	UserID     uint    `json:"user_id" gorm:"not null;index"` // User who created the project
	User       User    `json:"user" gorm:"foreignKey:UserID"`

	// Project Information
	ProjectTitle string `json:"project_title" gorm:"size:255;not null"`
	ProductName  string `json:"product_name" gorm:"size:255;not null"`

	// Quantity and Unit
	Quantity string `json:"quantity" gorm:"size:100;not null"` // e.g., "500", "1000"
	Unit     string `json:"unit" gorm:"size:50;not null"`      // e.g., "kg", "ton", "package"

	// Target Countries (where visitor needs the product)
	TargetCountries string `json:"target_countries" gorm:"type:text;not null"` // Comma-separated

	// Budget and Currency
	Budget   string `json:"budget" gorm:"size:100"`       // e.g., "50000"
	Currency string `json:"currency" gorm:"size:10;not null"` // e.g., "USD", "EUR", "AED"

	// Payment Terms
	PaymentTerms string `json:"payment_terms" gorm:"type:text"` // e.g., "30% advance, 70% on delivery"

	// Delivery Requirements
	DeliveryTime string `json:"delivery_time" gorm:"size:255"` // e.g., "30 days", "2 weeks"

	// Description
	Description string `json:"description" gorm:"type:text"`

	// Expiration
	ExpiresAt time.Time `json:"expires_at" gorm:"not null;index"`

	// Status: pending, active, accepted, expired, cancelled, completed
	Status string `json:"status" gorm:"size:20;default:'pending';index"`

	// Matching Information
	MatchedSupplierCount int        `json:"matched_supplier_count" gorm:"default:0"` // Number of suppliers matched
	AcceptedSupplierID   *uint      `json:"accepted_supplier_id" gorm:"index"`       // Supplier who was accepted
	AcceptedSupplier     *Supplier  `json:"accepted_supplier,omitempty" gorm:"foreignKey:AcceptedSupplierID"`
	AcceptedAt           *time.Time `json:"accepted_at"`

	// Relations
	Proposals []VisitorProjectProposal `json:"proposals" gorm:"foreignKey:VisitorProjectID"`
	Chats     []VisitorProjectChat     `json:"chats" gorm:"foreignKey:VisitorProjectID"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// VisitorProjectProposal represents a supplier's proposal to a visitor project
type VisitorProjectProposal struct {
	ID               uint           `json:"id" gorm:"primaryKey"`
	VisitorProjectID uint           `json:"visitor_project_id" gorm:"not null;index"`
	VisitorProject   VisitorProject `json:"visitor_project" gorm:"foreignKey:VisitorProjectID"`
	SupplierID       uint           `json:"supplier_id" gorm:"not null;index"`
	Supplier         Supplier       `json:"supplier" gorm:"foreignKey:SupplierID"`
	UserID           uint           `json:"user_id" gorm:"not null;index"` // User who proposed
	User             User           `json:"user" gorm:"foreignKey:UserID"`

	// Proposal Type: accepted, rejected, question
	ProposalType string `json:"proposal_type" gorm:"size:20;not null;index"` // interested, rejected, question

	// Message/Offer (if supplier wants to send a custom message or price)
	Message      string `json:"message" gorm:"type:text"`
	OfferedPrice string `json:"offered_price" gorm:"size:100"` // Custom price offer

	// Status: pending, active, closed
	Status string `json:"status" gorm:"size:20;default:'pending'"`

	// Notification sent
	NotificationSent bool `json:"notification_sent" gorm:"default:false"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// VisitorProjectChat represents a chat conversation for a visitor project
type VisitorProjectChat struct {
	ID               uint           `json:"id" gorm:"primaryKey"`
	VisitorProjectID uint           `json:"visitor_project_id" gorm:"not null;index"`
	VisitorProject   VisitorProject `json:"visitor_project" gorm:"foreignKey:VisitorProjectID"`
	VisitorID        uint           `json:"visitor_id" gorm:"not null;index"`
	Visitor          Visitor        `json:"visitor" gorm:"foreignKey:VisitorID"`
	SupplierID       uint           `json:"supplier_id" gorm:"not null;index"`
	Supplier         Supplier       `json:"supplier" gorm:"foreignKey:SupplierID"`

	// Status: active, closed
	Status string `json:"status" gorm:"size:20;default:'active'"`

	// Messages
	Messages []VisitorProjectMessage `json:"messages" gorm:"foreignKey:ChatID"`

	// Last message info (for sorting/preview)
	LastMessageAt      *time.Time `json:"last_message_at"`
	LastMessagePreview string     `json:"last_message_preview" gorm:"size:255"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// VisitorProjectMessage represents a message in a visitor project chat
type VisitorProjectMessage struct {
	ID       uint                 `json:"id" gorm:"primaryKey"`
	ChatID   uint                 `json:"chat_id" gorm:"not null;index"`
	Chat     VisitorProjectChat   `json:"chat" gorm:"foreignKey:ChatID"`
	SenderID uint                 `json:"sender_id" gorm:"not null;index"` // User ID
	Sender   User                 `json:"sender" gorm:"foreignKey:SenderID"`
	
	// Sender Type: visitor, supplier
	SenderType string `json:"sender_type" gorm:"size:20;not null"`

	// Message content
	Message  string `json:"message" gorm:"type:text;not null"`
	ImageURL string `json:"image_url" gorm:"size:500"` // Optional image attachment

	// Read status
	IsRead bool `json:"is_read" gorm:"default:false"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// VisitorProjectNotification tracks notifications sent for visitor projects
type VisitorProjectNotification struct {
	ID               uint           `json:"id" gorm:"primaryKey"`
	VisitorProjectID uint           `json:"visitor_project_id" gorm:"not null;index"`
	VisitorProject   VisitorProject `json:"visitor_project" gorm:"foreignKey:VisitorProjectID"`
	SupplierID       uint           `json:"supplier_id" gorm:"not null;index"`
	Supplier         Supplier       `json:"supplier" gorm:"foreignKey:SupplierID"`
	UserID           uint           `json:"user_id" gorm:"not null;index"`
	User             User           `json:"user" gorm:"foreignKey:UserID"`

	// Notification Type: sms, push, in_app
	NotificationType string `json:"notification_type" gorm:"size:20;not null"`

	// Status: sent, failed, pending
	Status string `json:"status" gorm:"size:20;default:'pending'"`

	// Message sent
	Message string `json:"message" gorm:"type:text"`

	// Error (if failed)
	Error string `json:"error" gorm:"type:text"`

	SentAt *time.Time `json:"sent_at"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// Request DTOs

// CreateVisitorProjectRequest represents the request to create a visitor project
type CreateVisitorProjectRequest struct {
	ProjectTitle    string `json:"project_title" binding:"required"`
	ProductName     string `json:"product_name" binding:"required"`
	Quantity        string `json:"quantity" binding:"required"`
	Unit            string `json:"unit" binding:"required"`
	TargetCountries string `json:"target_countries" binding:"required"` // Comma-separated
	Budget          string `json:"budget"`
	Currency        string `json:"currency" binding:"required"`
	PaymentTerms    string `json:"payment_terms"`
	DeliveryTime    string `json:"delivery_time"`
	Description     string `json:"description"`
	ExpiresAt       string `json:"expires_at" binding:"required"` // ISO 8601 format
}

// UpdateVisitorProjectRequest represents the request to update a visitor project
type UpdateVisitorProjectRequest struct {
	ProjectTitle    string `json:"project_title"`
	ProductName     string `json:"product_name"`
	Quantity        string `json:"quantity"`
	Unit            string `json:"unit"`
	TargetCountries string `json:"target_countries"`
	Budget          string `json:"budget"`
	Currency        string `json:"currency"`
	PaymentTerms    string `json:"payment_terms"`
	DeliveryTime    string `json:"delivery_time"`
	Description     string `json:"description"`
	ExpiresAt       string `json:"expires_at"`
}

// VisitorProjectProposalRequest represents a supplier's proposal to a visitor project
type VisitorProjectProposalRequest struct {
	ProposalType string `json:"proposal_type" binding:"required,oneof=interested rejected question"`
	Message      string `json:"message"`      // Optional message from supplier
	OfferedPrice string `json:"offered_price"` // Optional custom price
}

// Response DTOs

// VisitorProjectResponse represents a visitor project in API responses
type VisitorProjectResponse struct {
	ID                   uint                           `json:"id"`
	VisitorID            uint                           `json:"visitor_id"`
	UserID               uint                           `json:"user_id"` // User who created the project (for ownership check)
	Visitor              VisitorResponse                `json:"visitor"`
	ProjectTitle         string                         `json:"project_title"`
	ProductName          string                         `json:"product_name"`
	Quantity             string                         `json:"quantity"`
	Unit                 string                         `json:"unit"`
	TargetCountries      string                         `json:"target_countries"`
	Budget               string                         `json:"budget"`
	Currency             string                         `json:"currency"`
	PaymentTerms         string                         `json:"payment_terms"`
	DeliveryTime         string                         `json:"delivery_time"`
	Description          string                         `json:"description"`
	ExpiresAt            time.Time                      `json:"expires_at"`
	Status               string                         `json:"status"`
	MatchedSupplierCount int                            `json:"matched_supplier_count"`
	AcceptedSupplierID   *uint                          `json:"accepted_supplier_id"`
	AcceptedAt           *time.Time                     `json:"accepted_at"`
	RemainingTime        string                         `json:"remaining_time"` // Calculated field
	IsExpired            bool                           `json:"is_expired"`     // Calculated field
	Proposals            []VisitorProjectProposalResponse `json:"proposals"`
	CreatedAt            time.Time                      `json:"created_at"`
	UpdatedAt            time.Time                      `json:"updated_at"`
}

// VisitorProjectProposalResponse represents a proposal in API responses
type VisitorProjectProposalResponse struct {
	ID               uint             `json:"id"`
	VisitorProjectID uint             `json:"visitor_project_id"`
	SupplierID       uint             `json:"supplier_id"`
	Supplier         SupplierResponse `json:"supplier"`
	ProposalType     string           `json:"proposal_type"`
	Message          string           `json:"message"`
	OfferedPrice     string           `json:"offered_price"`
	Status           string           `json:"status"`
	CreatedAt        time.Time        `json:"created_at"`
}

// Helper functions

// CreateVisitorProject creates a new visitor project
func CreateVisitorProject(db *gorm.DB, userID, visitorID uint, req CreateVisitorProjectRequest) (*VisitorProject, error) {
	// Parse expiration date
	expiresAt, err := time.Parse(time.RFC3339, req.ExpiresAt)
	if err != nil {
		return nil, fmt.Errorf("invalid expiration date format")
	}

	project := VisitorProject{
		VisitorID:       visitorID,
		UserID:          userID,
		ProjectTitle:    req.ProjectTitle,
		ProductName:     req.ProductName,
		Quantity:        req.Quantity,
		Unit:            req.Unit,
		TargetCountries: req.TargetCountries,
		Budget:          req.Budget,
		Currency:        req.Currency,
		PaymentTerms:    req.PaymentTerms,
		DeliveryTime:    req.DeliveryTime,
		Description:     req.Description,
		ExpiresAt:       expiresAt,
		Status:          "active",
	}

	if err := db.Create(&project).Error; err != nil {
		return nil, err
	}

	// Reload with relations
	if err := db.Preload("Visitor").Preload("User").First(&project, project.ID).Error; err != nil {
		return nil, err
	}

	return &project, nil
}

// GetVisitorProjectByID gets a visitor project by ID with all relations
func GetVisitorProjectByID(db *gorm.DB, id uint) (*VisitorProject, error) {
	var project VisitorProject
	err := db.Preload("Visitor").Preload("User").Preload("Proposals.Supplier").Preload("Proposals.User").
		First(&project, id).Error
	return &project, err
}

// GetVisitorProjectsByVisitor gets all visitor projects for a specific visitor
func GetVisitorProjectsByVisitor(db *gorm.DB, visitorID uint, status string, page, perPage int) ([]VisitorProject, int64, error) {
	var projects []VisitorProject
	var total int64

	query := db.Model(&VisitorProject{}).Preload("Visitor").Preload("Proposals").Where("visitor_id = ?", visitorID)

	if status != "all" && status != "" {
		query = query.Where("status = ?", status)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * perPage
	err := query.Offset(offset).Limit(perPage).Order("created_at DESC").Find(&projects).Error

	return projects, total, err
}

// GetAvailableVisitorProjects gets all active visitor projects for suppliers to view
func GetAvailableVisitorProjects(db *gorm.DB, page, perPage int) ([]VisitorProject, int64, error) {
	var projects []VisitorProject
	var total int64

	query := db.Model(&VisitorProject{}).
		Preload("Visitor").
		Preload("Proposals").
		Where("status = ? AND expires_at > ?", "active", time.Now())

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * perPage
	err := query.Offset(offset).Limit(perPage).Order("created_at DESC").Find(&projects).Error

	return projects, total, err
}

// UpdateVisitorProject updates a visitor project
func UpdateVisitorProject(db *gorm.DB, id uint, req UpdateVisitorProjectRequest) error {
	updates := make(map[string]interface{})

	if req.ProjectTitle != "" {
		updates["project_title"] = req.ProjectTitle
	}
	if req.ProductName != "" {
		updates["product_name"] = req.ProductName
	}
	if req.Quantity != "" {
		updates["quantity"] = req.Quantity
	}
	if req.Unit != "" {
		updates["unit"] = req.Unit
	}
	if req.TargetCountries != "" {
		updates["target_countries"] = req.TargetCountries
	}
	if req.Budget != "" {
		updates["budget"] = req.Budget
	}
	if req.Currency != "" {
		updates["currency"] = req.Currency
	}
	if req.PaymentTerms != "" {
		updates["payment_terms"] = req.PaymentTerms
	}
	if req.DeliveryTime != "" {
		updates["delivery_time"] = req.DeliveryTime
	}
	if req.Description != "" {
		updates["description"] = req.Description
	}
	if req.ExpiresAt != "" {
		expiresAt, err := time.Parse(time.RFC3339, req.ExpiresAt)
		if err == nil {
			updates["expires_at"] = expiresAt
		}
	}

	return db.Model(&VisitorProject{}).Where("id = ?", id).Updates(updates).Error
}

// DeleteVisitorProject soft-deletes a visitor project
func DeleteVisitorProject(db *gorm.DB, id uint) error {
	return db.Delete(&VisitorProject{}, id).Error
}

// CreateVisitorProjectProposal creates a new proposal from supplier
func CreateVisitorProjectProposal(db *gorm.DB, projectID, supplierID, userID uint, req VisitorProjectProposalRequest) (*VisitorProjectProposal, error) {
	proposal := VisitorProjectProposal{
		VisitorProjectID: projectID,
		SupplierID:       supplierID,
		UserID:           userID,
		ProposalType:     req.ProposalType,
		Message:          req.Message,
		OfferedPrice:     req.OfferedPrice,
		Status:           "pending",
	}

	if err := db.Create(&proposal).Error; err != nil {
		return nil, err
	}

	// Increment matched supplier count if proposal type is "interested"
	if req.ProposalType == "interested" {
		db.Model(&VisitorProject{}).Where("id = ?", projectID).
			Update("matched_supplier_count", gorm.Expr("matched_supplier_count + ?", 1))
	}

	// Reload with relations
	if err := db.Preload("Supplier").Preload("User").First(&proposal, proposal.ID).Error; err != nil {
		return nil, err
	}

	return &proposal, nil
}

// GetSupplierCapacityForVisitorProjects returns suppliers with their proposal counts for visitor projects
func GetSupplierCapacityForVisitorProjects(db *gorm.DB, capacity, limit int) ([]SupplierMatchingCapacity, error) {
	if capacity <= 0 {
		capacity = 5
	}
	if limit <= 0 {
		limit = 20
	}

	var suppliers []Supplier
	if err := db.Preload("User").Where("status = ?", "approved").Order("is_featured DESC, created_at DESC").Limit(limit * 2).Find(&suppliers).Error; err != nil {
		return nil, err
	}

	var result []SupplierMatchingCapacity
	for _, supplier := range suppliers {
		var activeCount int64
		db.Model(&VisitorProjectProposal{}).
			Joins("INNER JOIN visitor_projects ON visitor_projects.id = visitor_project_proposals.visitor_project_id").
			Where("visitor_project_proposals.supplier_id = ? AND visitor_project_proposals.proposal_type = ? AND visitor_projects.status IN ?",
				supplier.ID, "interested", []string{"active", "accepted"}).
			Count(&activeCount)

		remaining := int(math.Max(0, float64(capacity-int(activeCount))))

		avgRating, totalRatings, _ := GetAverageRatingForUser(db, supplier.UserID)
		displayRating := avgRating
		if supplier.IsFeatured {
			displayRating = 5.0
		}

		supplierResp := SupplierResponse{
			ID:                      supplier.ID,
			UserID:                  supplier.UserID,
			FullName:                supplier.FullName,
			Mobile:                  supplier.Mobile,
			BrandName:               supplier.BrandName,
			ImageURL:                supplier.ImageURL,
			City:                    supplier.City,
			IsFeatured:              supplier.IsFeatured,
			FeaturedAt:              supplier.FeaturedAt,
			TagFirstClass:           supplier.TagFirstClass,
			TagGoodPrice:            supplier.TagGoodPrice,
			TagExportExperience:     supplier.TagExportExperience,
			TagExportPackaging:      supplier.TagExportPackaging,
			TagSupplyWithoutCapital: supplier.TagSupplyWithoutCapital,
			AverageRating:           displayRating,
			TotalRatings:            totalRatings,
			CreatedAt:               supplier.CreatedAt,
		}

		result = append(result, SupplierMatchingCapacity{
			Supplier:       supplierResp,
			ActiveRequests: int(activeCount),
			RemainingSlots: remaining,
			Capacity:       capacity,
		})

		if len(result) >= limit {
			break
		}
	}

	return result, nil
}

// CheckAndExpireVisitorProjects checks and expires visitor projects (called by scheduler)
func CheckAndExpireVisitorProjects(db *gorm.DB) error {
	return db.Model(&VisitorProject{}).
		Where("status = ? AND expires_at <= ?", "active", time.Now()).
		Update("status", "expired").Error
}

// CloseVisitorProject closes a visitor project (visitor only)
func CloseVisitorProject(db *gorm.DB, id uint) error {
	return db.Model(&VisitorProject{}).Where("id = ?", id).Update("status", "completed").Error
}

// GetOrCreateVisitorProjectChat gets or creates a chat for a visitor project
func GetOrCreateVisitorProjectChat(db *gorm.DB, projectID, visitorID, supplierID uint) (*VisitorProjectChat, error) {
	var chat VisitorProjectChat
	err := db.Where("visitor_project_id = ? AND visitor_id = ? AND supplier_id = ?", projectID, visitorID, supplierID).
		First(&chat).Error
	
	if err == gorm.ErrRecordNotFound {
		// Create new chat
		chat = VisitorProjectChat{
			VisitorProjectID: projectID,
			VisitorID:        visitorID,
			SupplierID:       supplierID,
			Status:           "active",
		}
		if err := db.Create(&chat).Error; err != nil {
			return nil, err
		}
		return &chat, nil
	}
	
	if err != nil {
		return nil, err
	}
	
	return &chat, nil
}

// CreateVisitorProjectMessage creates a new message in a chat
func CreateVisitorProjectMessage(db *gorm.DB, chatID, senderID uint, senderType, message, imageURL string) (*VisitorProjectMessage, error) {
	msg := VisitorProjectMessage{
		ChatID:     chatID,
		SenderID:   senderID,
		SenderType: senderType,
		Message:    message,
		ImageURL:   imageURL,
	}
	
	if err := db.Create(&msg).Error; err != nil {
		return nil, err
	}
	
	// Update chat's last message info
	now := time.Now()
	preview := message
	if len(preview) > 100 {
		preview = preview[:100] + "..."
	}
	db.Model(&VisitorProjectChat{}).Where("id = ?", chatID).Updates(map[string]interface{}{
		"last_message_at":      &now,
		"last_message_preview": preview,
	})
	
	// Reload with relations
	if err := db.Preload("Sender").First(&msg, msg.ID).Error; err != nil {
		return nil, err
	}
	
	return &msg, nil
}

// GetVisitorProjectChatMessages gets messages for a chat
func GetVisitorProjectChatMessages(db *gorm.DB, chatID uint, page, perPage int) ([]VisitorProjectMessage, int64, error) {
	var messages []VisitorProjectMessage
	var total int64
	
	query := db.Model(&VisitorProjectMessage{}).Where("chat_id = ?", chatID)
	
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	
	offset := (page - 1) * perPage
	err := query.Preload("Sender").Offset(offset).Limit(perPage).Order("created_at ASC").Find(&messages).Error
	
	return messages, total, err
}

// GetVisitorProjectChatsForUser gets all chats for a user (visitor or supplier)
func GetVisitorProjectChatsForUser(db *gorm.DB, userID uint, isSupplier bool) ([]VisitorProjectChat, error) {
	var chats []VisitorProjectChat
	var err error
	
	if isSupplier {
		// Get supplier's chats
		var supplier Supplier
		if err := db.Where("user_id = ?", userID).First(&supplier).Error; err != nil {
			return nil, err
		}
		err = db.Preload("Visitor").Preload("Supplier").Preload("VisitorProject").
			Where("supplier_id = ?", supplier.ID).
			Order("last_message_at DESC NULLS LAST, created_at DESC").
			Find(&chats).Error
	} else {
		// Get visitor's chats
		var visitor Visitor
		if err := db.Where("user_id = ?", userID).First(&visitor).Error; err != nil {
			return nil, err
		}
		err = db.Preload("Visitor").Preload("Supplier").Preload("VisitorProject").
			Where("visitor_id = ?", visitor.ID).
			Order("last_message_at DESC NULLS LAST, created_at DESC").
			Find(&chats).Error
	}
	
	return chats, err
}
