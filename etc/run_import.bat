@echo off
title ASL Market Excel Data Import

echo 🚀 ASL Market Excel Data Import
echo ================================
echo.

REM Check if we're in the etc directory
if not exist "excel_importer.go" (
    echo ❌ Error: Please run this script from the etc directory
    echo Usage: cd etc ^&^& run_import.bat
    pause
    exit /b 1
)

REM Check if Excel files exist
set "SUPPLIER_FILE=َASL SUPPLIER.xlsx"
set "VISITOR_FILE=ASL MARKET VISITOR.xlsx"

echo 📂 Checking for Excel files...

set FILES_FOUND=0
if exist "%SUPPLIER_FILE%" (
    echo ✅ Found supplier file: َASL SUPPLIER.xlsx
    set /a FILES_FOUND+=1
) else (
    echo ⚠️  Supplier file not found: َASL SUPPLIER.xlsx
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
    echo   - َASL SUPPLIER.xlsx
    pause
    exit /b 1
)

echo.
echo 📦 Installing dependencies...
go mod tidy

echo.
echo 🔄 Starting import process...
echo This may take a few minutes depending on the size of your Excel files...
echo.

REM Run the import script
go run excel_importer.go

if %ERRORLEVEL%==0 (
    echo.
    echo 🎉 Import completed successfully!
    echo.
    echo 📋 Next steps:
    echo 1. Check the Telegram bot admin panel to review imported data
    echo 2. Use the edit/delete functions to manage imported records
    echo 3. Approve or reject suppliers and visitors as needed
    echo.
    echo 💡 Generated user credentials follow this pattern:
    echo    Email: name.surname.1234@aslmarket.local
    echo    Password: ASL######!
) else (
    echo.
    echo ❌ Import failed. Please check the error messages above.
    echo Common issues:
    echo 1. Database connection problems
    echo 2. Incorrect Excel file format
    echo 3. Missing required columns
)

echo.
echo Press any key to exit...
pause >nul
