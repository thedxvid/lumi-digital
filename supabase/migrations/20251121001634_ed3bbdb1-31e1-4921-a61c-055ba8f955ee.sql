-- Add columns to track offer details and eligibility
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS product_offer_id TEXT,
  ADD COLUMN IF NOT EXISTS product_offer_name TEXT,
  ADD COLUMN IF NOT EXISTS checkout_link TEXT,
  ADD COLUMN IF NOT EXISTS utm_source TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium TEXT,
  ADD COLUMN IF NOT EXISTS utm_content TEXT,
  ADD COLUMN IF NOT EXISTS tracking_params JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_eligible_offer BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Create index for performance on offer queries
CREATE INDEX IF NOT EXISTS idx_orders_product_offer_name ON orders(product_offer_name);
CREATE INDEX IF NOT EXISTS idx_orders_is_eligible_offer ON orders(is_eligible_offer);
CREATE INDEX IF NOT EXISTS idx_orders_checkout_link ON orders(checkout_link);