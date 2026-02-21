#!/bin/bash

# Fix Email Optional - Automated Script
# This script checks and fixes the email column to be truly optional

echo "=== Checking Email Column Status ==="

# Database credentials (update these if needed)
DB_USER="asl_user"
DB_PASS="asl_password_2024"
DB_NAME="asl_market"

# Check current email column definition
echo -e "\n1. Current email column definition:"
mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
SELECT 
    COLUMN_NAME,
    IS_NULLABLE,
    COLUMN_TYPE,
    COLUMN_KEY
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = '$DB_NAME' 
AND TABLE_NAME = 'users' 
AND COLUMN_NAME = 'email';
"

# Check for UNIQUE index on email
echo -e "\n2. Checking for UNIQUE index on email:"
EMAIL_INDEX=$(mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -N -e "
SELECT INDEX_NAME
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = '$DB_NAME' 
AND TABLE_NAME = 'users' 
AND COLUMN_NAME = 'email'
AND NON_UNIQUE = 0;
")

if [ -n "$EMAIL_INDEX" ]; then
    echo "Found UNIQUE index: $EMAIL_INDEX"
    echo "Removing UNIQUE constraint..."
    mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "ALTER TABLE users DROP INDEX \`$EMAIL_INDEX\`;"
    if [ $? -eq 0 ]; then
        echo "✓ UNIQUE constraint removed successfully"
    else
        echo "✗ Failed to remove UNIQUE constraint"
        exit 1
    fi
else
    echo "No UNIQUE index found on email column"
fi

# Make email nullable
echo -e "\n3. Making email column nullable..."
mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
ALTER TABLE users 
MODIFY COLUMN email VARCHAR(255) NULL DEFAULT NULL;
"

if [ $? -eq 0 ]; then
    echo "✓ Email column is now nullable"
else
    echo "✗ Failed to modify email column"
    exit 1
fi

# Verify changes
echo -e "\n4. Verifying changes:"
mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
SELECT 
    COLUMN_NAME,
    IS_NULLABLE,
    COLUMN_TYPE,
    COLUMN_KEY,
    COLUMN_DEFAULT
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = '$DB_NAME' 
AND TABLE_NAME = 'users' 
AND COLUMN_NAME = 'email';
"

echo -e "\n5. Current indexes on users table:"
mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW INDEX FROM users WHERE Column_name = 'email';"

echo -e "\n=== Done! Email is now truly optional ==="
echo "You can now register users without providing an email address."
