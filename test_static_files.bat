@echo off
echo 🧪 Testing Static Files Download...
echo.

cd /d "%~dp0"

echo 📋 Testing file downloads:
echo.

echo 1️⃣ Testing CRM Template...
curl -I "http://localhost:8080/api/static/CRM_Template_ASL_Market.xlsx"
echo.

echo 2️⃣ Testing Mega Prompt...
curl -I "http://localhost:8080/api/static/mega prompt ASL MARKET.docx"
echo.

echo 3️⃣ Testing Script...
curl -I "http://localhost:8080/api/static/Script ASL MARKET.docx"
echo.

echo 4️⃣ Testing Available Files API...
curl -s "http://localhost:8080/api/files" | jq .
echo.

echo 🎉 Test completed!
echo.
echo 💡 If you see 200 OK responses, the files are working correctly
echo 💡 If you see 404 errors, make sure the backend is running
echo.
pause
