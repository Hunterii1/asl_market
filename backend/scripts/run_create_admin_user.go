package main

import (
	"asl-market-backend/config"
	"asl-market-backend/models"
	"asl-market-backend/utils"
	"fmt"
	"log"
	"os"
)

func main() {
	// Load config
	config.LoadConfig()

	// Connect to database
	models.ConnectDatabase()
	db := models.GetDB()

	fmt.Println("🔐 Creating Admin User...")
	fmt.Println("================================")

	// Admin credentials
	adminEmail := "alireza"
	adminPassword := "qwertyuiop!!1234"
	adminFirstName := "Alireza"
	adminLastName := "Admin"
	adminPhone := "09123456789"

	// Check if admin user already exists
	var existingUser models.User
	err := db.Where("email = ?", adminEmail).First(&existingUser).Error
	if err == nil {
		// User exists, update password and ensure admin status
		fmt.Printf("⚠️  Admin user with email '%s' already exists. Updating...\n", adminEmail)

		// Hash new password
		hashedPassword, err := utils.HashPassword(adminPassword)
		if err != nil {
			log.Fatalf("❌ Error hashing password: %v", err)
		}

		// Update user
		updates := map[string]interface{}{
			"password":  hashedPassword,
			"is_admin":  true,
			"is_active": true,
		}

		if err := db.Model(&existingUser).Updates(updates).Error; err != nil {
			log.Fatalf("❌ Error updating admin user: %v", err)
		}

		fmt.Println("✅ Admin user updated successfully!")
		fmt.Printf("📧 Email: %s\n", adminEmail)
		fmt.Printf("🔑 Password: %s\n", adminPassword)
		fmt.Printf("👤 User ID: %d\n", existingUser.ID)
		os.Exit(0)
	}

	// Hash password
	hashedPassword, err := utils.HashPassword(adminPassword)
	if err != nil {
		log.Fatalf("❌ Error hashing password: %v", err)
	}

	// Create admin user
	adminUser := models.User{
		FirstName: adminFirstName,
		LastName:  adminLastName,
		Email:     adminEmail,
		Password:  hashedPassword,
		Phone:     adminPhone,
		IsAdmin:   true,
		IsActive:  true,
	}

	if err := db.Create(&adminUser).Error; err != nil {
		log.Fatalf("❌ Error creating admin user: %v", err)
	}

	fmt.Println("✅ Admin user created successfully!")
	fmt.Println("")
	fmt.Println("📋 Admin Credentials:")
	fmt.Printf("   📧 Email: %s\n", adminEmail)
	fmt.Printf("   🔑 Password: %s\n", adminPassword)
	fmt.Printf("   👤 User ID: %d\n", adminUser.ID)
	fmt.Println("")
	fmt.Println("🌐 You can now login to admin panel at:")
	fmt.Println("   https://admin.asllmarket.com")
}
