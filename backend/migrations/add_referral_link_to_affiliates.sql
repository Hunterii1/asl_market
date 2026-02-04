-- Add referral_link column to affiliates table
-- This allows admin to set custom referral links instead of just referral codes

ALTER TABLE affiliates 
ADD COLUMN referral_link VARCHAR(500) NULL AFTER referral_code;

-- Make referral_code nullable and remove unique constraint (if exists)
ALTER TABLE affiliates 
MODIFY COLUMN referral_code VARCHAR(32) NULL;

-- Note: If you have a unique index on referral_code, you may need to drop it first:
-- ALTER TABLE affiliates DROP INDEX referral_code;
