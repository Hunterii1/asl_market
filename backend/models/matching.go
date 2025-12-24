package models

import (
	"math"
	"time"

	"gorm.io/gorm"
)

// MatchingRequest represents a matching request created by a supplier
type MatchingRequest struct {
	ID         uint     `json:"id" gorm:"primaryKey"`
	SupplierID uint     `json:"supplier_id" gorm:"not null;index"`
	Supplier   Supplier `json:"supplier" gorm:"foreignKey:SupplierID"`
	UserID     uint     `json:"user_id" gorm:"not null;index"` // User who created the request
	User       User     `json:"user" gorm:"foreignKey:UserID"`

	// Product Information
	ProductName string           `json:"product_name" gorm:"size:255;not null"`
	ProductID   *uint            `json:"product_id" gorm:"index"` // Optional: reference to SupplierProduct
	Product     *SupplierProduct `json:"product,omitempty" gorm:"foreignKey:ProductID"`

	// Quantity and Unit
	Quantity string `json:"quantity" gorm:"size:100;not null"` // e.g., "500", "1000"
	Unit     string `json:"unit" gorm:"size:50;not null"`      // e.g., "kg", "ton", "package"

	// Destination Countries (comma-separated or JSON array)
	DestinationCountries string `json:"destination_countries" gorm:"type:text;not null"`

	// Pricing
	Price    string `json:"price" gorm:"size:100;not null"`   // e.g., "3000"
	Currency string `json:"currency" gorm:"size:10;not null"` // e.g., "USD", "EUR", "AED"

	// Payment Terms
	PaymentTerms string `json:"payment_terms" gorm:"type:text"` // e.g., "30% advance, 70% on delivery"

	// Delivery Time
	DeliveryTime string `json:"delivery_time" gorm:"size:255"` // e.g., "30 days", "2 weeks"

	// Description
	Description string `json:"description" gorm:"type:text"`

	// Expiration
	ExpiresAt time.Time `json:"expires_at" gorm:"not null;index"`

	// Status: pending, active, accepted, expired, cancelled, completed
	Status string `json:"status" gorm:"size:20;default:'pending';index"`

	// Matching Information
	MatchedVisitorCount int        `json:"matched_visitor_count" gorm:"default:0"` // Number of visitors matched
	AcceptedVisitorID   *uint      `json:"accepted_visitor_id" gorm:"index"`       // Visitor who accepted
	AcceptedVisitor     *Visitor   `json:"accepted_visitor,omitempty" gorm:"foreignKey:AcceptedVisitorID"`
	AcceptedAt          *time.Time `json:"accepted_at"`

	// Relations
	Responses []MatchingResponse `json:"responses" gorm:"foreignKey:MatchingRequestID"`
	Ratings   []MatchingRating   `json:"ratings" gorm:"foreignKey:MatchingRequestID"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// MatchingResponse represents a visitor's response to a matching request
type MatchingResponse struct {
	ID                uint            `json:"id" gorm:"primaryKey"`
	MatchingRequestID uint            `json:"matching_request_id" gorm:"not null;index"`
	MatchingRequest   MatchingRequest `json:"matching_request" gorm:"foreignKey:MatchingRequestID"`
	VisitorID         uint            `json:"visitor_id" gorm:"not null;index"`
	Visitor           Visitor         `json:"visitor" gorm:"foreignKey:VisitorID"`
	UserID            uint            `json:"user_id" gorm:"not null;index"` // User who responded
	User              User            `json:"user" gorm:"foreignKey:UserID"`

	// Response Type: accepted, rejected, question
	ResponseType string `json:"response_type" gorm:"size:20;not null;index"` // accepted, rejected, question

	// Question/Message (if response_type is "question")
	Message string `json:"message" gorm:"type:text"`

	// Status: pending, active, closed
	Status string `json:"status" gorm:"size:20;default:'pending'"`

	// Notification sent
	NotificationSent bool `json:"notification_sent" gorm:"default:false"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// MatchingRating represents a rating given by supplier or visitor after completion
type MatchingRating struct {
	ID                uint            `json:"id" gorm:"primaryKey"`
	MatchingRequestID uint            `json:"matching_request_id" gorm:"not null;index"`
	MatchingRequest   MatchingRequest `json:"matching_request" gorm:"foreignKey:MatchingRequestID"`

	// Who gave the rating
	RaterID   uint   `json:"rater_id" gorm:"not null;index"`     // User ID who gave the rating
	RaterType string `json:"rater_type" gorm:"size:20;not null"` // "supplier" or "visitor"
	Rater     User   `json:"rater" gorm:"foreignKey:RaterID"`

	// Who received the rating
	RatedID   uint   `json:"rated_id" gorm:"not null;index"`     // User ID who received the rating
	RatedType string `json:"rated_type" gorm:"size:20;not null"` // "supplier" or "visitor"
	Rated     User   `json:"rated" gorm:"foreignKey:RatedID"`

	// Rating (1-5 stars)
	Rating int `json:"rating" gorm:"not null;check:rating >= 1 AND rating <= 5"`

	// Comment
	Comment string `json:"comment" gorm:"type:text"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// MatchingNotification tracks notifications sent for matching requests
type MatchingNotification struct {
	ID                uint            `json:"id" gorm:"primaryKey"`
	MatchingRequestID uint            `json:"matching_request_id" gorm:"not null;index"`
	MatchingRequest   MatchingRequest `json:"matching_request" gorm:"foreignKey:MatchingRequestID"`
	VisitorID         uint            `json:"visitor_id" gorm:"not null;index"`
	Visitor           Visitor         `json:"visitor" gorm:"foreignKey:VisitorID"`
	UserID            uint            `json:"user_id" gorm:"not null;index"`
	User              User            `json:"user" gorm:"foreignKey:UserID"`

	// Notification Type: sms, push, in_app
	NotificationType string `json:"notification_type" gorm:"size:20;not null"` // sms, push, in_app

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

// Request DTOs for API

// CreateMatchingRequestRequest represents the request to create a matching request
type CreateMatchingRequestRequest struct {
	ProductName          string `json:"product_name" binding:"required"`
	ProductID            *uint  `json:"product_id"` // Optional
	Quantity             string `json:"quantity" binding:"required"`
	Unit                 string `json:"unit" binding:"required"`
	DestinationCountries string `json:"destination_countries" binding:"required"` // Comma-separated
	Price                string `json:"price" binding:"required"`
	Currency             string `json:"currency" binding:"required"`
	PaymentTerms         string `json:"payment_terms"`
	DeliveryTime         string `json:"delivery_time"`
	Description          string `json:"description"`
	ExpiresAt            string `json:"expires_at" binding:"required"` // ISO 8601 format
}

// UpdateMatchingRequestRequest represents the request to update a matching request
type UpdateMatchingRequestRequest struct {
	ProductName          string `json:"product_name"`
	ProductID            *uint  `json:"product_id"`
	Quantity             string `json:"quantity"`
	Unit                 string `json:"unit"`
	DestinationCountries string `json:"destination_countries"`
	Price                string `json:"price"`
	Currency             string `json:"currency"`
	PaymentTerms         string `json:"payment_terms"`
	DeliveryTime         string `json:"delivery_time"`
	Description          string `json:"description"`
	ExpiresAt            string `json:"expires_at"`
}

// MatchingResponseRequest represents a visitor's response to a matching request
type MatchingResponseRequest struct {
	ResponseType string `json:"response_type" binding:"required,oneof=accepted rejected question"`
	Message      string `json:"message"` // Required if response_type is "question"
}

// MatchingRatingRequest represents a rating request
type MatchingRatingRequest struct {
	Rating  int    `json:"rating" binding:"required,min=1,max=5"`
	Comment string `json:"comment"`
}

// Response DTOs

// MatchingRequestResponse represents a matching request in API responses
type MatchingRequestResponse struct {
	ID                   uint                       `json:"id"`
	SupplierID           uint                       `json:"supplier_id"`
	UserID               uint                       `json:"user_id"` // User who created the request (for ownership check)
	Supplier             SupplierResponse           `json:"supplier"`
	ProductName          string                     `json:"product_name"`
	ProductID            *uint                      `json:"product_id"`
	Quantity             string                     `json:"quantity"`
	Unit                 string                     `json:"unit"`
	DestinationCountries string                     `json:"destination_countries"`
	Price                string                     `json:"price"`
	Currency             string                     `json:"currency"`
	PaymentTerms         string                     `json:"payment_terms"`
	DeliveryTime         string                     `json:"delivery_time"`
	Description          string                     `json:"description"`
	ExpiresAt            time.Time                  `json:"expires_at"`
	Status               string                     `json:"status"`
	MatchedVisitorCount  int                        `json:"matched_visitor_count"`
	AcceptedVisitorID    *uint                      `json:"accepted_visitor_id"`
	AcceptedAt           *time.Time                 `json:"accepted_at"`
	RemainingTime        string                     `json:"remaining_time"` // Calculated field
	IsExpired            bool                       `json:"is_expired"`     // Calculated field
	Responses            []MatchingResponseResponse `json:"responses"`
	CreatedAt            time.Time                  `json:"created_at"`
	UpdatedAt            time.Time                  `json:"updated_at"`
}

// MatchingResponseResponse represents a matching response in API responses
type MatchingResponseResponse struct {
	ID                uint            `json:"id"`
	MatchingRequestID uint            `json:"matching_request_id"`
	VisitorID         uint            `json:"visitor_id"`
	Visitor           VisitorResponse `json:"visitor"`
	ResponseType      string          `json:"response_type"`
	Message           string          `json:"message"`
	Status            string          `json:"status"`
	CreatedAt         time.Time       `json:"created_at"`
}

// MatchingRatingResponse represents a matching rating in API responses
type MatchingRatingResponse struct {
	ID                uint      `json:"id"`
	MatchingRequestID uint      `json:"matching_request_id"`
	RaterID           uint      `json:"rater_id"`
	RaterType         string    `json:"rater_type"`
	RatedID           uint      `json:"rated_id"`
	RatedType         string    `json:"rated_type"`
	Rating            int       `json:"rating"`
	Comment           string    `json:"comment"`
	CreatedAt         time.Time `json:"created_at"`
}

// Helper functions

// CreateMatchingRequest creates a new matching request
func CreateMatchingRequest(db *gorm.DB, userID uint, supplierID uint, req CreateMatchingRequestRequest) (*MatchingRequest, error) {
	// Parse expiration time
	expiresAt, err := time.Parse(time.RFC3339, req.ExpiresAt)
	if err != nil {
		return nil, err
	}

	// Validate expiration is in the future
	if expiresAt.Before(time.Now()) {
		return nil, gorm.ErrInvalidValue
	}

	matchingRequest := MatchingRequest{
		UserID:               userID,
		SupplierID:           supplierID,
		ProductName:          req.ProductName,
		ProductID:            req.ProductID,
		Quantity:             req.Quantity,
		Unit:                 req.Unit,
		DestinationCountries: req.DestinationCountries,
		Price:                req.Price,
		Currency:             req.Currency,
		PaymentTerms:         req.PaymentTerms,
		DeliveryTime:         req.DeliveryTime,
		Description:          req.Description,
		ExpiresAt:            expiresAt,
		Status:               "pending",
		MatchedVisitorCount:  0,
	}

	if err := db.Create(&matchingRequest).Error; err != nil {
		return nil, err
	}

	return &matchingRequest, nil
}

// GetMatchingRequestByID gets a matching request by ID
func GetMatchingRequestByID(db *gorm.DB, id uint) (*MatchingRequest, error) {
	var request MatchingRequest
	err := db.Preload("Supplier").Preload("Supplier.User").Preload("User").
		Preload("Product").Preload("AcceptedVisitor").Preload("AcceptedVisitor.User").
		Preload("Responses").Preload("Responses.Visitor").Preload("Responses.Visitor.User").
		Preload("Responses.User").First(&request, id).Error
	return &request, err
}

// GetMatchingRequestsBySupplier gets all matching requests for a supplier
func GetMatchingRequestsBySupplier(db *gorm.DB, supplierID uint, status string, page, perPage int) ([]MatchingRequest, int64, error) {
	var requests []MatchingRequest
	var total int64

	query := db.Model(&MatchingRequest{}).Where("supplier_id = ?", supplierID)

	if status != "" && status != "all" {
		query = query.Where("status = ?", status)
	}

	// Get total count
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	offset := (page - 1) * perPage
	err := query.Preload("Supplier").Preload("User").Preload("AcceptedVisitor").
		Preload("Responses").Offset(offset).Limit(perPage).
		Order("created_at DESC").Find(&requests).Error

	return requests, total, err
}

// GetAvailableMatchingRequestsForVisitor gets matching requests available for a visitor
// TODO: When visitor count increases, add country matching logic to filter requests
// based on visitor's destination cities matching request's destination countries.
// Currently, all active requests are shown to all approved visitors to help with low visitor count.
//
// IMPORTANT: Expired requests are NOT shown to visitors - they are filtered out here.
func GetAvailableMatchingRequestsForVisitor(db *gorm.DB, visitorID uint, page, perPage int) ([]MatchingRequest, int64, error) {
	var requests []MatchingRequest
	var total int64

	// Get visitor to check if approved (required for access)
	var visitor Visitor
	if err := db.First(&visitor, visitorID).Error; err != nil {
		return nil, 0, err
	}

	// Query for active requests ONLY (exclude expired, cancelled, completed, accepted)
	// TODO: Add destination cities matching when visitor count increases
	// For now, show all active requests to all approved visitors
	// Filter out expired requests - visitors should NOT see expired requests
	// IMPORTANT: Also exclude accepted requests - once a request is accepted, other visitors shouldn't see it
	query := db.Model(&MatchingRequest{}).
		Where("status IN ?", []string{"pending", "active"}).
		Where("expires_at > ?", time.Now()).
		Where("status != ?", "expired").     // Explicitly exclude expired status
		Where("status != ?", "accepted").    // Exclude accepted requests - only the accepted visitor can see it
		Where("accepted_visitor_id IS NULL") // Also check that no visitor has been accepted yet

	// Get total count
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	offset := (page - 1) * perPage
	err := query.Preload("Supplier").Preload("Supplier.User").Preload("User").
		Preload("Product").Offset(offset).Limit(perPage).
		Order("created_at DESC").Find(&requests).Error

	return requests, total, err
}

// CreateMatchingResponse creates a response to a matching request
func CreateMatchingResponse(db *gorm.DB, matchingRequestID uint, visitorID uint, userID uint, req MatchingResponseRequest) (*MatchingResponse, error) {
	// Validate response type
	if req.ResponseType != "accepted" && req.ResponseType != "rejected" && req.ResponseType != "question" {
		return nil, gorm.ErrInvalidValue
	}

	// If question, message is required
	if req.ResponseType == "question" && req.Message == "" {
		return nil, gorm.ErrInvalidValue
	}

	response := MatchingResponse{
		MatchingRequestID: matchingRequestID,
		VisitorID:         visitorID,
		UserID:            userID,
		ResponseType:      req.ResponseType,
		Message:           req.Message,
		Status:            "pending",
		NotificationSent:  false,
	}

	if err := db.Create(&response).Error; err != nil {
		return nil, err
	}

	// If accepted, update the matching request
	if req.ResponseType == "accepted" {
		now := time.Now()
		if err := db.Model(&MatchingRequest{}).Where("id = ?", matchingRequestID).Updates(map[string]interface{}{
			"status":              "accepted",
			"accepted_visitor_id": visitorID,
			"accepted_at":         &now,
		}).Error; err != nil {
			return nil, err
		}
	}

	return &response, nil
}

// CreateMatchingRating creates a rating for a completed matching request
func CreateMatchingRating(db *gorm.DB, matchingRequestID uint, raterID uint, ratedID uint, raterType string, ratedType string, req MatchingRatingRequest) (*MatchingRating, error) {
	rating := MatchingRating{
		MatchingRequestID: matchingRequestID,
		RaterID:           raterID,
		RatedID:           ratedID,
		RaterType:         raterType,
		RatedType:         ratedType,
		Rating:            req.Rating,
		Comment:           req.Comment,
	}

	if err := db.Create(&rating).Error; err != nil {
		return nil, err
	}

	return &rating, nil
}

// UpdateMatchingRequestStatus updates the status of a matching request
func UpdateMatchingRequestStatus(db *gorm.DB, id uint, status string) error {
	return db.Model(&MatchingRequest{}).Where("id = ?", id).Update("status", status).Error
}

// CancelMatchingRequest cancels a matching request
func CancelMatchingRequest(db *gorm.DB, id uint, userID uint) error {
	// Verify ownership
	var request MatchingRequest
	if err := db.First(&request, id).Error; err != nil {
		return err
	}

	if request.UserID != userID {
		return gorm.ErrRecordNotFound
	}

	// Only allow cancellation if not already accepted or completed
	if request.Status == "accepted" || request.Status == "completed" {
		return gorm.ErrInvalidValue
	}

	return db.Model(&MatchingRequest{}).Where("id = ?", id).Update("status", "cancelled").Error
}

// ExtendMatchingRequest extends the expiration time of a matching request
func ExtendMatchingRequest(db *gorm.DB, id uint, userID uint, newExpiresAt time.Time) error {
	// Verify ownership
	var request MatchingRequest
	if err := db.First(&request, id).Error; err != nil {
		return err
	}

	if request.UserID != userID {
		return gorm.ErrRecordNotFound
	}

	// Validate new expiration is in the future
	if newExpiresAt.Before(time.Now()) {
		return gorm.ErrInvalidValue
	}

	return db.Model(&MatchingRequest{}).Where("id = ?", id).Update("expires_at", newExpiresAt).Error
}

// CheckExpiredMatchingRequests checks and updates expired matching requests
func CheckExpiredMatchingRequests(db *gorm.DB) error {
	now := time.Now()
	return db.Model(&MatchingRequest{}).
		Where("status IN ?", []string{"pending", "active"}).
		Where("expires_at <= ?", now).
		Where("accepted_visitor_id IS NULL").
		Update("status", "expired").Error
}

// MatchingChat represents a chat conversation between supplier and visitor for a matching request
type MatchingChat struct {
	ID                uint            `json:"id" gorm:"primaryKey"`
	MatchingRequestID uint            `json:"matching_request_id" gorm:"not null;index"`
	MatchingRequest   MatchingRequest `json:"matching_request" gorm:"foreignKey:MatchingRequestID"`
	SupplierID        uint            `json:"supplier_id" gorm:"not null;index"`
	Supplier          Supplier        `json:"supplier" gorm:"foreignKey:SupplierID"`
	VisitorID         uint            `json:"visitor_id" gorm:"not null;index"`
	Visitor           Visitor         `json:"visitor" gorm:"foreignKey:VisitorID"`
	SupplierUserID    uint            `json:"supplier_user_id" gorm:"not null;index"`
	SupplierUser      User            `json:"supplier_user" gorm:"foreignKey:SupplierUserID"`
	VisitorUserID     uint            `json:"visitor_user_id" gorm:"not null;index"`
	VisitorUser       User            `json:"visitor_user" gorm:"foreignKey:VisitorUserID"`

	// Chat status
	IsActive bool `json:"is_active" gorm:"default:true"`

	// Relations
	Messages []MatchingMessage `json:"messages" gorm:"foreignKey:MatchingChatID"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// MatchingMessage represents a message in a matching chat
type MatchingMessage struct {
	ID             uint         `json:"id" gorm:"primaryKey"`
	MatchingChatID uint         `json:"matching_chat_id" gorm:"not null;index"`
	MatchingChat   MatchingChat `json:"matching_chat" gorm:"foreignKey:MatchingChatID"`
	SenderID       uint         `json:"sender_id" gorm:"not null;index"` // User ID who sent the message
	Sender         User         `json:"sender" gorm:"foreignKey:SenderID"`
	SenderType     string       `json:"sender_type" gorm:"size:20;not null"` // "supplier" or "visitor"

	// Message content
	Message  string `json:"message" gorm:"type:text"`  // Optional if image_url is provided
	ImageURL string `json:"image_url" gorm:"size:500"` // Optional image URL

	// Read status
	IsRead bool       `json:"is_read" gorm:"default:false"`
	ReadAt *time.Time `json:"read_at"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// MatchingChatResponse represents a chat in API responses
type MatchingChatResponse struct {
	ID                uint       `json:"id"`
	MatchingRequestID uint       `json:"matching_request_id"`
	SupplierID        uint       `json:"supplier_id"`
	SupplierName      string     `json:"supplier_name"`
	VisitorID         uint       `json:"visitor_id"`
	VisitorName       string     `json:"visitor_name"`
	IsActive          bool       `json:"is_active"`
	LastMessage       string     `json:"last_message,omitempty"`
	LastMessageAt     *time.Time `json:"last_message_at,omitempty"`
	UnreadCount       int        `json:"unread_count"`
	CreatedAt         time.Time  `json:"created_at"`
}

// MatchingMessageResponse represents a message in API responses
type MatchingMessageResponse struct {
	ID             uint       `json:"id"`
	MatchingChatID uint       `json:"matching_chat_id"`
	SenderID       uint       `json:"sender_id"`
	SenderName     string     `json:"sender_name"`
	SenderType     string     `json:"sender_type"`
	Message        string     `json:"message"`
	ImageURL       string     `json:"image_url,omitempty"`
	IsRead         bool       `json:"is_read"`
	ReadAt         *time.Time `json:"read_at"`
	CreatedAt      time.Time  `json:"created_at"`
}

// CreateMatchingChatRequest represents request to create a chat
type CreateMatchingChatRequest struct {
	MatchingRequestID uint `json:"matching_request_id" binding:"required"`
}

// SendMatchingMessageRequest represents request to send a message
type SendMatchingMessageRequest struct {
	Message  string `json:"message"`   // Optional if image_url is provided
	ImageURL string `json:"image_url"` // Optional image URL
}

// GetOrCreateMatchingChat gets or creates a chat for a matching request
func GetOrCreateMatchingChat(db *gorm.DB, matchingRequestID uint) (*MatchingChat, error) {
	// Get matching request
	request, err := GetMatchingRequestByID(db, matchingRequestID)
	if err != nil {
		return nil, err
	}

	// Check if request is accepted
	if request.Status != "accepted" || request.AcceptedVisitorID == nil {
		return nil, gorm.ErrInvalidValue
	}

	// Check if chat already exists
	var chat MatchingChat
	err = db.Where("matching_request_id = ?", matchingRequestID).
		Preload("Supplier").Preload("Visitor").
		Preload("SupplierUser").Preload("VisitorUser").
		First(&chat).Error

	if err == nil {
		return &chat, nil
	}

	if err != gorm.ErrRecordNotFound {
		return nil, err
	}

	// Get visitor
	var visitor Visitor
	if err := db.First(&visitor, *request.AcceptedVisitorID).Error; err != nil {
		return nil, err
	}

	// Create new chat
	chat = MatchingChat{
		MatchingRequestID: matchingRequestID,
		SupplierID:        request.SupplierID,
		VisitorID:         *request.AcceptedVisitorID,
		SupplierUserID:    request.UserID,
		VisitorUserID:     visitor.UserID,
		IsActive:          true,
	}

	if err := db.Create(&chat).Error; err != nil {
		return nil, err
	}

	// Preload relations
	if err := db.Preload("Supplier").Preload("Visitor").
		Preload("SupplierUser").Preload("VisitorUser").
		First(&chat, chat.ID).Error; err != nil {
		return nil, err
	}

	return &chat, nil
}

// GetMatchingChatMessages gets all messages for a chat
func GetMatchingChatMessages(db *gorm.DB, chatID uint, page, perPage int) ([]MatchingMessage, int64, error) {
	var messages []MatchingMessage
	var total int64

	query := db.Model(&MatchingMessage{}).Where("matching_chat_id = ?", chatID)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * perPage
	err := query.Preload("Sender").
		Order("created_at ASC").
		Offset(offset).Limit(perPage).Find(&messages).Error

	return messages, total, err
}

// CreateMatchingMessage creates a new message in a chat
func CreateMatchingMessage(db *gorm.DB, chatID uint, senderID uint, senderType string, message string, imageURL string) (*MatchingMessage, error) {
	// Verify chat exists and user has access
	var chat MatchingChat
	if err := db.First(&chat, chatID).Error; err != nil {
		return nil, err
	}

	// Verify sender is part of the chat
	if senderType == "supplier" && chat.SupplierUserID != senderID {
		return nil, gorm.ErrInvalidValue
	}
	if senderType == "visitor" && chat.VisitorUserID != senderID {
		return nil, gorm.ErrInvalidValue
	}

	// Validate: either message or image_url must be provided
	if message == "" && imageURL == "" {
		return nil, gorm.ErrInvalidValue
	}

	matchingMessage := MatchingMessage{
		MatchingChatID: chatID,
		SenderID:       senderID,
		SenderType:     senderType,
		Message:        message,
		ImageURL:       imageURL,
		IsRead:         false,
	}

	if err := db.Create(&matchingMessage).Error; err != nil {
		return nil, err
	}

	// Preload sender
	if err := db.Preload("Sender").First(&matchingMessage, matchingMessage.ID).Error; err != nil {
		return nil, err
	}

	// Update chat updated_at
	db.Model(&chat).Update("updated_at", time.Now())

	return &matchingMessage, nil
}

// MarkMatchingMessagesAsRead marks messages as read
func MarkMatchingMessagesAsRead(db *gorm.DB, chatID uint, userID uint) error {
	now := time.Now()
	return db.Model(&MatchingMessage{}).
		Where("matching_chat_id = ? AND sender_id != ? AND is_read = ?", chatID, userID, false).
		Updates(map[string]interface{}{
			"is_read": true,
			"read_at": now,
		}).Error
}

// GetMatchingChatsForUser gets all chats for a user
func GetMatchingChatsForUser(db *gorm.DB, userID uint, page, perPage int) ([]MatchingChat, int64, error) {
	var chats []MatchingChat
	var total int64

	query := db.Model(&MatchingChat{}).
		Where("(supplier_user_id = ? OR visitor_user_id = ?) AND is_active = ?", userID, userID, true)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * perPage
	err := query.Preload("MatchingRequest").
		Preload("Supplier").Preload("Visitor").
		Preload("SupplierUser").Preload("VisitorUser").
		Preload("Messages", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at DESC").Limit(1)
		}).
		Order("updated_at DESC").
		Offset(offset).Limit(perPage).Find(&chats).Error

	return chats, total, err
}

// GetMatchingRatingsByUser gets all ratings for a user
func GetMatchingRatingsByUser(db *gorm.DB, userID uint, page, perPage int) ([]MatchingRating, int64, error) {
	var ratings []MatchingRating
	var total int64

	query := db.Model(&MatchingRating{}).Where("rated_id = ?", userID)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * perPage
	err := query.Preload("MatchingRequest").
		Preload("Rater").
		Preload("Rated").
		Order("created_at DESC").
		Offset(offset).Limit(perPage).Find(&ratings).Error

	return ratings, total, err
}

// GetAverageRatingForUser calculates the average rating for a user (supplier or visitor)
func GetAverageRatingForUser(db *gorm.DB, userID uint) (float64, int, error) {
	var result struct {
		AverageRating float64
		TotalRatings  int
	}

	err := db.Model(&MatchingRating{}).
		Select("COALESCE(AVG(rating), 0) as average_rating, COUNT(*) as total_ratings").
		Where("rated_id = ?", userID).
		Scan(&result).Error

	if err != nil {
		return 0, 0, err
	}

	// Round to 1 decimal place
	avgRating := math.Round(result.AverageRating*10) / 10
	return avgRating, result.TotalRatings, nil
}
