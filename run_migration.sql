-- Simple migration script to add featured fields
-- Run this in your MySQL database

USE asl_market;

-- Add featured fields to suppliers table
ALTER TABLE suppliers 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS featured_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS featured_by INT UNSIGNED NULL;

-- Add featured fields to visitors table  
ALTER TABLE visitors
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS featured_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS featured_by INT UNSIGNED NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_suppliers_featured ON suppliers(is_featured, featured_at);
CREATE INDEX IF NOT EXISTS idx_visitors_featured ON visitors(is_featured, featured_at);

-- Show results
SELECT 'Migration completed successfully!' as status;
SELECT COUNT(*) as total_suppliers FROM suppliers;
SELECT COUNT(*) as total_visitors FROM visitors;
