-- Adicionar colunas Sora na tabela usage_limits
ALTER TABLE public.usage_limits
ADD COLUMN IF NOT EXISTS sora_text_videos_lifetime_limit INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sora_text_videos_lifetime_used INTEGER DEFAULT 0;

-- Atualizar usuários existentes com valores padrão
UPDATE public.usage_limits
SET sora_text_videos_lifetime_limit = 0,
    sora_text_videos_lifetime_used = 0
WHERE sora_text_videos_lifetime_limit IS NULL;