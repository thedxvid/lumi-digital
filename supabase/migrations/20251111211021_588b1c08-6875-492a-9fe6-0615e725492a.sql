-- Create table for video generation history
CREATE TABLE IF NOT EXISTS public.video_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  video_url TEXT NOT NULL,
  aspect_ratio TEXT,
  duration TEXT,
  resolution TEXT,
  has_audio BOOLEAN DEFAULT true,
  is_favorite BOOLEAN DEFAULT false,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_video_history_user_id ON public.video_history(user_id);
CREATE INDEX IF NOT EXISTS idx_video_history_created_at ON public.video_history(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.video_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own video history"
  ON public.video_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own video history"
  ON public.video_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own video history"
  ON public.video_history FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own video history"
  ON public.video_history FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_video_history_updated_at
  BEFORE UPDATE ON public.video_history
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();