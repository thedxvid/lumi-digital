-- Add new columns to creative_history table for enhanced customization
ALTER TABLE creative_history ADD COLUMN IF NOT EXISTS creative_type text DEFAULT 'free';
ALTER TABLE creative_history ADD COLUMN IF NOT EXISTS format text DEFAULT 'square';
ALTER TABLE creative_history ADD COLUMN IF NOT EXISTS objective text DEFAULT 'engagement';
ALTER TABLE creative_history ADD COLUMN IF NOT EXISTS market text;
ALTER TABLE creative_history ADD COLUMN IF NOT EXISTS target_audience text;
ALTER TABLE creative_history ADD COLUMN IF NOT EXISTS visual_style text DEFAULT 'modern';
ALTER TABLE creative_history ADD COLUMN IF NOT EXISTS color_palette text DEFAULT 'vibrant';
ALTER TABLE creative_history ADD COLUMN IF NOT EXISTS typography text DEFAULT 'sans-serif';
ALTER TABLE creative_history ADD COLUMN IF NOT EXISTS main_text text;
ALTER TABLE creative_history ADD COLUMN IF NOT EXISTS secondary_text text;
ALTER TABLE creative_history ADD COLUMN IF NOT EXISTS call_to_action text;
ALTER TABLE creative_history ADD COLUMN IF NOT EXISTS tone text DEFAULT 'professional';
ALTER TABLE creative_history ADD COLUMN IF NOT EXISTS config jsonb DEFAULT '{}'::jsonb;
ALTER TABLE creative_history ADD COLUMN IF NOT EXISTS is_favorite boolean DEFAULT false;
ALTER TABLE creative_history ADD COLUMN IF NOT EXISTS tags text[] DEFAULT ARRAY[]::text[];