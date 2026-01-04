@echo off
echo ========================================
echo Seeding Sliders from Assets Folder
echo ========================================
echo.

cd /d %~dp0\..

go run scripts/seed_sliders_from_assets.go

echo.
echo ========================================
echo Done!
echo ========================================
pause
