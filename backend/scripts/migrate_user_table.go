package main

import (
	"fmt"
	"log"

	"asl-market-backend/config"
	"asl-market-backend/models"
)

func main2() {
	// Load config
	config.LoadConfig()

	// Connect to database
	models.ConnectDatabase()
	db := models.GetDB()

	fmt.Println("🔄 Starting user table migration...")

	// Check current table structure
	var users []models.User
	if err := db.Find(&users).Error; err != nil {
		log.Fatalf("Error querying users: %v", err)
	}

	fmt.Printf("📊 Found %d users in database\n", len(users))

	// Check for users without phone numbers
	var usersWithoutPhone []models.User
	if err := db.Where("phone IS NULL OR phone = ?", "").Find(&usersWithoutPhone).Error; err != nil {
		log.Fatalf("Error querying users without phone: %v", err)
	}

	if len(usersWithoutPhone) > 0 {
		fmt.Printf("⚠️  Found %d users without phone numbers\n", len(usersWithoutPhone))
		fmt.Println("These users need phone numbers before migration:")

		for _, user := range usersWithoutPhone {
			fmt.Printf("  - User ID: %d, Name: %s %s, Email: %s\n",
				user.ID, user.FirstName, user.LastName, user.Email)
		}

		fmt.Println("\n❌ Migration cannot proceed. Please update these users first.")
		return
	}

	fmt.Println("✅ All users have phone numbers")

	// Execute migration SQL
	fmt.Println("🔧 Executing database migration...")

	// Note: In production, you should use proper migration tools
	// This is a simplified example
	migrationSQL := `
		ALTER TABLE users 
		MODIFY COLUMN email VARCHAR(255) NULL,
		MODIFY COLUMN phone VARCHAR(255) NOT NULL;
	`

	if err := db.Exec(migrationSQL).Error; err != nil {
		log.Printf("Error executing migration: %v", err)
		log.Println("You may need to run the SQL manually:")
		log.Println(migrationSQL)
		return
	}

	fmt.Println("✅ Database migration completed successfully!")

	// Verify the changes
	var tableInfo []map[string]interface{}
	if err := db.Raw("DESCRIBE users").Scan(&tableInfo).Error; err != nil {
		log.Printf("Error describing table: %v", err)
		return
	}

	fmt.Println("\n📋 Updated table structure:")
	for _, column := range tableInfo {
		field := column["Field"].(string)
		null := column["Null"].(string)
		key := column["Key"].(string)
		fmt.Printf("  - %s: %s (Key: %s)\n", field, null, key)
	}

	fmt.Println("\n🎉 Migration completed! The system now uses phone-based authentication.")
}
