-- Fix Email to be truly optional
-- This migration ensures email can be NULL and removes any UNIQUE constraint

USE asl_market;

-- Step 1: Check current email column definition
SELECT 
    COLUMN_NAME,
    IS_NULLABLE,
    COLUMN_TYPE,
    COLUMN_KEY
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'asl_market' 
AND TABLE_NAME = 'users' 
AND COLUMN_NAME = 'email';

-- Step 2: Check if there's a UNIQUE index on email
SELECT 
    INDEX_NAME,
    COLUMN_NAME,
    NON_UNIQUE
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = 'asl_market' 
AND TABLE_NAME = 'users' 
AND COLUMN_NAME = 'email';

-- Step 3: Drop UNIQUE constraint on email if exists
-- Note: The index name might be 'email' or 'idx_users_email' or 'email_UNIQUE'
-- Check the output of Step 2 to see the exact name

-- Uncomment the appropriate line based on Step 2 output:
-- ALTER TABLE users DROP INDEX email;
-- ALTER TABLE users DROP INDEX idx_users_email;
-- ALTER TABLE users DROP INDEX email_UNIQUE;

-- Step 4: Make email column nullable (if it isn't already)
ALTER TABLE users 
MODIFY COLUMN email VARCHAR(255) NULL DEFAULT NULL;

-- Step 5: Verify the changes
DESCRIBE users;

-- Step 6: Show all indexes to confirm email UNIQUE is removed
SHOW INDEX FROM users;
