-- Add commission_percent to affiliates (default 100 = 100%). Run once.
ALTER TABLE affiliates ADD COLUMN commission_percent DECIMAL(5,2) NOT NULL DEFAULT 100;
