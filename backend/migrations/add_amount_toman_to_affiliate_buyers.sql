-- مبلغ هر پرداخت (تومان). NULL = ۶ میلیون تومان. Run once.
ALTER TABLE affiliate_buyers ADD COLUMN amount_toman BIGINT NULL DEFAULT 6000000;
