-- Fase 1: Adicionar novos campos para vídeos vitalícios por tipo
ALTER TABLE public.usage_limits
ADD COLUMN IF NOT EXISTS sora_text_videos_lifetime_limit INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS sora_text_videos_lifetime_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS kling_image_videos_lifetime_limit INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS kling_image_videos_lifetime_used INTEGER DEFAULT 0;

-- Adicionar comentários para documentação
COMMENT ON COLUMN public.usage_limits.sora_text_videos_lifetime_limit IS 'Limite vitalício de vídeos Sora text-to-video grátis';
COMMENT ON COLUMN public.usage_limits.sora_text_videos_lifetime_used IS 'Vídeos Sora text-to-video já usados (vitalício)';
COMMENT ON COLUMN public.usage_limits.kling_image_videos_lifetime_limit IS 'Limite vitalício de vídeos Kling image-to-video grátis';
COMMENT ON COLUMN public.usage_limits.kling_image_videos_lifetime_used IS 'Vídeos Kling image-to-video já usados (vitalício)';

-- Atualizar todos os usuários existentes com os novos limites gratuitos
UPDATE public.usage_limits
SET 
  sora_text_videos_lifetime_limit = 2,
  sora_text_videos_lifetime_used = 0,
  kling_image_videos_lifetime_limit = 1,
  kling_image_videos_lifetime_used = 0
WHERE plan_type = 'basic';

-- Migrar usuários PRO/PRO_ADVANCED para básico mantendo progresso
UPDATE public.usage_limits
SET 
  plan_type = 'basic',
  sora_text_videos_lifetime_limit = 2,
  sora_text_videos_lifetime_used = LEAST(videos_monthly_used, 2),
  kling_image_videos_lifetime_limit = 1,
  kling_image_videos_lifetime_used = 0
WHERE plan_type IN ('pro', 'pro_advanced');

-- Desativar subscriptions antigas de PRO/PRO_ADVANCED
UPDATE public.subscriptions
SET is_active = false
WHERE plan_type IN ('pro', 'pro_advanced');

-- Remover função que não é mais necessária
DROP FUNCTION IF EXISTS public.get_video_model_for_plan(text);