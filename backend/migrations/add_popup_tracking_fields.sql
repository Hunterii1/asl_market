-- Migration: Add popup tracking fields to users table
-- Date: 2024-02-24

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS has_seen_license_popup BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS license_popup_shown_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS has_seen_post_login_popup BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS post_login_popup_shown_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS has_seen_browsing_popup BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS browsing_popup_shown_at TIMESTAMP NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_license_popup ON users(has_seen_license_popup);
CREATE INDEX IF NOT EXISTS idx_users_post_login_popup ON users(has_seen_post_login_popup);
CREATE INDEX IF NOT EXISTS idx_users_browsing_popup ON users(has_seen_browsing_popup);
