@echo off
:: ASL Market Database Setup Script for Windows
:: This script sets up MySQL database and user for ASL Market backend

echo.
echo 🚀 ASL Market Database Setup
echo ================================

:: Check if MySQL is installed
mysql --version >nul 2>&1
if errorlevel 1 (
    echo ❌ MySQL is not installed or not in PATH
    echo 📥 Please install MySQL from: https://dev.mysql.com/downloads/
    echo 🔧 Make sure MySQL bin directory is added to PATH
    pause
    exit /b 1
)

echo ✅ MySQL is installed

:: Check if MySQL service is running
sc query mysql >nul 2>&1
if errorlevel 1 (
    echo ⚠️  MySQL service is not running
    echo 🔧 Starting MySQL service...
    net start mysql
    if errorlevel 1 (
        echo ❌ Failed to start MySQL service. Please start it manually.
        pause
        exit /b 1
    )
)

echo ✅ MySQL service is running

:: Prompt for MySQL root password
echo.
set /p ROOT_PASSWORD=🔐 Please enter MySQL root password: 

:: Test MySQL connection
mysql -u root -p%ROOT_PASSWORD% -e "SELECT 1;" >nul 2>&1
if errorlevel 1 (
    echo ❌ Failed to connect to MySQL. Please check your root password.
    pause
    exit /b 1
)

echo ✅ MySQL connection successful

:: Run the database setup script
echo.
echo 📊 Creating database and user...
mysql -u root -p%ROOT_PASSWORD% < database_setup.sql

if errorlevel 0 (
    echo ✅ Database setup completed successfully!
    echo.
    echo 📋 Database Information:
    echo    Database Name: asl_market
    echo    Username: asl_user
    echo    Password: asl_password_2024
    echo    Host: localhost
    echo.
    echo 🔧 Next Steps:
    echo 1. Update config/config.yaml with the new database credentials
    echo 2. Run 'go run main.go' to start the backend server
    echo.
    echo ⚠️  Security Note:
    echo    Please change the default password in production!
) else (
    echo ❌ Database setup failed. Please check the error messages above.
)

echo.
pause 