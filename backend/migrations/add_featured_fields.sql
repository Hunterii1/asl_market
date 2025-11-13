-- Migration: Add featured fields to suppliers and visitors tables
-- Date: 2024-11-13
-- Description: Add is_featured, featured_at, and featured_by fields for highlighting system

-- Add featured fields to suppliers table
ALTER TABLE suppliers 
ADD COLUMN is_featured BOOLEAN DEFAULT FALSE,
ADD COLUMN featured_at TIMESTAMP NULL,
ADD COLUMN featured_by INT UNSIGNED NULL;

-- Add featured fields to visitors table  
ALTER TABLE visitors
ADD COLUMN is_featured BOOLEAN DEFAULT FALSE,
ADD COLUMN featured_at TIMESTAMP NULL,
ADD COLUMN featured_by INT UNSIGNED NULL;

-- Add indexes for better performance
CREATE INDEX idx_suppliers_featured ON suppliers(is_featured, featured_at);
CREATE INDEX idx_visitors_featured ON visitors(is_featured, featured_at);

-- Add foreign key constraints (optional, if you want to track which admin featured them)
-- ALTER TABLE suppliers ADD CONSTRAINT fk_suppliers_featured_by FOREIGN KEY (featured_by) REFERENCES users(id);
-- ALTER TABLE visitors ADD CONSTRAINT fk_visitors_featured_by FOREIGN KEY (featured_by) REFERENCES users(id);
