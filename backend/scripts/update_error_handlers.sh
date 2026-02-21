#!/bin/bash

# Script to update all controllers to use the new error handler
# This script adds the middleware import and updates error responses

echo "🔧 Updating error handlers in all controllers..."

CONTROLLERS_DIR="./controllers"
BACKUP_DIR="./controllers_backup_$(date +%Y%m%d_%H%M%S)"

# Create backup
echo "📦 Creating backup at $BACKUP_DIR..."
cp -r "$CONTROLLERS_DIR" "$BACKUP_DIR"

# Counter for updated files
updated_count=0

# Find all .go files in controllers directory
for file in "$CONTROLLERS_DIR"/*.go; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        
        # Skip if already has middleware import
        if grep -q '"asl-market-backend/middleware"' "$file"; then
            echo "⏭️  Skipping $filename (already has middleware import)"
            continue
        fi
        
        # Check if file has any error responses that need updating
        if grep -q 'c.JSON(http.StatusInternalServerError' "$file"; then
            echo "🔄 Updating $filename..."
            
            # Add middleware import after the last import
            # This is a simple approach - for complex cases, manual review is recommended
            sed -i.bak '/^import (/,/^)/ {
                /^)/ i\
	"asl-market-backend/middleware"
            }' "$file"
            
            # Remove backup file created by sed
            rm -f "${file}.bak"
            
            ((updated_count++))
            echo "✅ Updated $filename"
        else
            echo "⏭️  Skipping $filename (no error responses found)"
        fi
    fi
done

echo ""
echo "✨ Done! Updated $updated_count controller files."
echo "📦 Backup created at: $BACKUP_DIR"
echo ""
echo "⚠️  IMPORTANT: Please review the changes manually!"
echo "   Some error responses may need manual adjustment to use:"
echo "   middleware.RespondWithError(c, statusCode, message, err, context)"
echo ""
echo "   Example:"
echo "   Before: c.JSON(http.StatusInternalServerError, gin.H{\"error\": \"خطا\"})"
echo "   After:  middleware.RespondWithError(c, http.StatusInternalServerError, \"خطا\", err, \"context\")"
