package main

import (
	"fmt"
	"log"

	"asl-market-backend/models"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func main55555() {
	// Database connection
	dsn := "asl_user:asl_password_2024@tcp(localhost:3306)/asl_market?charset=utf8mb4&parseTime=True&loc=Local"
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Find all tickets with waiting_response status
	var tickets []models.SupportTicket
	err = db.Preload("Messages").Where("status = ?", "waiting_response").Find(&tickets).Error
	if err != nil {
		log.Fatal("Failed to query tickets:", err)
	}

	fmt.Printf("Found %d tickets with 'waiting_response' status\n", len(tickets))

	for _, ticket := range tickets {
		// Check if there are any admin messages
		hasAdminMessage := false
		hasUserMessage := false

		for _, msg := range ticket.Messages {
			if msg.IsAdmin {
				hasAdminMessage = true
			} else {
				hasUserMessage = true
			}
		}

		fmt.Printf("\nTicket #%d:\n", ticket.ID)
		fmt.Printf("  Current Status: %s\n", ticket.Status)
		fmt.Printf("  Has Admin Messages: %v\n", hasAdminMessage)
		fmt.Printf("  Has User Messages: %v\n", hasUserMessage)
		fmt.Printf("  Total Messages: %d\n", len(ticket.Messages))

		// Determine correct status
		var correctStatus string
		if !hasAdminMessage && hasUserMessage {
			// Only user messages, should be "open" or "in_progress"
			correctStatus = "open"
		} else if hasAdminMessage && hasUserMessage {
			// Both admin and user messages exist
			// Check the last message to determine status
			if len(ticket.Messages) > 0 {
				lastMessage := ticket.Messages[len(ticket.Messages)-1]
				if lastMessage.IsAdmin {
					correctStatus = "waiting_response" // Admin replied last
				} else {
					correctStatus = "in_progress" // User replied last
				}
			}
		} else if hasAdminMessage && !hasUserMessage {
			// Only admin messages (shouldn't happen but handle it)
			correctStatus = "in_progress"
		} else {
			// No messages at all
			correctStatus = "open"
		}

		if correctStatus != ticket.Status {
			fmt.Printf("  Fixing status: %s → %s\n", ticket.Status, correctStatus)
			err = db.Model(&ticket).Update("status", correctStatus).Error
			if err != nil {
				fmt.Printf("  ERROR updating ticket #%d: %v\n", ticket.ID, err)
			} else {
				fmt.Printf("  ✅ Updated ticket #%d status\n", ticket.ID)
			}
		} else {
			fmt.Printf("  ✅ Status is correct\n")
		}
	}

	fmt.Println("\n✅ Ticket status fix completed!")
}
