package models

import (
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
func GetAvailableMatchingRequestsForVisitor(db *gorm.DB, visitorID uint, page, perPage int) ([]MatchingRequest, int64, error) {
	var requests []MatchingRequest
	var total int64

	// Get visitor to check destination cities
	var visitor Visitor
	if err := db.First(&visitor, visitorID).Error; err != nil {
		return nil, 0, err
	}

	// Query for active requests that match visitor's destination cities
	// This is a simplified version - the actual matching logic will be in the service layer
	query := db.Model(&MatchingRequest{}).
		Where("status IN ?", []string{"pending", "active"}).
		Where("expires_at > ?", time.Now())

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
