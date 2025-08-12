package services

import (
	"fmt"
	"log"
)

// SMS service for sending notifications
type SMSService struct {
	client      *IPPanelClient
	originator  string
	patternCode string
}

var smsService *SMSService

// Initialize SMS service
func InitSMSService(apiKey, originator, patternCode string) {
	client := NewIPPanelClient(apiKey)
	smsService = &SMSService{
		client:      client,
		originator:  originator,
		patternCode: patternCode,
	}
	log.Printf("SMS service initialized with originator: %s", originator)
}

// Get SMS service instance
func GetSMSService() *SMSService {
	return smsService
}

// Send license activation SMS
func (s *SMSService) SendLicenseActivationSMS(phoneNumber, userName, licensePlan string) error {
	if s == nil || s.client == nil {
		return fmt.Errorf("SMS service not initialized")
	}

	// For simple pattern without parameters, send empty map
	patternValues := map[string]string{}

	// Send SMS with pattern
	messageID, err := s.client.SendPattern(
		s.patternCode, // "9i276pvpwvuj40w"
		s.originator,  // originator number
		phoneNumber,   // recipient
		patternValues, // empty pattern values for simple pattern
	)

	if err != nil {
		log.Printf("Error sending SMS to %s: %v", phoneNumber, err)
		return fmt.Errorf("failed to send SMS: %v", err)
	}

	log.Printf("SMS sent successfully to %s with message ID: %d", phoneNumber, messageID)
	return nil
}

// Send simple SMS (for other notifications)
func (s *SMSService) SendSimpleSMS(phoneNumber, message string) error {
	if s == nil || s.client == nil {
		return fmt.Errorf("SMS service not initialized")
	}

	// For simple SMS, we'll use a basic pattern or direct send method
	// This is simplified - you might need to implement a simple send method in the client
	log.Printf("Simple SMS would be sent to %s: %s", phoneNumber, message)
	return nil
}

// Check SMS credit
func (s *SMSService) GetCredit() (float64, error) {
	if s == nil || s.client == nil {
		return 0, fmt.Errorf("SMS service not initialized")
	}

	credit, err := s.client.GetCredit()
	if err != nil {
		log.Printf("Error getting SMS credit: %v", err)
		return 0, fmt.Errorf("failed to get credit: %v", err)
	}

	return credit, nil
}

// Validate Iranian phone number
func ValidateIranianPhoneNumber(phoneNumber string) string {
	// Remove any non-digit characters
	cleanNumber := ""
	for _, char := range phoneNumber {
		if char >= '0' && char <= '9' {
			cleanNumber += string(char)
		}
	}

	// Handle different formats
	if len(cleanNumber) == 11 && cleanNumber[0] == '0' {
		// 09123456789 -> 989123456789
		return "98" + cleanNumber[1:]
	} else if len(cleanNumber) == 10 && cleanNumber[0] == '9' {
		// 9123456789 -> 989123456789
		return "98" + cleanNumber
	} else if len(cleanNumber) == 13 && cleanNumber[:2] == "98" {
		// 989123456789 -> keep as is
		return cleanNumber
	} else if len(cleanNumber) == 14 && cleanNumber[:3] == "+98" {
		// +989123456789 -> 989123456789
		return cleanNumber[1:]
	}

	// If none of the above, assume it's already in correct format or invalid
	return cleanNumber
}
