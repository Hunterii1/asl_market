@echo off
echo 🔄 Restarting ASL Market Backend...

REM Kill existing backend process
echo 🛑 Stopping existing backend...
taskkill /F /IM asl-market-backend.exe >nul 2>&1

REM Build backend
echo 🔨 Building backend...
cd backend
go build -o asl-market-backend.exe

REM Check if build was successful
if %errorlevel%==0 (
    echo ✅ Backend built successfully
    
    REM Start backend in background
    echo 🚀 Starting backend...
    start /B asl-market-backend.exe > backend.log 2>&1
    
    echo ✅ Backend started! Check backend.log for logs
) else (
    echo ❌ Backend build failed!
    pause
    exit /b 1
)

cd ..

REM Optional: Seed available products
set /p response="🌱 Would you like to seed available products? (y/n): "
if /i "%response%"=="y" (
    echo 🌱 Seeding available products...
    cd backend\scripts
    go run run_seed_available_products.go
    cd ..\..
    echo ✅ Seeding completed!
)

echo 🎉 All done! Backend is running with database middleware.
pause