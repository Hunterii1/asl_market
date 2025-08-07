package main

import (
	"fmt"
	"log"

	"asl-market-backend/config"
	"asl-market-backend/models"
)

func main3() {
	// Load config
	config.LoadConfig()

	// Connect to database
	models.ConnectDatabase()
	db := models.GetDB()

	fmt.Println("🔧 Fixing database charset for Persian text support...")

	// List of SQL commands to fix charset
	sqlCommands := []string{
		"ALTER DATABASE asl_market CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci",
		"ALTER TABLE chats CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
		"ALTER TABLE messages CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
		"ALTER TABLE users CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
		"ALTER TABLE suppliers CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
		"ALTER TABLE supplier_products CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
		"ALTER TABLE visitors CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
		"ALTER TABLE research_products CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
		"ALTER TABLE licenses CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
		"ALTER TABLE chats MODIFY COLUMN title VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
		"ALTER TABLE messages MODIFY COLUMN content TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
		"ALTER TABLE research_products MODIFY COLUMN name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
		"ALTER TABLE research_products MODIFY COLUMN category VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
		"ALTER TABLE research_products MODIFY COLUMN description TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
	}

	for i, sql := range sqlCommands {
		fmt.Printf("🔄 Executing SQL %d/%d...\n", i+1, len(sqlCommands))

		result := db.Exec(sql)
		if result.Error != nil {
			log.Printf("⚠️  Warning executing SQL: %v", result.Error)
			// Continue with other commands even if one fails
		} else {
			fmt.Printf("✅ Successfully executed SQL %d\n", i+1)
		}
	}

	fmt.Println("🎉 Database charset fix completed!")
	fmt.Println("📝 Note: If you still get charset errors, restart your MySQL server and try again.")
}
