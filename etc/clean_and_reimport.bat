 @echo off
title Excel Import Tool

echo 📋 ASL Market Excel Import Tool
echo ================================
echo.

REM Check if we're in the etc directory
if not exist "clean_and_reimport.go" (
    echo ❌ Error: Please run this script from the etc directory
    echo Usage: cd etc ^&^& clean_and_reimport.bat
    pause
    exit /b 1
)

REM Check if Excel files exist
set "SUPPLIER_FILE=ASL SUPPLIER.xlsx"
set "VISITOR_FILE=ASL MARKET VISITOR.xlsx"

echo 📂 Checking for Excel files...

set FILES_FOUND=0
if exist "%SUPPLIER_FILE%" (
    echo ✅ Found supplier file: ASL SUPPLIER.xlsx
    set /a FILES_FOUND+=1
) else (
    echo ⚠️  Supplier file not found: ASL SUPPLIER.xlsx
)

if exist "%VISITOR_FILE%" (
    echo ✅ Found visitor file: ASL MARKET VISITOR.xlsx
    set /a FILES_FOUND+=1
) else (
    echo ⚠️  Visitor file not found: ASL MARKET VISITOR.xlsx
)

if %FILES_FOUND%==0 (
    echo ❌ Error: No Excel files found to import
    echo Please place your Excel files in this directory:
    echo   - ASL MARKET VISITOR.xlsx
    echo   - ASL SUPPLIER.xlsx
    pause
    exit /b 1
)

echo.
echo 📦 Installing dependencies...
go mod tidy

echo.
echo 🔄 Starting Excel import process...
echo This will:
echo 1. Analyze Excel file structure ^& mapping
echo 2. Import data with correct field mapping
echo 3. Create users with proper credentials
echo.

REM Run the import script
go run clean_and_reimport.go

if %ERRORLEVEL%==0 (
    echo.
    echo 🎉 Excel import completed successfully!
    echo.
    echo 📋 Next steps:
    echo 1. Check your website - suppliers and visitors should now appear correctly
    echo 2. Verify contact information is showing properly
    echo 3. Test the contact viewing functionality
    echo.
    echo 💡 All users now have proper credentials:
    echo    Email: name.surname.1234@aslmarket.local
    echo    Password: ASL######!
) else (
    echo.
    echo ❌ Excel import failed. Please check the error messages above.
    echo Common issues:
    echo 1. Database connection problems
    echo 2. Incorrect Excel file format or structure
    echo 3. Missing required columns in Excel files
    echo 4. Invalid data in Excel cells
)

echo.
echo Press any key to exit...
pause >nul 