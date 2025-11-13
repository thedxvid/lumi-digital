-- Adicionar coluna api_used à tabela video_history
ALTER TABLE video_history 
ADD COLUMN api_used TEXT DEFAULT 'fal_veo3_fast';

-- Criar índice para melhorar performance de queries por API
CREATE INDEX idx_video_history_api_used ON video_history(api_used);

-- Adicionar comentário para documentação
COMMENT ON COLUMN video_history.api_used IS 'API provider used for video generation (e.g., fal_veo3_fast, fal_veo31, fal_hunyuan, fal_wan_fast)';