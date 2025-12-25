@echo off
REM Build script for Admin Panel (Windows)
REM این اسکریپت admin-panel را build می‌کند

echo 🚀 Building Admin Panel...
echo ================================

REM Navigate to admin-panel directory
cd /d "%~dp0"

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    call npm install
)

REM Build for production
echo 🔨 Building for production...
call npm run build

if %ERRORLEVEL% EQU 0 (
    echo ✅ Build completed successfully!
    echo 📁 Build output: .\dist
    echo.
    echo 📋 Next steps:
    echo 1. Copy .\dist to /var/www/admin.asllmarket.com/
    echo 2. Configure nginx (see nginx/admin.asllmarket.com.conf)
    echo 3. Restart nginx: sudo systemctl restart nginx
) else (
    echo ❌ Build failed!
    exit /b 1
)

