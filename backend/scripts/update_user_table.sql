-- Update User Table Structure for Phone-Based Authentication
-- This script updates the existing user table to make phone required and email optional

USE asl_market;

-- First, check if there are any users without phone numbers
SELECT COUNT(*) as users_without_phone FROM users WHERE phone IS NULL OR phone = '';

-- If there are users without phone numbers, you need to update them first
-- For example, you can generate phone numbers from existing data or set defaults

-- Update the table structure
ALTER TABLE users 
MODIFY COLUMN email VARCHAR(255) NULL,
MODIFY COLUMN phone VARCHAR(255) NOT NULL;

-- Add unique index on phone if it doesn't exist
-- First check if the index exists
SELECT COUNT(*) as phone_index_exists 
FROM information_schema.statistics 
WHERE table_schema = 'asl_market' 
AND table_name = 'users' 
AND index_name = 'idx_users_phone';

-- If index doesn't exist, create it
-- ALTER TABLE users ADD UNIQUE INDEX idx_users_phone (phone);

-- Remove unique index from email if it exists
-- First check if the index exists
SELECT COUNT(*) as email_index_exists 
FROM information_schema.statistics 
WHERE table_schema = 'asl_market' 
AND table_name = 'users' 
AND index_name = 'idx_users_email';

-- If email unique index exists, remove it
-- ALTER TABLE users DROP INDEX idx_users_email;

-- Verify the changes
DESCRIBE users;

-- Show current indexes
SHOW INDEX FROM users;
