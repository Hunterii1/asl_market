#!/bin/bash

# ASL Market Database Setup Script
# This script sets up MySQL database and user for ASL Market backend

echo "🚀 ASL Market Database Setup"
echo "================================"

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL is not installed. Please install MySQL first."
    echo "📥 Download from: https://dev.mysql.com/downloads/"
    exit 1
fi

# Check if MySQL service is running
if ! pgrep -x "mysqld" > /dev/null; then
    echo "⚠️  MySQL service is not running. Please start MySQL service first."
    echo "🔧 On Windows: Run 'net start mysql' as administrator"
    echo "🔧 On macOS: Run 'brew services start mysql'"
    echo "🔧 On Linux: Run 'sudo systemctl start mysql'"
    exit 1
fi

echo "✅ MySQL is installed and running"

# Prompt for MySQL root password
echo ""
echo "🔐 Please enter MySQL root password:"
read -s ROOT_PASSWORD

# Test MySQL connection
mysql -u root -p"$ROOT_PASSWORD" -e "SELECT 1;" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "❌ Failed to connect to MySQL. Please check your root password."
    exit 1
fi

echo "✅ MySQL connection successful"

# Run the database setup script
echo ""
echo "📊 Creating database and user..."
mysql -u root -p"$ROOT_PASSWORD" < database_setup.sql

if [ $? -eq 0 ]; then
    echo "✅ Database setup completed successfully!"
    echo ""
    echo "📋 Database Information:"
    echo "   Database Name: asl_market"
    echo "   Username: asl_user"
    echo "   Password: asl_password_2024"
    echo "   Host: localhost"
    echo ""
    echo "🔧 Next Steps:"
    echo "1. Update config/config.yaml with the new database credentials"
    echo "2. Run 'go run main.go' to start the backend server"
    echo ""
    echo "⚠️  Security Note:"
    echo "   Please change the default password in production!"
else
    echo "❌ Database setup failed. Please check the error messages above."
    exit 1
fi 