@echo off
echo Starting ASL Market Backend...
echo.
echo Make sure you have:
echo 1. MySQL running on localhost:3306
echo 2. Database 'asl_market' created
echo 3. User 'asl_user' with password 'asl_password_2024'
echo.
echo Starting server on http://localhost:8080
echo.
cd backend
go run main.go
pause
