-- Add new customization columns to carousel_history table
ALTER TABLE carousel_history 
ADD COLUMN IF NOT EXISTS title text DEFAULT '',
ADD COLUMN IF NOT EXISTS theme text DEFAULT 'modern',
ADD COLUMN IF NOT EXISTS color_palette text DEFAULT 'vibrant',
ADD COLUMN IF NOT EXISTS tone text DEFAULT 'professional',
ADD COLUMN IF NOT EXISTS call_to_action text,
ADD COLUMN IF NOT EXISTS slides_config jsonb DEFAULT '[]'::jsonb;