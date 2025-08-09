package main

import (
	"log"

	"asl-market-backend/config"
	"asl-market-backend/models"
)

func main() {
	// Initialize config
	config.LoadConfig()

	// Initialize database
	models.ConnectDatabase()
	db := models.GetDB()

	// Drop the withdrawal_requests table if it exists
	if db.Migrator().HasTable(&models.WithdrawalRequest{}) {
		log.Println("Dropping existing withdrawal_requests table...")
		err := db.Migrator().DropTable(&models.WithdrawalRequest{})
		if err != nil {
			log.Fatal("Failed to drop withdrawal_requests table:", err)
		}
		log.Println("withdrawal_requests table dropped successfully")
	}

	// Recreate the table with correct schema
	log.Println("Creating withdrawal_requests table with correct schema...")
	err := db.AutoMigrate(&models.WithdrawalRequest{})
	if err != nil {
		log.Fatal("Failed to create withdrawal_requests table:", err)
	}

	log.Println("withdrawal_requests table created successfully")
}
