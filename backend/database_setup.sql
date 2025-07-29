-- MySQL Database Setup Script for ASL Market
-- Run this script as MySQL root user

-- Create database
CREATE DATABASE IF NOT EXISTS asl_market 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Create dedicated user for ASL Market
CREATE USER IF NOT EXISTS 'asl_user'@'localhost' IDENTIFIED BY 'asl_password_2024';
CREATE USER IF NOT EXISTS 'asl_user'@'%' IDENTIFIED BY 'asl_password_2024';

-- Grant all privileges on asl_market database to asl_user
GRANT ALL PRIVILEGES ON asl_market.* TO 'asl_user'@'localhost';
GRANT ALL PRIVILEGES ON asl_market.* TO 'asl_user'@'%';

-- Grant specific privileges for better security (alternative to ALL PRIVILEGES)
-- GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, ALTER, INDEX ON asl_market.* TO 'asl_user'@'localhost';
-- GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, ALTER, INDEX ON asl_market.* TO 'asl_user'@'%';

-- Refresh privileges
FLUSH PRIVILEGES;

-- Show created database and user
SHOW DATABASES LIKE 'asl_market';
SELECT User, Host FROM mysql.user WHERE User = 'asl_user';

-- Display success message
SELECT 'Database and user setup completed successfully!' AS Status; 