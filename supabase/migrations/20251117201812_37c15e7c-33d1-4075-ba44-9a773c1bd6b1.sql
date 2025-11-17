-- Add thumbnail_url column to video_history table
ALTER TABLE public.video_history 
ADD COLUMN IF NOT EXISTS thumbnail_url text;

-- Add index for faster queries on created_at (for pagination)
CREATE INDEX IF NOT EXISTS idx_video_history_created_at 
ON public.video_history(user_id, created_at DESC);