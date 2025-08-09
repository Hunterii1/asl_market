@echo off
title Fix Imported Records Status

echo 🔧 Fix Imported Records Status
echo ==============================
echo.

REM Check if we're in the etc directory
if not exist "fix_imported_status.go" (
    echo ❌ Error: Please run this script from the etc directory
    echo Usage: cd etc ^&^& fix_status.bat
    pause
    exit /b 1
)

echo 📦 Installing dependencies...
go mod tidy

echo.
echo 🔄 Fixing record status...
echo This will change all pending suppliers and visitors to approved status...
echo.

REM Run the fix script
go run fix_imported_status.go

if %ERRORLEVEL%==0 (
    echo.
    echo 🎉 Status fix completed successfully!
    echo.
    echo 📋 Next steps:
    echo 1. Check your website - suppliers and visitors should now appear
    echo 2. Verify in Telegram bot admin panel
    echo 3. Test the contact viewing functionality
) else (
    echo.
    echo ❌ Fix failed. Please check the error messages above.
)

echo.
echo Press any key to exit...
pause >nul
