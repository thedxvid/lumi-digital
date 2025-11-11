-- Create carousel_history table for storing generated image carousels
CREATE TABLE public.carousel_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  image_count INTEGER NOT NULL DEFAULT 3,
  images JSONB NOT NULL, -- Array of {url: string, description: string}
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.carousel_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own carousels
CREATE POLICY "Users can view their own carousels"
ON public.carousel_history
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own carousels
CREATE POLICY "Users can create their own carousels"
ON public.carousel_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own carousels
CREATE POLICY "Users can delete their own carousels"
ON public.carousel_history
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_carousel_history_user_created ON public.carousel_history(user_id, created_at DESC);