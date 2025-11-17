-- Adicionar campos de vídeos grátis vitalícios
ALTER TABLE public.usage_limits
ADD COLUMN IF NOT EXISTS sora_text_videos_lifetime_limit INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS sora_text_videos_lifetime_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS kling_image_videos_lifetime_limit INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS kling_image_videos_lifetime_used INTEGER DEFAULT 0;

-- Atualizar todos os usuários existentes com os novos limites gratuitos
UPDATE public.usage_limits
SET 
  sora_text_videos_lifetime_limit = 2,
  sora_text_videos_lifetime_used = 0,
  kling_image_videos_lifetime_limit = 1,
  kling_image_videos_lifetime_used = 0
WHERE sora_text_videos_lifetime_limit IS NULL;

COMMENT ON COLUMN public.usage_limits.sora_text_videos_lifetime_limit IS 'Limite vitalício de vídeos Sora text-to-video grátis';
COMMENT ON COLUMN public.usage_limits.sora_text_videos_lifetime_used IS 'Vídeos Sora text-to-video grátis já usados';
COMMENT ON COLUMN public.usage_limits.kling_image_videos_lifetime_limit IS 'Limite vitalício de vídeos Kling image-to-video grátis';
COMMENT ON COLUMN public.usage_limits.kling_image_videos_lifetime_used IS 'Vídeos Kling image-to-video grátis já usados';