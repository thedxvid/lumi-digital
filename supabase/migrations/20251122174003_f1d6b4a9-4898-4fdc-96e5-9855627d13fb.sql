-- Remover colunas de limites Sora da tabela usage_limits
ALTER TABLE usage_limits 
DROP COLUMN IF EXISTS sora_text_videos_lifetime_limit,
DROP COLUMN IF EXISTS sora_text_videos_lifetime_used;

-- Comentário: Esta migração remove os campos de limites do Sora 2
-- Dados históricos de uso de Sora serão perdidos