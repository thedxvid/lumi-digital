-- Add new columns for Lumi plan carousel image tracking and API tier
ALTER TABLE public.usage_limits 
ADD COLUMN IF NOT EXISTS carousel_images_monthly_limit INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS carousel_images_monthly_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS api_tier TEXT DEFAULT 'standard';

-- Add comment for documentation
COMMENT ON COLUMN public.usage_limits.carousel_images_monthly_limit IS 'Monthly limit of carousel images for lumi plan (counts total images, not carousels)';
COMMENT ON COLUMN public.usage_limits.carousel_images_monthly_used IS 'Monthly used carousel images for lumi plan';
COMMENT ON COLUMN public.usage_limits.api_tier IS 'API tier: standard (Lovable AI Gateway) or pro (Fal.ai Nano Banana PRO)';

-- Update reset_monthly_limits function to include new field
CREATE OR REPLACE FUNCTION public.reset_monthly_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.usage_limits
  SET 
    creative_images_monthly_used = 0,
    carousels_monthly_used = 0,
    carousel_images_monthly_used = 0,
    videos_monthly_used = 0,
    video_credits = 0,
    video_credits_used = 0,
    last_monthly_reset = NOW()
  WHERE last_monthly_reset < NOW() - INTERVAL '1 month';
END;
$$;