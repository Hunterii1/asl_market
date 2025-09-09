package main

import (
	"fmt"
	"log"

	"asl-market-backend/config"
	"asl-market-backend/models"
	"asl-market-backend/services"
)

func main22() {
	// Load configuration
	config.LoadConfig()

	// Connect to database
	models.ConnectDatabase()

	// Test SpotPlayer service
	spotPlayerService := services.NewSpotPlayerService()

	// Test phone number formatting
	phone := spotPlayerService.FormatPhoneNumber(123)
	fmt.Printf("Formatted phone number for user ID 123: %s\n", phone)

	// Test license generation (this will make actual API call)
	fmt.Println("Testing SpotPlayer license generation...")
	license, err := spotPlayerService.GenerateLicense("test_user", []string{"6878d13055b704ee2521bbb7"}, []string{phone}, false)
	if err != nil {
		log.Printf("Error generating license: %v", err)
	} else {
		fmt.Printf("License generated successfully: %+v\n", license)
	}
}
