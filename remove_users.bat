@echo off
echo ========================================
echo    حذف کاربران خاص از دیتابیس ASL Market
echo ========================================
echo.

echo ⚠️  هشدار: این عملیات غیرقابل برگشت است!
echo 📱 شماره‌های موبایل مورد حذف:
echo    - 09157095158 (توران قلمزن)
echo    - 09020304117
echo    - 09123456789
echo.

set /p confirm="آیا مطمئن هستید که می‌خواهید ادامه دهید؟ (y/N): "
if /i not "%confirm%"=="y" (
    echo ❌ عملیات لغو شد.
    pause
    exit /b
)

echo.
echo 🔍 شروع عملیات حذف...
echo.

cd backend\scripts
go run remove_specific_users.go

echo.
echo ✅ عملیات تکمیل شد!
echo.
pause
