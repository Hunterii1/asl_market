@echo off
echo 🚀 Creating fake users for video recording...
echo.

cd /d "%~dp0"
cd backend

echo 📦 Building the script...
go build -o create_fake_users.exe scripts/create_fake_users.go

if %errorlevel% neq 0 (
    echo ❌ Build failed!
    echo.
    echo 💡 Make sure you're in the project root directory
    echo 💡 Make sure Go is installed and backend dependencies are available
    pause
    exit /b 1
)

echo ✅ Build successful!
echo.
echo 🔧 Running the script...
echo.

create_fake_users.exe

echo.
echo.
echo 🧪 Testing chart data...
go run scripts/test_chart_data.go

echo.
echo 🧹 Cleaning up...
del create_fake_users.exe

echo.
echo 🎉 Script completed!
echo.
pause
