#!/bin/bash

# Excel Data Import Script Runner
# This script helps you import visitor and supplier data from Excel files

echo "🚀 ASL Market Excel Data Import"
echo "================================"

# Check if we're in the etc directory
if [ ! -f "excel_importer.go" ]; then
    echo "❌ Error: Please run this script from the etc directory"
    echo "Usage: cd etc && ./run_import.sh"
    exit 1
fi

# Check if Excel files exist
SUPPLIER_FILE="َASL SUPPLIER.xlsx"
VISITOR_FILE="ASL MARKET VISITOR.xlsx"

echo "📂 Checking for Excel files..."

FILES_FOUND=0
if [ -f "$SUPPLIER_FILE" ]; then
    echo "✅ Found supplier file: َASL SUPPLIER.xlsx"
    FILES_FOUND=$((FILES_FOUND + 1))
else
    echo "⚠️  Supplier file not found: َASL SUPPLIER.xlsx"
fi

if [ -f "$VISITOR_FILE" ]; then
    echo "✅ Found visitor file: ASL MARKET VISITOR.xlsx"
    FILES_FOUND=$((FILES_FOUND + 1))
else
    echo "⚠️  Visitor file not found: ASL MARKET VISITOR.xlsx"
fi

if [ $FILES_FOUND -eq 0 ]; then
    echo "❌ Error: No Excel files found to import"
    echo "Please place your Excel files in this directory:"
    echo "  - ASL MARKET VISITOR.xlsx"
    echo "  - َASL SUPPLIER.xlsx"
    exit 1
fi

echo ""
echo "📦 Installing dependencies..."
go mod tidy

echo ""
echo "🔄 Starting import process..."
echo "This may take a few minutes depending on the size of your Excel files..."
echo ""

# Run the import script
go run excel_importer.go

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Import completed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Check the Telegram bot admin panel to review imported data"
    echo "2. Use the edit/delete functions to manage imported records"
    echo "3. Approve or reject suppliers and visitors as needed"
    echo ""
    echo "💡 Generated user credentials follow this pattern:"
    echo "   Email: name.surname.1234@aslmarket.local"
    echo "   Password: ASL######!"
else
    echo ""
    echo "❌ Import failed. Please check the error messages above."
    echo "Common issues:"
    echo "1. Database connection problems"
    echo "2. Incorrect Excel file format"
    echo "3. Missing required columns"
    exit 1
fi
